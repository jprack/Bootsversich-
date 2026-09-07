// Tarifberechnung — 1:1 aus BootsCRM_reference.jsx übernommen (Zeilen 9-303,
// 313-391, 621-772), programmatisch ausgeschnitten statt abgetippt.
// Geändert wurde ausschließlich: "export" vor den Top-Level-Deklarationen und
// der Import der Formatierungshelfer, die in der Referenz weiter oben standen.
//
// Läuft bewusst nur im Browser: reine Mathematik ohne Datenbankbezug, damit
// der Rechner bei jedem Tastendruck ohne Server-Roundtrip neu rechnet
// (so vorgesehen in ARCHITECTURE.md und PROMPTS.md, Prompt 5).
import { euro, pctFmt } from "./format.js";

export const thisYear = new Date().getFullYear();

/* =====================================================================
   DATENGRUNDLAGE — abgetippt aus:
   - NA_015_0824_Tarif.pdf  ("NAUTIMA Tarif", Mannheimer Versicherung AG, gültig ab 01.12.2024)
   - Draft_Callidus_Tarif_2026.xlsx  (interner Eigentarif-Entwurf, Stand 2026-01-21)

   Hinweise zu Lücken/Unklarheiten in den Rohdaten (siehe auch Info-Box in der App):
   - Callidus Kasko: in allen Sheets fehlt die Wertklasse 70.000–170.000 (Sprung von
     "< 70.000" direkt auf "170.000–300.000"). Diese Lücke wird NICHT interpoliert,
     sondern als "keine Tarifzeile vorhanden" ausgewiesen.
   - Callidus MY Mittelmeer: Spaltenüberschrift nennt "Verdränger/Gleiter", die
     Zeilen-Labels im Rohdokument lauten aber "Komfort/Sport" (vermutlich aus dem
     SY-Sheet kopiert). Wir übernehmen die Zahlen unverändert und ordnen sie
     Verdränger (1. Zeile) / Gleiter (2. Zeile) zu — bitte bei Callidus verifizieren.
   - Callidus SY Haftpflicht Segelfläche: Sprung von "100–200m²" auf "300m²" (keine
     Zeile für 200–300m²). Wir behandeln "300m²" als Obergrenze für 200–300m².
   ===================================================================== */

