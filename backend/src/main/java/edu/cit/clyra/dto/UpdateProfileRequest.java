package edu.cit.clyra.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Editable profile fields. There is deliberately NO uid, email or role field: the target account
 * always comes from the verified token, and email/role can never be changed through this endpoint.
 */
public record UpdateProfileRequest(
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 100, message = "Full name must be 2-100 characters")
        String fullName,

        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = ValidationPatterns.PHONE, message = "Enter a valid PH mobile number (e.g. 09123456789)")
        String phoneNumber
) {
}
