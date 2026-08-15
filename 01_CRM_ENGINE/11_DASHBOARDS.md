# 11. Dashboards und Reporting

## 11.1 Gestaltungsprinzipien

1. **Jede Kachel führt zu einer Handlung.** Eine Zahl ohne klickbare Liste dahinter wird nicht gebaut.
2. **Maximal 7 Kacheln je Dashboard.** Alles Weitere ist ein Bericht, kein Dashboard.
3. **Rot bedeutet immer: Es fehlt eine Handlung.** Nicht: „Wert ist niedrig".
4. **Zeitbezug immer sichtbar** (Stand, Vergleichszeitraum, Zielwert).
5. **Rollenbezug:** Jeder sieht standardmäßig seinen eigenen Bereich; Leitung schaltet auf Team/Gesamt um.

---

## 11.2 Vertriebsdashboard (Rolle: Vertrieb, Innendienst)

*Zweck: Wo ist heute Umsatz zu holen?*

| # | Kachel | Inhalt | Klickziel | Alarm |
|---|---|---|---|---|
| 1 | **Heiße Leads** | A-Leads offen, davon SLA-kritisch | Leadliste, sortiert nach Score | Rot bei SLA-Verstoß |
| 2 | **Offene Opportunities** | Anzahl + Bruttowert, Verteilung über Pipeline (Trichter) | Opportunity-Liste | Rot bei Opportunity ohne offene Aufgabe |
| 3 | **Angebotsstatus** | Versendet / geöffnet / in Verhandlung / läuft in ≤ 7 Tagen ab | Angebotsliste | Rot bei Ablauf ≤ 3 Tagen |
| 4 | **Umsatzpotenzial** | Gewichteter Forecast laufender Monat + Quartal, gegen Ziel | Forecast-Detail | Gelb < 80 %, Rot < 60 % des Ziels |
| 5 | **Abschlusswahrscheinlichkeit** | Ø Wahrscheinlichkeit + Verteilung, Top-5-Chancen nach Erwartungswert | Opportunity-Cockpit | – |
| 6 | **Meine Tagesliste** | Top 5 Next Best Actions mit Begründung | Aufgabenliste | Rot bei Überfälligkeit |
| 7 | **Aktivitätspuls** | Aktivitäten heute/Woche, Erreichungsquote, Termine | Timeline | Gelb bei Aktivitätslücke |

**Trichterdarstellung (Kernvisualisierung):**
```
Neu            ████████████████████  42 Chancen ·  412.000 €
In Bearbeitung ███████████           28         ·  296.000 €
Angebot        ███████               17         ·  198.000 €
Verhandlung    ████                   9         ·  121.000 €
── gewichtet ────────────────────────────────────  198.400 €  (Ziel Q3: 180.000 € ✓)
```

---

## 11.3 CRM Dashboard (Rolle: Innendienst, CRM-Verantwortliche)

*Zweck: Läuft der Betrieb sauber? Fällt nichts durchs Raster?*

| # | Kachel | Inhalt | Alarm |
|---|---|---|---|
| 1 | **Neue Leads** | Heute / 7 Tage / 30 Tage, je Quelle, Kategorienverteilung | Rot bei ungenutzten A-Leads |
| 2 | **Neue Kunden** | Abschlüsse Periode, Ø Wert, Ø Verkaufszyklus | – |
| 3 | **Wiedervorlagen** | Heute fällig / diese Woche / überfällig, nach Typ | Rot bei Überfälligkeit |
| 4 | **Offene Aufgaben** | Gesamt, je Benutzer, überfällig, SLA-verletzt, eskaliert | Rot bei Eskalation Stufe 2 |
| 5 | **Vergessenswächter** | Leads/Opportunities ohne offene Aufgabe (**Zielwert 0**) | Immer rot, wenn > 0 |
| 6 | **Datenqualität** | Fehlende Pflichtfelder, Dublettenkandidaten, fehlende Einwilligungen | Gelb ab 5 %, Rot ab 10 % |
| 7 | **Empfehlungen** | Neu / in Bearbeitung / ohne Rückmeldung an den Geber | Rot bei fehlender Rückmeldung |

---

