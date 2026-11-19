import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { listUsers } from '../services/api';
import Welcome from '../components/Welcome';
import AccountInfo from '../components/AccountInfo';
import Alert from '../components/Alert';

export default function StaffDashboard() {
  const { profile } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');

  // Real numbers from the protected admin endpoint (the backend requires the STAFF role).
  useEffect(() => {
    listUsers().then(setUsers).catch((err) => setError(err.message));
  }, []);

  const count = (role) => (users ? users.filter((u) => u.role === role).length : '…');

  return (
    <>
      <Welcome profile={profile} subtitle="This is the clinic staff dashboard." />
      <Alert>{error}</Alert>
      <div className="stats">
        <div className="stat"><span>Total accounts</span><strong>{users ? users.length : '…'}</strong></div>
        <div className="stat"><span>Patients</span><strong>{count('PATIENT')}</strong></div>
        <div className="stat"><span>Doctors</span><strong>{count('DOCTOR')}</strong></div>
        <div className="stat"><span>Staff</span><strong>{count('STAFF')}</strong></div>
      </div>
      <div className="grid">
        <section className="card">
          <h2>Dashboard overview</h2>
          <ul className="overview-list">
            <li><span>Account status</span><strong>{profile.isActive ? 'Active' : 'Inactive'}</strong></li>
            <li><span>User &amp; role management</span><Link to="/staff/users">Open</Link></li>
            <li><span>Appointment management</span><strong className="soon">Coming in a future increment</strong></li>
          </ul>
        </section>
        <AccountInfo profile={profile} />
      </div>
    </>
  );
}
