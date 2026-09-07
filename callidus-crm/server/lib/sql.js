// Kleine Helfer zum Bauen von INSERT/UPDATE aus einem Objekt. Die Spalten
// stammen immer aus den Whitelists in felder.js, nie direkt aus dem Body —
// deshalb ist das Zusammensetzen der Spaltennamen hier unbedenklich, die
// Werte gehen ausschließlich als gebundene Parameter in die Abfrage.

export function insert(db, tabelle, daten) {
  const spalten = Object.keys(daten);
  const platzhalter = spalten.map((s) => `@${s}`);
  return db
    .prepare(`INSERT INTO ${tabelle} (${spalten.join(", ")}) VALUES (${platzhalter.join(", ")})`)
    .run(daten);
}

export function update(db, tabelle, id, daten, extraSql = "") {
  const zuweisungen = Object.keys(daten).map((s) => `${s} = @${s}`);
  if (extraSql) zuweisungen.push(extraSql);
  return db
    .prepare(`UPDATE ${tabelle} SET ${zuweisungen.join(", ")} WHERE id = @id`)
    .run({ ...daten, id });
}
