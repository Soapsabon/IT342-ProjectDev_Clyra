/** Label + control + inline error message. */
export default function Field({ id, label, error, hint, children }) {
  return (
    <div className={`field ${error ? 'field-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p className="field-msg error-text" role="alert">{error}</p>
      ) : hint ? (
        <p className="field-msg muted">{hint}</p>
      ) : null}
    </div>
  );
}
