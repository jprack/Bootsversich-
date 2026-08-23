# 02 — Datenmodell

---

## 1. Die geforderte Feldliste und ihr tatsächlicher Ort

Der Auftrag beschreibt eine Entität `BOOTSHÄNDLER` mit Grunddaten, Adresse,
Ansprechpartner, Produktbereich, Partnerpotenzial und CRM-Daten in einem Block.

**Jedes dieser Felder ist umgesetzt.** Verteilt sind sie so, dass dieselbe Firma
nicht zweimal im Bestand liegt (Kapitel 1.4).

### 1.1 Grunddaten

| Auftragsfeld | Liegt in | Feld | Bemerkung |
|---|---|---|---|
| Händler-ID | `ORGANISATION` | `id` + `objektnummer` | Fortlaufend, ohne Bedeutung — wie ADR-0006 des CRM |
| Firmenname | `ORGANISATION` | `name` | Firmenwortlaut, wie im Register |
| Firmenzusatz | `ORGANISATION` | `kurzname` | Für Listen und Betreffzeilen |
| Rechtsform | `ORGANISATION` | `rechtsform` | |
| Website | `ORGANISATION` | `website` + `domain_norm` | Normalisiert für den Abgleich |
| E-Mail | `STANDORT` bzw. `KONTAKT` | `email` | **Getrennt:** `info@` gehört dem Standort, `m.huber@` der Person |
| Telefon / Mobil / Fax | `STANDORT` bzw. `KONTAKT` | `telefon_e164`, `mobil_e164`, `fax` | Ein Betrieb mit drei Filialen hat drei Nummern |
| Gründungsjahr | `ORGANISATION` | `gruendungsjahr` | |
| Mitarbeiterzahl | `ORGANISATION` | `mitarbeiterzahl` | **Mit Herkunft und Datum** (§4) |
| Umsatzklasse | `ROLLENPROFIL_HAENDLER` | `umsatzklasse` | Band, nie Betrag. **Nie geraten** (§4.2) |
| Status | zwei Felder | `ORGANISATION.status` **und** `pipeline_status` | Bestandsstatus ≠ Vertriebsstand (§1.6) |

### 1.2 Adresse

| Auftragsfeld | Liegt in | Bemerkung |
|---|---|---|
| Straße / Hausnummer | `STANDORT` | Getrennt gespeichert, für Abgleich und Anschreiben |
| PLZ / Ort | `STANDORT` | |
| Bundesland | `STANDORT` | `region` — abgeleitet aus PLZ, überschreibbar |
| Land | `STANDORT` | Steuert Mandant und Rechtstexte |
| GPS-Koordinaten | `STANDORT` | `geo_lat`, `geo_lon` — für Gebietsplanung und Fahrtwege |
| Vertriebsgebiet | `HAENDLER_MARKE` | **Nicht am Standort:** Das Gebiet gilt je Marke, nicht je Firma (§3) |

### 1.3 Ansprechpartner

| Auftragsfeld | Liegt in | Bemerkung |
|---|---|---|
| Vorname / Nachname | `KONTAKT` | Kern-CRM |
| Position | `KONTAKT_ORGANISATION` | `funktion` — dieselbe Person kann bei zwei Betrieben eine Funktion haben |
| Telefon / Mobil / E-Mail | `KONTAKT` | |
| LinkedIn | `KONTAKT` | **Nur die öffentliche Profil-URL**, keine Inhalte (ADR-0003 Modul 03) |
| Geburtstag | `KONTAKT` | `geburtstag_tag_monat` — **ohne Jahr**, freiwillig, nie recherchiert (§5) |
| Notizen | `NOTIZ` | Mit Autor und Zeitpunkt statt Freitextfeld |
| — Standortzuordnung | `KONTAKT_ORGANISATION` | `standort_id` — der Verkaufsleiter Nord sitzt in der Filiale Nord |

### 1.4 Produktbereich

Die 15 genannten Bereiche sind **kein Feldsatz mit 15 Ja/Nein-Spalten**, sondern
eine gepflegte Merkmalsliste (§6). Grund: Der 16. Bereich kommt bestimmt, und
eine Spalte hinzuzufügen ist ein Entwicklungsauftrag — ein Katalogeintrag nicht.

### 1.5 Partnerpotenzial

| Auftragsfeld | Liegt in | Bemerkung |
|---|---|---|
| Partnerstatus / Aktiver Partner / Interessent | `ORGANISATIONSROLLE` + `pipeline_status` | **Ein Feld, nicht drei** — sonst widersprechen sie einander |
| Kooperationsstatus | `KOOPERATION` | Eigene Entität, weil sie befristet ist und Dokumente trägt |
| Versicherungskooperation | `KOOPERATION.art` | Eine Ausprägung von mehreren |
| Leadstatus | Modul 03 | Solange nicht freigegeben, ist es kein Händler |
| Bewertung / Potential Score | `HAENDLERWERT` | Dreiteilig und historisiert (Kapitel 5) |

