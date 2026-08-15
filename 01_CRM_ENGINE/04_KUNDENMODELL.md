# 4. Kundenmodell

## 4.1 Struktur: Kontakt, Kunde, Organisation

```
crm_organisation  (Firma, Verein, Chartergesellschaft, Werft)
        │ 1:n
crm_kunde (Account — wirtschaftliche Einheit, Träger von Verträgen & Umsatz)
        │ n:m über crm_kunde_kontakt (Rolle: Inhaber, Skipper, Mitversicherter,
        │                             Buchhaltung, Entscheider, Ehepartner)
crm_kontakt (Person — Träger von Kommunikation, Signalen & Einwilligung)
```

**Warum getrennt?** Ein Kunde „Nordwind Charter GmbH" hat 5 Boote, 3 Ansprechpartner
und 8 Verträge. Ein Privatkunde „Familie Kramer" hat 1 Boot, 2 Kontakte
(Eigner + Ehepartner als Mitversicherte) und 3 Verträge. Beides muss dasselbe Modell tragen.

---

## 4.2 360-Grad-Kundenakte

Die Kundenakte ist die zentrale Arbeitsfläche. Sie besteht aus **12 Blöcken**.
Jeder Block wird lazy geladen; die Kopfzeile ist immer sofort sichtbar.

### Block 0 — Kopfzeile (immer sichtbar, auch mobil)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ⚓ Nordwind Charter GmbH            [VIP] [Empfehlungsgeber] [Bestandskunde]  │
│ CVS 86 ●●●●●○   Risk 22 ▲ niedrig   Leadscore aktiv: 74 (B)                  │
│ Betreuer: M. Sanders  ·  Kunde seit 2019  ·  Jahresprämie 14.280 €           │
│ ▸ Nächste Aktion: Hauptfälligkeitsgespräch bis 22.09.  [Anrufen] [E-Mail]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Blockübersicht

| # | Block | Inhalt | Datenherkunft |
|---|---|---|---|
| 1 | **Stammdaten** | Anschrift, Rechtsform, Steuernummer, Bankverbindung (maskiert), Sprache, Kommunikationspräferenzen | CRM |
| 2 | **Boote** | Alle Objekte: Typ, Länge, Baujahr, Wert, Liegeplatz, Fahrgebiet, Zustand | Read-Model Objektmodul |
| 3 | **Kontakte** | Personen mit Rolle, Erreichbarkeit, Einwilligung, letzter Kontakt | CRM |
| 4 | **Verträge** | Police, Produkt, Prämie, Beginn, Hauptfälligkeit, Deckungssummen, Selbstbehalt, Status | Read-Model Vertragsmodul |
| 5 | **Dokumente** | Angebote, Policen, Nachträge, Korrespondenz, Fotos | Referenz Dokumentenmodul |
| 6 | **Schäden** | Schadendatum, Art, Höhe, Status, Regulierungsdauer, Zufriedenheit | Read-Model Schadenmodul |
| 7 | **Aktivitäten** | Chronologischer Verlauf aller Interaktionen mit Ergebnis | CRM |
| 8 | **Opportunities** | Offene und historische Chancen mit Wert und Status | CRM |
| 9 | **Empfehlungen** | Ausgesprochene und erhaltene Empfehlungen mit Status und Umsatz | CRM |
| 10 | **Aufgaben** | Offene, überfällige und geplante Aufgaben | CRM |
| 11 | **Scores & Signale** | Lead Score, CVS, Risk Score, Engagement, Signalverlauf 90 Tage, Erklärung | CRM Scoring |
| 12 | **Partnerbeziehungen** | Werft, Marina, Händler, Yachtclub, Empfehlungsgeber, betreuender Partner | CRM |

