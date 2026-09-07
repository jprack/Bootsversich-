// CallidusDatenblattTab (samt DCard) — aus BootsCRM_reference.jsx
// (Zeilen 3521-3950), programmatisch ausgeschnitten.
//
// Wie beim NAUTIMA-Antrag ist nur das Speichern umgestellt: über
// antragBeimKundenSichern() und damit über die API, statt direkt in
// window.storage. Das risiko-Objekt am Kunden ist jetzt ein Boot.
// Die Offert-Nachfassaufgaben legt der Server an, sobald der Status auf
// "offert" wechselt — createOffertTasks wird hier deshalb nicht mehr
// aufgerufen (Prompt 6).
import { useState, useEffect, useMemo } from "react";
import { FileCheck2, FileText, AlertTriangle, Info, Check, Copy } from "lucide-react";
import { Field, RadioRow } from "../../components/ui.jsx";
import { euro, euro2, pct2 } from "../../lib/format.js";
import { fullName, splitFullName, getBoats } from "../kunden/helpers.js";
import { antragBeimKundenSichern } from "../kunden/antragSpeichern.js";
import {
  thisYear, CALLIDUS_SY_KASKO_BINNEN, CALLIDUS_SY_KASKO_MITTELMEER,
  CALLIDUS_MY_KASKO_BINNEN, CALLIDUS_MY_KASKO_MITTELMEER,
  CALLIDUS_KASKO_ZUSCHLAEGE, CALLIDUS_SY_HP, CALLIDUS_MY_HP,
  CALLIDUS_VERCHARTER_AUFSCHLAG,
  resolveCallidusRate, callidusVSStatus, callidusAvailableSBForVS,
  findCallidusHPBracketKW, findCallidusHPBracketM2,
} from "../../lib/tarife.js";

const uid = () => Math.random().toString(36).slice(2, 10);

function DCard({ n, title, children }) {
  return (
    <section className="dcard">
      <h2 className="dcard-title"><span className="dcard-num">{n}</span>{title}</h2>
      <div className="dcard-body">{children}</div>
    </section>
  );
}


export default function CallidusDatenblattTab({ customers, prefill, onCustomersChanged }) {
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
    const r = getBoats(c)[0] || {};
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
    if (r.motorleistung_kw) setMotorleistungKW(Number(r.motorleistung_kw) || 0);
    if (r.hersteller_motor) setHerstellerMotor(r.hersteller_motor);
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

    // Was früher als risiko-Objekt am Kunden hing, ist jetzt ein Boot.
    const bootsfelder = {
      bootstyp: risikoBootstyp, registrierungsland, werft, hersteller, modell, yachttyp,
      baujahr: String(baujahr), laenge, breite, tiefgang, rumpfmaterial,
      fahrtgebiet: fahrtgebietText,
      charter: charter === "nein" ? "Nein" : charter === "mit" ? "Ja, mit Skipper" : "Ja, ohne Skipper",
    };
    if (bootstyp === "segelboot") {
      bootsfelder.mastmaterial = mastmaterial;
      bootsfelder.segelflaeche = String(segelflaeche);
    } else {
      bootsfelder.motortyp = motortyp;
      bootsfelder.motorleistung_kw = String(motorleistungKW);
      bootsfelder.hersteller_motor = herstellerMotor;
    }

    return antragBeimKundenSichern({
      customers, prefillId, anzeigename: name,
      namensfelder: { titel: titelVN.trim(), vorname: vorname.trim(), nachname: nachname.trim() },
      adresse, geburtsdatum, email, telefon,
      bootsfelder, statusWennNeu: "offert",
      quote: {
        quelle: "Bootsdatenblatt", bootstyp, baujahr,
        versicherungssumme, callidus: gesamt,
      },
      antragTyp: "Bootsdatenblatt", antragDaten: fullPayload,
    }).then(async (n) => {
      if (onCustomersChanged) await onCustomersChanged();
      return n;
    });
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