### 1.6 Warum zwei Statusfelder nötig sind

`ORGANISATION.status` beantwortet: *Existiert dieser Betrieb noch und arbeiten
wir mit ihm?* — `INTERESSENT`, `AKTIV`, `RUHEND`, `BEENDET`.

`ROLLENPROFIL_HAENDLER.pipeline_status` beantwortet: *Wie weit ist die
Zusammenarbeit?* — die zehn Zustände aus Kapitel 6.

Beides in ein Feld zu legen heißt, dass „Verhandlung" und „ruhend" auf derselben
Skala liegen. Dann ist nicht mehr auswertbar, wie viele aktive Händler gerade in
Verhandlung sind — und das ist genau die Frage der Führung.

### 1.7 CRM-Daten

| Auftragsfeld | Liegt in | Bemerkung |
|---|---|---|
| Erster Kontakt | abgeleitet | Älteste `AKTIVITAET` — **kein gepflegtes Feld** |
| Letzter Kontakt | abgeleitet | Jüngste `AKTIVITAET`. Ein gepflegtes Feld driftet innerhalb eines Jahres |
| Nächste Aktion | `AUFGABE` | Die früheste offene Aufgabe |
| Verantwortlicher | `ORGANISATION.betreuer_id` | |
| Aufgaben / Notizen / Dokumente / Historie | Kern-CRM | Unverändert übernommen |

**Abgeleitet statt gepflegt** ist hier die tragende Entscheidung: Jedes dieser
vier Felder wäre redundant zu einer Tabelle, die es ohnehin gibt — und
Redundanz, die niemand aktualisiert, ist schlimmer als eine Abfrage.

---

## 2. ROLLENPROFIL_HAENDLER

Hängt an genau einer `ORGANISATIONSROLLE` mit `rolle = HAENDLER`.

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `organisationsrolle_id` | uuid | ja | |
| `haendlertyp` | enum | ja | `VOLLHAENDLER`, `MARKENHAENDLER`, `GEBRAUCHTHANDEL`, `MAKLER_VERMITTLUNG`, `WERFT_MIT_VERTRIEB` |
| `klasse` | enum | ja | `A`, `B`, `C` — **abgeleitet**, nicht von Hand gesetzt (Kapitel 4) |
| `klasse_manuell` | enum | nein | Übersteuerung mit **Pflichtbegründung** |
| `klasse_begruendung` | text(300) | nein | Pflicht, sobald `klasse_manuell` gesetzt ist |
| `umsatzklasse` | enum | nein | `UNTER_1M`, `1M_5M`, `5M_20M`, `UEBER_20M`, `UNBEKANNT` |
| `umsatzklasse_herkunft` | enum | nein | `SELBSTAUSKUNFT`, `REGISTER`, `SCHAETZUNG`, `UNBEKANNT` |
| `boote_pro_jahr` | int | nein | Verkaufte Einheiten. **Die wertvollste Einzelzahl des Moduls** |
| `boote_pro_jahr_herkunft` | enum | nein | wie oben |
| `anteil_neuboote` | numeric(5,2) | nein | Prozent. Bestimmt die Zahl der Erstversicherungen |
| `durchschnittspreis_klasse` | enum | nein | `UNTER_50K`, `50K_150K`, `150K_500K`, `UEBER_500K` |
| `pipeline_status` | enum | ja | Kapitel 6 |
| `pipeline_seit` | date | ja | Grundlage der Verweildaueranalyse |
| `betreuungsfrequenz_tage` | int | ja | Aus der Klasse abgeleitet, überschreibbar |
| `dealer_hub_bereit` | boolean | ja | Erst mit unterzeichneter Vereinbarung |
| `wettbewerber` | text(200) | nein | Wer dort bereits vermittelt — **die wichtigste Verlustursache** |
| `datenstand_geprueft_am` | date | nein | Grundlage des Aktualitätsgrads (Kapitel 10) |
| `datenstand_geprueft_von` | uuid | nein | |

**`boote_pro_jahr` ist die Zahl, um die es geht.** Alles andere im Profil
beschreibt einen Betrieb; diese eine Zahl beschreibt, wie viele Policen dort
jährlich entstehen. Sie ist nicht recherchierbar — sie kommt aus dem Gespräch.
Deshalb steht neben ihr die Herkunft, und deshalb ist sie im Score erst wirksam,
wenn sie aus `SELBSTAUSKUNFT` stammt (Kapitel 5).

---

