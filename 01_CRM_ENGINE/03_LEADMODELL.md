# 3. Leadmodell

## 3.1 Grundstruktur

Das CRM trennt strikt zwischen **Person** und **Absicht**:

```
crm_kontakt (Person, dauerhaft, eine Identität)
     │ 1:n
     ├── crm_lead (Absicht #1: "Neue Yacht 12 m, Ostsee, Kaskoversicherung")
     ├── crm_lead (Absicht #2: "Skipper-Haftpflicht für Charterurlaub")
     └── crm_lead (Absicht #3: "Flottendeckung für Chartergesellschaft")
```

Damit gilt: Ein Kontakt kann gleichzeitig Bestandskunde **und** Lead sein.
Ein Bestandskunde mit neuem Bootskaufinteresse ist ein Lead — und der wertvollste,
den es gibt.

## 3.2 Leaddatenmodell (fachlich)

### 3.2.1 Identität & Kontakt
| Feld | Typ | Pflicht | Bemerkung |
|---|---|---|---|
| `anrede`, `titel`, `vorname`, `nachname` | Text | Nachname | |
| `firma`, `rechtsform` | Text | – | löst Organisationsverknüpfung aus |
| `email`, `telefon`, `mobil` | Text | mind. 1 | E.164-Normalisierung bei Telefon |
| `strasse`, `plz`, `ort`, `land` | Text | – | Land Default `DE` |
| `sprache` | Text | ✅ | `de`, `en` — steuert Kommunikation |
| `dsgvo_einwilligung` | Enum | ✅ | `erteilt` / `verweigert` / `unbekannt` / `widerrufen` |
| `einwilligung_kanaele` | jsonb | ✅ | `{email, telefon, whatsapp, post}` je mit Datum + Quelle |

### 3.2.2 Bedarf & Objekt (branchenspezifisch)
| Feld | Typ | Bemerkung |
|---|---|---|
| `bedarfsart` | Enum | `neuversicherung`, `wechsel`, `zusatzdeckung`, `bootswechsel`, `flotte`, `charter`, `skipper`, `transport`, `winterlager` |
| `boot_typ` | Enum | `segelyacht`, `motoryacht`, `sportboot`, `jolle`, `katamaran`, `trawler`, `rib`, `hausboot`, `klassiker`, `jetski`, `sonstiges` |
| `boot_laenge_m` | numeric(5,2) | Segmentierungstreiber |
| `boot_wert_eur` | numeric(14,2) | stärkster statischer Scoretreiber |
| `boot_baujahr` | int | Alter beeinflusst Deckungs- und Beratungsbedarf |
| `motorleistung_kw` | numeric | relevant für Tarifierung |
| `liegeplatz_land`, `liegeplatz_marina` | Text | Partner-/Netzwerkverknüpfung |
| `fahrgebiet` | Enum | `binnen`, `kuestennah`, `nord_ostsee`, `mittelmeer`, `atlantik`, `weltweit` |
| `nutzungsart` | Enum | `privat`, `gewerblich_charter`, `gewerblich_flotte`, `regatta`, `verein` |
| `unternehmerstatus` | bool | gewerbliche Nutzung / Firmenkunde |
| `bestehender_versicherer` | Text | Wettbewerbsanalyse |
| `hauptfaelligkeit_bestand` | date | **wichtigstes Timing-Feld für Wechselgeschäft** |
| `budget_indikation_eur` | numeric | optional |
| `zeitfenster` | Enum | `sofort`, `4_wochen`, `3_monate`, `saison`, `unklar` |

### 3.2.3 Steuerung
| Feld | Typ | Bemerkung |
|---|---|---|
| `quelle_id` | uuid | FK auf `crm_lead_quelle` — **Pflicht** |
| `kampagne_id` | uuid | Brevo-/Marketingkampagne |
| `verantwortlicher_id` | uuid | zugewiesener Vertriebsmitarbeiter |
| `lead_score` | int 0–100 | berechnet |
| `lead_kategorie` | Enum | `A`, `B`, `C`, `D` — abgeleitet |
| `status` | Enum | siehe 3.4 |
| `naechster_schritt_am` | timestamptz | erzwungen durch Aufgabenlogik |
| `disqualifikationsgrund` | Enum | Pflicht bei Status `disqualifiziert` |
| `dublette_von_id` | uuid | Selbstreferenz bei Zusammenführung |