// ---------- NAUTIMA Kasko ----------
export const NAUTIMA_KASKO = {
  motorboot: [
    { maxVS: 30000, rows: [
      { sb: 0,    binnen: 1.65, europa: 1.87, nordost: 1.98, mittelmeer: null, atlantik: null },
      { sb: 250,  binnen: 1.10, europa: 1.65, nordost: 1.65, mittelmeer: 1.98, atlantik: null },
      { sb: 500,  binnen: null, europa: 1.49, nordost: 1.49, mittelmeer: 1.76, atlantik: null },
      { sb: 1000, binnen: null, europa: 1.32, nordost: 1.32, mittelmeer: 1.60, atlantik: null },
      { sb: 1500, binnen: null, europa: 1.16, nordost: 1.16, mittelmeer: 1.43, atlantik: null },
      { sb: 2000, binnen: null, europa: null, nordost: null, mittelmeer: null, atlantik: null },
    ]},
    { maxVS: 60000, rows: [
      { sb: 0,    binnen: null, europa: null, nordost: null, mittelmeer: null, atlantik: null },
      { sb: 250,  binnen: 1.27, europa: null, nordost: null, mittelmeer: null, atlantik: null },
      { sb: 500,  binnen: 1.10, europa: 1.38, nordost: 1.38, mittelmeer: 1.65, atlantik: null },
      { sb: 1000, binnen: null, europa: 1.21, nordost: 1.21, mittelmeer: 1.54, atlantik: null },
      { sb: 1500, binnen: null, europa: 1.10, nordost: 1.10, mittelmeer: 1.41, atlantik: null },
      { sb: 2000, binnen: null, europa: 0.99, nordost: 1.05, mittelmeer: 1.32, atlantik: null },
    ]},
    { maxVS: 100000, rows: [
      { sb: 0,    binnen: null, europa: null, nordost: null, mittelmeer: null, atlantik: null },
      { sb: 250,  binnen: null, europa: null, nordost: null, mittelmeer: null, atlantik: null },
      { sb: 500,  binnen: 1.05, europa: 1.32, nordost: 1.38, mittelmeer: 1.60, atlantik: null },
      { sb: 1000, binnen: 0.99, europa: 1.16, nordost: 1.21, mittelmeer: 1.43, atlantik: null },
      { sb: 1500, binnen: 0.94, europa: 1.08, nordost: 1.16, mittelmeer: 1.32, atlantik: null },
      { sb: 2000, binnen: null, europa: 0.99, nordost: 1.08, mittelmeer: 1.21, atlantik: null },
    ]},
    { maxVS: 150000, rows: [
      { sb: 0,    binnen: null, europa: null, nordost: null, mittelmeer: null, atlantik: null },
      { sb: 250,  binnen: null, europa: null, nordost: null, mittelmeer: null, atlantik: null },
      { sb: 500,  binnen: 0.99, europa: 1.27, nordost: 1.38, mittelmeer: 1.54, atlantik: null },
      { sb: 1000, binnen: 0.94, europa: 1.14, nordost: 1.32, mittelmeer: 1.38, atlantik: null },
      { sb: 1500, binnen: 0.90, europa: 1.06, nordost: 1.21, mittelmeer: 1.27, atlantik: null },
      { sb: 2000, binnen: null, europa: 0.97, nordost: 1.10, mittelmeer: 1.16, atlantik: 1.87 },
    ]},
    { maxVS: 300000, rows: [
      { sb: 0,    binnen: null, europa: null, nordost: null, mittelmeer: null, atlantik: null },
      { sb: 250,  binnen: null, europa: null, nordost: null, mittelmeer: null, atlantik: null },
      { sb: 500,  binnen: 0.94, europa: 1.21, nordost: 1.32, mittelmeer: 1.49, atlantik: null },
      { sb: 1000, binnen: 0.90, europa: 1.10, nordost: 1.27, mittelmeer: 1.32, atlantik: null },
      { sb: 1500, binnen: 0.87, europa: 1.03, nordost: 1.16, mittelmeer: 1.21, atlantik: null },
      { sb: 2000, binnen: null, europa: 0.95, nordost: 1.05, mittelmeer: 1.10, atlantik: 1.82 },
    ]},
  ],
  segelboot: [
    { maxVS: 30000, rows: [
      { sb: 0,    binnen: 1.54, europa: 1.65, nordost: 1.76, mittelmeer: null, atlantik: null },
      { sb: 250,  binnen: 0.99, europa: 1.16, nordost: 1.21, mittelmeer: 1.43, atlantik: null },
      { sb: 500,  binnen: null, europa: 1.05, nordost: 1.10, mittelmeer: 1.27, atlantik: null },
      { sb: 1000, binnen: null, europa: 0.94, nordost: 0.99, mittelmeer: 1.21, atlantik: null },
      { sb: 1500, binnen: null, europa: 0.86, nordost: 0.94, mittelmeer: 1.16, atlantik: null },
      { sb: 2000, binnen: null, europa: null, nordost: null, mittelmeer: 1.08, atlantik: null },
    ]},
    { maxVS: 60000, rows: [
      { sb: 0,    binnen: null, europa: null, nordost: null, mittelmeer: null, atlantik: null },
      { sb: 250,  binnen: 0.94, europa: 1.10, nordost: 1.16, mittelmeer: 1.38, atlantik: null },
      { sb: 500,  binnen: 0.91, europa: 0.99, nordost: 1.07, mittelmeer: 1.21, atlantik: 1.87 },
      { sb: 1000, binnen: null, europa: 0.94, nordost: 0.99, mittelmeer: 1.16, atlantik: 1.76 },
      { sb: 1500, binnen: null, europa: 0.85, nordost: 0.91, mittelmeer: 1.10, atlantik: 1.60 },
      { sb: 2000, binnen: null, europa: null, nordost: null, mittelmeer: 0.99, atlantik: 1.43 },
    ]},
    { maxVS: 100000, rows: [
      { sb: 0,    binnen: null, europa: null, nordost: null, mittelmeer: null, atlantik: null },
      { sb: 250,  binnen: 0.88, europa: 1.10, nordost: 1.21, mittelmeer: 1.32, atlantik: null },
      { sb: 500,  binnen: 0.86, europa: 0.94, nordost: 1.01, mittelmeer: 1.27, atlantik: 1.76 },
      { sb: 1000, binnen: 0.83, europa: 0.88, nordost: 0.96, mittelmeer: 1.05, atlantik: 1.49 },
      { sb: 1500, binnen: 0.80, europa: 0.83, nordost: 0.90, mittelmeer: 0.99, atlantik: 1.43 },
      { sb: 2000, binnen: null, europa: 0.79, nordost: 0.83, mittelmeer: 0.88, atlantik: 1.32 },
    ]},
    { maxVS: 150000, rows: [
      { sb: 0,    binnen: null, europa: null, nordost: null, mittelmeer: null, atlantik: null },
      { sb: 250,  binnen: null, europa: null, nordost: null, mittelmeer: null, atlantik: null },
      { sb: 500,  binnen: 0.88, europa: 0.92, nordost: 0.99, mittelmeer: 1.10, atlantik: 1.54 },
      { sb: 1000, binnen: 0.86, europa: 0.87, nordost: 0.94, mittelmeer: 0.99, atlantik: 1.45 },
      { sb: 1500, binnen: 0.80, europa: 0.81, nordost: 0.88, mittelmeer: 0.94, atlantik: 1.34 },
      { sb: 2000, binnen: null, europa: 0.77, nordost: 0.79, mittelmeer: 0.86, atlantik: 1.27 },
    ]},
    { maxVS: 300000, rows: [
      { sb: 0,    binnen: null, europa: null, nordost: null, mittelmeer: null, atlantik: null },
      { sb: 250,  binnen: null, europa: null, nordost: null, mittelmeer: null, atlantik: null },
      { sb: 500,  binnen: 0.86, europa: 0.90, nordost: 0.98, mittelmeer: 1.16, atlantik: 1.49 },
      { sb: 1000, binnen: 0.83, europa: 0.85, nordost: 0.92, mittelmeer: 1.01, atlantik: 1.40 },
      { sb: 1500, binnen: 0.78, europa: 0.79, nordost: 0.87, mittelmeer: 0.88, atlantik: 1.30 },
      { sb: 2000, binnen: null, europa: 0.77, nordost: 0.77, mittelmeer: 0.79, atlantik: 1.21 },
    ]},
  ],
};
export const NAUTIMA_KASKO_MINDEST = 150;