### Kontextpanel „Intelligenz" (rechte Spalte, Kern des Systems)
```
┌─ EMPFEHLUNGEN DES SYSTEMS ─────────────────────┐
│ ⚡ Hauptfälligkeit in 47 Tagen — Gespräch fällig│
│ 💰 Cross-Sell: Skipper-Haftpflicht fehlt        │
│    Potenzial ca. 340 €/Jahr · Trefferquote 41 % │
│ ⚠ Boot „Seeadler" Wert seit 2021 nicht geprüft │
│    Unterversicherungsrisiko                     │
│ 🤝 Empfehlungspotenzial hoch (CVS 86, Risk 22)  │
│    Letzte Anfrage vor 14 Monaten                │
└────────────────────────────────────────────────┘
```

---

## 4.3 Customer Value Engine

### 4.3.1 Zweck
Der Customer Value Score (CVS) beantwortet: *Wie viel Aufmerksamkeit verdient dieser
Kunde und wie viel Verlust entsteht, wenn er geht?* Er steuert Betreuungsintensität,
Priorität in der Tagesliste, VIP-Status und Eskalationsstufe.

### 4.3.2 Gewichtungsmodell (0–100)

Die Euro-Schwellen sind auf Boots- und Yachtprämien kalibriert: privat typischerweise
200–3.000 €, gewerblich 3.000–20.000 €. Schwellen aus einem Industrieportfolio hätten
den gesamten Bestand in die unteren Betreuungsstufen gedrückt.

| Block | Kriterium | Punkte | Berechnung |
|---|---|---|---|
| **A Wirtschaft (55)** | Jahresprämie | 0–30 | ≥ 10.000 €: 30 · 5.000–9.999 €: 25 · 2.500–4.999 €: 19 · 1.200–2.499 €: 13 · 500–1.199 €: 8 · > 0: 4 |
| | Lifetime Value (kumuliert) | 0–25 | ≥ 60.000 €: 25 · 25.000–59.999 €: 20 · 10.000–24.999 €: 15 · 3.000–9.999 €: 9 · > 0: 4 |
| **B Vertrieb (15)** | Abschlussquote (Angebote → Verträge) | 0–10 | ≥ 80 %: 10 · 60–79 %: 8 · 40–59 %: 5 · 20–39 %: 3 · < 20 %: 1 · ohne Historie: 3 |
| | Vertragsdichte (Verträge je Boot) | 0–5 | ≥ 3: 5 · 2: 3 · 1: 1 |
| **C Netzwerk (15)** | Erfolgreiche Empfehlungen | 0–15 | ≥ 5: 15 · 3–4: 12 · 2: 9 · 1: 6 · 0 (aber ausgesprochen): 3 |
| **D Community (5)** | Academy, Events, Regatta, Marketplace | 0–5 | ≥ 4 Aktivitäten/Jahr: 5 · 2–3: 3 · 1: 2 · 0: 0 |
| **E Partner (10)** | Kunde ist zugleich Partner (Werft, Marina, Händler, Club) | 0–10 | aktiver Partner mit Zuführung: 10 · Partner ohne Zuführung: 5 |

**Normierung auf erreichbare Punkte.** Block E ist nur für Kunden erreichbar, die
selbst Partner sind — für den weit überwiegenden Teil des Bestands liegt er sonst als
totes Gewicht im Nenner und macht die oberen Stufen rechnerisch unerreichbar. Deshalb:

```
cvs = 100 · (A + B + C + D + E) / (55 + 15 + 15 + 5 + (10 falls Partner)) + Modifikatoren
```

Dieselbe Mechanik wie beim Lead Score (siehe 03_LEADMODELL.md 4.3b): Fehlt ein Kanal
strukturell, schrumpft der Nenner statt des Zählers.

**Modifikatoren (additiv nach der Normierung, Ergebnis auf 0–100 gekappt):**

| Modifikator | Effekt |
|---|---|
| Beziehungsdauer ≥ 10 Jahre | +5 |
| Beziehungsdauer 5–9 Jahre | +3 |
| Zahlungsverzug > 60 Tage offen | −10 |
| Schadenquote > 120 % (3-Jahres-Sicht) | −8 |
| ≥ 2 Beschwerden in 12 Monaten | −6 |
| Strategisches Segment (Flotte ≥ 5 Boote) | +8 |

