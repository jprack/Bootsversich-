# 10. Automatisierungen

## 10.1 Aufbau des Regelwerks

Jede Regel ist in `crm_automation_regel` gepflegt und besteht aus:

```
CODE | AUSLÖSER (Event | Zeitplan | Schwellwert) | BEDINGUNG | AKTIONEN | EMPFÄNGER | SCHUTZ
```

**Ausführungsprinzipien:**
1. Jede Ausführung schreibt einen Eintrag in `crm_automation_lauf` (Erfolg, übersprungen, Fehler, unterdrückt).
2. Vor Aufgabenerzeugung greift immer der Duplikatsschutz (`idx_aufgabe_dedup`).
3. Tageslimit und Ruhezeiten (siehe 7.8) gelten für alle Regeln außer Eskalation Stufe 2.
4. Jede Regel ist einzeln abschaltbar — pro Mandant, ohne Deployment.
5. Regeln mit `verworfen`-Quote > 30 % werden automatisch zur Prüfung gemeldet (A-42).
6. Kein Versand personalisierter Werbung ohne gültige Einwilligung (`crm_consent`).

---

## 10.2 Regelkatalog

### Block A — Leadaufnahme und Reaktion

| Code | Auslöser | Bedingung | Aktionen |
|---|---|---|---|
| **A-01** | Zeitplan 06:00 täglich | Lead aktiv, keine offene Aufgabe (`vw_crm_vergessene_vorgaenge`) | Aufgabe „Nächster Schritt festlegen" an Verantwortlichen. **Kernregel: Kein Lead bleibt liegen.** |
| **A-02** | `crm.lead.erstellt` | Consent E-Mail erteilt | Empfangsbestätigung binnen 5 Min + Aufgabe `erstkontakt` mit SLA nach Kategorie |
| **A-03** | `crm.lead.erstellt` | Kein Verantwortlicher gesetzt | Zuweisung nach Gebiet → Named Account → Round Robin mit Kapazitätsprüfung (< 15 offene Aufgaben) |
| **A-04** | `crm.lead.erstellt` | Ähnlichkeit ≥ 0,85 zu bestehendem Kontakt (trigram + E-Mail/Telefon) | Dublettenkandidat markieren, Aufgabe `datenpflege`, kein zweiter Erstkontakt |
| **A-05** | Zeitplan stündlich | `erstkontakt_faellig_am` überschritten, `erstkontakt_am` leer | Erinnerung an Verantwortlichen; nach 2× SLA Eskalation Stufe 1 an Teamleitung |
| **A-06** | `crm.lead.kategorie_gewechselt` | Wechsel nach `A` | Aufgabe `kritisch` + E-Mail + Push an Verantwortlichen (**Echtzeit-Trigger**) |
| **A-07** | Zeitplan nächtlich | Lead ohne Aktivität > 14 Tage, Status aktiv | Aufgabe „Lead reaktivieren oder abschließen" |
| **A-08** | Zeitplan nächtlich | Lead ohne Signal/Aktivität > 180 Tage | Statuswechsel `nurturing`, Score einfrieren, Brevo-Strecke aktivieren |
| **A-09** | `crm.signal.muster_erkannt` (M2 Abbrecher) | Konfigurator abgebrochen, kein Formular in 24 h | Aufgabe „Rückruf Konfigurator-Abbruch" Fälligkeit +4 h |
| **A-10** | `crm.lead.qualifiziert` | – | Aufgabe `termin_vereinbaren` + Outlook-Terminvorschläge + Unterlagen-Checkliste |

### Block B — Angebot und Opportunity

| Code | Auslöser | Bedingung | Aktionen |
|---|---|---|---|
| **A-11** | `crm.angebot.versendet` | – | Wiedervorlagen T+3 (Anruf, Pflicht), T+7 (E-Mail), T+14 (Anruf mit Alternative) |
| **A-12** | Zeitplan täglich | `gueltig_bis − 3 Tage` erreicht, Status `versendet`/`geoeffnet` | Aufgabe `kritisch` „Angebot läuft ab" |
| **A-13** | Zeitplan täglich | `gueltig_bis` überschritten | Status `abgelaufen`, Opportunity-Prüfaufgabe, Wiedervorlage +90 Tage |
| **A-14** | Zeitplan 06:00 täglich | Offene Opportunity ohne offene Aufgabe | Aufgabe „Nächsten Schritt festlegen", Markierung im Dashboard |
| **A-15** | Zeitplan täglich | `stufe_seit` > max. Verweildauer der Stufe | Eskalation Stufe 1; ab Wert ≥ 10.000 € Stufe 2 an Vertriebsleitung |
| **A-16** | `crm.angebot.geoeffnet` (2. Öffnung) | Muster M6 | Wahrscheinlichkeit +15 %, Aufgabe „Sofort nachfassen" (heute fällig) |
| **A-17** | `crm.opportunity.gewonnen` | – | Dankes-E-Mail ≤ 24 h, Onboarding-Strecke, Attribution zurückschreiben, KI-Trainingsdatensatz, Aufgaben `anruf` T+5/T+30/T+90 |
| **A-18** | Aufgabe verschoben | `verschoben_anzahl` ≥ 3 | Eskalation Stufe 1 + Hinweis an Teamleitung |
| **A-19** | Zeitplan wöchentlich (Mo 07:00) | Gewichteter Forecast < 100 % Quartalsziel **oder** Coverage < 3× | Aufgabe „Pipeline-Aufbau" an Vertriebsleitung mit Lückenanalyse |
| **A-20** | `crm.opportunity.verloren` | Verlustgrund `preis`/`wettbewerbsangebot`, Wert ≥ 5.000 € | Wiedervorlage 10 Monate vor Hauptfälligkeit des Wettbewerbers (W-10) |

