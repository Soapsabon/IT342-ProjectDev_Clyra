import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from '../services/api';
import Field from '../components/Field';
import Alert from '../components/Alert';
import { validateProfile } from '../utils/validators';
import { ROLE_LABEL, formatDate } from '../utils/roles';

/** View and edit the signed-in user's OWN profile. Email and role are read-only. */
export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    fullName: profile.fullName || '',
    phoneNumber: profile.phoneNumber || '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const dirty =
    form.fullName.trim() !== (profile.fullName || '') ||
    form.phoneNumber.trim() !== (profile.phoneNumber || '');

  const update = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');
    const found = validateProfile(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const saved = await updateProfile({
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
      });
      await refreshProfile(); // updates the name shown in the top bar
      setForm({ fullName: saved.fullName, phoneNumber: saved.phoneNumber });
      setSuccess('Your profile was updated.');
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({ fullName: profile.fullName || '', phoneNumber: profile.phoneNumber || '' });
    setErrors({});
    setFormError('');
    setSuccess('');
  };

  return (
    <>
      <div className="welcome">
        <h1>My profile</h1>
        <p className="muted">View and update your personal information.</p>
      </div>

      <section className="card" style={{ maxWidth: 620 }}>
        <Alert>{formError}</Alert>
        <Alert type="success">{success}</Alert>

        <form onSubmit={handleSubmit} noValidate>
          <Field id="fullName" label="Full name" error={errors.fullName}>
            <input id="fullName" name="fullName" autoComplete="name" value={form.fullName}
              onChange={update} disabled={saving} aria-invalid={errors.fullName ? 'true' : 'false'} />
          </Field>
          <Field id="phoneNumber" label="Phone number" error={errors.phoneNumber} hint="Example: 09123456789">
            <input id="phoneNumber" name="phoneNumber" type="tel" autoComplete="tel" value={form.phoneNumber}
              onChange={update} disabled={saving} aria-invalid={errors.phoneNumber ? 'true' : 'false'} />
          </Field>
          <Field id="email" label="Email address" hint="Your email is your sign-in and cannot be changed here.">
            <input id="email" value={profile.email || ''} readOnly disabled />
          </Field>
          <Field id="role" label="Role" hint="Only clinic staff can change roles.">
            <input id="role" value={ROLE_LABEL[profile.role] || profile.role} readOnly disabled />
          </Field>

          <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" type="submit" disabled={saving || !dirty}>
              {saving ? (<><span className="spinner spinner-sm" /> Saving…</>) : 'Save changes'}
            </button>
            <button className="btn btn-outline" type="button" onClick={handleReset} disabled={saving || !dirty}>
              Cancel
            </button>
          </div>
        </form>

        <p className="muted" style={{ marginTop: '1.25rem', fontSize: '.85rem' }}>
          Member since {formatDate(profile.createdAt)} · Last updated {formatDate(profile.updatedAt)}
        </p>
      </section>
    </>
  );
}
