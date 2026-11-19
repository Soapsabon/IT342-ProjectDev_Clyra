package edu.cit.clyra.controller;

import edu.cit.clyra.dto.CreateUserRequest;
import edu.cit.clyra.dto.UpdateRoleRequest;
import edu.cit.clyra.dto.UpdateStatusRequest;
import edu.cit.clyra.dto.UserResponse;
import edu.cit.clyra.model.AuthenticatedUser;
import edu.cit.clyra.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** STAFF only - enforced by SecurityConfig (/api/admin/** requires ROLE_STAFF). */
@RestController
@RequestMapping("/api/admin/users")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserResponse> list() {
        return userService.listUsers().stream().map(UserResponse::from).toList();
    }

    /** Provision a DOCTOR / STAFF (or PATIENT) account. */
    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        var profile = userService.provisionAccount(request.fullName(), request.email(),
                request.phoneNumber(), request.password(), request.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(profile));
    }

    @PatchMapping("/{uid}/role")
    public UserResponse changeRole(@AuthenticationPrincipal AuthenticatedUser actor,
                                   @PathVariable String uid,
                                   @Valid @RequestBody UpdateRoleRequest request) {
        return UserResponse.from(userService.changeRole(actor.uid(), uid, request.role()));
    }

    @PatchMapping("/{uid}/status")
    public UserResponse changeStatus(@AuthenticationPrincipal AuthenticatedUser actor,
                                     @PathVariable String uid,
                                     @Valid @RequestBody UpdateStatusRequest request) {
        return UserResponse.from(userService.setActive(actor.uid(), uid, request.active()));
    }
}