### Block C — Bestandskunden, Bindung, Risiko

| Code | Auslöser | Bedingung | Aktionen |
|---|---|---|---|
| **A-21** | Zeitplan täglich | Hauptfälligkeit T−90 / T−60 / T−30 | Aufgabe `hauptfaelligkeit` mit Vergleichsdaten und Prämienentwicklung |
| **A-22** | Zeitplan täglich | Jahrestag Vertragsbeginn − 30 Tage | Aufgabe `jahresgespraech` (VIP: halbjährlich) |
| **A-23** | Zeitplan nächtlich | Bootswert seit > 24 Monaten nicht geprüft | Aufgabe `wertpruefung` + Hinweis Unterversicherungsrisiko |
| **A-24** | Churn-Neuberechnung | `risk_score ≥ 65` | Aufgabe `rueckhol_kontakt` (5 Werktage), bei CVS ≥ 60 an Vertriebsleitung |
| **A-25** | Churn-Neuberechnung | `risk_score ≥ 65` **und** `cvs ≥ 70` | Priorität `kritisch`, Position 1 der Tagesliste, E-Mail + Push, Eskalation nach 5 Tagen |
| **A-26** | Churn-Neuberechnung | `risk_score` 35–64 | Sammelaufgabe `beziehungspflege` im Wochenplan |
| **A-27** | `crm.schaden.geschlossen` | Zufriedenheit ≥ 4/5 | Aufgabe „Dank + Empfehlungsanfrage" T+14 |
| **A-27b** | `crm.schaden.geschlossen` | Zufriedenheit ≤ 2/5 oder Beschwerde | Risk-Neuberechnung sofort, Aufgabe `beziehungspflege` `hoch`, keine Werbekommunikation für 90 Tage |
| **A-28** | Zeitplan monatlich | CVS ≥ 65, Risk < 35, keine Beschwerde, letzte Anfrage > 9 Monate | Aufgabe `empfehlungsanfrage` mit Gesprächsleitfaden |
| **A-29** | `crm.vertrag.gekuendigt` | – | Kündigungsgrund erfassen (Pflicht), Aufgabe `exit_gespraech` (5 WT), Win-Back-Wiedervorlagen 3/9/12 Monate |
| **A-29b** | Zeitplan täglich | Letzter Vertrag > 30 Tage beendet, kein Neuvertrag | Lebenszyklus → S8, CVS-Neuberechnung, Bestandsverlust im Reporting |

### Block D — Umsatzpotenzial und Netzwerk

| Code | Auslöser | Bedingung | Aktionen |
|---|---|---|---|
| **A-30** | Zeitplan nächtlich | NBO-Regeln (NBO-01…10) treffen zu | `crm_nbo_vorschlag` erzeugen; bei Wert ≥ 200 € oder Trefferquote ≥ 40 % zusätzlich Opportunity in Stufe `neu` |
| **A-31** | `crm.boot.hinzugefuegt` (Objektmodul) | Boot ohne Vertrag | Opportunity „Neuversicherung" + Aufgabe `kritisch` (Kaufsignal `S-OBJ-01`) |
| **A-32** | `crm.boot.wert_geaendert` | Änderung > 20 % | Aufgabe `wertpruefung`, Hinweis Über-/Unterversicherung |
| **A-33** | `crm.signal.muster_erkannt` (M8) | ≥ 2 Boote + gewerbliche Nutzung | Aufgabe „Flottenkonzept anbieten" an Gewerbeteam |
| **A-34** | `crm.empfehlung.eingegangen` | – | Lead erzeugen, Aufgabe `empfehlung_bearbeiten` (SLA 24 h), Dank an Geber, DSGVO-Hinweis an Empfohlenen |
| **A-35** | `crm.empfehlung.status_gewechselt` | Jeder Wechsel | Statusrückmeldung an Geber (bei `verloren` **persönlich**, keine Automatikmail) |
| **A-36** | `crm.empfehlung.gewonnen` | – | Dank + Prämie, Rolle `empfehlungsgeber`, CVS-Neuberechnung, Aufgabe „Persönlicher Dank" ≤ 48 h |
| **A-37** | Zeitplan monatlich | Partner ohne Kontakt > 90 Tage, Partner Value ≥ 40 | Aufgabe `partner_pflege` |
| **A-38** | Zeitplan monatlich | Partner Value < 25 bei Laufzeit ≥ 12 Monaten | Aufgabe „Partnerschaft prüfen" an Partnermanagement |
| **A-39** | Zeitplan monatlich | Partner Value ≥ 75 | Aufgabe „Ausbau/Exklusivität verhandeln" |

