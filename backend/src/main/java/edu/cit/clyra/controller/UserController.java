package edu.cit.clyra.controller;

import edu.cit.clyra.dto.ChangePasswordRequest;
import edu.cit.clyra.dto.UpdateProfileRequest;
import edu.cit.clyra.dto.UserResponse;
import edu.cit.clyra.exception.ApiException;
import edu.cit.clyra.model.AuthenticatedUser;
import edu.cit.clyra.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /** Any authenticated, active user: returns their own profile (including the trusted role). */
    @GetMapping("/users/me")
    public UserResponse me(@AuthenticationPrincipal AuthenticatedUser user) {
        return userService.findByUid(user.uid())
                .map(UserResponse::from)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profile not found."));
    }

    /** Any authenticated user: edit OWN profile (full name, phone). The target is the token's uid only. */
    @PatchMapping("/users/me")
    public UserResponse updateMe(@AuthenticationPrincipal AuthenticatedUser user,
                                 @Valid @RequestBody UpdateProfileRequest request) {
        return UserResponse.from(userService.updateProfile(user.uid(), request.fullName(), request.phoneNumber()));
    }

    /** Any authenticated user: change OWN password. Requires the current password. */
    @PostMapping("/users/me/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal AuthenticatedUser user,
                                               @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(user.uid(), request.currentPassword(), request.newPassword());
        return ResponseEntity.noContent().build();
    }

    /** DOCTOR only (enforced in SecurityConfig): the doctor's own profile. */
    @GetMapping("/doctor/me")
    public UserResponse doctorMe(@AuthenticationPrincipal AuthenticatedUser user) {
        return me(user);
    }
}
