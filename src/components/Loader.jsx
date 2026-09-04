export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="loader-wrap" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      {label ? <p className="hint">{label}</p> : null}
    </div>
  )
}
