// CustomerDetail — Kopfbereich, Sub-Tab-Navigation und Übersicht aus
// BootsCRM_reference.jsx. Der "Nächster Schritt"-Bereich, der Vergleich, die
// Textbausteine und die eingebetteten Antragsmasken sind mit Prompt 7 dazu-
// gekommen (Referenzzeilen 1987-2004, 2010-2071, 2092-2207, ausgeschnitten
// und in den Feldnamen an schema.sql angepasst).
//
// Die Sub-Tabs Historie und Dokumente folgen mit Prompt 8.
import { useState } from "react";
import { ChevronRight, Ship, FileText, Calendar, Plus, AlertTriangle, FileCheck2, Mail, Check, Copy, X } from "lucide-react";
import BoatForm from "./BoatForm.jsx";
import BoatCard from "./BoatCard.jsx";
import VertragCard, { vertragTotal } from "./VertragCard.jsx";
import AntragCard from "./AntragCard.jsx";
import PolizzeErfassenForm from "./PolizzeErfassenForm.jsx";
import VergleichPanel from "./VergleichPanel.jsx";
import HistorieList from "./HistorieList.jsx";
import DokumenteTab from "./DokumenteTab.jsx";
import NautimaAntragTab from "../rechner/NautimaAntragTab.jsx";
import CallidusDatenblattTab from "../rechner/CallidusDatenblattTab.jsx";
import { generateAntragAnschreiben, generatePolizzeMail, generateKuendigungsschreiben } from "./textbausteine.js";
import { fullName, boatsSubtitle, getBoats, berechneKuendigungsfrist, STATUS_OPTIONS } from "./helpers.js";
import { euro } from "../../lib/format.js";

