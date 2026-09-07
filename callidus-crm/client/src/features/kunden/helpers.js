// Namens-, Status- und Boots-Hilfsfunktionen aus BootsCRM_reference.jsx.
// Inhaltlich unverändert; angepasst sind nur die Feldnamen, weil die Daten
// jetzt aus SQLite kommen (partner_id statt partnerId, motorleistung_kw
// statt motorleistungKW usw. — siehe schema.sql).

/* ---------- Status-Pipeline (Offert -> Antrag -> Polizze) ---------- */
export const STATUS_OPTIONS = [
  { key: "offert", label: "Offert", color: "#41505A" },
  { key: "antrag", label: "Antrag", color: "#0F6EBE" },
  { key: "polizze", label: "Polizze", color: "#032856" },
];
export function statusInfo(key) {
  return STATUS_OPTIONS.find((s) => s.key === key) || null;
}

export const QUELLE_OPTIONS = [
  "Kundenempfehlung", "Partner-Empfehlung", "Newsletter", "Website",
  "Regatta/Verein", "Mundpropaganda", "Adria/Mittelmeer-Kontakt", "Sonstiges",
];

/* ---------- Namen ---------- */
/* Vor-/Nachname/Titel -> Anzeigename. Fällt auf das alte Feld "name" zurück,
   falls ein Kunde noch im alten (Vor-Update-)Format gespeichert ist. */
export function fullName(c) {
  if (!c) return "";
  const composed = [c.titel, c.vorname, c.nachname].filter(Boolean).join(" ").trim();
  return composed || c.name || "";
}

export function customerSortKey(c) {
  return (c?.nachname || c?.name || "").toLowerCase() + " " + (c?.vorname || "").toLowerCase();
}

// Zerlegt einen einzelnen Namensstring (z. B. aus einem Import) in Titel/Vorname/Nachname.
const KNOWN_TITLES = ["Dipl.-Ing.", "Dkfm.", "MMag.", "Mag.", "Ing.", "Dr.", "DI", "Prof.", "Arch.", "BSc", "MSc", "MBA"];
export function splitFullName(full) {
  let rest = (full || "").trim();
  const foundTitles = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of KNOWN_TITLES) {
      if (rest.toLowerCase().startsWith(t.toLowerCase() + " ")) {
        foundTitles.push(rest.slice(0, t.length));
        rest = rest.slice(t.length).trim();
        changed = true;
        break;
      }
    }
  }
  const parts = rest.split(" ").filter(Boolean);
  const nachname = parts.length > 1 ? parts.slice(-1).join(" ") : (parts[0] || "");
  const vorname = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
  return { titel: foundTitles.join(" "), vorname, nachname };
}

/* ---------- Boote ---------- */
// Die Boote kommen als verschachteltes Array vom Server. Der Rückfall auf
// bootsname/bootstyp direkt am Kunden bleibt erhalten für Datensätze aus der
// Zeit vor der Mehr-Boote-Umstellung (siehe Legacy-Felder in schema.sql).
export function getBoats(customer) {
  if (customer?.boote?.length > 0) return customer.boote;
  if (customer?.bootsname) {
    return [{ id: "legacy", name: customer.bootsname, bootstyp: customer.bootstyp || "Motorboot" }];
  }
  return [];
}

export function boatsSubtitle(customer) {
  const boats = getBoats(customer);
  if (boats.length === 0) return customer.bootstyp || "";
  if (boats.length === 1) return `${boats[0].name ? boats[0].name + " · " : ""}${boats[0].bootstyp || ""}`;
  return `${boats.length} Boote`;
}

export const BOAT_FIELD_DEFS = [
  { key: "name", label: "Bootsname" },
  { key: "bootstyp", label: "Bootstyp", type: "select", options: ["Motorboot", "Segelboot"] },
  { key: "registrierungsland", label: "Registrierungsland" },
  { key: "werft", label: "Werft" },
  { key: "hersteller", label: "Hersteller" },
  { key: "modell", label: "Modell" },
  { key: "yachttyp", label: "Yachttyp" },
  { key: "baujahr", label: "Baujahr" },
  { key: "laenge", label: "Länge (m)" },
  { key: "breite", label: "Breite (m)" },
  { key: "tiefgang", label: "Tiefgang (m)" },
  { key: "rumpfmaterial", label: "Rumpfmaterial" },
  { key: "mastmaterial", label: "Mastmaterial", segelOnly: true },
  { key: "segelflaeche", label: "Segelfläche (m²)", segelOnly: true },
  { key: "motortyp", label: "Motortyp", motorOnly: true },
  { key: "motorleistung_kw", label: "Motorleistung (kW)", motorOnly: true },
  { key: "hersteller_motor", label: "Hersteller Motor", motorOnly: true },
  { key: "fahrtgebiet", label: "Fahrtgebiet" },
  { key: "charter", label: "Chartereinsatz" },
];

/* ---------- Kündigungsfrist Vorversicherung ---------- */
// Gesetzliche/vertragliche Frist ist 4 Monate vor Hauptfälligkeit.
export const KUENDIGUNG_MONATE_VOR_HAUPTFAELLIGKEIT = 4;
export function berechneKuendigungsfrist(hauptfaelligkeitISO) {
  if (!hauptfaelligkeitISO) return null;
  const d = new Date(hauptfaelligkeitISO);
  if (isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() - KUENDIGUNG_MONATE_VOR_HAUPTFAELLIGKEIT);
  return d;
}
