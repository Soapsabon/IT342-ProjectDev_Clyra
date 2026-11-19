# Clyra – Clinic Appointment Management System

**Project Increment 1: User Accounts and Authentication**

Clyra is a web-based platform for clinic appointment scheduling. This increment implements only
patient registration, login/logout, role-based dashboards and the security around them.
Appointment booking, doctor availability, SMS notifications and Google Calendar are **future increments**.

| Layer | Technology |
|---|---|
| Frontend | React (Vite), JavaScript, React Router, Firebase JS SDK |
| Backend | Java 21, Spring Boot 3, Spring Security, Maven, Firebase Admin SDK |
| Auth + Database | Firebase Authentication, Cloud Firestore |

## How it works

```
Browser (React) ──sign in──▶ Firebase Authentication  (checks the password, returns an ID token)
      │
      └─ Authorization: Bearer <ID token> ─▶ Spring Boot API
                                               1. verifies the token with the Firebase Admin SDK
                                               2. reads users/{uid} in Firestore  (the TRUSTED role)
                                               3. allows / rejects (401 / 403) by role
```

* **Registration** (`POST /api/auth/register`) is done by the backend: it creates the Firebase Auth user and the
  Firestore profile and **always assigns `PATIENT`**. The request has no role field, so nobody can self-assign Doctor/Staff.
* **Roles** live only in Firestore `users/{uid}`. `firestore.rules` blocks every client-side write, so a patient
  cannot edit their own role. Only the backend (Admin SDK) writes.
