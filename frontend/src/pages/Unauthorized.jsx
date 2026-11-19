import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { homeFor } from '../utils/roles';
import Logo from '../components/Logo';

export default function Unauthorized() {
  const { profile } = useAuth();
  return (
    <div className="auth-page">
      <div className="auth-card status-page">
        <Logo />
        <p className="status-code">403</p>
        <h1>Access denied</h1>
        <p className="muted">You do not have permission to view this page.</p>
        <Link className="btn btn-primary" to={profile ? homeFor(profile.role) : '/login'}>
          {profile ? 'Back to my dashboard' : 'Go to sign in'}
        </Link>
      </div>
    </div>
  );
}
