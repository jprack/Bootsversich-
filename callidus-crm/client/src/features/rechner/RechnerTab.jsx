// RechnerTab und ResultCard — aus BootsCRM_reference.jsx (Zeilen 835-1197),
// programmatisch ausgeschnitten und inhaltlich unverändert. Mit Prompt 7 sind
// die Knöpfe "… mit diesen Werten öffnen" samt eingebetteten Antragsmasken
// wieder dabei, die in Prompt 5 noch fehlten.
//
// id und Zeitstempel der gespeicherten Berechnung vergibt der Server.
import { useState, useEffect, useMemo } from "react";
import { Compass, Save, Check, Info, AlertTriangle, FileCheck2, FileText, X } from "lucide-react";
import { Field, WarnBox } from "../../components/ui.jsx";
import { euro, pctFmt } from "../../lib/format.js";
import { fullName } from "../kunden/helpers.js";
import NautimaAntragTab from "./NautimaAntragTab.jsx";
import CallidusDatenblattTab from "./CallidusDatenblattTab.jsx";
import {
  thisYear, NAUTIMA_KASKO, NAUTIMA_INSASSENUNFALL, ZONEN, SFR_OPTIONEN,
  CALLIDUS_SY_KASKO_BINNEN, CALLIDUS_SY_KASKO_MITTELMEER,
  CALLIDUS_MY_KASKO_BINNEN, CALLIDUS_MY_KASKO_MITTELMEER,
  findNautimaVSBracket, nautimaAvailableSB, callidusAvailableSBForVS,
  calcNautima, calcCallidus,
} from "../../lib/tarife.js";

// Aus BootsCRM_reference.jsx (Zeilen 794-802), unverändert.
function LeaderRow({ label, value, betont, negativ }) {
  return (
    <div className={`leader-row ${betont ? "leader-row--strong" : ""}`}>
      <span className="leader-label">{label}</span>
      <span className="leader-fill" />
      <span className={`leader-value ${negativ ? "leader-value--neg" : ""}`}>{value}</span>
    </div>
  );
}

/* ===================== Rechner-Tab ===================== */
export default function RechnerTab({ customers, onSaveToCustomer, onCustomersChanged }) {
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

