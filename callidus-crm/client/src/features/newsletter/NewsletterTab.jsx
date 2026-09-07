// NewsletterTab — aus BootsCRM_reference.jsx (Zeilen 3952-4110),
// programmatisch ausgeschnitten und inhaltlich unverändert. Reine
// Frontend-Logik: Empfänger kommen aus den ohnehin geladenen Listen, am Ende
// entsteht ein Text zum Kopieren. Kein eigener Endpunkt nötig, so vorgesehen
// in PROMPTS.md (Prompt 8).
import { useState, useEffect, useMemo } from "react";
import { Mail, Users, Eye, Info, FileCheck2, Check, Copy } from "lucide-react";
import { Field } from "../../components/ui.jsx";
import StatusBadge from "../kunden/StatusBadge.jsx";
import { fullName, statusInfo, STATUS_OPTIONS } from "../kunden/helpers.js";
import { PARTNER_TYPES, partnerTypeLabel } from "../partner/helpers.js";

export default function NewsletterTab({ customers, partners }) {
  const [audience, setAudience] = useState("kunden"); // kunden | partner
  const [betreff, setBetreff] = useState("");
  const [nachricht, setNachricht] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle"); // Kunden: alle | offert | antrag | polizze
  const [typFilter, setTypFilter] = useState("alle"); // Partner: alle | Versicherungsmakler | ...
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [outputText, setOutputText] = useState("");
  const [copied, setCopied] = useState(false);

  const pool = audience === "kunden" ? (customers || []) : (partners || []);
  const withEmail = useMemo(() => pool.filter((c) => c.email && c.email.trim()), [pool]);
  const filtered = useMemo(() => {
    if (audience === "kunden") return statusFilter === "alle" ? withEmail : withEmail.filter((c) => c.status === statusFilter);
    return typFilter === "alle" ? withEmail : withEmail.filter((p) => p.typ === typFilter);
  }, [withEmail, statusFilter, typFilter, audience]);

  useEffect(() => {
    setSelectedIds(new Set(filtered.map((c) => c.id)));
  }, [statusFilter, typFilter, audience]); // eslint-disable-line
  useEffect(() => {
    setSelectedIds((prev) => (prev.size === 0 && filtered.length > 0 ? new Set(filtered.map((c) => c.id)) : prev));
  }, [filtered]); // eslint-disable-line

  const toggle = (id) => setSelectedIds((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const selectAll = () => setSelectedIds(new Set(filtered.map((c) => c.id)));
  const selectNone = () => setSelectedIds(new Set());

  const recipients = filtered.filter((c) => selectedIds.has(c.id));
  const previewRecipient = recipients[0];

  const merge = (text, r) => (text || "")
    .split("{{Name}}").join((audience === "kunden" ? fullName(r) : r?.name) || "")
    .split("{{Bootsname}}").join(r?.bootsname || "Ihr Boot")
    .split("{{Status}}").join(r ? (statusInfo(r.status)?.label || "") : "")
    .split("{{Typ}}").join(r ? (partnerTypeLabel(r) || "") : "");

  const canSubmit = betreff.trim().length > 0 && nachricht.trim().length > 0 && recipients.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload = audience === "kunden" ? {
      betreff, nachricht, empfaengerart: "kunden",
      empfaenger: recipients.map((c) => ({ name: fullName(c), email: c.email, bootsname: c.bootsname || "", status: c.status || "" })),
    } : {
      betreff, nachricht, empfaengerart: "partner",
      empfaenger: recipients.map((p) => ({ name: p.name, email: p.email, typ: partnerTypeLabel(p) || "" })),
    };
    const platzhalter = audience === "kunden" ? "{{Name}}/{{Bootsname}}/{{Status}}" : "{{Name}}/{{Typ}}";
    const text = `NEWSLETTER (Empfänger: ${audience === "kunden" ? "Kunden" : "Partner"}) — bitte je Empfänger die Platzhalter (${platzhalter}) ersetzen und als Outlook-Entwürfe anlegen; vor dem tatsächlichen Versand bitte kurz bei mir nachfragen:\n\`\`\`json\n` + JSON.stringify(payload, null, 2) + "\n```";
    setOutputText(text);
    setCopied(false);
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(outputText); setCopied(true); } catch (e) { setCopied(false); }
  };

  return (
    <div className="form-tab">
      <div className="info-banner info-banner--inline">
        <Info size={14} />
        <span>Der Versand läuft nicht automatisch aus dieser App. Hier bereitest du Inhalt und Empfängerliste vor — am Ende: Zusammenfassung erzeugen, Text kopieren und hier im Chat einfügen. Ich lege daraus Outlook-Entwürfe an und frage vor dem tatsächlichen Versand nochmal nach.</span>
      </div>

      <div className="panel">
        <h2 className="panel-title"><Mail size={18} /> Newsletter verfassen</h2>
        <Field label="Empfängerkreis" span>
          <div className="radio-row">
            <label className={`radio-pill ${audience === "kunden" ? "radio-pill--active" : ""}`}>
              <input type="radio" name="audience" checked={audience === "kunden"} onChange={() => setAudience("kunden")} />Kunden
            </label>
            <label className={`radio-pill ${audience === "partner" ? "radio-pill--active" : ""}`}>
              <input type="radio" name="audience" checked={audience === "partner"} onChange={() => setAudience("partner")} />Partner
            </label>
          </div>
        </Field>
        <div className="field-grid">
          <Field label="Betreff" span><input value={betreff} onChange={(e) => setBetreff(e.target.value)} placeholder="z. B. Saisonstart 2027 — Ihre Bootsversicherung" /></Field>
        </div>
        <Field label="Nachricht" hint={audience === "kunden" ? "Platzhalter: {{Name}}, {{Bootsname}}, {{Status}}" : "Platzhalter: {{Name}}, {{Typ}}"} span>
          <textarea rows={8} value={nachricht} onChange={(e) => setNachricht(e.target.value)} placeholder={"Liebe/r {{Name}},\n\n..."} />
        </Field>
      </div>

      <div className="panel">
        <h2 className="panel-title"><Users size={18} /> Empfänger</h2>
        <div className="field-grid">
          {audience === "kunden" ? (
            <Field label="Nach Status filtern">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="alle">Alle Kunden mit E-Mail-Adresse</option>
                {STATUS_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </Field>
          ) : (
            <Field label="Nach Typ filtern">
              <select value={typFilter} onChange={(e) => setTypFilter(e.target.value)}>
                <option value="alle">Alle Partner mit E-Mail-Adresse</option>
                {PARTNER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          )}
        </div>
        <p className="field-hint" style={{ margin: "6px 0 10px" }}>
          {withEmail.length} von {pool.length} {audience === "kunden" ? "Kunden" : "Partnern"} haben eine E-Mail-Adresse hinterlegt. {filtered.length} passen zum Filter, {recipients.length} ausgewählt.
        </p>
        <div className="newsletter-actions">
          <button type="button" className="btn btn--sm" onClick={selectAll}>Alle auswählen</button>
          <button type="button" className="btn btn--sm" onClick={selectNone}>Keine</button>
        </div>
        <div className="newsletter-recipient-list">
          {filtered.length === 0 && <p className="empty-hint">Keine {audience === "kunden" ? "Kunden" : "Partner"} mit E-Mail-Adresse für diesen Filter.</p>}
          {filtered.map((r) => (
            <label key={r.id} className="newsletter-recipient-row">
              <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggle(r.id)} />
              <span className="newsletter-recipient-name">{audience === "kunden" ? fullName(r) : r.name}</span>
              <span className="newsletter-recipient-email">{r.email}</span>
              {audience === "kunden" ? <StatusBadge status={r.status} /> : <span className="tab-badge" style={{ background: "var(--sea)" }}>{r.typ}</span>}
            </label>
          ))}
        </div>
      </div>

      {previewRecipient && (nachricht || betreff) && (
        <div className="panel">
          <h2 className="panel-title"><Eye size={18} /> Vorschau (für {audience === "kunden" ? fullName(previewRecipient) : previewRecipient.name})</h2>
          <div className="newsletter-preview">
            <div className="newsletter-preview-subject">{merge(betreff, previewRecipient) || "(kein Betreff)"}</div>
            <div className="newsletter-preview-body">{merge(nachricht, previewRecipient) || "(keine Nachricht)"}</div>
          </div>
        </div>
      )}

      <button type="button" className="submit-btn" disabled={!canSubmit} onClick={handleSubmit}>
        <FileCheck2 size={16} /> Zusammenfassung erzeugen ({recipients.length} Empfänger)
      </button>
      {!canSubmit && <p className="hint-text">Bitte Betreff, Nachricht und mindestens einen Empfänger angeben.</p>}

      {outputText && (
        <div className="output-box">
          <p className="output-instructions">
            <strong>Fast fertig:</strong> Text unten kopieren und hier im Chat als Nachricht einfügen — ich lege dann die Outlook-Entwürfe an bzw. frage vor dem Versand kurz nach.
          </p>
          <textarea className="output-textarea" readOnly value={outputText} onFocus={(e) => e.target.select()} rows={10} />
          <button type="button" className="copy-btn" onClick={handleCopy}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "Kopiert!" : "Text kopieren"}
          </button>
        </div>
      )}
    </div>
  );
}