### 4.3.3 Kategorien und Betreuungsmodell

| CVS | Kategorie | Betreuung | Kontaktfrequenz | SLA |
|---|---|---|---|---|
| 80–100 | **VIP** | Named Account, Senior-Betreuer | halbjährlich persönlich | ≤ 2 h |
| 60–79 | **Kernkunde** | Fester Betreuer | jährlich persönlich | ≤ 4 h |
| 35–59 | **Standardkunde** | Team-Betreuung | jährlich digital + Anlassbezug | ≤ 24 h |
| 15–34 | **Basiskunde** | Automatisiert | anlassbezogen | ≤ 48 h |
| 0–14 | **Beobachtung** | Automatisiert, Wirtschaftlichkeitsprüfung | nur Pflichtkommunikation | – |

### 4.3.4 Berechnungsrhythmus
- **Nächtlich:** Blöcke B, C, D (aktivitätsgetrieben)
- **Monatlich:** Blöcke A, E (wirtschaftsgetrieben)
- **Sofort (Event):** Neuvertrag, Kündigung, erfolgreiche Empfehlung, Beschwerde
- **Historisierung:** Monatlicher Snapshot in `crm_kunde_score_historie` für Trendanalyse

---

## 4.4 Kündigungsrisiko (Churn Engine)

### 4.4.1 Warum das Modul existiert
Ein verlorener Bestandskunde kostet das 5- bis 7-fache eines gehaltenen. Im
Bootsbereich ist Abwanderung fast immer **still**: kein Streit, kein Anruf —
der Kunde kündigt zur Hauptfälligkeit. Deshalb misst dieses Modul **Stille**.

### 4.4.2 Risikomerkmale

Das Modell trennt **Verhaltensmerkmale** (bilden die Bewertungsbasis) von
**harten Ereignissen** (wirken als Eskalatoren). Grund: Zahlungsverzug, Bootsverkauf
und Teilkündigung treten selten gleichzeitig mit Stille auf. Lägen sie im Nenner,
könnte ein Kunde jedes Stille-Kriterium erfüllen und bliebe dennoch unter der
Alarmschwelle — genau der Fall, für den dieses Modul gebaut ist.

**Verhaltensmerkmale (Nenner, Summe 70):**

| Code | Merkmal | Gewicht | Schwelle |
|---|---|---|---|
| `R-01` | Tage seit letztem beidseitigen Kontakt | 20 | linear bis 270 Tage |
| `R-03` | Keine Newsletterreaktion in 12 Monaten | 8 | erfüllt = voll |
| `R-04` | Schadenregulierung mit Zufriedenheit ≤ 2/5 | 12 | erfüllt = voll |
| `R-05` | Beschwerde in den letzten 12 Monaten | 10 | erfüllt = voll |
| `R-06` | Prämienerhöhung > 15 % zur letzten Hauptfälligkeit | 12 | erfüllt = voll |
| `R-12` | Jahresgespräch überfällig > 90 Tage | 8 | erfüllt = voll |

```
risk_basis = 100 · Σ(gewicht · erfuellungsgrad) / 70
```

**Eskalatoren (heben den Wert unmittelbar auf mindestens 65):**

| Code | Ereignis |
|---|---|
| `R-07` | Zahlungsverzug > 30 Tage |
| `R-08` | Boot verkauft oder abgemeldet, kein Nachfolgeobjekt |
| `R-10` | Teilkündigung in den letzten 12 Monaten |
| `R-01+` | **Stiller Rückzug:** kein Kontakt seit über 270 Tagen bei Kundenwert ≥ 35 |

