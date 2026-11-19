package edu.cit.clyra.dto;

import edu.cit.clyra.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Staff-only: provision a DOCTOR or STAFF (or PATIENT) account. */
public record CreateUserRequest(
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 100, message = "Full name must be 2-100 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        String email,

        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = ValidationPatterns.PHONE, message = "Enter a valid PH mobile number (e.g. 09123456789)")
        String phoneNumber,

        @NotBlank(message = "Temporary password is required")
        @Pattern(regexp = ValidationPatterns.PASSWORD,
                message = "Password must be 8-64 characters with upper and lower case letters, a number and a symbol")
        String password,

        @NotNull(message = "Role is required (PATIENT, DOCTOR or STAFF)")
        Role role
) {
}
