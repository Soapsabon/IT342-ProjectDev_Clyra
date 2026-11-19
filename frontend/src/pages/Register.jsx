import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { registerPatient } from '../services/api';
import Logo from '../components/Logo';
import Field from '../components/Field';
import PasswordInput from '../components/PasswordInput';
import Alert from '../components/Alert';
import { PASSWORD_HINT, validateRegistration } from '../utils/validators';

const EMPTY = { fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '' };

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');
    const found = validateRegistration(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      // The backend creates the Firebase Auth user + Firestore profile and ALWAYS assigns PATIENT.
      await registerPatient({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
      });
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setFormError(err.status === 409 ? 'An account with this email already exists. Try signing in instead.' : err.message);
      setSubmitting(false);
      return;
    }

    setSuccess('Account created successfully! Signing you in…');
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      await login(form.email, form.password); // router then redirects to the Patient Dashboard
    } catch {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <Logo />
        <h1>Create your patient account</h1>
        <p className="muted">Register to book and manage your clinic appointments.</p>

        <Alert>{formError}</Alert>
        <Alert type="success">{success}</Alert>

        <form onSubmit={handleSubmit} noValidate>
          <Field id="fullName" label="Full name" error={errors.fullName}>
            <input id="fullName" name="fullName" autoComplete="name" value={form.fullName}
              onChange={update} disabled={submitting} aria-invalid={errors.fullName ? 'true' : 'false'} />
          </Field>
          <Field id="email" label="Email address" error={errors.email}>
            <input id="email" name="email" type="email" autoComplete="email" value={form.email}
              onChange={update} disabled={submitting} aria-invalid={errors.email ? 'true' : 'false'} />
          </Field>
          <Field id="phoneNumber" label="Phone number" error={errors.phoneNumber} hint="Example: 09123456789">
            <input id="phoneNumber" name="phoneNumber" type="tel" autoComplete="tel" value={form.phoneNumber}
              onChange={update} disabled={submitting} aria-invalid={errors.phoneNumber ? 'true' : 'false'} />
          </Field>
          <Field id="password" label="Password" error={errors.password} hint={PASSWORD_HINT}>
            <PasswordInput id="password" value={form.password} onChange={update}
              autoComplete="new-password" disabled={submitting} invalid={!!errors.password} />
          </Field>
          <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword}>
            <PasswordInput id="confirmPassword" value={form.confirmPassword} onChange={update}
              autoComplete="new-password" disabled={submitting} invalid={!!errors.confirmPassword} />
          </Field>
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? (<><span className="spinner spinner-sm" /> Creating account…</>) : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