## 3. STANDORT

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `organisation_id` | uuid | ja | Der **Rechtsträger** |
| `bezeichnung` | text(120) | ja | „Hauptsitz", „Filiale Nord", „Servicestützpunkt" |
| `art` | enum | ja | `HAUPTSITZ`, `FILIALE`, `SERVICE`, `LAGER`, `AUSSTELLUNG`, `HAFENSTUETZPUNKT` |
| `strasse` / `hausnummer` | text | nein | Getrennt — für Abgleich und Anschrift |
| `plz` / `ort` | text | ja | |
| `region` | text(60) | nein | Bundesland, abgeleitet aus PLZ, überschreibbar |
| `land` | char(2) | ja | |
| `revier` | text(80) | nein | Gewässer — fachlich brauchbarer als PLZ |
| `geo_lat` / `geo_lon` | numeric(9,6) | nein | |
| `telefon_e164` / `fax` | text(20) | nein | |
| `email` | text(200) | nein | Unpersönlich |
| `oeffnungszeiten` | jsonb | nein | Mit Schemaversion. Saisonbetrieb ist die Regel, nicht die Ausnahme |
| `saisonbetrieb` | boolean | ja | Steuert, wann Ansprache sinnvoll ist |
| `liegeplaetze` | int | nein | Falls der Standort einen Hafen betreibt |
| `hallenflaeche_m2` | int | nein | Winterlagerkapazität — Hinweis auf Bestandsgröße |
| `ist_hauptsitz` | boolean | ja | **Genau einer je Organisation** |
| `aktiv_ab` / `aktiv_bis` | date | ja / nein | Ein geschlossener Standort wird nicht gelöscht |

**Genau ein Hauptsitz je Organisation** ist eine Bedingung, keine Konvention:
Ohne sie ist nicht entscheidbar, wohin die Post geht.

---

## 4. Herkunft und Alter — an jedem beurteilenden Feld

Jeder Wert, der eine Beurteilung trägt (Umsatzklasse, Mitarbeiterzahl,
Bootszahl, Preisklasse), führt zwei Zusatzangaben:

| Zusatz | Wirkung |
|---|---|
| **Herkunft** | `SELBSTAUSKUNFT` · `REGISTER` · `SCHAETZUNG` · `UNBEKANNT` |
| **Stand** | Datum der letzten Bestätigung |

### 4.1 Warum das nicht weggelassen werden darf

„Umsatzklasse `5M_20M`" ohne Herkunft sieht aus wie eine Tatsache. Stammt sie aus
einer Schätzung, ist sie eine Meinung. Nach zwei Jahren unterscheidet das
niemand mehr — und der Score, der darauf aufbaut, ist dann eine Meinung mit
zwei Nachkommastellen.

### 4.2 Die Regel dazu

**Ein geschätzter Wert geht nie in den Händlerwert ein.** Er darf angezeigt
werden, mit sichtbarer Kennzeichnung, und er darf eine Anreicherungsaufgabe
auslösen. Er darf nicht bewerten.

---

## 5. Der Geburtstag — ausdrücklich geregelt

Der Auftrag nennt den Geburtstag des Ansprechpartners. Er ist umgesetzt, unter
vier Bedingungen:

| Bedingung | Grund |
|---|---|
| **Nur Tag und Monat**, kein Jahr | Das Jahr wird für den Zweck nicht gebraucht; ohne es sinkt die Eingriffstiefe erheblich |
| **Nur freiwillig genannt** | Nie recherchiert, nie aus einem Profil übernommen |
| **Herkunft und Datum werden festgehalten** | „hat es im Gespräch erwähnt" ist nachweisbar, eine Recherche wäre es nicht |
| **Eigene Löschung auf Wunsch**, ohne den Kontakt zu berühren | Ein einzelnes Feld muss einzeln widerrufbar sein |

Die Geburtstagsregel in Kapitel 7 erzeugt eine Aufgabe **nur**, wenn das Feld
befüllt ist — sie fragt nie danach.

> Ein Geburtstagsanruf beim Verkaufsleiter, der seinen Geburtstag nie genannt
> hat, wirkt nicht aufmerksam, sondern beunruhigend. Das ist der praktische
> Grund; der rechtliche steht in Kapitel 12.

---

## 6. PRODUKTBEREICH als Katalog

Statt 15 Spalten: eine Katalogtabelle und eine Zuordnung je **Standort**, nicht
je Firma — der Servicestützpunkt verkauft keine Neuboote.

### 6.1 PRODUKTBEREICH (Katalog)