### Block E — Steuerung, Qualität, Datenhygiene

| Code | Auslöser | Bedingung | Aktionen |
|---|---|---|---|
| **A-40** | Zeitplan monatlich | Quellen-Index < 30 über 3 Monate, Kosten > 500 €/Monat | Aufgabe „Quelle prüfen/abschalten" an Marketing; Index > 75 → „Budget erhöhen" |
| **A-41** | Zeitplan nächtlich | Pflichtfeld fehlt (Quelle, Consent, Bootswert, E-Mail) | Sammelaufgabe `datenpflege` (gebündelt, max. 1 pro Benutzer und Woche) |
| **A-42** | Zeitplan wöchentlich | Regel mit `verworfen`-Quote > 30 % über 30 Tage | Meldung an CRM-Verantwortlichen mit Beispielfällen zur Nachschärfung |
| **A-43** | Zeitplan täglich | Benutzer abwesend | Aufgaben an Vertretung umleiten; `kritisch` zusätzlich an Teamleitung |
| **A-44** | Zeitplan nächtlich | Signale älter als 24 Monate | Partition löschen (DSGVO) |
| **A-45** | `crm.kontakt.consent_widerrufen` | – | Rohsignale binnen 72 h löschen, aus allen Strecken entfernen, Score auf Regelbasis ohne Verhalten, Sperrvermerk |
| **A-46** | Zeitplan täglich 05:00 | – | Score-Neuberechnung: Lead Score (alle aktiven), Engagement, Risk (Bestandskunden), CVS-Blöcke B/C/D |
| **A-47** | Zeitplan monatlich (1. des Monats) | – | CVS-Blöcke A/E, Monatssnapshot `crm_kunde_score_historie`, VIP-Prüfung mit Hysterese |
| **A-48** | Zeitplan täglich 07:00 | – | Tagesliste je Benutzer berechnen, Prioritäts-Scores aktualisieren, Bündelung und Staffelung anwenden |
| **A-49** | Nach A-48 | Heute fällige Aufgaben je Benutzer > Tageslimit trotz Bündelung und Staffelung | Eskalation `kritisch` an die Teamleitung mit Anzahl, SLA-gebundenem Anteil, bereits verletzten SLA und gefährdetem Potenzial. Überlast wird sichtbar gemacht, nicht zurückgestaut. |

---

## 10.3 Automatisierungsgrenzen (bewusst nicht automatisiert)

| Vorgang | Warum menschlich |
|---|---|
| Absage einer Empfehlung an den Geber | Beziehungsschaden bei Automatikmail |
| Kündigungsbestätigung / Exit-Gespräch | Letzte Rückholchance |
| Preis- und Konditionszusagen | Wirtschaftliche Verantwortung, Vollmacht |
| Risikoablehnung (nicht zeichenbar) | Art. 22 DSGVO — keine automatisierte Einzelentscheidung |
| VIP-Ernennung außerhalb der Score-Regel | Strategische Entscheidung der Leitung |
| Beschwerdereaktion | Vertrauen entsteht nur persönlich |
| Freigabe KI-transkribierter Aktivitäten | Falschprotokolle wären schwer korrigierbar |

## 10.4 Betrieb und Überwachung

| Aspekt | Festlegung |
|---|---|
| Ausführungsmodell | Event-getriebene Regeln über den Plattform-Bus; Zeitpläne über einen Scheduler mit Leader Election |
| Idempotenz | Jeder Lauf trägt einen deterministischen Schlüssel `(regel_code, bezug_id, ausführungstag)` |
| Wiederholung | 3 Versuche mit exponentiellem Abstand, danach Dead-Letter + Aufgabe an den Betrieb |
| Simulationsmodus | Jede Regel kann im Trockenlauf (`dry_run`) gegen Echtdaten getestet werden — Pflicht vor Aktivierung |
| Kennzahlen je Regel | Auslösungen, erzeugte Aufgaben, Erledigungsquote, `verworfen`-Quote, erzeugter Umsatz |
| Ausrollen | Neue Regeln zuerst für ein Team (Pilot, 4 Wochen), dann mandantenweit |