export default function CustomerDetail({
  customer, onBack, onEdit, onDelete, onStatusChange, partners,
  onSaveBoat, onDeleteBoat, onAddVertrag, onAddHistorie, onCustomersChanged,
}) {
  const [subTab, setSubTab] = useState("uebersicht"); // uebersicht | boote | historie | dokumente
  const [boatView, setBoatView] = useState({ mode: "list" }); // list | form
  const [nextStepMode, setNextStepMode] = useState(null); // null | "nautima" | "bootsdatenblatt" | "polizze"
  const [anschreibenText, setAnschreibenText] = useState("");
  const [anschreibenCopied, setAnschreibenCopied] = useState(false);

  const boats = getBoats(customer);
  const primaryBoat = boats[0];
  const partner = (partners || []).find((p) => p.id === customer.partner_id);

  const saveBoat = async (boat) => {
    await onSaveBoat(customer, boat);
    setBoatView({ mode: "list" });
  };
  const deleteBoat = async (boat) => {
    if (!window.confirm(`„${boat.name || "Boot ohne Namen"}" wirklich löschen?`)) return;
    await onDeleteBoat(customer, boat);
  };

  const nautimaPrefill = {
    bootstyp: primaryBoat?.bootstyp === "Segelboot" ? "segelboot" : "motorboot",
    baujahr: primaryBoat?.baujahr ? Number(primaryBoat.baujahr) : undefined,
    segelflaeche: primaryBoat?.segelflaeche || undefined,
    motorkw: primaryBoat?.motorleistung_kw ? Number(primaryBoat.motorleistung_kw) : undefined,
    name1: fullName(customer),
    strasse: (customer.adresse || "").split(",")[0]?.trim() || undefined,
    plzOrt: (customer.adresse || "").split(",").slice(1).join(",").trim() || undefined,
  };
  const callidusPrefill = {
    bootstyp: primaryBoat?.bootstyp === "Segelboot" ? "segelboot" : "motorboot",
    baujahr: primaryBoat?.baujahr ? Number(primaryBoat.baujahr) : undefined,
    segelflaeche: primaryBoat?.segelflaeche || undefined,
    motorkw: primaryBoat?.motorleistung_kw ? Number(primaryBoat.motorleistung_kw) : undefined,
    titelVN: customer.titel, vorname: customer.vorname, nachname: customer.nachname,
    adresse: customer.adresse, geburtsdatum: customer.geburtsdatum, email: customer.email, telefon: customer.telefon,
  };


  const savePolizze = async (vertrag) => {
    await onAddVertrag(customer, vertrag);
    setNextStepMode(null);
  };

  const openAnschreiben = (generator) => {
    setAnschreibenText(generator(customer, primaryBoat));
    setAnschreibenCopied(false);
  };
  const copyAnschreiben = async () => {
    try { await navigator.clipboard.writeText(anschreibenText); setAnschreibenCopied(true); } catch (e) { setAnschreibenCopied(false); }
  };


  const nextStepBanner = () => {
    if (nextStepMode) return null;
    if (customer.status === "polizze") {
      return (
        <div className="nextstep-banner nextstep-banner--done">
          <Check size={16} />
          <span>Polizze aktiv.</span>
          <div className="nextstep-actions">
            <button type="button" className="btn btn--primary btn--sm" onClick={() => openAnschreiben(generatePolizzeMail)}><Mail size={13} /> Polizze-Mail vorbereiten</button>
            <button type="button" className="btn btn--sm" onClick={() => setNextStepMode("polizze")}><FileCheck2 size={13} /> Weitere Sparte erfassen</button>
          </div>
        </div>
      );
    }
    if (customer.status === "antrag") {
      return (
        <div className="nextstep-banner">
          <span className="nextstep-label">Nächster Schritt</span>
          <span className="nextstep-text">Angebot von der Versicherung da? Anschreiben vorbereiten und zusammen mit dem Angebot an den Kunden zur Unterschrift schicken. Sobald die Polizze zurück ist, hier erfassen.</span>
          <div className="nextstep-actions">
            <button type="button" className="btn btn--sm" onClick={() => openAnschreiben(generateAntragAnschreiben)}><Mail size={13} /> Anschreiben vorbereiten</button>
            <button type="button" className="btn btn--primary btn--sm" onClick={() => setNextStepMode("polizze")}><FileCheck2 size={13} /> Polizze erfassen</button>
          </div>
        </div>
      );
    }
    // offert oder kein Status
    return (
      <div className="nextstep-banner">
        <span className="nextstep-label">Nächster Schritt</span>
        <span className="nextstep-text">Angebot steht — jetzt direkt hier den Antrag stellen (Bootsdaten sind schon vorausgefüllt).</span>
        <div className="nextstep-actions">
          <button type="button" className="btn btn--primary btn--sm" onClick={() => setNextStepMode("nautima")}><FileCheck2 size={13} /> NAUTIMA-Antrag</button>
          <button type="button" className="btn btn--sm" onClick={() => setNextStepMode("bootsdatenblatt")}><FileText size={13} /> Bootsdatenblatt</button>
        </div>
      </div>
    );
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
        <button className={subTab === "uebersicht" ? "subtab subtab--active" : "subtab"} onClick={() => setSubTab("uebersicht")}>Übersicht</button>
        <button className={subTab === "boote" ? "subtab subtab--active" : "subtab"} onClick={() => setSubTab("boote")}>
          <Ship size={13} /> Boote{boats.length > 0 ? ` (${boats.length})` : ""}
        </button>
        <button className={subTab === "historie" ? "subtab subtab--active" : "subtab"} onClick={() => setSubTab("historie")}>
          <Calendar size={13} /> Historie{customer.historie?.length > 0 ? ` (${customer.historie.length})` : ""}
        </button>
        <button className={subTab === "dokumente" ? "subtab subtab--active" : "subtab"} onClick={() => setSubTab("dokumente")}>
          <FileText size={13} /> Dokumente
        </button>
      </div>

      {subTab === "uebersicht" && (
        <>
          {nextStepBanner()}
          {anschreibenText && (
            <div className="output-box" style={{ marginBottom: 16 }}>
              <p className="output-instructions"><strong>Fast fertig:</strong> Text kopieren, hier im Chat einfügen und mir das Versicherungs-Angebot als Datei mitgeben — ich lege daraus den Outlook-Entwurf mit Anhang an.</p>
              <textarea className="output-textarea" readOnly value={anschreibenText} onFocus={(e) => e.target.select()} rows={10} />
              <button type="button" className="copy-btn" onClick={copyAnschreiben}>
                {anschreibenCopied ? <Check size={15} /> : <Copy size={15} />} {anschreibenCopied ? "Kopiert!" : "Text kopieren"}
              </button>
            </div>
          )}
          {nextStepMode === "nautima" && (
            <div className="panel embed-panel">
              <div className="embed-panel-head">
                <h3 className="panel-subtitle" style={{ marginTop: 0 }}><FileCheck2 size={15} /> NAUTIMA-Antrag für {fullName(customer)}</h3>
                <button className="icon-btn" onClick={() => setNextStepMode(null)} title="Schließen"><X size={16} /></button>
              </div>
              <NautimaAntragTab customers={[customer]} prefill={nautimaPrefill} onCustomersChanged={onCustomersChanged} />
            </div>
          )}
          {nextStepMode === "bootsdatenblatt" && (
            <div className="panel embed-panel">
              <div className="embed-panel-head">
                <h3 className="panel-subtitle" style={{ marginTop: 0 }}><FileText size={15} /> Bootsdatenblatt für {fullName(customer)}</h3>
                <button className="icon-btn" onClick={() => setNextStepMode(null)} title="Schließen"><X size={16} /></button>
              </div>
              <CallidusDatenblattTab customers={[customer]} prefill={callidusPrefill} onCustomersChanged={onCustomersChanged} />
            </div>
          )}
          {nextStepMode === "polizze" && (
            <PolizzeErfassenForm onCancel={() => setNextStepMode(null)} onSave={savePolizze} />
          )}

          <div className="detail-grid">
            {customer.email && <div><span className="detail-label">E-Mail</span><span>{customer.email}</span></div>}
            {customer.telefon && <div><span className="detail-label">Telefon</span><span>{customer.telefon}</span></div>}
            {customer.geburtsdatum && <div><span className="detail-label">Geburtsdatum</span><span>{customer.geburtsdatum}</span></div>}
            {customer.adresse && <div><span className="detail-label">Adresse</span><span>{customer.adresse}</span></div>}
            {!customer.email && !customer.telefon && customer.kontakt && <div><span className="detail-label">Kontakt</span><span>{customer.kontakt}</span></div>}
            {customer.partner_id && (
              <div>
                <span className="detail-label">Partner / Vermittler</span>
                <span>{(partners || []).find((p) => p.id === customer.partner_id)?.name || "—"}{customer.provision != null ? ` · ${customer.provision}% Provision` : ""}</span>
              </div>
            )}
            {customer.quelle && <div><span className="detail-label">Quelle</span><span>{customer.quelle}</span></div>}
            {customer.vorversicherung_hauptfaelligkeit && (
              <div>
                <span className="detail-label">Vorversicherung</span>
                <span>{customer.vorversicherung_versicherer || "—"} · Hauptfälligkeit {new Date(customer.vorversicherung_hauptfaelligkeit).toLocaleDateString("de-AT")}</span>
              </div>
            )}
          </div>
          {customer.vorversicherung_hauptfaelligkeit && (() => {
            const frist = berechneKuendigungsfrist(customer.vorversicherung_hauptfaelligkeit);
            if (!frist) return null;
            const tageBis = Math.round((frist - new Date()) / 86400000);
            const dringend = tageBis <= 42;
            return (
              <div className={dringend ? "warnbox" : "nextstep-banner"} style={{ marginBottom: 14, flexWrap: "wrap" }}>
                <AlertTriangle size={15} />
                <span style={{ flex: 1 }}>
                  Kündigungsfrist Vorversicherung: <strong>{frist.toLocaleDateString("de-AT")}</strong>
                  {tageBis >= 0 ? ` (noch ${tageBis} Tage)` : ` — bereits überschritten`}
                </span>
                <button type="button" className="btn btn--sm" onClick={() => openAnschreiben((c) => generateKuendigungsschreiben(c))}>
                  <FileText size={13} /> Kündigungsschreiben vorbereiten
                </button>
              </div>
            );
          })()}
          {(customer.vorversicherung_versicherer || customer.vorversicherung_praemie != null) && (
            <VergleichPanel customer={customer} primaryBoat={primaryBoat} />
          )}
          {customer.notizen && <p className="detail-notes">{customer.notizen}</p>}

          {customer.vertraege?.length > 0 && (
            <>
              <div className="section-head-row">
                <h3 className="panel-subtitle" style={{ margin: 0 }}><FileCheck2 size={15} /> Polizzen</h3>
                {customer.vertraege.length > 1 && (
                  <span className="vertraege-summary">
                    {customer.vertraege.length} Verträge · {euro(customer.vertraege.reduce((sum, v) => sum + vertragTotal(v), 0))} / Jahr gesamt
                  </span>
                )}
              </div>
              {customer.vertraege.map((v) => <VertragCard key={v.id} vertrag={v} />)}
            </>
          )}

          {customer.antraege?.length > 0 && (
            <>
              <h3 className="panel-subtitle"><FileCheck2 size={15} /> Anträge &amp; Bootsdatenblätter (vollständig)</h3>
              {customer.antraege.map((a) => <AntragCard key={a.id} antrag={a} />)}
            </>
          )}

          {customer.quotes?.length > 0 && (
            <div className="quotes-block">
              <h3 className="panel-subtitle">Gespeicherte Prämienberechnungen</h3>
              {customer.quotes.map((q) => (
                <div key={q.id} className="quote-row">
                  <span>{new Date(q.erstellt).toLocaleDateString("de-AT")} · {q.bootstyp} · {euro(q.versicherungssumme)}{q.quelle ? ` · ${q.quelle}` : ""}</span>
                  <span className="quote-values">
                    {q.nautima != null && `NAUTIMA ${euro(q.nautima)}`}
                    {q.nautima != null && q.callidus != null && " · "}
                    {q.callidus != null && `Callidus ${euro(q.callidus)}`}
                  </span>
                </div>
              ))}
            </div>
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
        <HistorieList customer={customer} onAdd={(typ, text) => onAddHistorie(customer, typ, text)} />
      )}

      {subTab === "dokumente" && (
        <DokumenteTab customer={customer} onCustomersChanged={onCustomersChanged} />
      )}
    </div>
  );
}
