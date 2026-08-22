# 02 — Datenmodell

## 0. Konventionen

### 0.1 Felder, die jede Entität trägt

Nicht in den Einzeltabellen wiederholt.

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | uuid (v7) | ja | Technischer Schlüssel. Zeitlich sortierbar, nicht erratbar |
| `mandant_id` | uuid | ja | `AT` oder `DE`. Durchgesetzt per Row Level Security, nicht per Filter |
| `quelle` | enum | ja | Woher der Datensatz stammt: `FORMULAR`, `MANUELL`, `HAENDLER`, `CLUB`, `PARTNER`, `PORTAL`, `IMPORT`, `POLIZZENIMPORT`, `VERSICHERER`, `SYSTEM`. Grundlage für Auskunft und Attribution |
| `erstellt_am` / `geaendert_am` | timestamptz | ja | UTC. Anzeige in `Europe/Vienna` bzw. `Europe/Berlin` |
| `erstellt_von` / `geaendert_von` | uuid | nein | Benutzer. Leer bedeutet: durch das System |

### 0.2 Typkonventionen

| Zweck | Typ | Begründung |
|---|---|---|
| Geldbetrag | `numeric(14,2)` **plus** `waehrung char(3)` | Nie Gleitkomma. Ein Betrag ohne Währung ist bedeutungslos |
| Kalenderdatum | `date` | Geburtstag, Vertragsbeginn, Hauptfälligkeit — ohne Zeitzone |
| Zeitpunkt | `timestamptz` | Immer UTC gespeichert |
| Aufzählung | Katalogtabelle oder PostgreSQL-Enum | Katalog, wo der Fachbereich pflegen können muss |
| Freiformdaten | `jsonb` | Nur mit hinterlegtem Schema und gespeicherter Schemaversion |
| Prozentsatz | `numeric(8,4)` | 0,1000 = 10 %. Nie als Text „+10 %" |

---

## 1. KONTAKT — natürliche Person

Die zentrale Identität. Unabhängig davon, ob die Person Interessent, Kunde,
Ansprechpartner eines Händlers oder alles gleichzeitig ist.

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `anrede` | enum | nein | `HERR`, `FRAU`, `DIVERS`, `KEINE` |
| `titel_vor` | text(50) | nein | „Dr.", „Ing." |
| `vorname` | text(100) | ja | |
| `nachname` | text(100) | ja | |
| `titel_nach` | text(50) | nein | „MBA" |
| `geburtsdatum` | date | nein | Pflicht, sobald ein Antrag gestellt wird — vorher nicht |
| `geburtsort` | text(100) | nein | Nur wenn ein Versicherer ihn verlangt |
| `staatsangehoerigkeit` | char(2) | nein | ISO-3166. Relevant für Annahmerichtlinien |
| `sprache` | char(2) | ja | Vorgabe `de` |
| `beruf` | text(100) | nein | Nur wenn tariflich relevant |
| `vergleichsschluessel` | text | ja | Nachname + Geburtsdatum + PLZ, normalisiert. **Kein Unique** — gleiche Merkmale sind ein Hinweis, kein Beweis |
| `dublettenkandidat_von` | uuid | nein | Verweis auf einen möglichen Doppeldatensatz. Vorschlag, keine Zusammenführung |
| `identitaet_geprueft` | boolean | ja | Vorgabe `false`. Wird `true` nach Ausweisprüfung |
| `identitaet_geprueft_am` | timestamptz | nein | |
| `kontaktsperre` | boolean | ja | Vorgabe `false`. Sperrt **jede** Ansprache, unabhängig von Einwilligungen |
| `kontaktsperre_grund` | text(200) | nein | Pflicht, wenn gesperrt |
| `verstorben_am` | date | nein | Beendet jede Ansprache, erhält aber den Vertragsbezug |
| `anonymisiert_am` | timestamptz | nein | Nach Löschprozess: personenbezogene Felder überschrieben, Datensatz bleibt |

**Bewusst nicht enthalten:** Bankverbindung, Steuer-Identifikationsnummer,
Sozialversicherungsnummer, Gesundheitsangaben, Bonitätsdaten. Keines hat im
Kern-CRM einen dokumentierten Zweck. Aufnahme erst mit belegtem Bedarf und
Rechtsgrundlage.

---

## 2. ADRESSE

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `bezug_typ` | enum | ja | `KONTAKT`, `ORGANISATION`, `KUNDE` |
| `bezug_id` | uuid | ja | |
| `art` | enum | ja | `WOHNSITZ`, `RECHNUNG`, `ZUSTELLUNG`, `SITZ`, `FILIALE` |
| `strasse` | text(120) | ja | |
| `hausnummer` | text(20) | ja | |
| `adresszusatz` | text(120) | nein | |
| `plz` | text(10) | ja | Prüfung landesabhängig: AT vierstellig, DE fünfstellig |
| `ort` | text(100) | ja | |
| `bundesland` | text(100) | nein | |
| `land` | char(2) | ja | ISO-3166 |
| `ist_hauptadresse` | boolean | ja | Genau eine je Bezug und Art |
| `gueltig_ab` / `gueltig_bis` | date | ja / nein | Umzüge erhalten die Historie |
| `geokoordinaten` | point | nein | Für Kartendarstellung und Revierzuordnung |

