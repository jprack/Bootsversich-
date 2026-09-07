// PolizzeErfassenForm — aus BootsCRM_reference.jsx (Zeilen 1559-1629),
// programmatisch ausgeschnitten. Einzige Änderung: id und Zeitstempel des
// Vertrags vergibt jetzt der Server (crypto.randomUUID, datetime('now')),
// nicht mehr der Browser.
import { useState } from "react";
import { FileCheck2, Plus, X } from "lucide-react";
import { Field } from "../../components/ui.jsx";

export default function PolizzeErfassenForm({ onCancel, onSave }) {
  const [versicherer, setVersicherer] = useState("");
  const [polizzennummer, setPolizzennummer] = useState("");
  const [versicherungsbeginn, setVersicherungsbeginn] = useState("");
  const [hauptfaelligkeit, setHauptfaelligkeit] = useState("");
  const [zahlweise, setZahlweise] = useState("Jährlich");
  const [sparten, setSparten] = useState([{ sparte: "Kasko", versicherungssumme: "", selbstbehalt: "", praemie: "" }]);
  const [notizen, setNotizen] = useState("");

  const updateSparte = (i, patch) => setSparten((s) => s.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const addSparte = () => setSparten((s) => [...s, { sparte: "Haftpflicht", versicherungssumme: "", selbstbehalt: "", praemie: "" }]);
  const removeSparte = (i) => setSparten((s) => s.filter((_, idx) => idx !== i));

  const canSubmit = versicherer.trim() && sparten.some((s) => s.sparte.trim() && s.praemie !== "");

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const vertrag = {
      versicherer: versicherer.trim(), polizzennummer: polizzennummer.trim(),
      versicherungsbeginn: versicherungsbeginn.trim(), hauptfaelligkeit: hauptfaelligkeit.trim(), zahlweise,
      sparten: sparten.filter((s) => s.sparte.trim() && s.praemie !== "").map((s) => ({
        sparte: s.sparte.trim(),
        versicherungssumme: s.versicherungssumme !== "" ? Number(s.versicherungssumme) : null,
        selbstbehalt: s.selbstbehalt !== "" ? Number(s.selbstbehalt) : null,
        erstpraemie: Number(s.praemie), folgepraemie: Number(s.praemie),
      })),
      notizen: notizen.trim(),
    };
    onSave(vertrag);
  };

  return (
    <form className="panel" onSubmit={submit} style={{ marginTop: 12 }}>
      <h3 className="panel-subtitle" style={{ marginTop: 0 }}><FileCheck2 size={15} /> Polizze erfassen</h3>
      <div className="field-grid">
        <Field label="Versicherer *"><input value={versicherer} onChange={(e) => setVersicherer(e.target.value)} placeholder="z. B. NAUTIMA / Mannheimer, Callidus-Eigentarif, Wiener Städtische…" /></Field>
        <Field label="Polizzennummer"><input value={polizzennummer} onChange={(e) => setPolizzennummer(e.target.value)} /></Field>
        <Field label="Versicherungsbeginn"><input value={versicherungsbeginn} onChange={(e) => setVersicherungsbeginn(e.target.value)} placeholder="TT.MM.JJJJ" /></Field>
        <Field label="Hauptfälligkeit"><input value={hauptfaelligkeit} onChange={(e) => setHauptfaelligkeit(e.target.value)} placeholder="TT.MM." /></Field>
        <Field label="Zahlweise">
          <select value={zahlweise} onChange={(e) => setZahlweise(e.target.value)}>
            <option>Jährlich</option><option>Halbjährlich</option><option>Vierteljährlich</option><option>Monatlich</option><option>Zahlschein</option>
          </select>
        </Field>
      </div>

      <div className="mini-title">Sparten &amp; Prämien</div>
      <div className="repeat-list">
        {sparten.map((s, i) => (
          <div className="repeat-row" key={i}>
            <input value={s.sparte} onChange={(e) => updateSparte(i, { sparte: e.target.value })} placeholder="Sparte (z. B. Kasko)" style={{ maxWidth: 130 }} />
            <input value={s.versicherungssumme} onChange={(e) => updateSparte(i, { versicherungssumme: e.target.value })} placeholder="Vers.-Summe €" type="number" />
            <input value={s.selbstbehalt} onChange={(e) => updateSparte(i, { selbstbehalt: e.target.value })} placeholder="Selbstbehalt €" type="number" />
            <input value={s.praemie} onChange={(e) => updateSparte(i, { praemie: e.target.value })} placeholder="Prämie €/Jahr *" type="number" />
            {sparten.length > 1 && <button type="button" className="icon-btn icon-btn--danger" onClick={() => removeSparte(i)}><X size={14} /></button>}
          </div>
        ))}
      </div>
      <button type="button" className="btn btn--sm" onClick={addSparte} style={{ marginTop: 8 }}><Plus size={13} /> Weitere Sparte</button>

      <Field label="Notizen" span><textarea rows={2} value={notizen} onChange={(e) => setNotizen(e.target.value)} /></Field>

      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn btn--primary" disabled={!canSubmit}>Polizze speichern</button>
      </div>
    </form>
  );
}