// ---------- NAUTIMA Haftpflicht ----------
// Motorboote: Gesamtmotorstärke "bis kW" -> [VS1(3Mio), VS2(5Mio), VS3(10Mio), VS4(15Mio)]
export const NAUTIMA_HP_MOTOR = {
  ohne: [
    { maxKW: 18.4,   v: [39.32, 42.69, 58.98, 75.27] },
    { maxKW: 36.8,   v: [50.56, 53.93, 71.35, 88.76] },
    { maxKW: 58.8,   v: [59.55, 78.65, 98.87, 119.09] },
    { maxKW: 73.5,   v: [67.41, 86.51, 108.42, 130.33] },
    { maxKW: 183.9,  v: [112.35, 122.46, 168.53, 214.59] },
    { maxKW: 367.6,  v: [180.88, 206.76, 247.75, 288.74] },
    { maxKW: 735.5,  v: [262.90, 299.97, 367.95, 435.92] },
    { maxKW: 1102.9, v: [341.54, 389.85, 470.19, 550.52] },
    { maxKW: 1470.6, v: [420.19, 479.73, 587.59, 695.45] },
    { maxKW: 1838.2, v: [498.83, 568.49, 697.13, 825.77] },
    { maxKW: 2205.9, v: [577.48, 658.37, 807.24, 956.10] },
    { maxKW: 2573.5, v: [661.37, 748.25, 917.34, 1086.42] },
    { maxKW: 2941.2, v: [786.45, 896.55, 1098.78, 1301.01] },
  ],
  mit: [
    { maxKW: 18.4,   v: [77.52, 86.51, 118.53, 150.55] },
    { maxKW: 36.8,   v: [102.24, 108.98, 143.81, 178.64] },
    { maxKW: 58.8,   v: [119.09, 158.41, 198.30, 238.18] },
    { maxKW: 73.5,   v: [135.94, 173.02, 216.84, 260.65] },
    { maxKW: 183.9,  v: [224.70, 246.05, 337.62, 429.18] },
    { maxKW: 367.6,  v: [362.89, 414.57, 496.03, 577.48] },
    { maxKW: 735.5,  v: [526.92, 599.95, 735.90, 871.84] },
    { maxKW: 1102.9, v: [684.21, 779.71, 955.54, 1131.36] },
    { maxKW: 1470.6, v: [841.50, 959.47, 1175.75, 1392.02] },
    { maxKW: 1838.2, v: [998.79, 1138.11, 1394.83, 1651.55] },
    { maxKW: 2205.9, v: [1156.08, 1317.87, 1615.04, 1912.20] },
    { maxKW: 2573.5, v: [1313.37, 1497.63, 1835.24, 2172.85] },
    { maxKW: 2941.2, v: [1572.90, 1793.11, 2197.57, 2602.03] },
  ],
};
// Segelboote: Segelfläche "bis m²" -> [VS1, VS2, VS3, VS4]
export const NAUTIMA_HP_SEGEL = {
  ohne: [
    { maxM2: 30,  v: [43.82, 50.56, 65.17, 79.77] },
    { maxM2: 50,  v: [64.04, 73.03, 89.88, 106.73] },
    { maxM2: 100, v: [114.60, 123.59, 151.12, 178.64] },
    { maxM2: 200, v: [120.21, 164.03, 209.53, 255.03] },
  ],
  mit: [
    { maxM2: 30,  v: [88.76, 102.24, 130.89, 159.54] },
    { maxM2: 50,  v: [129.20, 147.18, 180.89, 214.59] },
    { maxM2: 100, v: [229.19, 247.17, 302.22, 357.27] },
    { maxM2: 200, v: [240.43, 329.19, 419.63, 510.07] },
  ],
};
export const NAUTIMA_HP_MINDEST = 35;
export const NAUTIMA_SICHERHEITSLEISTUNG_BEITRAG = 38.00; // fix: 25.000 € Versicherungssumme, Tarif Ziff. 1.5
export const NAUTIMA_INSASSENUNFALL = { BASIS: 36.75, KOMFORT: 73.50, TOP: 110.25 };

// ---------- Callidus Eigentarif (Draft 2026) ----------
// Kasko-Bracket-Helper: min inklusive, max exklusive; gap = Lücke in den Rohdaten; anfrage = "auf Anforderung"
export function ccBrackets(list) { return list; }

