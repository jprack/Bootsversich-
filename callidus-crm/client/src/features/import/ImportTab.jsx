// ImportTab — aus BootsCRM_reference.jsx (Zeilen 2632-2830). Die Oberfläche
// und der Namens-/Adressabgleich sind unverändert; umgestellt sind analyze()
// und importOne() auf api.customers statt window.storage.
//
// Zwei Dinge sind dabei mehr als ein Austausch der Ablage: Das frühere
// risiko-Objekt am Kunden wird ein Eintrag in der Tabelle boats, und ein
// mitgeliefertes Dokument wird eine echte Datei unter server/uploads/
// statt Base64 im Datensatz.
import { useState } from "react";
import { Mail, AlertTriangle, Check, Loader2 } from "lucide-react";
import api from "../../api.js";
import { Field } from "../../components/ui.jsx";
import { fullName, splitFullName, getBoats, STATUS_OPTIONS } from "../kunden/helpers.js";
import { findCustomerMatches } from "../kunden/matching.js";

// Nur für React-Schlüssel in der Vorschauliste — Datensatz-IDs vergibt der Server.
const uid = () => Math.random().toString(36).slice(2, 10);

// Die Schlüssel des alten risiko-Objekts auf die Spalten von boats abbilden.
const RISIKO_ZU_BOOT = {
  bootstyp: "bootstyp", registrierungsland: "registrierungsland", werft: "werft",
  hersteller: "hersteller", modell: "modell", yachttyp: "yachttyp", baujahr: "baujahr",
  laenge: "laenge", breite: "breite", tiefgang: "tiefgang", rumpfmaterial: "rumpfmaterial",
  mastmaterial: "mastmaterial", segelflaeche: "segelflaeche", motortyp: "motortyp",
  motorleistungKW: "motorleistung_kw", motorleistung_kw: "motorleistung_kw",
  herstellerMotor: "hersteller_motor", hersteller_motor: "hersteller_motor",
  fahrtgebiet: "fahrtgebiet", charter: "charter",
};

function risikoAlsBoot(parsed) {
  const felder = {};
  for (const [k, v] of Object.entries(parsed.risiko || {})) {
    const spalte = RISIKO_ZU_BOOT[k];
    if (spalte && v !== "" && v != null && v !== false) felder[spalte] = String(v);
  }
  if (parsed.bootsname) felder.name = parsed.bootsname;
  if (!felder.bootstyp && parsed.bootstyp) felder.bootstyp = parsed.bootstyp;
  return felder;
}

// Base64 aus dem eingefügten JSON in eine echte Datei für den Upload.
function dateiAusBase64({ dataBase64, filename, mimeType }) {
  const roh = atob(dataBase64);
  const bytes = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i);
  return new File([bytes], filename || "Polizze.pdf", { type: mimeType || "application/pdf" });
}

