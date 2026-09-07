import { randomUUID } from "node:crypto";
import db from "../db.js";

// Kontaktverlauf. Ersetzt appendHistorie aus BootsCRM_reference.jsx, das
// den Eintrag im Browser an den Kundendatensatz hängte. Die automatischen
// Einträge (system = 1) entstehen jetzt dort, wo das Ereignis passiert —
// im Server, also auch dann, wenn die Aktion nicht aus der App kommt.
export function eintragAnlegen(customerId, typ, text, system = false) {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO historie (id, customer_id, datum, typ, text, system) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, customerId, new Date().toISOString(), typ, text, system ? 1 : 0);
  return id;
}

const ausDb = (h) => ({ ...h, system: h.system === 1 });

export function historieVonKunde(customerId) {
  return db
    .prepare("SELECT * FROM historie WHERE customer_id = ? ORDER BY datum DESC, rowid DESC")
    .all(customerId)
    .map(ausDb);
}

export function historieNachKunde() {
  const alle = db.prepare("SELECT * FROM historie ORDER BY datum DESC, rowid DESC").all().map(ausDb);
  const nachKunde = new Map();
  for (const h of alle) {
    if (!nachKunde.has(h.customer_id)) nachKunde.set(h.customer_id, []);
    nachKunde.get(h.customer_id).push(h);
  }
  return nachKunde;
}
