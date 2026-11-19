package edu.cit.clyra.model;

/** Principal placed in the Spring SecurityContext after the Firebase ID token is verified. */
public record AuthenticatedUser(String uid, String email, Role role) {
}
