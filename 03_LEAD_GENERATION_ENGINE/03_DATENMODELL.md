# 03 — Datenmodell

---

## 1. Die geforderte Feldliste — und wo sie tatsächlich liegt

Der Auftrag nennt eine flache Tabelle `LEAD` mit Lead-ID, Typ, Firma, Vorname,
Nachname, Position, E-Mail, Telefon, Mobil, Website, LinkedIn, Facebook,
Instagram, Adresse, PLZ, Ort, Land, Status, Score, Quelle, Erstellt am, Letzter
Kontakt, Notizen, Marketingstatus, DSGVO-Status.

**Diese Liste ist vollständig umgesetzt. Sie ist die Ansicht, nicht die
Speicherung.**

Der Grund steht in [ADR-0001 des Kern-CRM](../02_CORE_CRM/adr/0001-kontakt-kunde-lead-getrennt.md):
Eine Tabelle, die gleichzeitig Firma, Person und Adresse führt, scheitert an
Fällen, die hier die Regel sind — ein Yachtclub mit Obmann *und* Schriftführer,
ein Händler mit drei Standorten, eine Person, die in zwei Vereinen Funktionär
ist. Und sie kollidiert mit dem CRM, das dieselben Dinge bereits sauber führt.

### 1.1 Zuordnungstabelle — Auftragsfeld → tatsächlicher Ort

| Auftragsfeld | Liegt in | Feld | Bemerkung |
|---|---|---|---|
| Lead-ID | `RECHERCHEOBJEKT` | `objektnummer` | Fortlaufend, ohne Bedeutung — wie ADR-0006 des CRM |
| Typ | `RECHERCHEOBJEKT` | `zielgruppe` | Z1…Z5 und Untergruppe |
| Firma | `RECHERCHEOBJEKT` | `name_roh`, `name_norm` | Roh **und** normalisiert, beides |
| Vorname / Nachname / Position | `AKQUISEKONTAKT` | `vorname`, `nachname`, `funktion` | 0..n je Objekt |
| E-Mail | `AKQUISEKONTAKT` bzw. `RECHERCHEOBJEKT` | `email` | **Getrennt:** `info@` gehört der Organisation, `m.huber@` der Person |
| Telefon / Mobil | beide | `telefon_e164`, `mobil_e164` | Normalisiert gespeichert, roh daneben |
| Website | `RECHERCHEOBJEKT` | `website`, `domain_norm` | Domain ist der stärkste Dublettenschlüssel (Kapitel 6) |
| LinkedIn / Facebook / Instagram | `RECHERCHEOBJEKT` | `profile` (jsonb) | Nur öffentliche Profil-URL, **keine Inhalte** (Kapitel 4.5) |
| Adresse / PLZ / Ort / Land | `RECHERCHEOBJEKT` | `adresse_*`, `land` | Land steuert Mandant und Rechtstexte |
| Status | `RECHERCHEOBJEKT` **und** CRM | `bearbeitungsstatus` / Pipeline | Zwei Statuslinien, siehe §1.2 |
| Score | `RECHERCHEOBJEKT` | `basiswert`, `potenzialwert`, `score_herleitung` | Zweistufig (Kapitel 5) |
| Quelle | `OBJEKTBELEG` | je Feld | Nicht ein Feld je Objekt, sondern **ein Beleg je Feld** |
| Erstellt am | Konvention | `erstellt_am` | Aus dem Basisfeldsatz des CRM |
| Letzter Kontakt | CRM | `AKTIVITAET` | Ergibt sich aus der letzten Aktivität, wird nicht gepflegt |
| Notizen | CRM | `NOTIZ` | Mit Autor und Zeitpunkt statt Freitextfeld |
| Marketingstatus | CRM | abgeleitet aus `EINWILLIGUNG` | **Kein eigenes Feld** — sonst driftet es (Kapitel 10) |
| DSGVO-Status | CRM + `SPERRVERMERK` | Rechtsgrundlage, Widerspruch, Frist | Kapitel 13 |

### 1.2 Warum zwei Statuslinien

`bearbeitungsstatus` im Rechercheraum beantwortet: *Ist dieses Objekt geprüft?*
Die Pipeline im CRM (Kapitel 8) beantwortet: *Wie weit ist das Geschäft?*

Beides in ein Feld zu legen bedeutet, dass „zu prüfen" und „in Verhandlung" auf
derselben Skala liegen. Dann kann niemand mehr fragen, wie viel Recherche
ungeprüft liegt — und genau das ist die Kennzahl, die den Rückstau sichtbar macht.

---

## 2. Entitäten im Rechercheraum

Sieben Tabellen, eigenes Datenbankschema, eigene Rechte.

