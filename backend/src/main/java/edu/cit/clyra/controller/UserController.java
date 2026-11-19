package edu.cit.clyra.controller;

import edu.cit.clyra.dto.UserResponse;
import edu.cit.clyra.exception.ApiException;
import edu.cit.clyra.model.AuthenticatedUser;
import edu.cit.clyra.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
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

    /** DOCTOR only (enforced in SecurityConfig): the doctor's own profile. */
    @GetMapping("/doctor/me")
    public UserResponse doctorMe(@AuthenticationPrincipal AuthenticatedUser user) {
        return me(user);
    }
}
