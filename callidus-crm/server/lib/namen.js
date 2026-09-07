/* Vor-/Nachname/Titel -> Anzeigename. Fällt auf das alte Feld "name" zurück,
   falls ein Kunde noch im alten (Vor-Update-)Format gespeichert ist. */
// 1:1 aus BootsCRM_reference.jsx (Zeilen 572-576). Wird serverseitig für das
// denormalisierte Feld tasks.customer_name gebraucht.
export function fullName(c) {
  if (!c) return "";
  const composed = [c.titel, c.vorname, c.nachname].filter(Boolean).join(" ").trim();
  return composed || c.name || "";
}