export const CALLIDUS_SY_KASKO_BINNEN = {
  minPraemie: { Komfort: 120, Sport: 150 },
  sbOptions: [500, 1000, 2500, 5000],
  brackets: ccBrackets([
    { min: 0, max: 70000, label: "< 70.000", rates: {
      Komfort: { 500: 0.0065, 1000: 0.0055, 2500: 0.0052, 5000: null },
      Sport:   { 500: 0.0066, 1000: 0.0056, 2500: null,   5000: null },
    }},
    { min: 70000, max: 170000, gap: true, label: "70.000 – 170.000 (keine Daten)" },
    { min: 170000, max: 300000, label: "170.000 – 300.000", rates: {
      Komfort: { 500: 0.0043, 1000: 0.0038, 2500: 0.0034, 5000: null },
      Sport:   { 500: 0.0055, 1000: 0.0051, 2500: 0.0046, 5000: null },
    }},
    // Ergänzt: 300.000–500.000, hergeleitet nach demselben Muster wie die bestehende
    // Erweiterung bei SY/MY Mittelmeer (Sätze 1.000/2.500 unverändert aus der Klasse
    // 170.000–300.000 übernommen, neuer Selbstbehalt 5.000 mit Faktor 0,82 auf den
    // 2.500-Satz extrapoliert). Nicht offiziell freigegeben, siehe Kommentare in der Excel.
    { min: 300000, max: 500000, label: "300.000 – 500.000", rates: {
      Komfort: { 500: null, 1000: 0.0038, 2500: 0.0034, 5000: 0.0028 },
      Sport:   { 500: null, 1000: 0.0051, 2500: 0.0046, 5000: 0.0038 },
    }},
    { min: 500000, max: Infinity, anfrage: true, label: "≥ 500.000 (auf Anfrage)" },
  ]),
};

export const CALLIDUS_SY_KASKO_MITTELMEER = {
  minPraemie: { Komfort: 150, Sport: 180 },
  sbOptions: [1000, 2500, 5000, 7500],
  brackets: ccBrackets([
    { min: 0, max: 70000, label: "< 70.000", rates: {
      Komfort: { 1000: 0.008,  2500: 0.007,  5000: 0.006,  7500: null },
      Sport:   { 1000: 0.0083, 2500: 0.0074, 5000: 0.0065, 7500: null },
    }},
    { min: 70000, max: 170000, gap: true, label: "70.000 – 170.000 (keine Daten)" },
    { min: 170000, max: 300000, label: "170.000 – 300.000", rates: {
      Komfort: { 1000: 0.0051, 2500: 0.0046, 5000: 0.0041, 7500: null },
      Sport:   { 1000: 0.0066, 2500: 0.006,  5000: 0.0053, 7500: null },
    }},
    { min: 300000, max: 500000, label: "300.000 – 500.000", rates: {
      Komfort: { 1000: null, 2500: 0.0046, 5000: 0.0041, 7500: 0.0034 },
      Sport:   { 1000: null, 2500: 0.006,  5000: 0.0053, 7500: 0.0043 },
    }},
    { min: 500000, max: 1000000, label: "500.000 – 1.000.000", rates: {
      Komfort: { 1000: null, 2500: 0.0045, 5000: 0.0040, 7500: 0.0033 },
      Sport:   { 1000: null, 2500: 0.0059, 5000: 0.0052, 7500: 0.0042 },
    }},
    { min: 1000000, max: Infinity, anfrage: true, label: "≥ 1.000.000 (auf Anfrage)" },
  ]),
};

export const CALLIDUS_MY_KASKO_BINNEN = {
  minPraemie: { Verdraenger: 120, Gleiter: 150 },
  sbOptions: [1000, 2500, 5000, 7500, 10000],
  brackets: ccBrackets([
    { min: 0, max: 70000, label: "< 70.000", rates: {
      Verdraenger: { 1000: 0.0083, 2500: 0.0075, 5000: 0.0068, 7500: null,   10000: null },
      Gleiter:     { 1000: 0.0087, 2500: 0.008,  5000: 0.0073, 7500: null,   10000: null },
    }},
    { min: 70000, max: 170000, gap: true, label: "70.000 – 170.000 (keine Daten)" },
    { min: 170000, max: 300000, label: "170.000 – 300.000", rates: {
      Verdraenger: { 1000: 0.006,  2500: 0.0051, 5000: 0.0046, 7500: null,   10000: null },
      Gleiter:     { 1000: 0.0074, 2500: 0.0068, 5000: 0.0064, 7500: 0.0058, 10000: null },
    }},
    { min: 300000, max: 500000, label: "300.000 – 500.000", rates: {
      Verdraenger: { 1000: null, 2500: 0.0051, 5000: 0.0045, 7500: 0.0034, 10000: null },
      Gleiter:     { 1000: null, 2500: 0.0068, 5000: 0.0061, 7500: 0.0048, 10000: 0.0040 },
    }},
    { min: 500000, max: 1000000, label: "500.000 – 1.000.000", rates: {
      Verdraenger: { 1000: null, 2500: null, 5000: 0.0045, 7500: 0.0034, 10000: null },
      Gleiter:     { 1000: null, 2500: null, 5000: 0.0059, 7500: 0.0047, 10000: 0.0038 },
    }},
    { min: 1000000, max: Infinity, anfrage: true, label: "≥ 1.000.000 (auf Anfrage)" },
  ]),
};

