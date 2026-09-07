// Automatische Aufgaben — aus BootsCRM_reference.jsx portiert.
//
// Die Datums- und Fristenlogik ist wörtlich übernommen (Zeilen 416-426,
// 463-471, 501-523). Geändert ist nur die Ablage: statt window.storage
// schreiben die Funktionen in die Tabelle tasks, und sie laufen jetzt hier
// im Server statt im Browser — so entstehen die Erinnerungen auch dann,
// wenn niemand die App offen hat (so vorgesehen in PROMPTS.md, Prompt 6).
import { randomUUID } from "node:crypto";
import db from "../db.js";
import { fullName } from "./namen.js";

/* ===================== Aufgabentracking (Angebot-Nachfassen) ===================== */
export const OFFERT_NACHFASS_TAGE = [3, 5, 14]; // Werktage nach Angebotserstellung
export function addBusinessDays(startDate, days) {
  const d = new Date(startDate);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay(); // 0=So, 6=Sa
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

// Kündigung bestehender Vorversicherungen: gesetzliche/vertragliche Frist ist 4 Monate vor Hauptfälligkeit.
export const KUENDIGUNG_MONATE_VOR_HAUPTFAELLIGKEIT = 4;
export const KUENDIGUNG_ERINNERUNG_TAGE_VORHER = [42, 14, 0]; // 6 Wochen, 2 Wochen, am Tag der Frist selbst
export function berechneKuendigungsfrist(hauptfaelligkeitISO) {
  if (!hauptfaelligkeitISO) return null;
  const d = new Date(hauptfaelligkeitISO);
  if (isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() - KUENDIGUNG_MONATE_VOR_HAUPTFAELLIGKEIT);
  return d;
}

/* ===================== Geburtstags-Erinnerung ===================== */
export const GEBURTSTAG_VORLAUF_TAGE = 7; // Erinnerung ab X Tagen vorher
// Das Feld ist Freitext (TT.MM.JJJJ ist nur ein Platzhalter) — daher tolerant parsen:
// erkennt "3.5.1980", "03.05.1980", "3-5-1980", "1980-05-03" u. ä. und liefert {tag, monat, jahr|null}.
export function parseGeburtsdatum(str) {
  if (!str) return null;
  const s = str.trim();
  let m = s.match(/^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{2,4})$/); // TT.MM.JJJJ o.ä.
  if (m) {
    const [, t, mo, j] = m;
    return { tag: Number(t), monat: Number(mo), jahr: j.length === 2 ? Number(j) + 2000 : Number(j) };
  }
  m = s.match(/^(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})$/); // JJJJ-MM-TT (z. B. aus <input type="date">)
  if (m) {
    const [, j, mo, t] = m;
    return { tag: Number(t), monat: Number(mo), jahr: Number(j) };
  }
  return null;
}
export function naechsterGeburtstag(geb) {
  const heuteStart = new Date(); heuteStart.setHours(0, 0, 0, 0);
  let naechster = new Date(heuteStart.getFullYear(), geb.monat - 1, geb.tag);
  if (naechster < heuteStart) naechster = new Date(heuteStart.getFullYear() + 1, geb.monat - 1, geb.tag);
  return naechster;
}

/* ===================== Ablage ===================== */
// erstellt wird bewusst als ISO-Zeitstempel geschrieben, nicht über den
// Spalten-Default datetime('now'): dessen Format "2026-09-07 12:34:56" wird
// von new Date() als Ortszeit gelesen, ISO ist eindeutig. Die Wochenziel-
// Auswertung in Prompt 9 rechnet damit.
const einfuegen = db.prepare(`
  INSERT INTO tasks (id, customer_id, customer_name, titel, tage, faelligkeitsdatum, erstellt, erledigt)
  VALUES (@id, @customer_id, @customer_name, @titel, @tage, @faelligkeitsdatum, @erstellt, 0)
`);