## 3.3 Leadquellen — vollständiger Katalog

Jede Quelle wird mit vier Dimensionen bewertet: **Qualität**, **Kosten**,
**Conversion**, **Umsatz**. Daraus entsteht der **Quellen-Index**
(siehe 3.3.2), der monatlich die Marketingbudgetsteuerung speist.

### 3.3.1 Quellenkatalog

| Code | Quelle | Kategorie | Kostenmodell | Erwartete Qualität | Typischer Erstkontaktkanal |
|---|---|---|---|---|---|
| `WEB` | Webseite (organisch) | Inbound | Fixkosten SEO | Hoch | E-Mail |
| `LP` | Landingpages | Inbound | CPC + Produktion | Hoch | E-Mail |
| `NL` | Newsletter | Owned | Fixkosten | Mittel | E-Mail |
| `BREVO` | Brevo-Kampagne | Owned | Versandkosten | Mittel | E-Mail |
| `EMPF` | Empfehlung (Kunde) | Netzwerk | – / Prämie | **Sehr hoch** | Telefon |
| `HAENDL` | Händler | Partner | Courtage | Hoch | Telefon |
| `WERFT` | Werften | Partner | Courtage | **Sehr hoch** | Telefon |
| `MARINA` | Marinas | Partner | Kooperation | Hoch | Vor Ort / Telefon |
| `YCLUB` | Yachtclubs | Partner | Sponsoring | Hoch | Vor Ort |
| `MESSE` | Messen | Event | Standkosten | Mittel–hoch | Telefon |
| `REGATTA` | Regatten | Event | Sponsoring | Mittel | Telefon |
| `FB` | Facebook | Paid Social | CPC/CPL | Niedrig–mittel | E-Mail |
| `IG` | Instagram | Paid Social | CPC/CPL | Niedrig–mittel | E-Mail |
| `LI` | LinkedIn | Paid Social | CPC/CPL | Mittel (gewerblich hoch) | E-Mail |
| `MKTPL` | Marketplace | Plattform | Provision | Hoch | In-App / E-Mail |
| `ACAD` | Academy | Plattform | Fixkosten | Mittel–hoch | E-Mail |
| `PPORTAL` | Partnerportal | Partner | Courtage | Hoch | Systemübergabe |
| `TEL_IN` | Telefonische Direktanfrage | Inbound | – | Hoch | Telefon |
| `SONST` | Sonstige | – | – | Unbekannt | – |

### 3.3.2 Quellenbewertung (monatlich berechnet)

Je Quelle und Monat werden erfasst:

| Kennzahl | Formel |
|---|---|
| **Leadmenge** | `COUNT(lead)` |
| **Qualitätsindex** | `Ø lead_score` der Quelle |
| **Kosten je Lead (CPL)** | `kosten_monat / leadmenge` |
| **Qualifizierungsquote** | `qualifizierte_leads / leads` |
| **Conversion (Abschlussquote)** | `gewonnene_opportunities / leads` |
| **Umsatz** | `Σ gewonnener_wert` (Jahresprämie) |
| **Kosten je Abschluss (CAC)** | `kosten_monat / abschlüsse` |
| **ROI** | `(umsatz_deckungsbeitrag − kosten) / kosten` |
| **Ø Verkaufszyklus** | Median Tage S1→S5 |
| **Quellen-Index** | `0,35·norm(ROI) + 0,25·norm(Conversion) + 0,20·norm(Qualitätsindex) + 0,20·norm(Umsatz)` → 0–100 |

**Steuerungsregel (A-40):** Quellen-Index < 30 über 3 Monate bei Kosten > 500 EUR/Monat
→ Aufgabe an Marketing „Quelle prüfen oder abschalten".
Quellen-Index > 75 → Aufgabe „Budget erhöhen, Skalierung prüfen".

### 3.3.3 Attribution

