import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicOnlyRoute from './routes/PublicOnlyRoute';
import DashboardLayout from './layouts/DashboardLayout';
import FullPageSpinner from './components/FullPageSpinner';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import StaffDashboard from './pages/StaffDashboard';
import StaffUsers from './pages/StaffUsers';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import { ROLES, homeFor } from './utils/roles';

function RootRedirect() {
  const { profile, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  return <Navigate to={profile ? homeFor(profile.role) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* The reset link from the email must work whether or not someone is signed in. */}
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Any signed-in user, regardless of role */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[ROLES.PATIENT]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/patient" element={<PatientDashboard />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[ROLES.DOCTOR]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/doctor" element={<DoctorDashboard />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[ROLES.STAFF]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/staff/users" element={<StaffUsers />} />
        </Route>
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
