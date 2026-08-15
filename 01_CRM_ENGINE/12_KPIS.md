# 12. KPIs

## 12.1 KPI-Systematik

Jede Kennzahl hat: **Code · Definition · Formel · Quelle · Frequenz · Zielwert · Verantwortlicher · Handlung bei Abweichung.**
Ohne Handlung bei Abweichung ist es keine KPI, sondern eine Zahl.

Vier Ebenen:
- **N — Nordstern** (Wirkung des Gesamtsystems)
- **V — Vertrieb** (Ergebnis)
- **P — Prozess** (Führung im Tagesgeschäft)
- **Q — Qualität** (Daten und Systemgesundheit)

---

## 12.2 Nordstern-KPIs

| Code | Kennzahl | Formel | Frequenz | Ziel (12 Mon.) | Abweichungshandlung |
|---|---|---|---|---|---|
| **N-01** | Handlungsquote | erledigte Systemaufgaben am Fälligkeitstag / erzeugte Systemaufgaben | täglich | ≥ 80 % | < 60 %: Regelprüfung (Übermenge?) + Coaching |
| **N-02** | Systemgenerierter Umsatzanteil | Σ Wert gewonnener Opportunities mit `ursprung ≠ manuell` / Σ Wert gewonnen | monatlich | ≥ 35 % | < 20 %: Signal-/NBO-Regeln nachschärfen |
| **N-03** | Vergessensquote | aktive Vorgänge ohne offene Aufgabe / aktive Vorgänge | täglich | **0 %** | > 0: A-01/A-14 prüfen, sofort Aufgaben nacherzeugen |
| **N-04** | Lead-Reaktionszeit (Median) | Median(`erstkontakt_am − eingegangen_am`) in Arbeitsstunden | täglich | ≤ 4 h | > 8 h: Zuweisungs- und Kapazitätsregeln prüfen |
| **N-05** | Lead→Abschluss-Quote | gewonnene Opportunities / qualifizierte Leads | monatlich | ≥ 22 % | < 15 %: Qualifizierungskriterien und Quellenmix prüfen |
| **N-06** | Bestandsverlustquote | gekündigte Jahresprämie / Bestandsprämie Periodenbeginn | monatlich | ≤ 6 % p. a. | > 8 %: Churn-Modell und Rückholprozess überprüfen |

---

## 12.3 Vertriebs-KPIs

| Code | Kennzahl | Formel | Frequenz | Ziel |
|---|---|---|---|---|
| V-01 | Neue Leads | COUNT(Leads) | täglich | nach Plan |
| V-02 | Qualifizierungsquote | qualifizierte / neue Leads | wöchentlich | ≥ 45 % |
| V-03 | Angebotsquote | Opportunities mit Angebot / Opportunities | wöchentlich | ≥ 70 % |
| V-04 | Angebotsöffnungsrate | geöffnete / versendete Angebote | wöchentlich | ≥ 65 % |
| V-05 | Annahmequote Angebot | angenommene / entschiedene Angebote | monatlich | ≥ 40 % |
| V-06 | Ø Verkaufszyklus | Median(Abschluss − Leadeingang) in Tagen | monatlich | ≤ 35 Tage |
| V-07 | Ø Abschlusswert | Σ Wert gewonnen / Anzahl gewonnen | monatlich | ≥ 1.900 € Jahresprämie |
| V-08 | Pipeline-Coverage | Bruttopipeline / Periodenziel | wöchentlich | ≥ 3,0 |
| V-09 | Prognosegüte | 1 − \|Forecast − Ist\| / Ist | monatlich | ≥ 85 % |
| V-10 | Cross-Sell-Quote | Kunden mit ≥ 2 Verträgen / Bestandskunden | monatlich | ≥ 35 % |
| V-11 | Verträge je Kunde | Σ aktive Verträge / Bestandskunden | monatlich | ≥ 1,6 |
| V-12 | Empfehlungsanteil Neugeschäft | Umsatz aus Empfehlung / Neugeschäftsumsatz | monatlich | ≥ 30 % |
| V-13 | Rückgewinnungsquote | reaktivierte / ehemalige Kunden (12-Monats-Fenster) | quartalsweise | ≥ 12 % |
| V-14 | Deckungsbeitrag je Abschluss | Σ Courtage − zurechenbare Kosten | monatlich | steigend |

---

## 12.4 Prozess-KPIs