// Hinweis: Rohdaten-Spaltenkopf nennt "Verdränger/Gleiter", Zeilen-Label im Sheet lauten
// "Komfort/Sport" (Kopie aus SY-Sheet). Zahlen unverändert übernommen, 1. Zeile -> Verdränger, 2. Zeile -> Gleiter.
export const CALLIDUS_MY_KASKO_MITTELMEER = {
  minPraemie: { Verdraenger: 150, Gleiter: 180 },
  sbOptions: [1000, 2500, 5000, 7500, 10000],
  brackets: ccBrackets([
    { min: 0, max: 70000, label: "< 70.000", rates: {
      Verdraenger: { 1000: 0.0088, 2500: 0.008,  5000: 0.0073, 7500: null,   10000: null },
      Gleiter:     { 1000: 0.0092, 2500: 0.0085, 5000: 0.0078, 7500: null,   10000: null },
    }},
    { min: 70000, max: 170000, gap: true, label: "70.000 – 170.000 (keine Daten)" },
    { min: 170000, max: 300000, label: "170.000 – 300.000", rates: {
      Verdraenger: { 1000: 0.0065, 2500: 0.0056, 5000: 0.0051, 7500: null,   10000: null },
      Gleiter:     { 1000: 0.0079, 2500: 0.0073, 5000: 0.0069, 7500: 0.0063, 10000: null },
    }},
    { min: 300000, max: 500000, label: "300.000 – 500.000", rates: {
      Verdraenger: { 1000: null, 2500: 0.0056, 5000: 0.0050, 7500: 0.0039, 10000: null },
      Gleiter:     { 1000: null, 2500: 0.0073, 5000: 0.0066, 7500: 0.0053, 10000: 0.0045 },
    }},
    { min: 500000, max: 1000000, label: "500.000 – 1.000.000", rates: {
      Verdraenger: { 1000: null, 2500: null, 5000: 0.0050, 7500: 0.0039, 10000: null },
      Gleiter:     { 1000: null, 2500: null, 5000: 0.0064, 7500: 0.0052, 10000: 0.0043 },
    }},
    { min: 1000000, max: Infinity, anfrage: true, label: "≥ 1.000.000 (auf Anfrage)" },
  ]),
};

// Callidus Zuschläge auf Kasko-Grundprämie
export const CALLIDUS_KASKO_ZUSCHLAEGE = {
  alter20: 0.10,       // Boot älter 20 Jahre
  charterSkipper: 0.25,
  charterOhneSkipper: 0.50,
  maschinendeckung: 0.15,
  holzCarbon: 0.25,
};

// Callidus Haftpflicht
export const CALLIDUS_SY_HP = { // Segelfläche bis m² -> [5 Mio, 10 Mio]
  brackets: [
    { maxM2: 50,  v: [65, 75] },
    { maxM2: 100, v: [120, 150] },
    { maxM2: 200, v: [160, 210] },
    { maxM2: 300, v: [200, 250] },
  ],
};
export const CALLIDUS_MY_HP = { // kW bis -> [5 Mio, 10 Mio]  (Originaltabelle in PS, hier auf kW umgerechnet)
  brackets: [
    { maxKW: 11,  v: [45, 58.5] },
    { maxKW: 37,  v: [54, 70.2] },
    { maxKW: 74,  v: [90, 117] },
    { maxKW: 184, v: [130, 169] },
    { maxKW: 368, v: [210, 273] },
    { maxKW: 552, v: [250, 325] },
    { maxKW: 740, v: [300, 390] },
  ],
};
export const CALLIDUS_VERCHARTER_AUFSCHLAG = 270;


export function findNautimaVSBracket(table, vs) {
  return table.find((b) => vs <= b.maxVS) || null;
}
export function nautimaAvailableSB(bracket, zone) {
  if (!bracket) return [];
  return bracket.rows.filter((r) => r[zone] != null).map((r) => r.sb);
}
export function nautimaRate(bracket, zone, sb) {
  if (!bracket) return null;
  const row = bracket.rows.find((r) => r.sb === sb);
  if (!row || row[zone] == null) return null;
  // Tabellenwerte sind als Prozentzahl abgetippt (z. B. 1.65 für "1,65 %") -> durch 100 auf Dezimalbruch bringen
  return row[zone] / 100;
}
export function findNautimaHPBracketKW(table, kw) {
  return table.find((b) => kw <= b.maxKW) || null;
}
export function findNautimaHPBracketM2(table, m2) {
  return table.find((b) => m2 <= b.maxM2) || null;
}