function anlegen({ customer, titel, tage = null, faelligkeitsdatum }) {
  einfuegen.run({
    id: randomUUID(),
    customer_id: customer.id,
    customer_name: fullName(customer),
    titel,
    tage,
    faelligkeitsdatum,
    erstellt: new Date().toISOString(),
  });
}

export function createOffertTasks(customer) {
  const now = new Date();
  for (const tage of OFFERT_NACHFASS_TAGE) {
    anlegen({
      customer,
      titel: `Angebot nachfassen (${tage} Werktage)`,
      tage,
      faelligkeitsdatum: addBusinessDays(now, tage).toISOString(),
    });
  }
}

export const EMPFEHLUNG_NACHFASS_TAGE = 30; // Kalendertage nach Polizze-Abschluss
export function createEmpfehlungsTask(customer) {
  const now = new Date();
  anlegen({
    customer,
    titel: "Nach Empfehlung fragen",
    tage: EMPFEHLUNG_NACHFASS_TAGE,
    faelligkeitsdatum: new Date(now.getTime() + EMPFEHLUNG_NACHFASS_TAGE * 86400000).toISOString(),
  });
}

export function clearKuendigungsTasks(customerId) {
  db.prepare("DELETE FROM tasks WHERE customer_id = ? AND titel LIKE 'Kündigungsfrist Vorversicherung%'")
    .run(customerId);
}

export function createKuendigungsTasks(customer) {
  const frist = berechneKuendigungsfrist(customer.vorversicherung_hauptfaelligkeit);
  if (!frist) return;
  const now = new Date();
  for (const tageVorher of KUENDIGUNG_ERINNERUNG_TAGE_VORHER) {
    const faelligkeitsdatum = new Date(frist.getTime() - tageVorher * 86400000);
    if (faelligkeitsdatum < now && tageVorher !== 0) continue; // bereits verstrichene Zwischenerinnerungen nicht mehr anlegen
    anlegen({
      customer,
      titel: tageVorher === 0
        ? "Kündigungsfrist Vorversicherung — heute letzte Frist!"
        : `Kündigungsfrist Vorversicherung (in ${tageVorher} Tagen)`,
      tage: tageVorher,
      faelligkeitsdatum: faelligkeitsdatum.toISOString(),
    });
  }
}

export function createGeburtstagsTaskWennFaellig(customer) {
  const geb = parseGeburtsdatum(customer.geburtsdatum);
  if (!geb) return;
  const naechster = naechsterGeburtstag(geb);
  const tageBis = Math.round((naechster - new Date()) / 86400000);
  if (tageBis > GEBURTSTAG_VORLAUF_TAGE) return;

  // Aufgabe für diesen Geburtstag schon vorhanden? In der Referenz wurde
  // dafür die ganze Aufgabenliste durchsucht — hier reicht eine Abfrage.
  const schonDa = db.prepare(
    "SELECT 1 FROM tasks WHERE customer_id = ? AND titel LIKE 'Geburtstag%' AND substr(faelligkeitsdatum, 1, 10) = ?"
  ).get(customer.id, naechster.toISOString().slice(0, 10));
  if (schonDa) return;

  const alter = geb.jahr ? naechster.getFullYear() - geb.jahr : null;
  anlegen({
    customer,
    titel: `Geburtstag${alter ? ` (wird ${alter})` : ""} — Glückwunsch schicken`,
    faelligkeitsdatum: naechster.toISOString(),
  });
}

export function pruefeGeburtstage() {
  const kunden = db.prepare("SELECT * FROM customers WHERE geburtsdatum <> ''").all();
  let angelegt = 0;
  for (const c of kunden) {
    const vorher = db.prepare("SELECT COUNT(*) AS n FROM tasks WHERE customer_id = ?").get(c.id).n;
    createGeburtstagsTaskWennFaellig(c);
    if (db.prepare("SELECT COUNT(*) AS n FROM tasks WHERE customer_id = ?").get(c.id).n > vorher) angelegt++;
  }
  return { geprueft: kunden.length, angelegt };
}