---

## 3. KONTAKTWEG

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `kontakt_id` | uuid | nein | Entweder Kontakt **oder** Organisation |
| `organisation_id` | uuid | nein | |
| `art` | enum | ja | `EMAIL`, `TELEFON`, `MOBIL`, `FAX`, `WEBSITE` |
| `wert` | text(254) | ja | Normalisiert: E-Mail klein, Telefon in E.164 |
| `verwendung` | enum | ja | `PRIVAT`, `GESCHAEFTLICH`, `RECHNUNG`, `NOTFALL` |
| `ist_hauptweg` | boolean | ja | Genau einer je Art |
| `verifiziert` | boolean | ja | E-Mail per Double-Opt-in, Telefon per Rückruf |
| `verifiziert_am` | timestamptz | nein | |
| `bounce_gesperrt` | boolean | ja | Nach dauerhaftem Zustellfehler. Sperrt den Versand ohne Widerruf |

**Eindeutig:** `(kontakt_id, art, wert)` beziehungsweise
`(organisation_id, art, wert)`. Dieselbe Adresse darf einer Person nicht doppelt
zugeordnet sein.

---

## 4. ORGANISATION — juristische Person (im Auftrag: FIRMA)

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `name` | text(200) | ja | Firmenwortlaut |
| `kurzname` | text(50) | nein | Für Listen und Betreffzeilen |
| `rechtsform` | text(50) | nein | GmbH, AG, e.U., GesbR, Verein |
| `registernummer` | text(50) | nein | Firmenbuch (AT) oder Handelsregister (DE) |
| `ust_id` | text(20) | nein | Umsatzsteuer-Identifikationsnummer |
| `website` | text(200) | nein | |
| `gruendungsjahr` | int | nein | |
| `mitarbeiterzahl` | int | nein | Größenklasse für Segmentierung |
| `status` | enum | ja | `INTERESSENT`, `AKTIV`, `RUHEND`, `BEENDET` |
| `betreuer_id` | uuid | nein | Zuständiger Benutzer |
| `anonymisiert_am` | timestamptz | nein | |

---

## 5. ORGANISATIONSROLLE — macht aus einer Organisation einen Händler

Der Kern der Entscheidung aus [ADR-0004](../01_ARCHITECTURE/adr/0004-organisation-mit-rollen.md).
Eine Organisation kann **mehrere Rollen gleichzeitig** tragen.

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `organisation_id` | uuid | ja | |
| `rolle` | enum | ja | `HAENDLER`, `CLUB`, `PARTNER`, `MAKLER`, `LIEFERANT`, `HERSTELLER`, `VERSICHERER` |
| `gueltig_ab` / `gueltig_bis` | date | ja / nein | Eine Rolle endet, ohne die Organisation zu löschen |
| `portalzugang` | boolean | ja | Steuert die Sichtbarkeit des jeweiligen Hubs |
| `vermittlerregistrierung` | text(50) | nein | **Pflicht bei `MAKLER`.** Ohne Eintrag kein Portalzugang |
| `vereinbarung_dokument_id` | uuid | nein | Verweis auf den unterzeichneten Vertrag |
| `provisionsmodell` | jsonb | nein | Struktur vorbereitet, Werte offen (**C-05**) |

**Eindeutig:** `(organisation_id, rolle, gueltig_ab)`.

### 5.1 Rollenprofile

Rollenspezifische Felder liegen **an der Rolle**, nicht an der Organisation.
Die Vermittlerregistrierung gehört zur Vermittlereigenschaft, nicht zum
Unternehmen an sich.

**HAENDLER_PROFIL**

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `marken` | text[] | nein | Vertretene Werften |
| `standorte` | int | nein | Zahl der Filialen |
| `neuboot_verkauf` / `gebrauchtboot_verkauf` | boolean | ja | |
| `service_werkstatt` | boolean | ja | Cross-Selling-Ansatz |
| `empfehlungsvereinbarung_ab` | date | nein | |

**CLUB_PROFIL**

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `mitgliederzahl` | int | nein | Grobangabe. **Keine Mitgliederliste** — unnötiger Personenbezug |
| `revier` | text(100) | nein | Hauptgewässer |
| `hafen_adresse_id` | uuid | nein | |
| `gruppenkondition` | jsonb | nein | Vergünstigung für Mitglieder |
| `veranstaltungen_jaehrlich` | int | nein | |

**PARTNER_PROFIL**

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `leistungsarten` | enum[] | ja | `GUTACHTEN`, `WERFT`, `CHARTER`, `TRANSPORT`, `SERVICE`, `SONSTIGES` |
| `einsatzgebiet` | text[] | nein | Reviere oder Regionen |
| `stundensatz` | numeric(14,2) + `waehrung` | nein | |

**HERSTELLER_PROFIL**

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `herkunftsland` | char(2) | nein | |
| `bootsarten` | enum[] | ja | `SEGELYACHT`, `MOTORYACHT`, `KATAMARAN`, … |
| `ist_premiumhersteller` | boolean | ja | **Steuert den Tarifnachlass.** Speist die Liste aus dem NAUTIMA-Tarif (Hallberg Rassy, Najad, X-Yachts …) |
| `premium_gueltig_ab` | date | nein | Die Liste ändert sich; der Nachlass gilt ab einem Stichtag |

