import db from "../db.js";

// daten liegt in der Datenbank als JSON-Text (so schema.sql), nach außen ist
// es das Objekt, das die Antragsmaske erzeugt hat. Umgewandelt wird nur hier.
function ausDb(a) {
  if (!a) return a;
  let daten = null;
  try {
    daten = JSON.parse(a.daten);
  } catch {
    console.warn(`[antraege] daten von ${a.id} sind kein JSON`);
  }
  return { ...a, daten };
}

export function antraegeVonKunde(customerId) {
  return db
    .prepare("SELECT * FROM antraege WHERE customer_id = ? ORDER BY erstellt DESC, rowid DESC")
    .all(customerId)
    .map(ausDb);
}

export function antraegeNachKunde() {
  const alle = db.prepare("SELECT * FROM antraege ORDER BY erstellt DESC, rowid DESC").all().map(ausDb);
  const nachKunde = new Map();
  for (const a of alle) {
    if (!nachKunde.has(a.customer_id)) nachKunde.set(a.customer_id, []);
    nachKunde.get(a.customer_id).push(a);
  }
  return nachKunde;
}