## 11.4 Management Dashboard (Rolle: Vertriebs-/Geschäftsleitung)

*Zweck: Wirkt das System? Wo investieren wir?*

| # | Kachel | Inhalt |
|---|---|---|
| 1 | **Conversion Rate** | Trichter S1→S2→S3→S4→S5 mit Übergangsquoten und Vormonatsvergleich |
| 2 | **Pipeline** | Brutto, gewichtet, Commit, Best Case je Team und Monat; Coverage-Faktor |
| 3 | **Umsatz** | Neugeschäft, Bestandszuwachs, verlorene Prämie, Netto-Bestandsentwicklung, Zielerreichung |
| 4 | **Leadquellen** | Quellen-Index-Ranking, CPL, CAC, ROI, Conversion je Quelle; Budget vs. Ergebnis |
| 5 | **Customer Value** | CVS-Verteilung, VIP-Anteil, Umsatzkonzentration (Top 10 %), Bestandsverlustquote |
| 6 | **Risiko** | Kunden mit Risk ≥ 65 nach Prämienvolumen, Rückholquote, gefährdete Jahresprämie |
| 7 | **Systemwirkung** | Handlungsquote, Reaktionszeit-Median, Anteil systemgenerierter gewonnener Opportunities |

**Kachel 7 ist die wichtigste des gesamten Moduls.** Sie beantwortet:
*Erzeugt das CRM tatsächlich Umsatz — oder verwaltet es nur?*
Gemessen als Anteil der gewonnenen Opportunities mit `ursprung IN ('buying_signal',
'next_best_offer', 'hauptfaelligkeit', 'empfehlung')` am Gesamtneugeschäft.
**Zielwert nach 12 Monaten: ≥ 35 %.**

---

## 11.5 Reporting

### Täglich (automatisch 07:00, E-Mail + In-App)

| Empfänger | Inhalt |
|---|---|
| Vertrieb | Eigene Tagesliste, neue Leads, überfällige Aufgaben, ablaufende Angebote |
| Teamleitung | Team-SLA-Verstöße, Leads ohne Erstkontakt, Eskalationen, Tagesabschlüsse |
| Geschäftsleitung (kurz) | Neue Leads, Abschlüsse, Umsatz gestern, Pipelineveränderung |

### Wöchentlich (Montag 07:00)

| Bericht | Inhalt |
|---|---|
| **Conversion-Bericht** | Übergangsquoten je Stufe, Vorwochenvergleich, Engpassanalyse |
| **Aktivitätenbericht** | Aktivitäten je Benutzer und Typ, Erreichungsquote, Dokumentationsverzug, Folgeaktionsquote |
| **Empfehlungsbericht** | Neue Empfehlungen, Status, Erfolgsquote, Top-Geber, offene Rückmeldungen |
| **Pipeline-Review** | Stillstände, Prognoseänderungen, Coverage, Top-10-Chancen |

### Monatlich (1. Werktag)

| Bericht | Inhalt |
|---|---|
| **Umsatzbericht** | Neugeschäft, Bestand, Storno, Deckungsbeitrag, Zielerreichung je Team |
| **Top Leads** | 20 höchstbewertete offene Leads mit Wert, Alter und Status |
| **Top Kunden** | Nach CVS und Jahresprämie, mit Veränderung zum Vormonat |
| **Top Quellen** | Quellen-Index-Ranking mit CPL, CAC, ROI und Budgetempfehlung |
| **Risikobericht** | Kündigungsrisiken, Ursachenverteilung, Erfolg der Rückholmaßnahmen |
| **Systemqualität** | Regelwirksamkeit, `verworfen`-Quoten, Modellgüte (AUC, Kalibrierung, Drift) |

### Quartalsweise
Kohortenanalyse (Leadjahrgänge → Umsatz über Zeit), Modell-Review mit Neutraining,
Territoriums- und Kapazitätsprüfung, Überprüfung aller Score-Gewichte gegen Ist-Daten.

### Ad-hoc
Jede Dashboard-Kachel ist als CSV/XLSX exportierbar. Freie Auswertungen über
Read-Replica und BI-Anbindung. Personenbezogene Exporte werden in `crm_audit_log`
mit Aktion `export` protokolliert.
