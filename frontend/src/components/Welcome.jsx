import { ROLE_LABEL } from '../utils/roles';

export default function Welcome({ profile, subtitle }) {
  return (
    <div className="welcome">
      <h1>Welcome, {profile.fullName}!</h1>
      <p className="muted">
        You are signed in as <span className={`badge badge-${profile.role.toLowerCase()}`}>{ROLE_LABEL[profile.role]}</span>
      </p>
      {subtitle && <p className="muted">{subtitle}</p>}
    </div>
  );
}