export const CALLIDUS_GAP_MIN = 70000;
export const CALLIDUS_GAP_MAX = 170000;

// Ermittelt den Prämiensatz für eine Wertklasse. Liegt die Versicherungssumme in der
// Datenlücke 70.000–170.000 €, wird linear zwischen dem Satz der "< 70.000"-Zeile und
// dem Satz der "170.000–300.000"-Zeile interpoliert (Steigung = Satzdifferenz / 100.000 €).
export function resolveCallidusRate(tarif, vs, kategorie, sb) {
  if (vs >= CALLIDUS_GAP_MIN && vs < CALLIDUS_GAP_MAX) {
    const low = tarif.brackets.find((b) => !b.gap && b.max === CALLIDUS_GAP_MIN);
    const high = tarif.brackets.find((b) => !b.gap && b.min === CALLIDUS_GAP_MAX);
    const rLow = low?.rates?.[kategorie]?.[sb];
    const rHigh = high?.rates?.[kategorie]?.[sb];
    if (rLow == null || rHigh == null) return null;
    const steigung = (rHigh - rLow) / (CALLIDUS_GAP_MAX - CALLIDUS_GAP_MIN);
    const rate = rLow + steigung * (vs - CALLIDUS_GAP_MIN);
    return { rate, interpolated: true, steigung, rLow, rHigh };
  }
  const bracket = tarif.brackets.find((b) => !b.gap && vs >= b.min && vs < b.max);
  if (!bracket || bracket.anfrage) return null;
  const rate = bracket.rates?.[kategorie]?.[sb];
  if (rate == null) return null;
  return { rate, interpolated: false, label: bracket.label };
}
// Status der Wertklasse unabhängig vom Selbstbehalt (für Warnhinweise in der UI)
export function callidusVSStatus(tarif, vs) {
  if (vs >= CALLIDUS_GAP_MIN && vs < CALLIDUS_GAP_MAX) return "interpoliert";
  const bracket = tarif.brackets.find((b) => !b.gap && vs >= b.min && vs < b.max);
  if (bracket?.anfrage) return "anfrage";
  if (!bracket) return "ausserhalb";
  return "normal";
}
export function callidusAvailableSBForVS(tarif, vs, kategorie, sbOptions) {
  return sbOptions.filter((sb) => resolveCallidusRate(tarif, vs, kategorie, sb) != null);
}
export function findCallidusHPBracketKW(table, kw) {
  return table.find((b) => kw <= b.maxKW) || null;
}
export function findCallidusHPBracketM2(table, m2) {
  return table.find((b) => m2 <= b.maxM2) || null;
}

export const ZONEN = [
  { key: "binnensee", label: "Namentlich benannter deutscher Binnensee", table: "binnen", cc: "binnen" },
  { key: "binnen", label: "Deutsche Binnengewässer (ohne Erweiterung)", table: "binnen", cc: "binnen" },
  { key: "europa", label: "Europäische Binnengewässer", table: "europa", cc: "binnen" },
  { key: "nordost", label: "Nord- und Ostsee", table: "nordost", cc: "mittelmeer" },
  { key: "mittelmeer", label: "Mittelmeer", table: "mittelmeer", cc: "mittelmeer" },
  { key: "atlantik", label: "Östlicher Atlantik", table: "atlantik", cc: "mittelmeer" },
];

export const SFR_OPTIONEN = [
  { key: "neu", label: "Neuvertrag (kein SFR)", satz: 0 },
  { key: "j1", label: "Nach 1. schadenfreiem Jahr", satz: 0.15 },
  { key: "j2", label: "Nach 2. schadenfreiem Jahr", satz: 0.25 },
  { key: "j3", label: "Nach 3. schadenfreiem Jahr", satz: 0.40 },
  { key: "j4", label: "Nach 4.+ schadenfreiem Jahr", satz: 0.40 },
];

