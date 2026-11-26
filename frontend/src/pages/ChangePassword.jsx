import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { changePassword } from '../services/api';
import Field from '../components/Field';
import PasswordInput from '../components/PasswordInput';
import Alert from '../components/Alert';
import { PASSWORD_HINT, validateChangePassword } from '../utils/validators';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

/**
 * Change password for the signed-in user. The backend verifies the current password and revokes
 * all sessions, so after success the user is signed out and must log in with the new password.
 */
export default function ChangePassword() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const found = validateChangePassword(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await changePassword(form);
    } catch (err) {
      const fields = { ...(err.fieldErrors || {}) };
      if (fields.passwordConfirmed) fields.confirmPassword = fields.passwordConfirmed;
      if (err.status === 400 && /current password is incorrect/i.test(err.message)) {
        fields.currentPassword = 'Current password is incorrect.';
      }
      setErrors(fields);
      setFormError(err.message);
      setSaving(false);
      return;
    }

    setForm(EMPTY);
    setSuccess('Password changed. For your security you will be signed out now…');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await logout();
    navigate('/login', {
      replace: true,
      state: { message: 'Password changed successfully. Please sign in with your new password.' },
    });
  };

  return (
    <>
      <div className="welcome">
        <h1>Change password</h1>
        <p className="muted">Enter your current password, then choose a new one.</p>
      </div>

      <section className="card" style={{ maxWidth: 620 }}>
        <Alert>{formError}</Alert>
        <Alert type="success">{success}</Alert>

        <form onSubmit={handleSubmit} noValidate>
          <Field id="currentPassword" label="Current password" error={errors.currentPassword}>
            <PasswordInput id="currentPassword" value={form.currentPassword} onChange={update}
              autoComplete="current-password" disabled={saving} invalid={!!errors.currentPassword} />
          </Field>
          <Field id="newPassword" label="New password" error={errors.newPassword} hint={PASSWORD_HINT}>
            <PasswordInput id="newPassword" value={form.newPassword} onChange={update}
              autoComplete="new-password" disabled={saving} invalid={!!errors.newPassword} />
          </Field>
          <Field id="confirmPassword" label="Confirm new password" error={errors.confirmPassword}>
            <PasswordInput id="confirmPassword" value={form.confirmPassword} onChange={update}
              autoComplete="new-password" disabled={saving} invalid={!!errors.confirmPassword} />
          </Field>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? (<><span className="spinner spinner-sm" /> Updating…</>) : 'Change password'}
          </button>
        </form>
      </section>
    </>
  );
}
