import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Field } from "../../components/ui.jsx";
import { splitFullName, berechneKuendigungsfrist, STATUS_OPTIONS, QUELLE_OPTIONS } from "./helpers.js";

// Aus BootsCRM_reference.jsx. Inhaltlich unverändert — nur die Feldnamen
// folgen jetzt schema.sql (partner_id, vorversicherung_*), und beim Speichern
// wird der Datensatz an api.customers.save() gereicht statt an window.storage.
export default function CustomerForm({ initial, onCancel, onSave, partners }) {
  const legacySplit = !initial?.vorname && !initial?.nachname && initial?.name ? splitFullName(initial.name) : null;
  const [titel, setTitel] = useState(initial?.titel || legacySplit?.titel || "");
  const [vorname, setVorname] = useState(initial?.vorname || legacySplit?.vorname || "");
  const [nachname, setNachname] = useState(initial?.nachname || legacySplit?.nachname || "");
  const [geburtsdatum, setGeburtsdatum] = useState(initial?.geburtsdatum || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [telefon, setTelefon] = useState(initial?.telefon || "");
  const [adresse, setAdresse] = useState(initial?.adresse || "");
  const [bootsname, setBootsname] = useState(initial?.bootsname || "");
  const [bootstyp, setBootstyp] = useState(initial?.bootstyp || "Motorboot");
  const [status, setStatus] = useState(initial?.status || "");
  const [notizen, setNotizen] = useState(initial?.notizen || "");
  const [partnerId, setPartnerId] = useState(initial?.partner_id || "");
  const [provision, setProvision] = useState(initial?.provision ?? "");
  const [quelle, setQuelle] = useState(initial?.quelle || "");
  const [vvVersicherer, setVvVersicherer] = useState(initial?.vorversicherung_versicherer || "");
  const [vvPolizzennummer, setVvPolizzennummer] = useState(initial?.vorversicherung_polizzennummer || "");
  const [vvHauptfaelligkeit, setVvHauptfaelligkeit] = useState(initial?.vorversicherung_hauptfaelligkeit || "");
  const [vvPraemie, setVvPraemie] = useState(initial?.vorversicherung_praemie ?? "");

  const submit = (e) => {
    e.preventDefault();
    if (!nachname.trim()) return;
    onSave({
      ...(initial?.id ? { id: initial.id } : {}),
      titel: titel.trim(), vorname: vorname.trim(), nachname: nachname.trim(),
      geburtsdatum, email, telefon, adresse, bootsname, bootstyp, status, notizen,
      // Leere Auswahl heißt "kein Partner" — als NULL speichern, nicht als
      // leerer String, sonst schlägt der Fremdschlüssel auf partners.id fehl.
      partner_id: partnerId || null,
      provision: provision === "" ? null : Number(provision),
      quelle,
      vorversicherung_versicherer: vvVersicherer.trim(),
      vorversicherung_polizzennummer: vvPolizzennummer.trim(),
      vorversicherung_hauptfaelligkeit: vvHauptfaelligkeit,
      vorversicherung_praemie: vvPraemie === "" ? null : Number(vvPraemie),
    });
  };

  return (
    <form className="panel customer-form" onSubmit={submit}>
      <h2 className="panel-title">{initial?.id ? "Kunde bearbeiten" : "Neuer Kunde"}</h2>
      <div className="field-grid">
        <Field label="Titel" hint="z. B. Dr., Mag., Ing."><input value={titel} onChange={(e) => setTitel(e.target.value)} /></Field>
        <Field label="Vorname"><input value={vorname} onChange={(e) => setVorname(e.target.value)} /></Field>
        <Field label="Nachname *" span><input value={nachname} onChange={(e) => setNachname(e.target.value)} required /></Field>
        <Field label="Geburtsdatum" hint="Für die automatische Geburtstagserinnerung">
          <input value={geburtsdatum} onChange={(e) => setGeburtsdatum(e.target.value)} placeholder="TT.MM.JJJJ" />
        </Field>
        <Field label="E-Mail"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Telefon"><input value={telefon} onChange={(e) => setTelefon(e.target.value)} /></Field>
        <Field label="Adresse"><input value={adresse} onChange={(e) => setAdresse(e.target.value)} /></Field>
        <Field label="Bootsname"><input value={bootsname} onChange={(e) => setBootsname(e.target.value)} /></Field>
        <Field label="Bootstyp">
          <select value={bootstyp} onChange={(e) => setBootstyp(e.target.value)}>
            <option>Motorboot</option><option>Segelboot</option>
          </select>
        </Field>
        <Field label="Partner / Vermittler" hint="Wer hat den Kunden gebracht?">
          <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
            <option value="">— kein Partner —</option>
            {(partners || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Quelle" hint="Wie kam der Kontakt zustande?">
          <select value={quelle} onChange={(e) => setQuelle(e.target.value)}>
            <option value="">— unbekannt —</option>
            {QUELLE_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        </Field>
        <Field label="Provision (%)">
          <input type="number" step="0.5" min="0" value={provision} onChange={(e) => setProvision(e.target.value)} />
        </Field>
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">— kein Status —</option>
            {STATUS_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Vorversicherung — Versicherer" hint="Falls Wechsel von bestehendem Vertrag">
          <input value={vvVersicherer} onChange={(e) => setVvVersicherer(e.target.value)} />
        </Field>
        <Field label="Vorversicherung — Polizzennummer" hint="Für das Kündigungsschreiben, falls bekannt">
          <input value={vvPolizzennummer} onChange={(e) => setVvPolizzennummer(e.target.value)} />
        </Field>
        <Field label="Vorversicherung — Hauptfälligkeit" hint="Kündigungsfrist wird automatisch 4 Monate davor berechnet">
          <input type="date" value={vvHauptfaelligkeit} onChange={(e) => setVvHauptfaelligkeit(e.target.value)} />
        </Field>
        <Field label="Vorversicherung — Jahresprämie (€)" hint="Für den automatischen Vergleich mit NAUTIMA/Callidus">
          <input type="number" step="10" min="0" value={vvPraemie} onChange={(e) => setVvPraemie(e.target.value)} />
        </Field>
      </div>
      {vvHauptfaelligkeit && (() => {
        const frist = berechneKuendigungsfrist(vvHauptfaelligkeit);
        return frist ? (
          <div className="warnbox" style={{ marginTop: -4 }}>
            <AlertTriangle size={15} /> Kündigungsfrist: spätestens <strong>{frist.toLocaleDateString("de-AT")}</strong> kündigen,
            sonst verlängert sich der alte Vertrag automatisch um ein Jahr.
          </div>
        ) : null;
      })()}
      <Field label="Notizen"><textarea rows={3} value={notizen} onChange={(e) => setNotizen(e.target.value)} /></Field>
      <p className="form-hint">
        Firmen/Vereine: Namen einfach ins Feld „Nachname" schreiben, „Vorname" leer lassen. Detaillierte
        Risiko- und Vertragsdaten (Sparten, Prämien, Polizzennummern) werden über den Import-Tab strukturiert
        angelegt und hier in der Detailansicht angezeigt.
      </p>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn btn--primary">Speichern</button>
      </div>
    </form>
  );
}
