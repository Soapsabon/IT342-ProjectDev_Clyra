import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FullPageSpinner from '../components/FullPageSpinner';
import { homeFor } from '../utils/roles';

/** Login / register are only for signed-out users; signed-in users go to their dashboard. */
export default function PublicOnlyRoute() {
  const { profile, loading } = useAuth();
  if (loading) return <FullPageSpinner label="Loading…" />;
  if (profile) return <Navigate to={homeFor(profile.role)} replace />;
  return <Outlet />;
}
