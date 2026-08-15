# Demo und Testlauf

Lauffähige Umsetzung des Moduls `01_CRM_ENGINE` gegen eine echte PostgreSQL-Instanz.
Zweck: Prüfen, ob das Konzept aus den Kapiteln 01–14 tatsächlich die versprochenen
Handlungen erzeugt — und nicht nur behauptet, es zu tun.

## Ausführen

```bash
./run_demo.sh                 # Standardport 55432, Instanz bleibt danach offen
./run_demo.sh 55555           # abweichender Port
./run_demo.sh --stop          # Instanz nach dem Lauf beenden
```

Das Skript legt eine temporäre Instanz an, rollt Schema, Demodaten, Engine und
Kalibrierung aus, führt einen Nachtlauf durch, gibt die erzeugte Tagesliste aus
und lässt die Testsuite laufen. Danach bleibt die Instanz geöffnet, sodass man
mit `psql -h /tmp -p 55432 -U crm -d crmdemo` weiterarbeiten kann.
Voraussetzung: PostgreSQL ≥ 15 lokal installiert (nur Binaries, kein laufender Dienst).

Nützliche Einstiegspunkte in der laufenden Instanz:

```sql
SELECT * FROM vw_crm_next_best_action WHERE benutzer_id = '22222222-0000-0000-0000-000000000001';
SELECT * FROM vw_crm_kunde_360 ORDER BY customer_value_score DESC;
SELECT * FROM vw_crm_pipeline;
SELECT * FROM vw_crm_quellen_performance;
SELECT * FROM vw_crm_vergessene_vorgaenge;          -- muss leer sein
SELECT * FROM crm_fn_engine_lauf('11111111-0000-0000-0000-000000000001');  -- erneut rechnen
```

## Dateien

| Datei | Inhalt |
|---|---|
| `00_seed.sql` | Stammdaten: Mandant, Benutzer, Gebiete, Produkte, 19 Leadquellen mit Kosten, 28 Signaltypen, Partner, 10 Kunden, 17 Boote, 17 Verträge, 3 Schäden |
| `01_seed_vertrieb.sql` | 9 Leads, 6 Opportunities, 3 Angebote, 13 Aktivitäten, 27 Signale, 4 Empfehlungen, 8 Wiedervorlageregeln |
| `02_engine.sql` | Intent Score, Lead Score (Regelmodell), Customer Value Score, Risk Score, Aufgabenhelfer mit Duplikatsschutz |
| `03_regelwerk.sql` | Mustererkennung M1–M8, Next Best Offer, 20 Automatisierungsregeln, Priorisierung, Orchestrierung `crm_fn_engine_lauf()` |
| `04_pruefungen.sql` | Testsuite mit 24 Prüfungen, davon 5 Negativtests |
| `05_kalibrierung_v11.sql` | Korrekturen K1–K4 aus dem ersten Lauf |
| `06_kalibrierung_v12.sql` | Korrekturen K5–K6 (Kundenwert-Normierung, Gewerbezweig) |
| `07_lasttest.sql` | Synthetischer Bestand (5.009 Leads, 2.010 Kunden) und Antwortzeitmessung |
| `08_lastschutz.sql` | K7–K9: Bündelung, Staffelung, Kapazitätswarnung |
| `09_fixes_v13.sql` | D1–D4: Defekte, die erst unter Last sichtbar wurden |
| `run_demo.sh` | Alles zusammen, ein Befehl |

## Der Demobestand

Ein Ostsee-Portfolio, so gebaut, dass jede Regel des Regelwerks mindestens einen
Anwendungsfall findet:

- **Nordwind Charter GmbH** — 5 Yachten, 14.280 € Jahresprämie, seit 312 Tagen kein
  Kontakt, Schaden mit Zufriedenheit 2/5, Prämienerhöhung 18 %, Jahresgespräch
  überfällig. Der Lehrbuchfall stiller Abwanderung.
- **Jan Kramer** — Werftübergabe, Bavaria 46 (380.000 €), Hauptfälligkeit in 47 Tagen,
  Konfigurator gestartet und Bedingungen heruntergeladen (Muster M1).
- **Seebär Yachting** — Angebot draußen, zweimal geöffnet, danach Tarifseitenbesuch
  (Muster M6).
- **Imke Dohrn** — Messelead, 4 Charterboote, 890.000 €, kontaktiert, danach ohne
  offene Aufgabe (prüft den Vergessenswächter A-01).
- **Björn Hagedorn** — Bestandskunde, neues Boot seit 11 Tagen ohne Deckung (Signal
  `S-OBJ-01`), Schaden zuvor mit 5/5 reguliert.
- **Klaus Reimers** — vor 150 Tagen zum Wettbewerb abgewandert, Grund `preis`.
- **Petra Lindqvist** — Yacht auf Mallorca, Police deckt nur küstennahe Fahrt (NBO-03).

