package edu.cit.clyra.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(
        @NotNull(message = "active is required")
        Boolean active
) {
}
