import { useState } from "react";
import { Field } from "../../components/ui.jsx";
import { PARTNER_TYPES } from "./helpers.js";

// Aus BootsCRM_reference.jsx, unverändert bis auf die Feldnamen
// (bootsbauer_typ, plz_ort) gemäß schema.sql.
export default function PartnerForm({ initial, onCancel, onSave }) {
  const [nummer, setNummer] = useState(initial?.nummer || "");
  const [name, setName] = useState(initial?.name || "");
  const [typ, setTyp] = useState(initial?.typ || "Versicherungsmakler");
  const [bootsbauerTyp, setBootsbauerTyp] = useState(initial?.bootsbauer_typ || []);
  const [iban, setIban] = useState(initial?.iban || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [adresse, setAdresse] = useState(initial?.adresse || "");
  const [plzOrt, setPlzOrt] = useState(initial?.plz_ort || "");

  const toggleBootsbauerTyp = (v) =>
    setBootsbauerTyp((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...(initial?.id ? { id: initial.id } : {}),
      nummer: nummer.trim(), name: name.trim(), typ,
      bootsbauer_typ: typ === "Bootsbauer" ? bootsbauerTyp : [],
      iban: iban.trim(), email: email.trim(), adresse: adresse.trim(), plz_ort: plzOrt.trim(),
    });
  };

  return (
    <form className="panel customer-form" onSubmit={submit}>
      <h2 className="panel-title">{initial?.id ? "Partner bearbeiten" : "Neuer Partner"}</h2>
      <div className="field-grid">
        <Field label="Nummer"><input value={nummer} onChange={(e) => setNummer(e.target.value)} /></Field>
        <Field label="Name *" span><input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
        <Field label="Typ">
          <select value={typ} onChange={(e) => setTyp(e.target.value)}>
            {PARTNER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        {typ === "Bootsbauer" && (
          <Field label="Spezialisierung">
            <div className="radio-row">
              <label className={`radio-pill ${bootsbauerTyp.includes("Segelboot") ? "radio-pill--active" : ""}`}>
                <input type="checkbox" checked={bootsbauerTyp.includes("Segelboot")} onChange={() => toggleBootsbauerTyp("Segelboot")} />Segelboot
              </label>
              <label className={`radio-pill ${bootsbauerTyp.includes("Motorboot") ? "radio-pill--active" : ""}`}>
                <input type="checkbox" checked={bootsbauerTyp.includes("Motorboot")} onChange={() => toggleBootsbauerTyp("Motorboot")} />Motorboot
              </label>
            </div>
          </Field>
        )}
        <Field label="IBAN"><input value={iban} onChange={(e) => setIban(e.target.value)} /></Field>
        <Field label="E-Mail"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Adresse"><input value={adresse} onChange={(e) => setAdresse(e.target.value)} /></Field>
        <Field label="PLZ, Stadt"><input value={plzOrt} onChange={(e) => setPlzOrt(e.target.value)} /></Field>
      </div>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn btn--primary">Speichern</button>
      </div>
    </form>
  );
}
