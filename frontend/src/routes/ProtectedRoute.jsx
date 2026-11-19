import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FullPageSpinner from '../components/FullPageSpinner';

/**
 * Frontend route guard (a UX convenience - the backend enforces the real permissions).
 *  - not signed in            -> /login
 *  - signed in, wrong role    -> /unauthorized (403 page)
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner label="Checking your session…" />;
  if (!profile) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}
