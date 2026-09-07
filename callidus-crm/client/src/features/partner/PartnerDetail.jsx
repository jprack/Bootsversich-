import { ChevronRight, Users } from "lucide-react";
import { partnerTypeLabel, vertragTotal } from "./helpers.js";
import { fullName, boatsSubtitle } from "../kunden/helpers.js";
import { euro } from "../../lib/format.js";

// Aus BootsCRM_reference.jsx. Die verlinkten Kunden werden — wie im Prompt
// vorgeschlagen — aus der bereits geladenen Kundenliste gefiltert, statt über
// einen eigenen Endpunkt. Ein zusätzlicher Roundtrip wäre hier nichts wert:
// die App hält die Kunden ohnehin im State.
export default function PartnerDetail({ partner, customers, onBack, onEdit, onDelete }) {
  const linkedCustomers = (customers || []).filter((c) => c.partner_id === partner.id);

  return (
    <div className="panel customer-detail">
      <button className="back-link" onClick={onBack}>
        <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Zurück zur Übersicht
      </button>
      <div className="detail-head">
        <div>
          <h2 className="panel-title" style={{ marginBottom: 2 }}>{partner.name}</h2>
          <span className="result-subtitle">
            {partner.nummer ? `Partner-Nr. ${partner.nummer} · ` : ""}{partnerTypeLabel(partner)}
          </span>
        </div>
        <div className="detail-actions">
          <button className="btn" onClick={() => onEdit(partner)}>Bearbeiten</button>
          <button className="btn btn--danger" onClick={() => onDelete(partner.id)}>Löschen</button>
        </div>
      </div>

      <div className="detail-grid">
        {partner.email && <div><span className="detail-label">E-Mail</span><span>{partner.email}</span></div>}
        {partner.iban && <div><span className="detail-label">IBAN</span><span>{partner.iban}</span></div>}
        {partner.adresse && <div><span className="detail-label">Adresse</span><span>{partner.adresse}</span></div>}
        {partner.plz_ort && <div><span className="detail-label">PLZ, Stadt</span><span>{partner.plz_ort}</span></div>}
      </div>

      {linkedCustomers.length > 0 && (() => {
        const polizzeCount = linkedCustomers.filter((c) => c.status === "polizze").length;
        const gesamtpraemie = linkedCustomers.reduce(
          (sum, c) => sum + (c.vertraege || []).reduce((s, v) => s + vertragTotal(v), 0), 0
        );
        const quote = Math.round((polizzeCount / linkedCustomers.length) * 100);
        return (
          <div className="partner-stats">
            <div className="partner-stat">
              <span className="partner-stat-value">{linkedCustomers.length}</span>
              <span className="partner-stat-label">Kunden gebracht</span>
            </div>
            <div className="partner-stat">
              <span className="partner-stat-value">{quote}%</span>
              <span className="partner-stat-label">davon Polizze ({polizzeCount})</span>
            </div>
            <div className="partner-stat">
              <span className="partner-stat-value">{euro(gesamtpraemie)}</span>
              <span className="partner-stat-label">Prämie / Jahr generiert</span>
            </div>
          </div>
        );
      })()}

      <h3 className="panel-subtitle"><Users size={15} /> Verlinkte Kunden ({linkedCustomers.length})</h3>
      {linkedCustomers.length === 0 ? (
        <p className="empty-hint">
          Noch kein Kunde mit diesem Partner verlinkt — im Kundenformular unter „Partner / Vermittler" auswählbar.
        </p>
      ) : (
        <div className="newsletter-recipient-list">
          {linkedCustomers.map((c) => (
            <div key={c.id} className="newsletter-recipient-row" style={{ cursor: "default" }}>
              <span className="newsletter-recipient-name">{fullName(c)}</span>
              <span className="newsletter-recipient-email">{boatsSubtitle(c)}</span>
              {c.provision != null && <span className="tab-badge" style={{ background: "var(--sea)" }}>{c.provision}%</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
