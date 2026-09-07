// Anzeige der vollständigen Antrags-/Bootsdatenblatt-Rohdaten — 1:1 aus
// BootsCRM_reference.jsx (Zeilen 1630-1729), programmatisch ausgeschnitten.
import { useState } from "react";
import { FileCheck2, ChevronDown, ChevronRight } from "lucide-react";

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
export default function AntragCard({ antrag }) {
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

