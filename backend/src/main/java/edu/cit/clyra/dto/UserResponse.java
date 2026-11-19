package edu.cit.clyra.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import edu.cit.clyra.model.Role;
import edu.cit.clyra.model.UserProfile;

import java.time.Instant;

/** What the API returns about a user. Never contains credentials. */
public record UserResponse(
        String uid,
        String fullName,
        String email,
        String phoneNumber,
        Role role,
        @JsonProperty("isActive") boolean isActive,
        Instant createdAt,
        Instant updatedAt
) {
    public static UserResponse from(UserProfile p) {
        return new UserResponse(p.uid(), p.fullName(), p.email(), p.phoneNumber(),
                p.role(), p.active(), p.createdAt(), p.updatedAt());
    }
}
