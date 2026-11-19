import { useAuth } from '../contexts/AuthContext';
import Welcome from '../components/Welcome';
import AccountInfo from '../components/AccountInfo';

export default function PatientDashboard() {
  const { profile } = useAuth();
  return (
    <>
      <Welcome profile={profile} subtitle="This is your patient dashboard." />
      <div className="grid">
        <section className="card">
          <h2>Dashboard overview</h2>
          <ul className="overview-list">
            <li><span>Account status</span><strong>{profile.isActive ? 'Active' : 'Inactive'}</strong></li>
            <li><span>Appointments</span><strong className="soon">Coming in a future increment</strong></li>
            <li><span>Reminders</span><strong className="soon">Coming in a future increment</strong></li>
          </ul>
        </section>
        <AccountInfo profile={profile} />
      </div>
    </>
  );
}
