// Aus BootsCRM_reference.jsx. bootsbauerTyp heißt jetzt bootsbauer_typ
// (schema.sql) und kommt vom Server bereits als Array.
export const PARTNER_TYPES = [
  "Versicherungsmakler",
  "Sachverständiger",
  "Bootsbauer",
  "Marina/Charterunternehmen",
];

export function partnerTypeLabel(partner) {
  if (!partner?.typ) return "";
  if (partner.typ === "Bootsbauer" && partner.bootsbauer_typ?.length > 0) {
    return `Bootsbauer (${partner.bootsbauer_typ.join(" & ")})`;
  }
  return partner.typ;
}

// Summe der Folgeprämien eines Vertrags — aus BootsCRM_reference.jsx.
// Greift, sobald die Polizzen-Endpunkte stehen; bis dahin liefert sie 0.
export function vertragTotal(vertrag) {
  return (vertrag.sparten || []).reduce((sum, s) => sum + (s.folgepraemie ?? s.erstpraemie ?? 0), 0);
}
