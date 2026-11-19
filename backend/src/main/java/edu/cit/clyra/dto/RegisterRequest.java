package edu.cit.clyra.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Public patient registration. There is deliberately NO role field: the backend always
 * assigns PATIENT, so a client can never request a privileged role.
 */
public record RegisterRequest(
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 100, message = "Full name must be 2-100 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        String email,

        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = ValidationPatterns.PHONE, message = "Enter a valid PH mobile number (e.g. 09123456789)")
        String phoneNumber,

        @NotBlank(message = "Password is required")
        @Pattern(regexp = ValidationPatterns.PASSWORD,
                message = "Password must be 8-64 characters with upper and lower case letters, a number and a symbol")
        String password
) {
}
