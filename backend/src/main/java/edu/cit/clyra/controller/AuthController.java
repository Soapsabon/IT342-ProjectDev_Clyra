package edu.cit.clyra.controller;

import edu.cit.clyra.dto.RegisterRequest;
import edu.cit.clyra.dto.UserResponse;
import edu.cit.clyra.model.AuthenticatedUser;
import edu.cit.clyra.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    /** Public. Creates a Firebase Auth user + Firestore profile with the PATIENT role (always). */
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        var profile = userService.registerPatient(
                request.fullName(), request.email(), request.phoneNumber(), request.password());
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(profile));
    }

    /** Authenticated. Revokes the caller's Firebase refresh tokens (server-side logout). */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal AuthenticatedUser user) {
        userService.revokeSessions(user.uid());
        return ResponseEntity.noContent().build();
    }
}