Der letzte Eskalator ist der wichtigste. Stille allein stellt nur 28 der 70
Verhaltenspunkte; ohne ihn erreichte ein Kunde, der seit einem Jahr kein Wort gehört
hat, höchstens die Stufe „mittel" — und damit keine Rückholaufgabe. Die Grenze von 35
Kundenwertpunkten sorgt dafür, dass der Rückholaufwand wirtschaftlich bleibt.

### 4.4.3 Risikostufen und Pflichthandlungen

| Risk Score | Stufe | Pflichthandlung | Frist | Eskalation |
|---|---|---|---|---|
| 65–100 | **Hoch** | Persönlicher Rückholkontakt durch Betreuer; bei CVS ≥ 60 durch Vertriebsleitung | 5 Werktage | Nach 5 Tagen ohne Aktivität automatisch an Teamleitung |
| 35–64 | **Mittel** | Beziehungspflegekontakt (Anruf oder persönliche Mail) | 15 Werktage | Sammelaufgabe im Wochenplan |
| 0–34 | **Niedrig** | Regelkommunikation | – | – |

**Zusatzregel (A-25):** Risk Score ≥ 65 **und** CVS ≥ 70 → höchste Systempriorität.
Diese Kombination steht immer an Position 1 der Tagesliste, unabhängig von allen
anderen Punkten — der Verlust eines wertvollen, gefährdeten Kunden ist der teuerste
Fehler des Systems.

### 4.4.4 Erklärbarkeit
Jede Risikobewertung liefert die drei stärksten Treiber im Klartext, z. B.:
> Risiko 71 (hoch) — Treiber: 312 Tage kein Kontakt, Prämienerhöhung 18 % zur
> letzten Hauptfälligkeit, Jahresgespräch seit 140 Tagen überfällig.

---

## 4.5 Empfehlungsmanagement

### 4.5.1 Grundsatz
> **Jede Empfehlung wird zu einem Lead. Ohne Ausnahme. Automatisch.**
> Und jeder Empfehlungsgeber erfährt, was aus seiner Empfehlung wurde.

Die zweite Regel entscheidet über die Wiederholung. Ein Empfehlungsgeber, der nie
Rückmeldung bekommt, empfiehlt kein zweites Mal.

### 4.5.2 Datenmodell Empfehlung

| Feld | Bemerkung |
|---|---|
| `empfehlungsgeber_kontakt_id` / `empfehlungsgeber_partner_id` | genau eines gesetzt |
| `empfohlener_name`, `empfohlener_email`, `empfohlener_telefon` | Rohdaten der Empfehlung |
| `erzeugter_lead_id` | automatisch erzeugt, Pflicht ab Status `angenommen` |
| `beziehung` | `familie`, `freund`, `crew`, `stegnachbar`, `geschaeftlich`, `verein` |
| `anlass` | `gespraech`, `event`, `kampagne`, `schaden_positiv`, `abschluss`, `partnerportal` |
| `status` | siehe 4.5.3 |
| `wert_eur` | realisierte Jahresprämie bei Erfolg |
| `praemie_geber` | Gegenleistung (Sachprämie, Gutschein, Spende, Rabatt) |
| `rueckmeldung_am` | Zeitpunkt der letzten Statusrückmeldung an den Geber |
| `dsgvo_hinweis_erfolgt` | Pflicht: Der Empfohlene muss über die Herkunft informiert werden |

### 4.5.3 Empfehlungsstatus

| Status | Bedeutung | Automatik |
|---|---|---|
| `eingegangen` | Empfehlung erfasst | Lead anlegen, Aufgabe „Erstkontakt Empfehlung" (SLA 24 h), Dank an Geber |
| `kontaktiert` | Erstkontakt erfolgt | Statusmeldung an Geber |
| `qualifiziert` | Bedarf bestätigt | Opportunity anlegen |
| `angebot` | Angebot liegt vor | Statusmeldung an Geber |
| `gewonnen` | Abschluss erfolgt | Dank + Prämie an Geber, CVS-Neuberechnung, Rolle `empfehlungsgeber` setzen |
| `verloren` | Kein Abschluss | Persönliche Rückmeldung an Geber (**Pflicht**, keine Automatikmail) |
| `kein_interesse` | Empfohlener will nicht | Freundliche Rückmeldung, keine weitere Ansprache |
| `ungueltig` | Daten unbrauchbar / Dublette | Rückfrage an Geber |

