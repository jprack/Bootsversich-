// Kleine Bausteine aus BootsCRM_reference.jsx — unverändert übernommen.
import { AlertTriangle } from "lucide-react";

export function Field({ label, children, hint, span }) {
  return (
    <label className={`field${span ? " field--wide" : ""}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function RadioRow({ options, value, onChange, name }) {
  return (
    <div className="radio-row">
      {options.map((o) => (
        <label key={o.value} className={`radio-pill ${value === o.value ? "radio-pill--active" : ""}`}>
          <input type="radio" name={name} checked={value === o.value} onChange={() => onChange(o.value)} />
          {o.label}
        </label>
      ))}
    </div>
  );
}

export function WarnBox({ children }) {
  return (
    <div className="warnbox">
      <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
      <span>{children}</span>
    </div>
  );
}
