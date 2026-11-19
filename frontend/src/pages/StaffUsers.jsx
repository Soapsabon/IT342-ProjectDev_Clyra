import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { changeUserRole, changeUserStatus, createUser, listUsers } from '../services/api';
import Alert from '../components/Alert';
import Field from '../components/Field';
import PasswordInput from '../components/PasswordInput';
import { ROLE_LABEL, formatDate } from '../utils/roles';
import { EMAIL_RE, PASSWORD_HINT, PASSWORD_RE, PHONE_RE } from '../utils/validators';

const EMPTY = { fullName: '', email: '', phoneNumber: '', password: '', role: 'DOCTOR' };

export default function StaffUsers() {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyUid, setBusyUid] = useState(null);

  const [form, setForm] = useState(EMPTY);
  const [formErrors, setFormErrors] = useState({});
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setUsers(await listUsers());
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (uid, action, successMessage) => {
    setBusyUid(uid);
    setError('');
    setNotice('');
    try {
      const updated = await action();
      setUsers((list) => list.map((u) => (u.uid === updated.uid ? updated : u)));
      setNotice(successMessage);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyUid(null);
    }
  };

  const onRoleChange = (user, role) => {
    if (role === user.role) return;
    if (!window.confirm(`Change ${user.fullName}'s role to ${ROLE_LABEL[role]}?`)) return;
    run(user.uid, () => changeUserRole(user.uid, role), `${user.fullName} is now ${ROLE_LABEL[role]}.`);
  };

  const onToggleActive = (user) => {
    const next = !user.isActive;
    if (!window.confirm(`${next ? 'Reactivate' : 'Deactivate'} ${user.fullName}'s account?`)) return;
    run(user.uid, () => changeUserStatus(user.uid, next),
      `${user.fullName}'s account was ${next ? 'reactivated' : 'deactivated'}.`);
  };

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onCreate = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    const found = {};
    if (form.fullName.trim().length < 2) found.fullName = 'Full name is required.';
    if (!EMAIL_RE.test(form.email.trim())) found.email = 'Enter a valid email address.';
    if (!PHONE_RE.test(form.phoneNumber.trim())) found.phoneNumber = 'Enter a valid PH mobile number.';
    if (!PASSWORD_RE.test(form.password)) found.password = PASSWORD_HINT;
    setFormErrors(found);
    if (Object.keys(found).length) return;

    setCreating(true);
    try {
      const created = await createUser({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
        role: form.role,
      });
      setUsers((list) => [created, ...list]);
      setNotice(`${ROLE_LABEL[created.role]} account created for ${created.email}. Share the temporary password securely.`);
      setForm(EMPTY);
      setFormErrors({});
    } catch (err) {
      setFormErrors(err.fieldErrors || {});
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <h1>User management</h1>
      <p className="muted">Provision doctor and staff accounts and manage roles. Only clinic staff can do this.</p>
      <Alert>{error}</Alert>
      <Alert type="success">{notice}</Alert>

      <section className="card">
        <h2>Create a doctor or staff account</h2>
        <form onSubmit={onCreate} noValidate className="inline-form">
          <Field id="fullName" label="Full name" error={formErrors.fullName}>
            <input id="fullName" name="fullName" value={form.fullName} onChange={update} disabled={creating} />
          </Field>
          <Field id="email" label="Email address" error={formErrors.email}>
            <input id="email" name="email" type="email" value={form.email} onChange={update} disabled={creating} />
          </Field>
          <Field id="phoneNumber" label="Phone number" error={formErrors.phoneNumber}>
            <input id="phoneNumber" name="phoneNumber" value={form.phoneNumber} onChange={update} disabled={creating} />
          </Field>
          <Field id="password" label="Temporary password" error={formErrors.password}>
            <PasswordInput id="password" value={form.password} onChange={update}
              autoComplete="new-password" disabled={creating} invalid={!!formErrors.password} />
          </Field>
          <Field id="role" label="Role">
            <select id="role" name="role" value={form.role} onChange={update} disabled={creating}>
              <option value="DOCTOR">Doctor</option>
              <option value="STAFF">Clinic Staff / Administrator</option>
              <option value="PATIENT">Patient</option>
            </select>
          </Field>
          <button className="btn btn-primary" type="submit" disabled={creating}>
            {creating ? (<><span className="spinner spinner-sm" /> Creating…</>) : 'Create account'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>All accounts</h2>
        {loading ? (
          <p className="muted"><span className="spinner spinner-sm" /> Loading accounts…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Created</th><th /></tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.uid === profile.uid;
                  const busy = busyUid === u.uid;
                  return (
                    <tr key={u.uid}>
                      <td>{u.fullName}{isSelf && <span className="muted"> (you)</span>}</td>
                      <td>{u.email}</td>
                      <td>{u.phoneNumber || '—'}</td>
                      <td>
                        <select
                          value={u.role} disabled={isSelf || busy}
                          onChange={(e) => onRoleChange(u, e.target.value)}
                          aria-label={`Role for ${u.fullName}`}
                        >
                          <option value="PATIENT">Patient</option>
                          <option value="DOCTOR">Doctor</option>
                          <option value="STAFF">Staff</option>
                        </select>
                      </td>
                      <td><span className={`status ${u.isActive ? 'status-on' : 'status-off'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td>
                        <button className="btn btn-outline btn-sm" disabled={isSelf || busy} onClick={() => onToggleActive(u)}>
                          {u.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && <tr><td colSpan="7" className="muted">No accounts yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
