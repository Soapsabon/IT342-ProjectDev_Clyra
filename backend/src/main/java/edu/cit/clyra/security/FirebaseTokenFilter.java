package edu.cit.clyra.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import edu.cit.clyra.exception.ApiException;
import edu.cit.clyra.model.AuthenticatedUser;
import edu.cit.clyra.model.UserProfile;
import edu.cit.clyra.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Verifies the Firebase ID token from "Authorization: Bearer &lt;token&gt;", then loads the
 * user's role from Firestore (the trusted source - never from the client).
 *
 * <ul>
 *   <li>no token / invalid / expired / revoked token -> left unauthenticated (401 by the entry point)</li>
 *   <li>valid token but no profile, unknown role or deactivated account -> 403</li>
 * </ul>
 */
public class FirebaseTokenFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(FirebaseTokenFilter.class);
    private static final String PREFIX = "Bearer ";

    private final FirebaseAuth firebaseAuth;
    private final UserService userService;

    public FirebaseTokenFilter(FirebaseAuth firebaseAuth, UserService userService) {
        this.firebaseAuth = firebaseAuth;
        this.userService = userService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith(PREFIX)) {
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(PREFIX.length()).trim();
        FirebaseToken decoded;
        try {
            // checkRevoked = true -> tokens are rejected after logout/revokeRefreshTokens or account disable
            decoded = firebaseAuth.verifyIdToken(token, true);
        } catch (FirebaseAuthException | IllegalArgumentException ex) {
            log.debug("Rejected ID token: {}", ex.getMessage());
            chain.doFilter(request, response); // stays unauthenticated -> 401
            return;
        }

        Optional<UserProfile> profile;
        try {
            profile = userService.findByUid(decoded.getUid());
        } catch (ApiException ex) {
            SecurityErrorWriter.write(response, ex.getStatus().value(), ex.getStatus().getReasonPhrase(), ex.getMessage());
            return;
        }

        if (profile.isEmpty() || profile.get().role() == null) {
            SecurityErrorWriter.write(response, 403, "Forbidden",
                    "No Clyra profile or role is assigned to this account.");
            return;
        }
        if (!profile.get().active()) {
            SecurityErrorWriter.write(response, 403, "Forbidden", "This account has been deactivated.");
            return;
        }

        UserProfile p = profile.get();
        AuthenticatedUser principal = new AuthenticatedUser(p.uid(), p.email(), p.role());
        var authentication = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + p.role().name())));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        chain.doFilter(request, response);
    }
}