> Der Hersteller ist keine Zierde des Datenmodells. Ohne ihn lässt sich der
> Premiumwerften-Nachlass aus dem Tarifwerk nicht anwenden.

**VERSICHERER_PROFIL** — ersetzt die eigenständige Entität aus Kapitel 13 der
Architektur. Gleiche Felder, jetzt als Rolle geführt.

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `agenturnummer` | text(50) | ja | Eigene Kennung beim Träger |
| `kanal` | enum | ja | `EMAIL`, `API`, `PORTAL` — **je Träger**, nie global |
| `anfrage_postfach` | text(254) | nein | Pflicht bei `kanal = EMAIL` |
| `antrag_postfach` | text(254) | nein | Falls abweichend |
| `betreffkonvention` | text(200) | nein | Vorlage, falls der Träger ein Format erwartet |
| `tls_geprueft` | boolean | ja | Bei `false` gehen **keine** Anlagen hinaus |
| `smime_faehig` | boolean | ja | |
| `antwortzeit_zusage_stunden` | int | nein | Grundlage der Fristüberwachung |
| `laender` | char(2)[] | ja | Nicht jeder Träger ist in beiden Märkten verfügbar |

---

## 6. KONTAKT_ORGANISATION — Ansprechpartner

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `kontakt_id` / `organisation_id` | uuid | ja | |
| `funktion` | text(100) | nein | „Geschäftsführung", „Verkaufsleitung" |
| `ist_hauptansprechpartner` | boolean | ja | Genau einer je Organisation |
| `zeichnungsberechtigt` | boolean | ja | Wer unterschreiben darf |
| `gueltig_ab` / `gueltig_bis` | date | ja / nein | Personen wechseln, Organisationen bleiben |

---

## 7. KUNDE — wirtschaftliche Einheit

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `kundennummer` | text(20) | ja | Fachlich, extern kommunizierbar. **Global eindeutig, fortlaufend ab `000001`, ohne Bedeutung** — [ADR-0006](adr/0006-kundennummer-fortlaufend.md), [Kapitel 13](13_STARTKONFIGURATION.md) §2 |
| `art` | enum | ja | `PRIVAT`, `GEWERBE`, `VEREIN`, `GEMEINSCHAFT` |
| `organisation_id` | uuid | nein | Bei `GEWERBE` und `VEREIN` |
| `bezeichnung` | text(200) | ja | Abgeleitet oder frei: „Familie Berger", „Segelclub Attersee" |
| `betreuer_id` | uuid | nein | Zuständiger Vertriebsmitarbeiter |
| `vermittler_organisation_id` | uuid | nein | Falls über Makler oder Händler betreut |
| `kunde_seit` | date | nein | Datum des ersten aktiven Vertrags |
| `status` | enum | ja | `INTERESSENT`, `AKTIV`, `RUHEND`, `EHEMALIG` |
| `customer_value_score` | int (0–100) | nein | Aus `01_CRM_ENGINE`, täglich neu berechnet |
| `risk_score` | int (0–100) | nein | Kündigungsrisiko, aus `01_CRM_ENGINE` |
| `score_faktoren` | jsonb | nein | **Top-Faktoren beider Scores. Pflicht, sobald ein Score gesetzt ist** — ein Score ohne Begründung ist nicht erklärbar |
| `vip` | boolean | ja | Steuert Eskalationswege |
| `zahlungsverhalten` | enum | nein | `UNAUFFAELLIG`, `VERZOEGERT`, `MAHNSTUFE`, `INKASSO` |
| `bevorzugter_kanal` | enum | nein | `EMAIL`, `TELEFON`, `POST`, `PORTAL` |

**KUNDE_KONTAKT** verbindet Personen mit der wirtschaftlichen Einheit:

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `kunde_id` / `kontakt_id` | uuid | ja | |
| `rolle` | enum | ja | `VERSICHERUNGSNEHMER`, `MITVERSICHERT`, `BEVOLLMAECHTIGT`, `ZAHLER`, `ANSPRECHPARTNER` |
| `gueltig_ab` / `gueltig_bis` | date | ja / nein | |

> Damit ist das Ehepaar mit gemeinsamer Yacht abgebildet: ein Kunde, zwei
> Kontakte, einer davon `VERSICHERUNGSNEHMER`, der andere `MITVERSICHERT`.

---

## 8. EINWILLIGUNG

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `kontakt_id` | uuid | ja | |
| `zweck` | enum | ja | `ANGEBOTSBEARBEITUNG`, `KONTAKT_EMAIL`, `KONTAKT_TELEFON`, `UEBERMITTLUNG_VERSICHERER`, `MARKETING`, `PROFILBILDUNG` |
| `rechtsgrundlage` | enum | ja | `EINWILLIGUNG`, `VERTRAG`, `RECHTLICHE_PFLICHT`, `BERECHTIGTES_INTERESSE` |
| `erteilt` | boolean | ja | |
| `erteilt_am` | timestamptz | ja | |
| `widerrufen_am` | timestamptz | nein | **Widerruf beendet, löscht nicht** — der Nachweis muss bleiben |
| `hinweis_version` | text(20) | ja | Fassung des Datenschutzhinweises zum Zeitpunkt der Erteilung |
| `einwilligungstext` | text | ja | Der Wortlaut, dem zugestimmt wurde. Kopie, kein Verweis |
| `herkunft` | text(100) | ja | Formular, Telefon, Papier, Portal. **Ohne IP-Adresse** — unnötiger Personenbezug |
| `beleg_dokument_id` | uuid | nein | Bei Papier: Verweis auf den Scan |

