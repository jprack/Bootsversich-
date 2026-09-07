import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Ship, Users, Calculator, FileText, Upload, Plus, X, Search,
  Trash2, Download, ChevronRight, ChevronDown, AlertTriangle,
  Anchor, Eye, Save, Loader2, Compass, Info, Check, Mail, FileCheck2, Send, Copy,
  Phone, Calendar
} from "lucide-react";

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
const NAUTIMA_KASKO = {
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
const NAUTIMA_KASKO_MINDEST = 150;

// ---------- NAUTIMA Haftpflicht ----------
// Motorboote: Gesamtmotorstärke "bis kW" -> [VS1(3Mio), VS2(5Mio), VS3(10Mio), VS4(15Mio)]
const NAUTIMA_HP_MOTOR = {
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
const NAUTIMA_HP_SEGEL = {
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
const NAUTIMA_HP_MINDEST = 35;
const NAUTIMA_SICHERHEITSLEISTUNG_BEITRAG = 38.00; // fix: 25.000 € Versicherungssumme, Tarif Ziff. 1.5
const NAUTIMA_INSASSENUNFALL = { BASIS: 36.75, KOMFORT: 73.50, TOP: 110.25 };

// ---------- Callidus Eigentarif (Draft 2026) ----------
// Kasko-Bracket-Helper: min inklusive, max exklusive; gap = Lücke in den Rohdaten; anfrage = "auf Anforderung"
function ccBrackets(list) { return list; }

const CALLIDUS_SY_KASKO_BINNEN = {
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

const CALLIDUS_SY_KASKO_MITTELMEER = {
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

const CALLIDUS_MY_KASKO_BINNEN = {
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
const CALLIDUS_MY_KASKO_MITTELMEER = {
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
const CALLIDUS_KASKO_ZUSCHLAEGE = {
  alter20: 0.10,       // Boot älter 20 Jahre
  charterSkipper: 0.25,
  charterOhneSkipper: 0.50,
  maschinendeckung: 0.15,
  holzCarbon: 0.25,
};

// Callidus Haftpflicht
const CALLIDUS_SY_HP = { // Segelfläche bis m² -> [5 Mio, 10 Mio]
  brackets: [
    { maxM2: 50,  v: [65, 75] },
    { maxM2: 100, v: [120, 150] },
    { maxM2: 200, v: [160, 210] },
    { maxM2: 300, v: [200, 250] },
  ],
};
const CALLIDUS_MY_HP = { // kW bis -> [5 Mio, 10 Mio]  (Originaltabelle in PS, hier auf kW umgerechnet)
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
const CALLIDUS_VERCHARTER_AUFSCHLAG = 270;

/* ===================== Hilfsfunktionen ===================== */
const euro = (n) => (Math.round((n + Number.EPSILON) * 100) / 100)
  .toLocaleString("de-AT", { style: "currency", currency: "EUR" });
const pctFmt = (n) => (n * 100).toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " %";
const euro2 = (n) => (Math.round((n + Number.EPSILON) * 100) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct2 = (n) => (n * 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const uid = () => Math.random().toString(36).slice(2, 10);
const thisYear = new Date().getFullYear();

function findNautimaVSBracket(table, vs) {
  return table.find((b) => vs <= b.maxVS) || null;
}
function nautimaAvailableSB(bracket, zone) {
  if (!bracket) return [];
  return bracket.rows.filter((r) => r[zone] != null).map((r) => r.sb);
}
function nautimaRate(bracket, zone, sb) {
  if (!bracket) return null;
  const row = bracket.rows.find((r) => r.sb === sb);
  if (!row || row[zone] == null) return null;
  // Tabellenwerte sind als Prozentzahl abgetippt (z. B. 1.65 für "1,65 %") -> durch 100 auf Dezimalbruch bringen
  return row[zone] / 100;
}
function findNautimaHPBracketKW(table, kw) {
  return table.find((b) => kw <= b.maxKW) || null;
}
function findNautimaHPBracketM2(table, m2) {
  return table.find((b) => m2 <= b.maxM2) || null;
}

const CALLIDUS_GAP_MIN = 70000;
const CALLIDUS_GAP_MAX = 170000;

// Ermittelt den Prämiensatz für eine Wertklasse. Liegt die Versicherungssumme in der
// Datenlücke 70.000–170.000 €, wird linear zwischen dem Satz der "< 70.000"-Zeile und
// dem Satz der "170.000–300.000"-Zeile interpoliert (Steigung = Satzdifferenz / 100.000 €).
function resolveCallidusRate(tarif, vs, kategorie, sb) {
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
function callidusVSStatus(tarif, vs) {
  if (vs >= CALLIDUS_GAP_MIN && vs < CALLIDUS_GAP_MAX) return "interpoliert";
  const bracket = tarif.brackets.find((b) => !b.gap && vs >= b.min && vs < b.max);
  if (bracket?.anfrage) return "anfrage";
  if (!bracket) return "ausserhalb";
  return "normal";
}
function callidusAvailableSBForVS(tarif, vs, kategorie, sbOptions) {
  return sbOptions.filter((sb) => resolveCallidusRate(tarif, vs, kategorie, sb) != null);
}
function findCallidusHPBracketKW(table, kw) {
  return table.find((b) => kw <= b.maxKW) || null;
}
function findCallidusHPBracketM2(table, m2) {
  return table.find((b) => m2 <= b.maxM2) || null;
}

const ZONEN = [
  { key: "binnensee", label: "Namentlich benannter deutscher Binnensee", table: "binnen", cc: "binnen" },
  { key: "binnen", label: "Deutsche Binnengewässer (ohne Erweiterung)", table: "binnen", cc: "binnen" },
  { key: "europa", label: "Europäische Binnengewässer", table: "europa", cc: "binnen" },
  { key: "nordost", label: "Nord- und Ostsee", table: "nordost", cc: "mittelmeer" },
  { key: "mittelmeer", label: "Mittelmeer", table: "mittelmeer", cc: "mittelmeer" },
  { key: "atlantik", label: "Östlicher Atlantik", table: "atlantik", cc: "mittelmeer" },
];

const SFR_OPTIONEN = [
  { key: "neu", label: "Neuvertrag (kein SFR)", satz: 0 },
  { key: "j1", label: "Nach 1. schadenfreiem Jahr", satz: 0.15 },
  { key: "j2", label: "Nach 2. schadenfreiem Jahr", satz: 0.25 },
  { key: "j3", label: "Nach 3. schadenfreiem Jahr", satz: 0.40 },
  { key: "j4", label: "Nach 4.+ schadenfreiem Jahr", satz: 0.40 },
];

/* ===================== Status-Pipeline (Offert -> Antrag -> Polizze) ===================== */
const STATUS_OPTIONS = [
  { key: "offert", label: "Offert", color: "#41505A" },
  { key: "antrag", label: "Antrag", color: "#0F6EBE" },
  { key: "polizze", label: "Polizze", color: "#032856" },
];
function statusInfo(key) {
  return STATUS_OPTIONS.find((s) => s.key === key) || null;
}
const PARTNER_TYPES = ["Versicherungsmakler", "Sachverständiger", "Bootsbauer", "Marina/Charterunternehmen"];
const QUELLE_OPTIONS = ["Kundenempfehlung", "Partner-Empfehlung", "Newsletter", "Website", "Regatta/Verein", "Mundpropaganda", "Adria/Mittelmeer-Kontakt", "Sonstiges"];

function getWeekBounds(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=So .. 6=Sa
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const nextMonday = new Date(monday.getTime() + 7 * 86400000);
  return { start: monday, end: nextMonday };
}

/* ===================== Aufgabentracking (Angebot-Nachfassen) ===================== */
const OFFERT_NACHFASS_TAGE = [3, 5, 14]; // Werktage nach Angebotserstellung
function addBusinessDays(startDate, days) {
  const d = new Date(startDate);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay(); // 0=So, 6=Sa
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}
async function createOffertTasks(customer) {
  const now = new Date();
  for (const tage of OFFERT_NACHFASS_TAGE) {
    const faelligkeitsdatum = addBusinessDays(now, tage).toISOString();
    const task = {
      id: uid(), customerId: customer.id, customerName: fullName(customer),
      titel: `Angebot nachfassen (${tage} Werktage)`,
      tage, faelligkeitsdatum, erstellt: now.toISOString(), erledigt: false,
    };
    try { await storageSetJSON(`task:${task.id}`, task, true); } catch (e) {}
  }
}

/* ===================== Historie (Kontaktverlauf) ===================== */
const HISTORIE_TYPEN = ["Anruf", "E-Mail", "Termin", "Notiz", "Sonstiges"];
// Fügt am angegebenen (bereits geladenen) Kundensatz einen Historie-Eintrag an und speichert ihn.
// Gibt den aktualisierten Kundensatz zurück, damit Aufrufer ihn weiterverwenden können.
async function appendHistorie(customer, typ, text, system) {
  const eintrag = { id: uid(), datum: new Date().toISOString(), typ, text, system: !!system };
  const updated = { ...customer, historie: [eintrag, ...(customer.historie || [])] };
  await storageSetJSON(`customer:${customer.id}`, updated, true);
  return updated;
}

const EMPFEHLUNG_NACHFASS_TAGE = 30; // Kalendertage nach Polizze-Abschluss
async function createEmpfehlungsTask(customer) {
  const now = new Date();
  const faelligkeitsdatum = new Date(now.getTime() + EMPFEHLUNG_NACHFASS_TAGE * 86400000).toISOString();
  const task = {
    id: uid(), customerId: customer.id, customerName: fullName(customer),
    titel: "Nach Empfehlung fragen",
    tage: EMPFEHLUNG_NACHFASS_TAGE, faelligkeitsdatum, erstellt: now.toISOString(), erledigt: false,
  };
  try { await storageSetJSON(`task:${task.id}`, task, true); } catch (e) {}
}

// Kündigung bestehender Vorversicherungen: gesetzliche/vertragliche Frist ist 4 Monate vor Hauptfälligkeit.
const KUENDIGUNG_MONATE_VOR_HAUPTFAELLIGKEIT = 4;
const KUENDIGUNG_ERINNERUNG_TAGE_VORHER = [42, 14, 0]; // 6 Wochen, 2 Wochen, am Tag der Frist selbst
function berechneKuendigungsfrist(hauptfaelligkeitISO) {
  if (!hauptfaelligkeitISO) return null;
  const d = new Date(hauptfaelligkeitISO);
  if (isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() - KUENDIGUNG_MONATE_VOR_HAUPTFAELLIGKEIT);
  return d;
}
async function clearKuendigungsTasks(customerId) {
  try {
    const listing = await window.storage.list("task:", true);
    for (const k of listing?.keys || []) {
      const t = await storageGetJSON(k, true);
      if (t?.customerId === customerId && t.titel?.startsWith("Kündigungsfrist Vorversicherung")) {
        await window.storage.delete(k, true);
      }
    }
  } catch (e) {}
}
async function createKuendigungsTasks(customer) {
  const frist = berechneKuendigungsfrist(customer.vorversicherungHauptfaelligkeit);
  if (!frist) return;
  const now = new Date();
  for (const tageVorher of KUENDIGUNG_ERINNERUNG_TAGE_VORHER) {
    const faelligkeitsdatum = new Date(frist.getTime() - tageVorher * 86400000);
    if (faelligkeitsdatum < now && tageVorher !== 0) continue; // bereits verstrichene Zwischenerinnerungen nicht mehr anlegen
    const task = {
      id: uid(), customerId: customer.id, customerName: fullName(customer),
      titel: tageVorher === 0 ? "Kündigungsfrist Vorversicherung — heute letzte Frist!" : `Kündigungsfrist Vorversicherung (in ${tageVorher} Tagen)`,
      tage: tageVorher, faelligkeitsdatum: faelligkeitsdatum.toISOString(), erstellt: now.toISOString(), erledigt: false,
    };
    try { await storageSetJSON(`task:${task.id}`, task, true); } catch (e) {}
  }
}

/* ===================== Geburtstags-Erinnerung ===================== */
const GEBURTSTAG_VORLAUF_TAGE = 7; // Erinnerung ab X Tagen vorher
// Das Feld ist Freitext (TT.MM.JJJJ ist nur ein Platzhalter) — daher tolerant parsen:
// erkennt "3.5.1980", "03.05.1980", "3-5-1980", "1980-05-03" u. ä. und liefert {tag, monat, jahr|null}.
function parseGeburtsdatum(str) {
  if (!str) return null;
  const s = str.trim();
  let m = s.match(/^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{2,4})$/); // TT.MM.JJJJ o.ä.
  if (m) {
    const [, t, mo, j] = m;
    return { tag: Number(t), monat: Number(mo), jahr: j.length === 2 ? Number(j) + 2000 : Number(j) };
  }
  m = s.match(/^(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})$/); // JJJJ-MM-TT (z. B. aus <input type="date">)
  if (m) {
    const [, j, mo, t] = m;
    return { tag: Number(t), monat: Number(mo), jahr: Number(j) };
  }
  return null;
}
function naechsterGeburtstag(geb) {
  const heuteStart = new Date(); heuteStart.setHours(0, 0, 0, 0);
  let naechster = new Date(heuteStart.getFullYear(), geb.monat - 1, geb.tag);
  if (naechster < heuteStart) naechster = new Date(heuteStart.getFullYear() + 1, geb.monat - 1, geb.tag);
  return naechster;
}
async function createGeburtstagsTaskWennFaellig(customer) {
  const geb = parseGeburtsdatum(customer.geburtsdatum);
  if (!geb) return;
  const naechster = naechsterGeburtstag(geb);
  const tageBis = Math.round((naechster - new Date()) / 86400000);
  if (tageBis > GEBURTSTAG_VORLAUF_TAGE) return;
  const jahrTag = `${naechster.getFullYear()}`;
  try {
    const listing = await window.storage.list("task:", true);
    for (const k of listing?.keys || []) {
      const t = await storageGetJSON(k, true);
      if (t?.customerId === customer.id && t.titel?.startsWith("Geburtstag") && t.faelligkeitsdatum?.startsWith(jahrTag.slice(0, 4)) && t.faelligkeitsdatum?.slice(5, 10) === naechster.toISOString().slice(5, 10)) {
        return; // Aufgabe für dieses Jahr existiert schon
      }
    }
  } catch (e) {}
  const alter = geb.jahr ? naechster.getFullYear() - geb.jahr : null;
  const task = {
    id: uid(), customerId: customer.id, customerName: fullName(customer),
    titel: `Geburtstag${alter ? ` (wird ${alter})` : ""} — Glückwunsch schicken`,
    faelligkeitsdatum: naechster.toISOString(), erstellt: new Date().toISOString(), erledigt: false,
  };
  try { await storageSetJSON(`task:${task.id}`, task, true); } catch (e) {}
}
async function pruefeGeburtstage(customers) {
  for (const c of customers) {
    if (c.geburtsdatum) await createGeburtstagsTaskWennFaellig(c);
  }
}

function StatusBadge({ status }) {
  const info = statusInfo(status);
  if (!info) return <span className="status-badge status-badge--none">kein Status</span>;
  return <span className="status-badge" style={{ background: info.color }}>{info.label}</span>;
}

/* ===================== Kunden-Abgleich (für Mail-Import) ===================== */
function normalizeForMatch(s) {
  return (s || "")
    .toLowerCase()
    .replace(/\b(ing|dr|mag|di|dipl[\s.-]*ing|prof|bmstr|kr|mba|llm|arch|mmag|dkfm|bsc|msc)\b\.?/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[,.]/g, "");
}
/* Vor-/Nachname/Titel -> Anzeigename. Fällt auf das alte Feld "name" zurück,
   falls ein Kunde noch im alten (Vor-Update-)Format gespeichert ist. */
function fullName(c) {
  if (!c) return "";
  const composed = [c.titel, c.vorname, c.nachname].filter(Boolean).join(" ").trim();
  return composed || c.name || "";
}
function customerSortKey(c) {
  return (c?.nachname || c?.name || "").toLowerCase() + " " + (c?.vorname || "").toLowerCase();
}
// Zerlegt einen einzelnen Namensstring (z. B. aus einem Import) in Titel/Vorname/Nachname.
const KNOWN_TITLES = ["Dipl.-Ing.", "Dkfm.", "MMag.", "Mag.", "Ing.", "Dr.", "DI", "Prof.", "Arch.", "BSc", "MSc", "MBA"];
function splitFullName(full) {
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
function findCustomerMatches(customers, incoming) {
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

/* ===================== Prämien-Berechnung ===================== */
function calcNautima(input) {
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

function calcCallidus(input) {
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

/* ===================== Storage-Helfer ===================== */
async function storageGetJSON(key, shared) {
  try {
    const r = await window.storage.get(key, shared);
    return r ? JSON.parse(r.value) : null;
  } catch (e) { return null; }
}
async function storageSetJSON(key, value, shared, attempt = 1) {
  try {
    return await window.storage.set(key, JSON.stringify(value), shared);
  } catch (e) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 400 * attempt));
      return storageSetJSON(key, value, shared, attempt + 1);
    }
    throw e;
  }
}

/* ===================== UI: kleine Bausteine ===================== */
function LeaderRow({ label, value, betont, negativ }) {
  return (
    <div className={`leader-row ${betont ? "leader-row--strong" : ""}`}>
      <span className="leader-label">{label}</span>
      <span className="leader-fill" />
      <span className={`leader-value ${negativ ? "leader-value--neg" : ""}`}>{value}</span>
    </div>
  );
}

function WarnBox({ children }) {
  return (
    <div className="warnbox">
      <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
      <span>{children}</span>
    </div>
  );
}

function Field({ label, children, hint, span }) {
  return (
    <label className={`field${span ? " field--wide" : ""}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}
function RadioRow({ options, value, onChange, name }) {
  return (
    <div className="radio-row">
      {options.map((o) => (
        <label key={o.value} className={`radio-pill ${value === o.value ? "radio-pill--active" : ""}`}>
          <input type="radio" name={name} checked={value === o.value} onChange={() => onChange(o.value)} />{o.label}
        </label>
      ))}
    </div>
  );
}

/* ===================== Rechner-Tab ===================== */
function RechnerTab({ customers, onSaveToCustomer, onCustomersChanged }) {
  const [bootstyp, setBootstyp] = useState("motorboot");
  const [baujahr, setBaujahr] = useState(2015);
  const [versicherungssumme, setVersicherungssumme] = useState(80000);
  const [zone, setZone] = useState("nordost");
  const [motorkw, setMotorkw] = useState(60);
  const [segelflaeche, setSegelflaeche] = useState(40);
  const [charter, setCharter] = useState("keine");
  const [unterschlagung, setUnterschlagung] = useState(false);
  const [schlauchboot, setSchlauchboot] = useState(false);
  const [binnenseeNachlass, setBinnenseeNachlass] = useState(false);
  const [premiumHersteller, setPremiumHersteller] = useState(false);
  const [verdraengerNachlass, setVerdraengerNachlass] = useState(false);
  const [maschinendeckung, setMaschinendeckung] = useState(false);
  const [holzCarbon, setHolzCarbon] = useState(false);
  const [sfr, setSfr] = useState("neu");
  const [insassenunfall, setInsassenunfall] = useState("keine");
  const [kategorieSY, setKategorieSY] = useState("Komfort");
  const [kategorieMY, setKategorieMY] = useState("Verdraenger");
  const [hpVSNautima, setHpVSNautima] = useState(1); // Index 0..3 -> VS1..VS4
  const [hpVSCallidus, setHpVSCallidus] = useState(0); // 0 = 5 Mio, 1 = 10 Mio

  // Selbstbehalt-Optionen dynamisch
  const nautimaBracket = useMemo(
    () => findNautimaVSBracket(schlauchboot ? NAUTIMA_KASKO.motorboot : NAUTIMA_KASKO[bootstyp], versicherungssumme),
    [bootstyp, versicherungssumme, schlauchboot]
  );
  const nautimaSBOptions = useMemo(
    () => nautimaAvailableSB(nautimaBracket, zone),
    [nautimaBracket, zone]
  );
  const [selbstbehaltNautima, setSelbstbehaltNautima] = useState(500);
  useEffect(() => {
    if (nautimaSBOptions.length && !nautimaSBOptions.includes(selbstbehaltNautima)) {
      setSelbstbehaltNautima(nautimaSBOptions[0]);
    }
  }, [nautimaSBOptions]); // eslint-disable-line

  const ccZone = ZONEN.find((z) => z.key === zone)?.cc || "binnen";
  const ccTarif = bootstyp === "segelboot"
    ? (ccZone === "binnen" ? CALLIDUS_SY_KASKO_BINNEN : CALLIDUS_SY_KASKO_MITTELMEER)
    : (ccZone === "binnen" ? CALLIDUS_MY_KASKO_BINNEN : CALLIDUS_MY_KASKO_MITTELMEER);
  const ccKategorie = bootstyp === "segelboot" ? kategorieSY : kategorieMY;
  const ccSBOptions = useMemo(
    () => callidusAvailableSBForVS(ccTarif, versicherungssumme, ccKategorie, ccTarif.sbOptions),
    [ccTarif, versicherungssumme, ccKategorie]
  );
  const [selbstbehaltCallidus, setSelbstbehaltCallidus] = useState(2500);
  useEffect(() => {
    if (ccSBOptions.length && !ccSBOptions.includes(selbstbehaltCallidus)) {
      setSelbstbehaltCallidus(ccSBOptions[0]);
    }
  }, [ccSBOptions]); // eslint-disable-line

  const nautimaResult = useMemo(() => calcNautima({
    bootstyp, baujahr, versicherungssumme, zone, selbstbehalt: selbstbehaltNautima,
    charter, unterschlagung, schlauchboot, binnenseeNachlass, premiumHersteller,
    verdraengerNachlass, sfr, hpVS: hpVSNautima, motorkw, segelflaeche, insassenunfall,
  }), [bootstyp, baujahr, versicherungssumme, zone, selbstbehaltNautima, charter, unterschlagung,
      schlauchboot, binnenseeNachlass, premiumHersteller, verdraengerNachlass, sfr, hpVSNautima,
      motorkw, segelflaeche, insassenunfall]);

  const callidusResult = useMemo(() => calcCallidus({
    bootstyp, baujahr, versicherungssumme, zone, selbstbehalt: selbstbehaltCallidus,
    charter, maschinendeckung, holzCarbon, kategorie: { sy: kategorieSY, my: kategorieMY },
    hpVS: hpVSCallidus, motorkw, segelflaeche,
  }), [bootstyp, baujahr, versicherungssumme, zone, selbstbehaltCallidus, charter, maschinendeckung,
      holzCarbon, kategorieSY, kategorieMY, hpVSCallidus, motorkw, segelflaeche]);

  const [saveTarget, setSaveTarget] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  const handleSave = async () => {
    if (!saveTarget) return;
    const note = {
      id: uid(),
      erstellt: new Date().toISOString(),
      bootstyp, baujahr, versicherungssumme, zone,
      nautima: nautimaResult.gesamt,
      callidus: callidusResult.gesamt,
    };
    await onSaveToCustomer(saveTarget, note);
    setSaveMsg("Im Kundendatensatz gespeichert.");
    setTimeout(() => setSaveMsg(""), 2500);
  };

  const [embedNautima, setEmbedNautima] = useState(null);
  const [embedCallidus, setEmbedCallidus] = useState(null);

  return (
    <>
    <div className="rechner-grid">
      <div className="panel formpanel">
        <h2 className="panel-title"><Compass size={18} /> Bootsdaten</h2>

        <div className="segmented">
          <button className={bootstyp === "motorboot" ? "seg-btn seg-btn--active" : "seg-btn"} onClick={() => setBootstyp("motorboot")}>Motorboot</button>
          <button className={bootstyp === "segelboot" ? "seg-btn seg-btn--active" : "seg-btn"} onClick={() => setBootstyp("segelboot")}>Segelboot</button>
        </div>

        <div className="field-grid">
          <Field label="Baujahr">
            <input type="number" value={baujahr} onChange={(e) => setBaujahr(Number(e.target.value) || thisYear)} />
          </Field>
          <Field label="Versicherungssumme (Bootswert, €)">
            <input type="number" step="1000" value={versicherungssumme} onChange={(e) => setVersicherungssumme(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Fahrtgebiet">
            <select value={zone} onChange={(e) => setZone(e.target.value)}>
              {ZONEN.filter((z) => z.key !== "binnensee").map((z) => <option key={z.key} value={z.key}>{z.label}</option>)}
            </select>
          </Field>
          {bootstyp === "motorboot" ? (
            <Field label="Motorleistung gesamt (kW)">
              <input type="number" value={motorkw} onChange={(e) => setMotorkw(Number(e.target.value) || 0)} />
            </Field>
          ) : (
            <Field label="Segelfläche (m²)">
              <input type="number" value={segelflaeche} onChange={(e) => setSegelflaeche(Number(e.target.value) || 0)} />
            </Field>
          )}
        </div>

        <h3 className="panel-subtitle">Risiko &amp; Nutzung</h3>
        <div className="field-grid">
          <Field label="Charterrisiko">
            <select value={charter} onChange={(e) => setCharter(e.target.value)}>
              <option value="keine">Keine Vermietung</option>
              <option value="mit">Vermietung mit Skipper</option>
              <option value="ohne">Vermietung ohne Skipper</option>
            </select>
          </Field>
          {charter === "ohne" && (
            <label className="checkbox-field">
              <input type="checkbox" checked={unterschlagung} onChange={(e) => setUnterschlagung(e.target.checked)} />
              Unterschlagungsrisiko (nur NAUTIMA)
            </label>
          )}
        </div>

        <details className="advanced">
          <summary>Weitere Zu- &amp; Abschläge</summary>
          <div className="checkbox-list">
            {bootstyp === "motorboot" && (
              <label className="checkbox-field">
                <input type="checkbox" checked={schlauchboot} onChange={(e) => setSchlauchboot(e.target.checked)} />
                Schlauchboot (NAUTIMA +20 %)
              </label>
            )}
            {bootstyp === "motorboot" && (
              <label className="checkbox-field">
                <input type="checkbox" checked={verdraengerNachlass} onChange={(e) => setVerdraengerNachlass(e.target.checked)} />
                Verdränger bis 150 kW Innenbordmotor (NAUTIMA −10 %)
              </label>
            )}
            {bootstyp === "segelboot" && (
              <label className="checkbox-field">
                <input type="checkbox" checked={premiumHersteller} onChange={(e) => setPremiumHersteller(e.target.checked)} />
                Premium-Hersteller, z. B. Dehler, X-Yachts (NAUTIMA −10 %)
              </label>
            )}
            <label className="checkbox-field">
              <input type="checkbox" checked={binnenseeNachlass} onChange={(e) => setBinnenseeNachlass(e.target.checked)} />
              Bodensee / Chiemsee / Starnberger See etc. (NAUTIMA −10 %, nur Binnen)
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={maschinendeckung} onChange={(e) => setMaschinendeckung(e.target.checked)} />
              Maschinendeckung (Callidus +15 %)
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={holzCarbon} onChange={(e) => setHolzCarbon(e.target.checked)} />
              Holz-/Carbon-Bauweise (Callidus +25 %)
            </label>
          </div>
        </details>

        <h3 className="panel-subtitle">Versicherer-spezifisch</h3>
        <div className="field-grid">
          <Field label="NAUTIMA – Selbstbehalt Kasko (€)">
            <select value={selbstbehaltNautima} onChange={(e) => setSelbstbehaltNautima(Number(e.target.value))} disabled={!nautimaSBOptions.length}>
              {nautimaSBOptions.length ? nautimaSBOptions.map((sb) => <option key={sb} value={sb}>{sb === 0 ? "ohne" : euro(sb)}</option>) : <option>keine Option verfügbar</option>}
            </select>
          </Field>
          <Field label="NAUTIMA – Haftpflicht-Deckungssumme">
            <select value={hpVSNautima} onChange={(e) => setHpVSNautima(Number(e.target.value))}>
              <option value={0}>VS 1 – 3 Mio. €</option>
              <option value={1}>VS 2 – 5 Mio. €</option>
              <option value={2}>VS 3 – 10 Mio. €</option>
              <option value={3}>VS 4 – 15 Mio. €</option>
            </select>
          </Field>
          <Field label="NAUTIMA – Schadenfreiheitsrabatt">
            <select value={sfr} onChange={(e) => setSfr(e.target.value)}>
              {SFR_OPTIONEN.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="NAUTIMA – Insassenunfall (optional)">
            <select value={insassenunfall} onChange={(e) => setInsassenunfall(e.target.value)}>
              <option value="keine">Keine</option>
              <option value="BASIS">BASIS – {euro(NAUTIMA_INSASSENUNFALL.BASIS)}/Jahr</option>
              <option value="KOMFORT">KOMFORT – {euro(NAUTIMA_INSASSENUNFALL.KOMFORT)}/Jahr</option>
              <option value="TOP">TOP – {euro(NAUTIMA_INSASSENUNFALL.TOP)}/Jahr</option>
            </select>
          </Field>

          {bootstyp === "segelboot" ? (
            <Field label="Callidus – Kategorie">
              <select value={kategorieSY} onChange={(e) => setKategorieSY(e.target.value)}>
                <option value="Komfort">Komfort</option>
                <option value="Sport">Sport</option>
              </select>
            </Field>
          ) : (
            <Field label="Callidus – Bauart">
              <select value={kategorieMY} onChange={(e) => setKategorieMY(e.target.value)}>
                <option value="Verdraenger">Verdränger</option>
                <option value="Gleiter">Gleiter</option>
              </select>
            </Field>
          )}
          <Field label="Callidus – Selbstbehalt Kasko (€)">
            <select value={selbstbehaltCallidus} onChange={(e) => setSelbstbehaltCallidus(Number(e.target.value))} disabled={!ccSBOptions.length}>
              {ccSBOptions.length ? ccSBOptions.map((sb) => <option key={sb} value={sb}>{euro(sb)}</option>) : <option>keine Option verfügbar</option>}
            </select>
          </Field>
          <Field label="Callidus – Haftpflicht-Deckungssumme">
            <select value={hpVSCallidus} onChange={(e) => setHpVSCallidus(Number(e.target.value))}>
              <option value={0}>5 Mio. €</option>
              <option value={1}>10 Mio. €</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="results">
        <ResultCard title="NAUTIMA" subtitle="Mannheimer Versicherung AG" result={nautimaResult} />
        <button
          type="button"
          className="btn btn--doc"
          onClick={() => setEmbedNautima({
            bootstyp, baujahr, versicherungssumme, zone,
            motorkw: bootstyp === "motorboot" ? motorkw : undefined,
            segelflaeche: bootstyp === "segelboot" ? segelflaeche : undefined,
            selbstbehalt: selbstbehaltNautima,
            charter: charter === "keine" ? "nein" : charter,
            _ts: Date.now(),
          })}
        >
          <FileCheck2 size={15} /> NAUTIMA-Antrag mit diesen Werten öffnen
        </button>

        <ResultCard title="Callidus-Eigentarif" subtitle="Entwurf 2026" result={callidusResult} />
        <button
          type="button"
          className="btn btn--doc"
          onClick={() => setEmbedCallidus({
            bootstyp, baujahr, versicherungssumme, fahrtgebietZone: ccZone,
            motorkw: bootstyp === "motorboot" ? motorkw : undefined,
            segelflaeche: bootstyp === "segelboot" ? segelflaeche : undefined,
            selbstbehalt: selbstbehaltCallidus,
            charter: charter === "keine" ? "nein" : charter,
            kategorieSY, kategorieMY, holzCarbon, maschinendeckung,
            haftpflichtsumme: hpVSCallidus === 0 ? 5000000 : 10000000,
            _ts: Date.now(),
          })}
        >
          <FileText size={15} /> Bootsdatenblatt mit diesen Werten öffnen
        </button>

        {customers.length > 0 && (
          <div className="panel save-panel">
            <h3 className="panel-subtitle" style={{ marginTop: 0 }}><Save size={15} /> Bei bestehendem Kunden vermerken</h3>
            <div className="save-row">
              <select value={saveTarget} onChange={(e) => setSaveTarget(e.target.value)}>
                <option value="">Kunde wählen…</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{fullName(c)}</option>)}
              </select>
              <button className="btn btn--primary" disabled={!saveTarget} onClick={handleSave}>Speichern</button>
            </div>
            {saveMsg && <div className="save-confirm"><Check size={14} /> {saveMsg}</div>}
          </div>
        )}
      </div>
    </div>

    {embedNautima && (
      <div className="panel embed-panel">
        <div className="embed-panel-head">
          <h3 className="panel-subtitle" style={{ marginTop: 0 }}><FileCheck2 size={15} /> NAUTIMA-Antrag — mit den Werten dieser Berechnung</h3>
          <button className="icon-btn" onClick={() => setEmbedNautima(null)} title="Schließen"><X size={16} /></button>
        </div>
        <NautimaAntragTab customers={customers} prefill={embedNautima} onCustomersChanged={onCustomersChanged} />
      </div>
    )}
    {embedCallidus && (
      <div className="panel embed-panel">
        <div className="embed-panel-head">
          <h3 className="panel-subtitle" style={{ marginTop: 0 }}><FileText size={15} /> Bootsdatenblatt — mit den Werten dieser Berechnung</h3>
          <button className="icon-btn" onClick={() => setEmbedCallidus(null)} title="Schließen"><X size={16} /></button>
        </div>
        <CallidusDatenblattTab customers={customers} prefill={embedCallidus} onCustomersChanged={onCustomersChanged} />
      </div>
    )}
    </>
  );
}

function ResultCard({ title, subtitle, result }) {
  const { kasko, hp, iuBetrag, gesamt, warnings } = result;
  return (
    <div className="panel result-card">
      <div className="result-head">
        <div>
          <h3 className="result-title">{title}</h3>
          <span className="result-subtitle">{subtitle}</span>
        </div>
        <div className="result-total">
          <span className="result-total-label">Gesamtprämie/Jahr</span>
          <span className="result-total-value">{euro(gesamt)}</span>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="warn-stack">
          {warnings.map((w, i) => <WarnBox key={i}>{w}</WarnBox>)}
        </div>
      )}

      {kasko && (
        <div className="result-section">
          <div className="result-section-title">Kaskoversicherung</div>
          {kasko.posten.map((p, i) => (
            p.note ? (
              <div key={i} className="note-line"><Info size={12} style={{ flexShrink: 0, marginTop: 1 }} /> {p.label}</div>
            ) : (
              <LeaderRow key={i} label={p.label}
                value={p.wert != null ? euro(p.wert) : pctFmt(p.prozent)}
                betont={p.betont} negativ={(p.wert != null && p.wert < 0) || (p.prozent != null && p.prozent < 0)} />
            )
          ))}
          <LeaderRow label="Kasko-Prämie" value={euro(kasko.betrag)} betont />
        </div>
      )}

      {hp && (
        <div className="result-section">
          <div className="result-section-title">Haftpflichtversicherung</div>
          <LeaderRow label={`Grundprämie (${hp.basis})`} value={euro(hp.betragBasis ?? hp.betrag)} />
          {hp.zuschlag > 0 && <LeaderRow label="Vercharter-Aufschlag" value={euro(hp.zuschlag)} />}
          <LeaderRow label="Haftpflicht-Prämie" value={euro(hp.betrag)} betont />
        </div>
      )}

      {iuBetrag > 0 && (
        <div className="result-section">
          <div className="result-section-title">Insassenunfallversicherung</div>
          <LeaderRow label="Jahresprämie" value={euro(iuBetrag)} betont />
        </div>
      )}
    </div>
  );
}

/* ===================== Kunden-Tab ===================== */
/* ===================== Versicherer-Badges (Textmarken statt Logo-Bilddateien) ===================== */
const INSURER_STYLES = {
  "wiener städtische": { color: "#00629B", short: "WIENER STÄDTISCHE" },
  "nautima": { color: "#032856", short: "NAUTIMA (Mannheimer)" },
  "mannheimer": { color: "#032856", short: "NAUTIMA (Mannheimer)" },
  "callidus": { color: "#0F6EBE", short: "Callidus-Eigentarif" },
};
function insurerStyle(name) {
  const n = (name || "").toLowerCase();
  const key = Object.keys(INSURER_STYLES).find((k) => n.includes(k));
  return key ? INSURER_STYLES[key] : { color: "#41505A", short: name || "Versicherer" };
}
function InsurerBadge({ name }) {
  const s = insurerStyle(name);
  return <span className="insurer-badge" style={{ background: s.color }}>{s.short}</span>;
}

const RISIKO_LABELS = {
  bootstyp: "Bootstyp", registrierungsland: "Registrierungsland", werft: "Werft", hersteller: "Hersteller",
  modell: "Modell", yachttyp: "Yachttyp", baujahr: "Baujahr",
  laenge: "Länge (m)", breite: "Breite (m)", tiefgang: "Tiefgang (m)", rumpfmaterial: "Rumpfmaterial",
  mastmaterial: "Mastmaterial", segelflaeche: "Segelfläche (m²)", beibootVorhanden: "Beiboot vorhanden",
  motortyp: "Motortyp", motorleistungKW: "Motorleistung (kW)", motorleistungPS: "Motorleistung (PS)", herstellerMotor: "Hersteller Motor",
  regatta: "Regattateilnahme", modifikationen: "Modifikationen", charter: "Chartereinsatz", fahrtgebiet: "Fahrtgebiet",
};

/* ===================== Boote (ein Kunde kann mehrere haben) ===================== */
// Liest die Boote eines Kunden. Fällt bei älteren Datensätzen (vor der Mehr-Boote-Umstellung)
// auf die frühere Struktur zurück (bootsname/bootstyp/risiko direkt am Kunden) und zeigt sie als ein Boot an.
function getBoats(customer) {
  if (customer?.boote?.length > 0) return customer.boote;
  if (customer?.bootsname || (customer?.risiko && Object.values(customer.risiko).some(Boolean))) {
    return [{ id: "legacy", name: customer.bootsname || "", bootstyp: customer.bootstyp || "Motorboot", ...(customer.risiko || {}) }];
  }
  return [];
}
function boatsSubtitle(customer) {
  const boats = getBoats(customer);
  if (boats.length === 0) return customer.bootstyp || "";
  if (boats.length === 1) return `${boats[0].name ? boats[0].name + " · " : ""}${boats[0].bootstyp || ""}`;
  return `${boats.length} Boote`;
}
const BOAT_FIELD_DEFS = [
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
  { key: "motorleistungKW", label: "Motorleistung (kW)", motorOnly: true },
  { key: "herstellerMotor", label: "Hersteller Motor", motorOnly: true },
  { key: "fahrtgebiet", label: "Fahrtgebiet" },
  { key: "charter", label: "Chartereinsatz" },
];
function BoatForm({ initial, onCancel, onSave }) {
  const [vals, setVals] = useState(() => Object.fromEntries(BOAT_FIELD_DEFS.map((f) => [f.key, initial?.[f.key] ?? (f.key === "bootstyp" ? "Motorboot" : "")])));
  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    if (!vals.name.trim()) return;
    onSave({ ...initial, ...vals, id: initial?.id && initial.id !== "legacy" ? initial.id : uid() });
  };
  return (
    <form className="panel boat-form" onSubmit={submit}>
      <h2 className="panel-title">{initial ? "Boot bearbeiten" : "Neues Boot"}</h2>
      <div className="field-grid">
        {BOAT_FIELD_DEFS.filter((f) => (!f.segelOnly || vals.bootstyp === "Segelboot") && (!f.motorOnly || vals.bootstyp === "Motorboot")).map((f) => (
          <Field key={f.key} label={f.key === "name" ? "Bootsname *" : f.label}>
            {f.type === "select" ? (
              <select value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)}>
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)} required={f.key === "name"} />
            )}
          </Field>
        ))}
      </div>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn btn--primary">Speichern</button>
      </div>
    </form>
  );
}
/* ===================== Automatischer Vergleich Vorversicherung vs. NAUTIMA/Callidus ===================== */
// Vorlage basiert auf dem bisher erfolgreichsten Anschreiben aus den gesendeten Mails
// (Angebot Sunbeam 32.1 an Hr. Türtscher) — leicht generalisiert für die automatische Erzeugung.
function generateAntragAnschreiben(customer, primaryBoat) {
  const name = fullName(customer);
  const bootsname = primaryBoat?.name || customer.bootsname || "Ihr Boot";
  return `Sehr geehrte/r ${name},

im Anhang übermitteln wir Ihnen unser maßgeschneidertes Angebot für die Bootsversicherung Ihrer ${bootsname}.

Mit dieser Absicherung profitieren Sie von einem besonders umfassenden Versicherungsschutz, der Ihnen maximale Sicherheit auf dem Wasser bietet:

- Allgefahrendeckung – Schutz auch bei unvorhergesehenen Schäden
- Grobe Fahrlässigkeit mitversichert – für zusätzliche Sicherheit im Ernstfall
- Segel und Persenning bis zu 5 Jahre zum Neuwert mitversichert – ohne finanziellen Nachteil bei einem Schaden
- Weitere Details zu den Leistungen finden Sie auf unserer Homepage: https://becallidus.com/bootskaskoversicherung/

Gerade bei hochwertigen Booten ist ein verlässlicher Versicherungsschutz entscheidend. Mit unserem Angebot erhalten Sie eine leistungsstarke Absicherung zu attraktiven Konditionen, damit Sie Ihre Zeit auf dem Wasser unbeschwert genießen können.

Bitte prüfen Sie das Angebot in Ruhe und senden Sie es uns unterschrieben zurück, damit wir die Versicherung für Sie in Deckung bringen können.

Bitte beachten Sie, dass die Prämien netto angegeben sind. Je nach Zulassungsland fällt zusätzlich die jeweilige Versicherungssteuer an (z. B. Österreich 11 %).

Gerne stehe ich Ihnen für Fragen telefonisch oder per E-Mail zur Verfügung. Ich freue mich auf Ihre Rückmeldung.

Mit freundlichen Grüßen
Ihr Callidus-Team`;
}

// Für die Zustellung der (ersten) Polizze — inkl. Schadenmeldung, da Schäden bei euch direkt
// über Callidus laufen (nicht über die Versicherung selbst).
function generatePolizzeMail(customer, primaryBoat) {
  const name = fullName(customer);
  const bootsname = primaryBoat?.name || customer.bootsname || "Ihr Boot";
  const vertraege = customer.vertraege || [];
  const gesamtpraemie = vertraege.reduce((sum, v) => sum + vertragTotal(v), 0);
  const uebersicht = vertraege.map((v) => {
    const sparten = (v.sparten || []).map((s) => s.sparte).join(", ");
    return `- ${v.versicherer}${v.polizzennummer ? ` (Polizze-Nr. ${v.polizzennummer})` : ""}${sparten ? `: ${sparten}` : ""}`;
  }).join("\n");

  return `Sehr geehrte/r ${name},

herzlichen Glückwunsch — im Anhang erhalten Sie Ihre Polizze für die Bootsversicherung Ihrer ${bootsname}. Ihr Versicherungsschutz ist damit aktiv.
${uebersicht ? `\n${uebersicht}\n` : ""}${gesamtpraemie ? `\nGesamtprämie: ${euro(gesamtpraemie)} / Jahr\n` : ""}
Bitte prüfen Sie die Polizze in Ruhe und melden Sie sich, falls etwas nicht Ihren Wünschen entspricht.

IM SCHADENFALL

Sollte es zu einem Schaden kommen, melden Sie sich bitte direkt bei uns — wir übernehmen die gesamte Abwicklung mit der Versicherung für Sie:

Telefon: +43 660 3484538
E-Mail: j.prack@becallidus.com

Wir wünschen Ihnen eine unfallfreie und schöne Zeit auf dem Wasser.

Mit freundlichen Grüßen
Ihr Callidus-Team`;
}

// Kündigungsschreiben an die Vorversicherung — vom Kunden zu unterschreiben und selbst zu versenden
// (Kündigungen laufen rechtlich über den Versicherungsnehmer, nicht über den Makler).
function generateKuendigungsschreiben(customer) {
  const name = fullName(customer);
  const versicherer = customer.vorversicherungVersicherer || "[Name der Vorversicherung]";
  const polizzennummer = customer.vorversicherungPolizzennummer || "";
  const frist = berechneKuendigungsfrist(customer.vorversicherungHauptfaelligkeit);
  const fristText = frist ? frist.toLocaleDateString("de-AT") : "[Kündigungsfrist bitte ergänzen]";
  const hauptfaelligkeitText = customer.vorversicherungHauptfaelligkeit
    ? new Date(customer.vorversicherungHauptfaelligkeit).toLocaleDateString("de-AT")
    : "[Hauptfälligkeit bitte ergänzen]";
  const heute = new Date().toLocaleDateString("de-AT");

  return `Sehr geehrte/r ${name},

anbei wie besprochen das vorbereitete Kündigungsschreiben für Ihre bestehende Bootsversicherung bei ${versicherer}. Bitte prüfen Sie die Angaben, ergänzen Sie bei Bedarf Ihre Polizzennummer und senden Sie das unterschriebene Schreiben an ${versicherer}.

Wichtig: Die Kündigung muss spätestens bis ${fristText} bei ${versicherer} eingehen, da sich der Vertrag sonst automatisch um ein weiteres Jahr verlängert. Am besten per Einschreiben oder zumindest mit Lesebestätigung versenden.

— — —

${name}

${versicherer}
[Adresse der Versicherung bitte ergänzen]

${heute}

Betreff: Kündigung der Bootsversicherung${polizzennummer ? `, Polizze-Nr. ${polizzennummer}` : ""}

Sehr geehrte Damen und Herren,

hiermit kündige ich meine bestehende Bootsversicherung${polizzennummer ? ` (Polizze-Nr. ${polizzennummer})` : ""} fristgerecht zum ${hauptfaelligkeitText}.

Ich bitte Sie um eine schriftliche Bestätigung des Kündigungseingangs sowie der Vertragsbeendigung.

Mit freundlichen Grüßen

${name}`;
}

function VergleichPanel({ customer, primaryBoat }) {
  const [versicherungssumme, setVersicherungssumme] = useState(primaryBoat?.versicherungssumme || 80000);
  const [zone, setZone] = useState("binnen");
  const [selbstbehalt, setSelbstbehalt] = useState(500);
  const [charter, setCharter] = useState("keine");

  const bootstyp = primaryBoat?.bootstyp === "Segelboot" ? "segelboot" : "motorboot";
  const baujahr = Number(primaryBoat?.baujahr) || thisYear - 10;
  const motorkw = Number(primaryBoat?.motorleistungKW) || 0;
  const segelflaeche = Number(primaryBoat?.segelflaeche) || 0;

  const nautimaResult = useMemo(() => calcNautima({
    bootstyp, baujahr, versicherungssumme, zone, selbstbehalt,
    charter, unterschlagung: false, schlauchboot: false, binnenseeNachlass: false,
    premiumHersteller: false, verdraengerNachlass: false, sfr: "neu", hpVS: 0, motorkw, segelflaeche,
    insassenunfall: "keine",
  }), [bootstyp, baujahr, versicherungssumme, zone, selbstbehalt, charter, motorkw, segelflaeche]);

  const callidusResult = useMemo(() => calcCallidus({
    bootstyp, baujahr, versicherungssumme, zone, selbstbehalt,
    charter, maschinendeckung: false, holzCarbon: false,
    kategorie: { sy: "Komfort", my: "Verdraenger" }, hpVS: 0, motorkw, segelflaeche,
  }), [bootstyp, baujahr, versicherungssumme, zone, selbstbehalt, charter, motorkw, segelflaeche]);

  const vorPraemie = customer.vorversicherungPraemie;
  const rows = [
    { label: customer.vorversicherungVersicherer || "Vorversicherung", betrag: vorPraemie, istVor: true },
    { label: "NAUTIMA", betrag: nautimaResult.warnings.length ? null : nautimaResult.gesamt, warnungen: nautimaResult.warnings },
    { label: "Callidus-Eigentarif", betrag: callidusResult.warnings.length ? null : callidusResult.gesamt, warnungen: callidusResult.warnings },
  ];
  const guenstigste = rows.filter((r) => r.betrag != null && !r.istVor).sort((a, b) => a.betrag - b.betrag)[0];

  return (
    <div className="panel vergleich-panel">
      <h3 className="panel-subtitle" style={{ marginTop: 0 }}><Calculator size={15} /> Automatischer Vergleich</h3>
      <div className="field-grid">
        <Field label="Versicherungssumme (€)"><input type="number" step="1000" value={versicherungssumme} onChange={(e) => setVersicherungssumme(Number(e.target.value) || 0)} /></Field>
        <Field label="Fahrtgebiet">
          <select value={zone} onChange={(e) => setZone(e.target.value)}>
            {ZONEN.filter((z) => z.key !== "binnensee").map((z) => <option key={z.key} value={z.key}>{z.label}</option>)}
          </select>
        </Field>
        <Field label="Selbstbehalt (€)"><input type="number" step="100" value={selbstbehalt} onChange={(e) => setSelbstbehalt(Number(e.target.value) || 0)} /></Field>
        <Field label="Chartereinsatz">
          <select value={charter} onChange={(e) => setCharter(e.target.value)}>
            <option value="keine">Keine Vermietung</option><option value="mit">Mit Skipper</option><option value="ohne">Ohne Skipper</option>
          </select>
        </Field>
      </div>
      <p className="field-hint" style={{ margin: "2px 0 12px" }}>
        {primaryBoat ? `Bootsdaten übernommen von „${primaryBoat.name || "Ihr Boot"}" (${bootstyp === "segelboot" ? "Segelboot" : "Motorboot"}, Baujahr ${baujahr}).` : "Kein Boot hinterlegt — Standardwerte werden verwendet, bitte prüfen."}
        {" "}Vergleichswerte, keine verbindliche Offerte.
      </p>

      <div className="vergleich-table">
        {rows.map((r, i) => (
          <div key={i} className={`vergleich-row ${!r.istVor && r === guenstigste ? "vergleich-row--best" : ""} ${r.istVor ? "vergleich-row--vor" : ""}`}>
            <span className="vergleich-name">{r.label}{!r.istVor && r === guenstigste && <span className="vergleich-best-tag">günstigste</span>}</span>
            {r.betrag != null ? (
              <span className="vergleich-betrag">{euro(r.betrag)} <span className="vergleich-unit">/ Jahr</span></span>
            ) : r.istVor ? (
              <span className="vergleich-missing">Jahresprämie noch nicht erfasst</span>
            ) : (
              <span className="vergleich-missing" title={r.warnungen?.join(" ")}>nicht berechenbar</span>
            )}
          </div>
        ))}
      </div>

      {vorPraemie != null && guenstigste?.betrag != null && (
        (() => {
          const diff = vorPraemie - guenstigste.betrag;
          const pct = vorPraemie > 0 ? Math.round((diff / vorPraemie) * 100) : 0;
          return diff > 0 ? (
            <div className="vergleich-savings vergleich-savings--good">
              <Check size={15} /> Ersparnis mit {guenstigste.label}: <strong>{euro(diff)} / Jahr ({pct}%)</strong>
            </div>
          ) : diff < 0 ? (
            <div className="vergleich-savings vergleich-savings--bad">
              <AlertTriangle size={15} /> {euro(-diff)} / Jahr teurer als die Vorversicherung — andere Argumente (Service, Deckungsumfang) nötig.
            </div>
          ) : null;
        })()
      )}
    </div>
  );
}

function BoatCard({ boat, onEdit, onDelete }) {
  return (
    <div className="boat-card">
      <div className="boat-card-head">
        <span className="boat-card-title"><Ship size={15} /> {boat.name || "Boot ohne Namen"}</span>
        <div className="boat-card-actions">
          <button type="button" className="btn btn--sm" onClick={() => onEdit(boat)}>Bearbeiten</button>
          <button type="button" className="icon-btn icon-btn--danger" onClick={() => onDelete(boat)} title="Boot löschen"><Trash2 size={14} /></button>
        </div>
      </div>
      <div className="risk-table">
        {BOAT_FIELD_DEFS.filter((f) => f.key !== "name").map((f) => {
          const v = boat[f.key];
          if (v === undefined || v === null || v === "" || v === false) return null;
          return <div className="risk-row" key={f.key}><span>{f.label}</span><span>{v === true ? "Ja" : String(v)}</span></div>;
        })}
      </div>
    </div>
  );
}

/* ===================== Polizze erfassen (schließt den roten Faden Offert -> Antrag -> Polizze) ===================== */
/* ===================== Historie-Tab (Kontaktverlauf) ===================== */
const HISTORIE_ICONS = { "Anruf": Phone, "E-Mail": Mail, "Termin": Calendar, "Notiz": FileText, "Sonstiges": Info };
function HistorieList({ customer, onAdd }) {
  const [typ, setTyp] = useState("Anruf");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    await onAdd(typ, text.trim());
    setText("");
    setSaving(false);
  };

  const eintraege = customer.historie || [];

  return (
    <div>
      <form className="historie-form" onSubmit={submit}>
        <select value={typ} onChange={(e) => setTyp(e.target.value)}>
          {HISTORIE_TYPEN.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input placeholder="Was ist passiert? (z. B. „Rückruf vereinbart für Fr. 14 Uhr“)" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" className="btn btn--primary" disabled={!text.trim() || saving}>
          {saving ? <Loader2 size={14} className="spin" /> : <Plus size={14} />} Eintragen
        </button>
      </form>

      {eintraege.length === 0 ? (
        <p className="empty-hint" style={{ marginTop: 14 }}>Noch keine Historie — Anrufe, Termine und Notizen landen hier, ebenso wichtige automatische Ereignisse (Statuswechsel, Polizze erfasst, Antrag erstellt).</p>
      ) : (
        <div className="historie-list">
          {eintraege.map((h) => {
            const Icon = HISTORIE_ICONS[h.typ] || Info;
            return (
              <div key={h.id} className={`historie-item ${h.system ? "historie-item--system" : ""}`}>
                <span className="historie-icon"><Icon size={13} /></span>
                <div className="historie-body">
                  <div className="historie-meta">
                    <span className="historie-typ">{h.typ}</span>
                    <span className="historie-datum">{new Date(h.datum).toLocaleString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="historie-text">{h.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PolizzeErfassenForm({ onCancel, onSave }) {
  const [versicherer, setVersicherer] = useState("");
  const [polizzennummer, setPolizzennummer] = useState("");
  const [versicherungsbeginn, setVersicherungsbeginn] = useState("");
  const [hauptfaelligkeit, setHauptfaelligkeit] = useState("");
  const [zahlweise, setZahlweise] = useState("Jährlich");
  const [sparten, setSparten] = useState([{ sparte: "Kasko", versicherungssumme: "", selbstbehalt: "", praemie: "" }]);
  const [notizen, setNotizen] = useState("");

  const updateSparte = (i, patch) => setSparten((s) => s.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const addSparte = () => setSparten((s) => [...s, { sparte: "Haftpflicht", versicherungssumme: "", selbstbehalt: "", praemie: "" }]);
  const removeSparte = (i) => setSparten((s) => s.filter((_, idx) => idx !== i));

  const canSubmit = versicherer.trim() && sparten.some((s) => s.sparte.trim() && s.praemie !== "");

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const vertrag = {
      id: uid(), erstellt: new Date().toISOString(), versicherer: versicherer.trim(), polizzennummer: polizzennummer.trim(),
      versicherungsbeginn: versicherungsbeginn.trim(), hauptfaelligkeit: hauptfaelligkeit.trim(), zahlweise,
      sparten: sparten.filter((s) => s.sparte.trim() && s.praemie !== "").map((s) => ({
        sparte: s.sparte.trim(),
        versicherungssumme: s.versicherungssumme !== "" ? Number(s.versicherungssumme) : null,
        selbstbehalt: s.selbstbehalt !== "" ? Number(s.selbstbehalt) : null,
        erstpraemie: Number(s.praemie), folgepraemie: Number(s.praemie),
      })),
      notizen: notizen.trim(),
    };
    onSave(vertrag);
  };

  return (
    <form className="panel" onSubmit={submit} style={{ marginTop: 12 }}>
      <h3 className="panel-subtitle" style={{ marginTop: 0 }}><FileCheck2 size={15} /> Polizze erfassen</h3>
      <div className="field-grid">
        <Field label="Versicherer *"><input value={versicherer} onChange={(e) => setVersicherer(e.target.value)} placeholder="z. B. NAUTIMA / Mannheimer, Callidus-Eigentarif, Wiener Städtische…" /></Field>
        <Field label="Polizzennummer"><input value={polizzennummer} onChange={(e) => setPolizzennummer(e.target.value)} /></Field>
        <Field label="Versicherungsbeginn"><input value={versicherungsbeginn} onChange={(e) => setVersicherungsbeginn(e.target.value)} placeholder="TT.MM.JJJJ" /></Field>
        <Field label="Hauptfälligkeit"><input value={hauptfaelligkeit} onChange={(e) => setHauptfaelligkeit(e.target.value)} placeholder="TT.MM." /></Field>
        <Field label="Zahlweise">
          <select value={zahlweise} onChange={(e) => setZahlweise(e.target.value)}>
            <option>Jährlich</option><option>Halbjährlich</option><option>Vierteljährlich</option><option>Monatlich</option><option>Zahlschein</option>
          </select>
        </Field>
      </div>

      <div className="mini-title">Sparten &amp; Prämien</div>
      <div className="repeat-list">
        {sparten.map((s, i) => (
          <div className="repeat-row" key={i}>
            <input value={s.sparte} onChange={(e) => updateSparte(i, { sparte: e.target.value })} placeholder="Sparte (z. B. Kasko)" style={{ maxWidth: 130 }} />
            <input value={s.versicherungssumme} onChange={(e) => updateSparte(i, { versicherungssumme: e.target.value })} placeholder="Vers.-Summe €" type="number" />
            <input value={s.selbstbehalt} onChange={(e) => updateSparte(i, { selbstbehalt: e.target.value })} placeholder="Selbstbehalt €" type="number" />
            <input value={s.praemie} onChange={(e) => updateSparte(i, { praemie: e.target.value })} placeholder="Prämie €/Jahr *" type="number" />
            {sparten.length > 1 && <button type="button" className="icon-btn icon-btn--danger" onClick={() => removeSparte(i)}><X size={14} /></button>}
          </div>
        ))}
      </div>
      <button type="button" className="btn btn--sm" onClick={addSparte} style={{ marginTop: 8 }}><Plus size={13} /> Weitere Sparte</button>

      <Field label="Notizen" span><textarea rows={2} value={notizen} onChange={(e) => setNotizen(e.target.value)} /></Field>

      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn btn--primary" disabled={!canSubmit}>Polizze speichern</button>
      </div>
    </form>
  );
}

/* ===================== Generischer Anzeige-Renderer für volle Antrags-/Bootsdatenblatt-Daten ===================== */
const PAYLOAD_KEY_LABELS = {
  versicherungsnehmer: "Versicherungsnehmer", vertrag: "Vertrag", vorversicherungen: "Vorversicherungen",
  vorschaeden: "Vorschäden", eigner: "Eigner", nutzung: "Nutzung", fahrzeug: "Fahrzeug", motoren: "Motor(en)",
  hoechstgeschw80: "Höchstgeschwindigkeit > 80 km/h", antrieb: "Antrieb", beiboot: "Beiboot", trailer: "Trailer",
  kasko: "Kasko", haftpflicht: "Haftpflicht", unfall: "Unfall", gesamtbeitragAC: "Gesamtbeitrag A–C",
  zahlungsart: "Zahlungsart", besondereVereinbarungen: "Besondere Vereinbarungen", sepa: "SEPA-Lastschrift", ortDatum: "Ort/Datum",
  allgemein: "Allgemeine Bootsdaten", technik: "Technische Spezifikationen", versicherung: "Versicherungsdaten",
  berechnungCallidus: "Berechnung (Callidus)", berechnung: "Berechnung", werte: "Versicherungswerte",
  anrede: "Anrede", name1: "Name/Firma", name2: "Name Zeile 2", strasse: "Straße/Hausnummer", plzOrt: "PLZ/Ort",
  beginn: "Beginn", ablauf: "Ablauf", zahlungsweise: "Zahlungsweise", schadenfreiSeit: "Schadenfrei seit",
  vorhanden: "Vorhanden", zeilen: "Einträge", istEigner: "Ist Eigner", eignerWer: "Wer ist Eigner",
  eignergemeinschaft: "Eignergemeinschaft", vertretungsberechtigter: "Vertretungsberechtigter",
  verchartert: "Verchartert", liegeplatzSommer: "Liegeplatz Sommer", liegeplatzWinter: "Liegeplatz Winter",
  fahrzeugart: "Fahrzeugart", mehrrumpf: "Mehrrumpfboot", segelflaeche: "Segelfläche (m²)", motorbootTyp: "Bauart",
  festrumpf: "Festrumpf", eigenbau: "Eigenbau", rumpfnr: "Rumpfnummer", laengeM: "Länge (m)", laengeFt: "Länge (ft)",
  flagge: "Flagge", register: "Registerort/-nr.", material: "Material/Rumpf", anwenden: "Beantragt",
  zone: "Fahrtgebiet", selbstbehalt: "Selbstbehalt", beitragssatzProzent: "Beitragssatz (%)", sfrKey: "SFR-Stufe",
  sfrProzent: "SFR (%)", persoenlicheEffekten: "Persönliche Effekten", steuersatz: "Versicherungssteuer (%)",
  steuerAndere: "Steuersatz abweichend", deckungssummeIndex: "Deckungssumme (Index)", sicherheitsleistungAusland: "Sicherheitsleistung Ausland",
  variante: "Variante", gleichAntragsteller: "Zahler = Antragsteller", kreditinstitut: "Kreditinstitut",
  ort: "Ort", datum: "Datum", registrierungsland: "Registrierungsland", werft: "Werft", modell: "Modell",
  hersteller: "Hersteller", baujahr: "Baujahr", yachttyp: "Yachttyp", laenge: "Länge", breite: "Breite",
  tiefgang: "Tiefgang", verdraengung: "Verdrängung", rumpfmaterial: "Rumpfmaterial", mastmaterial: "Mastmaterial",
  beibootVorhanden: "Beiboot vorhanden", maschinendeckung: "Maschinendeckung", motortyp: "Motortyp",
  motorleistungKW: "Motorleistung (kW)", herstellerMotor: "Hersteller Motor", regatta: "Regattateilnahme",
  modifikationen: "Modifikationen", fahrtgebietText: "Fahrtgebiet", fahrtgebietZone: "Zone (Tarif)",
  kategorie: "Kategorie", versWertBoot: "Versicherungswert Boot", zusAusruestung: "Zusätzliche Ausrüstung",
  persEffekten: "Persönliche Effekten", wertBeiboot: "Beiboot (€)", wertTrailer: "Trailer (€)",
  versicherungssummeGesamt: "Versicherungssumme gesamt", haftpflichtsumme: "Haftpflichtsumme", holzCarbon: "Holz/Carbon",
  zahlperiode: "Zahlperiode", geburtsdatum: "Geburtsdatum", email: "E-Mail", telefon: "Telefon", adresse: "Adresse",
  gesamt: "Gesamt", ok: "Berechnung gültig", rate: "Satz", grundbeitrag: "Grundbeitrag", grund: "Grundprämie",
  sfrSatz: "SFR-Satz", sfrAbzug: "SFR-Abzug", beitragNachSfr: "Beitrag nach SFR", effektenBeitrag: "Effekten-Beitrag",
  zwischensumme: "Zwischensumme", steuer: "Versicherungssteuer", betrag: "Betrag", basis: "Basis", quelle: "Basis",
  zuschlag: "Zuschlag", zuschlaege: "Zuschläge", saldo: "Zuschlagssaldo", nachZuschlag: "Nach Zuschlägen", mindest: "Mindestprämie",
  interpolated: "Interpoliert", am1: "Außenbordmotor 1 (€)", am2: "Außenbordmotor 2 (€)", hilfsAM: "Hilfsaußenbordmotor (€)",
};
function humanizePayloadKey(key) {
  if (PAYLOAD_KEY_LABELS[key]) return PAYLOAD_KEY_LABELS[key];
  const spaced = key.replace(/([A-Z])/g, " $1").replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
function formatPayloadLeaf(value) {
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (typeof value === "number") return value.toLocaleString("de-AT", { maximumFractionDigits: 4 });
  return String(value);
}
function PayloadGroup({ obj, depth }) {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    const items = obj.filter((it) => it !== null && it !== undefined && it !== "");
    if (items.length === 0) return null;
    return (
      <div className="payload-array">
        {items.map((item, i) => (
          <div key={i} className="payload-array-item">
            {item && typeof item === "object" ? <PayloadGroup obj={item} depth={depth + 1} /> : <span>{formatPayloadLeaf(item)}</span>}
          </div>
        ))}
      </div>
    );
  }
  if (typeof obj !== "object") return <span>{formatPayloadLeaf(obj)}</span>;

  const entries = Object.entries(obj).filter(([, v]) => v !== "" && v !== null && v !== undefined && v !== false && !(Array.isArray(v) && v.length === 0));
  if (entries.length === 0) return null;

  return (
    <div className="payload-group">
      {entries.map(([k, v]) => {
        if (v && typeof v === "object") {
          const rendered = <PayloadGroup obj={v} depth={depth + 1} />;
          if (!rendered) return null;
          return (
            <div key={k} className="payload-subsection">
              <div className="payload-subsection-title">{humanizePayloadKey(k)}</div>
              {rendered}
            </div>
          );
        }
        return <div key={k} className="payload-row"><span>{humanizePayloadKey(k)}</span><span>{formatPayloadLeaf(v)}</span></div>;
      })}
    </div>
  );
}
function AntragCard({ antrag }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="antrag-card">
      <button type="button" className="antrag-card-head" onClick={() => setOpen((o) => !o)}>
        <span className="antrag-card-title">
          <FileCheck2 size={14} /> {antrag.typ} <span className="antrag-card-date">— {new Date(antrag.erstellt).toLocaleDateString("de-AT")}</span>
        </span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>
      {open && <div className="antrag-card-body"><PayloadGroup obj={antrag.daten} depth={0} /></div>}
    </div>
  );
}

function vertragTotal(vertrag) {
  return (vertrag.sparten || []).reduce((sum, s) => sum + (s.folgepraemie ?? s.erstpraemie ?? 0), 0);
}
function VertragCard({ vertrag }) {
  const total = vertragTotal(vertrag);
  return (
    <div className="vertrag-card">
      <div className="vertrag-head">
        <div className="vertrag-head-left">
          <InsurerBadge name={vertrag.versicherer} />
          {vertrag.polizzennummer && <span className="vertrag-polnr">Polizze-Nr. {vertrag.polizzennummer}</span>}
        </div>
        {total > 0 && <span className="vertrag-total">{euro(total)}<span className="vertrag-total-label"> / Jahr</span></span>}
      </div>
      {(vertrag.versicherungsbeginn || vertrag.hauptfaelligkeit || vertrag.zahlweise) && (
        <div className="vertrag-meta">
          {vertrag.versicherungsbeginn && <span>Beginn {vertrag.versicherungsbeginn}</span>}
          {vertrag.hauptfaelligkeit && <span>Hauptfälligkeit {vertrag.hauptfaelligkeit}</span>}
          {vertrag.zahlweise && <span>{vertrag.zahlweise}</span>}
        </div>
      )}
      {vertrag.sparten?.length > 0 && (
        <div className="table-scroll">
        <table className="sparten-table">
          <thead><tr><th>Sparte</th><th>Vers.-Summe</th><th>Prämie</th></tr></thead>
          <tbody>
            {vertrag.sparten.map((s, i) => (
              <tr key={i}>
                <td>
                  {s.sparte}
                  {!vertrag.polizzennummer && s.polizzennummer && <span className="sparten-polnr"> · {s.polizzennummer}</span>}
                </td>
                <td>{s.versicherungssumme != null ? `${euro(s.versicherungssumme)}${s.selbstbehalt != null ? ` (SB ${euro(s.selbstbehalt)})` : ""}` : "—"}</td>
                <td>
                  {s.erstpraemie != null && s.folgepraemie != null && s.erstpraemie !== s.folgepraemie
                    ? <>{euro(s.folgepraemie)}<span className="sparten-erst"> (Erst {euro(s.erstpraemie)})</span></>
                    : euro(s.folgepraemie ?? s.erstpraemie ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
          {vertrag.sparten.length > 1 && (
            <tfoot><tr className="sparten-total-row"><td>Gesamt</td><td></td><td>{euro(total)}</td></tr></tfoot>
          )}
        </table>
        </div>
      )}
      {vertrag.notizen && <p className="vertrag-notes">{vertrag.notizen}</p>}
      {vertrag.quelle && <a href={vertrag.quelle} target="_blank" rel="noreferrer" className="vertrag-link">Original-Dokument ansehen ↗</a>}
    </div>
  );
}

function CustomerForm({ initial, onCancel, onSave, partners }) {
  const legacySplit = !initial?.vorname && !initial?.nachname && initial?.name ? splitFullName(initial.name) : null;
  const [titel, setTitel] = useState(initial?.titel || legacySplit?.titel || "");
  const [vorname, setVorname] = useState(initial?.vorname || legacySplit?.vorname || "");
  const [nachname, setNachname] = useState(initial?.nachname || legacySplit?.nachname || "");
  const [geburtsdatum, setGeburtsdatum] = useState(initial?.geburtsdatum || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [telefon, setTelefon] = useState(initial?.telefon || "");
  const [adresse, setAdresse] = useState(initial?.adresse || "");
  const [bootsname, setBootsname] = useState(initial?.bootsname || "");
  const [bootstyp, setBootstyp] = useState(initial?.bootstyp || "Motorboot");
  const [status, setStatus] = useState(initial?.status || "");
  const [notizen, setNotizen] = useState(initial?.notizen || "");
  const [partnerId, setPartnerId] = useState(initial?.partnerId || "");
  const [provision, setProvision] = useState(initial?.provision ?? "");
  const [quelle, setQuelle] = useState(initial?.quelle || "");
  const [vorversicherungVersicherer, setVorversicherungVersicherer] = useState(initial?.vorversicherungVersicherer || "");
  const [vorversicherungPolizzennummer, setVorversicherungPolizzennummer] = useState(initial?.vorversicherungPolizzennummer || "");
  const [vorversicherungHauptfaelligkeit, setVorversicherungHauptfaelligkeit] = useState(initial?.vorversicherungHauptfaelligkeit || "");
  const [vorversicherungPraemie, setVorversicherungPraemie] = useState(initial?.vorversicherungPraemie ?? "");

  const submit = (e) => {
    e.preventDefault();
    if (!nachname.trim()) return;
    const { name, ...rest } = initial || {};
    onSave({
      ...rest, titel: titel.trim(), vorname: vorname.trim(), nachname: nachname.trim(), geburtsdatum, email, telefon, adresse, bootsname, bootstyp, status, notizen,
      partnerId, provision: provision === "" ? null : Number(provision), quelle,
      vorversicherungVersicherer: vorversicherungVersicherer.trim(), vorversicherungPolizzennummer: vorversicherungPolizzennummer.trim(), vorversicherungHauptfaelligkeit,
      vorversicherungPraemie: vorversicherungPraemie === "" ? null : Number(vorversicherungPraemie),
    });
  };

  return (
    <form className="panel customer-form" onSubmit={submit}>
      <h2 className="panel-title">{initial?.id ? "Kunde bearbeiten" : "Neuer Kunde"}</h2>
      <div className="field-grid">
        <Field label="Titel" hint="z. B. Dr., Mag., Ing."><input value={titel} onChange={(e) => setTitel(e.target.value)} /></Field>
        <Field label="Vorname"><input value={vorname} onChange={(e) => setVorname(e.target.value)} /></Field>
        <Field label="Nachname *" span><input value={nachname} onChange={(e) => setNachname(e.target.value)} required /></Field>
        <Field label="Geburtsdatum" hint="Für die automatische Geburtstagserinnerung"><input value={geburtsdatum} onChange={(e) => setGeburtsdatum(e.target.value)} placeholder="TT.MM.JJJJ" /></Field>
        <Field label="E-Mail"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Telefon"><input value={telefon} onChange={(e) => setTelefon(e.target.value)} /></Field>
        <Field label="Adresse"><input value={adresse} onChange={(e) => setAdresse(e.target.value)} /></Field>
        <Field label="Bootsname"><input value={bootsname} onChange={(e) => setBootsname(e.target.value)} /></Field>
        <Field label="Bootstyp">
          <select value={bootstyp} onChange={(e) => setBootstyp(e.target.value)}>
            <option>Motorboot</option><option>Segelboot</option>
          </select>
        </Field>
        <Field label="Partner / Vermittler" hint="Wer hat den Kunden gebracht?">
          <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
            <option value="">— kein Partner —</option>
            {(partners || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Quelle" hint="Wie kam der Kontakt zustande?">
          <select value={quelle} onChange={(e) => setQuelle(e.target.value)}>
            <option value="">— unbekannt —</option>
            {QUELLE_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        </Field>
        <Field label="Provision (%)"><input type="number" step="0.5" min="0" value={provision} onChange={(e) => setProvision(e.target.value)} /></Field>
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">— kein Status —</option>
            {STATUS_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Vorversicherung — Versicherer" hint="Falls Wechsel von bestehendem Vertrag"><input value={vorversicherungVersicherer} onChange={(e) => setVorversicherungVersicherer(e.target.value)} /></Field>
        <Field label="Vorversicherung — Polizzennummer" hint="Für das Kündigungsschreiben, falls bekannt"><input value={vorversicherungPolizzennummer} onChange={(e) => setVorversicherungPolizzennummer(e.target.value)} /></Field>
        <Field label="Vorversicherung — Hauptfälligkeit" hint="Kündigungsfrist wird automatisch 4 Monate davor berechnet">
          <input type="date" value={vorversicherungHauptfaelligkeit} onChange={(e) => setVorversicherungHauptfaelligkeit(e.target.value)} />
        </Field>
        <Field label="Vorversicherung — Jahresprämie (€)" hint="Für den automatischen Vergleich mit NAUTIMA/Callidus">
          <input type="number" step="10" min="0" value={vorversicherungPraemie} onChange={(e) => setVorversicherungPraemie(e.target.value)} />
        </Field>
      </div>
      {vorversicherungHauptfaelligkeit && (() => {
        const frist = berechneKuendigungsfrist(vorversicherungHauptfaelligkeit);
        return frist ? (
          <div className="warnbox" style={{ marginTop: -4 }}>
            <AlertTriangle size={15} /> Kündigungsfrist: spätestens <strong>{frist.toLocaleDateString("de-AT")}</strong> kündigen, sonst verlängert sich der alte Vertrag automatisch um ein Jahr.
          </div>
        ) : null;
      })()}
      <Field label="Notizen"><textarea rows={3} value={notizen} onChange={(e) => setNotizen(e.target.value)} /></Field>
      <p className="form-hint">Firmen/Vereine: Namen einfach ins Feld „Nachname" schreiben, „Vorname" leer lassen. Detaillierte Risiko- und Vertragsdaten (Sparten, Prämien, Polizzennummern) werden über den Import-Tab strukturiert angelegt und hier in der Detailansicht angezeigt.</p>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn btn--primary">Speichern</button>
      </div>
    </form>
  );
}

function DocumentRow({ doc, onDelete }) {
  const download = () => {
    const a = document.createElement("a");
    a.href = `data:${doc.mimeType};base64,${doc.dataBase64}`;
    a.download = doc.filename;
    a.click();
  };
  const preview = () => {
    const w = window.open();
    if (w) w.document.write(`<iframe src="data:${doc.mimeType};base64,${doc.dataBase64}" style="width:100%;height:100vh;border:0;"></iframe>`);
  };
  return (
    <div className="doc-row">
      <FileText size={16} />
      <div className="doc-info">
        <span className="doc-name">{doc.filename}</span>
        <span className="doc-meta">{(doc.size / 1024).toFixed(0)} KB · {new Date(doc.uploadedAt).toLocaleDateString("de-AT")}</span>
      </div>
      <button className="icon-btn" title="Vorschau" onClick={preview}><Eye size={15} /></button>
      <button className="icon-btn" title="Herunterladen" onClick={download}><Download size={15} /></button>
      <button className="icon-btn icon-btn--danger" title="Löschen" onClick={() => onDelete(doc.id)}><Trash2 size={15} /></button>
    </div>
  );
}

function CustomerDetail({ customer, onBack, onEdit, onDelete, onStatusChange, partners, onSaveBoat, onDeleteBoat, onAddVertrag, onCustomersChanged, onAddHistorie }) {
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);
  const [subTab, setSubTab] = useState("uebersicht"); // uebersicht | boote | historie | dokumente
  const [boatView, setBoatView] = useState({ mode: "list" }); // list | form
  const [nextStepMode, setNextStepMode] = useState(null); // null | "nautima" | "bootsdatenblatt" | "polizze"
  const [anschreibenText, setAnschreibenText] = useState("");
  const [anschreibenCopied, setAnschreibenCopied] = useState(false);

  const loadDocs = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const listing = await window.storage.list(`doc:${customer.id}:`, true);
      const keys = listing?.keys || [];
      const loaded = [];
      for (const k of keys) {
        const d = await storageGetJSON(k, true);
        if (d) loaded.push(d);
      }
      loaded.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      setDocs(loaded);
    } catch (e) {
      setDocs([]);
    }
    setLoadingDocs(false);
  }, [customer.id]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleFiles = async (fileList) => {
    setUploadError("");
    const files = Array.from(fileList);
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`"${file.name}" ist größer als 5 MB und wurde übersprungen.`);
        continue;
      }
      setUploading(true);
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const base64 = dataUrl.split(",")[1];
        const docId = uid();
        const doc = {
          id: docId, customerId: customer.id, filename: file.name,
          mimeType: file.type || "application/octet-stream", size: file.size,
          uploadedAt: new Date().toISOString(), dataBase64: base64,
        };
        await storageSetJSON(`doc:${customer.id}:${docId}`, doc, true);
        await appendHistorie(customer, "Sonstiges", `Dokument hochgeladen: „${file.name}"`, true);
      } catch (e) {
        setUploadError(`Fehler beim Hochladen von "${file.name}".`);
      }
    }
    setUploading(false);
    loadDocs();
    if (onCustomersChanged) await onCustomersChanged();
  };

  const deleteDoc = async (docId) => {
    try { await window.storage.delete(`doc:${customer.id}:${docId}`, true); } catch (e) {}
    loadDocs();
  };

  const boats = getBoats(customer);
  const primaryBoat = boats[0];

  const saveBoat = async (boat) => {
    await onSaveBoat(customer, boat);
    setBoatView({ mode: "list" });
  };
  const deleteBoat = async (boat) => {
    if (!window.confirm(`„${boat.name || "Boot ohne Namen"}" wirklich löschen?`)) return;
    await onDeleteBoat(customer, boat);
  };

  const nautimaPrefill = {
    bootstyp: primaryBoat?.bootstyp === "Segelboot" ? "segelboot" : "motorboot",
    baujahr: primaryBoat?.baujahr ? Number(primaryBoat.baujahr) : undefined,
    segelflaeche: primaryBoat?.segelflaeche || undefined,
    motorkw: primaryBoat?.motorleistungKW ? Number(primaryBoat.motorleistungKW) : undefined,
    name1: fullName(customer),
    strasse: (customer.adresse || "").split(",")[0]?.trim() || undefined,
    plzOrt: (customer.adresse || "").split(",").slice(1).join(",").trim() || undefined,
  };
  const callidusPrefill = {
    bootstyp: primaryBoat?.bootstyp === "Segelboot" ? "segelboot" : "motorboot",
    baujahr: primaryBoat?.baujahr ? Number(primaryBoat.baujahr) : undefined,
    segelflaeche: primaryBoat?.segelflaeche || undefined,
    motorkw: primaryBoat?.motorleistungKW ? Number(primaryBoat.motorleistungKW) : undefined,
    titelVN: customer.titel, vorname: customer.vorname, nachname: customer.nachname,
    adresse: customer.adresse, geburtsdatum: customer.geburtsdatum, email: customer.email, telefon: customer.telefon,
  };

  const savePolizze = async (vertrag) => {
    await onAddVertrag(customer, vertrag);
    setNextStepMode(null);
  };

  const openAnschreiben = (generator) => {
    setAnschreibenText(generator(customer, primaryBoat));
    setAnschreibenCopied(false);
  };
  const copyAnschreiben = async () => {
    try { await navigator.clipboard.writeText(anschreibenText); setAnschreibenCopied(true); } catch (e) { setAnschreibenCopied(false); }
  };

  const nextStepBanner = () => {
    if (nextStepMode) return null;
    if (customer.status === "polizze") {
      return (
        <div className="nextstep-banner nextstep-banner--done">
          <Check size={16} />
          <span>Polizze aktiv.</span>
          <div className="nextstep-actions">
            <button type="button" className="btn btn--primary btn--sm" onClick={() => openAnschreiben(generatePolizzeMail)}><Mail size={13} /> Polizze-Mail vorbereiten</button>
            <button type="button" className="btn btn--sm" onClick={() => setNextStepMode("polizze")}><FileCheck2 size={13} /> Weitere Sparte erfassen</button>
          </div>
        </div>
      );
    }
    if (customer.status === "antrag") {
      return (
        <div className="nextstep-banner">
          <span className="nextstep-label">Nächster Schritt</span>
          <span className="nextstep-text">Angebot von der Versicherung da? Anschreiben vorbereiten und zusammen mit dem Angebot an den Kunden zur Unterschrift schicken. Sobald die Polizze zurück ist, hier erfassen.</span>
          <div className="nextstep-actions">
            <button type="button" className="btn btn--sm" onClick={() => openAnschreiben(generateAntragAnschreiben)}><Mail size={13} /> Anschreiben vorbereiten</button>
            <button type="button" className="btn btn--primary btn--sm" onClick={() => setNextStepMode("polizze")}><FileCheck2 size={13} /> Polizze erfassen</button>
          </div>
        </div>
      );
    }
    // offert oder kein Status
    return (
      <div className="nextstep-banner">
        <span className="nextstep-label">Nächster Schritt</span>
        <span className="nextstep-text">Angebot steht — jetzt direkt hier den Antrag stellen (Bootsdaten sind schon vorausgefüllt).</span>
        <div className="nextstep-actions">
          <button type="button" className="btn btn--primary btn--sm" onClick={() => setNextStepMode("nautima")}><FileCheck2 size={13} /> NAUTIMA-Antrag</button>
          <button type="button" className="btn btn--sm" onClick={() => setNextStepMode("bootsdatenblatt")}><FileText size={13} /> Bootsdatenblatt</button>
        </div>
      </div>
    );
  };

  return (
    <div className="panel customer-detail">
      <button className="back-link" onClick={onBack}><ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Zurück zur Übersicht</button>
      <div className="detail-head">
        <div>
          <h2 className="panel-title" style={{ marginBottom: 2 }}>{fullName(customer)}</h2>
          <span className="result-subtitle">{boatsSubtitle(customer)}</span>
        </div>
        <div className="detail-actions">
          <select className="status-select" value={customer.status || ""} onChange={(e) => onStatusChange(customer.id, e.target.value)}>
            <option value="">— kein Status —</option>
            {STATUS_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button className="btn" onClick={() => onEdit(customer)}>Bearbeiten</button>
          <button className="btn btn--danger" onClick={() => onDelete(customer.id)}>Löschen</button>
        </div>
      </div>

      <div className="subtabnav">
        <button className={subTab === "uebersicht" ? "subtab subtab--active" : "subtab"} onClick={() => setSubTab("uebersicht")}>Übersicht</button>
        <button className={subTab === "boote" ? "subtab subtab--active" : "subtab"} onClick={() => setSubTab("boote")}>
          <Ship size={13} /> Boote{boats.length > 0 ? ` (${boats.length})` : ""}
        </button>
        <button className={subTab === "historie" ? "subtab subtab--active" : "subtab"} onClick={() => setSubTab("historie")}>
          <Calendar size={13} /> Historie{customer.historie?.length > 0 ? ` (${customer.historie.length})` : ""}
        </button>
        <button className={subTab === "dokumente" ? "subtab subtab--active" : "subtab"} onClick={() => setSubTab("dokumente")}>
          <FileText size={13} /> Dokumente{docs.length > 0 ? ` (${docs.length})` : ""}
        </button>
      </div>

      {subTab === "historie" && (
        <HistorieList customer={customer} onAdd={(typ, text) => onAddHistorie(customer, typ, text)} />
      )}

      {subTab === "uebersicht" && (
        <>
          {nextStepBanner()}
          {anschreibenText && (
            <div className="output-box" style={{ marginBottom: 16 }}>
              <p className="output-instructions"><strong>Fast fertig:</strong> Text kopieren, hier im Chat einfügen und mir das Versicherungs-Angebot als Datei mitgeben — ich lege daraus den Outlook-Entwurf mit Anhang an.</p>
              <textarea className="output-textarea" readOnly value={anschreibenText} onFocus={(e) => e.target.select()} rows={10} />
              <button type="button" className="copy-btn" onClick={copyAnschreiben}>
                {anschreibenCopied ? <Check size={15} /> : <Copy size={15} />} {anschreibenCopied ? "Kopiert!" : "Text kopieren"}
              </button>
            </div>
          )}
          {nextStepMode === "nautima" && (
            <div className="panel embed-panel">
              <div className="embed-panel-head">
                <h3 className="panel-subtitle" style={{ marginTop: 0 }}><FileCheck2 size={15} /> NAUTIMA-Antrag für {fullName(customer)}</h3>
                <button className="icon-btn" onClick={() => setNextStepMode(null)} title="Schließen"><X size={16} /></button>
              </div>
              <NautimaAntragTab customers={[customer]} prefill={nautimaPrefill} onCustomersChanged={onCustomersChanged} />
            </div>
          )}
          {nextStepMode === "bootsdatenblatt" && (
            <div className="panel embed-panel">
              <div className="embed-panel-head">
                <h3 className="panel-subtitle" style={{ marginTop: 0 }}><FileText size={15} /> Bootsdatenblatt für {fullName(customer)}</h3>
                <button className="icon-btn" onClick={() => setNextStepMode(null)} title="Schließen"><X size={16} /></button>
              </div>
              <CallidusDatenblattTab customers={[customer]} prefill={callidusPrefill} onCustomersChanged={onCustomersChanged} />
            </div>
          )}
          {nextStepMode === "polizze" && (
            <PolizzeErfassenForm onCancel={() => setNextStepMode(null)} onSave={savePolizze} />
          )}

          <div className="detail-grid">
            {customer.email && <div><span className="detail-label">E-Mail</span><span>{customer.email}</span></div>}
            {customer.telefon && <div><span className="detail-label">Telefon</span><span>{customer.telefon}</span></div>}
            {customer.geburtsdatum && <div><span className="detail-label">Geburtsdatum</span><span>{customer.geburtsdatum}</span></div>}
            {customer.adresse && <div><span className="detail-label">Adresse</span><span>{customer.adresse}</span></div>}
            {!customer.email && !customer.telefon && customer.kontakt && <div><span className="detail-label">Kontakt</span><span>{customer.kontakt}</span></div>}
            {customer.partnerId && (
              <div>
                <span className="detail-label">Partner / Vermittler</span>
                <span>{(partners || []).find((p) => p.id === customer.partnerId)?.name || "—"}{customer.provision != null ? ` · ${customer.provision}% Provision` : ""}</span>
              </div>
            )}
            {customer.quelle && <div><span className="detail-label">Quelle</span><span>{customer.quelle}</span></div>}
            {customer.vorversicherungHauptfaelligkeit && (
              <div>
                <span className="detail-label">Vorversicherung</span>
                <span>{customer.vorversicherungVersicherer || "—"} · Hauptfälligkeit {new Date(customer.vorversicherungHauptfaelligkeit).toLocaleDateString("de-AT")}</span>
              </div>
            )}
          </div>
          {customer.vorversicherungHauptfaelligkeit && (() => {
            const frist = berechneKuendigungsfrist(customer.vorversicherungHauptfaelligkeit);
            if (!frist) return null;
            const tageBis = Math.round((frist - new Date()) / 86400000);
            const dringend = tageBis <= 42;
            return (
              <div className={dringend ? "warnbox" : "nextstep-banner"} style={{ marginBottom: 14, flexWrap: "wrap" }}>
                <AlertTriangle size={15} />
                <span style={{ flex: 1 }}>
                  Kündigungsfrist Vorversicherung: <strong>{frist.toLocaleDateString("de-AT")}</strong>
                  {tageBis >= 0 ? ` (noch ${tageBis} Tage)` : ` — bereits überschritten`}
                </span>
                <button type="button" className="btn btn--sm" onClick={() => openAnschreiben((c) => generateKuendigungsschreiben(c))}>
                  <FileText size={13} /> Kündigungsschreiben vorbereiten
                </button>
              </div>
            );
          })()}
          {(customer.vorversicherungVersicherer || customer.vorversicherungPraemie != null) && (
            <VergleichPanel customer={customer} primaryBoat={primaryBoat} />
          )}
          {customer.notizen && <p className="detail-notes">{customer.notizen}</p>}

          {customer.vertraege?.length > 0 && (
            <>
              <div className="section-head-row">
                <h3 className="panel-subtitle" style={{ margin: 0 }}><FileCheck2 size={15} /> Polizzen</h3>
                {customer.vertraege.length > 1 && (
                  <span className="vertraege-summary">
                    {customer.vertraege.length} Verträge · {euro(customer.vertraege.reduce((sum, v) => sum + vertragTotal(v), 0))} / Jahr gesamt
                  </span>
                )}
              </div>
              {customer.vertraege.map((v) => <VertragCard key={v.id} vertrag={v} />)}
            </>
          )}

          {customer.antraege?.length > 0 && (
            <>
              <h3 className="panel-subtitle"><FileCheck2 size={15} /> Anträge &amp; Bootsdatenblätter (vollständig)</h3>
              {customer.antraege.map((a) => <AntragCard key={a.id} antrag={a} />)}
            </>
          )}

          {customer.quotes?.length > 0 && (
            <div className="quotes-block">
              <h3 className="panel-subtitle">Gespeicherte Prämienberechnungen</h3>
              {customer.quotes.map((q) => (
                <div key={q.id} className="quote-row">
                  <span>{new Date(q.erstellt).toLocaleDateString("de-AT")} · {q.bootstyp} · {euro(q.versicherungssumme)}{q.quelle ? ` · ${q.quelle}` : ""}</span>
                  <span className="quote-values">
                    {q.nautima != null && `NAUTIMA ${euro(q.nautima)}`}
                    {q.nautima != null && q.callidus != null && " · "}
                    {q.callidus != null && `Callidus ${euro(q.callidus)}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {subTab === "boote" && (
        boatView.mode === "form" ? (
          <BoatForm initial={boatView.data} onCancel={() => setBoatView({ mode: "list" })} onSave={saveBoat} />
        ) : (
          <>
            <div className="section-head-row">
              <h3 className="panel-subtitle" style={{ margin: 0 }}><Ship size={15} /> Boote</h3>
              <button type="button" className="btn btn--sm" onClick={() => setBoatView({ mode: "form", data: null })}><Plus size={13} /> Neues Boot</button>
            </div>
            {boats.length === 0 ? (
              <p className="empty-hint">Noch kein Boot hinterlegt.</p>
            ) : (
              boats.map((b) => (
                <BoatCard
                  key={b.id}
                  boat={b}
                  onEdit={(boat) => setBoatView({ mode: "form", data: boat })}
                  onDelete={deleteBoat}
                />
              ))
            )}
          </>
        )
      )}

      {subTab === "dokumente" && (
        <>
          <div
            className="dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={20} />
            <span>Dateien hierher ziehen oder klicken zum Hochladen</span>
            <span className="dropzone-hint">PDF, JPG, PNG · max. 5 MB pro Datei — wird nur abgelegt, nicht automatisch ausgelesen</span>
            <input ref={fileInputRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
          </div>
          <p className="dropzone-extract-hint">
            <Info size={12} style={{ flexShrink: 0, marginTop: 1 }} />
            Für automatische Datenübernahme aus einer Polizze: Datei zusätzlich hier im Chat an Claude schicken — die ausgelesenen Daten kannst du danach über den <strong>Import</strong>-Tab bei diesem Kunden übernehmen.
          </p>
          {uploading && <div className="uploading"><Loader2 size={14} className="spin" /> Wird hochgeladen…</div>}
          {uploadError && <WarnBox>{uploadError}</WarnBox>}

          <div className="doc-list">
            {loadingDocs ? (
              <div className="uploading"><Loader2 size={14} className="spin" /> Dokumente werden geladen…</div>
            ) : docs.length === 0 ? (
              <p className="empty-hint">Noch keine Dokumente hinterlegt.</p>
            ) : (
              docs.map((d) => <DocumentRow key={d.id} doc={d} onDelete={deleteDoc} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ===================== Sichtbarkeit: Wochenziel & Trichter ===================== */
/* ===================== Schnell-Lead-Erfassung ===================== */
function QuickLeadForm({ onCancel, onSave }) {
  const [name, setName] = useState("");
  const [kontakt, setKontakt] = useState("");
  const [quelle, setQuelle] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = name.trim().length > 0;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    const split = splitFullName(name);
    const isEmail = kontakt.includes("@");
    await onSave({
      titel: split.titel, vorname: split.vorname, nachname: split.nachname,
      email: isEmail ? kontakt.trim() : "", telefon: !isEmail ? kontakt.trim() : "",
      quelle, status: "", adresse: "", geburtsdatum: "", bootsname: "", bootstyp: "Motorboot", notizen: "",
    });
    setSaving(false);
  };

  return (
    <form className="panel quicklead-form" onSubmit={submit}>
      <h3 className="panel-subtitle" style={{ marginTop: 0 }}><Plus size={15} /> Schnell-Lead erfassen</h3>
      <p className="field-hint" style={{ marginBottom: 10 }}>Nur das Nötigste — Details kannst du später beim Kunden nachtragen.</p>
      <div className="quicklead-row">
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <input placeholder="Telefon oder E-Mail" value={kontakt} onChange={(e) => setKontakt(e.target.value)} />
        <select value={quelle} onChange={(e) => setQuelle(e.target.value)}>
          <option value="">Quelle…</option>
          {QUELLE_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
        </select>
        <button type="submit" className="btn btn--primary" disabled={!canSubmit || saving}>
          {saving ? <Loader2 size={14} className="spin" /> : <Check size={14} />} Erfassen
        </button>
        <button type="button" className="btn" onClick={onCancel}>Abbrechen</button>
      </div>
    </form>
  );
}

function ZielTracker({ customers }) {
  const [ziel, setZiel] = useState(1);
  const [editingZiel, setEditingZiel] = useState(false);
  const [zielInput, setZielInput] = useState("1");
  const [taskCreatedThisWeek, setTaskCreatedThisWeek] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("settings:wochenziel", true);
        if (r?.value) { const n = Number(r.value); if (n > 0) { setZiel(n); setZielInput(String(n)); } }
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { start, end } = getWeekBounds();
        const listing = await window.storage.list("task:", true);
        const seenCustomers = new Set();
        for (const k of listing?.keys || []) {
          const t = await storageGetJSON(k, true);
          if (t?.titel?.startsWith("Angebot nachfassen") && t.erstellt) {
            const d = new Date(t.erstellt);
            if (d >= start && d < end) seenCustomers.add(t.customerId);
          }
        }
        setTaskCreatedThisWeek(seenCustomers.size);
      } catch (e) {}
    })();
  }, [customers]);

  const saveZiel = async () => {
    const n = Math.max(1, Number(zielInput) || 1);
    setZiel(n);
    setEditingZiel(false);
    try { await window.storage.set("settings:wochenziel", String(n), true); } catch (e) {}
  };

  const { start, end } = getWeekBounds();
  const polizzenDieseWoche = customers.reduce((sum, c) => {
    const count = (c.vertraege || []).filter((v) => v.erstellt && new Date(v.erstellt) >= start && new Date(v.erstellt) < end).length;
    return sum + count;
  }, 0);

  const pct = Math.min(100, Math.round((polizzenDieseWoche / ziel) * 100));
  const reached = polizzenDieseWoche >= ziel;

  const offertCount = customers.filter((c) => c.status === "offert").length;
  const antragCount = customers.filter((c) => c.status === "antrag").length;
  const polizzeCount = customers.filter((c) => c.status === "polizze").length;
  const pipelineTotal = offertCount + antragCount + polizzeCount;
  const antragRate = offertCount > 0 ? Math.round((antragCount + polizzeCount) / (offertCount + antragCount + polizzeCount) * 100) : null;
  const polizzeRate = (offertCount + antragCount + polizzeCount) > 0 ? Math.round(polizzeCount / (offertCount + antragCount + polizzeCount) * 100) : null;

  return (
    <div className="ziel-panel">
      <div className="ziel-row">
        <div className="ziel-goal">
          <div className="ziel-goal-head">
            <span className="ziel-label">Wochenziel</span>
            {editingZiel ? (
              <span className="ziel-edit">
                <input type="number" min="1" value={zielInput} onChange={(e) => setZielInput(e.target.value)} style={{ width: 48 }} />
                <button type="button" className="btn btn--sm" onClick={saveZiel}>OK</button>
              </span>
            ) : (
              <button type="button" className="ziel-edit-link" onClick={() => setEditingZiel(true)}>Ziel ändern</button>
            )}
          </div>
          <div className="ziel-progress-row">
            <span className={`ziel-count ${reached ? "ziel-count--reached" : ""}`}>{polizzenDieseWoche} / {ziel}</span>
            <span className="ziel-progress-track"><span className="ziel-progress-fill" style={{ width: `${pct}%`, background: reached ? "#6FE3A6" : "#0F6EBE" }} /></span>
            {reached && <Check size={16} className="ziel-check" />}
          </div>
          <span className="ziel-hint">neue Polizzen diese Woche (Mo–So) · {taskCreatedThisWeek} neue Offerte diese Woche</span>
        </div>

        <div className="ziel-funnel">
          <span className="ziel-label">Pipeline gerade</span>
          <div className="funnel-row">
            <div className="funnel-stage" style={{ "--stage-color": "#41505A" }}>
              <span className="funnel-count">{offertCount}</span><span className="funnel-name">Offert</span>
            </div>
            <span className="funnel-arrow">→{antragRate != null && <span className="funnel-rate">{antragRate}%</span>}</span>
            <div className="funnel-stage" style={{ "--stage-color": "#0F6EBE" }}>
              <span className="funnel-count">{antragCount}</span><span className="funnel-name">Antrag</span>
            </div>
            <span className="funnel-arrow">→{polizzeRate != null && <span className="funnel-rate">{polizzeRate}%</span>}</span>
            <div className="funnel-stage" style={{ "--stage-color": "#032856" }}>
              <span className="funnel-count">{polizzeCount}</span><span className="funnel-name">Polizze</span>
            </div>
          </div>
          {pipelineTotal > 0 && <span className="ziel-hint">Anteile bezogen auf {pipelineTotal} Kunden aktuell in Offert/Antrag/Polizze</span>}
        </div>
      </div>
    </div>
  );
}

function KundenTab({ partners }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState({ mode: "list" }); // list | form | detail
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle"); // alle | kein | offert | antrag | polizze
  const [showQuickLead, setShowQuickLead] = useState(false);
  const [quickLeadMsg, setQuickLeadMsg] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const listing = await window.storage.list("customer:", true);
      const keys = listing?.keys || [];
      const loaded = [];
      for (const k of keys) {
        const c = await storageGetJSON(k, true);
        if (c) loaded.push(c);
      }
      loaded.sort((a, b) => customerSortKey(a).localeCompare(customerSortKey(b), "de"));
      setCustomers(loaded);
    } catch (e) { setCustomers([]); }
    setLoading(false);
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const saveCustomer = async (data) => {
    const id = data.id || uid();
    let previousStatus = null;
    let previousHauptfaelligkeit = null;
    if (data.id) {
      const existing = await storageGetJSON(`customer:${id}`, true);
      previousStatus = existing?.status || null;
      previousHauptfaelligkeit = existing?.vorversicherungHauptfaelligkeit || null;
    }
    const record = { ...data, id, quotes: data.quotes || [], updatedAt: new Date().toISOString() };
    await storageSetJSON(`customer:${id}`, record, true);
    if (record.status === "offert" && previousStatus !== "offert") await createOffertTasks(record);
    if (record.vorversicherungHauptfaelligkeit && record.vorversicherungHauptfaelligkeit !== previousHauptfaelligkeit) {
      await clearKuendigungsTasks(id);
      await createKuendigungsTasks(record);
    }
    await loadCustomers();
    setView({ mode: "detail", id });
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm("Kunde inkl. aller Dokumente wirklich löschen?")) return;
    try {
      const listing = await window.storage.list(`doc:${id}:`, true);
      for (const k of listing?.keys || []) await window.storage.delete(k, true);
      await window.storage.delete(`customer:${id}`, true);
    } catch (e) {}
    await loadCustomers();
    setView({ mode: "list" });
  };

  const changeStatus = async (id, status) => {
    const c = await storageGetJSON(`customer:${id}`, true);
    if (!c) return;
    const eintrag = { id: uid(), datum: new Date().toISOString(), typ: "Sonstiges", text: `Status geändert: ${statusInfo(c.status)?.label || "kein Status"} → ${statusInfo(status)?.label || "kein Status"}`, system: true };
    const updated = { ...c, status, historie: [eintrag, ...(c.historie || [])] };
    await storageSetJSON(`customer:${id}`, updated, true);
    if (status === "offert" && c.status !== "offert") await createOffertTasks(updated);
    await loadCustomers();
  };

  const addHistorie = async (customer, typ, text) => {
    await appendHistorie(customer, typ, text, false);
    await loadCustomers();
  };

  const saveBoat = async (customer, boat) => {
    const fresh = (await storageGetJSON(`customer:${customer.id}`, true)) || customer;
    const existingBoats = getBoats(fresh);
    const isLegacyConversion = existingBoats.length === 1 && existingBoats[0].id === "legacy" && !(fresh.boote?.length > 0);
    let newBoote;
    if (isLegacyConversion) {
      newBoote = [boat];
    } else {
      const list = fresh.boote || [];
      const idx = list.findIndex((b) => b.id === boat.id);
      newBoote = idx >= 0 ? list.map((b) => (b.id === boat.id ? boat : b)) : [...list, boat];
    }
    await storageSetJSON(`customer:${customer.id}`, { ...fresh, boote: newBoote }, true);
    await loadCustomers();
  };

  const deleteBoat = async (customer, boat) => {
    const fresh = (await storageGetJSON(`customer:${customer.id}`, true)) || customer;
    const updated = { ...fresh };
    if (boat.id === "legacy") {
      updated.boote = [];
      updated.bootsname = "";
      updated.risiko = {};
    } else {
      updated.boote = (fresh.boote || []).filter((b) => b.id !== boat.id);
    }
    await storageSetJSON(`customer:${customer.id}`, updated, true);
    await loadCustomers();
  };

  const addVertrag = async (customer, vertrag) => {
    const fresh = (await storageGetJSON(`customer:${customer.id}`, true)) || customer;
    const wasFirstPolicy = !(fresh.vertraege?.length > 0);
    const spartenText = (vertrag.sparten || []).map((s) => s.sparte).join(", ");
    const eintrag = { id: uid(), datum: new Date().toISOString(), typ: "Sonstiges", text: `Polizze erfasst: ${vertrag.versicherer}${spartenText ? ` (${spartenText})` : ""}`, system: true };
    const updated = { ...fresh, vertraege: [...(fresh.vertraege || []), vertrag], status: "polizze", historie: [eintrag, ...(fresh.historie || [])] };
    await storageSetJSON(`customer:${customer.id}`, updated, true);
    if (wasFirstPolicy) await createEmpfehlungsTask(updated);
    await loadCustomers();
  };

  const saveQuickLead = async (data) => {
    const id = uid();
    const record = { id, ...data, vertraege: [], quotes: [], antraege: [], boote: [] };
    await storageSetJSON(`customer:${id}`, record, true);
    await loadCustomers();
    setShowQuickLead(false);
    setQuickLeadMsg(`„${fullName(record)}" als Lead erfasst.`);
    setTimeout(() => setQuickLeadMsg(""), 3000);
  };

  const filtered = customers.filter((c) =>
    (fullName(c).toLowerCase().includes(search.toLowerCase()) ||
    (c.bootsname || "").toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === "alle" || (statusFilter === "kein" ? !c.status : c.status === statusFilter))
  );

  if (view.mode === "form") {
    return (
      <CustomerForm
        initial={view.data}
        onCancel={() => setView(view.data?.id ? { mode: "detail", id: view.data.id } : { mode: "list" })}
        onSave={saveCustomer}
        partners={partners}
      />
    );
  }

  if (view.mode === "detail") {
    const customer = customers.find((c) => c.id === view.id);
    if (!customer) { setView({ mode: "list" }); return null; }
    return (
      <CustomerDetail
        customer={customer}
        onBack={() => setView({ mode: "list" })}
        onEdit={(c) => setView({ mode: "form", data: c })}
        onDelete={deleteCustomer}
        onStatusChange={changeStatus}
        partners={partners}
        onSaveBoat={saveBoat}
        onDeleteBoat={deleteBoat}
        onAddVertrag={addVertrag}
        onCustomersChanged={loadCustomers}
        onAddHistorie={addHistorie}
      />
    );
  }

  return (
    <div className="panel">
      <ZielTracker customers={customers} />
      <div className="pipeline-bar">
        {[
          { key: "alle", label: "Alle", count: customers.length },
          { key: "kein", label: "Ohne Status", count: customers.filter((c) => !c.status).length },
          ...STATUS_OPTIONS.map((s) => ({ key: s.key, label: s.label, count: customers.filter((c) => c.status === s.key).length, color: s.color })),
        ].map((s) => (
          <button
            key={s.key}
            type="button"
            className={`pipeline-chip ${statusFilter === s.key ? "pipeline-chip--active" : ""}`}
            style={s.color ? { "--chip-color": s.color } : undefined}
            onClick={() => setStatusFilter(s.key)}
          >
            <span className="pipeline-chip-count">{s.count}</span>
            <span className="pipeline-chip-label">{s.label}</span>
          </button>
        ))}
      </div>
      <div className="list-head">
        <div className="search-box">
          <Search size={15} />
          <input placeholder="Kunde oder Boot suchen…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn" onClick={() => setShowQuickLead((s) => !s)}><Plus size={15} /> Schnell-Lead</button>
        <button className="btn btn--primary" onClick={() => setView({ mode: "form" })}><Plus size={15} /> Neuer Kunde</button>
      </div>
      {quickLeadMsg && <div className="save-confirm" style={{ marginBottom: 12 }}><Check size={14} /> {quickLeadMsg}</div>}
      {showQuickLead && <QuickLeadForm onCancel={() => setShowQuickLead(false)} onSave={saveQuickLead} />}

      {loading ? (
        <div className="uploading"><Loader2 size={14} className="spin" /> Kunden werden geladen…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Anchor size={28} />
          <p>{customers.length === 0 ? "Noch keine Kunden angelegt." : "Keine Treffer."}</p>
        </div>
      ) : (
        <div className="customer-list">
          {filtered.map((c) => (
            <button key={c.id} className="customer-row" onClick={() => setView({ mode: "detail", id: c.id })}>
              <div className="customer-row-main">
                <span className="customer-row-name">{fullName(c)}</span>
                <span className="customer-row-sub">{boatsSubtitle(c)}</span>
              </div>
              <StatusBadge status={c.status} />
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===================== Import-Tab (aus Mail/Zwischenablage) ===================== */
function ImportTab() {
  const [rawText, setRawText] = useState("");
  const [items, setItems] = useState([]); // [{ tempId, data, candidates, choice, status, saving, done, error }]
  const [parseError, setParseError] = useState("");
  const [bulkRunning, setBulkRunning] = useState(false);

  const analyze = async () => {
    setParseError("");
    let data;
    try {
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/) || rawText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      data = JSON.parse(jsonMatch ? jsonMatch[1] : rawText);
    } catch (e) {
      setParseError("Konnte den Text nicht als JSON lesen. Bitte den kompletten Block (inkl. { } bzw. [ ]) einfügen.");
      setItems([]);
      return;
    }
    const list = Array.isArray(data) ? data : [data];
    try {
      const listing = await window.storage.list("customer:", true);
      const keys = listing?.keys || [];
      const all = [];
      for (const k of keys) {
        const c = await storageGetJSON(k, true);
        if (c) all.push(c);
      }
      const built = list.map((entry) => {
        const m = findCustomerMatches(all, { name: entry.name, vorname: entry.vorname, nachname: entry.nachname, titel: entry.titel, adresse: entry.adresse });
        return {
          tempId: uid(), data: entry, candidates: m,
          choice: m.exact ? m.exact.id : "neu",
          status: entry.status || "polizze",
          saving: false, done: null, error: "",
        };
      });
      setItems(built);
    } catch (e) {
      setItems(list.map((entry) => ({
        tempId: uid(), data: entry, candidates: { exact: null, possible: [] },
        choice: "neu", status: entry.status || "polizze", saving: false, done: null, error: "",
      })));
    }
  };

  const updateItem = (tempId, patch) => setItems((its) => its.map((it) => (it.tempId === tempId ? { ...it, ...patch } : it)));

  const importOne = async (item) => {
    updateItem(item.tempId, { saving: true, error: "" });
    try {
      const parsed = item.data;
      const parsedSplit = (parsed.vorname || parsed.nachname) ? null : splitFullName(parsed.name || "");
      const parsedTitel = parsed.titel ?? parsedSplit?.titel ?? "";
      const parsedVorname = parsed.vorname ?? parsedSplit?.vorname ?? "";
      const parsedNachname = parsed.nachname ?? parsedSplit?.nachname ?? (parsed.name || "Unbekannt");
      let customerId = item.choice !== "neu" ? item.choice : uid();
      let record;
      // Neuer Vertrag (falls mitgeliefert) wird IMMER angehängt, nie überschrieben —
      // ein Kunde kann mehrere Policen/Sparten über die Zeit ansammeln.
      const newVertrag = parsed.vertrag ? { id: uid(), erstellt: new Date().toISOString(), ...parsed.vertrag } : null;
      let previousStatus = null;
      if (item.choice !== "neu") {
        const existing = await storageGetJSON(`customer:${item.choice}`, true);
        previousStatus = existing?.status || null;
        record = {
          ...existing,
          titel: existing.titel || parsedTitel,
          vorname: existing.vorname || parsedVorname,
          nachname: existing.nachname || parsedNachname,
          adresse: existing.adresse || parsed.adresse || "",
          geburtsdatum: existing.geburtsdatum || parsed.geburtsdatum || "",
          email: existing.email || parsed.email || "",
          telefon: existing.telefon || parsed.telefon || "",
          bootsname: existing.bootsname || parsed.bootsname || "",
          bootstyp: existing.bootstyp || parsed.bootstyp || "Motorboot",
          status: item.status || existing.status,
          risiko: { ...(existing.risiko || {}), ...(parsed.risiko || {}) },
          vertraege: newVertrag ? [...(existing.vertraege || []), newVertrag] : (existing.vertraege || []),
          notizen: parsed.notizen ? `${existing.notizen ? existing.notizen + "\n" : ""}${parsed.notizen}` : existing.notizen,
        };
      } else {
        record = {
          id: customerId, titel: parsedTitel, vorname: parsedVorname, nachname: parsedNachname, adresse: parsed.adresse || "",
          geburtsdatum: parsed.geburtsdatum || "", email: parsed.email || "", telefon: parsed.telefon || "",
          bootsname: parsed.bootsname || "", bootstyp: parsed.bootstyp || "Motorboot",
          status: item.status || "", risiko: parsed.risiko || {}, vertraege: newVertrag ? [newVertrag] : [],
          notizen: parsed.notizen || "", quotes: [], antraege: [],
        };
      }
      await storageSetJSON(`customer:${customerId}`, record, true);
      if (record.status === "offert" && previousStatus !== "offert") await createOffertTasks(record);

      if (parsed.dokument?.dataBase64) {
        const docId = uid();
        await storageSetJSON(`doc:${customerId}:${docId}`, {
          id: docId, customerId, filename: parsed.dokument.filename || "Polizze.pdf",
          mimeType: parsed.dokument.mimeType || "application/pdf",
          size: Math.round((parsed.dokument.dataBase64.length * 3) / 4),
          uploadedAt: new Date().toISOString(), dataBase64: parsed.dokument.dataBase64,
        }, true);
      }
      updateItem(item.tempId, { saving: false, done: { customerId, name: fullName(record), isNew: item.choice === "neu" } });
    } catch (e) {
      updateItem(item.tempId, { saving: false, error: "Import fehlgeschlagen: " + (e?.message || "unbekannter Fehler") });
    }
  };

  const importAll = async () => {
    setBulkRunning(true);
    for (const item of items) {
      if (!item.done) {
        await importOne(item);
        await new Promise((r) => setTimeout(r, 250)); // kleine Pause zwischen den Speichervorgängen
      }
    }
    setBulkRunning(false);
  };

  const pendingCount = items.filter((it) => !it.done).length;

  return (
    <div className="panel">
      <h2 className="panel-title"><Mail size={18} /> Aus Mail importieren</h2>
      <p className="import-hint">
        Text (JSON, ein Objekt oder eine Liste mehrerer Objekte in [ ]) von Claude hier einfügen — z. B. Kundendaten + Polizze/Antrag/Offert aus Outlook-Mails. Kunden werden anhand von Name UND Adresse mit bestehenden Einträgen abgeglichen.
      </p>
      <textarea className="import-textarea" rows={8} placeholder="Hier einfügen…" value={rawText} onChange={(e) => setRawText(e.target.value)} />
      <div className="form-actions" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="btn btn--primary" onClick={analyze} disabled={!rawText.trim()}>Analysieren</button>
      </div>

      {parseError && <div className="warnbox" style={{ marginTop: 12 }}><AlertTriangle size={15} /> {parseError}</div>}

      {items.length > 0 && (
        <div className="import-review">
          <div className="import-batch-head">
            <h3 className="panel-subtitle" style={{ marginTop: 18 }}>{items.length > 1 ? `${items.length} Einträge erkannt` : "Erkannt"}</h3>
            {items.length > 1 && (
              <button className="btn btn--primary" onClick={importAll} disabled={bulkRunning || pendingCount === 0}>
                {bulkRunning ? <Loader2 size={14} className="spin" /> : <Check size={14} />} Alle übernehmen ({pendingCount})
              </button>
            )}
          </div>

          {items.map((item) => (
            <div key={item.tempId} className={`import-item ${item.done ? "import-item--done" : ""}`}>
              <div className="detail-grid" style={{ marginBottom: 8 }}>
                <div><span className="detail-label">Name</span><span>{fullName(item.data) || item.data.name || "—"}</span></div>
                <div><span className="detail-label">Adresse</span><span>{item.data.adresse || "—"}</span></div>
                {item.data.bootsname && <div><span className="detail-label">Boot</span><span>{item.data.bootsname}</span></div>}
                {item.data.vertrag?.versicherer && <div><span className="detail-label">Versicherer</span><span>{item.data.vertrag.versicherer}</span></div>}
                {item.data.vertrag?.sparten?.length > 0 && <div><span className="detail-label">Sparten</span><span>{item.data.vertrag.sparten.map((s) => s.sparte).join(", ")}</span></div>}
              </div>

              {item.candidates.exact && !item.done && (
                <div className="warnbox" style={{ background: "rgba(28,107,95,0.1)", color: "var(--sea)" }}>
                  <Check size={15} /> Übereinstimmung (Name + Adresse): <strong>&nbsp;{fullName(item.candidates.exact)}</strong> — wird aktualisiert.
                </div>
              )}
              {!item.candidates.exact && item.candidates.possible.length > 0 && !item.done && (
                <div className="warnbox"><AlertTriangle size={15} /> Möglicher Treffer nur bei Name ODER Adresse — bitte prüfen.</div>
              )}
              {item.error && <div className="warnbox"><AlertTriangle size={15} /> {item.error}</div>}

              {!item.done ? (
                <>
                  <div className="field-grid">
                    <Field label="Kunde">
                      <select value={item.choice} onChange={(e) => updateItem(item.tempId, { choice: e.target.value })}>
                        <option value="neu">Neuen Kunden anlegen</option>
                        {(item.candidates.exact ? [item.candidates.exact] : item.candidates.possible).map((c) => (
                          <option key={c.id} value={c.id}>Verknüpfen mit: {fullName(c)}{c.adresse ? ` (${c.adresse})` : ""}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Status setzen">
                      <select value={item.status} onChange={(e) => updateItem(item.tempId, { status: e.target.value })}>
                        <option value="">— kein Status —</option>
                        {STATUS_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="form-actions" style={{ justifyContent: "flex-start" }}>
                    <button className="btn btn--primary" onClick={() => importOne(item)} disabled={item.saving}>
                      {item.saving ? <Loader2 size={14} className="spin" /> : <Check size={14} />} Übernehmen
                    </button>
                  </div>
                </>
              ) : (
                <div className="save-confirm"><Check size={14} /> {item.done.isNew ? "Neuer Kunde angelegt" : "Kunde aktualisiert"}: {item.done.name}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===================== NAUTIMA-Antrag Tab ===================== */
function Section({ id, title, icon, subtitle, children, open, onToggle }) {
  return (
    <section className="section">
      <button type="button" className="section-head" onClick={() => onToggle(id)}>
        <span className="section-head-left">
          {icon}
          <span>
            <span className="section-title">{title}</span>
            {subtitle && <span className="section-subtitle">{subtitle}</span>}
          </span>
        </span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && <div className="section-body">{children}</div>}
    </section>
  );
}

function NautimaAntragTab({ customers, prefill, onCustomersChanged }) {
  const [openSections, setOpenSections] = useState({ vn: true });
  const toggle = (id) => setOpenSections((s) => ({ ...s, [id]: !s[id] }));
  const [prefillId, setPrefillId] = useState("");
  // Wird diese Maske für genau einen bestimmten Kunden eingebettet (z. B. "Nächster Schritt"
  // direkt in der Kundendetailansicht), diesen Kunden automatisch als Ziel für Speichern setzen —
  // sonst würde bei fehlender Adresse ein Duplikat statt eines Updates entstehen.
  useEffect(() => {
    if (customers?.length === 1 && !prefillId) setPrefillId(customers[0].id);
  }, [customers]); // eslint-disable-line

  // ---- Versicherungsnehmer & Vertrag ----
  const [anrede, setAnrede] = useState("Herr");
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [strasse, setStrasse] = useState("");
  const [plzOrt, setPlzOrt] = useState("");
  const [beginn, setBeginn] = useState("");
  const [ablauf, setAblauf] = useState("");
  const [zahlungsweise, setZahlungsweise] = useState("1");

  // ---- Vorversicherungen ----
  const [vorvers, setVorvers] = useState({
    kasko: { besteht: false, versicherer: "", vertragsnr: "", gekuendigt: false },
    haftpflicht: { besteht: false, versicherer: "", vertragsnr: "", gekuendigt: false },
    unfall: { besteht: false, versicherer: "", vertragsnr: "", gekuendigt: false },
  });

  // ---- Vorschäden ----
  const [schadenfreiSeit, setSchadenfreiSeit] = useState("");
  const [vorschaedenVorhanden, setVorschaedenVorhanden] = useState(false);
  const [vorschaedenZeilen, setVorschaedenZeilen] = useState([{ id: uid(), jahr: "", art: "" }]);

  // ---- Eigner & Nutzung ----
  const [istEigner, setIstEigner] = useState(true);
  const [eignerWer, setEignerWer] = useState("");
  const [eignergemeinschaft, setEignergemeinschaft] = useState(false);
  const [vertretungsberechtigter, setVertretungsberechtigter] = useState("");
  const [verchartert, setVerchartert] = useState("nein"); // nein | mit | ohne
  const [liegeplatzSommer, setLiegeplatzSommer] = useState("");
  const [liegeplatzWinter, setLiegeplatzWinter] = useState("");

  // ---- Fahrzeug ----
  const [fahrzeugart, setFahrzeugart] = useState("SegelbootYacht"); // SegelbootYacht | MotorbootYacht | Schlauchboot
  const [mehrrumpf, setMehrrumpf] = useState(false);
  const [segelflaeche, setSegelflaeche] = useState("");
  const [motorbootTyp, setMotorbootTyp] = useState("Verdraenger"); // Verdraenger | Gleiter | Sonstige
  const [festrumpf, setFestrumpf] = useState("mit");
  const [eigenbau, setEigenbau] = useState(false);
  const [bootsname, setBootsname] = useState("");
  const [hersteller, setHersteller] = useState("");
  const [modell, setModell] = useState("");
  const [baujahr, setBaujahr] = useState(2018);
  const [rumpfnr, setRumpfnr] = useState("");
  const [laengeM, setLaengeM] = useState("");
  const [laengeFt, setLaengeFt] = useState("");
  const [flagge, setFlagge] = useState("Österreich");
  const [register, setRegister] = useState("");
  const [material, setMaterial] = useState("GFK");

  // ---- Motoren ----
  const [motoren, setMotoren] = useState([
    { id: uid(), art: "Aussenborder", elektro: false, hersteller: "", nr: "", baujahr: "", kw: "" },
  ]);
  const [hoechstgeschw80, setHoechstgeschw80] = useState(false);
  const [antrieb, setAntrieb] = useState(""); // "" | Z | Wellen | Jet | IPS

  // ---- Beiboot / Trailer ----
  const [beiboot, setBeiboot] = useState({ vorhanden: false, hersteller: "", baujahr: "" });
  const [trailer, setTrailer] = useState({ vorhanden: false, hersteller: "", fahrgestellnr: "" });

  // ---- A Kasko ----
  const [kaskoAnwenden, setKaskoAnwenden] = useState(true);
  const [zone, setZone] = useState("nordost");
  const [wertFahrzeug, setWertFahrzeug] = useState(80000);
  const [wertAM1, setWertAM1] = useState(0);
  const [wertAM2, setWertAM2] = useState(0);
  const [wertHilfsAM, setWertHilfsAM] = useState(0);
  const [wertBeiboot, setWertBeiboot] = useState(0);
  const [wertTrailer, setWertTrailer] = useState(0);
  const [sfr, setSfr] = useState("neu");
  const [persEffekten, setPersEffekten] = useState(0);
  const [kaskoSteuerAndere, setKaskoSteuerAndere] = useState(false);
  const [kaskoSteuersatz, setKaskoSteuersatz] = useState(19);

  // ---- B Haftpflicht ----
  const [hpAnwenden, setHpAnwenden] = useState(true);
  const [hpVS, setHpVS] = useState(1); // 0..3 -> VS1..VS4
  const [sicherheitsleistung, setSicherheitsleistung] = useState(false);
  const [hpSteuerAndere, setHpSteuerAndere] = useState(false);
  const [hpSteuersatz, setHpSteuersatz] = useState(19);

  // ---- C Unfall ----
  const [unfallAnwenden, setUnfallAnwenden] = useState(false);
  const [variante, setVariante] = useState("KOMFORT");
  const [unfallSteuerAndere, setUnfallSteuerAndere] = useState(false);
  const [unfallSteuersatz, setUnfallSteuersatz] = useState(19);

  // ---- Zahlung / Abschluss ----
  const [zahlungsart, setZahlungsart] = useState("Makler"); // Makler | Direkt | Lastschrift | Rechnung
  const [ort, setOrt] = useState("");
  const [datum, setDatum] = useState("");
  const [besondere1, setBesondere1] = useState("");
  const [besondere2, setBesondere2] = useState("");
  const [sepaGleichAntragsteller, setSepaGleichAntragsteller] = useState(true);
  const [sepaKreditinstitut, setSepaKreditinstitut] = useState("");
  const [sepaBic, setSepaBic] = useState("");
  const [sepaIban, setSepaIban] = useState("");

  const bootstyp = fahrzeugart === "SegelbootYacht" ? "segelboot" : "motorboot";

  const applyPrefill = (customerId) => {
    setPrefillId(customerId);
    const c = customers.find((cc) => cc.id === customerId);
    if (!c) return;
    const fn = fullName(c);
    if (fn) setName1(fn);
    if (c.adresse) {
      const parts = c.adresse.split(",");
      setStrasse((parts[0] || "").trim());
      setPlzOrt((parts.slice(1).join(",") || "").trim());
    }
    if (c.bootsname) setBootsname(c.bootsname);
    const r = c.risiko || {};
    if (r.bootstyp === "Segelboot") setFahrzeugart("SegelbootYacht");
    else if (r.bootstyp === "Motorboot") setFahrzeugart("MotorbootYacht");
    if (r.hersteller) setHersteller(r.hersteller);
    if (r.modell) setModell(r.modell);
    if (r.baujahr) setBaujahr(Number(r.baujahr) || thisYear);
    if (r.segelflaeche) setSegelflaeche(r.segelflaeche);
    if (r.rumpfmaterial) setMaterial(r.rumpfmaterial);
    const letzterVertrag = c.vertraege?.[c.vertraege.length - 1];
    const kaskoSparte = letzterVertrag?.sparten?.find((s) => s.sparte === "Kasko");
    if (kaskoSparte?.versicherungssumme) setWertFahrzeug(kaskoSparte.versicherungssumme);
    if (kaskoSparte?.selbstbehalt) setSelbstbehalt(kaskoSparte.selbstbehalt);
  };

  // Übernahme aus dem Prämienrechner (Button dort: "Antrag erstellen")
  useEffect(() => {
    if (!prefill) return;
    setFahrzeugart(prefill.bootstyp === "segelboot" ? "SegelbootYacht" : "MotorbootYacht");
    if (prefill.baujahr) setBaujahr(prefill.baujahr);
    if (prefill.versicherungssumme) setWertFahrzeug(prefill.versicherungssumme);
    if (prefill.zone) setZone(prefill.zone);
    if (prefill.motorkw) setMotoren((ms) => [{ ...ms[0], kw: prefill.motorkw }, ...ms.slice(1)]);
    if (prefill.segelflaeche) setSegelflaeche(prefill.segelflaeche);
    if (prefill.selbstbehalt) setSelbstbehalt(prefill.selbstbehalt);
    if (prefill.charter) setVerchartert(prefill.charter);
    if (prefill.name1) setName1(prefill.name1);
    if (prefill.strasse) setStrasse(prefill.strasse);
    if (prefill.plzOrt) setPlzOrt(prefill.plzOrt);
    setOpenSections((s) => ({ ...s, vn: true, kasko: true, hp: true }));
  }, [prefill]); // eslint-disable-line

  const bracket = useMemo(
    () => findNautimaVSBracket(NAUTIMA_KASKO[bootstyp], Number(wertFahrzeug) || 0),
    [bootstyp, wertFahrzeug]
  );
  const zoneTable = ZONEN.find((z) => z.key === zone)?.table || "binnen";
  const sbOptions = useMemo(() => nautimaAvailableSB(bracket, zoneTable), [bracket, zoneTable]);
  const [selbstbehalt, setSelbstbehalt] = useState(500);
  useEffect(() => {
    if (sbOptions.length && !sbOptions.includes(selbstbehalt)) setSelbstbehalt(sbOptions[0]);
  }, [sbOptions]); // eslint-disable-line

  // ---- Live-Berechnung Kasko ----
  const kaskoCalc = useMemo(() => {
    const werte = [wertFahrzeug, wertAM1, wertAM2, wertHilfsAM, wertBeiboot, wertTrailer].map((v) => Number(v) || 0);
    const summe = werte.reduce((a, b) => a + b, 0);
    const rate = nautimaRate(bracket, zoneTable, selbstbehalt);
    if (rate == null) return { ok: false, summe };
    const grundbeitrag = summe * rate;
    const sfrSatz = SFR_OPTIONEN.find((s) => s.key === sfr)?.satz ?? 0;
    const sfrAbzug = grundbeitrag * sfrSatz;
    const beitragNachSfr = Math.max(grundbeitrag - sfrAbzug, NAUTIMA_KASKO_MINDEST);
    const effektenBeitrag = (Number(persEffekten) || 0) * 0.01;
    const zwischensumme = beitragNachSfr + effektenBeitrag;
    const steuersatz = (kaskoSteuerAndere ? Number(kaskoSteuersatz) : 19) / 100;
    const steuer = zwischensumme * steuersatz;
    const gesamt = zwischensumme + steuer;
    return { ok: true, werte, summe, rate, grundbeitrag, sfrSatz, sfrAbzug, beitragNachSfr, effektenBeitrag, zwischensumme, steuer, gesamt };
  }, [wertFahrzeug, wertAM1, wertAM2, wertHilfsAM, wertBeiboot, wertTrailer, bracket, zoneTable, selbstbehalt, sfr, persEffekten, kaskoSteuerAndere, kaskoSteuersatz]);

  // ---- Live-Berechnung Haftpflicht ----
  const hpMitVermietung = verchartert !== "nein";
  const hpCalc = useMemo(() => {
    let basis = null, quelle = "";
    if (bootstyp === "motorboot") {
      const kw = motoren.reduce((sum, m) => sum + (Number(m.kw) || 0), 0);
      const b = findNautimaHPBracketKW(NAUTIMA_HP_MOTOR[hpMitVermietung ? "mit" : "ohne"], kw);
      if (b) { basis = b.v[hpVS]; quelle = `bis ${b.maxKW} kW`; }
    } else {
      const b = findNautimaHPBracketM2(NAUTIMA_HP_SEGEL[hpMitVermietung ? "mit" : "ohne"], Number(segelflaeche) || 0);
      if (b) { basis = b.v[hpVS]; quelle = `bis ${b.maxM2} m²`; }
    }
    if (basis == null) return { ok: false };
    const sicherheitsleistungBetrag = sicherheitsleistung ? NAUTIMA_SICHERHEITSLEISTUNG_BEITRAG : 0;
    const zwischensumme = Math.max(basis, NAUTIMA_HP_MINDEST) + sicherheitsleistungBetrag;
    const steuersatz = (hpSteuerAndere ? Number(hpSteuersatz) : 19) / 100;
    const steuer = zwischensumme * steuersatz;
    return { ok: true, basis, quelle, sicherheitsleistungBetrag, zwischensumme, steuer, gesamt: zwischensumme + steuer };
  }, [bootstyp, motoren, segelflaeche, hpMitVermietung, hpVS, sicherheitsleistung, hpSteuerAndere, hpSteuersatz]);

  const unfallBeitrag = NAUTIMA_INSASSENUNFALL[variante];
  const unfallCalc = useMemo(() => {
    const steuersatz = (unfallSteuerAndere ? Number(unfallSteuersatz) : 19) / 100;
    const steuer = unfallBeitrag * steuersatz;
    return { zwischensumme: unfallBeitrag, steuer, gesamt: unfallBeitrag + steuer };
  }, [unfallBeitrag, unfallSteuerAndere, unfallSteuersatz]);

  const gesamtACGesamt =
    (kaskoAnwenden && kaskoCalc.ok ? kaskoCalc.gesamt : 0) +
    (hpAnwenden && hpCalc.ok ? hpCalc.gesamt : 0) +
    (unfallAnwenden ? unfallCalc.gesamt : 0);

  // ---- Motoren-Handling ----
  const updateMotor = (id, patch) => setMotoren((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const addMotor = () => { if (motoren.length < 2) setMotoren((ms) => [...ms, { id: uid(), art: "Aussenborder", elektro: false, hersteller: "", nr: "", baujahr: "", kw: "" }]); };
  const removeMotor = (id) => setMotoren((ms) => ms.filter((m) => m.id !== id));

  const addVorschadenZeile = () => { if (vorschaedenZeilen.length < 3) setVorschaedenZeilen((z) => [...z, { id: uid(), jahr: "", art: "" }]); };
  const updateVorschadenZeile = (id, patch) => setVorschaedenZeilen((z) => z.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeVorschadenZeile = (id) => setVorschaedenZeilen((z) => z.filter((r) => r.id !== id));

  const [outputText, setOutputText] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [saveError, setSaveError] = useState("");
  const canSubmit = name1.trim().length > 0;

  const saveToCustomer = async (fullPayload) => {
    if (!name1.trim()) return null;
    const risikoBootstyp = fahrzeugart === "SegelbootYacht" ? "Segelboot" : "Motorboot";
    const risiko = {
      bootstyp: risikoBootstyp, hersteller, modell, baujahr: String(baujahr),
      fahrtgebiet: ZONEN.find((z) => z.key === zone)?.label || zone,
      charter: verchartert === "nein" ? "Nein" : verchartert === "mit" ? "Ja, mit Skipper" : "Ja, ohne Skipper",
    };
    if (fahrzeugart === "SegelbootYacht") risiko.segelflaeche = String(segelflaeche);
    else risiko.motorleistungKW = String(motoren.reduce((s, m) => s + (Number(m.kw) || 0), 0));

    const quote = {
      id: uid(), erstellt: new Date().toISOString(), quelle: "NAUTIMA-Antrag",
      bootstyp: risikoBootstyp === "Segelboot" ? "segelboot" : "motorboot",
      baujahr, versicherungssumme: wertFahrzeug, nautima: gesamtACGesamt,
    };
    const antrag = { id: uid(), erstellt: new Date().toISOString(), typ: "NAUTIMA-Antrag", daten: fullPayload };
    const adresse = [strasse, plzOrt].filter(Boolean).join(", ");
    const namensplit = splitFullName(name1);

    let customerId = prefillId;
    let existing = customerId ? await storageGetJSON(`customer:${customerId}`, true) : null;
    if (!existing) {
      try {
        const listing = await window.storage.list("customer:", true);
        const all = [];
        for (const k of listing?.keys || []) { const c = await storageGetJSON(k, true); if (c) all.push(c); }
        const m = findCustomerMatches(all, { name: name1, adresse });
        if (m.exact) { existing = m.exact; customerId = m.exact.id; }
      } catch (e) {}
    }
    if (!customerId) customerId = uid();

    const record = existing ? {
      ...existing,
      adresse: existing.adresse || adresse,
      bootsname: existing.bootsname || bootsname,
      bootstyp: existing.bootstyp || risikoBootstyp,
      status: existing.status || "antrag",
      risiko: { ...(existing.risiko || {}), ...risiko },
      quotes: [quote, ...(existing.quotes || [])].slice(0, 20),
      antraege: [antrag, ...(existing.antraege || [])].slice(0, 10),
      historie: [{ id: uid(), datum: new Date().toISOString(), typ: "Sonstiges", text: `NAUTIMA-Antrag erstellt (${euro(gesamtACGesamt)}/Jahr)`, system: true }, ...(existing.historie || [])],
    } : {
      id: customerId, titel: namensplit.titel, vorname: namensplit.vorname, nachname: namensplit.nachname,
      adresse, geburtsdatum: "", email: "", telefon: "",
      bootsname, bootstyp: risikoBootstyp, status: "antrag",
      risiko, vertraege: [], notizen: "", quotes: [quote], antraege: [antrag],
      historie: [{ id: uid(), datum: new Date().toISOString(), typ: "Sonstiges", text: `NAUTIMA-Antrag erstellt (${euro(gesamtACGesamt)}/Jahr)`, system: true }],
    };
    await storageSetJSON(`customer:${customerId}`, record, true);
    if (onCustomersChanged) await onCustomersChanged();
    return fullName(record);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaveError("");
    const payload = {
      versicherungsnehmer: { anrede, name1, name2, strasse, plzOrt },
      vertrag: { beginn, ablauf, zahlungsweise },
      vorversicherungen: vorvers,
      vorschaeden: { schadenfreiSeit, vorhanden: vorschaedenVorhanden, zeilen: vorschaedenZeilen.map(({ jahr, art }) => ({ jahr, art })) },
      eigner: { istEigner, eignerWer, eignergemeinschaft, vertretungsberechtigter },
      nutzung: { verchartert, liegeplatzSommer, liegeplatzWinter },
      fahrzeug: {
        fahrzeugart, mehrrumpf, segelflaeche, motorbootTyp, festrumpf, eigenbau,
        name: bootsname, hersteller, modell, baujahr, rumpfnr, laengeM, laengeFt, flagge, register, material,
      },
      motoren: motoren.map(({ art, elektro, hersteller, nr, baujahr, kw }) => ({ art, elektro, hersteller, nr, baujahr, kw })),
      hoechstgeschw80, antrieb,
      beiboot, trailer,
      kasko: kaskoAnwenden ? {
        anwenden: true, zone,
        werte: { fahrzeug: wertFahrzeug, am1: wertAM1, am2: wertAM2, hilfsAM: wertHilfsAM, beiboot: wertBeiboot, trailer: wertTrailer },
        selbstbehalt, beitragssatzProzent: kaskoCalc.ok ? kaskoCalc.rate * 100 : null,
        sfrKey: sfr, sfrProzent: kaskoCalc.ok ? kaskoCalc.sfrSatz * 100 : null,
        persoenlicheEffekten: persEffekten,
        berechnung: kaskoCalc,
        steuersatz: kaskoSteuerAndere ? kaskoSteuersatz : 19, steuerAndere: kaskoSteuerAndere,
      } : { anwenden: false },
      haftpflicht: hpAnwenden ? {
        anwenden: true, deckungssummeIndex: hpVS, sicherheitsleistungAusland: sicherheitsleistung,
        berechnung: hpCalc, steuersatz: hpSteuerAndere ? hpSteuersatz : 19, steuerAndere: hpSteuerAndere,
      } : { anwenden: false },
      unfall: unfallAnwenden ? {
        anwenden: true, variante, berechnung: unfallCalc,
        steuersatz: unfallSteuerAndere ? unfallSteuersatz : 19, steuerAndere: unfallSteuerAndere,
      } : { anwenden: false },
      gesamtbeitragAC: gesamtACGesamt,
      zahlungsart,
      besondereVereinbarungen: [besondere1, besondere2].filter(Boolean),
      sepa: zahlungsart === "Lastschrift" ? {
        gleichAntragsteller: sepaGleichAntragsteller, kreditinstitut: sepaKreditinstitut, bic: sepaBic, iban: sepaIban,
      } : null,
      ortDatum: { ort, datum },
    };
    const text = "NAUTIMA-ANTRAGSDATEN — bitte das Original-PDF damit befüllen:\n```json\n" + JSON.stringify(payload, null, 2) + "\n```";
    setOutputText(text);
    setCopied(false);
    try {
      const savedName = await saveToCustomer(payload);
      if (savedName) {
        setSavedMsg(`Bei Kunde „${savedName}“ hinterlegt: Boot, Berechnung und alle Antragsdaten.`);
        setTimeout(() => setSavedMsg(""), 4000);
      }
    } catch (e) {
      setSaveError(`Kunde konnte nicht gespeichert werden: ${e?.message || "unbekannter Fehler"}. Antragsdaten unten sind trotzdem vollständig.`);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
    } catch (e) {
      setCopied(false);
    }
  };

  return (
    <div className="form-tab">
      <div className="info-banner info-banner--inline">
        <Info size={14} />
        <span>Absender- und Vermittlerdaten sind im Original-PDF bereits hinterlegt. Am Ende: Zusammenfassung erzeugen, Text kopieren und hier im Chat einfügen — daraus entsteht das ausgefüllte NAUTIMA-PDF.</span>
      </div>

      {customers.length > 0 && (
        <div className="panel">
          <Field label="Daten aus bestehendem Kunden übernehmen (optional)">
            <select value={prefillId} onChange={(e) => applyPrefill(e.target.value)}>
              <option value="">— manuell ausfüllen —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{fullName(c)}</option>)}
            </select>
          </Field>
        </div>
      )}

        <Section id="vn" title="Versicherungsnehmer" icon={<Anchor size={16} />} open={!!openSections.vn} onToggle={toggle}>
          <div className="field-grid">
            <Field label="Anrede">
              <RadioRow name="anrede" value={anrede} onChange={setAnrede} options={[{ value: "Herr", label: "Herr" }, { value: "Frau", label: "Frau" }, { value: "Firma", label: "Firma" }]} />
            </Field>
            <Field label="Name / Firma *"><input value={name1} onChange={(e) => setName1(e.target.value)} /></Field>
            <Field label="Name Zeile 2 (optional)"><input value={name2} onChange={(e) => setName2(e.target.value)} /></Field>
            <Field label="Straße/Hausnummer"><input value={strasse} onChange={(e) => setStrasse(e.target.value)} /></Field>
            <Field label="PLZ/Wohnort"><input value={plzOrt} onChange={(e) => setPlzOrt(e.target.value)} /></Field>
          </div>
          <h4 className="mini-title">Versicherungsdauer &amp; Zahlungsweise</h4>
          <div className="field-grid">
            <Field label="Beginn (0 Uhr)"><input type="date" value={beginn} onChange={(e) => setBeginn(e.target.value)} /></Field>
            <Field label="Ablauf (0 Uhr)"><input type="date" value={ablauf} onChange={(e) => setAblauf(e.target.value)} /></Field>
            <Field label="Zahlungsweise">
              <select value={zahlungsweise} onChange={(e) => setZahlungsweise(e.target.value)}>
                <option value="1">jährlich</option>
                <option value="2">halbjährlich (+3 %)</option>
                <option value="4">vierteljährlich (+5 %)</option>
                <option value="12">monatlich (+5 %)</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section id="vorvers" title="Vorversicherungen" icon={<FileCheck2 size={16} />} subtitle="optional" open={!!openSections.vorvers} onToggle={toggle}>
          {["kasko", "haftpflicht", "unfall"].map((k) => (
            <div key={k} className="subrow">
              <label className="checkbox-field"><input type="checkbox" checked={vorvers[k].besteht} onChange={(e) => setVorvers((v) => ({ ...v, [k]: { ...v[k], besteht: e.target.checked } }))} />Bestand/besteht bereits eine {k === "kasko" ? "Kasko" : k === "haftpflicht" ? "Haftpflicht" : "Unfall"}-Versicherung?</label>
              {vorvers[k].besteht && (
                <div className="field-grid">
                  <Field label="Versicherer"><input value={vorvers[k].versicherer} onChange={(e) => setVorvers((v) => ({ ...v, [k]: { ...v[k], versicherer: e.target.value } }))} /></Field>
                  <Field label="Vertrags-Nr."><input value={vorvers[k].vertragsnr} onChange={(e) => setVorvers((v) => ({ ...v, [k]: { ...v[k], vertragsnr: e.target.value } }))} /></Field>
                  <label className="checkbox-field"><input type="checkbox" checked={vorvers[k].gekuendigt} onChange={(e) => setVorvers((v) => ({ ...v, [k]: { ...v[k], gekuendigt: e.target.checked } }))} />vom Versicherer gekündigt</label>
                </div>
              )}
            </div>
          ))}
        </Section>

        <Section id="vorschaeden" title="Vorschäden" icon={<AlertTriangle size={16} />} open={!!openSections.vorschaeden} onToggle={toggle}>
          <div className="field-grid">
            <Field label="Antragsteller schadenfrei seit (Jahr)"><input value={schadenfreiSeit} onChange={(e) => setSchadenfreiSeit(e.target.value)} placeholder="z. B. 2021" /></Field>
          </div>
          <label className="checkbox-field"><input type="checkbox" checked={vorschaedenVorhanden} onChange={(e) => setVorschaedenVorhanden(e.target.checked)} />Schäden am Fahrzeug in den letzten 5 Jahren</label>
          {vorschaedenVorhanden && (
            <div className="repeat-list">
              {vorschaedenZeilen.map((r) => (
                <div key={r.id} className="repeat-row">
                  <input placeholder="Jahr" value={r.jahr} onChange={(e) => updateVorschadenZeile(r.id, { jahr: e.target.value })} style={{ maxWidth: 90 }} />
                  <input placeholder="Hauptteil (z. B. Rumpf, Rigg, Motor)" value={r.art} onChange={(e) => updateVorschadenZeile(r.id, { art: e.target.value })} />
                  <button type="button" className="icon-btn icon-btn--danger" onClick={() => removeVorschadenZeile(r.id)}><Trash2 size={14} /></button>
                </div>
              ))}
              {vorschaedenZeilen.length < 3 && <button type="button" className="btn btn--sm" onClick={addVorschadenZeile}><Plus size={13} /> Zeile</button>}
            </div>
          )}
        </Section>

        <Section id="eigner" title="Eigner &amp; Nutzung" icon={<Compass size={16} />} open={!!openSections.eigner} onToggle={toggle}>
          <label className="checkbox-field"><input type="checkbox" checked={istEigner} onChange={(e) => setIstEigner(e.target.checked)} />Antragsteller ist Eigner des Fahrzeugs</label>
          {!istEigner && <Field label="Wer ist Eigner, in welcher Eigenschaft beantragt?"><input value={eignerWer} onChange={(e) => setEignerWer(e.target.value)} /></Field>}
          <label className="checkbox-field"><input type="checkbox" checked={eignergemeinschaft} onChange={(e) => setEignergemeinschaft(e.target.checked)} />Es besteht eine Eignergemeinschaft</label>
          {eignergemeinschaft && <Field label="Vertretungsberechtigter"><input value={vertretungsberechtigter} onChange={(e) => setVertretungsberechtigter(e.target.value)} /></Field>}
          <h4 className="mini-title">Nutzung</h4>
          <RadioRow name="charter" value={verchartert} onChange={setVerchartert} options={[{ value: "nein", label: "Keine Vermietung" }, { value: "mit", label: "Vermietung mit Skipper" }, { value: "ohne", label: "Vermietung ohne Skipper" }]} />
          <div className="field-grid">
            <Field label="Liegeplatz Sommer (Land/PLZ/Anschrift/Marina)"><input value={liegeplatzSommer} onChange={(e) => setLiegeplatzSommer(e.target.value)} /></Field>
            <Field label="Liegeplatz Winter (Land/PLZ/Anschrift/Marina)"><input value={liegeplatzWinter} onChange={(e) => setLiegeplatzWinter(e.target.value)} /></Field>
          </div>
        </Section>

        <Section id="fahrzeug" title="Fahrzeug" icon={<Ship size={16} />} open={!!openSections.fahrzeug} onToggle={toggle}>
          <RadioRow name="fahrzeugart" value={fahrzeugart} onChange={setFahrzeugart} options={[{ value: "SegelbootYacht", label: "Segelboot/-yacht" }, { value: "MotorbootYacht", label: "Motorboot/-yacht" }, { value: "Schlauchboot", label: "Schlauchboot" }]} />
          <label className="checkbox-field"><input type="checkbox" checked={mehrrumpf} onChange={(e) => setMehrrumpf(e.target.checked)} />als Mehrrumpfboot/-yacht</label>
          {fahrzeugart === "SegelbootYacht" && <Field label="Segelfläche (m²)"><input type="number" value={segelflaeche} onChange={(e) => setSegelflaeche(e.target.value)} /></Field>}
          {fahrzeugart === "MotorbootYacht" && (
            <Field label="Bauart">
              <RadioRow name="motorbootTyp" value={motorbootTyp} onChange={setMotorbootTyp} options={[{ value: "Verdraenger", label: "Verdränger" }, { value: "Gleiter", label: "Gleiter" }, { value: "Sonstige", label: "Sonstige" }]} />
            </Field>
          )}
          {fahrzeugart === "Schlauchboot" && (
            <Field label="Rumpf">
              <RadioRow name="festrumpf" value={festrumpf} onChange={setFestrumpf} options={[{ value: "mit", label: "mit Festrumpf" }, { value: "ohne", label: "ohne Festrumpf" }]} />
            </Field>
          )}
          <label className="checkbox-field"><input type="checkbox" checked={eigenbau} onChange={(e) => setEigenbau(e.target.checked)} />Eigenbau</label>
          <div className="field-grid">
            <Field label="Bootsname"><input value={bootsname} onChange={(e) => setBootsname(e.target.value)} /></Field>
            <Field label="Hersteller"><input value={hersteller} onChange={(e) => setHersteller(e.target.value)} /></Field>
            <Field label="Modell"><input value={modell} onChange={(e) => setModell(e.target.value)} /></Field>
            <Field label="Baujahr"><input type="number" value={baujahr} onChange={(e) => setBaujahr(Number(e.target.value) || thisYear)} /></Field>
            <Field label="Rumpf-Nr."><input value={rumpfnr} onChange={(e) => setRumpfnr(e.target.value)} /></Field>
            <Field label="Bootslänge (m)"><input value={laengeM} onChange={(e) => setLaengeM(e.target.value)} /></Field>
            <Field label="Bootslänge (ft)"><input value={laengeFt} onChange={(e) => setLaengeFt(e.target.value)} /></Field>
            <Field label="Flagge"><input value={flagge} onChange={(e) => setFlagge(e.target.value)} /></Field>
            <Field label="Registerort/Register-Nr."><input value={register} onChange={(e) => setRegister(e.target.value)} /></Field>
            <Field label="Material/Rumpf"><input value={material} onChange={(e) => setMaterial(e.target.value)} /></Field>
          </div>
        </Section>

        <Section id="motor" title="Motor(en) &amp; Antrieb" icon={<Compass size={16} />} open={!!openSections.motor} onToggle={toggle}>
          {motoren.map((m, i) => (
            <div key={m.id} className="subrow">
              <div className="subrow-head">
                <span className="mini-title" style={{ margin: 0 }}>Motor {i + 1}</span>
                {motoren.length > 1 && <button type="button" className="icon-btn icon-btn--danger" onClick={() => removeMotor(m.id)}><Trash2 size={14} /></button>}
              </div>
              <RadioRow name={`motorart-${m.id}`} value={m.art} onChange={(v) => updateMotor(m.id, { art: v })} options={[{ value: "Innenborder", label: "Innenborder" }, { value: "Aussenborder", label: "Außenborder" }, { value: "Hilfsaussenborder", label: "Hilfsaußenborder" }]} />
              <label className="checkbox-field"><input type="checkbox" checked={m.elektro} onChange={(e) => updateMotor(m.id, { elektro: e.target.checked })} />Elektromotor</label>
              <div className="field-grid">
                <Field label="Hersteller"><input value={m.hersteller} onChange={(e) => updateMotor(m.id, { hersteller: e.target.value })} /></Field>
                <Field label="Motor-Nr."><input value={m.nr} onChange={(e) => updateMotor(m.id, { nr: e.target.value })} /></Field>
                <Field label="Baujahr"><input value={m.baujahr} onChange={(e) => updateMotor(m.id, { baujahr: e.target.value })} /></Field>
                <Field label="Leistung (kW)"><input type="number" value={m.kw} onChange={(e) => updateMotor(m.id, { kw: e.target.value })} /></Field>
              </div>
            </div>
          ))}
          {motoren.length < 2 && <button type="button" className="btn btn--sm" onClick={addMotor}><Plus size={13} /> zweiten Motor hinzufügen</button>}
          <label className="checkbox-field" style={{ marginTop: 10 }}><input type="checkbox" checked={hoechstgeschw80} onChange={(e) => setHoechstgeschw80(e.target.checked)} />Höchstgeschwindigkeit schneller als 80 km/h</label>
          <h4 className="mini-title">Antrieb (falls Z-/Wellen-/Jet-/IPS-Antrieb)</h4>
          <RadioRow name="antrieb" value={antrieb} onChange={setAntrieb} options={[{ value: "", label: "Keiner/Direktantrieb" }, { value: "Z", label: "Z-Antrieb" }, { value: "Wellen", label: "Wellenantrieb" }, { value: "Jet", label: "Jet-Antrieb" }, { value: "IPS", label: "IPS-Antrieb" }]} />
        </Section>

        <Section id="beiboottrailer" title="Beiboot &amp; Trailer" icon={<Anchor size={16} />} open={!!openSections.beiboottrailer} onToggle={toggle}>
          <label className="checkbox-field"><input type="checkbox" checked={beiboot.vorhanden} onChange={(e) => setBeiboot((b) => ({ ...b, vorhanden: e.target.checked }))} />Beiboot vorhanden</label>
          {beiboot.vorhanden && (
            <div className="field-grid">
              <Field label="Hersteller"><input value={beiboot.hersteller} onChange={(e) => setBeiboot((b) => ({ ...b, hersteller: e.target.value }))} /></Field>
              <Field label="Baujahr"><input value={beiboot.baujahr} onChange={(e) => setBeiboot((b) => ({ ...b, baujahr: e.target.value }))} /></Field>
            </div>
          )}
          <label className="checkbox-field"><input type="checkbox" checked={trailer.vorhanden} onChange={(e) => setTrailer((t) => ({ ...t, vorhanden: e.target.checked }))} />Trailer vorhanden</label>
          {trailer.vorhanden && (
            <div className="field-grid">
              <Field label="Hersteller"><input value={trailer.hersteller} onChange={(e) => setTrailer((t) => ({ ...t, hersteller: e.target.value }))} /></Field>
              <Field label="Fahrgestell-Nr."><input value={trailer.fahrgestellnr} onChange={(e) => setTrailer((t) => ({ ...t, fahrgestellnr: e.target.value }))} /></Field>
            </div>
          )}
        </Section>

        <Section id="kasko" title="A · Kaskoversicherung" icon={<FileCheck2 size={16} />} subtitle={kaskoAnwenden ? "wird beantragt" : "nicht beantragt"} open={!!openSections.kasko} onToggle={toggle}>
          <label className="checkbox-field"><input type="checkbox" checked={kaskoAnwenden} onChange={(e) => setKaskoAnwenden(e.target.checked)} />Kaskoversicherung beantragen</label>
          {kaskoAnwenden && (
            <>
              <Field label="Fahrtgebiet">
                <select value={zone} onChange={(e) => setZone(e.target.value)}>
                  {ZONEN.map((z) => <option key={z.key} value={z.key}>{z.label}</option>)}
                </select>
              </Field>
              <div className="field-grid">
                <Field label="Versicherungswert Fahrzeug (€)"><input type="number" value={wertFahrzeug} onChange={(e) => setWertFahrzeug(e.target.value)} /></Field>
                <Field label="Außenbordmotor 1 (€)"><input type="number" value={wertAM1} onChange={(e) => setWertAM1(e.target.value)} /></Field>
                <Field label="Außenbordmotor 2 (€)"><input type="number" value={wertAM2} onChange={(e) => setWertAM2(e.target.value)} /></Field>
                <Field label="Hilfsaußenbordmotor (€)"><input type="number" value={wertHilfsAM} onChange={(e) => setWertHilfsAM(e.target.value)} /></Field>
                <Field label="Beiboot (€)"><input type="number" value={wertBeiboot} onChange={(e) => setWertBeiboot(e.target.value)} /></Field>
                <Field label="Trailer (€)"><input type="number" value={wertTrailer} onChange={(e) => setWertTrailer(e.target.value)} /></Field>
                <Field label="Selbstbehalt (€)">
                  <select value={selbstbehalt} onChange={(e) => setSelbstbehalt(Number(e.target.value))} disabled={!sbOptions.length}>
                    {sbOptions.length ? sbOptions.map((sb) => <option key={sb} value={sb}>{sb === 0 ? "ohne" : `${sb} €`}</option>) : <option>keine Option verfügbar</option>}
                  </select>
                </Field>
                <Field label="Schadenfreiheitsrabatt">
                  <select value={sfr} onChange={(e) => setSfr(e.target.value)}>
                    {SFR_OPTIONEN.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </Field>
                <Field label="Zusätzliche persönliche Effekten (€, optional)"><input type="number" value={persEffekten} onChange={(e) => setPersEffekten(e.target.value)} /></Field>
                <Field label="Versicherungssteuer">
                  <select value={kaskoSteuerAndere ? "andere" : "19"} onChange={(e) => setKaskoSteuerAndere(e.target.value === "andere")}>
                    <option value="19">19 % (Standard)</option>
                    <option value="andere">Andere</option>
                  </select>
                </Field>
                {kaskoSteuerAndere && <Field label="Steuersatz (%)"><input type="number" value={kaskoSteuersatz} onChange={(e) => setKaskoSteuersatz(e.target.value)} /></Field>}
              </div>
              {!kaskoCalc.ok && <div className="warnbox"><AlertTriangle size={14} /> Für diese Kombination aus Wertklasse, Selbstbehalt und Fahrtgebiet bietet NAUTIMA keine Deckung — Selbstbehalt oder Fahrtgebiet anpassen.</div>}
              {kaskoCalc.ok && (
                <div className="calc-box">
                  <div className="calc-row"><span>Beitragssatz</span><b>{pct2(kaskoCalc.rate)} %</b></div>
                  <div className="calc-row"><span>Grundbeitrag</span><b>{euro2(kaskoCalc.grundbeitrag)} €</b></div>
                  <div className="calc-row"><span>SFR ({pct2(kaskoCalc.sfrSatz)} %)</span><b>− {euro2(kaskoCalc.sfrAbzug)} €</b></div>
                  <div className="calc-row"><span>Beitrag nach SFR</span><b>{euro2(kaskoCalc.beitragNachSfr)} €</b></div>
                  {kaskoCalc.effektenBeitrag > 0 && <div className="calc-row"><span>Persönliche Effekten</span><b>{euro2(kaskoCalc.effektenBeitrag)} €</b></div>}
                  <div className="calc-row calc-row--strong"><span>Beitrag inkl. Vers.-Steuer</span><b>{euro2(kaskoCalc.gesamt)} €</b></div>
                </div>
              )}
            </>
          )}
        </Section>

        <Section id="hp" title="B · Fahrzeughaftpflichtversicherung" icon={<FileCheck2 size={16} />} subtitle={hpAnwenden ? "wird beantragt" : "nicht beantragt"} open={!!openSections.hp} onToggle={toggle}>
          <label className="checkbox-field"><input type="checkbox" checked={hpAnwenden} onChange={(e) => setHpAnwenden(e.target.checked)} />Haftpflichtversicherung beantragen</label>
          {hpAnwenden && (
            <>
              <Field label="Deckungssumme">
                <select value={hpVS} onChange={(e) => setHpVS(Number(e.target.value))}>
                  <option value={0}>3 Mio. € pauschal</option>
                  <option value={1}>5 Mio. € pauschal</option>
                  <option value={2}>10 Mio. € pauschal</option>
                  <option value={3}>15 Mio. € pauschal</option>
                </select>
              </Field>
              <label className="checkbox-field"><input type="checkbox" checked={sicherheitsleistung} onChange={(e) => setSicherheitsleistung(e.target.checked)} />Sicherheitsleistung im Ausland (25.000 €)</label>
              <div className="field-grid">
                <Field label="Versicherungssteuer">
                  <select value={hpSteuerAndere ? "andere" : "19"} onChange={(e) => setHpSteuerAndere(e.target.value === "andere")}>
                    <option value="19">19 % (Standard)</option>
                    <option value="andere">Andere</option>
                  </select>
                </Field>
                {hpSteuerAndere && <Field label="Steuersatz (%)"><input type="number" value={hpSteuersatz} onChange={(e) => setHpSteuersatz(e.target.value)} /></Field>}
              </div>
              {!hpCalc.ok && <div className="warnbox"><AlertTriangle size={14} /> {bootstyp === "motorboot" ? "Motorleistung außerhalb der Tabelle." : "Segelfläche außerhalb der Tabelle."} Angebot nur auf Anfrage.</div>}
              {hpCalc.ok && (
                <div className="calc-box">
                  <div className="calc-row"><span>Grundbeitrag ({hpCalc.quelle}, {hpMitVermietung ? "mit" : "ohne"} Vermietung)</span><b>{euro2(hpCalc.basis)} €</b></div>
                  {hpCalc.sicherheitsleistungBetrag > 0 && <div className="calc-row"><span>Sicherheitsleistung im Ausland</span><b>{euro2(hpCalc.sicherheitsleistungBetrag)} €</b></div>}
                  <div className="calc-row calc-row--strong"><span>Beitrag inkl. Vers.-Steuer</span><b>{euro2(hpCalc.gesamt)} €</b></div>
                </div>
              )}
            </>
          )}
        </Section>

        <Section id="unfall" title="C · Insassenunfallversicherung" icon={<FileCheck2 size={16} />} subtitle={unfallAnwenden ? "wird beantragt" : "nicht beantragt"} open={!!openSections.unfall} onToggle={toggle}>
          <label className="checkbox-field"><input type="checkbox" checked={unfallAnwenden} onChange={(e) => setUnfallAnwenden(e.target.checked)} />Insassenunfallversicherung beantragen</label>
          {unfallAnwenden && (
            <>
              <Field label="Variante">
                <select value={variante} onChange={(e) => setVariante(e.target.value)}>
                  <option value="BASIS">BASIS — {euro2(NAUTIMA_INSASSENUNFALL.BASIS)} €</option>
                  <option value="KOMFORT">KOMFORT — {euro2(NAUTIMA_INSASSENUNFALL.KOMFORT)} €</option>
                  <option value="TOP">TOP — {euro2(NAUTIMA_INSASSENUNFALL.TOP)} €</option>
                </select>
              </Field>
              <div className="calc-box">
                <div className="calc-row calc-row--strong"><span>Beitrag inkl. Vers.-Steuer</span><b>{euro2(unfallCalc.gesamt)} €</b></div>
              </div>
            </>
          )}
        </Section>

        <Section id="abschluss" title="Beitragszahlung &amp; Abschluss" icon={<Send size={16} />} open={!!openSections.abschluss} onToggle={toggle}>
          <Field label="Beitragszahlung erfolgt">
            <select value={zahlungsart} onChange={(e) => setZahlungsart(e.target.value)}>
              <option value="Makler">im Maklerinkasso</option>
              <option value="Direkt">im Direktinkasso</option>
              <option value="Lastschrift">per SEPA-Lastschrift</option>
              <option value="Rechnung">per Rechnung</option>
            </select>
          </Field>
          {zahlungsart === "Lastschrift" && (
            <div className="subrow">
              <label className="checkbox-field"><input type="checkbox" checked={sepaGleichAntragsteller} onChange={(e) => setSepaGleichAntragsteller(e.target.checked)} />Zahler ist Antragsteller</label>
              <div className="field-grid">
                <Field label="Kreditinstitut"><input value={sepaKreditinstitut} onChange={(e) => setSepaKreditinstitut(e.target.value)} /></Field>
                <Field label="BIC"><input value={sepaBic} onChange={(e) => setSepaBic(e.target.value)} /></Field>
                <Field label="IBAN" span><input value={sepaIban} onChange={(e) => setSepaIban(e.target.value)} /></Field>
              </div>
            </div>
          )}
          <div className="field-grid">
            <Field label="Besondere Vereinbarungen, Zeile 1"><input value={besondere1} onChange={(e) => setBesondere1(e.target.value)} /></Field>
            <Field label="Besondere Vereinbarungen, Zeile 2"><input value={besondere2} onChange={(e) => setBesondere2(e.target.value)} /></Field>
            <Field label="Ort (Unterschrift)"><input value={ort} onChange={(e) => setOrt(e.target.value)} /></Field>
            <Field label="Datum (Unterschrift)"><input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} /></Field>
          </div>
        </Section>

        <div className="total-bar">
          <div>
            <span className="total-label">Gesamtbeitrag A–C (inkl. Vers.-Steuer, gemäß Zahlungsweise)</span>
            <span className="total-hint">Basis: jährlich — bei anderer Zahlungsweise fällt zusätzlich der Ratenzuschlag an</span>
          </div>
          <span className="total-value">{euro2(gesamtACGesamt)} €</span>
        </div>

        <button type="button" className="submit-btn" disabled={!canSubmit} onClick={handleSubmit}>
          <FileCheck2 size={16} />
          Zusammenfassung erzeugen
        </button>
        {!canSubmit && <p className="hint-text">Bitte mindestens Name/Firma des Versicherungsnehmers angeben.</p>}
        {savedMsg && <p className="hint-text hint-text--ok">{savedMsg}</p>}
        {saveError && <div className="warnbox">{saveError}</div>}

        {outputText && (
          <div className="output-box">
            <p className="output-instructions">
              <strong>Fast fertig:</strong> Text unten kopieren und hier im Chat als Nachricht einfügen — daraus wird das ausgefüllte NAUTIMA-PDF erzeugt.
            </p>
            <textarea className="output-textarea" readOnly value={outputText} onFocus={(e) => e.target.select()} rows={10} />
            <button type="button" className="copy-btn" onClick={handleCopy}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Kopiert!" : "Text kopieren"}
            </button>
          </div>
        )}
    </div>
  );
}


/* ===================== Bootsdatenblatt (Callidus) Tab ===================== */
function DCard({ n, title, children }) {
  return (
    <section className="dcard">
      <h2 className="dcard-title"><span className="dcard-num">{n}</span>{title}</h2>
      <div className="dcard-body">{children}</div>
    </section>
  );
}

function CallidusDatenblattTab({ customers, prefill, onCustomersChanged }) {
  const [prefillId, setPrefillId] = useState("");
  useEffect(() => {
    if (customers?.length === 1 && !prefillId) setPrefillId(customers[0].id);
  }, [customers]); // eslint-disable-line
  // 1. Allgemeine Bootsdaten
  const [bootstyp, setBootstyp] = useState("segelboot"); // segelboot | motorboot
  const [registrierungsland, setRegistrierungsland] = useState("Österreich");
  const [werft, setWerft] = useState("");
  const [modell, setModell] = useState("");
  const [hersteller, setHersteller] = useState("");
  const [baujahr, setBaujahr] = useState(2015);
  const [yachttyp, setYachttyp] = useState("");

  // 2. Technische Spezifikationen
  const [laenge, setLaenge] = useState("");
  const [breite, setBreite] = useState("");
  const [tiefgang, setTiefgang] = useState("");
  const [verdraengung, setVerdraengung] = useState("");
  const [rumpfmaterial, setRumpfmaterial] = useState("GFK (glasfaserverstärkter Kunststoff)");
  const [mastmaterial, setMastmaterial] = useState("Aluminium");
  const [segelflaeche, setSegelflaeche] = useState(30);
  const [beibootVorhanden, setBeibootVorhanden] = useState(false);

  // 3. Antrieb
  const [maschinendeckung, setMaschinendeckung] = useState(false);
  const [motortyp, setMotortyp] = useState("Innenborder");
  const [motorleistungKW, setMotorleistungKW] = useState(40);
  const [herstellerMotor, setHerstellerMotor] = useState("");

  // 4. Nutzung
  const [regatta, setRegatta] = useState(false);
  const [modifikationen, setModifikationen] = useState(false);
  const [charter, setCharter] = useState("nein"); // nein | mit | ohne
  const [fahrtgebietText, setFahrtgebietText] = useState("Österreichische Binnengewässer");
  const [fahrtgebietZone, setFahrtgebietZone] = useState("binnen"); // binnen | mittelmeer (steuert den Tarif)

  // 5. Versicherungsdaten
  const [kategorieSY, setKategorieSY] = useState("Sport"); // Komfort | Sport
  const [kategorieMY, setKategorieMY] = useState("Verdraenger");
  const [versWertBoot, setVersWertBoot] = useState(80000);
  const [zusAusruestung, setZusAusruestung] = useState(0);
  const [persEffekten, setPersEffekten] = useState(0);
  const [wertBeiboot, setWertBeiboot] = useState(0);
  const [wertTrailer, setWertTrailer] = useState(0);
  const [haftpflichtsumme, setHaftpflichtsumme] = useState(5000000); // 5000000 | 10000000
  const [holzCarbon, setHolzCarbon] = useState(false);

  // 6. Versicherungsnehmer
  const [titelVN, setTitelVN] = useState("");
  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [geburtsdatum, setGeburtsdatum] = useState("");
  const [adresse, setAdresse] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const name = [titelVN, vorname, nachname].filter(Boolean).join(" ");

  const kategorie = bootstyp === "segelboot" ? kategorieSY : kategorieMY;

  const applyPrefill = (customerId) => {
    setPrefillId(customerId);
    const c = customers.find((cc) => cc.id === customerId);
    if (!c) return;
    if (c.titel) setTitelVN(c.titel);
    if (c.vorname) setVorname(c.vorname);
    if (c.nachname) setNachname(c.nachname);
    else if (c.name) { const sp = splitFullName(c.name); setTitelVN(sp.titel); setVorname(sp.vorname); setNachname(sp.nachname); }
    if (c.geburtsdatum) setGeburtsdatum(c.geburtsdatum);
    if (c.email) setEmail(c.email);
    if (c.telefon) setTelefon(c.telefon);
    if (c.adresse) setAdresse(c.adresse);
    if (c.bootstyp === "Segelboot") setBootstyp("segelboot");
    else if (c.bootstyp === "Motorboot") setBootstyp("motorboot");
    const r = c.risiko || {};
    if (r.registrierungsland) setRegistrierungsland(r.registrierungsland);
    if (r.werft) setWerft(r.werft);
    if (r.hersteller) setHersteller(r.hersteller);
    if (r.modell) setModell(r.modell);
    if (r.yachttyp) setYachttyp(r.yachttyp);
    if (r.baujahr) setBaujahr(Number(r.baujahr) || thisYear);
    if (r.laenge) setLaenge(r.laenge);
    if (r.breite) setBreite(r.breite);
    if (r.tiefgang) setTiefgang(r.tiefgang);
    if (r.rumpfmaterial) setRumpfmaterial(r.rumpfmaterial);
    if (r.mastmaterial) setMastmaterial(r.mastmaterial);
    if (r.segelflaeche) setSegelflaeche(Number(r.segelflaeche) || 0);
    if (r.motortyp) setMotortyp(r.motortyp);
    if (r.motorleistungKW) setMotorleistungKW(Number(r.motorleistungKW) || 0);
    if (r.herstellerMotor) setHerstellerMotor(r.herstellerMotor);
    if (r.fahrtgebiet) setFahrtgebietText(r.fahrtgebiet);
    if (typeof r.charter === "string") setCharter(r.charter.toLowerCase().startsWith("nein") ? "nein" : "mit");
  };

  // Übernahme aus dem Prämienrechner (Button dort: "Bootsdatenblatt erstellen")
  useEffect(() => {
    if (!prefill) return;
    if (prefill.bootstyp) setBootstyp(prefill.bootstyp);
    if (prefill.baujahr) setBaujahr(prefill.baujahr);
    if (prefill.versicherungssumme) setVersWertBoot(prefill.versicherungssumme);
    if (prefill.fahrtgebietZone) setFahrtgebietZone(prefill.fahrtgebietZone);
    if (prefill.motorkw) setMotorleistungKW(prefill.motorkw);
    if (prefill.segelflaeche) setSegelflaeche(prefill.segelflaeche);
    if (prefill.selbstbehalt) setSelbstbehalt(prefill.selbstbehalt);
    if (prefill.charter) setCharter(prefill.charter);
    if (prefill.kategorieSY) setKategorieSY(prefill.kategorieSY);
    if (prefill.kategorieMY) setKategorieMY(prefill.kategorieMY);
    if (typeof prefill.holzCarbon === "boolean") setHolzCarbon(prefill.holzCarbon);
    if (typeof prefill.maschinendeckung === "boolean") setMaschinendeckung(prefill.maschinendeckung);
    if (prefill.haftpflichtsumme) setHaftpflichtsumme(prefill.haftpflichtsumme);
    if (prefill.titelVN) setTitelVN(prefill.titelVN);
    if (prefill.vorname) setVorname(prefill.vorname);
    if (prefill.nachname) setNachname(prefill.nachname);
    if (prefill.adresse) setAdresse(prefill.adresse);
    if (prefill.geburtsdatum) setGeburtsdatum(prefill.geburtsdatum);
    if (prefill.email) setEmail(prefill.email);
    if (prefill.telefon) setTelefon(prefill.telefon);
  }, [prefill]); // eslint-disable-line
  const tarif = bootstyp === "segelboot"
    ? (fahrtgebietZone === "binnen" ? CALLIDUS_SY_KASKO_BINNEN : CALLIDUS_SY_KASKO_MITTELMEER)
    : (fahrtgebietZone === "binnen" ? CALLIDUS_MY_KASKO_BINNEN : CALLIDUS_MY_KASKO_MITTELMEER);

  const versicherungssumme = (Number(versWertBoot) || 0) + (Number(zusAusruestung) || 0) + (Number(wertBeiboot) || 0) + (Number(wertTrailer) || 0);

  const sbOptions = useMemo(() => callidusAvailableSBForVS(tarif, versicherungssumme, kategorie, tarif.sbOptions), [tarif, versicherungssumme, kategorie]);
  const [selbstbehalt, setSelbstbehalt] = useState(1000);
  useEffect(() => { if (sbOptions.length && !sbOptions.includes(selbstbehalt)) setSelbstbehalt(sbOptions[0]); }, [sbOptions]); // eslint-disable-line

  const vsStatus = callidusVSStatus(tarif, versicherungssumme);
  const alter = thisYear - Number(baujahr);

  const kaskoCalc = useMemo(() => {
    if (vsStatus !== "normal" && vsStatus !== "interpoliert") return { ok: false, status: vsStatus };
    const r = resolveCallidusRate(tarif, versicherungssumme, kategorie, selbstbehalt);
    if (!r) return { ok: false, status: "keine-zeile" };
    const grund = versicherungssumme * r.rate;
    let saldo = 0;
    const zuschlaege = [];
    if (alter > 20) { saldo += CALLIDUS_KASKO_ZUSCHLAEGE.alter20; zuschlaege.push(["Altersaufschlag (Boot " + alter + " Jahre)", CALLIDUS_KASKO_ZUSCHLAEGE.alter20]); }
    if (charter === "mit") { saldo += CALLIDUS_KASKO_ZUSCHLAEGE.charterSkipper; zuschlaege.push(["Charter mit Skipper", CALLIDUS_KASKO_ZUSCHLAEGE.charterSkipper]); }
    if (charter === "ohne") { saldo += CALLIDUS_KASKO_ZUSCHLAEGE.charterOhneSkipper; zuschlaege.push(["Charter ohne Skipper", CALLIDUS_KASKO_ZUSCHLAEGE.charterOhneSkipper]); }
    if (maschinendeckung) { saldo += CALLIDUS_KASKO_ZUSCHLAEGE.maschinendeckung; zuschlaege.push(["Maschinendeckung", CALLIDUS_KASKO_ZUSCHLAEGE.maschinendeckung]); }
    if (holzCarbon) { saldo += CALLIDUS_KASKO_ZUSCHLAEGE.holzCarbon; zuschlaege.push(["Holz-/Carbon-Aufschlag", CALLIDUS_KASKO_ZUSCHLAEGE.holzCarbon]); }
    const nachZuschlag = grund * (1 + saldo);
    const mindest = tarif.minPraemie[kategorie];
    const betrag = Math.max(nachZuschlag, mindest);
    return { ok: true, rate: r.rate, interpolated: r.interpolated, grund, saldo, zuschlaege, nachZuschlag, mindest, betrag };
  }, [tarif, versicherungssumme, kategorie, selbstbehalt, alter, charter, maschinendeckung, holzCarbon, vsStatus]);

  const hpVSIndex = haftpflichtsumme === 10000000 ? 1 : 0;
  const hpCalc = useMemo(() => {
    let b = null;
    if (bootstyp === "motorboot") b = findCallidusHPBracketKW(CALLIDUS_MY_HP.brackets, motorleistungKW);
    else b = findCallidusHPBracketM2(CALLIDUS_SY_HP.brackets, segelflaeche);
    if (!b) return { ok: false };
    const basis = b.v[hpVSIndex];
    const zuschlag = charter !== "nein" ? CALLIDUS_VERCHARTER_AUFSCHLAG : 0;
    return { ok: true, basis, zuschlag, betrag: basis + zuschlag, quelle: bootstyp === "motorboot" ? `bis ${b.maxKW} kW` : `bis ${b.maxM2} m²` };
  }, [bootstyp, motorleistungKW, segelflaeche, hpVSIndex, charter]);

  const gesamt = (kaskoCalc.ok ? kaskoCalc.betrag : 0) + (hpCalc.ok ? hpCalc.betrag : 0);

  const [outputText, setOutputText] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [saveError, setSaveError] = useState("");
  const canSubmit = nachname.trim().length > 0;

  const saveToCustomer = async (fullPayload) => {
    if (!nachname.trim()) return null;
    const risikoBootstyp = bootstyp === "segelboot" ? "Segelboot" : "Motorboot";
    const risiko = {
      bootstyp: risikoBootstyp, registrierungsland, werft, hersteller, modell, yachttyp, baujahr: String(baujahr),
      laenge, breite, tiefgang, rumpfmaterial,
      fahrtgebiet: fahrtgebietText,
      charter: charter === "nein" ? "Nein" : charter === "mit" ? "Ja, mit Skipper" : "Ja, ohne Skipper",
    };
    if (bootstyp === "segelboot") { risiko.mastmaterial = mastmaterial; risiko.segelflaeche = String(segelflaeche); }
    else { risiko.motortyp = motortyp; risiko.motorleistungKW = String(motorleistungKW); risiko.herstellerMotor = herstellerMotor; }

    const quote = {
      id: uid(), erstellt: new Date().toISOString(), quelle: "Bootsdatenblatt",
      bootstyp, baujahr, versicherungssumme, callidus: gesamt,
    };
    const antrag = { id: uid(), erstellt: new Date().toISOString(), typ: "Bootsdatenblatt", daten: fullPayload };

    let customerId = prefillId;
    let existing = customerId ? await storageGetJSON(`customer:${customerId}`, true) : null;
    if (!existing) {
      try {
        const listing = await window.storage.list("customer:", true);
        const all = [];
        for (const k of listing?.keys || []) { const c = await storageGetJSON(k, true); if (c) all.push(c); }
        const m = findCustomerMatches(all, { titel: titelVN, vorname, nachname, adresse });
        if (m.exact) { existing = m.exact; customerId = m.exact.id; }
      } catch (e) {}
    }
    if (!customerId) customerId = uid();

    const record = existing ? {
      ...existing,
      adresse: existing.adresse || adresse,
      geburtsdatum: existing.geburtsdatum || geburtsdatum,
      email: existing.email || email,
      telefon: existing.telefon || telefon,
      bootstyp: existing.bootstyp || risikoBootstyp,
      status: existing.status || "offert",
      risiko: { ...(existing.risiko || {}), ...risiko },
      quotes: [quote, ...(existing.quotes || [])].slice(0, 20),
      antraege: [antrag, ...(existing.antraege || [])].slice(0, 10),
      historie: [{ id: uid(), datum: new Date().toISOString(), typ: "Sonstiges", text: `Bootsdatenblatt erstellt (${euro(gesamt)}/Jahr)`, system: true }, ...(existing.historie || [])],
    } : {
      id: customerId, titel: titelVN.trim(), vorname: vorname.trim(), nachname: nachname.trim(), adresse, geburtsdatum, email, telefon,
      bootsname: "", bootstyp: risikoBootstyp, status: "offert",
      risiko, vertraege: [], notizen: "", quotes: [quote], antraege: [antrag],
      historie: [{ id: uid(), datum: new Date().toISOString(), typ: "Sonstiges", text: `Bootsdatenblatt erstellt (${euro(gesamt)}/Jahr)`, system: true }],
    };
    await storageSetJSON(`customer:${customerId}`, record, true);
    if (record.status === "offert" && existing?.status !== "offert") await createOffertTasks(record);
    if (onCustomersChanged) await onCustomersChanged();
    return fullName(record);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaveError("");
    const payload = {
      allgemein: { bootstyp, registrierungsland, werft, modell, hersteller, baujahr, yachttyp },
      technik: { laenge, breite, tiefgang, verdraengung, rumpfmaterial, mastmaterial: bootstyp === "segelboot" ? mastmaterial : undefined, segelflaeche: bootstyp === "segelboot" ? segelflaeche : undefined, beibootVorhanden },
      antrieb: { maschinendeckung, motortyp, motorleistungKW: bootstyp === "motorboot" ? motorleistungKW : undefined, herstellerMotor },
      nutzung: { regatta, modifikationen, charter, fahrtgebietText, fahrtgebietZone },
      versicherung: {
        kategorie, versWertBoot, zusAusruestung, persEffekten, wertBeiboot, wertTrailer,
        versicherungssummeGesamt: versicherungssumme, haftpflichtsumme, selbstbehalt, holzCarbon,
        zahlperiode: "Jährlich",
      },
      versicherungsnehmer: { name, geburtsdatum, adresse, email, telefon },
      berechnungCallidus: { kasko: kaskoCalc, haftpflicht: hpCalc, gesamt },
    };
    const text = "CALLIDUS-BOOTSDATENBLATT — bitte das Bootsdatenblatt-PDF (Layout wie Delphia-Beispiel) damit erzeugen, inkl. Prämien-Abschnitt:\n```json\n" + JSON.stringify(payload, null, 2) + "\n```";
    setOutputText(text);
    setCopied(false);
    try {
      const savedName = await saveToCustomer(payload);
      if (savedName) {
        setSavedMsg(`Bei Kunde „${savedName}“ hinterlegt: Boot, Berechnung und alle Bootsdatenblatt-Daten.`);
        setTimeout(() => setSavedMsg(""), 4000);
      }
    } catch (e) {
      setSaveError(`Kunde konnte nicht gespeichert werden: ${e?.message || "unbekannter Fehler"}. Bootsdatenblatt-Daten unten sind trotzdem vollständig.`);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
    } catch (e) {
      setCopied(false);
    }
  };


  return (
    <div className="form-tab">
      <div className="info-banner info-banner--inline">
        <Info size={14} />
        <span>Am Ende: Zusammenfassung erzeugen, Text kopieren und hier im Chat einfügen — daraus entsteht das Bootsdatenblatt-PDF im Original-Layout inkl. Prämie.</span>
      </div>

      {customers.length > 0 && (
        <div className="panel">
          <Field label="Daten aus bestehendem Kunden übernehmen (optional)">
            <select value={prefillId} onChange={(e) => applyPrefill(e.target.value)}>
              <option value="">— manuell ausfüllen —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{fullName(c)}</option>)}
            </select>
          </Field>
        </div>
      )}

        <DCard n="1" title="Allgemeine Bootsdaten">
          <RadioRow name="bootstyp" value={bootstyp} onChange={setBootstyp} options={[{ value: "segelboot", label: "Segelboot / Segelyacht" }, { value: "motorboot", label: "Motorboot / Motoryacht" }]} />
          <div className="field-grid">
            <Field label="Registrierungsland"><input value={registrierungsland} onChange={(e) => setRegistrierungsland(e.target.value)} /></Field>
            <Field label="Werft"><input value={werft} onChange={(e) => setWerft(e.target.value)} /></Field>
            <Field label="Modell"><input value={modell} onChange={(e) => setModell(e.target.value)} /></Field>
            <Field label="Hersteller"><input value={hersteller} onChange={(e) => setHersteller(e.target.value)} /></Field>
            <Field label="Baujahr"><input type="number" value={baujahr} onChange={(e) => setBaujahr(Number(e.target.value) || thisYear)} /></Field>
            <Field label="Yachttyp"><input value={yachttyp} onChange={(e) => setYachttyp(e.target.value)} placeholder="z. B. Kielyacht / Sportsegelyacht" /></Field>
          </div>
        </DCard>

        <DCard n="2" title="Technische Spezifikationen">
          <div className="field-grid">
            <Field label="Länge (LüA)"><input value={laenge} onChange={(e) => setLaenge(e.target.value)} placeholder="z. B. 8,95 m" /></Field>
            <Field label="Breite"><input value={breite} onChange={(e) => setBreite(e.target.value)} placeholder="z. B. 2,95 m" /></Field>
            <Field label="Tiefgang"><input value={tiefgang} onChange={(e) => setTiefgang(e.target.value)} /></Field>
            <Field label="Verdrängung"><input value={verdraengung} onChange={(e) => setVerdraengung(e.target.value)} /></Field>
            <Field label="Rumpfmaterial"><input value={rumpfmaterial} onChange={(e) => setRumpfmaterial(e.target.value)} /></Field>
            {bootstyp === "segelboot" && <Field label="Mastmaterial"><input value={mastmaterial} onChange={(e) => setMastmaterial(e.target.value)} /></Field>}
            {bootstyp === "segelboot" && <Field label="Segelfläche (m²)"><input type="number" value={segelflaeche} onChange={(e) => setSegelflaeche(Number(e.target.value) || 0)} /></Field>}
          </div>
          <label className="checkbox-field"><input type="checkbox" checked={beibootVorhanden} onChange={(e) => setBeibootVorhanden(e.target.checked)} />Beiboot vorhanden</label>
          <label className="checkbox-field"><input type="checkbox" checked={holzCarbon} onChange={(e) => setHolzCarbon(e.target.checked)} />Holz-/Carbon-Bauweise (Callidus-Zuschlag +25 %)</label>
        </DCard>

        <DCard n="3" title="Antrieb">
          <label className="checkbox-field"><input type="checkbox" checked={maschinendeckung} onChange={(e) => setMaschinendeckung(e.target.checked)} />Maschinendeckung gewünscht (Callidus-Zuschlag +15 %)</label>
          <div className="field-grid">
            <Field label="Motortyp">
              <select value={motortyp} onChange={(e) => setMotortyp(e.target.value)}>
                <option>Innenborder</option><option>Außenborder</option><option>Hilfsaußenborder</option><option>Elektromotor</option>
              </select>
            </Field>
            {bootstyp === "motorboot" && <Field label="Motorleistung (kW)"><input type="number" value={motorleistungKW} onChange={(e) => setMotorleistungKW(Number(e.target.value) || 0)} /></Field>}
            <Field label="Hersteller Motor"><input value={herstellerMotor} onChange={(e) => setHerstellerMotor(e.target.value)} /></Field>
          </div>
        </DCard>

        <DCard n="4" title="Nutzung">
          <label className="checkbox-field"><input type="checkbox" checked={regatta} onChange={(e) => setRegatta(e.target.checked)} />Regattateilnahme</label>
          <label className="checkbox-field"><input type="checkbox" checked={modifikationen} onChange={(e) => setModifikationen(e.target.checked)} />Modifikationen am Boot</label>
          <h4 className="mini-title">Chartereinsatz</h4>
          <RadioRow name="charter" value={charter} onChange={setCharter} options={[{ value: "nein", label: "Nein" }, { value: "mit", label: "Ja, mit Skipper" }, { value: "ohne", label: "Ja, ohne Skipper" }]} />
          <div className="field-grid">
            <Field label="Fahrtgebiet (Anzeigetext)"><input value={fahrtgebietText} onChange={(e) => setFahrtgebietText(e.target.value)} /></Field>
            <Field label="Zone für Tarifberechnung">
              <select value={fahrtgebietZone} onChange={(e) => setFahrtgebietZone(e.target.value)}>
                <option value="binnen">Binnengewässer</option>
                <option value="mittelmeer">Küste / Mittelmeer (Callidus-Auslandstarif)</option>
              </select>
            </Field>
          </div>
        </DCard>

        <DCard n="5" title="Versicherungsdaten">
          <Field label={bootstyp === "segelboot" ? "Kategorie" : "Bauart"}>
            {bootstyp === "segelboot"
              ? <RadioRow name="katSY" value={kategorieSY} onChange={setKategorieSY} options={[{ value: "Komfort", label: "Komfort" }, { value: "Sport", label: "Sport" }]} />
              : <RadioRow name="katMY" value={kategorieMY} onChange={setKategorieMY} options={[{ value: "Verdraenger", label: "Verdränger" }, { value: "Gleiter", label: "Gleiter" }]} />}
          </Field>
          <div className="field-grid">
            <Field label="Versicherungswert Boot (€)"><input type="number" value={versWertBoot} onChange={(e) => setVersWertBoot(e.target.value)} /></Field>
            <Field label="Zusätzliche Ausrüstung (€)"><input type="number" value={zusAusruestung} onChange={(e) => setZusAusruestung(e.target.value)} /></Field>
            <Field label="Persönliche Effekten (€)"><input type="number" value={persEffekten} onChange={(e) => setPersEffekten(e.target.value)} /></Field>
            <Field label="Beiboot (€)"><input type="number" value={wertBeiboot} onChange={(e) => setWertBeiboot(e.target.value)} /></Field>
            <Field label="Trailer (€)"><input type="number" value={wertTrailer} onChange={(e) => setWertTrailer(e.target.value)} /></Field>
            <Field label="Versicherungssumme gesamt"><input value={`${euro2(versicherungssumme)} €`} disabled /></Field>
            <Field label="Haftpflichtsumme">
              <select value={haftpflichtsumme} onChange={(e) => setHaftpflichtsumme(Number(e.target.value))}>
                <option value={5000000}>5.000.000 €</option>
                <option value={10000000}>10.000.000 €</option>
              </select>
            </Field>
            <Field label="Selbstbehalt (€)">
              <select value={selbstbehalt} onChange={(e) => setSelbstbehalt(Number(e.target.value))} disabled={!sbOptions.length}>
                {sbOptions.length ? sbOptions.map((sb) => <option key={sb} value={sb}>{euro2(sb)} €</option>) : <option>keine Option verfügbar</option>}
              </select>
            </Field>
          </div>

          {vsStatus === "anfrage" && <div className="warnbox"><AlertTriangle size={14} /> Wertklasse oberhalb der Tabelle — nur Angebot auf Anfrage.</div>}
          {vsStatus === "ausserhalb" && <div className="warnbox"><AlertTriangle size={14} /> Versicherungssumme liegt außerhalb der Tabelle.</div>}
          {(vsStatus === "normal" || vsStatus === "interpoliert") && !kaskoCalc.ok && <div className="warnbox"><AlertTriangle size={14} /> Für diese Kombination aus Wertklasse und Selbstbehalt bietet der Tarif keine Zeile — Selbstbehalt anpassen.</div>}
          {!hpCalc.ok && <div className="warnbox"><AlertTriangle size={14} /> {bootstyp === "motorboot" ? "Motorleistung" : "Segelfläche"} außerhalb der Haftpflicht-Tabelle.</div>}

          {kaskoCalc.ok && (
            <div className="calc-box">
              {kaskoCalc.interpolated && <div className="calc-row calc-row--note">Satz linear interpoliert (Wertklasse 70.000–170.000 €)</div>}
              <div className="calc-row"><span>Beitragssatz</span><b>{pct2(kaskoCalc.rate)} %</b></div>
              <div className="calc-row"><span>Grundprämie</span><b>{euro2(kaskoCalc.grund)} €</b></div>
              {kaskoCalc.zuschlaege.map(([label, p], i) => <div className="calc-row" key={i}><span>{label}</span><b>+{pct2(p)} %</b></div>)}
              <div className="calc-row calc-row--strong"><span>Kasko-Prämie</span><b>{euro2(kaskoCalc.betrag)} €</b></div>
              {hpCalc.ok && (
                <>
                  <div className="calc-row"><span>Haftpflicht ({hpCalc.quelle}{hpCalc.zuschlag > 0 ? " + Vercharter" : ""})</span><b>{euro2(hpCalc.betrag)} €</b></div>
                  <div className="calc-row calc-row--strong calc-row--total"><span>Gesamtprämie / Jahr</span><b>{euro2(gesamt)} €</b></div>
                </>
              )}
            </div>
          )}
        </DCard>

        <DCard n="6" title="Versicherungsnehmer">
          <div className="field-grid">
            <Field label="Titel" hint="z. B. Dr., Mag., Ing."><input value={titelVN} onChange={(e) => setTitelVN(e.target.value)} /></Field>
            <Field label="Vorname"><input value={vorname} onChange={(e) => setVorname(e.target.value)} /></Field>
            <Field label="Nachname *" span><input value={nachname} onChange={(e) => setNachname(e.target.value)} /></Field>
            <Field label="Geburtsdatum"><input type="date" value={geburtsdatum} onChange={(e) => setGeburtsdatum(e.target.value)} /></Field>
            <Field label="Adresse" span><input value={adresse} onChange={(e) => setAdresse(e.target.value)} /></Field>
            <Field label="E-Mail"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Telefon"><input value={telefon} onChange={(e) => setTelefon(e.target.value)} /></Field>
          </div>
        </DCard>

        <button type="button" className="submit-btn" disabled={!canSubmit} onClick={handleSubmit}>
          <FileCheck2 size={16} />
          Zusammenfassung erzeugen
        </button>
        {!canSubmit && <p className="hint-text">Bitte mindestens den Namen des Versicherungsnehmers angeben.</p>}
        {savedMsg && <p className="hint-text hint-text--ok">{savedMsg}</p>}
        {saveError && <div className="warnbox">{saveError}</div>}

        {outputText && (
          <div className="output-box">
            <p className="output-instructions">
              <strong>Fast fertig:</strong> Text unten kopieren und hier im Chat als Nachricht einfügen — daraus wird das Bootsdatenblatt-PDF mit der Prämie erzeugt.
            </p>
            <textarea className="output-textarea" readOnly value={outputText} onFocus={(e) => e.target.select()} rows={10} />
            <button type="button" className="copy-btn" onClick={handleCopy}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Kopiert!" : "Text kopieren"}
            </button>
          </div>
        )}
    </div>
  );
}


/* ===================== Newsletter-Tab ===================== */
function NewsletterTab({ customers, partners }) {
  const [audience, setAudience] = useState("kunden"); // kunden | partner
  const [betreff, setBetreff] = useState("");
  const [nachricht, setNachricht] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle"); // Kunden: alle | offert | antrag | polizze
  const [typFilter, setTypFilter] = useState("alle"); // Partner: alle | Versicherungsmakler | ...
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [outputText, setOutputText] = useState("");
  const [copied, setCopied] = useState(false);

  const pool = audience === "kunden" ? (customers || []) : (partners || []);
  const withEmail = useMemo(() => pool.filter((c) => c.email && c.email.trim()), [pool]);
  const filtered = useMemo(() => {
    if (audience === "kunden") return statusFilter === "alle" ? withEmail : withEmail.filter((c) => c.status === statusFilter);
    return typFilter === "alle" ? withEmail : withEmail.filter((p) => p.typ === typFilter);
  }, [withEmail, statusFilter, typFilter, audience]);

  useEffect(() => {
    setSelectedIds(new Set(filtered.map((c) => c.id)));
  }, [statusFilter, typFilter, audience]); // eslint-disable-line
  useEffect(() => {
    setSelectedIds((prev) => (prev.size === 0 && filtered.length > 0 ? new Set(filtered.map((c) => c.id)) : prev));
  }, [filtered]); // eslint-disable-line

  const toggle = (id) => setSelectedIds((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const selectAll = () => setSelectedIds(new Set(filtered.map((c) => c.id)));
  const selectNone = () => setSelectedIds(new Set());

  const recipients = filtered.filter((c) => selectedIds.has(c.id));
  const previewRecipient = recipients[0];

  const merge = (text, r) => (text || "")
    .split("{{Name}}").join((audience === "kunden" ? fullName(r) : r?.name) || "")
    .split("{{Bootsname}}").join(r?.bootsname || "Ihr Boot")
    .split("{{Status}}").join(r ? (statusInfo(r.status)?.label || "") : "")
    .split("{{Typ}}").join(r ? (partnerTypeLabel(r) || "") : "");

  const canSubmit = betreff.trim().length > 0 && nachricht.trim().length > 0 && recipients.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload = audience === "kunden" ? {
      betreff, nachricht, empfaengerart: "kunden",
      empfaenger: recipients.map((c) => ({ name: fullName(c), email: c.email, bootsname: c.bootsname || "", status: c.status || "" })),
    } : {
      betreff, nachricht, empfaengerart: "partner",
      empfaenger: recipients.map((p) => ({ name: p.name, email: p.email, typ: partnerTypeLabel(p) || "" })),
    };
    const platzhalter = audience === "kunden" ? "{{Name}}/{{Bootsname}}/{{Status}}" : "{{Name}}/{{Typ}}";
    const text = `NEWSLETTER (Empfänger: ${audience === "kunden" ? "Kunden" : "Partner"}) — bitte je Empfänger die Platzhalter (${platzhalter}) ersetzen und als Outlook-Entwürfe anlegen; vor dem tatsächlichen Versand bitte kurz bei mir nachfragen:\n\`\`\`json\n` + JSON.stringify(payload, null, 2) + "\n```";
    setOutputText(text);
    setCopied(false);
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(outputText); setCopied(true); } catch (e) { setCopied(false); }
  };

  return (
    <div className="form-tab">
      <div className="info-banner info-banner--inline">
        <Info size={14} />
        <span>Der Versand läuft nicht automatisch aus dieser App. Hier bereitest du Inhalt und Empfängerliste vor — am Ende: Zusammenfassung erzeugen, Text kopieren und hier im Chat einfügen. Ich lege daraus Outlook-Entwürfe an und frage vor dem tatsächlichen Versand nochmal nach.</span>
      </div>

      <div className="panel">
        <h2 className="panel-title"><Mail size={18} /> Newsletter verfassen</h2>
        <Field label="Empfängerkreis" span>
          <div className="radio-row">
            <label className={`radio-pill ${audience === "kunden" ? "radio-pill--active" : ""}`}>
              <input type="radio" name="audience" checked={audience === "kunden"} onChange={() => setAudience("kunden")} />Kunden
            </label>
            <label className={`radio-pill ${audience === "partner" ? "radio-pill--active" : ""}`}>
              <input type="radio" name="audience" checked={audience === "partner"} onChange={() => setAudience("partner")} />Partner
            </label>
          </div>
        </Field>
        <div className="field-grid">
          <Field label="Betreff" span><input value={betreff} onChange={(e) => setBetreff(e.target.value)} placeholder="z. B. Saisonstart 2027 — Ihre Bootsversicherung" /></Field>
        </div>
        <Field label="Nachricht" hint={audience === "kunden" ? "Platzhalter: {{Name}}, {{Bootsname}}, {{Status}}" : "Platzhalter: {{Name}}, {{Typ}}"} span>
          <textarea rows={8} value={nachricht} onChange={(e) => setNachricht(e.target.value)} placeholder={"Liebe/r {{Name}},\n\n..."} />
        </Field>
      </div>

      <div className="panel">
        <h2 className="panel-title"><Users size={18} /> Empfänger</h2>
        <div className="field-grid">
          {audience === "kunden" ? (
            <Field label="Nach Status filtern">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="alle">Alle Kunden mit E-Mail-Adresse</option>
                {STATUS_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </Field>
          ) : (
            <Field label="Nach Typ filtern">
              <select value={typFilter} onChange={(e) => setTypFilter(e.target.value)}>
                <option value="alle">Alle Partner mit E-Mail-Adresse</option>
                {PARTNER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          )}
        </div>
        <p className="field-hint" style={{ margin: "6px 0 10px" }}>
          {withEmail.length} von {pool.length} {audience === "kunden" ? "Kunden" : "Partnern"} haben eine E-Mail-Adresse hinterlegt. {filtered.length} passen zum Filter, {recipients.length} ausgewählt.
        </p>
        <div className="newsletter-actions">
          <button type="button" className="btn btn--sm" onClick={selectAll}>Alle auswählen</button>
          <button type="button" className="btn btn--sm" onClick={selectNone}>Keine</button>
        </div>
        <div className="newsletter-recipient-list">
          {filtered.length === 0 && <p className="empty-hint">Keine {audience === "kunden" ? "Kunden" : "Partner"} mit E-Mail-Adresse für diesen Filter.</p>}
          {filtered.map((r) => (
            <label key={r.id} className="newsletter-recipient-row">
              <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggle(r.id)} />
              <span className="newsletter-recipient-name">{audience === "kunden" ? fullName(r) : r.name}</span>
              <span className="newsletter-recipient-email">{r.email}</span>
              {audience === "kunden" ? <StatusBadge status={r.status} /> : <span className="tab-badge" style={{ background: "var(--sea)" }}>{r.typ}</span>}
            </label>
          ))}
        </div>
      </div>

      {previewRecipient && (nachricht || betreff) && (
        <div className="panel">
          <h2 className="panel-title"><Eye size={18} /> Vorschau (für {audience === "kunden" ? fullName(previewRecipient) : previewRecipient.name})</h2>
          <div className="newsletter-preview">
            <div className="newsletter-preview-subject">{merge(betreff, previewRecipient) || "(kein Betreff)"}</div>
            <div className="newsletter-preview-body">{merge(nachricht, previewRecipient) || "(keine Nachricht)"}</div>
          </div>
        </div>
      )}

      <button type="button" className="submit-btn" disabled={!canSubmit} onClick={handleSubmit}>
        <FileCheck2 size={16} /> Zusammenfassung erzeugen ({recipients.length} Empfänger)
      </button>
      {!canSubmit && <p className="hint-text">Bitte Betreff, Nachricht und mindestens einen Empfänger angeben.</p>}

      {outputText && (
        <div className="output-box">
          <p className="output-instructions">
            <strong>Fast fertig:</strong> Text unten kopieren und hier im Chat als Nachricht einfügen — ich lege dann die Outlook-Entwürfe an bzw. frage vor dem Versand kurz nach.
          </p>
          <textarea className="output-textarea" readOnly value={outputText} onFocus={(e) => e.target.select()} rows={10} />
          <button type="button" className="copy-btn" onClick={handleCopy}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "Kopiert!" : "Text kopieren"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ===================== Aufgaben-Tab ===================== */
function AufgabenTab({ onTasksChanged, customers }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDone, setShowDone] = useState(false);
  const [mailFor, setMailFor] = useState(null);
  const [mailText, setMailText] = useState("");
  const [copied, setCopied] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const listing = await window.storage.list("task:", true);
      const keys = listing?.keys || [];
      const loaded = [];
      for (const k of keys) { const t = await storageGetJSON(k, true); if (t) loaded.push(t); }
      loaded.sort((a, b) => new Date(a.faelligkeitsdatum) - new Date(b.faelligkeitsdatum));
      setTasks(loaded);
    } catch (e) { setTasks([]); }
    setLoading(false);
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const toggleDone = async (task) => {
    const updated = { ...task, erledigt: !task.erledigt };
    await storageSetJSON(`task:${task.id}`, updated, true);
    await loadTasks();
    if (onTasksChanged) await onTasksChanged();
  };

  const openMail = (task) => {
    const customer = (customers || []).find((c) => c.id === task.customerId);
    const name = customer ? fullName(customer) : task.customerName;
    const email = customer?.email || "";
    const text = "GEBURTSTAGSMAIL — bitte als Outlook-Entwurf anlegen (nicht automatisch versenden):\n" +
      `Empfänger: ${name}${email ? ` <${email}>` : " — keine E-Mail hinterlegt, bitte manuell ergänzen oder Adressat prüfen"}\n` +
      "Betreff: Alles Gute zum Geburtstag!\n\n" +
      `Liebe/r ${name},\n\ndas Team von Callidus wünscht Ihnen alles Gute zum Geburtstag! Wir hoffen, Sie haben einen wunderschönen Tag und noch viele schöne Stunden auf dem Wasser vor sich.\n\nHerzliche Grüße\nIhr Callidus-Team`;
    setMailFor(task.id);
    setMailText(text);
    setCopied(false);
  };
  const copyMail = async () => {
    try { await navigator.clipboard.writeText(mailText); setCopied(true); } catch (e) { setCopied(false); }
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86400000);
  const openTasks = tasks.filter((t) => !t.erledigt);
  const doneTasks = tasks.filter((t) => t.erledigt);
  const overdue = openTasks.filter((t) => new Date(t.faelligkeitsdatum) < startOfToday);
  const dueToday = openTasks.filter((t) => { const d = new Date(t.faelligkeitsdatum); return d >= startOfToday && d < endOfToday; });
  const upcoming = openTasks.filter((t) => new Date(t.faelligkeitsdatum) >= endOfToday);

  const Group = ({ title, list, tone }) => list.length === 0 ? null : (
    <div className="task-group">
      <h3 className={`panel-subtitle task-group-title--${tone}`}>{title} ({list.length})</h3>
      {list.map((t) => (
        <div key={t.id}>
          <div className={`task-row task-row--${tone}`}>
            <button type="button" className="task-check" onClick={() => toggleDone(t)} title={t.erledigt ? "Als offen markieren" : "Als erledigt markieren"}>
              <Check size={14} />
            </button>
            <div className="task-info">
              <span className="task-title">{t.titel}</span>
              <span className="task-sub">{t.customerName} · fällig {new Date(t.faelligkeitsdatum).toLocaleDateString("de-AT")}</span>
            </div>
            {t.titel?.startsWith("Geburtstag") && !t.erledigt && (
              <button type="button" className="btn btn--sm" onClick={() => openMail(t)}>Mail vorbereiten</button>
            )}
          </div>
          {mailFor === t.id && (
            <div className="output-box" style={{ marginTop: -4, marginBottom: 10 }}>
              <p className="output-instructions"><strong>Fast fertig:</strong> Text kopieren und hier im Chat einfügen — daraus lege ich den Outlook-Entwurf an.</p>
              <textarea className="output-textarea" readOnly value={mailText} onFocus={(e) => e.target.select()} rows={7} />
              <button type="button" className="copy-btn" onClick={copyMail}>
                {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Kopiert!" : "Text kopieren"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="panel">
      <h2 className="panel-title"><Check size={18} /> Aufgaben</h2>
      <p className="field-hint" style={{ marginBottom: 14 }}>
        Wird automatisch angelegt, sobald ein Kunde den Status „Offert" bekommt: Erinnerung nach 3, 5 und 14 Werktagen zum Nachfassen. Diese Liste ist die Erinnerung — sie erscheint, sobald du die App öffnest.
      </p>
      {loading ? (
        <div className="uploading"><Loader2 size={14} className="spin" /> Aufgaben werden geladen…</div>
      ) : (
        <>
          {openTasks.length === 0 && <p className="empty-hint">Keine offenen Aufgaben.</p>}
          <Group title="Überfällig" list={overdue} tone="overdue" />
          <Group title="Heute fällig" list={dueToday} tone="today" />
          <Group title="Anstehend" list={upcoming} tone="upcoming" />
          {doneTasks.length > 0 && (
            <>
              <button type="button" className="btn btn--sm" onClick={() => setShowDone((s) => !s)} style={{ marginTop: 14 }}>
                {showDone ? "Erledigte ausblenden" : `Erledigte anzeigen (${doneTasks.length})`}
              </button>
              {showDone && <Group title="Erledigt" list={doneTasks} tone="done" />}
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ===================== Partner-Tab (Vermittler) ===================== */
function PartnerForm({ initial, onCancel, onSave }) {
  const [nummer, setNummer] = useState(initial?.nummer || "");
  const [name, setName] = useState(initial?.name || "");
  const [typ, setTyp] = useState(initial?.typ || "Versicherungsmakler");
  const [bootsbauerTyp, setBootsbauerTyp] = useState(initial?.bootsbauerTyp || []);
  const [iban, setIban] = useState(initial?.iban || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [adresse, setAdresse] = useState(initial?.adresse || "");
  const [plzOrt, setPlzOrt] = useState(initial?.plzOrt || "");

  const toggleBootsbauerTyp = (v) => setBootsbauerTyp((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...initial, nummer: nummer.trim(), name: name.trim(), typ,
      bootsbauerTyp: typ === "Bootsbauer" ? bootsbauerTyp : [],
      iban: iban.trim(), email: email.trim(), adresse: adresse.trim(), plzOrt: plzOrt.trim(),
    });
  };

  return (
    <form className="panel customer-form" onSubmit={submit}>
      <h2 className="panel-title">{initial?.id ? "Partner bearbeiten" : "Neuer Partner"}</h2>
      <div className="field-grid">
        <Field label="Nummer"><input value={nummer} onChange={(e) => setNummer(e.target.value)} /></Field>
        <Field label="Name *" span><input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
        <Field label="Typ">
          <select value={typ} onChange={(e) => setTyp(e.target.value)}>
            {PARTNER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        {typ === "Bootsbauer" && (
          <Field label="Spezialisierung">
            <div className="radio-row">
              <label className={`radio-pill ${bootsbauerTyp.includes("Segelboot") ? "radio-pill--active" : ""}`}>
                <input type="checkbox" checked={bootsbauerTyp.includes("Segelboot")} onChange={() => toggleBootsbauerTyp("Segelboot")} />Segelboot
              </label>
              <label className={`radio-pill ${bootsbauerTyp.includes("Motorboot") ? "radio-pill--active" : ""}`}>
                <input type="checkbox" checked={bootsbauerTyp.includes("Motorboot")} onChange={() => toggleBootsbauerTyp("Motorboot")} />Motorboot
              </label>
            </div>
          </Field>
        )}
        <Field label="IBAN"><input value={iban} onChange={(e) => setIban(e.target.value)} /></Field>
        <Field label="E-Mail"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Adresse"><input value={adresse} onChange={(e) => setAdresse(e.target.value)} /></Field>
        <Field label="PLZ, Stadt"><input value={plzOrt} onChange={(e) => setPlzOrt(e.target.value)} /></Field>
      </div>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn btn--primary">Speichern</button>
      </div>
    </form>
  );
}

function partnerTypeLabel(partner) {
  if (!partner?.typ) return "";
  if (partner.typ === "Bootsbauer" && partner.bootsbauerTyp?.length > 0) {
    return `Bootsbauer (${partner.bootsbauerTyp.join(" & ")})`;
  }
  return partner.typ;
}
function PartnerDetail({ partner, customers, onBack, onEdit, onDelete }) {
  const linkedCustomers = (customers || []).filter((c) => c.partnerId === partner.id);
  return (
    <div className="panel customer-detail">
      <button className="back-link" onClick={onBack}><ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Zurück zur Übersicht</button>
      <div className="detail-head">
        <div>
          <h2 className="panel-title" style={{ marginBottom: 2 }}>{partner.name}</h2>
          <span className="result-subtitle">{partner.nummer ? `Partner-Nr. ${partner.nummer} · ` : ""}{partnerTypeLabel(partner)}</span>
        </div>
        <div className="detail-actions">
          <button className="btn" onClick={() => onEdit(partner)}>Bearbeiten</button>
          <button className="btn btn--danger" onClick={() => onDelete(partner.id)}>Löschen</button>
        </div>
      </div>

      <div className="detail-grid">
        {partner.email && <div><span className="detail-label">E-Mail</span><span>{partner.email}</span></div>}
        {partner.iban && <div><span className="detail-label">IBAN</span><span>{partner.iban}</span></div>}
        {partner.adresse && <div><span className="detail-label">Adresse</span><span>{partner.adresse}</span></div>}
        {partner.plzOrt && <div><span className="detail-label">PLZ, Stadt</span><span>{partner.plzOrt}</span></div>}
      </div>

      {linkedCustomers.length > 0 && (() => {
        const polizzeCount = linkedCustomers.filter((c) => c.status === "polizze").length;
        const gesamtpraemie = linkedCustomers.reduce((sum, c) => sum + (c.vertraege || []).reduce((s, v) => s + vertragTotal(v), 0), 0);
        const quote = Math.round((polizzeCount / linkedCustomers.length) * 100);
        return (
          <div className="partner-stats">
            <div className="partner-stat"><span className="partner-stat-value">{linkedCustomers.length}</span><span className="partner-stat-label">Kunden gebracht</span></div>
            <div className="partner-stat"><span className="partner-stat-value">{quote}%</span><span className="partner-stat-label">davon Polizze ({polizzeCount})</span></div>
            <div className="partner-stat"><span className="partner-stat-value">{euro(gesamtpraemie)}</span><span className="partner-stat-label">Prämie / Jahr generiert</span></div>
          </div>
        );
      })()}

      <h3 className="panel-subtitle"><Users size={15} /> Verlinkte Kunden ({linkedCustomers.length})</h3>
      {linkedCustomers.length === 0 ? (
        <p className="empty-hint">Noch kein Kunde mit diesem Partner verlinkt — im Kundenformular unter „Partner / Vermittler" auswählbar.</p>
      ) : (
        <div className="newsletter-recipient-list">
          {linkedCustomers.map((c) => (
            <div key={c.id} className="newsletter-recipient-row" style={{ cursor: "default" }}>
              <span className="newsletter-recipient-name">{fullName(c)}</span>
              <span className="newsletter-recipient-email">{c.bootsname || c.bootstyp || ""}</span>
              {c.provision != null && <span className="tab-badge" style={{ background: "var(--sea)" }}>{c.provision}%</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PartnerImport({ onImported }) {
  const [rawText, setRawText] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setMsg("");
    let data;
    try {
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/) || rawText.match(/(\[[\s\S]*\])/);
      data = JSON.parse(jsonMatch ? jsonMatch[1] : rawText);
    } catch (e) {
      setMsg("Konnte den Text nicht als JSON lesen.");
      return;
    }
    const list = Array.isArray(data) ? data : [data];
    setBusy(true);
    try {
      const listing = await window.storage.list("partner:", true);
      const all = [];
      for (const k of listing?.keys || []) { const p = await storageGetJSON(k, true); if (p) all.push(p); }
      let created = 0, updated = 0;
      for (const entry of list) {
        if (!entry.name) continue;
        const existing = all.find((p) => p.name.trim().toLowerCase() === String(entry.name).trim().toLowerCase());
        const id = existing?.id || uid();
        const record = {
          id, nummer: entry.nummer ?? existing?.nummer ?? "", name: entry.name,
          typ: entry.typ || existing?.typ || "Versicherungsmakler",
          bootsbauerTyp: entry.bootsbauerTyp || existing?.bootsbauerTyp || [],
          iban: entry.iban || existing?.iban || "", email: entry.email || existing?.email || "",
          adresse: entry.adresse || existing?.adresse || "", plzOrt: entry.plzOrt || existing?.plzOrt || "",
        };
        await storageSetJSON(`partner:${id}`, record, true);
        if (existing) updated++; else created++;
      }
      setMsg(`${created} Partner neu angelegt, ${updated} aktualisiert.`);
      setRawText("");
      if (onImported) await onImported();
    } catch (e) {
      setMsg("Import fehlgeschlagen: " + (e?.message || "unbekannter Fehler"));
    }
    setBusy(false);
  };

  return (
    <div className="panel">
      <h2 className="panel-title"><Upload size={18} /> Partner importieren</h2>
      <p className="import-hint">JSON-Array mit Partnerdaten hier einfügen (Abgleich über den Namen — vorhandene Partner werden aktualisiert, neue angelegt).</p>
      <textarea className="import-textarea" rows={6} placeholder="Hier einfügen…" value={rawText} onChange={(e) => setRawText(e.target.value)} />
      <div className="form-actions" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="btn btn--primary" onClick={run} disabled={!rawText.trim() || busy}>
          {busy ? <Loader2 size={14} className="spin" /> : <Upload size={14} />} Importieren
        </button>
      </div>
      {msg && <div className="save-confirm" style={{ marginTop: 10 }}><Check size={14} /> {msg}</div>}
    </div>
  );
}

function PartnerTab({ customers }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState({ mode: "list" });
  const [search, setSearch] = useState("");
  const [typFilter, setTypFilter] = useState("alle");
  const [showImport, setShowImport] = useState(false);

  const loadPartners = useCallback(async () => {
    setLoading(true);
    try {
      const listing = await window.storage.list("partner:", true);
      const keys = listing?.keys || [];
      const loaded = [];
      for (const k of keys) { const p = await storageGetJSON(k, true); if (p) loaded.push(p); }
      loaded.sort((a, b) => (a.name || "").localeCompare(b.name || "", "de"));
      setPartners(loaded);
    } catch (e) { setPartners([]); }
    setLoading(false);
  }, []);

  useEffect(() => { loadPartners(); }, [loadPartners]);

  const savePartner = async (data) => {
    const id = data.id || uid();
    const record = { ...data, id };
    await storageSetJSON(`partner:${id}`, record, true);
    await loadPartners();
    setView({ mode: "detail", id });
  };

  const deletePartner = async (id) => {
    if (!window.confirm("Partner wirklich löschen? (Verlinkte Kunden bleiben erhalten, verlieren aber die Zuordnung.)")) return;
    try { await window.storage.delete(`partner:${id}`, true); } catch (e) {}
    await loadPartners();
    setView({ mode: "list" });
  };

  const filtered = partners.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) &&
    (typFilter === "alle" || p.typ === typFilter)
  );

  if (view.mode === "form") {
    return <PartnerForm initial={view.data} onCancel={() => setView(view.data?.id ? { mode: "detail", id: view.data.id } : { mode: "list" })} onSave={savePartner} />;
  }
  if (view.mode === "detail") {
    const partner = partners.find((p) => p.id === view.id);
    if (!partner) { setView({ mode: "list" }); return null; }
    return (
      <PartnerDetail
        partner={partner} customers={customers}
        onBack={() => setView({ mode: "list" })}
        onEdit={(p) => setView({ mode: "form", data: p })}
        onDelete={deletePartner}
      />
    );
  }

  return (
    <div className="panel">
      <div className="list-head">
        <div className="search-box">
          <Search size={15} />
          <input placeholder="Partner suchen…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={typFilter} onChange={(e) => setTypFilter(e.target.value)} className="partner-typ-filter">
          <option value="alle">Alle Typen</option>
          {PARTNER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="btn" onClick={() => setShowImport((s) => !s)}>{showImport ? "Import ausblenden" : "Importieren"}</button>
        <button className="btn btn--primary" onClick={() => setView({ mode: "form" })}><Plus size={15} /> Neuer Partner</button>
      </div>

      {showImport && <div style={{ marginTop: 14 }}><PartnerImport onImported={loadPartners} /></div>}

      {loading ? (
        <div className="uploading" style={{ marginTop: 14 }}><Loader2 size={14} className="spin" /> Partner werden geladen…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={28} />
          <p>{partners.length === 0 ? "Noch keine Partner angelegt." : "Keine Treffer."}</p>
        </div>
      ) : (
        <div className="customer-list">
          {[...filtered]
            .map((p) => ({ p, count: (customers || []).filter((c) => c.partnerId === p.id).length }))
            .sort((a, b) => b.count - a.count || a.p.name.localeCompare(b.p.name, "de"))
            .map(({ p, count }) => (
              <button key={p.id} className="customer-row" onClick={() => setView({ mode: "detail", id: p.id })}>
                <div className="customer-row-main">
                  <span className="customer-row-name">{p.name}</span>
                  <span className="customer-row-sub">{partnerTypeLabel(p)}{(p.email || p.plzOrt) ? ` · ${[p.email, p.plzOrt].filter(Boolean).join(" · ")}` : ""}</span>
                </div>
                {count > 0 && <span className="tab-badge" style={{ background: "var(--sea)" }}>{count} Kunde{count === 1 ? "" : "n"}</span>}
                <ChevronRight size={16} />
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

/* ===================== App-Shell ===================== */
export default function App() {
  const [tab, setTab] = useState("kunden");
  const [customersForRechner, setCustomersForRechner] = useState([]);
  const [partnersForApp, setPartnersForApp] = useState([]);
  const [dueTaskCount, setDueTaskCount] = useState(0);

  const refreshCustomerList = useCallback(async () => {
    try {
      const listing = await window.storage.list("customer:", true);
      const keys = listing?.keys || [];
      const loaded = [];
      for (const k of keys) {
        const c = await storageGetJSON(k, true);
        if (c) loaded.push(c);
      }
      loaded.sort((a, b) => customerSortKey(a).localeCompare(customerSortKey(b), "de"));
      setCustomersForRechner(loaded);
      await pruefeGeburtstage(loaded);
    } catch (e) {}
  }, []);

  const refreshPartnerList = useCallback(async () => {
    try {
      const listing = await window.storage.list("partner:", true);
      const keys = listing?.keys || [];
      const loaded = [];
      for (const k of keys) {
        const p = await storageGetJSON(k, true);
        if (p) loaded.push(p);
      }
      loaded.sort((a, b) => (a.name || "").localeCompare(b.name || "", "de"));
      setPartnersForApp(loaded);
    } catch (e) {}
  }, []);

  const refreshTaskCount = useCallback(async () => {
    try {
      const listing = await window.storage.list("task:", true);
      const keys = listing?.keys || [];
      const now = new Date();
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      let count = 0;
      for (const k of keys) {
        const t = await storageGetJSON(k, true);
        if (t && !t.erledigt && new Date(t.faelligkeitsdatum) < endOfToday) count++;
      }
      setDueTaskCount(count);
    } catch (e) {}
  }, []);

  useEffect(() => { refreshCustomerList(); refreshPartnerList(); refreshTaskCount(); }, [refreshCustomerList, refreshPartnerList, refreshTaskCount, tab]);

  const saveQuoteToCustomer = async (customerId, quote) => {
    const c = await storageGetJSON(`customer:${customerId}`, true);
    if (!c) return;
    const updated = { ...c, quotes: [quote, ...(c.quotes || [])].slice(0, 20) };
    await storageSetJSON(`customer:${customerId}`, updated, true);
  };

  return (
    <div className="app-root">
      <style>{CSS}</style>
      <header className="app-header">
        <div className="brand">
          <img src="data:image/png;base64,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" alt="Callidus" className="brand-mark" />
          <span>Callidus <span className="brand-sub-inline">Boots-CRM</span></span>
        </div>
        <nav className="tabnav">
          <button className={tab === "kunden" ? "tab tab--active" : "tab"} onClick={() => setTab("kunden")}><Users size={15} /> Kunden</button>
          <button className={tab === "newsletter" ? "tab tab--active" : "tab"} onClick={() => setTab("newsletter")}><Mail size={15} /> Newsletter</button>
          <button className={tab === "rechner" ? "tab tab--active" : "tab"} onClick={() => setTab("rechner")}><Calculator size={15} /> Prämienrechner</button>
          <button className={tab === "aufgaben" ? "tab tab--active" : "tab"} onClick={() => setTab("aufgaben")}>
            <Check size={15} /> Aufgaben
            {dueTaskCount > 0 && <span className="tab-badge">{dueTaskCount}</span>}
          </button>
          <button className={tab === "partner" ? "tab tab--active" : "tab"} onClick={() => setTab("partner")}><Users size={15} /> Partner</button>
          <button className={tab === "import" ? "tab tab--active" : "tab"} onClick={() => setTab("import")}><Mail size={15} /> Import</button>
          <button className={tab === "nautima" ? "tab tab--active" : "tab"} onClick={() => setTab("nautima")}><FileCheck2 size={15} /> NAUTIMA-Antrag</button>
          <button className={tab === "bootsdatenblatt" ? "tab tab--active" : "tab"} onClick={() => setTab("bootsdatenblatt")}><FileText size={15} /> Bootsdatenblatt</button>
        </nav>
      </header>

      <div className="info-banner">
        <Info size={14} />
        <span>Prototyp · Kunden- und Dokumentdaten werden geräteübergreifend geteilt gespeichert (alle Nutzer dieser App sehen dieselben Daten). Datengrundlage: NAUTIMA-Tarif (Stand 12/2024) und interner Callidus-Entwurf (Stand 01/2026) — siehe Hinweise im Quellcode zu Datenlücken. Die Antrags-/Bootsdatenblatt-Tabs erzeugen einen Text zum Kopieren — dieser wird hier im Chat eingefügt, damit daraus das fertige PDF entsteht.</span>
      </div>

      <main className="app-main">
        {tab === "kunden" && <KundenTab partners={partnersForApp} />}
        {tab === "partner" && <PartnerTab customers={customersForRechner} />}
        {tab === "rechner" && (
          <RechnerTab
            customers={customersForRechner}
            onSaveToCustomer={saveQuoteToCustomer}
            onCustomersChanged={refreshCustomerList}
          />
        )}
        {tab === "import" && <ImportTab />}
        {tab === "nautima" && <NautimaAntragTab customers={customersForRechner} onCustomersChanged={refreshCustomerList} />}
        {tab === "bootsdatenblatt" && <CallidusDatenblattTab customers={customersForRechner} onCustomersChanged={refreshCustomerList} />}
        {tab === "newsletter" && <NewsletterTab customers={customersForRechner} partners={partnersForApp} />}
        {tab === "aufgaben" && <AufgabenTab onTasksChanged={refreshTaskCount} customers={customersForRechner} />}
      </main>
    </div>
  );
}

/* ===================== Styling ===================== */
const CSS = `
:root {
  --ink: #032856;
  --ink-soft: #41505A;
  --paper: #F4F5F7;
  --paper-raised: #FFFFFF;
  --line: rgba(3,40,86,0.14);
  --brass: #0F6EBE;
  --brass-dark: #0B5695;
  --sea: #41505A;
  --danger: #B3432B;
  --danger-bg: #FBEBE6;
  font-family: "Avenir Next LT Pro", "Avenir Next", Avenir, "Century Gothic", -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
}
* { box-sizing: border-box; }
.app-root { background: var(--paper); color: var(--ink); min-height: 100%; padding-bottom: 40px; }
.app-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px; border-bottom: 1px solid var(--line); background: var(--paper-raised);
}
.brand { display: flex; align-items: center; gap: 10px; font-family: "Avenir Next LT Pro", "Avenir Next", Avenir, "Century Gothic", sans-serif; font-size: 20px; font-weight: 700; letter-spacing: 0.01em; color: var(--ink); white-space: nowrap; flex-shrink: 0; }
.brand-mark { height: 30px; width: auto; display: block; }
.brand-sub-inline { font-weight: 500; color: var(--ink-soft); font-size: 0.75em; }
.tabnav {
  display: flex; gap: 4px; background: var(--paper); border: 1px solid var(--line); border-radius: 10px; padding: 3px;
  overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; -ms-overflow-style: none;
}
.tabnav::-webkit-scrollbar { display: none; }
.tab { display: flex; align-items: center; gap: 6px; border: none; background: transparent; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; color: var(--ink-soft); cursor: pointer; white-space: nowrap; flex-shrink: 0; }
.tab-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 17px; height: 17px; padding: 0 4px; border-radius: 999px; background: var(--danger); color: #fff; font-size: 10.5px; font-weight: 700; }

.task-group { margin-top: 14px; }
.task-group:first-of-type { margin-top: 0; }
.task-group-title--overdue { color: var(--danger); }
.task-group-title--today { color: var(--brass-dark); }
.task-group-title--upcoming { color: var(--sea); }
.task-group-title--done { color: var(--ink-soft); }
.task-row { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border: 1px solid var(--line); border-radius: 9px; margin-bottom: 6px; background: var(--paper); }
.task-row--overdue { border-color: var(--danger); background: var(--danger-bg); }
.task-row--done { opacity: 0.6; }
.task-check { flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid var(--line); background: var(--paper-raised); color: var(--ink-soft); display: flex; align-items: center; justify-content: center; cursor: pointer; }
.task-row--done .task-check { background: var(--sea); border-color: var(--sea); color: #fff; }
.task-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.task-title { font-size: 13px; font-weight: 700; color: var(--ink); }
.task-sub { font-size: 11.5px; color: var(--ink-soft); }
.tab--active { background: var(--ink); color: var(--paper); }
.info-banner {
  display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--ink-soft);
  padding: 8px 24px; border-bottom: 1px dashed var(--line); background: rgba(184,135,58,0.08);
}
.app-main { max-width: 1180px; margin: 0 auto; padding: 24px; }
.panel { background: var(--paper-raised); border: 1px solid var(--line); border-radius: 14px; padding: 20px 22px; }
.panel-title { font-family: "Avenir Next LT Pro", "Avenir Next", Avenir, "Century Gothic", sans-serif; font-weight: 700; font-size: 18px; margin: 0 0 14px; display: flex; align-items: center; gap: 8px; }
.panel-subtitle { font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--sea); font-weight: 700; margin: 18px 0 8px; display: flex; align-items: center; gap: 6px; }

.rechner-grid { display: grid; grid-template-columns: 1.15fr 1fr; gap: 20px; align-items: start; }
@media (max-width: 900px) { .rechner-grid { grid-template-columns: 1fr; } }

.segmented { display: flex; gap: 6px; margin-bottom: 16px; }
.seg-btn { flex: 1; padding: 9px; border-radius: 9px; border: 1px solid var(--line); background: var(--paper); font-size: 13px; font-weight: 600; color: var(--ink-soft); cursor: pointer; }
.seg-btn--active { background: var(--ink); color: var(--paper); border-color: var(--ink); }

.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 14px; }
.field { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; color: var(--ink-soft); font-weight: 600; }
.field--wide { grid-column: 1 / -1; }
.field input, .field select, .customer-form input, .customer-form select, .customer-form textarea {
  font: inherit; font-size: 13.5px; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--line);
  background: var(--paper); color: var(--ink); font-variant-numeric: tabular-nums;
}
.field-hint { font-weight: 400; font-size: 11px; color: var(--ink-soft); }
.checkbox-field { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink); padding: 6px 0; }
.checkbox-list { display: flex; flex-direction: column; gap: 2px; margin-top: 8px; }
.advanced { margin-top: 14px; border-top: 1px dashed var(--line); padding-top: 10px; }
.advanced summary { cursor: pointer; font-size: 12.5px; font-weight: 700; color: var(--sea); }

.results { display: flex; flex-direction: column; gap: 16px; }
.result-card { padding: 18px 20px; }
.result-head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--line); padding-bottom: 12px; margin-bottom: 10px; }
.result-title { font-family: "Avenir Next LT Pro", "Avenir Next", Avenir, "Century Gothic", sans-serif; font-weight: 700; font-size: 17px; margin: 0; }
.result-subtitle { font-size: 11.5px; color: var(--ink-soft); }
.result-total { text-align: right; }
.result-total-label { display: block; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-soft); }
.result-total-value { font-family: "SF Mono", "Roboto Mono", Consolas, monospace; font-size: 22px; font-weight: 700; color: var(--brass-dark); }
.result-section { margin-top: 10px; }
.result-section-title { font-size: 11.5px; font-weight: 700; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }

.leader-row { display: flex; align-items: baseline; gap: 6px; font-size: 12.5px; padding: 3px 0; color: var(--ink-soft); }
.leader-label { white-space: nowrap; }
.leader-fill { flex: 1; border-bottom: 1px dotted var(--line); margin-bottom: 3px; }
.leader-value { font-family: "SF Mono", "Roboto Mono", Consolas, monospace; white-space: nowrap; color: var(--ink); }
.leader-value--neg { color: var(--sea); }
.leader-row--strong { font-weight: 700; color: var(--ink); font-size: 13.5px; }
.leader-row--strong .leader-value { font-size: 14.5px; }

.warn-stack { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
.warnbox { display: flex; gap: 8px; font-size: 12px; background: var(--danger-bg); color: var(--danger); border-radius: 8px; padding: 8px 10px; }
.note-line { display: flex; gap: 6px; font-size: 11.5px; color: var(--sea); background: rgba(28,107,95,0.08); border-radius: 7px; padding: 6px 9px; margin-bottom: 4px; line-height: 1.4; }

.save-panel { padding: 16px 20px; }
.save-row { display: flex; gap: 8px; }
.save-row select { flex: 1; font: inherit; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--line); background: var(--paper); }
.save-confirm { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--sea); margin-top: 8px; }

.btn { font: inherit; font-size: 13px; font-weight: 600; padding: 9px 16px; border-radius: 9px; border: 1px solid var(--line); background: var(--paper); color: var(--ink); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.btn--primary { background: var(--brass); border-color: var(--brass); color: #fff; }
.btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--doc { width: 100%; justify-content: center; border-style: dashed; color: var(--sea); border-color: var(--sea); background: rgba(28,107,95,0.06); margin-top: -4px; }
.btn--doc:hover { background: rgba(28,107,95,0.12); }
.embed-panel { margin-top: 20px; border: 1.5px solid var(--sea); }
.embed-panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.btn--danger { border-color: var(--danger); color: var(--danger); background: transparent; }

.list-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; }
.search-box { display: flex; align-items: center; gap: 8px; border: 1px solid var(--line); border-radius: 9px; padding: 8px 12px; flex: 1; max-width: 340px; background: var(--paper); color: var(--ink-soft); }
.search-box input { border: none; background: transparent; outline: none; font: inherit; font-size: 13px; flex: 1; color: var(--ink); }

.customer-list { display: flex; flex-direction: column; gap: 6px; }
.customer-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--line); background: var(--paper); cursor: pointer; text-align: left; font: inherit; color: var(--ink); }
.customer-row:hover { border-color: var(--brass); }
.customer-row-main { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.customer-row-name { font-weight: 700; font-size: 14px; }
.customer-row-sub { font-size: 12px; color: var(--ink-soft); }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px 0; color: var(--ink-soft); }

.form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
.back-link { display: flex; align-items: center; gap: 4px; border: none; background: none; color: var(--sea); font-size: 12.5px; font-weight: 700; cursor: pointer; padding: 0 0 12px; }
.detail-head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--line); padding-bottom: 14px; margin-bottom: 14px; }
.subtabnav { display: flex; gap: 4px; border-bottom: 1px solid var(--line); margin-bottom: 16px; }
.subtab { display: flex; align-items: center; gap: 6px; padding: 9px 14px; border: none; background: none; font: inherit; font-size: 13px; font-weight: 600; color: var(--ink-soft); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.subtab--active { color: var(--brass); border-bottom-color: var(--brass); }

.ziel-panel { background: var(--ink); border-radius: 14px; padding: 18px 20px; margin-bottom: 16px; color: #fff; }
.ziel-row { display: flex; gap: 28px; flex-wrap: wrap; }
.ziel-goal { flex: 1; min-width: 220px; display: flex; flex-direction: column; gap: 6px; }
.ziel-goal-head { display: flex; justify-content: space-between; align-items: center; }
.ziel-label { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: rgba(255,255,255,0.65); }
.ziel-edit-link { background: none; border: none; color: rgba(255,255,255,0.65); font-size: 11px; text-decoration: underline; cursor: pointer; font: inherit; padding: 0; }
.ziel-edit { display: flex; gap: 6px; align-items: center; }
.ziel-edit input { border-radius: 6px; border: none; padding: 4px 6px; font: inherit; }
.ziel-progress-row { display: flex; align-items: center; gap: 10px; }
.ziel-count { font-family: "SF Mono", "Roboto Mono", Consolas, monospace; font-size: 24px; font-weight: 800; color: #fff; white-space: nowrap; }
.ziel-count--reached { color: #6FE3A6; }
.ziel-progress-track { flex: 1; height: 8px; border-radius: 999px; background: rgba(255,255,255,0.18); overflow: hidden; }
.ziel-progress-fill { display: block; height: 100%; background: #0F6EBE; border-radius: 999px; transition: width 0.3s; }
.ziel-check { color: #6FE3A6; flex-shrink: 0; }
.ziel-hint { font-size: 11px; color: rgba(255,255,255,0.55); }
.ziel-funnel { flex: 1.4; min-width: 280px; display: flex; flex-direction: column; gap: 8px; }
.funnel-row { display: flex; align-items: center; gap: 6px; }
.funnel-stage { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 8px 12px; border-radius: 8px; background: rgba(255,255,255,0.08); border: 1.5px solid var(--stage-color); flex: 1; }
.funnel-count { font-family: "SF Mono", "Roboto Mono", Consolas, monospace; font-size: 18px; font-weight: 800; color: #fff; }
.funnel-name { font-size: 10px; color: rgba(255,255,255,0.65); font-weight: 600; }
.funnel-arrow { display: flex; flex-direction: column; align-items: center; font-size: 13px; color: rgba(255,255,255,0.4); flex-shrink: 0; }
.funnel-rate { font-size: 10px; color: #8FC3EA; font-weight: 700; }
.pipeline-bar { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.quicklead-form { background: var(--paper); border: 1.5px dashed var(--brass); margin-bottom: 16px; padding: 14px 16px; }
.quicklead-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.quicklead-row input, .quicklead-row select { flex: 1; min-width: 140px; font: inherit; font-size: 13px; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--line); background: var(--paper-raised); color: var(--ink); }
.partner-stats { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.vergleich-panel { border: 1px solid var(--line); margin-bottom: 16px; }
.vergleich-table { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
.vergleich-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 9px; border: 1px solid var(--line); background: var(--paper); }
.vergleich-row--vor { border-style: dashed; }
.vergleich-row--best { border-color: var(--sea); background: rgba(28,107,95,0.08); }
.vergleich-name { font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 8px; }
.vergleich-best-tag { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 800; color: #fff; background: var(--sea); padding: 2px 7px; border-radius: 999px; }
.vergleich-betrag { font-family: "SF Mono", "Roboto Mono", Consolas, monospace; font-size: 16px; font-weight: 800; color: var(--ink); }
.vergleich-unit { font-size: 10px; font-weight: 500; color: var(--ink-soft); font-family: inherit; }
.vergleich-missing { font-size: 11.5px; color: var(--ink-soft); font-style: italic; }
.vergleich-savings { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 10px 14px; border-radius: 9px; font-size: 13px; }
.vergleich-savings--good { background: rgba(28,107,95,0.1); color: var(--sea); }
.vergleich-savings--bad { background: var(--danger-bg); color: var(--danger); }

.historie-form { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.historie-form select { flex-shrink: 0; width: 110px; font: inherit; font-size: 13px; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--line); background: var(--paper); color: var(--ink); }
.historie-form input { flex: 1; min-width: 200px; font: inherit; font-size: 13px; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--line); background: var(--paper); color: var(--ink); }
.historie-list { display: flex; flex-direction: column; gap: 2px; }
.historie-item { display: flex; gap: 10px; padding: 10px 4px; border-bottom: 1px dashed var(--line); }
.historie-item--system { opacity: 0.75; }
.historie-icon { flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; background: var(--paper); border: 1px solid var(--line); display: flex; align-items: center; justify-content: center; color: var(--sea); margin-top: 1px; }
.historie-item--system .historie-icon { color: var(--ink-soft); }
.historie-body { flex: 1; min-width: 0; }
.historie-meta { display: flex; gap: 8px; align-items: baseline; }
.historie-typ { font-size: 11.5px; font-weight: 700; color: var(--ink); }
.historie-datum { font-size: 10.5px; color: var(--ink-soft); }
.historie-text { font-size: 13px; color: var(--ink); margin: 2px 0 0; line-height: 1.4; }
.partner-stat { flex: 1; min-width: 110px; background: var(--paper); border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; display: flex; flex-direction: column; gap: 2px; }
.partner-stat-value { font-family: "SF Mono", "Roboto Mono", Consolas, monospace; font-size: 18px; font-weight: 800; color: var(--ink); }
.partner-stat-label { font-size: 10.5px; color: var(--ink-soft); font-weight: 600; }
.pipeline-chip { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 8px 14px; border-radius: 10px; border: 1.5px solid var(--line); background: var(--paper); cursor: pointer; font: inherit; min-width: 84px; }
.pipeline-chip-count { font-size: 18px; font-weight: 800; font-family: "SF Mono", "Roboto Mono", Consolas, monospace; color: var(--chip-color, var(--ink)); }
.pipeline-chip-label { font-size: 11px; color: var(--ink-soft); font-weight: 600; }
.pipeline-chip--active { border-color: var(--chip-color, var(--ink)); background: var(--paper-raised); box-shadow: 0 0 0 1px var(--chip-color, var(--ink)); }

.nextstep-banner { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; background: rgba(15,110,190,0.08); border: 1px solid rgba(15,110,190,0.3); border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; }
.nextstep-banner--done { background: rgba(3,40,86,0.06); border-color: rgba(3,40,86,0.2); }
.nextstep-label { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 800; color: var(--brass); flex-shrink: 0; }
.nextstep-text { font-size: 12.5px; color: var(--ink); flex: 1; min-width: 180px; }
.nextstep-actions { display: flex; gap: 8px; flex-shrink: 0; }
.nextstep-link { background: none; border: none; padding: 0; color: var(--brass); font-weight: 700; text-decoration: underline; cursor: pointer; font: inherit; font-size: inherit; }
.boat-card { border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; background: var(--paper); }
.boat-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.boat-card-title { display: flex; align-items: center; gap: 7px; font-weight: 700; font-size: 13.5px; }
.boat-card-actions { display: flex; align-items: center; gap: 4px; }
.detail-actions { display: flex; gap: 8px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; font-size: 13px; margin-bottom: 10px; }
.detail-label { display: block; font-size: 10.5px; text-transform: uppercase; color: var(--ink-soft); letter-spacing: 0.05em; }
.detail-notes { font-size: 13px; color: var(--ink-soft); background: var(--paper); border-radius: 8px; padding: 10px 12px; }

.quotes-block { margin-top: 14px; }
.antrag-card { border: 1px solid var(--line); border-radius: 10px; margin-bottom: 8px; overflow: hidden; background: var(--paper); }
.antrag-card-head { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: none; border: none; cursor: pointer; font: inherit; color: var(--ink); text-align: left; }
.antrag-card-title { display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 700; }
.antrag-card-date { font-weight: 400; color: var(--ink-soft); }
.antrag-card-body { padding: 4px 14px 14px; border-top: 1px solid var(--line); background: var(--paper-raised); }
.payload-group { display: flex; flex-direction: column; gap: 2px; }
.payload-subsection { margin-top: 10px; padding-left: 10px; border-left: 2px solid var(--line); }
.payload-subsection-title { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--sea); font-weight: 700; margin: 6px 0 4px; }
.payload-row { display: flex; justify-content: space-between; gap: 12px; font-size: 12.5px; padding: 3px 0; border-bottom: 1px dashed var(--line); }
.payload-row span:first-child { color: var(--ink-soft); }
.payload-row span:last-child { text-align: right; font-family: "SF Mono", "Roboto Mono", Consolas, monospace; }
.payload-array { display: flex; flex-direction: column; gap: 6px; }
.payload-array-item { padding: 6px 8px; background: var(--paper); border-radius: 6px; border: 1px solid var(--line); }
.quote-row { display: flex; justify-content: space-between; font-size: 12px; padding: 6px 0; border-bottom: 1px dashed var(--line); color: var(--ink-soft); }

.risk-table { display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; margin-bottom: 4px; }
.risk-row { display: flex; justify-content: space-between; gap: 10px; padding: 7px 12px; font-size: 12.5px; border-bottom: 1px solid var(--line); }
.risk-row:last-child { border-bottom: none; }
.risk-row span:first-child { color: var(--ink-soft); font-weight: 600; }
.risk-row:nth-child(even) { background: var(--paper); }

.insurer-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 7px; font-size: 11px; font-weight: 700; color: #fff; letter-spacing: 0.02em; white-space: nowrap; }
.vertrag-card { border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; background: var(--paper); }
.vertrag-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
.vertrag-head-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.vertrag-polnr { font-size: 11.5px; color: var(--ink-soft); font-family: "SF Mono", "Roboto Mono", Consolas, monospace; }
.vertrag-total { font-family: "SF Mono", "Roboto Mono", Consolas, monospace; font-size: 15px; font-weight: 700; color: var(--ink); white-space: nowrap; }
.vertrag-total-label { font-size: 10.5px; font-weight: 500; color: var(--ink-soft); font-family: inherit; }
.vertrag-meta { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: 11.5px; color: var(--ink-soft); margin-bottom: 8px; }
.sparten-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.sparten-table th { text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-soft); padding: 4px 8px 4px 0; border-bottom: 1px solid var(--line); }
.sparten-table td { padding: 5px 8px 5px 0; border-bottom: 1px dashed var(--line); font-family: "SF Mono", "Roboto Mono", Consolas, monospace; }
.sparten-table tbody tr:last-child td { border-bottom: none; }
.sparten-polnr { color: var(--ink-soft); font-size: 10.5px; }
.sparten-erst { color: var(--ink-soft); font-size: 10.5px; }
.sparten-total-row td { border-top: 1.5px solid var(--ink); border-bottom: none !important; font-weight: 700; color: var(--ink); padding-top: 7px; }
.vertrag-notes { font-size: 12px; color: var(--ink-soft); margin: 8px 0 0; }
.vertrag-link { font-size: 11.5px; color: var(--sea); font-weight: 600; display: inline-block; margin-top: 6px; }
.section-head-row { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.vertraege-summary { font-size: 12px; color: var(--ink-soft); font-weight: 600; }
.form-hint { font-size: 11.5px; color: var(--ink-soft); margin: 4px 0 0; }
.quote-values { font-family: "SF Mono", "Roboto Mono", Consolas, monospace; color: var(--ink); }

.dropzone { display: flex; flex-direction: column; align-items: center; gap: 4px; border: 1.5px dashed var(--line); border-radius: 12px; padding: 24px; text-align: center; color: var(--ink-soft); cursor: pointer; font-size: 13px; margin-top: 6px; }
.dropzone:hover { border-color: var(--brass); color: var(--brass-dark); }
.dropzone-hint { font-size: 11px; }
.dropzone-extract-hint { display: flex; gap: 6px; font-size: 11.5px; color: var(--ink-soft); margin: 6px 0 0; line-height: 1.4; }

.newsletter-actions { display: flex; gap: 8px; margin-bottom: 10px; }
.partner-typ-filter { border: 1px solid var(--line); border-radius: 9px; padding: 8px 10px; background: var(--paper); color: var(--ink); font: inherit; font-size: 13px; }
.newsletter-recipient-list { display: flex; flex-direction: column; gap: 4px; max-height: 320px; overflow-y: auto; }
.newsletter-recipient-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); font-size: 12.5px; cursor: pointer; }
.newsletter-recipient-name { font-weight: 700; flex-shrink: 0; }
.newsletter-recipient-email { color: var(--ink-soft); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.newsletter-preview { border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
.newsletter-preview-subject { background: var(--ink); color: var(--paper); font-weight: 700; padding: 10px 14px; font-size: 13px; }
.newsletter-preview-body { padding: 14px; font-size: 13px; white-space: pre-wrap; line-height: 1.5; background: var(--paper-raised); }
.uploading { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--ink-soft); padding: 8px 0; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.doc-list { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
.doc-row { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border: 1px solid var(--line); border-radius: 9px; background: var(--paper); }
.doc-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.doc-name { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.doc-meta { font-size: 11px; color: var(--ink-soft); }
.icon-btn { border: none; background: transparent; color: var(--ink-soft); cursor: pointer; padding: 4px; border-radius: 6px; display: flex; }
.icon-btn:hover { background: var(--line); color: var(--ink); }
.icon-btn--danger:hover { color: var(--danger); }
.empty-hint { font-size: 12.5px; color: var(--ink-soft); }

.status-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; color: #fff; white-space: nowrap; }
.status-badge--none { background: var(--line); color: var(--ink-soft); }
.status-select { font: inherit; font-size: 12.5px; font-weight: 600; padding: 8px 10px; border-radius: 9px; border: 1px solid var(--line); background: var(--paper); color: var(--ink); }

.import-hint { font-size: 13px; color: var(--ink-soft); margin-bottom: 10px; }
.import-textarea { width: 100%; font-family: "SF Mono", "Roboto Mono", Consolas, monospace; font-size: 11.5px; padding: 10px; border-radius: 8px; border: 1px solid var(--line); background: var(--paper); color: var(--ink); resize: vertical; }
.import-review { border-top: 1px dashed var(--line); margin-top: 16px; padding-top: 4px; }
.import-batch-head { display: flex; justify-content: space-between; align-items: center; }
.import-item { border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; margin-top: 10px; background: var(--paper); }
.import-item--done { opacity: 0.75; }

/* ---- Formular-Tabs (NAUTIMA-Antrag, Bootsdatenblatt) ---- */
.form-tab { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
.info-banner--inline { border: 1px solid var(--line); border-radius: 10px; background: rgba(184,135,58,0.08); margin: 0; }
.mini-title { font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--sea); font-weight: 700; margin: 14px 0 8px; }
.radio-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.radio-pill { display: flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 999px; border: 1px solid var(--line); font-size: 12.5px; cursor: pointer; color: var(--ink-soft); }
.radio-pill input { display: none; }
.radio-pill--active { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.repeat-list { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
.repeat-list input { font: inherit; font-size: 13px; padding: 7px 9px; border-radius: 7px; border: 1px solid var(--line); background: var(--paper); color: var(--ink); }
.repeat-row { display: flex; gap: 6px; align-items: center; }
.repeat-row input:nth-child(2) { flex: 1; }
.btn--sm { margin-top: 8px; font-size: 12.5px; padding: 7px 12px; }
.subrow { border-top: 1px dashed var(--line); padding-top: 10px; margin-top: 10px; }
.subrow:first-child { border-top: none; margin-top: 0; padding-top: 0; }
.subrow-head { display: flex; justify-content: space-between; align-items: center; }

.section { background: var(--paper-raised); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.section-head { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 13px 16px; background: none; border: none; cursor: pointer; font: inherit; color: var(--ink); text-align: left; }
.section-head-left { display: flex; align-items: center; gap: 10px; color: var(--sea); }
.section-title { display: block; font-weight: 700; font-size: 14px; color: var(--ink); }
.section-subtitle { display: block; font-size: 11px; color: var(--ink-soft); font-weight: 400; }
.section-body { padding: 4px 16px 16px; border-top: 1px solid var(--line); }

.dcard { background: var(--paper-raised); border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px; }
.dcard-title { display: flex; align-items: center; gap: 10px; font-size: 14.5px; font-weight: 700; margin: 0 0 12px; color: var(--ink); }
.dcard-num { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: var(--ink); color: var(--paper); font-size: 12px; font-family: "SF Mono", monospace; }

.calc-box { margin-top: 12px; background: var(--paper); border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
.calc-row { display: flex; justify-content: space-between; font-size: 12.5px; color: var(--ink-soft); font-family: "SF Mono", "Roboto Mono", Consolas, monospace; }
.calc-row b { color: var(--ink); font-weight: 700; }
.calc-row--note { font-family: inherit; color: var(--sea); font-size: 11px; }
.calc-row--strong { border-top: 1px dashed var(--line); margin-top: 4px; padding-top: 6px; font-size: 13.5px; }
.calc-row--strong b { color: var(--brass-dark); }
.calc-row--total b { font-size: 16px; }

.total-bar { display: flex; justify-content: space-between; align-items: center; background: var(--ink); color: var(--paper); border-radius: 12px; padding: 14px 18px; }
.total-label { display: block; font-size: 12.5px; font-weight: 700; }
.total-hint { display: block; font-size: 10.5px; opacity: 0.7; margin-top: 2px; }
.total-value { font-family: "SF Mono", "Roboto Mono", Consolas, monospace; font-size: 22px; font-weight: 700; color: #8FC3EA; }

.submit-btn { display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--brass); color: #fff; border: none; border-radius: 12px; padding: 14px; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.hint-text { text-align: center; font-size: 12px; color: var(--ink-soft); margin: -6px 0 0; }
.hint-text--ok { color: var(--sea); font-weight: 600; }
.output-box { background: var(--paper-raised); border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }
.output-instructions { font-size: 13px; margin: 0; color: var(--ink); }
.output-textarea { width: 100%; font-family: "SF Mono", "Roboto Mono", Consolas, monospace; font-size: 11px; padding: 10px; border-radius: 8px; border: 1px solid var(--line); background: var(--paper); color: var(--ink-soft); resize: vertical; }
.copy-btn { align-self: flex-start; display: flex; align-items: center; gap: 6px; background: var(--sea); color: #fff; border: none; border-radius: 9px; padding: 9px 14px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }

.table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }

/* ---- Mobil (Telefon-Breite) ---- */
@media (max-width: 640px) {
  .app-header { flex-direction: column; align-items: stretch; gap: 10px; padding: 12px 14px; }
  .brand { font-size: 17px; }
  .tab { padding: 8px 12px; font-size: 12.5px; }
  .info-banner { padding: 8px 14px; font-size: 11.5px; }
  .app-main { padding: 14px; }

  .field-grid { grid-template-columns: 1fr; }
  .detail-grid { grid-template-columns: 1fr; }
  .risk-row { flex-wrap: wrap; }

  /* iOS zoomt beim Fokussieren in Felder mit < 16px Schrift hinein — anheben */
  .field input, .field select, .field textarea,
  .customer-form input, .customer-form select, .customer-form textarea,
  .repeat-list input, .import-textarea, .output-textarea, .search-box input {
    font-size: 16px;
  }

  .save-row { flex-wrap: wrap; }
  .save-row select { min-width: 100%; }
  .detail-head { flex-wrap: wrap; gap: 10px; }
  .detail-actions { flex-wrap: wrap; }
  .result-head { flex-wrap: wrap; gap: 8px; }
  .result-total { text-align: left; }
  .customer-row-sub, .customer-row-name { overflow: hidden; text-overflow: ellipsis; }

  .panel, .formpanel { padding: 16px; }
  .app-header .brand { justify-content: flex-start; }
}
`;