## Ergebnis des ersten Laufs (Version 1.0)

Die Mechanik lief fehlerfrei. Die Kalibrierung nicht — vier Befunde:

| Code | Befund | Wirkung im Betrieb |
|---|---|---|
| **K1** | 35 der 100 Lead-Score-Punkte setzen digitales Verhalten voraus. Ein telefonisch übergebener Werftlead kann sie nie erreichen. | Die Quelle mit der höchsten Abschlussquote wurde systematisch als C-Lead eingestuft. Jan Kramer: 74 (B) statt 84 (A). |
| **K2** | Die Euro-Schwellen des Customer Value Score stammten aus einem Industrieportfolio. | 6 von 10 Kunden landeten in „Basis"/„Beobachtung", kein Kunde erreichte VIP. Nordwind: 59 statt 76. |
| **K3** | Der Risk Score normierte über alle Merkmale, auch über selten gleichzeitig auftretende Hartereignisse. | Der wertvollste gefährdete Kunde erreichte 56 statt 86 — **keine Rückholaufgabe**, 14.280 € Bestandsprämie unbemerkt gefährdet. |
| **K4** | Der Duplikatsschutz überschrieb bei mehreren Verträgen mit gleicher Hauptfälligkeit den Aufgabenwert statt zu kumulieren. | Anzeige 1.460 € statt 14.280 €; die Priorisierung rechnete mit dem falschen Wert. |

## Korrekturen (Version 1.1)

- **K1** — Normierung auf *erreichbare* Punkte: fehlt Tracking, Newsletter-Einwilligung
  oder Erstkontakt, schrumpft der Nenner statt des Zählers. Die Begründung nennt das offen.
- **K2** — Schwellen auf Boots-/Yachtprämien kalibriert (200–20.000 € statt Industrieniveau),
  Blockgewichte auf 55/15/15/5/10.
- **K3** — Verhaltensmerkmale bilden die Basis, Hartereignisse (Zahlungsverzug,
  Objektverlust, Teilkündigung) wirken als Eskalatoren auf mindestens 65.
- **K4** — `crm_fn_aufgabe(..., p_wert_kumulieren)` summiert statt zu überschreiben.

## Ergebnis nach Kalibrierung

```
1. Rückholgespräch: Nordwind Charter GmbH        A-25   99   14.280 €
2. Angebot AN-2026-0864 läuft am 17.08. ab       A-12   98    9.800 €
3. Jahresgespräch: Nordwind Charter GmbH         A-22   79   14.280 €
4. Hauptfälligkeitsgespräch: Nordwind Charter    A-21   79   14.280 €
5. Sofort nachfassen: Seebär Yachting            A-16   59    3.100 €
```

Testsuite: **24 von 24 Prüfungen bestanden.**

## Zweite Runde: Kalibrierung 1.2 und Lasttest

### K5 — Kundenwert: Erreichbarkeitsnormierung nachgezogen
Die mit K1 für den Lead Score eingeführte Korrektur fehlte beim Kundenwert. Der
Partnerblock (10 Punkte) ist nur für Kunden erreichbar, die selbst Werft, Marina
oder Händler sind — für alle anderen lag er als totes Gewicht im Nenner und machte
die VIP-Schwelle unerreichbar. **Nordwind Charter: 76 → 83, erstmals VIP.**

### K6 — Eigener Score-Zweig für Gewerbe und Flotte
Das Privatmodell bewertet ein einzelnes Boot und 35 Punkte digitales Verhalten.
Eine Chartergesellschaft entscheidet im Termin, und ihr Wert steckt in der Flotte.
Der Gewerbezweig gewichtet Objekt und Profil höher (45/25) und Verhalten niedriger (15).
Dafür wurde `crm_lead.anzahl_objekte` ergänzt — die Flottengröße war im Leadmodell
gar nicht erfasst. **Nordsee Charter (890.000 €, 4 Boote): 55 → 61, C → B.**

### Lasttest: 5.009 Leads, 2.010 Kunden, 13.355 Signale

| Abfrage | Ziel | p50 | p95 |
|---|---|---|---|
| `GET /aufgaben/tagesliste` | 300 ms | 2,9 ms | 4,3 ms |
| `GET /kunden/{id}/akte` | 700 ms | 0,0 ms | 0,6 ms |
| `POST /leads` (Scoring) | 800 ms | 0,3 ms | 0,4 ms |
| `GET /pipeline` | 500 ms | 1,4 ms | 1,5 ms |
| Vergessenswächter (Nachtlauf) | 2.000 ms | 15,6 ms | 24,3 ms |

Vollständiger Nachtlauf über den Gesamtbestand: **rund 14 Sekunden.**

### Vier Defekte, die erst der Lasttest sichtbar gemacht hat

