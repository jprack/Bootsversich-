// Formatierung — 1:1 aus BootsCRM_reference.jsx (Zeilen 306-310).
export const euro = (n) => (Math.round((n + Number.EPSILON) * 100) / 100)
  .toLocaleString("de-AT", { style: "currency", currency: "EUR" });
export const pctFmt = (n) => (n * 100).toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " %";
export const euro2 = (n) => (Math.round((n + Number.EPSILON) * 100) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const pct2 = (n) => (n * 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const datum = (iso) => (iso ? new Date(iso).toLocaleDateString("de-AT") : "");
