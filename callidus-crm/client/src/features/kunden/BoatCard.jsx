import { Ship, Trash2 } from "lucide-react";
import { BOAT_FIELD_DEFS } from "./helpers.js";

// Aus BootsCRM_reference.jsx, unverändert.
export default function BoatCard({ boat, onEdit, onDelete }) {
  return (
    <div className="boat-card">
      <div className="boat-card-head">
        <span className="boat-card-title"><Ship size={15} /> {boat.name || "Boot ohne Namen"}</span>
        <div className="boat-card-actions">
          <button type="button" className="btn btn--sm" onClick={() => onEdit(boat)}>Bearbeiten</button>
          <button type="button" className="icon-btn icon-btn--danger" onClick={() => onDelete(boat)} title="Boot löschen">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="risk-table">
        {BOAT_FIELD_DEFS.filter((f) => f.key !== "name").map((f) => {
          const v = boat[f.key];
          if (v === undefined || v === null || v === "" || v === false) return null;
          return (
            <div className="risk-row" key={f.key}>
              <span>{f.label}</span>
              <span>{v === true ? "Ja" : String(v)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
