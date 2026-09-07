// Polizzen-Darstellung — aus BootsCRM_reference.jsx: Versicherer-Badges
// (Zeilen 1200-1214) und vertragTotal/VertragCard (Zeilen 1730-1782),
// programmatisch ausgeschnitten, inhaltlich unverändert.
import { euro } from "../../lib/format.js";

const INSURER_STYLES = {
  "wiener städtische": { color: "#00629B", short: "WIENER STÄDTISCHE" },
  "nautima": { color: "#032856", short: "NAUTIMA (Mannheimer)" },
  "mannheimer": { color: "#032856", short: "NAUTIMA (Mannheimer)" },
  "callidus": { color: "#0F6EBE", short: "Callidus-Eigentarif" },
};
function insurerStyle(name) {
  const n = (name || "").toLowerCase();
  const key = Object.keys(INSURER_STYLES).find((k) => n.includes(k));
  return key ? INSURER_STYLES[key] : { color: "#41505A", short: name || "Versicherer" };
}
function InsurerBadge({ name }) {
  const s = insurerStyle(name);
  return <span className="insurer-badge" style={{ background: s.color }}>{s.short}</span>;
}

export function vertragTotal(vertrag) {
  return (vertrag.sparten || []).reduce((sum, s) => sum + (s.folgepraemie ?? s.erstpraemie ?? 0), 0);
}
export default function VertragCard({ vertrag }) {
  const total = vertragTotal(vertrag);
  return (
    <div className="vertrag-card">
      <div className="vertrag-head">
        <div className="vertrag-head-left">
          <InsurerBadge name={vertrag.versicherer} />
          {vertrag.polizzennummer && <span className="vertrag-polnr">Polizze-Nr. {vertrag.polizzennummer}</span>}
        </div>
        {total > 0 && <span className="vertrag-total">{euro(total)}<span className="vertrag-total-label"> / Jahr</span></span>}
      </div>
      {(vertrag.versicherungsbeginn || vertrag.hauptfaelligkeit || vertrag.zahlweise) && (
        <div className="vertrag-meta">
          {vertrag.versicherungsbeginn && <span>Beginn {vertrag.versicherungsbeginn}</span>}
          {vertrag.hauptfaelligkeit && <span>Hauptfälligkeit {vertrag.hauptfaelligkeit}</span>}
          {vertrag.zahlweise && <span>{vertrag.zahlweise}</span>}
        </div>
      )}
      {vertrag.sparten?.length > 0 && (
        <div className="table-scroll">
        <table className="sparten-table">
          <thead><tr><th>Sparte</th><th>Vers.-Summe</th><th>Prämie</th></tr></thead>
          <tbody>
            {vertrag.sparten.map((s, i) => (
              <tr key={i}>
                <td>
                  {s.sparte}
                  {!vertrag.polizzennummer && s.polizzennummer && <span className="sparten-polnr"> · {s.polizzennummer}</span>}
                </td>
                <td>{s.versicherungssumme != null ? `${euro(s.versicherungssumme)}${s.selbstbehalt != null ? ` (SB ${euro(s.selbstbehalt)})` : ""}` : "—"}</td>
                <td>
                  {s.erstpraemie != null && s.folgepraemie != null && s.erstpraemie !== s.folgepraemie
                    ? <>{euro(s.folgepraemie)}<span className="sparten-erst"> (Erst {euro(s.erstpraemie)})</span></>
                    : euro(s.folgepraemie ?? s.erstpraemie ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
          {vertrag.sparten.length > 1 && (
            <tfoot><tr className="sparten-total-row"><td>Gesamt</td><td></td><td>{euro(total)}</td></tr></tfoot>
          )}
        </table>
        </div>
      )}
      {vertrag.notizen && <p className="vertrag-notes">{vertrag.notizen}</p>}
      {vertrag.quelle && <a href={vertrag.quelle} target="_blank" rel="noreferrer" className="vertrag-link">Original-Dokument ansehen ↗</a>}
    </div>
  );
}

