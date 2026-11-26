// Mirrors backend/src/main/java/edu/cit/clyra/dto/ValidationPatterns.java
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^(\+63|0)9\d{9}$/;
export const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/;

export const PASSWORD_HINT =
  'At least 8 characters with upper and lower case letters, a number and a symbol.';

export function validateRegistration({ fullName, email, phoneNumber, password, confirmPassword }) {
  const errors = {};
  if (!fullName.trim()) errors.fullName = 'Full name is required.';
  else if (fullName.trim().length < 2) errors.fullName = 'Full name must be at least 2 characters.';

  if (!email.trim()) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.';

  if (!phoneNumber.trim()) errors.phoneNumber = 'Phone number is required.';
  else if (!PHONE_RE.test(phoneNumber.trim()))
    errors.phoneNumber = 'Enter a valid PH mobile number (e.g. 09123456789).';

  if (!password) errors.password = 'Password is required.';
  else if (!PASSWORD_RE.test(password)) errors.password = PASSWORD_HINT;

  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';

  return errors;
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  return errors;
}

export function validateProfile({ fullName, phoneNumber }) {
  const errors = {};
  if (!fullName.trim()) errors.fullName = 'Full name is required.';
  else if (fullName.trim().length < 2) errors.fullName = 'Full name must be at least 2 characters.';
  else if (fullName.trim().length > 100) errors.fullName = 'Full name must be at most 100 characters.';

  if (!phoneNumber.trim()) errors.phoneNumber = 'Phone number is required.';
  else if (!PHONE_RE.test(phoneNumber.trim()))
    errors.phoneNumber = 'Enter a valid PH mobile number (e.g. 09123456789).';
  return errors;
}

export function validateChangePassword({ currentPassword, newPassword, confirmPassword }) {
  const errors = {};
  if (!currentPassword) errors.currentPassword = 'Current password is required.';

  if (!newPassword) errors.newPassword = 'New password is required.';
  else if (!PASSWORD_RE.test(newPassword)) errors.newPassword = PASSWORD_HINT;
  else if (newPassword === currentPassword)
    errors.newPassword = 'New password must be different from your current password.';

  if (!confirmPassword) errors.confirmPassword = 'Please confirm your new password.';
  else if (newPassword !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

export function validateResetPassword({ newPassword, confirmPassword }) {
  const errors = {};
  if (!newPassword) errors.newPassword = 'New password is required.';
  else if (!PASSWORD_RE.test(newPassword)) errors.newPassword = PASSWORD_HINT;

  if (!confirmPassword) errors.confirmPassword = 'Please confirm your new password.';
  else if (newPassword !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

/** Turns Firebase Auth error codes into friendly messages. */
export function friendlyAuthError(error) {
  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Incorrect email or password.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact the clinic.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection.';
    case 'auth/expired-action-code':
      return 'This reset link has expired. Please request a new one.';
    case 'auth/invalid-action-code':
      return 'This reset link is invalid or has already been used. Please request a new one.';
    case 'auth/weak-password':
      return 'That password is too weak. ' + PASSWORD_HINT;
    default:
      return error?.message || 'Something went wrong. Please try again.';
  }
}
