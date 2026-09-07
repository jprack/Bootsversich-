import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Users, Loader2, ChevronRight } from "lucide-react";
import api from "../../api.js";
import PartnerForm from "./PartnerForm.jsx";
import PartnerDetail from "./PartnerDetail.jsx";
import PartnerImport from "./PartnerImport.jsx";
import { PARTNER_TYPES, partnerTypeLabel } from "./helpers.js";

// Aus BootsCRM_reference.jsx. Laden und Speichern laufen über api.partners.*;
// der Server sortiert bereits nach Name (deutsche Sortierung), die Sortierung
// der Liste nach Kundenzahl bleibt hier im Frontend.
export default function PartnerTab({ customers, onPartnersChanged }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fehler, setFehler] = useState("");
  const [view, setView] = useState({ mode: "list" });
  const [search, setSearch] = useState("");
  const [typFilter, setTypFilter] = useState("alle");
  const [showImport, setShowImport] = useState(false);

  const loadPartners = useCallback(async () => {
    setLoading(true);
    try {
      setPartners(await api.partners.list());
      setFehler("");
      if (onPartnersChanged) await onPartnersChanged();
    } catch (e) {
      setPartners([]);
      setFehler(e.message);
    }
    setLoading(false);
  }, [onPartnersChanged]);

  useEffect(() => { loadPartners(); }, [loadPartners]);

  const savePartner = async (data) => {
    const gespeichert = await api.partners.save(data);
    await loadPartners();
    setView({ mode: "detail", id: gespeichert.id });
  };

  const deletePartner = async (id) => {
    if (!window.confirm("Partner wirklich löschen? (Verlinkte Kunden bleiben erhalten, verlieren aber die Zuordnung.)")) return;
    await api.partners.delete(id);
    await loadPartners();
    setView({ mode: "list" });
  };

  const filtered = partners.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) &&
    (typFilter === "alle" || p.typ === typFilter)
  );

  if (view.mode === "form") {
    return (
      <PartnerForm
        initial={view.data}
        onCancel={() => setView(view.data?.id ? { mode: "detail", id: view.data.id } : { mode: "list" })}
        onSave={savePartner}
      />
    );
  }
  if (view.mode === "detail") {
    const partner = partners.find((p) => p.id === view.id);
    if (!partner) { setView({ mode: "list" }); return null; }
    return (
      <PartnerDetail
        partner={partner}
        customers={customers}
        onBack={() => setView({ mode: "list" })}
        onEdit={(p) => setView({ mode: "form", data: p })}
        onDelete={deletePartner}
      />
    );
  }

  return (
    <div className="panel">
      <div className="list-head">
        <div className="search-box">
          <Search size={15} />
          <input placeholder="Partner suchen…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={typFilter} onChange={(e) => setTypFilter(e.target.value)} className="partner-typ-filter">
          <option value="alle">Alle Typen</option>
          {PARTNER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="btn" onClick={() => setShowImport((s) => !s)}>{showImport ? "Import ausblenden" : "Importieren"}</button>
        <button className="btn btn--primary" onClick={() => setView({ mode: "form" })}><Plus size={15} /> Neuer Partner</button>
      </div>

      {showImport && <div style={{ marginTop: 14 }}><PartnerImport onImported={loadPartners} /></div>}

      {fehler && <div className="warnbox">Keine Verbindung zum Backend: {fehler}</div>}

      {loading ? (
        <div className="uploading" style={{ marginTop: 14 }}><Loader2 size={14} className="spin" /> Partner werden geladen…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={28} />
          <p>{partners.length === 0 ? "Noch keine Partner angelegt." : "Keine Treffer."}</p>
        </div>
      ) : (
        <div className="customer-list">
          {[...filtered]
            .map((p) => ({ p, count: (customers || []).filter((c) => c.partner_id === p.id).length }))
            .sort((a, b) => b.count - a.count || a.p.name.localeCompare(b.p.name, "de"))
            .map(({ p, count }) => (
              <button key={p.id} className="customer-row" onClick={() => setView({ mode: "detail", id: p.id })}>
                <div className="customer-row-main">
                  <span className="customer-row-name">{p.name}</span>
                  <span className="customer-row-sub">
                    {partnerTypeLabel(p)}{(p.email || p.plz_ort) ? ` · ${[p.email, p.plz_ort].filter(Boolean).join(" · ")}` : ""}
                  </span>
                </div>
                {count > 0 && <span className="tab-badge" style={{ background: "var(--sea)" }}>{count} Kunde{count === 1 ? "" : "n"}</span>}
                <ChevronRight size={16} />
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
