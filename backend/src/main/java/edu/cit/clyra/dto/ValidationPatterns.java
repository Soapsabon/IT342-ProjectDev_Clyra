package edu.cit.clyra.dto;

/** Shared validation regexes (mirrored in frontend/src/utils/validators.js). */
public final class ValidationPatterns {
    public static final String PHONE = "^(\\+63|0)9\\d{9}$";
    public static final String PASSWORD = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,64}$";

    private ValidationPatterns() {
    }
}