export default function ImportTab({ onCustomersChanged }) {
  const [rawText, setRawText] = useState("");
  const [items, setItems] = useState([]); // [{ tempId, data, candidates, choice, status, saving, done, error }]
  const [parseError, setParseError] = useState("");
  const [bulkRunning, setBulkRunning] = useState(false);

  const analyze = async () => {
    setParseError("");
    let data;
    try {
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/) || rawText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      data = JSON.parse(jsonMatch ? jsonMatch[1] : rawText);
    } catch (e) {
      setParseError("Konnte den Text nicht als JSON lesen. Bitte den kompletten Block (inkl. { } bzw. [ ]) einfügen.");
      setItems([]);
      return;
    }
    const list = Array.isArray(data) ? data : [data];
    let all = [];
    try { all = await api.customers.list(); } catch (e) { /* ohne Abgleich weiter */ }
    setItems(list.map((entry) => {
      const m = findCustomerMatches(all, { name: entry.name, vorname: entry.vorname, nachname: entry.nachname, titel: entry.titel, adresse: entry.adresse });
      return {
        tempId: uid(), data: entry, candidates: m,
        choice: m.exact ? m.exact.id : "neu",
        status: entry.status || "polizze",
        saving: false, done: null, error: "",
      };
    }));
  };

  const updateItem = (tempId, patch) => setItems((its) => its.map((it) => (it.tempId === tempId ? { ...it, ...patch } : it)));

  const importOne = async (item) => {
    updateItem(item.tempId, { saving: true, error: "" });
    try {
      const parsed = item.data;
      const parsedSplit = (parsed.vorname || parsed.nachname) ? null : splitFullName(parsed.name || "");
      const parsedTitel = parsed.titel ?? parsedSplit?.titel ?? "";
      const parsedVorname = parsed.vorname ?? parsedSplit?.vorname ?? "";
      const parsedNachname = parsed.nachname ?? parsedSplit?.nachname ?? (parsed.name || "Unbekannt");

      // Bestehende Angaben werden nicht überschrieben, nur Lücken gefüllt —
      // wie in BootsCRM_reference.jsx.
      let kunde;
      if (item.choice !== "neu") {
        const vorhanden = await api.customers.get(item.choice);
        kunde = await api.customers.save({
          id: vorhanden.id,
          titel: vorhanden.titel || parsedTitel,
          vorname: vorhanden.vorname || parsedVorname,
          nachname: vorhanden.nachname || parsedNachname,
          adresse: vorhanden.adresse || parsed.adresse || "",
          geburtsdatum: vorhanden.geburtsdatum || parsed.geburtsdatum || "",
          email: vorhanden.email || parsed.email || "",
          telefon: vorhanden.telefon || parsed.telefon || "",
          bootsname: vorhanden.bootsname || parsed.bootsname || "",
          bootstyp: vorhanden.bootstyp || parsed.bootstyp || "Motorboot",
          status: item.status || vorhanden.status,
          notizen: parsed.notizen
            ? `${vorhanden.notizen ? vorhanden.notizen + "\n" : ""}${parsed.notizen}`
            : vorhanden.notizen,
        });
      } else {
        kunde = await api.customers.save({
          titel: parsedTitel, vorname: parsedVorname, nachname: parsedNachname,
          adresse: parsed.adresse || "", geburtsdatum: parsed.geburtsdatum || "",
          email: parsed.email || "", telefon: parsed.telefon || "",
          bootsname: parsed.bootsname || "", bootstyp: parsed.bootstyp || "Motorboot",
          status: item.status || "", notizen: parsed.notizen || "",
        });
      }

      // Das frühere risiko-Objekt ist jetzt ein Boot.
      const bootsfelder = risikoAlsBoot(parsed);
      if (Object.keys(bootsfelder).length > 0) {
        const boote = getBoats(kunde).filter((b) => b.id !== "legacy");
        if (boote.length === 0) await api.customers.addBoat(kunde.id, bootsfelder);
        else await api.customers.updateBoat({ id: boote[0].id, ...bootsfelder });
      }

      // Ein mitgelieferter Vertrag wird IMMER angehängt, nie überschrieben —
      // ein Kunde kann mehrere Policen über die Zeit ansammeln.
      if (parsed.vertrag?.sparten?.length > 0) {
        await api.customers.addVertrag(kunde.id, parsed.vertrag);
      }

      // Ein mitgeliefertes Dokument wird jetzt eine echte Datei.
      if (parsed.dokument?.dataBase64) {
        await api.customers.uploadDocuments(kunde.id, [dateiAusBase64(parsed.dokument)]);
      }

      updateItem(item.tempId, { saving: false, done: { customerId: kunde.id, name: fullName(kunde), isNew: item.choice === "neu" } });
      if (onCustomersChanged) await onCustomersChanged();
    } catch (e) {
      updateItem(item.tempId, { saving: false, error: "Import fehlgeschlagen: " + (e?.message || "unbekannter Fehler") });
    }
  };

  const importAll = async () => {
    setBulkRunning(true);
    for (const item of items) {
      if (!item.done) {
        await importOne(item);
        await new Promise((r) => setTimeout(r, 250)); // kleine Pause zwischen den Speichervorgängen
      }
    }
    setBulkRunning(false);
  };

  const pendingCount = items.filter((it) => !it.done).length;

  return (
    <div className="panel">
      <h2 className="panel-title"><Mail size={18} /> Aus Mail importieren</h2>
      <p className="import-hint">
        Text (JSON, ein Objekt oder eine Liste mehrerer Objekte in [ ]) von Claude hier einfügen — z. B. Kundendaten + Polizze/Antrag/Offert aus Outlook-Mails. Kunden werden anhand von Name UND Adresse mit bestehenden Einträgen abgeglichen.
      </p>
      <textarea className="import-textarea" rows={8} placeholder="Hier einfügen…" value={rawText} onChange={(e) => setRawText(e.target.value)} />
      <div className="form-actions" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="btn btn--primary" onClick={analyze} disabled={!rawText.trim()}>Analysieren</button>
      </div>

      {parseError && <div className="warnbox" style={{ marginTop: 12 }}><AlertTriangle size={15} /> {parseError}</div>}

      {items.length > 0 && (
        <div className="import-review">
          <div className="import-batch-head">
            <h3 className="panel-subtitle" style={{ marginTop: 18 }}>{items.length > 1 ? `${items.length} Einträge erkannt` : "Erkannt"}</h3>
            {items.length > 1 && (
              <button className="btn btn--primary" onClick={importAll} disabled={bulkRunning || pendingCount === 0}>
                {bulkRunning ? <Loader2 size={14} className="spin" /> : <Check size={14} />} Alle übernehmen ({pendingCount})
              </button>
            )}
          </div>

          {items.map((item) => (
            <div key={item.tempId} className={`import-item ${item.done ? "import-item--done" : ""}`}>
              <div className="detail-grid" style={{ marginBottom: 8 }}>
                <div><span className="detail-label">Name</span><span>{fullName(item.data) || item.data.name || "—"}</span></div>
                <div><span className="detail-label">Adresse</span><span>{item.data.adresse || "—"}</span></div>
                {item.data.bootsname && <div><span className="detail-label">Boot</span><span>{item.data.bootsname}</span></div>}
                {item.data.vertrag?.versicherer && <div><span className="detail-label">Versicherer</span><span>{item.data.vertrag.versicherer}</span></div>}
                {item.data.vertrag?.sparten?.length > 0 && <div><span className="detail-label">Sparten</span><span>{item.data.vertrag.sparten.map((s) => s.sparte).join(", ")}</span></div>}
              </div>

              {item.candidates.exact && !item.done && (
                <div className="warnbox" style={{ background: "rgba(28,107,95,0.1)", color: "var(--sea)" }}>
                  <Check size={15} /> Übereinstimmung (Name + Adresse): <strong>&nbsp;{fullName(item.candidates.exact)}</strong> — wird aktualisiert.
                </div>
              )}
              {!item.candidates.exact && item.candidates.possible.length > 0 && !item.done && (
                <div className="warnbox"><AlertTriangle size={15} /> Möglicher Treffer nur bei Name ODER Adresse — bitte prüfen.</div>
              )}
              {item.error && <div className="warnbox"><AlertTriangle size={15} /> {item.error}</div>}

              {!item.done ? (
                <>
                  <div className="field-grid">
                    <Field label="Kunde">
                      <select value={item.choice} onChange={(e) => updateItem(item.tempId, { choice: e.target.value })}>
                        <option value="neu">Neuen Kunden anlegen</option>
                        {(item.candidates.exact ? [item.candidates.exact] : item.candidates.possible).map((c) => (
                          <option key={c.id} value={c.id}>Verknüpfen mit: {fullName(c)}{c.adresse ? ` (${c.adresse})` : ""}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Status setzen">
                      <select value={item.status} onChange={(e) => updateItem(item.tempId, { status: e.target.value })}>
                        <option value="">— kein Status —</option>
                        {STATUS_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="form-actions" style={{ justifyContent: "flex-start" }}>
                    <button className="btn btn--primary" onClick={() => importOne(item)} disabled={item.saving}>
                      {item.saving ? <Loader2 size={14} className="spin" /> : <Check size={14} />} Übernehmen
                    </button>
                  </div>
                </>
              ) : (
                <div className="save-confirm"><Check size={14} /> {item.done.isNew ? "Neuer Kunde angelegt" : "Kunde aktualisiert"}: {item.done.name}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===================== NAUTIMA-Antrag Tab ===================== */