| Modell | Verwendung |
|---|---|
| **First Touch** | Quellenbewertung Marketing (welche Quelle erzeugt Bedarf?) |
| **Last Touch** | Vertriebliche Zuordnung (wer hat abgeschlossen?) |
| **Multi-Touch (linear, gewichtet)** | Managementbericht und Budgetallokation |

Alle drei Modelle werden parallel geführt (`crm_lead_attribution`). Die
Provisionsrelevanz richtet sich nach Last Touch, die Budgetsteuerung nach Multi-Touch.

---

## 4. Lead Score (KI-gestützt)

### 4.1 Architektur des Scores

Der Lead Score ist **hybrid** — bewusst, weil ein reines ML-Modell zum Start
keine Trainingsdaten hat und Vertriebsteams einem nicht erklärbaren Score nicht folgen.

```
score_final = round( w_r · score_regel  +  w_m · (100 · p_konversion) )   [0..100]
```

| Phase | Bedingung | `w_r` | `w_m` |
|---|---|---|---|
| **Phase 1 — Cold Start** | < 500 abgeschlossene Leads | 1,00 | 0,00 |
| **Phase 2 — Kalibrierung** | ≥ 500 abgeschlossene Leads, AUC ≥ 0,70 | 0,60 | 0,40 |
| **Phase 3 — Produktiv** | ≥ 2.000 abgeschlossene Leads, AUC ≥ 0,78 | 0,40 | 0,60 |

Der Regelscore bleibt **immer** aktiv — als Erklärungsschicht und als Fallback.

### 4.2 Regelscore — Gewichtungsmodell (max. 100 Punkte)

#### Block A — Objekt & Wert (max. 30)

| Kriterium | Punkte |
|---|---|
| **Bootswert** ≥ 500.000 € | 15 |
| 200.000 – 499.999 € | 13 |
| 100.000 – 199.999 € | 10 |
| 50.000 – 99.999 € | 7 |
| 20.000 – 49.999 € | 4 |
| < 20.000 € | 2 |
| unbekannt | 0 |
| **Bootsgröße** ≥ 18 m | 8 |
| 12 – 17,99 m | 6 |
| 8 – 11,99 m | 4 |
| 5 – 7,99 m | 2 |
| < 5 m / unbekannt | 0 |
| **Bootsalter** ≤ 5 Jahre | 4 |
| 6 – 15 Jahre | 3 |
| 16 – 30 Jahre | 2 |
| > 30 Jahre (Klassiker: +1 Sonderbonus) | 1 |
| **Motorleistung** ≥ 300 kW | 3 |
| 100 – 299 kW | 2 |
| < 100 kW | 1 |

#### Block B — Profil & Region (max. 20)

| Kriterium | Punkte |
|---|---|
| **Fahrgebiet** weltweit / Atlantik | 7 |
| Mittelmeer | 6 |
| Nord-/Ostsee | 5 |
| küstennah | 3 |
| binnen | 2 |
| **Unternehmerstatus** gewerbliche Flotte (≥ 3 Boote) | 8 |
| gewerblich Charter | 6 |
| Verein / Regattateam | 4 |
| privat | 2 |
| **Region** Kernmarkt (definierte PLZ-Gebiete/Reviere) | 5 |
| erweiterter Markt DACH | 3 |
| außerhalb DACH mit Betreuungsfähigkeit | 1 |
| nicht bedienbar | −10 (Sperrsignal) |

#### Block C — Verhalten & Engagement (max. 35)

| Kriterium | Punkte |
|---|---|
| **Websitebesuche** ≥ 8 Sessions / 30 Tage | 7 |
| 4 – 7 Sessions | 5 |
| 2 – 3 Sessions | 3 |
| 1 Session | 1 |
| **Klickverhalten** Klick auf Preis-/Tarifseite | 5 |
| Klick auf Produktdetailseite | 3 |
| Klick auf Blog/Content | 1 |
| **Downloads** Tarifübersicht / Bedingungen | 6 |
| Checkliste / Ratgeber | 3 |
| **Newsletterreaktionen** ≥ 3 Öffnungen + ≥ 1 Klick / 60 Tage | 5 |
| ≥ 1 Öffnung | 2 |
| kein Öffnen bei ≥ 5 Sendungen | −3 |
| **Termine** Termin wahrgenommen | 8 |
| Termin vereinbart | 6 |
| Terminanfrage gestellt | 4 |
| Termin abgesagt ohne Ersatz | −4 |
| **Antwortverhalten** antwortet < 24 h | 4 |
| antwortet < 72 h | 2 |
| keine Antwort nach 3 Versuchen | −5 |

