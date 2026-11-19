package edu.cit.clyra.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Initialises the Firebase Admin SDK with the service account that lives ONLY on the server
 * (never in the frontend, never in git).
 */
@Configuration
@Profile("!test")
public class FirebaseConfig {

    @Value("${clyra.firebase.credentials-path:}")
    private String credentialsPath;

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }
        GoogleCredentials credentials;
        if (credentialsPath == null || credentialsPath.isBlank()) {
            try {
                credentials = GoogleCredentials.getApplicationDefault();
            } catch (IOException ex) {
                throw new IllegalStateException(
                        "Firebase credentials not configured. Set FIREBASE_CREDENTIALS_PATH in backend/.env "
                                + "to the path of your service account JSON (see README).", ex);
            }
        } else {
            Path path = Path.of(credentialsPath);
            if (!Files.isReadable(path)) {
                throw new IllegalStateException("FIREBASE_CREDENTIALS_PATH points to a file that does not exist "
                        + "or is not readable: " + path.toAbsolutePath());
            }
            try (InputStream in = new FileInputStream(path.toFile())) {
                credentials = GoogleCredentials.fromStream(in);
            }
        }
        FirebaseOptions options = FirebaseOptions.builder().setCredentials(credentials).build();
        return FirebaseApp.initializeApp(options);
    }

    @Bean
    public FirebaseAuth firebaseAuth(FirebaseApp app) {
        return FirebaseAuth.getInstance(app);
    }

    @Bean
    public Firestore firestore(FirebaseApp app) {
        return FirestoreClient.getFirestore(app);
    }
}