---

## 9. LEAD

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `leadnummer` | text(20) | ja | Fachlich, für die Kommunikation |
| `kontakt_id` | uuid | **nein** | Ein Lead entsteht oft vor der Identifikation |
| `organisation_id` | uuid | nein | Empfehlender Händler oder Club |
| `roh_vorname` / `roh_nachname` / `roh_email` / `roh_telefon` | text | nein | Angaben, solange kein Kontakt zugeordnet ist |
| `quelle_detail` | enum | ja | `WEBSITE`, `EMPFEHLUNG`, `HAENDLER`, `CLUB`, `MESSE`, `TELEFON`, `ANZEIGE`, `LINKEDIN`, `SONSTIGE` |
| `kampagne_id` | uuid | nein | Attribution |
| `utm_quelle` / `utm_medium` / `utm_kampagne` / `utm_inhalt` | text(200) | nein | **Roh gespeichert und unverändert** — erlaubt spätere Neuberechnung der Attribution |
| `land` | char(2) | ja | Bestimmt Mandant und Rechtstexte |
| `produktinteresse` | enum[] | nein | `KASKO`, `HAFTPFLICHT`, `SKIPPER`, `CHARTER`, `TRANSPORT`, `PAKET` |
| `boot_angabe` | jsonb | nein | Bootsdaten aus dem Formular, bevor ein `BOOT` entsteht |
| `indikation_von` / `indikation_bis` | numeric(14,2) | nein | Die auf der Website angezeigte Spanne |
| `indikation_tarifwerke` | jsonb | nein | Verwendete Tarifwerk-Versionen — Grundlage der Abweichungsmessung |
| `status` | enum | ja | `NEU`, `IN_BEARBEITUNG`, `QUALIFIZIERT`, `GEWONNEN`, `VERLOREN` |
| `lead_score` | int (0–100) | nein | Aus `01_CRM_ENGINE` |
| `score_faktoren` | jsonb | nein | **Pflicht, sobald ein Score gesetzt ist** |
| `prioritaet` | enum | ja | `NIEDRIG`, `NORMAL`, `HOCH`, `DRINGEND` |
| `betreuer_id` | uuid | nein | |
| `erstkontakt_frist` | timestamptz | nein | Aus dem Score abgeleitet: A-Lead zwei Stunden, C-Lead Folgetag |
| `erstkontakt_am` | timestamptz | nein | Grundlage der Reaktionszeit-Kennzahl |
| `verlustgrund` | enum | nein | `KEINE_REAKTION`, `KEIN_BEDARF`, `PREIS`, `WETTBEWERB`, `NICHT_VERSICHERBAR`, `DUBLETTE`, `SONSTIGES` |
| `kunde_id` | uuid | nein | Gesetzt bei `GEWONNEN` |

---

## 10. BOOT

Die Felder sind aus den realen Tarifen abgeleitet
([`14_TARIFANALYSE.md`](../01_ARCHITECTURE/14_TARIFANALYSE.md)). Jedes Feld
speist entweder eine Tarifposition, einen Zuschlag oder eine Annahmerichtlinie.

### 10.1 Identität

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `bootsname` | text(100) | nein | |
| `bootstyp` | enum | ja | `SEGELYACHT`, `MOTORYACHT`, `KATAMARAN`, `TRIMARAN`, `JOLLE`, `SPORTBOOT`, `SCHLAUCHBOOT`, `HAUSBOOT`, `JETSKI`, `RUDERBOOT`, `SONSTIGES` |
| `bauart` | enum | nein | `KOMFORT`, `SPORT` (Segel) · `VERDRAENGER`, `GLEITER` (Motor). **Tariflich relevant** |
| `hersteller_organisation_id` | uuid | nein | Verweis auf die Organisation mit Rolle `HERSTELLER`. Steuert den Premiumnachlass |
| `hersteller_freitext` | text(100) | nein | Solange der Hersteller nicht im Stammdatensatz steht |
| `modell` | text(100) | nein | |
| `baujahr` | int | ja | **Annahmerichtlinie:** Fahrzeuge über 15 Jahre sind anfragepflichtig |
| `rumpfnummer` | text(50) | nein | CIN/HIN des Herstellers |
| `amtliches_kennzeichen` | text(30) | nein | |
| `flaggenland` | char(2) | ja | **Annahmerichtlinie:** außer AT, DE, SLO, HR anfragepflichtig |