/* ===================== Prämien-Berechnung ===================== */
export function calcNautima(input) {
  const {
    bootstyp, baujahr, versicherungssumme, zone, selbstbehalt,
    charter, unterschlagung, schlauchboot, binnenseeNachlass,
    premiumHersteller, verdraengerNachlass, sfr, hpVS, motorkw, segelflaeche,
    insassenunfall,
  } = input;

  const alter = thisYear - baujahr;
  const warnings = [];
  const kaskoTable = schlauchboot ? NAUTIMA_KASKO.motorboot : NAUTIMA_KASKO[bootstyp];
  const bracket = findNautimaVSBracket(kaskoTable, versicherungssumme);

  let kasko = null;
  if (!bracket) {
    warnings.push("Kasko: Versicherungssumme über 300.000 € – Angebot nur auf Anfrage möglich.");
  } else {
    const rate = nautimaRate(bracket, zone, selbstbehalt);
    if (rate == null) {
      warnings.push("Kasko: Für diese Kombination aus Wertklasse, Selbstbehalt und Fahrtgebiet bietet NAUTIMA keine Deckung. Bitte Selbstbehalt anpassen.");
    } else {
      const grund = versicherungssumme * rate;
      let zuschlagSumme = 0;
      const posten = [{ label: `Grundprämie (${pctFmt(rate)} von ${euro(versicherungssumme)})`, wert: grund }];

      let saldo = 0;
      if (alter > (bootstyp === "motorboot" ? 15 : 20)) { saldo += 0.10; posten.push({ label: `Altersaufschlag (Boot ${alter} Jahre alt)`, prozent: 0.10 }); }
      if (schlauchboot) { saldo += 0.20; posten.push({ label: "Schlauchboot-Zuschlag", prozent: 0.20 }); }
      if (charter === "mit") { saldo += 0.25; posten.push({ label: "Charterrisiko mit Skipper", prozent: 0.25 }); }
      if (charter === "ohne") {
        saldo += 0.50; posten.push({ label: "Charterrisiko ohne Skipper", prozent: 0.50 });
        if (unterschlagung) { saldo += 0.30; posten.push({ label: "Unterschlagungsrisiko", prozent: 0.30 }); }
      }
      if (binnenseeNachlass) { saldo -= 0.10; posten.push({ label: "Nachlass Binnensee (Bodensee etc.)", prozent: -0.10 }); }
      if (premiumHersteller && bootstyp === "segelboot") { saldo -= 0.10; posten.push({ label: "Nachlass Premium-Hersteller", prozent: -0.10 }); }
      if (verdraengerNachlass && bootstyp === "motorboot") { saldo -= 0.10; posten.push({ label: "Nachlass Verdränger bis 150 kW", prozent: -0.10 }); }

      const nachZuschlag = grund * (1 + saldo);
      if (saldo !== 0) posten.push({ label: `Zwischensumme nach Zu-/Abschlägen (Saldo ${pctFmt(saldo)})`, wert: nachZuschlag, betont: true });

      const sfrSatz = SFR_OPTIONEN.find((s) => s.key === sfr)?.satz ?? 0;
      const nachSFR = nachZuschlag * (1 - sfrSatz);
      if (sfrSatz > 0) posten.push({ label: `Schadenfreiheitsrabatt (${pctFmt(sfrSatz)})`, wert: -(nachZuschlag * sfrSatz) });

      const endpreis = Math.max(nachSFR, NAUTIMA_KASKO_MINDEST);
      if (nachSFR < NAUTIMA_KASKO_MINDEST) posten.push({ label: `Mindestbeitrag greift (${euro(NAUTIMA_KASKO_MINDEST)})`, wert: NAUTIMA_KASKO_MINDEST, betont: true });

      kasko = { betrag: endpreis, posten, rate, zuschlagSaldo: saldo };
    }
  }

  // Haftpflicht
  let hp = null;
  const hpMitVermietung = charter !== "keine";
  if (bootstyp === "motorboot") {
    const table = NAUTIMA_HP_MOTOR[hpMitVermietung ? "mit" : "ohne"];
    const b = findNautimaHPBracketKW(table, motorkw);
    if (!b) warnings.push("Haftpflicht: Motorstärke außerhalb der Tabelle (> 2941,2 kW) – Angebot nur auf Anfrage.");
    else hp = { betrag: Math.max(b.v[hpVS], NAUTIMA_HP_MINDEST), basis: `bis ${b.maxKW} kW, ${hpMitVermietung ? "mit" : "ohne"} Vermietung` };
  } else {
    const table = NAUTIMA_HP_SEGEL[hpMitVermietung ? "mit" : "ohne"];
    const b = findNautimaHPBracketM2(table, segelflaeche);
    if (!b) warnings.push("Haftpflicht: Segelfläche außerhalb der Tabelle (> 200 m²) – Angebot nur auf Anfrage.");
    else hp = { betrag: Math.max(b.v[hpVS], NAUTIMA_HP_MINDEST), basis: `bis ${b.maxM2} m², ${hpMitVermietung ? "mit" : "ohne"} Vermietung` };
  }

  const iuBetrag = insassenunfall !== "keine" ? NAUTIMA_INSASSENUNFALL[insassenunfall] : 0;

  const gesamt = (kasko?.betrag || 0) + (hp?.betrag || 0) + iuBetrag;
  return { kasko, hp, iuBetrag, gesamt, warnings };
}

