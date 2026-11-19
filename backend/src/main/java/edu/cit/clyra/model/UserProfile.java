package edu.cit.clyra.model;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;

import java.time.Instant;

/** A document of the Firestore "users" collection (document id = Firebase Auth UID). */
public record UserProfile(
        String uid,
        String fullName,
        String email,
        String phoneNumber,
        Role role,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {

    public static UserProfile fromSnapshot(DocumentSnapshot doc) {
        String roleValue = doc.getString("role");
        Role role;
        try {
            role = roleValue == null ? null : Role.valueOf(roleValue);
        } catch (IllegalArgumentException ex) {
            role = null; // unknown role stored -> treated as no access by the security filter
        }
        Boolean active = doc.getBoolean("isActive");
        return new UserProfile(
                doc.getId(),
                doc.getString("fullName"),
                doc.getString("email"),
                doc.getString("phoneNumber"),
                role,
                active != null && active,
                toInstant(doc.getTimestamp("createdAt")),
                toInstant(doc.getTimestamp("updatedAt"))
        );
    }

    private static Instant toInstant(Timestamp ts) {
        return ts == null ? null : ts.toDate().toInstant();
    }
}
