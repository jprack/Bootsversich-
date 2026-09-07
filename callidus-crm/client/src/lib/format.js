// Aus BootsCRM_reference.jsx übernommen (Abschnitt "Hilfsfunktionen").
export const euro = (n) =>
  (Math.round((n + Number.EPSILON) * 100) / 100).toLocaleString("de-AT", {
    style: "currency",
    currency: "EUR",
  });

export const datum = (iso) => (iso ? new Date(iso).toLocaleDateString("de-AT") : "");
