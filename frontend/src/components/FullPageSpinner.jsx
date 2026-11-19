export default function FullPageSpinner({ label = 'Loading…' }) {
  return (
    <div className="fullpage-center" role="status" aria-live="polite">
      <div className="spinner spinner-lg" />
      <p className="muted">{label}</p>
    </div>
  );
}
