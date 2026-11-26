import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/config';
import Logo from '../components/Logo';
import Field from '../components/Field';
import Alert from '../components/Alert';
import { EMAIL_RE, friendlyAuthError } from '../utils/validators';

/**
 * Step 1 of password recovery: Firebase emails a link containing a secure, expiring, single-use code.
 * The same message is shown whether or not the email exists, so the page cannot be used to find out
 * which emails are registered.
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!email.trim()) return setError('Email is required.');
    if (!EMAIL_RE.test(email.trim())) return setError('Enter a valid email address.');
    setError('');

    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err) {
      if (err?.code === 'auth/user-not-found') {
        setSent(true); // do not reveal that the account does not exist
      } else {
        setFormError(friendlyAuthError(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />
        <h1>Forgot your password?</h1>
        <p className="muted">Enter your email and we will send you a link to reset it.</p>

        <Alert>{formError}</Alert>
        {sent ? (
          <Alert type="success">
            If an account exists for {email.trim()}, a reset link is on its way. Check your inbox (and spam
            folder). The link expires after a short time and can only be used once.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <Field id="email" label="Email address" error={error}>
              <input id="email" name="email" type="email" autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)} disabled={submitting}
                aria-invalid={error ? 'true' : 'false'} />
            </Field>
            <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
              {submitting ? (<><span className="spinner spinner-sm" /> Sending…</>) : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
