// NautimaAntragTab (samt Section) — aus BootsCRM_reference.jsx
// (Zeilen 2831-3519), programmatisch ausgeschnitten.
//
// Geändert ist nur das Speichern: saveToCustomer schreibt nicht mehr direkt
// in window.storage, sondern geht über antragBeimKundenSichern() und damit
// über die API. Das frühere risiko-Objekt am Kunden ist jetzt ein Eintrag in
// der Tabelle boats. Die Eingabemaske, die Berechnung und der erzeugte
// JSON-Text sind unverändert.
//
// Der Historie-Eintrag ("NAUTIMA-Antrag erstellt"), den die Referenz hier
// ebenfalls anlegt, folgt mit Prompt 8 — die Tabelle historie ist noch nicht
// angebunden.
import { useState, useEffect, useMemo } from "react";
import {
  Anchor, Ship, Compass, FileCheck2, FileText, AlertTriangle, Info, Send,
  Plus, Trash2, Check, Copy, ChevronDown, ChevronRight, X,
} from "lucide-react";
import { Field, RadioRow } from "../../components/ui.jsx";
import { euro, euro2, pct2 } from "../../lib/format.js";
import { fullName, splitFullName, getBoats } from "../kunden/helpers.js";
import { antragBeimKundenSichern } from "../kunden/antragSpeichern.js";
import {
  thisYear, ZONEN, SFR_OPTIONEN, NAUTIMA_KASKO, NAUTIMA_HP_MOTOR, NAUTIMA_HP_SEGEL,
  NAUTIMA_KASKO_MINDEST, NAUTIMA_HP_MINDEST, NAUTIMA_INSASSENUNFALL,
  NAUTIMA_SICHERHEITSLEISTUNG_BEITRAG,
  findNautimaVSBracket, nautimaAvailableSB, nautimaRate,
  findNautimaHPBracketKW, findNautimaHPBracketM2,
} from "../../lib/tarife.js";

// uid() nur noch für React-Schlüssel in wiederholbaren Zeilen (Motoren,
// Vorschäden) — Datensatz-IDs vergibt der Server.
const uid = () => Math.random().toString(36).slice(2, 10);

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


export default function NautimaAntragTab({ customers, prefill, onCustomersChanged }) {
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
    const r = getBoats(c)[0] || {};
    if (r.bootstyp === "Segelboot") setFahrzeugart("SegelbootYacht");
    else if (r.bootstyp === "Motorboot") setFahrzeugart("MotorbootYacht");
    if (r.hersteller) setHersteller(r.hersteller);
    if (r.modell) setModell(r.modell);
    if (r.baujahr) setBaujahr(Number(r.baujahr) || thisYear);
    if (r.segelflaeche) setSegelflaeche(r.segelflaeche);
    if (r.rumpfmaterial) setMaterial(r.rumpfmaterial);
    const letzterVertrag = c.vertraege?.[0]; // Server liefert neueste zuerst
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

    // Was früher als risiko-Objekt am Kunden hing, ist jetzt ein Boot.
    const bootsfelder = {
      bootstyp: risikoBootstyp, hersteller, modell, baujahr: String(baujahr),
      fahrtgebiet: ZONEN.find((z) => z.key === zone)?.label || zone,
      charter: verchartert === "nein" ? "Nein" : verchartert === "mit" ? "Ja, mit Skipper" : "Ja, ohne Skipper",
    };
    if (fahrzeugart === "SegelbootYacht") bootsfelder.segelflaeche = String(segelflaeche);
    else bootsfelder.motorleistung_kw = String(motoren.reduce((s, m) => s + (Number(m.kw) || 0), 0));

    const adresse = [strasse, plzOrt].filter(Boolean).join(", ");

    return antragBeimKundenSichern({
      customers, prefillId, anzeigename: name1, namensfelder: splitFullName(name1),
      adresse, bootsname, bootsfelder, statusWennNeu: "antrag",
      quote: {
        quelle: "NAUTIMA-Antrag",
        bootstyp: risikoBootstyp === "Segelboot" ? "segelboot" : "motorboot",
        baujahr, versicherungssumme: Number(wertFahrzeug) || 0, zone,
        nautima: gesamtACGesamt,
      },
      antragTyp: "NAUTIMA-Antrag", antragDaten: fullPayload,
    }).then(async (name) => {
      if (onCustomersChanged) await onCustomersChanged();
      return name;
    });
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


