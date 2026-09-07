import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Anchor, Loader2, ChevronRight, Check } from "lucide-react";
import api from "../../api.js";
import CustomerForm from "./CustomerForm.jsx";
import CustomerDetail from "./CustomerDetail.jsx";
import StatusBadge from "./StatusBadge.jsx";
import ZielTracker, { QuickLeadForm } from "./ZielTracker.jsx";
import { fullName, boatsSubtitle, STATUS_OPTIONS } from "./helpers.js";

// Aus BootsCRM_reference.jsx. Die Ladelogik ist der eigentliche Umbau:
// window.storage.list("customer:") + einzelnes Nachladen jedes Schlüssels
// wird zu einem einzigen api.customers.list() — der Server liefert die Kunden
// bereits sortiert und mit ihren Booten. Sortierung und Filterung der Liste
// bleiben unverändert.
export default function KundenTab({ partners }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fehler, setFehler] = useState("");
  const [view, setView] = useState({ mode: "list" }); // list | form | detail
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle"); // alle | kein | offert | antrag | polizze
  const [showQuickLead, setShowQuickLead] = useState(false);
  const [quickLeadMsg, setQuickLeadMsg] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      setCustomers(await api.customers.list());
      setFehler("");
    } catch (e) {
      setCustomers([]);
      setFehler(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const saveCustomer = async (data) => {
    const gespeichert = await api.customers.save(data);
    await loadCustomers();
    setView({ mode: "detail", id: gespeichert.id });
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm("Kunde inkl. Booten, Polizzen, Aufgaben und Dokumenten wirklich löschen?")) return;
    await api.customers.delete(id);
    await loadCustomers();
    setView({ mode: "list" });
  };

  const changeStatus = async (id, status) => {
    await api.customers.save({ id, status });
    await loadCustomers();
  };

  // Neues Boot -> POST auf /customers/:id/boats, bestehendes -> PUT auf /boats/:id.
  const saveBoat = async (customer, boat) => {
    if (boat.id) await api.customers.updateBoat(boat);
    else await api.customers.addBoat(customer.id, boat);
    await loadCustomers();
  };

  const deleteBoat = async (customer, boat) => {
    if (boat.id && boat.id !== "legacy") await api.customers.deleteBoat(boat.id);
    await loadCustomers();
  };

  // Aus BootsCRM_reference.jsx (saveQuickLead) — die id vergibt der Server.
  const saveQuickLead = async (data) => {
    const angelegt = await api.customers.save(data);
    await loadCustomers();
    setShowQuickLead(false);
    setQuickLeadMsg(`„${fullName(angelegt)}" als Lead erfasst.`);
    setTimeout(() => setQuickLeadMsg(""), 3000);
  };

  const addHistorie = async (customer, typ, text) => {
    await api.customers.addHistorie(customer.id, { typ, text });
    await loadCustomers();
  };

  // Der Server setzt den Status in derselben Transaktion auf "polizze".
  const addVertrag = async (customer, vertrag) => {
    await api.customers.addVertrag(customer.id, vertrag);
    await loadCustomers();
  };

  const filtered = customers.filter((c) =>
    (fullName(c).toLowerCase().includes(search.toLowerCase()) ||
      boatsSubtitle(c).toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === "alle" || (statusFilter === "kein" ? !c.status : c.status === statusFilter))
  );

  if (view.mode === "form") {
    return (
      <CustomerForm
        initial={view.data}
        onCancel={() => setView(view.data?.id ? { mode: "detail", id: view.data.id } : { mode: "list" })}
        onSave={saveCustomer}
        partners={partners}
      />
    );
  }

  if (view.mode === "detail") {
    const customer = customers.find((c) => c.id === view.id);
    if (!customer) { setView({ mode: "list" }); return null; }
    return (
      <CustomerDetail
        customer={customer}
        onBack={() => setView({ mode: "list" })}
        onEdit={(c) => setView({ mode: "form", data: c })}
        onDelete={deleteCustomer}
        onStatusChange={changeStatus}
        partners={partners}
        onSaveBoat={saveBoat}
        onDeleteBoat={deleteBoat}
        onAddVertrag={addVertrag}
        onAddHistorie={addHistorie}
        onCustomersChanged={loadCustomers}
      />
    );
  }

  return (
    <div className="panel">
      <ZielTracker customers={customers} />
      <div className="pipeline-bar">
        {[
          { key: "alle", label: "Alle", count: customers.length },
          { key: "kein", label: "Ohne Status", count: customers.filter((c) => !c.status).length },
          ...STATUS_OPTIONS.map((s) => ({
            key: s.key, label: s.label, count: customers.filter((c) => c.status === s.key).length, color: s.color,
          })),
        ].map((s) => (
          <button
            key={s.key}
            type="button"
            className={`pipeline-chip ${statusFilter === s.key ? "pipeline-chip--active" : ""}`}
            style={s.color ? { "--chip-color": s.color } : undefined}
            onClick={() => setStatusFilter(s.key)}
          >
            <span className="pipeline-chip-count">{s.count}</span>
            <span className="pipeline-chip-label">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="list-head">
        <div className="search-box">
          <Search size={15} />
          <input placeholder="Kunde oder Boot suchen…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn" onClick={() => setShowQuickLead((s) => !s)}><Plus size={15} /> Schnell-Lead</button>
        <button className="btn btn--primary" onClick={() => setView({ mode: "form" })}>
          <Plus size={15} /> Neuer Kunde
        </button>
      </div>
      {quickLeadMsg && <div className="save-confirm" style={{ marginBottom: 12 }}><Check size={14} /> {quickLeadMsg}</div>}
      {showQuickLead && <QuickLeadForm onCancel={() => setShowQuickLead(false)} onSave={saveQuickLead} />}

      {fehler && <div className="warnbox">Keine Verbindung zum Backend: {fehler}</div>}

      {loading ? (
        <div className="uploading"><Loader2 size={14} className="spin" /> Kunden werden geladen…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Anchor size={28} />
          <p>{customers.length === 0 ? "Noch keine Kunden angelegt." : "Keine Treffer."}</p>
        </div>
      ) : (
        <div className="customer-list">
          {filtered.map((c) => (
            <button key={c.id} className="customer-row" onClick={() => setView({ mode: "detail", id: c.id })}>
              <div className="customer-row-main">
                <span className="customer-row-name">{fullName(c)}</span>
                <span className="customer-row-sub">{boatsSubtitle(c)}</span>
              </div>
              <StatusBadge status={c.status} />
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
