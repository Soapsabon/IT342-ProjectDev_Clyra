package edu.cit.clyra.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.auth.AuthErrorCode;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import edu.cit.clyra.exception.ApiException;
import edu.cit.clyra.model.Role;
import edu.cit.clyra.model.UserProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

/**
 * All account logic. Firebase Authentication holds the credentials (passwords are hashed
 * by Firebase, never stored by us); Firestore "users/{uid}" holds the profile and role.
 * Only this backend (Admin SDK) can write to Firestore - client writes are blocked by firestore.rules.
 */
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    static final String USERS = "users";

    private final Firestore firestore;
    private final FirebaseAuth firebaseAuth;
    private final FirebasePasswordVerifier passwordVerifier;

    public UserService(Firestore firestore, FirebaseAuth firebaseAuth, FirebasePasswordVerifier passwordVerifier) {
        this.firestore = firestore;
        this.firebaseAuth = firebaseAuth;
        this.passwordVerifier = passwordVerifier;
    }

    // ---------------------------------------------------------------- reads

    public Optional<UserProfile> findByUid(String uid) {
        DocumentSnapshot snap = await(users().document(uid).get());
        return snap.exists() ? Optional.of(UserProfile.fromSnapshot(snap)) : Optional.empty();
    }

    public List<UserProfile> listUsers() {
        QuerySnapshot snap = await(users().get());
        return snap.getDocuments().stream()
                .map(UserProfile::fromSnapshot)
                .sorted(Comparator.comparing(UserProfile::createdAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    // ---------------------------------------------------------------- account creation

    /** Public registration: the role is ALWAYS PATIENT. */
    public UserProfile registerPatient(String fullName, String email, String phoneNumber, String password) {
        return createAccount(fullName, email, phoneNumber, password, Role.PATIENT);
    }

    /** Staff-only provisioning of any role (used for DOCTOR and STAFF accounts). */
    public UserProfile provisionAccount(String fullName, String email, String phoneNumber, String password, Role role) {
        return createAccount(fullName, email, phoneNumber, password, role);
    }

    private UserProfile createAccount(String fullName, String email, String phoneNumber, String password, Role role) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        String name = fullName.trim();

        UserRecord record;
        try {
            record = firebaseAuth.createUser(new UserRecord.CreateRequest()
                    .setEmail(normalizedEmail)
                    .setPassword(password)
                    .setDisplayName(name)
                    .setDisabled(false));
        } catch (FirebaseAuthException ex) {
            if (ex.getAuthErrorCode() == AuthErrorCode.EMAIL_ALREADY_EXISTS) {
                throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
            }
            log.error("Firebase createUser failed: {}", ex.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not create the account. Please try again.", ex);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("uid", record.getUid());
        data.put("fullName", name);
        data.put("email", normalizedEmail);
        data.put("phoneNumber", phoneNumber.trim());
        data.put("role", role.name());
        data.put("isActive", true);
        data.put("createdAt", FieldValue.serverTimestamp());
        data.put("updatedAt", FieldValue.serverTimestamp());

        try {
            await(users().document(record.getUid()).create(data));
        } catch (RuntimeException ex) {
            // Do not leave an Auth user without a profile behind.
            try {
                firebaseAuth.deleteUser(record.getUid());
            } catch (FirebaseAuthException cleanupEx) {
                log.error("Rollback failed for uid {}: {}", record.getUid(), cleanupEx.getMessage());
            }
            throw ex;
        }

        return findByUid(record.getUid()).orElseThrow(() ->
                new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Account created but profile could not be read."));
    }

    // ---------------------------------------------------------------- admin operations

    public UserProfile changeRole(String actorUid, String targetUid, Role newRole) {
        if (actorUid.equals(targetUid)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot change your own role.");
        }
        requireExisting(targetUid);
        Map<String, Object> update = new HashMap<>();
        update.put("role", newRole.name());
        update.put("updatedAt", FieldValue.serverTimestamp());
        await(users().document(targetUid).update(update));
        return findByUid(targetUid).orElseThrow();
    }

    public UserProfile setActive(String actorUid, String targetUid, boolean active) {
        if (actorUid.equals(targetUid)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot deactivate your own account.");
        }
        requireExisting(targetUid);
        Map<String, Object> update = new HashMap<>();
        update.put("isActive", active);
        update.put("updatedAt", FieldValue.serverTimestamp());
        await(users().document(targetUid).update(update));
        try {
            firebaseAuth.updateUser(new UserRecord.UpdateRequest(targetUid).setDisabled(!active));
            if (!active) {
                firebaseAuth.revokeRefreshTokens(targetUid);
            }
        } catch (FirebaseAuthException ex) {
            log.error("Could not sync disabled flag in Firebase Auth for {}: {}", targetUid, ex.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Profile updated but Firebase Auth sync failed.", ex);
        }
        return findByUid(targetUid).orElseThrow();
    }

    /** Server-side logout: invalidates every refresh token / ID token of the user. */
    public void revokeSessions(String uid) {
        try {
            firebaseAuth.revokeRefreshTokens(uid);
        } catch (FirebaseAuthException ex) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not end the session on the server.", ex);
        }
    }

    // ---------------------------------------------------------------- self-service (Increment 2)

    /**
     * Updates the caller's OWN profile. The uid always comes from the verified token (never from the
     * request), so one user can never modify another user's profile. Email and role are not editable.
     */
    public UserProfile updateProfile(String uid, String fullName, String phoneNumber) {
        requireExisting(uid);
        String name = fullName.trim();
        Map<String, Object> update = new HashMap<>();
        update.put("fullName", name);
        update.put("phoneNumber", phoneNumber.trim());
        update.put("updatedAt", FieldValue.serverTimestamp());
        await(users().document(uid).update(update));
        try {
            firebaseAuth.updateUser(new UserRecord.UpdateRequest(uid).setDisplayName(name));
        } catch (FirebaseAuthException ex) {
            // Firestore is the source of truth for the profile; the Auth display name is only cosmetic.
            log.warn("Could not sync display name in Firebase Auth for {}: {}", uid, ex.getMessage());
        }
        return findByUid(uid).orElseThrow();
    }

    /**
     * Changes the caller's password: verifies the current password, sets the new one (Firebase hashes
     * it) and revokes every refresh token so the old credentials and old sessions stop working.
     */
    public void changePassword(String uid, String currentPassword, String newPassword) {
        UserRecord record;
        try {
            record = firebaseAuth.getUser(uid);
        } catch (FirebaseAuthException ex) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not load your account. Please try again.", ex);
        }
        if (currentPassword.equals(newPassword)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "New password must be different from your current password.");
        }
        if (!passwordVerifier.isPasswordValid(record.getEmail(), currentPassword)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect.");
        }
        try {
            firebaseAuth.updateUser(new UserRecord.UpdateRequest(uid).setPassword(newPassword));
            firebaseAuth.revokeRefreshTokens(uid);
        } catch (FirebaseAuthException ex) {
            log.error("Password change failed for {}: {}", uid, ex.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not change the password. Please try again.", ex);
        }
    }

    // ---------------------------------------------------------------- bootstrap of the first STAFF account

    /**
     * Promotes an EXISTING Firebase Auth user to STAFF, but only while no STAFF account exists.
     * Used once to create the very first administrator (see README).
     */
    public void bootstrapFirstStaff(String email) {
        QuerySnapshot existing = await(users().whereEqualTo("role", Role.STAFF.name()).limit(1).get());
        if (!existing.isEmpty()) {
            log.info("Bootstrap skipped: a STAFF account already exists. You can clear BOOTSTRAP_STAFF_EMAIL.");
            return;
        }
        UserRecord record;
        try {
            record = firebaseAuth.getUserByEmail(email.trim().toLowerCase(Locale.ROOT));
        } catch (FirebaseAuthException ex) {
            log.error("Bootstrap failed: no Firebase Auth user with email {}. Create it in the Firebase console first.", email);
            return;
        }
        DocumentReference ref = users().document(record.getUid());
        DocumentSnapshot snap = await(ref.get());
        if (snap.exists()) {
            Map<String, Object> update = new HashMap<>();
            update.put("role", Role.STAFF.name());
            update.put("isActive", true);
            update.put("updatedAt", FieldValue.serverTimestamp());
            await(ref.update(update));
        } else {
            Map<String, Object> data = new HashMap<>();
            data.put("uid", record.getUid());
            data.put("fullName", record.getDisplayName() != null ? record.getDisplayName() : record.getEmail());
            data.put("email", record.getEmail());
            data.put("phoneNumber", "");
            data.put("role", Role.STAFF.name());
            data.put("isActive", true);
            data.put("createdAt", FieldValue.serverTimestamp());
            data.put("updatedAt", FieldValue.serverTimestamp());
            await(ref.create(data));
        }
        log.warn("Bootstrap complete: {} is now STAFF. Remove BOOTSTRAP_STAFF_EMAIL from your environment.", record.getEmail());
    }

    // ---------------------------------------------------------------- helpers

    private void requireExisting(String uid) {
        if (findByUid(uid).isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "User not found.");
        }
    }

    private com.google.cloud.firestore.CollectionReference users() {
        return firestore.collection(USERS);
    }

    private static <T> T await(ApiFuture<T> future) {
        try {
            return future.get();
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "The database request was interrupted.", ex);
        } catch (ExecutionException ex) {
            log.error("Firestore error: {}", ex.getCause() == null ? ex.getMessage() : ex.getCause().getMessage());
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "The database is temporarily unavailable.", ex);
        }
    }
}