### 2.1 QUELLE

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `bezeichnung` | text(120) | ja | „Herstellerverzeichnis Bavaria", „ÖSV Clubliste" |
| `art` | enum | ja | `VERBAND`, `VERZEICHNIS`, `HERSTELLERLISTE`, `KARTENDIENST`, `MESSE`, `WEBSITE`, `MANUELL`, `EMPFEHLUNG` |
| `betreiber` | text(200) | nein | Wer die Quelle veröffentlicht |
| `url` | text(500) | nein | |
| `zugangsart` | enum | ja | `API`, `DOWNLOAD`, `MANUELLE_ERFASSUNG`, `LIEFERUNG` |
| `erlaubnis` | enum | ja | `OEFFENTLICH`, `LIZENZ`, `SCHRIFTLICHE_ZUSAGE`, `UNGEKLAERT` |
| `erlaubnis_beleg_dokument_id` | uuid | nein | **Pflicht bei `LIZENZ` und `SCHRIFTLICHE_ZUSAGE`** |
| `nutzungsbedingungen_geprueft_am` | date | nein | |
| `speicherung_erlaubt` | boolean | ja | Manche Dienste erlauben Nutzung, aber keine dauerhafte Speicherung (Kapitel 4.3) |
| `abdeckung` | text(200) | nein | Land, Region, Zielgruppe |
| `guete` | enum | ja | `HOCH`, `MITTEL`, `NIEDRIG` — aus der Trefferprüfung, nicht geschätzt |
| `takt` | enum | ja | `EINMALIG`, `MONATLICH`, `QUARTALSWEISE`, `JAEHRLICH` |
| `aktiv` | boolean | ja | |

**Regel:** `erlaubnis = UNGEKLAERT` ⇒ die Quelle kann angelegt, aber **nicht
ausgeführt** werden. Ein Recherchelauf gegen sie wird abgewiesen.

### 2.2 RECHERCHELAUF

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `quelle_id` | uuid | ja | |
| `gestartet_am` / `beendet_am` | timestamptz | ja / nein | |
| `gestartet_von` | uuid | nein | Leer = geplanter Lauf |
| `parameter` | jsonb | nein | Suchraum, Region, Filter — macht den Lauf wiederholbar |
| `anzahl_gefunden` / `anzahl_neu` / `anzahl_dublette` / `anzahl_verworfen` | int | ja | |
| `status` | enum | ja | `LAEUFT`, `ABGESCHLOSSEN`, `FEHLER`, `ABGEBROCHEN` |
| `fehlertext` | text | nein | |

Ohne diese Tabelle ist nicht beantwortbar, warum eine Zahl im Dashboard gestiegen
ist — und das ist die Frage, die als erste kommt.

### 2.3 RECHERCHEOBJEKT — der Kandidat

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `objektnummer` | text(20) | ja | Fortlaufend ab `R000001`, ohne Bedeutung |
| `zielgruppe` | enum | ja | `Z1_HANDEL`, `Z2_INFRASTRUKTUR`, `Z3_GEMEINSCHAFT`, `Z4_BETRIEB`, `Z5_INDUSTRIE` |
| `untergruppe` | enum | ja | `BOOTSHAENDLER`, `YACHTMAKLER`, `MARINA`, `HAFENBETREIBER`, `SEGELCLUB`, `MOTORBOOTCLUB`, `YACHTCLUB`, `WASSERSPORTVEREIN`, `CHARTER`, `WERFT`, `SERVICEBETRIEB`, `WASSERSPORTSCHULE`, `BOOTSHERSTELLER`, `MOTORENHERSTELLER` |
| `name_roh` | text(250) | ja | Genau wie in der Quelle |
| `name_norm` | text(250) | ja | Ohne Rechtsform, Diakritika, Füllwörter (Kapitel 6.2) |
| `rechtsform` | text(50) | nein | |
| `website` | text(500) | nein | |
| `domain_norm` | text(200) | nein | Registrierbare Domain, klein, ohne `www` |
| `email` | text(200) | nein | **Nur unpersönliche Adressen** (`info@`, `office@`) |
| `telefon_roh` / `telefon_e164` | text | nein | |
| `adresse_strasse` / `adresse_plz` / `adresse_ort` | text | nein | |
| `land` | char(2) | ja | ISO 3166-1 alpha-2 |
| `region` | text(50) | nein | Bundesland, für Gebietsplanung |
| `revier` | text(80) | nein | Gewässer — die fachlich brauchbarere Einteilung als PLZ |
| `geo_lat` / `geo_lon` | numeric(9,6) | nein | Für Gebietsplanung und Routen |
| `profile` | jsonb | nein | `{"linkedin": "...", "facebook": "...", "instagram": "...", "youtube": "..."}`. **Nur URLs** |
| `groesse_indikator` | int | nein | Liegeplätze, Mitglieder, Flottengröße — je Zielgruppe verschieden |
| `groesse_indikator_art` | enum | nein | `LIEGEPLAETZE`, `MITGLIEDER`, `FLOTTE`, `MITARBEITER`, `UNBEKANNT` |
| `basiswert` | int (0–100) | nein | Kapitel 5 |
| `potenzialwert` | int (0–100) | nein | **Erst nach Gespräch** |
| `score_herleitung` | jsonb | ja, sobald ein Wert gesetzt ist | Jeder Punkt mit seiner Tatsache |
| `bearbeitungsstatus` | enum | ja | `ROH`, `NORMALISIERT`, `BEWERTET`, `ZUR_PRUEFUNG`, `FREIGEGEBEN`, `VERWORFEN`, `ZURUECKGESTELLT`, `GESPERRT` |
| `verwerfungsgrund` | enum | nein | `KEINE_ZIELGRUPPE`, `AUFGELOEST`, `DUBLETTE`, `AUSSERHALB_MARKT`, `SPERRE`, `SONSTIGES` |
| `organisation_id` | uuid | nein | Gesetzt bei `FREIGEGEBEN` — der Weg ins CRM |
| `erstmals_gesehen_am` / `zuletzt_gesehen_am` | date | ja | Zweites Feld zeigt, ob die Quelle das Objekt noch führt |
| `mandant_id` | uuid | ja | Aus `land` abgeleitet |