export function calcCallidus(input) {
  const {
    bootstyp, baujahr, versicherungssumme, zone, selbstbehalt,
    charter, maschinendeckung, holzCarbon, kategorie,
    hpVS, motorkw, segelflaeche,
  } = input;

  const alter = thisYear - baujahr;
  const warnings = [];
  const ccZone = ZONEN.find((z) => z.key === zone)?.cc || "binnen";

  const tarif = bootstyp === "segelboot"
    ? (ccZone === "binnen" ? CALLIDUS_SY_KASKO_BINNEN : CALLIDUS_SY_KASKO_MITTELMEER)
    : (ccZone === "binnen" ? CALLIDUS_MY_KASKO_BINNEN : CALLIDUS_MY_KASKO_MITTELMEER);

  const kat = bootstyp === "segelboot" ? kategorie.sy : kategorie.my; // "Komfort"/"Sport" oder "Verdraenger"/"Gleiter"
  const vsStatus = callidusVSStatus(tarif, versicherungssumme);

  let kasko = null;
  if (vsStatus === "ausserhalb") {
    warnings.push("Kasko: Versicherungssumme liegt außerhalb der Tabelle.");
  } else if (vsStatus === "anfrage") {
    warnings.push("Kasko: Wertklasse oberhalb der Tabelle – nur Angebot auf Anforderung.");
  } else {
    const r = resolveCallidusRate(tarif, versicherungssumme, kat, selbstbehalt);
    if (!r) {
      warnings.push("Kasko: Für diese Kombination aus Wertklasse und Selbstbehalt bietet der Callidus-Tarif keine Zeile (auch nicht durch Interpolation). Bitte Selbstbehalt anpassen.");
    } else {
      const grund = versicherungssumme * r.rate;
      const posten = [];
      if (r.interpolated) {
        posten.push({ note: true, label: `Wertklasse 70.000–170.000 € nicht in den Rohdaten – Satz linear interpoliert: ${pctFmt(r.rLow)} (bei 70.000 €) → ${pctFmt(r.rHigh)} (bei 170.000 €), Steigung ${(r.steigung * 100000).toLocaleString("de-AT", { maximumFractionDigits: 3 })} %-Punkte je 100.000 €` });
      }
      posten.push({ label: `Grundprämie (${pctFmt(r.rate)} von ${euro(versicherungssumme)})`, wert: grund });
      let saldo = 0;
      if (alter > 20) { saldo += CALLIDUS_KASKO_ZUSCHLAEGE.alter20; posten.push({ label: `Altersaufschlag (Boot ${alter} Jahre alt)`, prozent: CALLIDUS_KASKO_ZUSCHLAEGE.alter20 }); }
      if (charter === "mit") { saldo += CALLIDUS_KASKO_ZUSCHLAEGE.charterSkipper; posten.push({ label: "Charterrisiko mit Skipper", prozent: CALLIDUS_KASKO_ZUSCHLAEGE.charterSkipper }); }
      if (charter === "ohne") { saldo += CALLIDUS_KASKO_ZUSCHLAEGE.charterOhneSkipper; posten.push({ label: "Charterrisiko ohne Skipper", prozent: CALLIDUS_KASKO_ZUSCHLAEGE.charterOhneSkipper }); }
      if (maschinendeckung) { saldo += CALLIDUS_KASKO_ZUSCHLAEGE.maschinendeckung; posten.push({ label: "Maschinendeckung", prozent: CALLIDUS_KASKO_ZUSCHLAEGE.maschinendeckung }); }
      if (holzCarbon) { saldo += CALLIDUS_KASKO_ZUSCHLAEGE.holzCarbon; posten.push({ label: "Holz-/Carbon-Aufschlag", prozent: CALLIDUS_KASKO_ZUSCHLAEGE.holzCarbon }); }

      const nachZuschlag = grund * (1 + saldo);
      if (saldo !== 0) posten.push({ label: `Zwischensumme nach Zuschlägen (Saldo ${pctFmt(saldo)})`, wert: nachZuschlag, betont: true });

      const mindest = tarif.minPraemie[kat];
      const endpreis = Math.max(nachZuschlag, mindest);
      if (nachZuschlag < mindest) posten.push({ label: `Mindestprämie greift (${euro(mindest)})`, wert: mindest, betont: true });

      kasko = { betrag: endpreis, posten, rate: r.rate, zuschlagSaldo: saldo };
    }
  }

  // Haftpflicht
  let hp = null;
  const vercharter = charter !== "keine";
  if (bootstyp === "motorboot") {
    const b = findCallidusHPBracketKW(CALLIDUS_MY_HP.brackets, motorkw);
    if (!b) warnings.push("Haftpflicht: Motorleistung außerhalb der Tabelle (> 740 kW) – Angebot nur auf Anfrage.");
    else {
      const basis = b.v[hpVS]; // hpVS: 0 = 5 Mio., 1 = 10 Mio.
      hp = { betragBasis: basis, basis: `bis ${b.maxKW} kW` };
    }
  } else {
    const b = findCallidusHPBracketM2(CALLIDUS_SY_HP.brackets, segelflaeche);
    if (!b) warnings.push("Haftpflicht: Segelfläche außerhalb der Tabelle (> 300 m²) – Angebot nur auf Anfrage.");
    else {
      const basis = b.v[hpVS];
      hp = { betragBasis: basis, basis: `bis ${b.maxM2} m²` };
    }
  }
  if (hp) {
    const zuschlag = vercharter ? CALLIDUS_VERCHARTER_AUFSCHLAG : 0;
    hp.betrag = hp.betragBasis + zuschlag;
    hp.zuschlag = zuschlag;
  }

  const gesamt = (kasko?.betrag || 0) + (hp?.betrag || 0);
  return { kasko, hp, gesamt, warnings };
}
