// Welche Spalten von außen beschrieben werden dürfen — abgeleitet aus
// schema.sql. id, customer_id, created_at und updated_at fehlen bewusst:
// die vergibt bzw. pflegt der Server selbst.

export const KUNDEN_FELDER = [
  "titel",
  "vorname",
  "nachname",
  "geburtsdatum",
  "email",
  "telefon",
  "adresse",
  "status",
  "notizen",
  "quelle",
  "partner_id",
  "provision",
  "vorversicherung_versicherer",
  "vorversicherung_polizzennummer",
  "vorversicherung_hauptfaelligkeit",
  "vorversicherung_praemie",
  "bootsname",
  "bootstyp",
];

export const BOOT_FELDER = [
  "name",
  "bootstyp",
  "registrierungsland",
  "werft",
  "hersteller",
  "modell",
  "yachttyp",
  "baujahr",
  "laenge",
  "breite",
  "tiefgang",
  "rumpfmaterial",
  "mastmaterial",
  "segelflaeche",
  "motortyp",
  "motorleistung_kw",
  "hersteller_motor",
  "fahrtgebiet",
  "charter",
];

// Nimmt aus einem Anfrage-Body nur die erlaubten Felder heraus.
// Unbekannte Felder werden stillschweigend verworfen — das Frontend schickt
// beim Speichern den kompletten Datensatz zurück, inklusive id, created_at
// und dem verschachtelten "boote"-Array. Ein Fehler wäre hier unpraktisch.
export function nurErlaubte(body, erlaubt) {
  const daten = {};
  for (const feld of erlaubt) {
    if (Object.hasOwn(body, feld)) daten[feld] = body[feld];
  }
  return daten;
}

export const PARTNER_FELDER = [
  "nummer",
  "name",
  "typ",
  "bootsbauer_typ",
  "iban",
  "email",
  "adresse",
  "plz_ort",
];

// Polizzen. id, customer_id und erstellt vergibt der Server.
export const VERTRAG_FELDER = [
  "versicherer",
  "polizzennummer",
  "versicherungsbeginn",
  "hauptfaelligkeit",
  "zahlweise",
  "notizen",
  "quelle",
];

// Sparten je Polizze. id und vertrag_id vergibt der Server.
export const SPARTE_FELDER = [
  "sparte",
  "versicherungssumme",
  "selbstbehalt",
  "erstpraemie",
  "folgepraemie",
  "polizzennummer",
];

// Gespeicherte Prämienberechnungen aus dem Rechner.
export const QUOTE_FELDER = [
  "bootstyp",
  "baujahr",
  "versicherungssumme",
  "zone",
  "nautima",
  "callidus",
  "quelle",
];
