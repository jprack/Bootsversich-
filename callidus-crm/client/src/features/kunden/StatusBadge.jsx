import { statusInfo } from "./helpers.js";

export default function StatusBadge({ status }) {
  const info = statusInfo(status);
  if (!info) return <span className="status-badge status-badge--none">kein Status</span>;
  return <span className="status-badge" style={{ background: info.color }}>{info.label}</span>;
}