### 10.2 Technik

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `laenge_m` | numeric(6,2) | ja | |
| `laenge_fuss` | numeric(6,2) | nein | Abgeleitet. Zusatzprodukte werden nach Fuß tarifiert |
| `breite_m` / `tiefgang_m` | numeric(5,2) | nein | |
| `verdraengung_t` | numeric(8,2) | nein | |
| `rumpfmaterial` | enum | ja | `GFK`, `HOLZ`, `CARBON`, `ALUMINIUM`, `STAHL`. **Holz und Carbon: +25 % Zuschlag** |
| `mastmaterial` | enum | nein | `ALUMINIUM`, `CARBON`, `HOLZ`. Der Tarif setzt Aluminium voraus |
| `segelflaeche_m2` | numeric(7,2) | nein | **Pflicht bei Segelbooten** — bestimmt die Haftpflichtprämie |
| `motorleistung_kw` | numeric(8,2) | nein | **Pflicht bei Motorbooten** — bestimmt die Haftpflichtprämie |
| `motorleistung_ps` | numeric(8,2) | nein | Abgeleitet. Beide Einheiten, weil beide Tarife beide verwenden |
| `motorart` | enum | nein | `INNENBORDER`, `AUSSENBORDER`, `SAILDRIVE`, `KEIN_MOTOR` |
| `motoranzahl` | int | nein | |
| `hoechstgeschwindigkeit_kn` | numeric(5,1) | nein | **Annahmerichtlinie:** über 40 kn anfragepflichtig |
| `baujahr_motor` | int | nein | |

### 10.3 Wert und Zubehör

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `neuwert` | numeric(14,2) + `waehrung` | nein | |
| `zeitwert` | numeric(14,2) + `waehrung` | ja | Bemessungsgrundlage der Kaskoprämie |
| `zeitwert_stichtag` | date | ja | Ein Zeitwert ohne Stichtag ist wertlos |
| `wert_zubehoer` | numeric(14,2) | nein | Fest eingebaute Teile |
| `hat_beiboot` | boolean | ja | Beitragssatz wie Fahrzeug |
| `wert_beiboot` | numeric(14,2) | nein | |
| `hat_trailer` | boolean | ja | Nur zusammen mit dem Boot versicherbar |
| `wert_trailer` | numeric(14,2) | nein | |
| `hat_aussenbordmotor_zusatz` | boolean | ja | Hilfsaußenborder |
| `gesamtversicherungssumme` | numeric(14,2) | ja | Summe aller Werte. **Über 1 Mio anfragepflichtig** |

### 10.4 Nutzung und Liegeplatz

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `nutzungsart` | enum | ja | `PRIVAT`, `CHARTER_MIT_SKIPPER`, `CHARTER_OHNE_SKIPPER`, `GEWERBLICH`, `REGATTA`. **Zuschlag 25 % bzw. 50 %** |
| `fahrtgebiet` | enum | ja | `AT_BINNEN`, `DE_BINNEN`, `EU_BINNEN`, `NORD_OSTSEE`, `MITTELMEER`, `ATLANTIK`, `WELTWEIT` |
| `heimatgewaesser` | text(100) | nein | **Nachlassfähige Seen** (Bodensee, Chiemsee …) |
| `liegeplatz_art` | enum | ja | `MARINA`, `TROCKEN`, `BOJE`, `TRAILER`, `PRIVATSTEG`, `WINTERLAGER` |
| `liegeplatz_adresse_id` | uuid | nein | |
| `liegeplatz_organisation_id` | uuid | nein | Marina oder Club als Organisation |
| `winterlager_art` | enum | nein | `HALLE`, `FREILAND`, `IM_WASSER` |

### 10.5 Eigentum und Historie

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `eigentuemer_kunde_id` | uuid | nein | Kann wechseln |
| `eigentum_seit` | date | nein | |
| `erworben_bei_organisation_id` | uuid | nein | Händler. Grundlage der Provisionszuordnung |
| `status` | enum | ja | `AKTIV`, `VERKAUFT`, `STILLGELEGT`, `TOTALSCHADEN` |
| `veraeussert_am` | date | nein | **Löst Kündigungsrisiko und Rückgewinnung aus** |
| `vorschaeden_anzahl` | int | ja | Vorgabe 0 |
| `vorschaeden_summe` | numeric(14,2) | nein | |

> **Datenschutzhinweis:** Bootstyp, Wert, Liegeplatz und Abwesenheitsmuster
> ergeben zusammen ein für Einbrüche verwertbares Profil. `BOOT` ist deshalb als
> Schutzklasse K3 eingestuft; Liegeplatzangaben erscheinen in Auswertungen nur
> aggregiert.

---

## 11. VERTRAG

