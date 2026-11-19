package edu.cit.clyra;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import edu.cit.clyra.model.Role;
import edu.cit.clyra.model.UserProfile;
import edu.cit.clyra.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies the REAL Spring Security chain + token filter + controllers. Only the external
 * Firebase services (token verification, Firestore access) are replaced with mocks, because a
 * unit test cannot reach a live Firebase project.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityIntegrationTest {

    @Autowired MockMvc mvc;
    @MockBean FirebaseAuth firebaseAuth;
    @MockBean Firestore firestore;
    @MockBean UserService userService;

    @BeforeEach
    void setUp() throws Exception {
        tokenFor("patient-token", "patient-uid", Role.PATIENT, true);
        tokenFor("doctor-token", "doctor-uid", Role.DOCTOR, true);
        tokenFor("staff-token", "staff-uid", Role.STAFF, true);
        tokenFor("inactive-token", "inactive-uid", Role.PATIENT, false);

        FirebaseToken orphan = mock(FirebaseToken.class);
        when(orphan.getUid()).thenReturn("orphan-uid");
        when(firebaseAuth.verifyIdToken("orphan-token", true)).thenReturn(orphan);
        when(userService.findByUid("orphan-uid")).thenReturn(Optional.empty());

        FirebaseAuthException bad = mock(FirebaseAuthException.class);
        when(bad.getMessage()).thenReturn("invalid token");
        when(firebaseAuth.verifyIdToken("bad-token", true)).thenThrow(bad);
    }

    private void tokenFor(String token, String uid, Role role, boolean active) throws Exception {
        FirebaseToken decoded = mock(FirebaseToken.class);
        when(decoded.getUid()).thenReturn(uid);
        when(firebaseAuth.verifyIdToken(token, true)).thenReturn(decoded);
        UserProfile profile = new UserProfile(uid, "Test " + role, uid + "@example.com", "09123456789",
                role, active, Instant.now(), Instant.now());
        when(userService.findByUid(uid)).thenReturn(Optional.of(profile));
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    // ------------------------------------------------------------ 401

    @Test
    void missingToken_isRejectedWith401() throws Exception {
        mvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void invalidToken_isRejectedWith401() throws Exception {
        mvc.perform(get("/api/users/me").header("Authorization", bearer("bad-token")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminEndpointWithoutToken_is401() throws Exception {
        mvc.perform(get("/api/admin/users")).andExpect(status().isUnauthorized());
    }

    // ------------------------------------------------------------ /me returns the trusted role

    @Test
    void patientCanReadOwnProfile() throws Exception {
        mvc.perform(get("/api/users/me").header("Authorization", bearer("patient-token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("PATIENT"))
                .andExpect(jsonPath("$.uid").value("patient-uid"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void staffAndDoctorReceiveTheirOwnRoles() throws Exception {
        mvc.perform(get("/api/users/me").header("Authorization", bearer("staff-token")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("STAFF"));
        mvc.perform(get("/api/users/me").header("Authorization", bearer("doctor-token")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("DOCTOR"));
    }

    // ------------------------------------------------------------ 403

    @Test
    void validTokenWithoutProfile_is403() throws Exception {
        mvc.perform(get("/api/users/me").header("Authorization", bearer("orphan-token")))
                .andExpect(status().isForbidden());
    }

    @Test
    void deactivatedAccount_is403() throws Exception {
        mvc.perform(get("/api/users/me").header("Authorization", bearer("inactive-token")))
                .andExpect(status().isForbidden());
    }

    @Test
    void patientCannotAccessAdminEndpoints() throws Exception {
        mvc.perform(get("/api/admin/users").header("Authorization", bearer("patient-token")))
                .andExpect(status().isForbidden());
        mvc.perform(patch("/api/admin/users/someone/role").header("Authorization", bearer("patient-token"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"STAFF\"}"))
                .andExpect(status().isForbidden());
        verify(userService, never()).changeRole(anyString(), anyString(), eq(Role.STAFF));
    }

    @Test
    void patientCannotPromoteThemselves() throws Exception {
        mvc.perform(patch("/api/admin/users/patient-uid/role").header("Authorization", bearer("patient-token"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"STAFF\"}"))
                .andExpect(status().isForbidden());
        verify(userService, never()).changeRole(anyString(), anyString(), eq(Role.STAFF));
    }

    @Test
    void doctorCannotAccessAdminEndpoints() throws Exception {
        mvc.perform(get("/api/admin/users").header("Authorization", bearer("doctor-token")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/admin/users").header("Authorization", bearer("doctor-token"))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void patientAndStaffCannotAccessDoctorOnlyEndpoint() throws Exception {
        mvc.perform(get("/api/doctor/me").header("Authorization", bearer("patient-token")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/doctor/me").header("Authorization", bearer("staff-token")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/doctor/me").header("Authorization", bearer("doctor-token")))
                .andExpect(status().isOk());
    }

    // ------------------------------------------------------------ STAFF allowed

    @Test
    void staffCanListUsers() throws Exception {
        UserProfile p = new UserProfile("u1", "Juan", "juan@example.com", "09123456789",
                Role.PATIENT, true, Instant.now(), Instant.now());
        when(userService.listUsers()).thenReturn(List.of(p));
        mvc.perform(get("/api/admin/users").header("Authorization", bearer("staff-token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("juan@example.com"));
    }

    @Test
    void staffCanChangeRole_andInvalidRoleIs400() throws Exception {
        UserProfile updated = new UserProfile("u1", "Juan", "juan@example.com", "09123456789",
                Role.DOCTOR, true, Instant.now(), Instant.now());
        when(userService.changeRole("staff-uid", "u1", Role.DOCTOR)).thenReturn(updated);

        mvc.perform(patch("/api/admin/users/u1/role").header("Authorization", bearer("staff-token"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"DOCTOR\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("DOCTOR"));

        mvc.perform(patch("/api/admin/users/u1/role").header("Authorization", bearer("staff-token"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"SUPERADMIN\"}"))
                .andExpect(status().isBadRequest());
    }

    // ------------------------------------------------------------ registration

    @Test
    void register_isPublic_andAlwaysCreatesPatient() throws Exception {
        UserProfile created = new UserProfile("new-uid", "Juan Dela Cruz", "juan@example.com", "09123456789",
                Role.PATIENT, true, Instant.now(), Instant.now());
        when(userService.registerPatient("Juan Dela Cruz", "juan@example.com", "09123456789", "Str0ng!Pass"))
                .thenReturn(created);

        // A malicious client tries to smuggle a role - the DTO has no role field, so it is ignored.
        String body = """
                {"fullName":"Juan Dela Cruz","email":"juan@example.com","phoneNumber":"09123456789",
                 "password":"Str0ng!Pass","role":"STAFF"}""";
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("PATIENT"));
        verify(userService).registerPatient("Juan Dela Cruz", "juan@example.com", "09123456789", "Str0ng!Pass");
        verify(userService, never()).provisionAccount(anyString(), anyString(), anyString(), anyString(), eq(Role.STAFF));
    }

    @Test
    void register_rejectsEmptyWeakAndInvalidInput() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.fullName").exists())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.phoneNumber").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());

        String weak = """
                {"fullName":"Juan","email":"not-an-email","phoneNumber":"123","password":"weak"}""";
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(weak))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.phoneNumber").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    @Test
    void register_duplicateEmailMapsTo409() throws Exception {
        when(userService.registerPatient(anyString(), anyString(), anyString(), anyString()))
                .thenThrow(new edu.cit.clyra.exception.ApiException(
                        org.springframework.http.HttpStatus.CONFLICT, "An account with this email already exists."));
        String body = """
                {"fullName":"Juan Dela Cruz","email":"juan@example.com","phoneNumber":"09123456789","password":"Str0ng!Pass"}""";
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void logout_requiresAuthentication_andRevokesSessions() throws Exception {
        mvc.perform(post("/api/auth/logout")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/logout").header("Authorization", bearer("patient-token")))
                .andExpect(status().isNoContent());
        verify(userService).revokeSessions("patient-uid");
    }

    @Test
    void unknownApiPath_isNotOpen() throws Exception {
        mvc.perform(get("/api/does-not-exist")).andExpect(status().isUnauthorized());
        mvc.perform(get("/not-api")).andExpect(status().isUnauthorized());
    }
}
