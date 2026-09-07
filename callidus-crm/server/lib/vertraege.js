import db from "../db.js";

// Polizzen eines Kunden inkl. ihrer Sparten, neueste zuerst.
// erstellt kommt aus datetime('now') und hat nur Sekundenauflösung: zwei in
// derselben Sekunde erfasste Polizzen hätten sonst keine definierte
// Reihenfolge. rowid steigt monoton und entscheidet den Gleichstand.
export function vertraegeVonKunde(customerId) {
  const vertraege = db
    .prepare("SELECT * FROM vertraege WHERE customer_id = ? ORDER BY erstellt DESC, rowid DESC")
    .all(customerId);
  const sparten = db.prepare("SELECT * FROM sparten").all();
  return mitSparten(vertraege, sparten);
}

// Für die Gesamtliste: eine Abfrage für alle Verträge, eine für alle Sparten,
// Zuordnung in JavaScript — gleiche Überlegung wie bei den Booten.
export function vertraegeNachKunde() {
  const vertraege = db.prepare("SELECT * FROM vertraege ORDER BY erstellt DESC, rowid DESC").all();
  const sparten = db.prepare("SELECT * FROM sparten").all();
  const mit = mitSparten(vertraege, sparten);

  const nachKunde = new Map();
  for (const v of mit) {
    if (!nachKunde.has(v.customer_id)) nachKunde.set(v.customer_id, []);
    nachKunde.get(v.customer_id).push(v);
  }
  return nachKunde;
}

function mitSparten(vertraege, sparten) {
  const nachVertrag = new Map();
  for (const s of sparten) {
    if (!nachVertrag.has(s.vertrag_id)) nachVertrag.set(s.vertrag_id, []);
    nachVertrag.get(s.vertrag_id).push(s);
  }
  return vertraege.map((v) => ({ ...v, sparten: nachVertrag.get(v.id) ?? [] }));
}
