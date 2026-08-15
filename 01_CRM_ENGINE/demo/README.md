# Demo und Testlauf

Lauffähige Umsetzung des Moduls `01_CRM_ENGINE` gegen eine echte PostgreSQL-Instanz.
Zweck: Prüfen, ob das Konzept aus den Kapiteln 01–14 tatsächlich die versprochenen
Handlungen erzeugt — und nicht nur behauptet, es zu tun.

## Ausführen

```bash
./run_demo.sh            # Standardport 55432
./run_demo.sh 55555      # abweichender Port
```

Das Skript legt eine temporäre Instanz an, rollt Schema, Demodaten, Engine und
Kalibrierung aus, führt einen Nachtlauf durch, gibt die erzeugte Tagesliste aus
und lässt die Testsuite laufen. Die Instanz wird beim Beenden gestoppt.
Voraussetzung: PostgreSQL ≥ 15 lokal installiert (nur Binaries, kein laufender Dienst).

## Dateien

| Datei | Inhalt |
|---|---|
| `00_seed.sql` | Stammdaten: Mandant, Benutzer, Gebiete, Produkte, 19 Leadquellen mit Kosten, 28 Signaltypen, Partner, 10 Kunden, 17 Boote, 17 Verträge, 3 Schäden |
| `01_seed_vertrieb.sql` | 9 Leads, 6 Opportunities, 3 Angebote, 13 Aktivitäten, 27 Signale, 4 Empfehlungen, 8 Wiedervorlageregeln |
| `02_engine.sql` | Intent Score, Lead Score (Regelmodell), Customer Value Score, Risk Score, Aufgabenhelfer mit Duplikatsschutz |
| `03_regelwerk.sql` | Mustererkennung M1–M8, Next Best Offer, 20 Automatisierungsregeln, Priorisierung, Orchestrierung `crm_fn_engine_lauf()` |
| `04_pruefungen.sql` | Testsuite mit 24 Prüfungen, davon 5 Negativtests |
| `05_kalibrierung_v11.sql` | Korrekturen K1–K4 aus dem ersten Lauf |
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

## Was der Test nicht beweist

1. Die Gewichte sind an 10 Kunden geeicht, nicht an einem realen Bestand.
   Für die endgültige Kalibrierung werden historische Abschluss- und Stornodaten benötigt.
2. Auch nach K2 erreicht kein Kunde die VIP-Schwelle von 80 (bester Wert: 76).
   Entweder ist die Schwelle für dieses Geschäft zu hoch oder die Netzwerk-/Community-
   Blöcke müssen anders gewichtet werden.
3. Der Lead Score braucht einen eigenen Zweig für Flotten-/Gewerbeleads: Ein Messelead
   mit 890.000 € Objektwert bleibt bei 55 Punkten, weil er kein digitales Verhalten erzeugt.
4. Die KI-Komponente ist nicht geprüft — getestet wurde ausschließlich das Regelmodell
   (Cold-Start-Phase). Das Blending setzt ≥ 500 abgeschlossene Leads voraus.
5. Keine Last- oder Durchsatztests; die Antwortzeitziele aus `09_APIS.md` sind unbelegt.

> Alle Demodaten sind frei erfunden. Namen, Policen, Boote und Schäden bilden keine
> realen Personen oder Verträge ab.