| Code | Defekt | Wirkung |
|---|---|---|
| **K7** | Der Lastschutz aus Kapitel 7.8 war beschrieben, aber nie implementiert. | 6.863 offene Aufgaben, davon **2.910 für eine Person**. Das System wäre am ersten Tag ignoriert worden. Bei zehn Demokunden lag die Zahl mit 24 zufällig unter dem Limit — die Prüfung T10 bestätigte den Zufall, nicht die Regel. |
| **K8** | A-21 terminierte alle Hauptfälligkeiten auf heute statt auf die Staffelpunkte T-90/T-60/T-30. | 223 Gespräche an einem Tag statt verteilt über drei Monate. |
| **D2** | Der mit K4 eingeführte Summierungsschalter kumulierte über Nachtläufe hinweg. | Nordwinds Hauptfälligkeitsaufgabe trug nach dem zweiten Lauf 28.560 € statt 14.280 €. Die Summe gehört in die Abfrage, nicht in den Aufgabenhelfer. |
| **D4** | Next Best Offer legte bei jedem Lauf neue Chancen an. | **+1.423 Aufgaben und rund 1.400 Phantom-Chancen pro Nacht.** Die Pipeline hätte sich binnen einer Woche verzehnfacht. |

Dazu **D1** (Duplikatsschutz griff nicht bei Aufgaben ohne Bezugsobjekt),
**D3** (reine Stille erreichte die Alarmschwelle nie — 651 Kunden ohne Kontakt seit
über 270 Tagen blieben bei höchstens 42 Punkten, obwohl „kein Kunde geht still
verloren" der Kernsatz des Moduls ist) und **K9** (Überlast, die nach Bündelung und
Staffelung bleibt, wird als Kapazitätswarnung an die Teamleitung eskaliert, statt
in einer Warteschlange zu verschwinden).

### Stand nach Fassung 1.3

- **29 von 29 Prüfungen bestanden** — im Demobestand *und* gegen 5.009 Leads.
- **Idempotent:** Wiederholte Nachtläufe verändern weder Aufgaben- noch Chancenzahl
  (Demobestand 38/11, Lastbestand 7.027/1.233 über mehrere Läufe konstant).
- Lastschutz bündelt 4.962 gleichartige Aufgaben zu 9 Sammelaufgaben; die
  verbleibenden 399 sind SLA-gebunden und werden bewusst nicht verschoben, sondern
  eskaliert.

### Anmerkung zu vier Prüfungen

T11, T18, T19, T23 und T25 sind gegen den Lastbestand zunächst fehlgeschlagen. Die
Analyse ergab: In vier Fällen war die **Prüfung** falsch, nicht das System.
T11 gruppierte zu grob und wertete die je Benutzer bewusst getrennten
Kapazitätswarnungen als Duplikate. T18 und T25 waren als Zusicherungen für den
kuratierten Demobestand formuliert und gegen zufällig erzeugte Leads ohne Aussage.
T23 scheiterte, weil der Lastgenerator Signale direkt in die Datenbank schreibt und
damit das Consent-Gate der Anwendung umgeht — die Einwilligungsprüfung liegt in der
Anwendungsschicht, nicht in einem Constraint. Diese vier Prüfungen wurden auf ihre
tatsächliche Aussage geschärft; nur T19 deckte einen echten Modellfehler auf (D3).

## Was der Test nicht beweist

1. **Die Gewichte sind an einem konstruierten Bestand geeicht, nicht an Ihrem.**
   Der synthetische Lastbestand erzeugt Volumen, keine realistischen Zusammenhänge.
   Für die endgültige Kalibrierung werden historische Abschluss- und Stornodaten
   benötigt. Das bleibt der wichtigste offene Punkt.
2. **Die KI-Komponente ist ungeprüft.** Getestet wurde ausschließlich das Regelmodell
   (Cold-Start-Phase). Das Blending setzt ≥ 500 abgeschlossene Leads voraus.
3. **Der Lasttest misst eine Einzelinstanz ohne Nebenläufigkeit.** Gemessen wurden
   Abfragezeiten bei einem Verbraucher, nicht Verhalten unter gleichzeitigen
   Schreibzugriffen, Sperren oder Verbindungsdruck.
4. **Der Signal-Ingest hat kein Durchsatzmaß.** Die geforderten 500 Ereignisse pro
   Sekunde je Mandant aus `09_APIS.md` sind weiterhin unbelegt.
5. **Die Einwilligungsprüfung liegt in der Anwendungsschicht**, nicht in einem
   Constraint. Ein Schreibzugriff an der Anwendung vorbei kann Signale ohne
   Einwilligung anlegen — der Lastgenerator hat genau das getan.

> Alle Demodaten sind frei erfunden. Namen, Policen, Boote und Schäden bilden keine
> realen Personen oder Verträge ab.
