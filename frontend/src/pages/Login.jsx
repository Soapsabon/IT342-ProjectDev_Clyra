import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import Field from '../components/Field';
import PasswordInput from '../components/PasswordInput';
import Alert from '../components/Alert';
import { firebaseConfigured } from '../firebase/config';
import { friendlyAuthError, validateLogin } from '../utils/validators';

export default function Login() {
  const { login, loading, authError } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const busy = submitting || loading;
  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const found = validateLogin(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await login(form.email, form.password);
      // On success the auth listener loads the role and the router redirects to the right dashboard.
    } catch (err) {
      setFormError(friendlyAuthError(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />
        <h1>Welcome back</h1>
        <p className="muted">Sign in to manage your clinic appointments.</p>

        {!firebaseConfigured && (
          <Alert>Firebase is not configured. Copy frontend/.env.example to frontend/.env and fill it in.</Alert>
        )}
        <Alert>{formError || authError}</Alert>

        <form onSubmit={handleSubmit} noValidate>
          <Field id="email" label="Email address" error={errors.email}>
            <input
              id="email" name="email" type="email" autoComplete="email"
              value={form.email} onChange={update} disabled={busy}
              aria-invalid={errors.email ? 'true' : 'false'}
            />
          </Field>
          <Field id="password" label="Password" error={errors.password}>
            <PasswordInput
              id="password" value={form.password} onChange={update}
              autoComplete="current-password" disabled={busy} invalid={!!errors.password}
            />
          </Field>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? (<><span className="spinner spinner-sm" /> Signing in…</>) : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          New patient? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