Der Kopfsatz ist stabil. Alles Veränderliche liegt in `VERTRAGSVERSION`.

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `vertragsnummer` | text(30) | ja | Eigene Nummer, eindeutig je Mandant |
| `polizzennummer` | text(50) | nein | Nummer des Versicherers. Fehlt bis zur Policierung |
| `kunde_id` | uuid | ja | |
| `versicherer_organisation_id` | uuid | ja | Organisation mit Rolle `VERSICHERER` |
| `produktdefinition_id` | uuid | ja | |
| `sparte` | enum | ja | `KASKO`, `HAFTPFLICHT`, `INSASSENUNFALL`, `SKIPPER`, `CHARTER`, `TRANSPORT`, `PAKET` |
| `vermittler_organisation_id` | uuid | nein | Für Provision und Maklersicht |
| `status` | enum | ja | `ANGEBOT`, `BEANTRAGT`, `AKTIV`, `RUHEND`, `GEKUENDIGT`, `ABGELAUFEN`, `STORNIERT` |
| `beginn` | date | ja | |
| `ablauf` | date | nein | Leer bei unbefristeten Verträgen |
| `hauptfaelligkeit` | date | ja | **Auslöser des Verlängerungslaufs** |
| `kuendigungsfrist_tage` | int | ja | Bestimmt den Startzeitpunkt der Ansprache |
| `kuendigung_eingegangen_am` | date | nein | |
| `kuendigung_durch` | enum | nein | `KUNDE`, `VERSICHERER`, `VERMITTLER` |
| `kuendigungsgrund` | enum | nein | `PREIS`, `WETTBEWERB`, `BOOT_VERKAUFT`, `UNZUFRIEDEN`, `SCHADENFALL`, `SONSTIGES`. **Ohne Grund keine Verbesserung** |
| `aktuelle_version_id` | uuid | ja | Verweis auf die geltende Version |
| `vorgaenger_vertrag_id` | uuid | nein | Bei Umdeckung oder Trägerwechsel |
| `abgeschlossen_am` | timestamptz | nein | |
| `historie_unvollstaendig` | boolean | ja | **Standard `false`.** `true` bei Polizzenimport ohne Vorgeschichte — der Vertrag beginnt mit Version 1, obwohl es frühere gab ([Kapitel 14](14_POLIZZENIMPORT.md) §8.3) |

### 11.1 VERTRAGSVERSION — unveränderlich

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `vertrag_id` | uuid | ja | |
| `version` | int | ja | Fortlaufend |
| `gueltig_ab` / `gueltig_bis` | date | ja / nein | Überschneidungsfrei erzwungen |
| `anlass` | enum | ja | `NEUABSCHLUSS`, `VERLAENGERUNG`, `PRAEMIENANPASSUNG`, `OBJEKTWECHSEL`, `DECKUNGSAENDERUNG`, `ADRESSAENDERUNG`, `KORREKTUR` |
| `praemie_netto` | numeric(14,2) + `waehrung` | ja | Ohne Versicherungssteuer |
| `versicherungssteuer_satz` | numeric(6,4) | ja | Landes- und spartenabhängig |
| `praemie_brutto` | numeric(14,2) | ja | Gespeichert, nicht berechnet — der Versicherer ist maßgeblich |
| `zahlweise` | enum | ja | `MONATLICH`, `VIERTELJAEHRLICH`, `HALBJAEHRLICH`, `JAEHRLICH`, `EINMAL` |
| `selbstbehalt` | numeric(14,2) | nein | |
| `deckungssumme` | numeric(14,2) | nein | Bei Haftpflicht |
| `sfr_stufe` | int | nein | Schadenfreiheitsstufe. **Tariflich relevant, gehört an den Vertrag** |
| `sfr_prozent` | numeric(6,4) | nein | Gewährter Rabatt |
| `zuschlaege_saldo` | numeric(6,4) | nein | Angewandter Saldo aus Zu- und Abschlägen |
| `berechnungsprotokoll` | jsonb | nein | Welches Tarifwerk in welcher Version, welche Faktoren — Nachvollziehbarkeit |
| `produktdaten` | jsonb | nein | Produktspezifisch, mit `produktschema_version` |
| `dokument_id` | uuid | nein | Police oder Nachtrag |
| `erfasst_von` | uuid | ja | |

### 11.2 VERTRAGSOBJEKT — Boot zu Vertrag

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `vertrag_id` / `boot_id` | uuid | ja | |
| `rolle` | enum | ja | `HAUPTOBJEKT`, `BEIBOOT`, `TRAILER`, `AUSSENBORDMOTOR` |
| `versicherungssumme` | numeric(14,2) | ja | Je Objekt |
| `gueltig_ab` / `gueltig_bis` | date | ja / nein | Ein Boot kann während der Laufzeit wechseln |