| Code | Kennzahl | Formel | Frequenz | Ziel |
|---|---|---|---|---|
| P-01 | SLA-Erfüllung Erstkontakt | Leads im SLA kontaktiert / Leads | täglich | ≥ 95 % |
| P-02 | Überfällige Aufgaben | offene Aufgaben mit `faellig_am` < heute | täglich | ≤ 5 % des Bestands |
| P-03 | Eskalationsquote | eskalierte Aufgaben / Aufgaben | wöchentlich | ≤ 3 % |
| P-04 | Aufgaben-Erledigungsdauer | Median(`erledigt_am − erstellt_am`) | wöchentlich | ≤ 2 Werktage |
| P-05 | Stillstandsquote Pipeline | Opportunities über max. Verweildauer / offene Opportunities | wöchentlich | ≤ 10 % |
| P-06 | Erreichungsquote Anruf | `erreicht_*` / Anrufaktivitäten | wöchentlich | ≥ 45 % |
| P-07 | Folgeaktionsquote | Aktivitäten mit Folgeaktion ≠ `keine` / Aktivitäten | wöchentlich | ≥ 95 % |
| P-08 | Dokumentationsverzug | Median(`erfasst_am − zeitstempel`) | wöchentlich | ≤ 4 h |
| P-09 | Wiedervorlagen-Erfüllung | erledigte / fällige Wiedervorlagen | wöchentlich | ≥ 90 % |
| P-10 | Rückmeldequote Empfehlungen | Empfehlungen mit Rückmeldung / Empfehlungen | monatlich | 100 % |
| P-11 | Jahresgesprächsquote | geführte / fällige Jahresgespräche | quartalsweise | ≥ 85 % |
| P-12 | Kapazitätsauslastung | offene Aufgaben je Benutzer | täglich | 10–25 |

---

## 12.5 Qualitäts- und Modell-KPIs

| Code | Kennzahl | Formel | Frequenz | Ziel |
|---|---|---|---|---|
| Q-01 | Pflichtfeldvollständigkeit | Datensätze ohne fehlende Pflichtfelder / alle | täglich | ≥ 98 % |
| Q-02 | Dublettenquote | erkannte Dubletten / Kontakte | monatlich | ≤ 1 % |
| Q-03 | Consent-Abdeckung | Kontakte mit dokumentierter Einwilligung / kontaktierbare | monatlich | ≥ 95 % |
| Q-04 | Quellenzuordnung | Leads mit gültiger Quelle / Leads | täglich | 100 % |
| Q-05 | Verlustgrund-Erfassung | verlorene Opportunities mit Grund / verlorene | wöchentlich | 100 % (per Constraint erzwungen) |
| Q-06 | Regel-Verwerfungsquote | verworfene / erzeugte Automatikaufgaben je Regel | wöchentlich | ≤ 15 % je Regel |
| Q-07 | Modellgüte Lead Score | AUC auf Holdout | wöchentlich | ≥ 0,78 |
| Q-08 | Kalibrierung | Brier Score | wöchentlich | ≤ 0,18 |
| Q-09 | Modell-Drift | max. PSI über alle Merkmale | wöchentlich | ≤ 0,25 |
| Q-10 | Score-Übersteuerungsquote | manuelle Kategorieänderungen / Leads | monatlich | ≤ 10 % (höher = Modell nicht akzeptiert) |
| Q-11 | Automatisierungsanteil Aktivitäten | automatisch erfasste / alle Aktivitäten | monatlich | ≥ 60 % |
| Q-12 | Systemverfügbarkeit | Uptime Kernzeit | monatlich | ≥ 99,9 % |

---

## 12.6 KPI-Kaskade (Wirkungszusammenhang)

```
N-03 Vergessensquote = 0
        │  ermöglicht
        ▼
P-01 SLA-Erfüllung ≥ 95 %  ──▶  N-04 Reaktionszeit ≤ 4 h
        │                              │
        ▼                              ▼
V-02 Qualifizierungsquote ≥ 45 %  ──▶  V-03 Angebotsquote ≥ 70 %
        │                              │
        ▼                              ▼
N-05 Lead→Abschluss ≥ 22 %  ◀──────  V-05 Annahmequote ≥ 40 %
        │
        ▼
V-07 Ø Abschlusswert × Menge  ──▶  UMSATZ
        │
        ▼
V-10/V-11 Cross-Sell + V-12 Empfehlungsanteil  ──▶  CVS ↑  ──▶  N-06 Verlustquote ↓
```

**Lesart:** Die Kette beginnt nicht beim Umsatz, sondern bei der Vergessensquote.
Wenn nichts liegen bleibt und schnell reagiert wird, folgt der Rest — jede
weitere KPI ist Verstärkung, nicht Ursache.

## 12.7 Zielwertsteuerung

| Regel | Festlegung |
|---|---|
| Baseline | Erste 8 Wochen nach Produktivsetzung = Messung ohne Zielwerte |
| Zielsetzung | Danach Zielwerte je Team auf Basis der Baseline + realistischem Delta |
| Überprüfung | Quartalsweise; Zielwerte, die 2 Quartale übererfüllt werden, werden angehoben |
| Fehlanreize | Aktivitätenzahl ist **kein** Zielwert (nur Kennzahl) — sonst entstehen Scheinaktivitäten |
| Transparenz | Jeder Mitarbeiter sieht seine eigenen KPIs jederzeit; Teamvergleiche nur auf Teamebene |
