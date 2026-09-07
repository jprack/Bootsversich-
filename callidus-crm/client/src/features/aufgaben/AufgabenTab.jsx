// AufgabenTab — aus BootsCRM_reference.jsx (Zeilen 4112-4225), programmatisch
// ausgeschnitten. Geändert: Laden und Abhaken laufen über api.tasks statt
// window.storage, und die Feldnamen folgen schema.sql (customer_id,
// customer_name). Gruppierung, Textbaustein und Darstellung sind unverändert.
import { useState, useEffect, useCallback } from "react";
import { Check, Loader2, Copy } from "lucide-react";
import api from "../../api.js";
import { fullName } from "../kunden/helpers.js";

export default function AufgabenTab({ onTasksChanged, customers }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDone, setShowDone] = useState(false);
  const [mailFor, setMailFor] = useState(null);
  const [mailText, setMailText] = useState("");
  const [copied, setCopied] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      // Der Server liefert bereits nach Fälligkeit sortiert.
      setTasks(await api.tasks.list());
    } catch (e) { setTasks([]); }
    setLoading(false);
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const toggleDone = async (task) => {
    await api.tasks.toggle(task.id, !task.erledigt);
    await loadTasks();
    if (onTasksChanged) await onTasksChanged();
  };

  const openMail = (task) => {
    const customer = (customers || []).find((c) => c.id === task.customer_id);
    const name = customer ? fullName(customer) : task.customer_name;
    const email = customer?.email || "";
    const text = "GEBURTSTAGSMAIL — bitte als Outlook-Entwurf anlegen (nicht automatisch versenden):\n" +
      `Empfänger: ${name}${email ? ` <${email}>` : " — keine E-Mail hinterlegt, bitte manuell ergänzen oder Adressat prüfen"}\n` +
      "Betreff: Alles Gute zum Geburtstag!\n\n" +
      `Liebe/r ${name},\n\ndas Team von Callidus wünscht Ihnen alles Gute zum Geburtstag! Wir hoffen, Sie haben einen wunderschönen Tag und noch viele schöne Stunden auf dem Wasser vor sich.\n\nHerzliche Grüße\nIhr Callidus-Team`;
    setMailFor(task.id);
    setMailText(text);
    setCopied(false);
  };
  const copyMail = async () => {
    try { await navigator.clipboard.writeText(mailText); setCopied(true); } catch (e) { setCopied(false); }
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86400000);
  const openTasks = tasks.filter((t) => !t.erledigt);
  const doneTasks = tasks.filter((t) => t.erledigt);
  const overdue = openTasks.filter((t) => new Date(t.faelligkeitsdatum) < startOfToday);
  const dueToday = openTasks.filter((t) => { const d = new Date(t.faelligkeitsdatum); return d >= startOfToday && d < endOfToday; });
  const upcoming = openTasks.filter((t) => new Date(t.faelligkeitsdatum) >= endOfToday);

  const Group = ({ title, list, tone }) => list.length === 0 ? null : (
    <div className="task-group">
      <h3 className={`panel-subtitle task-group-title--${tone}`}>{title} ({list.length})</h3>
      {list.map((t) => (
        <div key={t.id}>
          <div className={`task-row task-row--${tone}`}>
            <button type="button" className="task-check" onClick={() => toggleDone(t)} title={t.erledigt ? "Als offen markieren" : "Als erledigt markieren"}>
              <Check size={14} />
            </button>
            <div className="task-info">
              <span className="task-title">{t.titel}</span>
              <span className="task-sub">{t.customer_name} · fällig {new Date(t.faelligkeitsdatum).toLocaleDateString("de-AT")}</span>
            </div>
            {t.titel?.startsWith("Geburtstag") && !t.erledigt && (
              <button type="button" className="btn btn--sm" onClick={() => openMail(t)}>Mail vorbereiten</button>
            )}
          </div>
          {mailFor === t.id && (
            <div className="output-box" style={{ marginTop: -4, marginBottom: 10 }}>
              <p className="output-instructions"><strong>Fast fertig:</strong> Text kopieren und hier im Chat einfügen — daraus lege ich den Outlook-Entwurf an.</p>
              <textarea className="output-textarea" readOnly value={mailText} onFocus={(e) => e.target.select()} rows={7} />
              <button type="button" className="copy-btn" onClick={copyMail}>
                {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Kopiert!" : "Text kopieren"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="panel">
      <h2 className="panel-title"><Check size={18} /> Aufgaben</h2>
      <p className="field-hint" style={{ marginBottom: 14 }}>
        Wird automatisch angelegt, sobald ein Kunde den Status „Offert" bekommt: Erinnerung nach 3, 5 und 14 Werktagen zum Nachfassen. Diese Liste ist die Erinnerung — sie erscheint, sobald du die App öffnest.
      </p>
      {loading ? (
        <div className="uploading"><Loader2 size={14} className="spin" /> Aufgaben werden geladen…</div>
      ) : (
        <>
          {openTasks.length === 0 && <p className="empty-hint">Keine offenen Aufgaben.</p>}
          <Group title="Überfällig" list={overdue} tone="overdue" />
          <Group title="Heute fällig" list={dueToday} tone="today" />
          <Group title="Anstehend" list={upcoming} tone="upcoming" />
          {doneTasks.length > 0 && (
            <>
              <button type="button" className="btn btn--sm" onClick={() => setShowDone((s) => !s)} style={{ marginTop: 14 }}>
                {showDone ? "Erledigte ausblenden" : `Erledigte anzeigen (${doneTasks.length})`}
              </button>
              {showDone && <Group title="Erledigt" list={doneTasks} tone="done" />}
            </>
          )}
        </>
      )}
    </div>
  );
}