### 4.5.4 Empfehlungs-KPIs

| KPI | Formel | Zielwert |
|---|---|---|
| Empfehlungsquote | Kunden mit ≥ 1 Empfehlung / Bestandskunden | ≥ 15 % |
| Empfehlungen je aktivem Geber | Empfehlungen / aktive Geber (12 Monate) | ≥ 1,8 |
| Erfolgsquote | `gewonnen` / (`gewonnen` + `verloren`) | ≥ 45 % |
| Umsatz aus Empfehlungen | Σ `wert_eur` bei Status `gewonnen` | ≥ 30 % des Neugeschäfts |
| Ø Zeit Empfehlung → Erstkontakt | Median | ≤ 24 h |
| Rückmeldequote | Empfehlungen mit Rückmeldung / alle | 100 % |

### 4.5.5 Auslöser für Empfehlungsanfragen (A-28)
Eine Empfehlungsanfrage wird **nur** ausgelöst, wenn alle Bedingungen erfüllt sind:
CVS ≥ 65 · Risk Score < 35 · keine offene Beschwerde · letzte Anfrage > 9 Monate her.
Zusätzlich bevorzugt nach positivem Ereignis: erfolgreicher Schadenabschluss (Zufriedenheit ≥ 4/5),
Vertragsabschluss, Jahresgespräch mit positivem Ergebnis, Eventteilnahme.

---

## 4.6 Partnerkontakte

### 4.6.1 Partnertypen

| Typ | Rolle im Vertrieb | Erfolgsmessung |
|---|---|---|
| **Werft** | Neubau-/Refit-Zuführung, hoher Bootswert | Leads, Ø Bootswert, Abschlussquote |
| **Händler** | Bootskauf-Zuführung, Timing perfekt | Leads, Conversion, Courtage |
| **Marina** | Liegeplatz-Netzwerk, Breitenzugang | Leads, Kontaktdichte |
| **Yachtclub** | Vertrauens- und Multiplikatorwirkung | Leads, Eventteilnahmen |
| **Charterbetrieb** | Gewerbliches Flottengeschäft | Volumen, Verträge je Partner |
| **Sachverständiger** | Wertgutachten, Schadenfälle | Zuführungen, Fachqualität |
| **Vermittler / Makler** | Kooperationsgeschäft | Bestand, Courtage |

### 4.6.2 Partnerbewertung (Partner Value Score 0–100)
Gleiche Mechanik wie CVS, andere Blöcke:
Zugeführte Leads (0–30) · Abschlussquote der Zuführungen (0–25) ·
Umsatz aus Zuführungen (0–25) · Aktivität & Erreichbarkeit (0–10) ·
Vertragliche Bindung/Exklusivität (0–10).

**Steuerung:** Partner Value < 25 bei ≥ 12 Monaten Laufzeit → Aufgabe „Partnerschaft prüfen".
Partner Value ≥ 75 → Aufgabe „Ausbau/Exklusivität verhandeln" + Einladung Partnerprogramm.

### 4.6.3 Partnerbeziehungen im Kundenkontext
Jeder Kunde kann mit mehreren Partnern verknüpft sein (`crm_partner_beziehung`):
Liegeplatz-Marina, Kaufhändler, betreuende Werft, Yachtclub-Mitgliedschaft,
zuführender Partner. Diese Beziehungen sind vertrieblich Gold: Sie zeigen, über
welchen Weg ein ähnlicher Kunde erreichbar ist, und sie speisen den
Empfehlungs- und Netzwerkscore.
