package edu.cit.clyra.dto;

import edu.cit.clyra.model.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateRoleRequest(
        @NotNull(message = "Role is required (PATIENT, DOCTOR or STAFF)")
        Role role
) {
}
