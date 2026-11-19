package edu.cit.clyra.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;

import java.io.IOException;

/** JSON 401 / 403 responses for the security filter chain. */
public final class RestSecurityHandlers {

    private RestSecurityHandlers() {
    }

    /** Missing or invalid authentication -> HTTP 401. */
    public static class Unauthorized implements AuthenticationEntryPoint {
        @Override
        public void commence(HttpServletRequest request, HttpServletResponse response,
                             AuthenticationException authException) throws IOException {
            SecurityErrorWriter.write(response, 401, "Unauthorized",
                    "Authentication is required. Please sign in again.");
        }
    }

    /** Authenticated but not allowed -> HTTP 403. */
    public static class Forbidden implements AccessDeniedHandler {
        @Override
        public void handle(HttpServletRequest request, HttpServletResponse response,
                           AccessDeniedException ex) throws IOException {
            SecurityErrorWriter.write(response, 403, "Forbidden",
                    "You do not have permission to access this resource.");
        }
    }
}
