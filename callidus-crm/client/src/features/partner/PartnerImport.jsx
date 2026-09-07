import { useState } from "react";
import { Upload, Loader2, Check } from "lucide-react";
import api from "../../api.js";

// Aus BootsCRM_reference.jsx. Statt window.storage.list("partner:") und
// einzelnem Nachladen wird die bestehende Liste einmal über api.partners.list()
// geholt; der Namensabgleich und die Übernahmelogik sind unverändert.
export default function PartnerImport({ onImported }) {
  const [rawText, setRawText] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setMsg("");
    let data;
    try {
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/) || rawText.match(/(\[[\s\S]*\])/);
      data = JSON.parse(jsonMatch ? jsonMatch[1] : rawText);
    } catch (e) {
      setMsg("Konnte den Text nicht als JSON lesen.");
      return;
    }
    const list = Array.isArray(data) ? data : [data];
    setBusy(true);
    try {
      const all = await api.partners.list();
      let created = 0, updated = 0;
      for (const entry of list) {
        if (!entry.name) continue;
        const existing = all.find((p) => p.name.trim().toLowerCase() === String(entry.name).trim().toLowerCase());
        await api.partners.save({
          ...(existing ? { id: existing.id } : {}),
          nummer: entry.nummer ?? existing?.nummer ?? "",
          name: entry.name,
          typ: entry.typ || existing?.typ || "Versicherungsmakler",
          bootsbauer_typ: entry.bootsbauer_typ || entry.bootsbauerTyp || existing?.bootsbauer_typ || [],
          iban: entry.iban || existing?.iban || "",
          email: entry.email || existing?.email || "",
          adresse: entry.adresse || existing?.adresse || "",
          plz_ort: entry.plz_ort || entry.plzOrt || existing?.plz_ort || "",
        });
        if (existing) updated++; else created++;
      }
      setMsg(`${created} Partner neu angelegt, ${updated} aktualisiert.`);
      setRawText("");
      if (onImported) await onImported();
    } catch (e) {
      setMsg("Import fehlgeschlagen: " + (e?.message || "unbekannter Fehler"));
    }
    setBusy(false);
  };

  return (
    <div className="panel">
      <h2 className="panel-title"><Upload size={18} /> Partner importieren</h2>
      <p className="import-hint">
        JSON-Array mit Partnerdaten hier einfügen (Abgleich über den Namen — vorhandene Partner werden
        aktualisiert, neue angelegt).
      </p>
      <textarea className="import-textarea" rows={6} placeholder="Hier einfügen…" value={rawText} onChange={(e) => setRawText(e.target.value)} />
      <div className="form-actions" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="btn btn--primary" onClick={run} disabled={!rawText.trim() || busy}>
          {busy ? <Loader2 size={14} className="spin" /> : <Upload size={14} />} Importieren
        </button>
      </div>
      {msg && <div className="save-confirm" style={{ marginTop: 10 }}><Check size={14} /> {msg}</div>}
    </div>
  );
}
