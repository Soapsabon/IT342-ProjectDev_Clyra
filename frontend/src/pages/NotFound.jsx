import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { homeFor } from '../utils/roles';
import Logo from '../components/Logo';

export default function NotFound() {
  const { profile } = useAuth();
  return (
    <div className="auth-page">
      <div className="auth-card status-page">
        <Logo />
        <p className="status-code">404</p>
        <h1>Page not found</h1>
        <p className="muted">The page you are looking for does not exist.</p>
        <Link className="btn btn-primary" to={profile ? homeFor(profile.role) : '/login'}>
          {profile ? 'Back to my dashboard' : 'Go to sign in'}
        </Link>
      </div>
    </div>
  );
}
