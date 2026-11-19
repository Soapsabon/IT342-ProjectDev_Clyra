export default function Logo({ light = false }) {
  return (
    <div className={`logo ${light ? 'logo-light' : ''}`}>
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={light ? '#ffffff' : '#0f766e'} />
        <path d="M13 7h6v6h6v6h-6v6h-6v-6H7v-6h6z" fill={light ? '#0f766e' : '#ffffff'} />
      </svg>
      <span>Clyra</span>
    </div>
  );
}
