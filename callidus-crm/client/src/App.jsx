import { useState, useEffect, useCallback } from "react";
import { Users, Anchor, Info, Calculator, Check } from "lucide-react";
import api from "./api.js";
import KundenTab from "./features/kunden/KundenTab.jsx";
import PartnerTab from "./features/partner/PartnerTab.jsx";
import RechnerTab from "./features/rechner/RechnerTab.jsx";
import AufgabenTab from "./features/aufgaben/AufgabenTab.jsx";

// App-Shell aus BootsCRM_reference.jsx. Die Tabs Newsletter, Aufgaben,
// Import, NAUTIMA-Antrag und Bootsdatenblatt folgen in den nächsten Schritten.
export default function App() {
  const [tab, setTab] = useState("kunden");
  const [customers, setCustomers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [dueTaskCount, setDueTaskCount] = useState(0);

  const refreshCustomers = useCallback(async () => {
    try { setCustomers(await api.customers.list()); } catch (e) { /* Liste bleibt wie sie ist */ }
  }, []);

  const refreshPartners = useCallback(async () => {
    try { setPartners(await api.partners.list()); } catch (e) { /* dito */ }
  }, []);

  // Zähler für die Tab-Plakette: alles, was heute oder früher fällig und
  // noch offen ist — aus BootsCRM_reference.jsx (refreshTaskCount).
  const refreshTaskCount = useCallback(async () => {
    try {
      const now = new Date();
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const tasks = await api.tasks.list();
      setDueTaskCount(tasks.filter((t) => !t.erledigt && new Date(t.faelligkeitsdatum) < endOfToday).length);
    } catch (e) { /* Zähler bleibt wie er ist */ }
  }, []);

  // Beim Tab-Wechsel beide Listen auffrischen: der Partner-Tab braucht die
  // Kunden für seine Statistik, das Kundenformular die Partner für das
  // Auswahlfeld.
  useEffect(() => { refreshCustomers(); refreshPartners(); refreshTaskCount(); },
    [refreshCustomers, refreshPartners, refreshTaskCount, tab]);

  // Aus BootsCRM_reference.jsx (saveQuoteToCustomer), jetzt über die API.
  const saveQuoteToCustomer = async (customerId, quote) => {
    await api.customers.saveQuote(customerId, quote);
    await refreshCustomers();
  };

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
          <button className={tab === "rechner" ? "tab tab--active" : "tab"} onClick={() => setTab("rechner")}>
            <Calculator size={15} /> Prämienrechner
          </button>
          <button className={tab === "aufgaben" ? "tab tab--active" : "tab"} onClick={() => setTab("aufgaben")}>
            <Check size={15} /> Aufgaben
            {dueTaskCount > 0 && <span className="tab-badge">{dueTaskCount}</span>}
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
        {tab === "rechner" && <RechnerTab customers={customers} onSaveToCustomer={saveQuoteToCustomer} />}
        {tab === "aufgaben" && <AufgabenTab customers={customers} onTasksChanged={refreshTaskCount} />}
      </main>
    </div>
  );
}
