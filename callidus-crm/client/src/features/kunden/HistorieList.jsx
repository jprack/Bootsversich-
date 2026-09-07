// HistorieList — aus BootsCRM_reference.jsx (Zeilen 1504-1558),
// programmatisch ausgeschnitten und inhaltlich unverändert. Die Einträge
// kommen jetzt verschachtelt mit dem Kunden vom Server.
import { useState } from "react";
import { Phone, Mail, Calendar, FileText, Info, Plus, Loader2 } from "lucide-react";

export const HISTORIE_TYPEN = ["Anruf", "E-Mail", "Termin", "Notiz", "Sonstiges"];

const HISTORIE_ICONS = { "Anruf": Phone, "E-Mail": Mail, "Termin": Calendar, "Notiz": FileText, "Sonstiges": Info };
export default function HistorieList({ customer, onAdd }) {
  const [typ, setTyp] = useState("Anruf");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    await onAdd(typ, text.trim());
    setText("");
    setSaving(false);
  };

  const eintraege = customer.historie || [];

  return (
    <div>
      <form className="historie-form" onSubmit={submit}>
        <select value={typ} onChange={(e) => setTyp(e.target.value)}>
          {HISTORIE_TYPEN.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input placeholder="Was ist passiert? (z. B. „Rückruf vereinbart für Fr. 14 Uhr“)" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" className="btn btn--primary" disabled={!text.trim() || saving}>
          {saving ? <Loader2 size={14} className="spin" /> : <Plus size={14} />} Eintragen
        </button>
      </form>

      {eintraege.length === 0 ? (
        <p className="empty-hint" style={{ marginTop: 14 }}>Noch keine Historie — Anrufe, Termine und Notizen landen hier, ebenso wichtige automatische Ereignisse (Statuswechsel, Polizze erfasst, Antrag erstellt).</p>
      ) : (
        <div className="historie-list">
          {eintraege.map((h) => {
            const Icon = HISTORIE_ICONS[h.typ] || Info;
            return (
              <div key={h.id} className={`historie-item ${h.system ? "historie-item--system" : ""}`}>
                <span className="historie-icon"><Icon size={13} /></span>
                <div className="historie-body">
                  <div className="historie-meta">
                    <span className="historie-typ">{h.typ}</span>
                    <span className="historie-datum">{new Date(h.datum).toLocaleString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="historie-text">{h.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

