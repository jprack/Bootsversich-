import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export const DB_PATH = path.join(dirname, "callidus.db");
export const UPLOADS_DIR = path.join(dirname, "uploads");
const SCHEMA_PATH = path.join(dirname, "schema.sql");

const db = new Database(DB_PATH);

// Muss pro Verbindung gesetzt werden — die Zeile in schema.sql gilt nur
// für den Moment der Einrichtung. Ohne das greifen ON DELETE CASCADE und
// die Fremdschlüsselprüfung im laufenden Betrieb nicht.
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

// Schema einspielen, falls die Tabellen noch fehlen. schema.sql arbeitet
// durchgehend mit CREATE TABLE IF NOT EXISTS, ein erneuter Lauf wäre also
// harmlos — wir prüfen trotzdem, damit der Start protokolliert, was passiert.
const tabellenVorhanden = db
  .prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name='customers'")
  .get().n > 0;

if (!tabellenVorhanden) {
  db.exec(fs.readFileSync(SCHEMA_PATH, "utf8"));
  console.log("[db] Schema aus schema.sql eingespielt");
} else {
  console.log("[db] Schema bereits vorhanden");
}

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export function tabellen() {
  return db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .all()
    .map((r) => r.name);
}

export default db;
