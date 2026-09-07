import { useState, useEffect, useCallback } from "react";
import { Users, Anchor, Info } from "lucide-react";
import api from "./api.js";
import KundenTab from "./features/kunden/KundenTab.jsx";
import PartnerTab from "./features/partner/PartnerTab.jsx";

// App-Shell aus BootsCRM_reference.jsx. Die Tabs Prämienrechner, Newsletter,
// Aufgaben, Import, NAUTIMA-Antrag und Bootsdatenblatt folgen in den nächsten
// Schritten — hier sind zunächst Kunden und Partner eingehängt.
export default function App() {
  const [tab, setTab] = useState("kunden");
  const [customers, setCustomers] = useState([]);
  const [partners, setPartners] = useState([]);

  const refreshCustomers = useCallback(async () => {
    try { setCustomers(await api.customers.list()); } catch (e) { /* Liste bleibt wie sie ist */ }
  }, []);

  const refreshPartners = useCallback(async () => {
    try { setPartners(await api.partners.list()); } catch (e) { /* dito */ }
  }, []);

  // Beim Tab-Wechsel beide Listen auffrischen: der Partner-Tab braucht die
  // Kunden für seine Statistik, das Kundenformular die Partner für das
  // Auswahlfeld.
  useEffect(() => { refreshCustomers(); refreshPartners(); }, [refreshCustomers, refreshPartners, tab]);

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="brand">
          <Anchor size={26} strokeWidth={2.2} />
          <span>Callidus <span className="brand-sub-inline">Boots-CRM</span></span>
        </div>
        <nav className="tabnav">
          <button className={tab === "kunden" ? "tab tab--active" : "tab"} onClick={() => setTab("kunden")}>
            <Users size={15} /> Kunden
          </button>
          <button className={tab === "partner" ? "tab tab--active" : "tab"} onClick={() => setTab("partner")}>
            <Users size={15} /> Partner
          </button>
        </nav>
      </header>

      <div className="info-banner">
        <Info size={14} />
        <span>
          Lokale Version · Alle Daten liegen in <code>server/callidus.db</code> auf diesem Rechner,
          Dokumente unter <code>server/uploads/</code>. Beides regelmäßig sichern.
        </span>
      </div>

      <main className="app-main">
        {tab === "kunden" && <KundenTab partners={partners} />}
        {tab === "partner" && <PartnerTab customers={customers} onPartnersChanged={refreshPartners} />}
      </main>
    </div>
  );
}
