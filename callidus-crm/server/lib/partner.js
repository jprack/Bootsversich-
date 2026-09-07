import db from "../db.js";
import { PARTNER_FELDER, nurErlaubte } from "./felder.js";

const collator = new Intl.Collator("de", { sensitivity: "base" });

// bootsbauer_typ liegt in der Datenbank als JSON-Text ('["Segelboot"]'),
// nach außen ist es ein Array. Diese beiden Funktionen sind die einzige
// Stelle, an der umgewandelt wird.

function ausDb(partner) {
  if (!partner) return partner;
  let typen = [];
  try {
    const roh = JSON.parse(partner.bootsbauer_typ || "[]");
    if (Array.isArray(roh)) typen = roh;
  } catch {
    // Kaputter oder alter Inhalt soll nicht die ganze Liste zerreißen —
    // dann eben ein leeres Array.
    console.warn(`[partner] bootsbauer_typ von ${partner.id} ist kein JSON:`, partner.bootsbauer_typ);
  }
  return { ...partner, bootsbauer_typ: typen };
}

// Nimmt den Anfrage-Body, lässt nur erlaubte Felder durch und macht aus
// bootsbauer_typ wieder JSON-Text. Ein bereits als String geschicktes Feld
// wird durchgereicht, damit beides funktioniert.
export function fuerDb(body) {
  const daten = nurErlaubte(body ?? {}, PARTNER_FELDER);
  if (Object.hasOwn(daten, "bootsbauer_typ")) {
    const wert = daten.bootsbauer_typ;
    daten.bootsbauer_typ =
      typeof wert === "string" ? wert : JSON.stringify(Array.isArray(wert) ? wert : []);
  }
  return daten;
}

export function partner(id) {
  return ausDb(db.prepare("SELECT * FROM partners WHERE id = ?").get(id));
}

export function allePartner() {
  return db
    .prepare("SELECT * FROM partners")
    .all()
    .map(ausDb)
    .sort((a, b) => collator.compare(a.name || "", b.name || ""));
}
