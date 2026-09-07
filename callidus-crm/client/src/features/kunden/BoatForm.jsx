import { useState } from "react";
import { Field } from "../../components/ui.jsx";
import { BOAT_FIELD_DEFS } from "./helpers.js";

// Aus BootsCRM_reference.jsx. Einziger Unterschied: die id vergibt jetzt der
// Server (crypto.randomUUID beim POST), nicht mehr uid() im Browser.
export default function BoatForm({ initial, onCancel, onSave }) {
  const [vals, setVals] = useState(() =>
    Object.fromEntries(
      BOAT_FIELD_DEFS.map((f) => [f.key, initial?.[f.key] ?? (f.key === "bootstyp" ? "Motorboot" : "")])
    )
  );
  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!vals.name.trim()) return;
    // id nur mitgeben, wenn es ein echtes bestehendes Boot ist — "legacy"
    // stammt aus dem Rückfall in getBoats() und existiert nicht in der DB.
    const id = initial?.id && initial.id !== "legacy" ? initial.id : undefined;
    onSave({ ...vals, ...(id ? { id } : {}) });
  };

  return (
    <form className="panel boat-form" onSubmit={submit}>
      <h2 className="panel-title">{initial ? "Boot bearbeiten" : "Neues Boot"}</h2>
      <div className="field-grid">
        {BOAT_FIELD_DEFS.filter(
          (f) => (!f.segelOnly || vals.bootstyp === "Segelboot") && (!f.motorOnly || vals.bootstyp === "Motorboot")
        ).map((f) => (
          <Field key={f.key} label={f.key === "name" ? "Bootsname *" : f.label}>
            {f.type === "select" ? (
              <select value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)}>
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)} required={f.key === "name"} />
            )}
          </Field>
        ))}
      </div>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn btn--primary">Speichern</button>
      </div>
    </form>
  );
}