**Eindeutig:** `domain_norm` je Mandant, sofern gesetzt. Zwei Objekte mit
derselben Domain sind dieselbe Organisation — mit sehr wenigen Ausnahmen, die
Kapitel 6.4 benennt.

### 2.4 OBJEKTBELEG — die Tabelle, die aus Recherche Nachweis macht

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `objekt_id` | uuid | ja | |
| `feldname` | text(60) | ja | `email`, `telefon_e164`, `groesse_indikator` … |
| `wert` | text | ja | Der Wert, wie diese Quelle ihn liefert |
| `quelle_id` | uuid | ja | |
| `lauf_id` | uuid | ja | |
| `fundstelle` | text(500) | nein | URL, Seite, Zeile |
| `gesehen_am` | date | ja | |
| `ist_aktuell` | boolean | ja | Nur ein Beleg je Feld ist der geltende |

Dasselbe Prinzip wie `EXTRAKTIONSFELD` beim Polizzenimport. **Ein Feld ohne
Beleg ist Hörensagen** — und beim ersten Widerspruch („Woher haben Sie meine
Nummer?") ist der Beleg die einzige Antwort, die trägt (Kapitel 13.3).

### 2.5 AKQUISEKONTAKT — die Person, sobald es eine gibt

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `objekt_id` | uuid | ja | |
| `vorname` / `nachname` | text(100) | nein | |
| `funktion` | text(100) | nein | Obmann, Geschäftsführer, Hafenmeister, Verkaufsleitung |
| `email` | text(200) | nein | **Personenbezogen — löst die Informationspflicht aus (Kapitel 13.2)** |
| `telefon_e164` / `mobil_e164` | text(20) | nein | |
| `linkedin_url` | text(500) | nein | Nur öffentliche Profil-URL |
| `quelle_id` | uuid | ja | |
| `belegt_am` | date | ja | Startpunkt der Monatsfrist aus Art. 14 DSGVO |
| `information_versendet_am` | date | nein | **Nachweis der Erfüllung.** Fehlt er nach der Frist, entsteht eine Aufgabe |
| `kontakt_id` | uuid | nein | Nach Übernahme ins CRM |

**Regel:** Ein `AKQUISEKONTAKT` wird nur angelegt, wenn ein Ansprechpartner
tatsächlich benötigt wird. Für die Erfassung einer Marina genügt `info@` — und
solange kein Name gespeichert ist, entsteht auch keine Pflicht.

### 2.6 ABGLEICHVORSCHLAG

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `objekt_id` | uuid | ja | |
| `ziel_typ` | enum | ja | `RECHERCHEOBJEKT`, `ORGANISATION` |
| `ziel_id` | uuid | ja | |
| `kennzahl` | numeric(4,3) | ja | 0…1 |
| `treffer` | jsonb | ja | Welche Regel bei welchem Feld angeschlagen hat |
| `entscheidung` | enum | ja | `OFFEN`, `IST_DIESELBE`, `IST_ANDERE`, `UNKLAR` |
| `entschieden_von` / `entschieden_am` | uuid / timestamptz | nein | |

**`IST_ANDERE` ist die wichtigste Entscheidung.** Sie unterdrückt den Vorschlag
dauerhaft. Ohne dieses Gedächtnis schlägt das System dieselbe falsche Dublette
bei jedem Lauf erneut vor, und nach dem dritten Mal schaut niemand mehr hin.

### 2.7 SPERRVERMERK

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `art` | enum | ja | `WIDERSPRUCH`, `KEIN_INTERESSE`, `AUFGELOEST`, `WETTBEWERB`, `INTERN` |
| `schluesselart` | enum | ja | `DOMAIN`, `EMAIL`, `TELEFON`, `ORGANISATION`, `KONTAKT` |
| `schluessel` | text(200) | ja | Normalisiert |
| `gueltig_bis` | date | nein | **Leer = dauerhaft.** Pflichtleer bei `WIDERSPRUCH` |
| `grund` | text(500) | nein | |
| `erfasst_von` / `erfasst_am` | uuid / date | ja | |

Wirkt **quellenübergreifend und vor jeder Erfassung**: Ein gesperrter Schlüssel
erzeugt gar kein Objekt, statt eines, das später aussortiert wird. Der
Unterschied ist rechtlich erheblich — bei einem Widerspruch nach Art. 21 DSGVO
darf gar nicht erst wieder verarbeitet werden.

---

## 3. ER-Modell

```
                        ┌──────────────┐
                        │    QUELLE    │
                        └───────┬──────┘
                                │ 1
                                │
                                │ n
                        ┌───────▼──────────┐
                        │  RECHERCHELAUF   │
                        └───────┬──────────┘
                                │ 1
                                │ n
   ┌──────────────┐     ┌───────▼──────────────┐      ┌──────────────────┐
   │ SPERRVERMERK │····▶│   RECHERCHEOBJEKT    │◀────▶│ ABGLEICHVORSCHLAG│
   │ (prüft vor   │     │   (Organisation      │  n   └────────┬─────────┘
   │  Anlage)     │     │    als Vermutung)    │               │
   └──────────────┘     └───┬────────────┬─────┘               │
                          1 │          1 │                     │
                          n │          n │                     │
                 ┌──────────▼───┐  ┌─────▼─────────────┐       │
                 │ OBJEKTBELEG  │  │  AKQUISEKONTAKT   │       │
                 │ Feld+Quelle  │  │  Person + Frist   │       │
                 └──────────────┘  └─────────┬─────────┘       │
                                             │                 │
  ═══════════════════════════════════════════│═════════════════│══════════
   CRM (02_CORE_CRM)                         │                 │
                 ┌───────────────┐           │                 │
                 │ ORGANISATION  │◀──────────┼─────────────────┘
                 └───────┬───────┘           │
                         │ 1                 │
                         │ n                 ▼
                 ┌───────▼──────────┐  ┌──────────┐   ┌──────────┐
                 │ORGANISATIONSROLLE│  │ KONTAKT  │──▶│EINWILLIG.│
                 └──────────────────┘  └──────────┘   └──────────┘
                         │
                         ▼
                    ┌─────────┐    ┌────────────┐
                    │ AUFGABE │    │ AKTIVITAET │
                    └─────────┘    └────────────┘
```

Die Doppellinie ist die Freigabegrenze. **Kein Fremdschlüssel zeigt aus dem CRM
in den Rechercheraum** — nur umgekehrt. Damit bleibt der Rechercheraum
löschbar, ohne das CRM zu beschädigen: eine Anforderung, die aus der
Aufbewahrungsfrist folgt (Kapitel 13.4).

---

## 4. Was beim Übergang ins CRM entsteht

| Im Rechercheraum | Wird im CRM zu | Anmerkung |
|---|---|---|
| `RECHERCHEOBJEKT` | `ORGANISATION` mit `status = INTERESSENT` | `quelle = RECHERCHE` |
| `zielgruppe` / `untergruppe` | `ORGANISATIONSROLLE` | Z1 → `HAENDLER`, Z2/Z3 → `CLUB` bzw. `PARTNER`, Z5 → `HERSTELLER` |
| `AKQUISEKONTAKT` | `KONTAKT` + `KONTAKT_ORGANISATION` | Nur wenn ein Name vorliegt |
| Rechtsgrundlage | `EINWILLIGUNG` mit `rechtsgrundlage = BERECHTIGTES_INTERESSE` | **Nicht** `EINWILLIGUNG` — die liegt nicht vor (Kapitel 10.2) |
| `basiswert` | `ORGANISATION` → nachrichtlich, Steuerung bleibt im Rechercheraum | Der Score gehört zur Akquise, nicht zum Bestand |
| `objektnummer` | Rückverweis am Organisationsdatensatz | Die Belegkette bleibt auffindbar |

Ein `LEAD` im Sinne des Kern-CRM entsteht dabei **nicht**. Jener Lead ist eine
Versicherungsanfrage einer Person; hier geht es um Partnergewinnung. Zwei
verschiedene Dinge in dieselbe Tabelle zu legen, wäre derselbe Fehler wie in §1
— nur eine Ebene höher.
