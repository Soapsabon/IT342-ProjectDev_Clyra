package edu.cit.clyra.config;

import edu.cit.clyra.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Optional one-time helper to create the FIRST staff/admin account securely, because public
 * registration can never create one. Set BOOTSTRAP_STAFF_EMAIL to the email of a user you
 * created in the Firebase console, start the backend once, then remove the variable.
 */
@Component
public class BootstrapStaffRunner implements ApplicationRunner {

    private final UserService userService;

    @Value("${clyra.bootstrap.staff-email:}")
    private String staffEmail;

    public BootstrapStaffRunner(UserService userService) {
        this.userService = userService;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (staffEmail != null && !staffEmail.isBlank()) {
            userService.bootstrapFirstStaff(staffEmail);
        }
    }
}