> Blockdeckelung: Block C wird bei 35 gekappt, Abzüge wirken innerhalb des Blocks.

#### Block D — Vertrauen & Netzwerk (max. 15)

| Kriterium | Punkte |
|---|---|
| Empfehlung durch **VIP-Kunde** | 15 |
| Empfehlung durch Bestandskunde | 12 |
| Empfehlung durch Werft / Händler | 11 |
| Empfehlung durch Marina / Yachtclub | 9 |
| Partnerportal-Übergabe | 8 |
| Academy-Teilnehmer (abgeschlossener Kurs) | 5 |
| Marketplace-Aktivität (Inserat/Kauf) | 5 |
| Bestandskunde des Hauses | +10 (Bonus, außerhalb der Kappung) |

### 4.3 Timing-Modifikator (multiplikativ)

Timing ist im Versicherungsvertrieb entscheidend. Der Basisscore wird
mit einem Zeitfaktor multipliziert:

| Situation | Faktor |
|---|---|
| Hauptfälligkeit Bestandsvertrag in 30–90 Tagen | ×1,20 |
| Hauptfälligkeit in 91–180 Tagen | ×1,10 |
| Bootskauf in den letzten 60 Tagen gemeldet | ×1,25 |
| Zeitfenster `sofort` | ×1,15 |
| Zeitfenster `saison` und Saisonstart < 90 Tage | ×1,10 |
| Zeitfenster `unklar` | ×0,90 |
| Hauptfälligkeit > 300 Tage entfernt | ×0,80 |

Ergebnis wird auf 100 gekappt.

### 4.4 Zeitverfall (Decay)

Verhaltenspunkte (Block C) verfallen, statische Punkte (Block A/B) nicht.

```
block_c_effektiv = block_c_roh · exp(−λ · tage_seit_letztem_signal)
λ = 0,015   → Halbwertszeit ≈ 46 Tage
```

Zusätzlich: Kein Signal und keine Aktivität > 180 Tage → Lead wechselt automatisch
in den Nurturing-Pool, Score wird eingefroren und als `veraltet` markiert.

### 4.5 Kategorien und Konsequenzen

| Kategorie | Score | Bedeutung | Pflichthandlung | SLA Erstkontakt |
|---|---|---|---|---|
| **A** | 80–100 | Sofortiges Vertriebspotenzial | Persönlicher Anruf durch Senior-Vertrieb | 4 Arbeitsstunden |
| **B** | 60–79 | Echte Chance, Taktung nötig | Anruf + Angebotsvorbereitung | 24 Stunden |
| **C** | 35–59 | Entwicklungsbedarf | Nurturing-Strecke + Anruf im Rahmen der Tagesliste | 72 Stunden |
| **D** | 0–34 | Kein aktueller Bedarf / unklar | Nur automatisierte Kommunikation | keine |

**Hysterese:** Ein Kategoriewechsel erfolgt erst bei Über-/Unterschreiten der Grenze
um ≥ 3 Punkte. Das verhindert tägliches Springen zwischen A und B.

**Eskalationsregel:** Wechsel von B/C nach A erzeugt sofort Aufgabe **und** Push-Benachrichtigung
an den Verantwortlichen (A-06). Das ist der wichtigste Echtzeit-Trigger des Systems.

### 4.6 KI-Komponente

