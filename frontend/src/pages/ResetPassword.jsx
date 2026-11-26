import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../firebase/config';
import Logo from '../components/Logo';
import Field from '../components/Field';
import PasswordInput from '../components/PasswordInput';
import Alert from '../components/Alert';
import FullPageSpinner from '../components/FullPageSpinner';
import { PASSWORD_HINT, friendlyAuthError, validateResetPassword } from '../utils/validators';

/**
 * Step 2 of password recovery: opened from the emailed link (?oobCode=...). Firebase checks that the
 * code is valid, unexpired and unused, then stores the new password hashed. A used code stops working.
 */
export default function ResetPassword() {
  const [params] = useSearchParams();
  const code = params.get('oobCode');

  const [status, setStatus] = useState(code ? 'checking' : 'invalid'); // checking | ready | invalid | done
  const [email, setEmail] = useState('');
  const [linkError, setLinkError] = useState(code ? '' : 'This reset link is incomplete. Please request a new one.');
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!code) return undefined;
    let active = true;
    verifyPasswordResetCode(auth, code)
      .then((address) => {
        if (!active) return;
        setEmail(address);
        setStatus('ready');
      })
      .catch((err) => {
        if (!active) return;
        setLinkError(friendlyAuthError(err));
        setStatus('invalid');
      });
    return () => {
      active = false;
    };
  }, [code]);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const found = validateResetPassword(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, code, form.newPassword);
      setStatus('done');
    } catch (err) {
      if (err?.code === 'auth/expired-action-code' || err?.code === 'auth/invalid-action-code') {
        setLinkError(friendlyAuthError(err));
        setStatus('invalid');
      } else {
        setFormError(friendlyAuthError(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'checking') return <FullPageSpinner label="Checking your reset link…" />;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />

        {status === 'invalid' && (
          <>
            <h1>Link not valid</h1>
            <Alert>{linkError}</Alert>
            <p className="auth-switch"><Link to="/forgot-password">Request a new reset link</Link></p>
          </>
        )}

        {status === 'done' && (
          <>
            <h1>Password updated</h1>
            <Alert type="success">Your password was reset. You can now sign in with your new password.</Alert>
            <Link className="btn btn-primary btn-block" to="/login" style={{ textAlign: 'center' }}>
              Go to sign in
            </Link>
          </>
        )}

        {status === 'ready' && (
          <>
            <h1>Choose a new password</h1>
            <p className="muted">Resetting the password for {email}.</p>
            <Alert>{formError}</Alert>
            <form onSubmit={handleSubmit} noValidate>
              <Field id="newPassword" label="New password" error={errors.newPassword} hint={PASSWORD_HINT}>
                <PasswordInput id="newPassword" value={form.newPassword} onChange={update}
                  autoComplete="new-password" disabled={submitting} invalid={!!errors.newPassword} />
              </Field>
              <Field id="confirmPassword" label="Confirm new password" error={errors.confirmPassword}>
                <PasswordInput id="confirmPassword" value={form.confirmPassword} onChange={update}
                  autoComplete="new-password" disabled={submitting} invalid={!!errors.confirmPassword} />
              </Field>
              <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
                {submitting ? (<><span className="spinner spinner-sm" /> Saving…</>) : 'Reset password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