| Feld | Typ | Beschreibung |
|---|---|---|
| `code` | text(30) | `SEGELBOOT`, `MOTORBOOT`, `KATAMARAN`, `YACHT`, `AUSSENBORDER`, `INNENBORDER`, `GEBRAUCHTBOOT`, `NEUBOOT`, `SERVICE`, `WINTERLAGER`, `MARINA`, `CHARTER`, `FINANZIERUNG`, `VERSICHERUNG`, `TRANSPORT`, `REFIT` |
| `bezeichnung` | text(80) | |
| `gruppe` | enum | `PRODUKT`, `DIENSTLEISTUNG`, `FINANZ` |
| `versicherungsrelevanz` | enum | `HOCH`, `MITTEL`, `NIEDRIG`, `KONKURRENZ` |

**`versicherungsrelevanz` ist die Spalte, die den Katalog nützlich macht:**

| Bereich | Relevanz | Warum |
|---|---|---|
| `NEUBOOT` | **hoch** | Jeder Verkauf ist eine Erstversicherung |
| `GEBRAUCHTBOOT` | **hoch** | Halterwechsel, oft unter Zeitdruck |
| `CHARTER` | **hoch** | Flottendeckung, eigenes Produkt liegt vor |
| `WINTERLAGER`, `SERVICE` | mittel | Fremdes Eigentum in Obhut — eigener Bedarf |
| `MARINA` | mittel | Liegeplatzhaftung |
| `VERSICHERUNG` | **KONKURRENZ** | Der Betrieb vermittelt bereits selbst — anderer Gesprächseinstieg |

Die letzte Zeile ist der Grund für den Wert `KONKURRENZ`: Ein Händler, der
„Versicherung" im Leistungsangebot führt, ist kein einfacherer, sondern ein
**anderer** Fall — und das muss vor dem ersten Termin sichtbar sein, nicht
danach.

### 6.2 STANDORT_PRODUKTBEREICH

| Feld | Typ | Beschreibung |
|---|---|---|
| `standort_id` / `produktbereich_code` | uuid / text | |
| `schwerpunkt` | boolean | Kerngeschäft oder Beiwerk |
| `herkunft` | enum | Wie §4 |
| `bestaetigt_am` | date | |

---

## 7. KOOPERATION

Eine Vereinbarung ist befristet, hat Dokumente und endet — sie gehört nicht als
Feld an den Händler.

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `organisation_id` | uuid | ja | |
| `art` | enum | ja | `VERSICHERUNGSVERMITTLUNG`, `EMPFEHLUNG`, `VERANSTALTUNG`, `INHALT`, `SONSTIGE` |
| `status` | enum | ja | `ANGEBAHNT`, `AKTIV`, `RUHEND`, `GEKUENDIGT`, `ABGELAUFEN` |
| `gueltig_ab` / `gueltig_bis` | date | ja / nein | |
| `dokument_id` | uuid | nein | **Pflicht bei `AKTIV`** — ohne Unterschrift keine aktive Kooperation |
| `provisionsmodell` | jsonb | nein | Struktur vorbereitet, Werte offen (C-05) |
| `kuendigungsfrist_tage` | int | nein | |
| `ansprechpartner_kontakt_id` | uuid | nein | |
| `beendigungsgrund` | enum | nein | `KEINE_UMSAETZE`, `WETTBEWERB`, `BETRIEBSAUFGABE`, `UNZUFRIEDEN`, `SONSTIGES` |

**`dokument_id` ist bei `AKTIV` Pflicht.** Eine aktive Kooperation ohne
unterschriebenes Papier ist genau die Konstellation, die im Streitfall nicht
haltbar ist — und die einen Portalzugang trägt, den niemand vereinbart hat.

---

## 8. Übersicht der neuen Entitäten

| Entität | Zweck | Hängt an |
|---|---|---|
| `ROLLENPROFIL_HAENDLER` | Händlerspezifische Merkmale | `ORGANISATIONSROLLE` |
| `STANDORT` | Niederlassung, kein Rechtsträger | `ORGANISATION` |
| `STANDORT_PRODUKTBEREICH` | Was dieser Standort tut | `STANDORT` |
| `PRODUKTBEREICH` | Katalog mit Versicherungsrelevanz | — |
| `MARKE` | Marke, nicht Hersteller (Kapitel 3) | `ORGANISATION` (Hersteller) |
| `HAENDLER_MARKE` | Befristete Vertretung mit Gebiet | `ORGANISATION` + `MARKE` |
| `KOOPERATION` | Vereinbarung mit Laufzeit und Beleg | `ORGANISATION` |
| `HAENDLERWERT` | Dreiteilige Bewertung, historisiert | `ORGANISATIONSROLLE` |
| `VERANSTALTUNG` / `TEILNAHME` | Messen, Hausmessen, Schulungen | — / `ORGANISATION` |

**Neun neue Entitäten, keine davon dupliziert das CRM.** Zusammen mit den 28
Entitäten des Kern-CRM und den sieben des Rechercheraums ergibt das den
vollständigen Datenbestand der Plattform.
