import { useState } from "react";
import { ChevronRight, Ship, FileText, Calendar, Plus, AlertTriangle, FileCheck2 } from "lucide-react";
import BoatForm from "./BoatForm.jsx";
import BoatCard from "./BoatCard.jsx";
import VertragCard, { vertragTotal } from "./VertragCard.jsx";
import PolizzeErfassenForm from "./PolizzeErfassenForm.jsx";
import { euro } from "../../lib/format.js";
import { fullName, boatsSubtitle, getBoats, berechneKuendigungsfrist, STATUS_OPTIONS } from "./helpers.js";

// Grundgerüst aus BootsCRM_reference.jsx: Kopfbereich, Sub-Tab-Navigation und
// detail-grid. Die Sub-Tabs Dokumente und Historie brauchen eigene Endpunkte
// (documents-/historie-Tabellen) und kommen in einem späteren Schritt — sie
// sind hier bereits sichtbar, damit die Navigation vollständig ist.
export default function CustomerDetail({
  customer, onBack, onEdit, onDelete, onStatusChange, partners, onSaveBoat, onDeleteBoat, onAddVertrag,
}) {
  const [subTab, setSubTab] = useState("uebersicht"); // uebersicht | boote | historie | dokumente
  const [boatView, setBoatView] = useState({ mode: "list" }); // list | form
  const [polizzeForm, setPolizzeForm] = useState(false);

  const boats = getBoats(customer);

  const saveBoat = async (boat) => {
    await onSaveBoat(customer, boat);
    setBoatView({ mode: "list" });
  };
  const deleteBoat = async (boat) => {
    if (!window.confirm(`„${boat.name || "Boot ohne Namen"}" wirklich löschen?`)) return;
    await onDeleteBoat(customer, boat);
  };

  const partner = (partners || []).find((p) => p.id === customer.partner_id);
  const vertraege = customer.vertraege || [];

  const savePolizze = async (vertrag) => {
    await onAddVertrag(customer, vertrag);
    setPolizzeForm(false);
  };

  return (
    <div className="panel customer-detail">
      <button className="back-link" onClick={onBack}>
        <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Zurück zur Übersicht
      </button>

      <div className="detail-head">
        <div>
          <h2 className="panel-title" style={{ marginBottom: 2 }}>{fullName(customer)}</h2>
          <span className="result-subtitle">{boatsSubtitle(customer)}</span>
        </div>
        <div className="detail-actions">
          <select className="status-select" value={customer.status || ""} onChange={(e) => onStatusChange(customer.id, e.target.value)}>
            <option value="">— kein Status —</option>
            {STATUS_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button className="btn" onClick={() => onEdit(customer)}>Bearbeiten</button>
          <button className="btn btn--danger" onClick={() => onDelete(customer.id)}>Löschen</button>
        </div>
      </div>

      <div className="subtabnav">
        <button className={subTab === "uebersicht" ? "subtab subtab--active" : "subtab"} onClick={() => setSubTab("uebersicht")}>
          Übersicht
        </button>
        <button className={subTab === "boote" ? "subtab subtab--active" : "subtab"} onClick={() => setSubTab("boote")}>
          <Ship size={13} /> Boote{boats.length > 0 ? ` (${boats.length})` : ""}
        </button>
        <button className={subTab === "historie" ? "subtab subtab--active" : "subtab"} onClick={() => setSubTab("historie")}>
          <Calendar size={13} /> Historie
        </button>
        <button className={subTab === "dokumente" ? "subtab subtab--active" : "subtab"} onClick={() => setSubTab("dokumente")}>
          <FileText size={13} /> Dokumente
        </button>
      </div>

      {subTab === "uebersicht" && (
        <>
          <div className="detail-grid">
            {customer.email && <div><span className="detail-label">E-Mail</span><span>{customer.email}</span></div>}
            {customer.telefon && <div><span className="detail-label">Telefon</span><span>{customer.telefon}</span></div>}
            {customer.geburtsdatum && <div><span className="detail-label">Geburtsdatum</span><span>{customer.geburtsdatum}</span></div>}
            {customer.adresse && <div><span className="detail-label">Adresse</span><span>{customer.adresse}</span></div>}
            {customer.partner_id && (
              <div>
                <span className="detail-label">Partner / Vermittler</span>
                <span>{partner?.name || "—"}{customer.provision != null ? ` · ${customer.provision}% Provision` : ""}</span>
              </div>
            )}
            {customer.quelle && <div><span className="detail-label">Quelle</span><span>{customer.quelle}</span></div>}
            {customer.vorversicherung_hauptfaelligkeit && (
              <div>
                <span className="detail-label">Vorversicherung</span>
                <span>
                  {customer.vorversicherung_versicherer || "—"} · Hauptfälligkeit{" "}
                  {new Date(customer.vorversicherung_hauptfaelligkeit).toLocaleDateString("de-AT")}
                </span>
              </div>
            )}
          </div>

          {customer.vorversicherung_hauptfaelligkeit && (() => {
            const frist = berechneKuendigungsfrist(customer.vorversicherung_hauptfaelligkeit);
            if (!frist) return null;
            const tageBis = Math.round((frist - new Date()) / 86400000);
            return (
              <div className="warnbox" style={{ marginBottom: 14, flexWrap: "wrap" }}>
                <AlertTriangle size={15} />
                <span style={{ flex: 1 }}>
                  Kündigungsfrist Vorversicherung: <strong>{frist.toLocaleDateString("de-AT")}</strong>
                  {tageBis >= 0 ? ` (noch ${tageBis} Tage)` : " — bereits überschritten"}
                </span>
              </div>
            );
          })()}

          {customer.notizen && <p className="detail-notes">{customer.notizen}</p>}

          <div className="section-head-row">
            <h3 className="panel-subtitle" style={{ margin: 0 }}><FileCheck2 size={15} /> Polizzen</h3>
            {!polizzeForm && (
              <button type="button" className="btn btn--sm" onClick={() => setPolizzeForm(true)}>
                <Plus size={13} /> Polizze erfassen
              </button>
            )}
          </div>

          {/* In der Referenz wird dieses Formular aus dem "Nächster Schritt"-
              Bereich geöffnet — den baut Prompt 7. Bis dahin dieser Knopf,
              damit die Polizzenerfassung schon benutzbar ist. */}
          {polizzeForm && <PolizzeErfassenForm onCancel={() => setPolizzeForm(false)} onSave={savePolizze} />}

          {vertraege.length === 0 ? (
            !polizzeForm && <p className="empty-hint">Noch keine Polizze erfasst.</p>
          ) : (
            <>
              {vertraege.length > 1 && (
                <p className="vertraege-summary">
                  {vertraege.length} Verträge · {euro(vertraege.reduce((sum, v) => sum + vertragTotal(v), 0))} / Jahr gesamt
                </p>
              )}
              {vertraege.map((v) => <VertragCard key={v.id} vertrag={v} />)}
            </>
          )}
        </>
      )}

      {subTab === "boote" && (
        boatView.mode === "form" ? (
          <BoatForm initial={boatView.data} onCancel={() => setBoatView({ mode: "list" })} onSave={saveBoat} />
        ) : (
          <>
            <div className="section-head-row">
              <h3 className="panel-subtitle" style={{ margin: 0 }}><Ship size={15} /> Boote</h3>
              <button type="button" className="btn btn--sm" onClick={() => setBoatView({ mode: "form", data: null })}>
                <Plus size={13} /> Neues Boot
              </button>
            </div>
            {boats.length === 0 ? (
              <p className="empty-hint">Noch kein Boot hinterlegt.</p>
            ) : (
              boats.map((b) => (
                <BoatCard key={b.id} boat={b} onEdit={(boat) => setBoatView({ mode: "form", data: boat })} onDelete={deleteBoat} />
              ))
            )}
          </>
        )
      )}

      {subTab === "historie" && (
        <p className="empty-hint">Der Kontaktverlauf kommt im nächsten Schritt (Tabelle <code>historie</code> steht bereits).</p>
      )}

      {subTab === "dokumente" && (
        <p className="empty-hint">Die Dokumentenablage kommt im nächsten Schritt (Tabelle <code>documents</code> und der Ordner <code>server/uploads/</code> stehen bereits).</p>
      )}
    </div>
  );
}
