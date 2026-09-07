// ZielTracker und QuickLeadForm — aus BootsCRM_reference.jsx (Zeilen
// 2270-2412, getWeekBounds aus 405-414), programmatisch ausgeschnitten.
//
// Umgestellt ist nur die Ablage: das Wochenziel liegt in der Tabelle
// settings, die Offert-Zählung dieser Woche kommt aus api.tasks. Die
// Berechnung von Ziel und Trichter läuft weiterhin im Frontend über die
// ohnehin geladene Kundenliste, so vorgesehen in PROMPTS.md (Prompt 9).
import { useState, useEffect } from "react";
import { Check, Plus, Loader2 } from "lucide-react";
import api from "../../api.js";
import { splitFullName, STATUS_OPTIONS, QUELLE_OPTIONS } from "./helpers.js";

function getWeekBounds(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=So .. 6=Sa
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const nextMonday = new Date(monday.getTime() + 7 * 86400000);
  return { start: monday, end: nextMonday };
}


export function QuickLeadForm({ onCancel, onSave }) {
  const [name, setName] = useState("");
  const [kontakt, setKontakt] = useState("");
  const [quelle, setQuelle] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = name.trim().length > 0;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    const split = splitFullName(name);
    const isEmail = kontakt.includes("@");
    await onSave({
      titel: split.titel, vorname: split.vorname, nachname: split.nachname,
      email: isEmail ? kontakt.trim() : "", telefon: !isEmail ? kontakt.trim() : "",
      quelle, status: "", adresse: "", geburtsdatum: "", bootsname: "", bootstyp: "Motorboot", notizen: "",
    });
    setSaving(false);
  };

  return (
    <form className="panel quicklead-form" onSubmit={submit}>
      <h3 className="panel-subtitle" style={{ marginTop: 0 }}><Plus size={15} /> Schnell-Lead erfassen</h3>
      <p className="field-hint" style={{ marginBottom: 10 }}>Nur das Nötigste — Details kannst du später beim Kunden nachtragen.</p>
      <div className="quicklead-row">
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <input placeholder="Telefon oder E-Mail" value={kontakt} onChange={(e) => setKontakt(e.target.value)} />
        <select value={quelle} onChange={(e) => setQuelle(e.target.value)}>
          <option value="">Quelle…</option>
          {QUELLE_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
        </select>
        <button type="submit" className="btn btn--primary" disabled={!canSubmit || saving}>
          {saving ? <Loader2 size={14} className="spin" /> : <Check size={14} />} Erfassen
        </button>
        <button type="button" className="btn" onClick={onCancel}>Abbrechen</button>
      </div>
    </form>
  );
}


export default function ZielTracker({ customers }) {
  const [ziel, setZiel] = useState(1);
  const [editingZiel, setEditingZiel] = useState(false);
  const [zielInput, setZielInput] = useState("1");
  const [taskCreatedThisWeek, setTaskCreatedThisWeek] = useState(0);

  useEffect(() => {
    (async () => {
      const gespeichert = await api.settings.get("wochenziel");
      const n = Number(gespeichert);
      if (n > 0) { setZiel(n); setZielInput(String(n)); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { start, end } = getWeekBounds();
        const seenCustomers = new Set();
        for (const t of await api.tasks.list()) {
          if (t.titel?.startsWith("Angebot nachfassen") && t.erstellt) {
            const d = new Date(t.erstellt);
            if (d >= start && d < end) seenCustomers.add(t.customer_id);
          }
        }
        setTaskCreatedThisWeek(seenCustomers.size);
      } catch (e) {}
    })();
  }, [customers]);

  const saveZiel = async () => {
    const n = Math.max(1, Number(zielInput) || 1);
    setZiel(n);
    setEditingZiel(false);
    try { await api.settings.set("wochenziel", n); } catch (e) {}
  };

  const { start, end } = getWeekBounds();
  const polizzenDieseWoche = customers.reduce((sum, c) => {
    const count = (c.vertraege || []).filter((v) => v.erstellt && new Date(v.erstellt) >= start && new Date(v.erstellt) < end).length;
    return sum + count;
  }, 0);

  const pct = Math.min(100, Math.round((polizzenDieseWoche / ziel) * 100));
  const reached = polizzenDieseWoche >= ziel;

  const offertCount = customers.filter((c) => c.status === "offert").length;
  const antragCount = customers.filter((c) => c.status === "antrag").length;
  const polizzeCount = customers.filter((c) => c.status === "polizze").length;
  const pipelineTotal = offertCount + antragCount + polizzeCount;
  const antragRate = offertCount > 0 ? Math.round((antragCount + polizzeCount) / (offertCount + antragCount + polizzeCount) * 100) : null;
  const polizzeRate = (offertCount + antragCount + polizzeCount) > 0 ? Math.round(polizzeCount / (offertCount + antragCount + polizzeCount) * 100) : null;

  return (
    <div className="ziel-panel">
      <div className="ziel-row">
        <div className="ziel-goal">
          <div className="ziel-goal-head">
            <span className="ziel-label">Wochenziel</span>
            {editingZiel ? (
              <span className="ziel-edit">
                <input type="number" min="1" value={zielInput} onChange={(e) => setZielInput(e.target.value)} style={{ width: 48 }} />
                <button type="button" className="btn btn--sm" onClick={saveZiel}>OK</button>
              </span>
            ) : (
              <button type="button" className="ziel-edit-link" onClick={() => setEditingZiel(true)}>Ziel ändern</button>
            )}
          </div>
          <div className="ziel-progress-row">
            <span className={`ziel-count ${reached ? "ziel-count--reached" : ""}`}>{polizzenDieseWoche} / {ziel}</span>
            <span className="ziel-progress-track"><span className="ziel-progress-fill" style={{ width: `${pct}%`, background: reached ? "#6FE3A6" : "#0F6EBE" }} /></span>
            {reached && <Check size={16} className="ziel-check" />}
          </div>
          <span className="ziel-hint">neue Polizzen diese Woche (Mo–So) · {taskCreatedThisWeek} neue Offerte diese Woche</span>
        </div>

        <div className="ziel-funnel">
          <span className="ziel-label">Pipeline gerade</span>
          <div className="funnel-row">
            <div className="funnel-stage" style={{ "--stage-color": "#41505A" }}>
              <span className="funnel-count">{offertCount}</span><span className="funnel-name">Offert</span>
            </div>
            <span className="funnel-arrow">→{antragRate != null && <span className="funnel-rate">{antragRate}%</span>}</span>
            <div className="funnel-stage" style={{ "--stage-color": "#0F6EBE" }}>
              <span className="funnel-count">{antragCount}</span><span className="funnel-name">Antrag</span>
            </div>
            <span className="funnel-arrow">→{polizzeRate != null && <span className="funnel-rate">{polizzeRate}%</span>}</span>
            <div className="funnel-stage" style={{ "--stage-color": "#032856" }}>
              <span className="funnel-count">{polizzeCount}</span><span className="funnel-name">Polizze</span>
            </div>
          </div>
          {pipelineTotal > 0 && <span className="ziel-hint">Anteile bezogen auf {pipelineTotal} Kunden aktuell in Offert/Antrag/Polizze</span>}
        </div>
      </div>
    </div>
  );
}