> **N:M mit Zeitbezug.** Ein Vertrag deckt Boot, Beiboot und Trailer — NAUTIMA
> sieht genau das vor („im Schadenfall wird nur ein Selbstbehalt abgezogen").
> Ein Boot kann nacheinander mehreren Verträgen zugeordnet sein.

### 11.3 DECKUNG

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `vertragsversion_id` | uuid | ja | |
| `code` | text(50) | ja | |
| `bezeichnung` | text(200) | ja | |
| `versicherungssumme` | numeric(14,2) | nein | |
| `selbstbehalt` | numeric(14,2) | nein | |
| `ist_hauptdeckung` | boolean | ja | |
| `bedingungswerk_dokument_id` | uuid | nein | **Das Bedingungswerk gehört hierher, nicht ins Tarifwerk** |

### 11.4 PRAEMIE — Zahlungszeiträume

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `vertragsversion_id` | uuid | ja | |
| `zeitraum_von` / `zeitraum_bis` | date | ja | |
| `betrag_netto` / `betrag_brutto` | numeric(14,2) + `waehrung` | ja | |
| `faellig_am` | date | ja | |
| `status` | enum | ja | `OFFEN`, `BEZAHLT`, `MAHNUNG`, `STORNIERT` |
| `inkasso_durch` | enum | ja | `VERSICHERER`, `VERMITTLER` (**C-05**) |

---

## 12. AUFGABE

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `titel` | text(200) | ja | |
| `beschreibung` | text | nein | |
| `bezug_typ` | enum | ja | `KONTAKT`, `KUNDE`, `LEAD`, `VERTRAG`, `BOOT`, `ORGANISATION`, `VORGANG`, `KEIN` |
| `bezug_id` | uuid | nein | |
| `zustaendig_benutzer_id` | uuid | nein | Leer bedeutet: unzugeteilt, erscheint im Team-Eingang |
| `zustaendig_team` | text(50) | nein | |
| `faellig_am` | timestamptz | ja | |
| `erinnerung_am` | timestamptz | nein | Vor der Fälligkeit |
| `prioritaet` | enum | ja | `NIEDRIG`, `NORMAL`, `HOCH`, `DRINGEND` |
| `status` | enum | ja | `OFFEN`, `IN_ARBEIT`, `WARTET`, `ERLEDIGT`, `ABGEBROCHEN` |
| `regel_code` | text(20) | nein | Erzeugende Automatisierungsregel, etwa `A-21` |
| `dublettenschluessel` | text(200) | **unique** | **Verhindert, dass ein zweimal laufender Nachtjob eine zweite Aufgabe erzeugt** |
| `eskalationsstufe` | int | ja | Vorgabe 0 |
| `eskaliert_am` | timestamptz | nein | |
| `wiedervorlage_von_id` | uuid | nein | Bei Verschiebung: Verweis auf die ursprüngliche Aufgabe |
| `erledigt_am` / `erledigt_von` | timestamptz / uuid | nein | |
| `ergebnis` | enum | nein | `ERFOLGREICH`, `KEIN_ERFOLG`, `NICHT_ERREICHT`, `VERSCHOBEN` |
| `score` | int | nein | Priorisierungswert aus `01_CRM_ENGINE` |

---

## 13. AKTIVITAET — dokumentierte Interaktion

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `art` | enum | ja | `TELEFON_AUS`, `TELEFON_EIN`, `EMAIL_AUS`, `EMAIL_EIN`, `TERMIN`, `BERATUNG`, `BESICHTIGUNG`, `MESSE`, `PORTAL`, `BRIEF` |
| `bezug_typ` / `bezug_id` | enum / uuid | ja | |
| `kontakt_id` | uuid | nein | Mit wem |
| `benutzer_id` | uuid | ja | Wer aus dem Haus |
| `zeitpunkt` | timestamptz | ja | |
| `dauer_minuten` | int | nein | |
| `betreff` | text(200) | ja | |
| `inhalt` | text | nein | |
| `ergebnis` | enum | nein | `POSITIV`, `NEUTRAL`, `NEGATIV`, `NICHT_ERREICHT` |
| `folgeaktion` | text(200) | nein | |
| `folgeaufgabe_id` | uuid | nein | |
| `ist_beratungsdokumentation` | boolean | ja | **Kennzeichnet nachweispflichtige Beratung** (**C-01**) |
| `dokument_id` | uuid | nein | Beratungsprotokoll |

---

## 14. NOTIZ

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `bezug_typ` / `bezug_id` | enum / uuid | ja | |
| `inhalt` | text | ja | |
| `sichtbarkeit` | enum | ja | `INTERN`, `TEAM`, `PERSOENLICH` — **nie kundensichtbar** |
| `angeheftet` | boolean | ja | Erscheint oben in der Akte |
| `kategorie` | enum | nein | `HINWEIS`, `WARNUNG`, `VEREINBARUNG`, `SONSTIGES` |

> Notizen sind personenbezogene Daten und unterliegen dem Auskunftsanspruch.
> Das ist der Grund, warum es kein Feld „vertraulich" gibt: Was nicht in eine
> Auskunft darf, gehört nicht ins System.

---

## 15. DOKUMENT und DOKUMENTVERSION

| Feld (DOKUMENT) | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `bezug_typ` / `bezug_id` | enum / uuid | ja | |
| `typ` | enum | ja | `POLICE`, `ANTRAG`, `ANGEBOT`, `BEDINGUNGSWERK`, `BERATUNGSPROTOKOLL`, `ERSTINFORMATION`, `GUTACHTEN`, `RECHNUNG`, `FOTO`, `AUSWEIS`, `KUENDIGUNG`, `KORRESPONDENZ`, `SONSTIGES` |
| `titel` | text(200) | ja | |
| `herkunft` | enum | ja | `KUNDE`, `AGENT`, `SYSTEM`, `VERSICHERER`, `PARTNER`, `SIGNATURDIENST` |
| `zugriffsklasse` | enum | ja | `INTERN`, `KUNDENSICHTBAR`, `EINGESCHRAENKT` |
| `aufbewahrungsklasse` | text(30) | ja | `VERTRAG`, `BUCHHALTUNG`, `BERATUNG`, `MARKETING`, `LEAD_OHNE_ABSCHLUSS` |
| `loeschdatum` | date | nein | Errechnet aus der Klasse |
| `geloescht_am` | timestamptz | nein | Inhalt entfernt, Metadaten bleiben |

| Feld (DOKUMENTVERSION) | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `dokument_id` | uuid | ja | |
| `version` | int | ja | |
| `speicherschluessel` | text | ja | **unique.** Verweis in den Objektspeicher — nie Inhalt in der Datenbank |
| `mime_typ` | text(100) | ja | Am Inhalt geprüft, nicht an der Endung |
| `groesse_bytes` | bigint | ja | |
| `pruefsumme_sha256` | text(64) | ja | |
| `scanstatus` | enum | ja | `OFFEN`, `SAUBER`, `BEFALLEN`, `FEHLER`. **Kein Abruf vor `SAUBER`** |
| `hochgeladen_von` | uuid | nein | |
| `signaturstatus` | enum | nein | `KEINE`, `ANGEFORDERT`, `SIGNIERT`, `ABGELEHNT` |

---

## 16. AUTOMATISIERUNGSREGEL — Steuerung als Daten

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `code` | text(20) | ja | **unique**, etwa `A-21`. Stabil, wird nie umbenannt |
| `bezeichnung` | text(200) | ja | |
| `ausloeser_typ` | enum | ja | `EREIGNIS`, `ZEITPUNKT`, `FRIST`, `SCHWELLWERT` |
| `ausloeser_definition` | jsonb | ja | Ereignisname oder Fristbedingung |
| `bedingung` | jsonb | nein | Einschränkende Merkmale |
| `aktion_typ` | enum | ja | `AUFGABE`, `KOMMUNIKATION`, `STATUSWECHSEL`, `EREIGNIS`, `ESKALATION` |
| `aktion_definition` | jsonb | ja | Vorlage, Zuständigkeit, Frist |
| `dublettenschluessel_muster` | text(200) | ja | Bauplan des Schlüssels der erzeugten Aufgabe |
| `prioritaet` | enum | ja | |
| `aktiv` | boolean | ja | |
| `gueltig_ab` / `gueltig_bis` | date | ja / nein | |
| `mandant_id` | uuid | nein | Leer bedeutet: gilt für alle Mandanten |

**REGELAUSLOESUNG** protokolliert jede Anwendung: `regel_code`, `bezug_typ`,
`bezug_id`, `ausgeloest_am`, `ergebnis`, `unterdrueckungsgrund`. Ohne dieses
Protokoll lässt sich nicht beantworten, warum eine Aufgabe entstanden ist — oder
warum nicht.

---

## 17. AUDITEINTRAG

Bewusst ohne Fremdschlüssel: Das Protokoll muss erhalten bleiben, auch wenn ein
Datensatz anonymisiert wird ([ADR-0006](../01_ARCHITECTURE/adr/0006-zwei-datenbanken.md)).

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `ereignis` | text(100) | ja | `kunde.geaendert`, `dokument.abgerufen` |
| `entitaet_typ` / `entitaet_id` | text / uuid | ja | Ohne Fremdschlüssel |
| `akteur_benutzer_id` | uuid | nein | Leer bedeutet: System |
| `akteur_rolle` | text(30) | ja | |
| `correlation_id` | text(50) | ja | Verbindet mit dem technischen Protokoll |
| `ergebnis` | enum | ja | `ERFOLG`, `ABGEWIESEN`, `FEHLER` — **auch Fehlzugriffe** |
| `aenderung` | jsonb | nein | Feldnamen und Vorher/Nachher. **Keine Nutzdaten**: keine Passwörter, keine Bankdaten, keine Dokumentinhalte |
| `zeitpunkt` | timestamptz | ja | |

Rechte: `INSERT` und `SELECT`. `UPDATE` und `DELETE` sind der Anwendungsrolle
entzogen und zusätzlich per Trigger blockiert.

---

## 18. Importentitäten — vier Tabellen für den Polizzenimport

Der Bestand entsteht aus PDF-Polizzen. Die vollständigen Feldtabellen stehen in
[`14_POLIZZENIMPORT.md`](14_POLIZZENIMPORT.md) §5, weil sie nur dort zu verstehen
sind. Hier die Einordnung:

| Entität | Zweck | Warum eigenständig |
|---|---|---|
| `IMPORTSTAPEL` | Bündel von Belegen mit gemeinsamem Status | Erst ein **abgeschlossener** Stapel gibt die Verträge für Automationen frei |
| `IMPORTBELEG` | Ein PDF auf seinem Weg durch fünf Stufen | Trägt Prüfsumme, Klassifikation, Ablehnungsgrund — ein abgelehnter Beleg verschwindet nicht |
| `EXTRAKTIONSFELD` | Ein extrahierter Wert mit **Dokument, Seite, Fundstelle, Konfidenz** | Die Tabelle, die aus einem Import eine Beweislage macht |
| `POLIZZENPROFIL` | Extraktionswissen je Versicherer, als Daten | Ein neuer Versicherer ist kein Entwicklungsauftrag ([ADR-0007](adr/0007-polizze-als-beleg.md)) |

Damit umfasst das Kern-CRM **28 Entitäten**.