* **Doctors and staff** are provisioned by a STAFF user (Staff Dashboard → User Management).
* **Logout** calls `POST /api/auth/logout` (revokes the user's refresh tokens on the server), then signs out of Firebase
  and clears the app state. Because the backend verifies tokens with revocation checking, old tokens stop working.

### API

| Method & path | Who | Purpose |
|---|---|---|
| `POST /api/auth/register` | public | Create a patient account |
| `POST /api/auth/logout` | any signed-in user | Revoke sessions on the server |
| `GET /api/users/me` | any signed-in, active user | Own profile + trusted role |
| `GET /api/doctor/me` | DOCTOR only | Doctor's own profile |
| `GET /api/admin/users` | STAFF only | List accounts |
| `POST /api/admin/users` | STAFF only | Create a Doctor/Staff/Patient account |
| `PATCH /api/admin/users/{uid}/role` | STAFF only | Change a role (not your own) |
| `PATCH /api/admin/users/{uid}/status` | STAFF only | Activate / deactivate (not yourself) |

Missing/invalid token → **401**. Valid token but wrong role, no profile, or deactivated account → **403**.

> I did not add `POST /api/auth/login`: Firebase alone authenticates credentials, and `GET /api/users/me` already
> returns the profile/role after sign-in, so a login endpoint would be redundant.

## Project structure

```
clyra/
├── frontend/                       React app
│   ├── src/{components,pages,layouts,services,contexts,routes,firebase,styles,utils}
│   ├── .env.example
│   └── package.json
├── backend/                        Spring Boot app
│   ├── src/main/java/edu/cit/clyra/{config,controller,service,security,model,dto,exception}
│   ├── src/test/java/edu/cit/clyra/SecurityIntegrationTest.java
│   ├── src/main/resources/application.properties
│   ├── .env.example
│   └── pom.xml
├── firestore.rules                 Firestore security rules
├── firebase.json
├── .gitignore
└── README.md
```

## Setup (step by step, VS Code)

### 0. Install prerequisites
* [Node.js 20+](https://nodejs.org), [JDK 21](https://adoptium.net) and [Maven 3.9+](https://maven.apache.org/download.cgi) (or use the Maven bundled with the VS Code "Extension Pack for Java")
* [Git](https://git-scm.com)

Check in a terminal: `node -v`, `java -version`, `mvn -v`.

### 1. Create the Firebase project
1. Go to <https://console.firebase.google.com> → **Add project** → name it (e.g. `clyra`).
2. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable → Save.**
3. **Build → Firestore Database → Create database** → choose a location → start in **production mode**.
4. **Firestore → Rules** tab → paste the contents of `firestore.rules` → **Publish**.
   (Or with the Firebase CLI: `npm i -g firebase-tools`, `firebase login`, `firebase deploy --only firestore:rules`.)
5. You do **not** have to create the `users` collection by hand; the backend creates it with the first account.

### 2. Get the frontend config (public web config)
1. **Project settings (gear icon) → General → Your apps → Web (`</>`)** → register an app named `clyra-web`.
2. Copy the `firebaseConfig` values.
3. Create `frontend/.env` from `frontend/.env.example` and paste the values:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_BASE_URL=http://localhost:8080
```

### 3. Get the backend service account (SECRET)
1. **Project settings → Service accounts → Generate new private key** → a `.json` file downloads.
2. Move it **outside the repository** (e.g. `C:/Users/you/secrets/clyra-service-account.json`). Never commit it, never put it in `frontend/`.
3. Create `backend/.env` from `backend/.env.example`:

```
FIREBASE_CREDENTIALS_PATH=C:/Users/you/secrets/clyra-service-account.json
CORS_ALLOWED_ORIGINS=http://localhost:5173
BOOTSTRAP_STAFF_EMAIL=
```
Use forward slashes (`/`) in the path, even on Windows.

### 4. Create the first Staff/Admin account (one time)
Public registration can never create staff, so bootstrap the first one securely:
1. Firebase Console → **Authentication → Users → Add user** → enter an email and a strong password.
2. Put that email in `backend/.env` as `BOOTSTRAP_STAFF_EMAIL=you@example.com`.
3. Start the backend (step 5). The log says `Bootstrap complete … is now STAFF`.
4. **Remove** `BOOTSTRAP_STAFF_EMAIL` from `backend/.env` afterwards. (It only works while no staff exists anyway.)
5. Sign in to Clyra as that user → **User Management** → create Doctor accounts (and more staff if needed).

### 5. Run the backend
```bash
cd backend
mvn spring-boot:run
```
Runs on <http://localhost:8080>. Run its tests with `mvn test`.

### 6. Run the frontend (second terminal)
```bash
cd frontend
npm install
npm run dev
```
Open <http://localhost:5173>.

## Environment variables

| File | Variable | Meaning |
|---|---|---|
| `frontend/.env` | `VITE_FIREBASE_*` | Public Firebase web config |
| `frontend/.env` | `VITE_API_BASE_URL` | Backend URL |
| `backend/.env` | `FIREBASE_CREDENTIALS_PATH` | Path to the service account JSON (secret file) |
| `backend/.env` | `CORS_ALLOWED_ORIGINS` | Allowed frontend origin(s) |
| `backend/.env` | `BOOTSTRAP_STAFF_EMAIL` | One-time first-staff promotion |

## Database (Firestore `users/{uid}`)

```json
{
  "uid": "firebase-auth-uid",
  "fullName": "Juan Dela Cruz",
  "email": "juan@example.com",
  "phoneNumber": "09123456789",
  "role": "PATIENT",
  "isActive": true,
  "createdAt": "<server timestamp>",
  "updatedAt": "<server timestamp>"
}
```
Roles: `PATIENT`, `DOCTOR`, `STAFF`. No passwords or private credentials are stored in Firestore
(passwords exist only inside Firebase Authentication, hashed by Google).

Validation: password 8–64 chars with upper, lower, digit and symbol; phone must be a PH mobile number
(`09XXXXXXXXX` or `+639XXXXXXXXX`). Change the regexes in `ValidationPatterns.java` and `frontend/src/utils/validators.js` together if you need other formats.

## Manual test checklist (use real Firebase accounts)

**Registration**
- [ ] Register a new patient → lands on Patient Dashboard.
- [ ] Firebase Console → Authentication shows the user; Firestore `users/{uid}` exists with `role: "PATIENT"`.
- [ ] Register again with the same email → "An account with this email already exists."
- [ ] Submit empty form → field errors. Mismatched passwords → "Passwords do not match."

**Login / logout**
- [ ] Valid login → correct dashboard. Wrong password → "Incorrect email or password."
- [ ] Refresh the page while signed in → still signed in.
- [ ] Log out → redirected to `/login`; visiting `/patient` redirects back to `/login`.

**Roles**
- [ ] Patient, Doctor and Staff accounts each reach their own dashboard (and different sidebar menus).
- [ ] While signed in as Patient, open `/staff` or `/doctor` → 403 page.
- [ ] API check (replace `<TOKEN>` with a patient's ID token, e.g. from the browser Network tab):
  `curl -i http://localhost:8080/api/admin/users -H "Authorization: Bearer <TOKEN>"` → `403`;
  without the header → `401`.

## Git: commit and push

From the `clyra/` folder:

```bash
git init                         # skip if the folder is already a git repository
git status                       # CHECK: no .env files or service-account .json files may be listed
git add .
git commit -m "Implement Project Increment 1 - User Accounts and Authentication"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git   # skip if already added
git push -u origin main
```

If you ever committed a service account key by mistake, **delete that key in Firebase Console → Service accounts and generate a new one** – removing the file from git is not enough.
