// Kunden-Abgleich für den Import und die Antragsmasken — 1:1 aus
// BootsCRM_reference.jsx (Zeilen 561-571, 602-620). Bleibt im Frontend und
// arbeitet auf der ohnehin geladenen Kundenliste, wie in PROMPTS.md
// (Prompt 7) vorgesehen.
import { fullName } from "./helpers.js";

/* ===================== Kunden-Abgleich (für Mail-Import) ===================== */
export function normalizeForMatch(s) {
  return (s || "")
    .toLowerCase()
    .replace(/\b(ing|dr|mag|di|dipl[\s.-]*ing|prof|bmstr|kr|mba|llm|arch|mmag|dkfm|bsc|msc)\b\.?/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[,.]/g, "");
}
/* Vor-/Nachname/Titel -> Anzeigename. Fällt auf das alte Feld "name" zurück,
   falls ein Kunde noch im alten (Vor-Update-)Format gespeichert ist. */
export function findCustomerMatches(customers, incoming) {
  const incomingName = incoming.vorname || incoming.nachname ? fullName(incoming) : incoming.name;
  const n2 = normalizeForMatch(incomingName);
  const a2 = normalizeForMatch(incoming.adresse);
  if (!n2) return { exact: null, possible: [] };
  let exact = null;
  const possible = [];
  for (const c of customers) {
    const n1 = normalizeForMatch(fullName(c));
    const a1 = normalizeForMatch(c.adresse);
    if (!n1) continue;
    const nameMatch = n1 === n2;
    const addrMatch = a1 && a2 && (a1 === a2 || a1.includes(a2) || a2.includes(a1));
    if (nameMatch && addrMatch) { exact = c; break; }
    if (nameMatch || (addrMatch && a2)) possible.push(c);
  }
  return { exact, possible };
}

