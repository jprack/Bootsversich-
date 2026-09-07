import db from "../db.js";
import { vertraegeNachKunde, vertraegeVonKunde } from "./vertraege.js";
import { antraegeNachKunde, antraegeVonKunde } from "./antraege.js";

// Deutsche Sortierung. SQLite kennt ohne ICU-Erweiterung keine Locale-Regeln
// und würde "Öhlinger" hinter "Zauner" einsortieren. Deshalb sortieren wir
// die Liste in JavaScript mit dem deutschen Collator.
const collator = new Intl.Collator("de", { sensitivity: "base" });

function nachNamen(a, b) {
  return (
    collator.compare(a.nachname || "", b.nachname || "") ||
    collator.compare(a.vorname || "", b.vorname || "")
  );
}

// Ein Kunde inkl. seiner Boote. Gibt undefined zurück, wenn es ihn nicht gibt.
export function kundeMitBooten(id) {
  const kunde = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
  if (!kunde) return undefined;
  kunde.boote = db.prepare("SELECT * FROM boats WHERE customer_id = ? ORDER BY name").all(id);
  kunde.vertraege = vertraegeVonKunde(id);
  kunde.antraege = antraegeVonKunde(id);
  kunde.quotes = db.prepare("SELECT * FROM quotes WHERE customer_id = ? ORDER BY erstellt DESC, rowid DESC").all(id);
  return kunde;
}

// Alle Kunden inkl. Boote. Bewusst zwei Abfragen statt einer pro Kunde —
// die Boote werden danach in JavaScript zugeordnet, damit die Zahl der
// Abfragen unabhängig von der Kundenzahl konstant bleibt.
export function alleKundenMitBooten() {
  const kunden = db.prepare("SELECT * FROM customers").all();
  const boote = db.prepare("SELECT * FROM boats ORDER BY name").all();

  const nachKunde = new Map();
  for (const boot of boote) {
    if (!nachKunde.has(boot.customer_id)) nachKunde.set(boot.customer_id, []);
    nachKunde.get(boot.customer_id).push(boot);
  }

  const vertraege = vertraegeNachKunde();
  const antraege = antraegeNachKunde();
  const quotes = new Map();
  for (const q of db.prepare("SELECT * FROM quotes ORDER BY erstellt DESC, rowid DESC").all()) {
    if (!quotes.has(q.customer_id)) quotes.set(q.customer_id, []);
    quotes.get(q.customer_id).push(q);
  }
  for (const kunde of kunden) {
    kunde.boote = nachKunde.get(kunde.id) ?? [];
    kunde.vertraege = vertraege.get(kunde.id) ?? [];
    kunde.antraege = antraege.get(kunde.id) ?? [];
    kunde.quotes = quotes.get(kunde.id) ?? [];
  }

  return kunden.sort(nachNamen);
}
