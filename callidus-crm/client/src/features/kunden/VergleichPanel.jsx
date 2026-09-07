// VergleichPanel — aus BootsCRM_reference.jsx (Zeilen 1394-1481),
// programmatisch ausgeschnitten. Nutzt die in Prompt 5 portierte Tariflogik.
// Angepasst sind nur die Feldnamen (motorleistung_kw, vorversicherung_*).
import { useState, useMemo } from "react";
import { Calculator, Check, AlertTriangle } from "lucide-react";
import { Field } from "../../components/ui.jsx";
import { euro } from "../../lib/format.js";
import { thisYear, ZONEN, calcNautima, calcCallidus } from "../../lib/tarife.js";

export default function VergleichPanel({ customer, primaryBoat }) {
  const [versicherungssumme, setVersicherungssumme] = useState(primaryBoat?.versicherungssumme || 80000);
  const [zone, setZone] = useState("binnen");
  const [selbstbehalt, setSelbstbehalt] = useState(500);
  const [charter, setCharter] = useState("keine");

  const bootstyp = primaryBoat?.bootstyp === "Segelboot" ? "segelboot" : "motorboot";
  const baujahr = Number(primaryBoat?.baujahr) || thisYear - 10;
  const motorkw = Number(primaryBoat?.motorleistung_kw) || 0;
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

  const vorPraemie = customer.vorversicherung_praemie;
  const rows = [
    { label: customer.vorversicherung_versicherer || "Vorversicherung", betrag: vorPraemie, istVor: true },
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

