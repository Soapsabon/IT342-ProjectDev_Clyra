package edu.cit.clyra.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Change password for the signed-in user. The current password is verified server-side. */
public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required")
        String currentPassword,

        @NotBlank(message = "New password is required")
        @Pattern(regexp = ValidationPatterns.PASSWORD,
                message = "Password must be 8-64 characters with upper and lower case letters, a number and a symbol")
        String newPassword,

        @NotBlank(message = "Please confirm the new password")
        String confirmPassword
) {

    @AssertTrue(message = "New password and confirmation do not match")
    public boolean isPasswordConfirmed() {
        // Blank values are reported by @NotBlank above, so do not add a second error for them.
        return newPassword == null || confirmPassword == null || newPassword.equals(confirmPassword);
    }
}