| Aspekt | Festlegung |
|---|---|
| **Aufgabe** | Binäre Klassifikation: Wird dieser Lead innerhalb von 180 Tagen zum Abschluss? |
| **Verfahren** | Gradient Boosting (LightGBM/XGBoost), Kalibrierung via Isotonic Regression |
| **Merkmale** | Alle Regelfelder + abgeleitete: Signaldichte 7/30/90 Tage, Kanaldiversität, Zeit bis Erstreaktion, Anzahl Aktivitäten, Quelle, Saisonmonat, Region-Cluster, Wettbewerber, Ø Antwortzeit |
| **Ausgeschlossene Merkmale** | Geschlecht, Alter (außer als Deckungskriterium), Nationalität, Gesundheitsdaten, Name — **Diskriminierungsschutz** |
| **Training** | Wöchentlich, rollierendes 24-Monats-Fenster, Zeitsplit-Validierung (kein Random Split) |
| **Gütemaße** | AUC, PR-AUC, Brier Score, Lift@10 %, Kalibrierungskurve |
| **Freigabeschwelle** | AUC ≥ 0,70 auf Holdout, sonst Rückfall auf Regelscore |
| **Erklärbarkeit** | SHAP-Werte, im UI werden die **3 stärksten Treiber im Klartext** angezeigt |
| **Drift-Überwachung** | PSI je Merkmal, Alarm bei PSI > 0,25 |
| **Menschliches Übersteuern** | Vertrieb kann Kategorie manuell setzen (mit Begründung, 30 Tage gültig) — wird als Trainingssignal erfasst |

**Beispiel-Erklärung im UI:**
> Score 87 (A-Lead) — Treiber: Bootswert 380.000 € (+13), Empfehlung durch VIP-Kunde (+15),
> Hauptfälligkeit in 47 Tagen (×1,20). Bremsend: keine Newsletterreaktion (−3).

---

## 5. Buying Signals

### 5.1 Signalkatalog

| Code | Signal | Quelle | Basisgewicht | Halbwertszeit |
|---|---|---|---|---|
| `S-WEB-01` | Besuch Tarif-/Preisseite | Website | 8 | 21 Tage |
| `S-WEB-02` | Besuch Produktdetailseite | Website | 5 | 30 Tage |
| `S-WEB-03` | Wiederholter Besuch (≥ 3 in 7 Tagen) | Website | 10 | 14 Tage |
| `S-WEB-04` | Besuch Kontakt-/Terminseite ohne Absenden | Website | 9 | 10 Tage |
| `S-WEB-05` | Rechner/Konfigurator gestartet | Website | 12 | 21 Tage |
| `S-WEB-06` | Rechner abgebrochen | Website | 11 | 7 Tage |
| `S-DOC-01` | Download Bedingungen/Tarifübersicht | Website | 10 | 45 Tage |
| `S-DOC-02` | Download Ratgeber/Checkliste | Website | 4 | 60 Tage |
| `S-NL-01` | Newsletter geöffnet | Brevo | 2 | 30 Tage |
| `S-NL-02` | Newsletter-Klick auf Produktlink | Brevo | 6 | 30 Tage |
| `S-NL-03` | Mehrfachklick in einer Kampagne | Brevo | 8 | 21 Tage |
| `S-EVT-01` | Eventanmeldung (Messe/Regatta/Webinar) | Event | 9 | 60 Tage |
| `S-EVT-02` | Eventteilnahme bestätigt | Event | 12 | 90 Tage |
| `S-ACAD-01` | Academy-Kurs gestartet | Academy | 5 | 90 Tage |
| `S-ACAD-02` | Academy-Zertifikat erworben | Academy | 7 | 180 Tage |
| `S-MKT-01` | Marketplace-Inserat eingestellt (Bootsverkauf) | Marketplace | 14 | 60 Tage |
| `S-MKT-02` | Marketplace-Kaufanfrage gestellt | Marketplace | 16 | 45 Tage |
| `S-MAIL-01` | Antwort auf Vertriebsmail | Outlook | 12 | 30 Tage |
| `S-MAIL-02` | Angebots-PDF geöffnet | Tracking | 15 | 21 Tage |
| `S-MAIL-03` | Angebots-PDF mehrfach geöffnet | Tracking | 18 | 14 Tage |
| `S-PART-01` | Partnerportal-Übergabe | Partner | 14 | 90 Tage |
| `S-OBJ-01` | Bootswechsel gemeldet | Objektmodul | 20 | 120 Tage |
| `S-OBJ-02` | Wertänderung Boot > 20 % | Objektmodul | 12 | 90 Tage |
| `S-VTR-01` | Hauptfälligkeit T-90 erreicht | Vertragsmodul | 15 | 90 Tage |
| `S-SCH-01` | Schaden abgeschlossen, Zufriedenheit hoch | Schadenmodul | 10 | 60 Tage |
| `S-NEG-01` | Abmeldung Newsletter | Brevo | −15 | 180 Tage |
| `S-NEG-02` | Keine Reaktion auf 3 Kontaktversuche | CRM | −12 | 60 Tage |
| `S-NEG-03` | Schadenbeschwerde | Schadenmodul | −18 | 180 Tage |

