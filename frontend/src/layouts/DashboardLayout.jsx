import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import { ROLE_LABEL } from '../utils/roles';

/**
 * Shared dashboard shell. The navigation menu is chosen by the authenticated user's role,
 * so the three dashboards look consistent but offer different options.
 */
const NAV = {
  PATIENT: [
    { to: '/patient', label: 'Overview', end: true },
    { label: 'Book Appointment', soon: true },
    { label: 'My Appointments', soon: true },
  ],
  DOCTOR: [
    { to: '/doctor', label: 'Overview', end: true },
    { label: 'My Schedule', soon: true },
    { label: 'Patient Appointments', soon: true },
  ],
  STAFF: [
    { to: '/staff', label: 'Overview', end: true },
    { to: '/staff/users', label: 'User Management' },
    { label: 'Appointments', soon: true },
    { label: 'Doctor Availability', soon: true },
  ],
};

export default function DashboardLayout() {
  const { profile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const items = NAV[profile.role] || [];

  const handleLogout = async () => {
    setSigningOut(true);
    await logout(); // clears auth state; ProtectedRoute then redirects to /login
  };

  return (
    <div className="shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <Logo light />
        <p className="sidebar-role">{ROLE_LABEL[profile.role]}</p>
        <nav aria-label="Main navigation">
          {items.map((item) =>
            item.soon ? (
              <span key={item.label} className="nav-item nav-disabled" aria-disabled="true">
                {item.label}
                <small>Coming in a future increment</small>
              </span>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
        <button className="btn btn-sidebar-logout" onClick={handleLogout} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Log out'}
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            className="menu-btn"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            ☰
          </button>
          <div className="topbar-user">
            <div>
              <strong>{profile.fullName}</strong>
              <span className={`badge badge-${profile.role.toLowerCase()}`}>{ROLE_LABEL[profile.role]}</span>
            </div>
            <button className="btn btn-outline" onClick={handleLogout} disabled={signingOut}>
              Log out
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
