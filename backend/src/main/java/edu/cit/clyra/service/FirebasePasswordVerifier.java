package edu.cit.clyra.service;

import edu.cit.clyra.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

/**
 * Verifies a user's CURRENT password against Firebase Authentication (the Admin SDK cannot do this).
 * The password is only forwarded to Google's Identity Toolkit over HTTPS and is never logged or stored.
 */
@Component
public class FirebasePasswordVerifier {

    private static final Logger log = LoggerFactory.getLogger(FirebasePasswordVerifier.class);
    private static final String URL =
            "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={key}";

    private final RestClient client = RestClient.create();
    private final String apiKey;

    public FirebasePasswordVerifier(@Value("${clyra.firebase.web-api-key:}") String apiKey) {
        this.apiKey = apiKey;
    }

    /** true = password is correct; false = wrong password (or Firebase rejected the attempt). */
    public boolean isPasswordValid(String email, String password) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Password verification is not configured on the server (set FIREBASE_WEB_API_KEY).");
        }
        try {
            client.post()
                    .uri(URL, apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("email", email, "password", password, "returnSecureToken", false))
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (HttpClientErrorException.BadRequest ex) {
            return false; // INVALID_PASSWORD / INVALID_LOGIN_CREDENTIALS / TOO_MANY_ATTEMPTS_TRY_LATER
        } catch (RestClientException ex) {
            log.error("Firebase password check failed: {}", ex.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "Could not verify your password right now. Please try again.", ex);
        }
    }
}