### 5.2 Signalverdichtung → Intent Score

```
intent_score = Σ ( gewicht_i · exp(−ln2 · Δt_i / halbwertszeit_i) )
```

| Intent Score | Interpretation | Systemreaktion |
|---|---|---|
| ≥ 45 | **Kaufabsicht akut** | Opportunity automatisch anlegen + Aufgabe „Sofortkontakt" + Push |
| 25 – 44 | **Kontaktbedarf** | Aufgabe „Kontakt aufnehmen" innerhalb 48 h |
| 12 – 24 | **Interesse wachsend** | Aufnahme in passgenaue Nurturing-Strecke |
| < 12 | **Kein akuter Bedarf** | Beobachtung |
| Negativsumme < −20 | **Rückzug** | Frequenz reduzieren, Aufgabe „Beziehung klären" bei CVS ≥ 60 |

### 5.3 Signalmuster (Kombinationsregeln)

Einzelsignale sind schwach — Muster sind stark. Erkannt werden:

| Muster | Bedingung | Ableitung | Aktion |
|---|---|---|---|
| **M1 Kaufvorbereitung** | `S-WEB-05` + `S-DOC-01` innerhalb 7 Tagen | Konkrete Kaufabsicht | Opportunity + Aufgabe Sofortkontakt (Prio 1) |
| **M2 Abbrecher** | `S-WEB-06` ohne Formularabgabe binnen 24 h | Hürde im Prozess | Aufgabe „Rückruf Konfigurator-Abbruch" binnen 4 h |
| **M3 Wechselabsicht** | `S-VTR-01` + ≥ 2 Websitebesuche | Wechselfenster offen | Aufgabe „Hauptfälligkeitsgespräch" + Vergleichsangebot |
| **M4 Bootswechsel** | `S-OBJ-01` oder `S-MKT-01` + `S-MKT-02` | Objektwechsel | Opportunity „Deckungsanpassung" (Prio 1) |
| **M5 Stiller Rückzug** | Kein Signal 120 Tage + Bestandskunde | Beziehungsverlust | Risk Score +, Aufgabe Beziehungspflege |
| **M6 Angebotsdruck** | `S-MAIL-03` + `S-WEB-01` innerhalb 3 Tagen | Entscheidung steht an | Aufgabe „Sofort nachfassen", Wahrscheinlichkeit +15 % |
| **M7 Netzwerkaktivierung** | `S-EVT-02` + `S-ACAD-02` in 90 Tagen | Hohe Bindung | Empfehlungsanfrage auslösen |
| **M8 Flottenpotenzial** | ≥ 2 Boote im Profil + gewerbliche Nutzung | Flottenbedarf | Aufgabe „Flottenkonzept anbieten" an Gewerbeteam |

### 5.4 Datenschutzrahmen für Signale

| Regel | Umsetzung |
|---|---|
| Kein Tracking ohne Consent | Signalaufnahme prüft `crm_consent` vor Persistenz |
| Zweckbindung | Signale ausschließlich für Vertriebsanbahnung, kein Weiterverkauf |
| Speicherdauer | Rohsignale 24 Monate, danach nur aggregierte Scores |
| Auskunftsfähigkeit | Signalhistorie je Kontakt exportierbar (API `GET /kontakte/{id}/dsgvo-export`) |
| Widerspruch | Widerruf löscht Rohsignale binnen 72 h und setzt Score auf Regelbasis ohne Verhalten |
| Keine automatisierte Einzelentscheidung | Score erzeugt Empfehlungen, keine Ablehnung von Versicherungsschutz (Art. 22 DSGVO) |
