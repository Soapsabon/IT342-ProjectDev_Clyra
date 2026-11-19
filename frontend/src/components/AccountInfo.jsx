import { ROLE_LABEL, formatDate } from '../utils/roles';

/** Account information card, shared by all three dashboards. Data comes from the backend/Firestore. */
export default function AccountInfo({ profile }) {
  const rows = [
    ['Full name', profile.fullName],
    ['Email', profile.email],
    ['Phone number', profile.phoneNumber || '—'],
    ['Role', ROLE_LABEL[profile.role] || profile.role],
    ['Account status', profile.isActive ? 'Active' : 'Inactive'],
    ['Member since', formatDate(profile.createdAt)],
    ['User ID', profile.uid],
  ];
  return (
    <section className="card">
      <h2>Account information</h2>
      <dl className="info-list">
        {rows.map(([label, value]) => (
          <div key={label} className="info-row">
            <dt>{label}</dt>
            <dd className={label === 'User ID' ? 'mono' : ''}>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
