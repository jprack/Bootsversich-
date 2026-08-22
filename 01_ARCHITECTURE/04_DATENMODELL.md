# 04 — Datenmodell

## 1. Modellierungsentscheidungen

| Nr. | Entscheidung | Begründung |
|---|---|---|
| **D1** | `Kontakt` (natürliche Person) und `Kunde` (wirtschaftliche Einheit) sind getrennt. | Ein Ehepaar mit gemeinsamem Boot ist ein Kunde mit zwei Kontakten. Eine Person kann Kunde, Ansprechpartner eines Händlers und Clubmitglied zugleich sein. |
| **D2** | `Händler`, `Bootsclub` und `Partner` sind **Rollen einer Organisation**, keine eigenen Tabellen. | Struktur identisch, Verhalten unterschiedlich. Drei Tabellen bedeuten drei Adressverwaltungen und drei Pflegestellen. Siehe [`adr/0004-organisation-mit-rollen.md`](adr/0004-organisation-mit-rollen.md). |
| **D3** | `Lead` verweist **optional** auf `Kontakt`. | Ein Lead entsteht oft, bevor die Person zweifelsfrei identifiziert ist. Ein Pflichtverweis erzwänge frühe, falsche Zusammenführungen. |
| **D4** | `Boot` und `Vertrag` sind getrennt, verbunden über `Vertragsobjekt`. | Ein Vertrag kann mehrere Objekte umfassen; ein Boot kann nacheinander mehreren Verträgen zugeordnet sein und den Eigentümer wechseln. |
| **D5** | Alle Geldbeträge sind `numeric(14,2)` **mit** Währungsfeld. | Gleitkomma erzeugt Rundungsfehler bei Prämienvergleichen. Ein Betrag ohne Währung ist bedeutungslos. |
| **D6** | Produktspezifische Risikodaten liegen in `jsonb` mit gespeicherter Schemaversion. | Die Pflichtfelder je Versicherungsprodukt sind unbekannt und ändern sich. Zentrale Felder bleiben relational. |
| **D7** | `Einwilligung` ist eine eigene Entität mit Zweck, Rechtsgrundlage und Hinweisversion. | Ein Häkchen in der Kontakttabelle ist kein Nachweis. Widerruf beendet die Einwilligung, löscht sie aber nicht. |
| **D8** | `mandant_id` in jeder Kerntabelle, durchgesetzt per Row Level Security. | Nachrüsten wäre eine Migration über den gesamten Bestand. |
| **D9** | `Auditeintrag` ohne Fremdschlüssel, Bezug über `entitaet_typ` + `entitaet_id`. | Das Protokoll muss erhalten bleiben, auch wenn ein Datensatz anonymisiert wird. |
| **D10** | Historisch relevante Datensätze werden versioniert, nicht überschrieben. | Betrifft `Vertragsversion`, `Angebot`, `Dokumentversion`, `Produktschema`. |
| **D11** | `VERSICHERER` ist eine eigene Entität; `Produktdefinition`, `Übermittlung` und `Angebot` verweisen darauf. | Als Mehrfachagent stehen mehrere Träger zur Verfügung. Eine Anfrage fächert sich auf, mehrere Angebote kommen zurück (Kapitel 11). |
| **D12** | Ein Angebot trägt Auswahlkennzeichen **und** Auswahlbegründung; ohne Begründung ist keine Auswahl möglich. | Die Empfehlung aus mehreren Angeboten ist dokumentationspflichtig. Eine Begründung, die nachträglich entstehen soll, entsteht nie. |

---

## 2. Entity Relationship Diagram (Text)

### 2.1 Kernbereich — Person, Organisation, Vertrag, Objekt

```
                          ┌─────────────────┐
                          │     MANDANT     │
                          │  (Marke/Land)   │
                          └────────┬────────┘
                                   │ 1
                     ┌─────────────┼─────────────┬──────────────┐
                     │ N           │ N           │ N            │ N
            ┌────────▼───────┐ ┌───▼──────────┐ ┌▼───────────┐ ┌▼──────────┐
            │    KONTAKT     │ │ ORGANISATION │ │   BOOT     │ │ BENUTZER  │
            │ nat. Person    │ │ jur. Person  │ │            │ │ Anmeldung │
            └───┬────────┬───┘ └──┬────────┬──┘ └─────┬──────┘ └─────┬─────┘
                │        │        │        │          │              │
                │ N      │ 1      │ 1      │ 1        │ N            │ 1
                │        │        │        │          │              │
    ┌───────────▼──┐  ┌──▼────────▼───┐ ┌──▼──────────▼───┐   ┌──────▼──────┐
    │ EINWILLIGUNG │  │ KONTAKT_ROLLE │ │ ORGANISATIONS_  │   │ BENUTZER_   │
    │ Zweck        │  │ verbindet     │ │ ROLLE           │   │ ROLLE       │
    │ Rechtsgrund  │  │ Person ↔ Org  │ │ HAENDLER        │   └─────────────┘
    │ Hinweisvers. │  │ bzw. Kunde    │ │ CLUB            │
    └──────────────┘  └───────┬───────┘ │ PARTNER         │
                              │         │ MAKLER          │
                              │ N       └────────┬────────┘
                              │                  │ 1
                        ┌─────▼──────┐           │ N
                        │   KUNDE    │      ┌────▼─────────┐
                        │ wirtschaft.│      │ VEREINBARUNG │
                        │ Einheit    │      │ Konditionen  │
                        └─────┬──────┘      │ Provision    │
                              │ 1           └──────────────┘
                              │ N
                        ┌─────▼──────────┐         ┌──────────────┐
                        │    VERTRAG     │ 1     N │ VERTRAGS_    │
                        │ Police         ├─────────▶ VERSION      │
                        │ Status         │         │ unveränderl. │
                        │ Laufzeit       │         └──────────────┘
                        └──┬──────┬───┬──┘
                     1     │      │   │ 1
              ┌────────────▼─┐  1 │   └──────────────┐ N
              │ VERTRAGS_    │    │ N          ┌─────▼──────┐
              │ OBJEKT       │  ┌─▼─────────┐  │  DECKUNG   │
              │ Boot ↔ Vertr.│  │  PRAEMIE  │  │ Summe/SB   │
              └──────┬───────┘  │ Betrag    │  └────────────┘
                     │ N        │ Währung   │
                     │ 1        │ Zahlweise │
              ┌──────▼──────┐   └───────────┘
              │    BOOT     │
              │ Typ, Länge  │
              │ Baujahr     │
              │ Wert, Motor │
              │ Liegeplatz  │
              └─────────────┘
```

### 2.2 Vertriebsbereich — Lead, Aktivität, Aufgabe, Vorgang

```
   ┌──────────────┐                        ┌───────────────┐
   │ MARKETING_   │ 1                    N │     LEAD      │
   │ KAMPAGNE     ├────────────────────────▶ Quelle        │
   │ Kanal, Ziel  │      Attribution       │ Status        │
   │ Budget       │                        │ Score 0..100  │
   └──────┬───────┘                        │ Priorität     │
          │ 1                              └───┬───────┬───┘
          │ N                              0..1│       │ 0..1
   ┌──────▼───────┐                        ┌───▼────┐  │
   │  NEWSLETTER  │ 1        N ┌───────────│KONTAKT │  │
   │  Ausgabe     ├────────────▶ VERSAND_  └────────┘  │
   │  Betreff     │            │ NACHWEIS │            │ N
   │  Versanddat. │            │ Öffnung  │      ┌─────▼──────────┐
   └──────────────┘            │ Klick    │      │   VORGANG      │
                               │ Abmeldung│      │ Typ            │
                               └────┬─────┘      │ Zustand        │
                                    │ N          │ Frist          │
                                    │            └──┬──────────┬──┘
                               ┌────▼─────┐      1  │          │ 1
                               │  SIGNAL  │      ┌──▼───────┐  │ N
                               │ Verhalten│      │ VORGANGS_│  │
                               │ Zeitpunkt│      │ EREIGNIS │  │
                               └────┬─────┘      │ Übergang │  │
                                    │ N          └──────────┘  │
                                    │                    ┌─────▼──────┐
                               ┌────▼──────┐             │  ANGEBOT   │
                               │ AKTIVITAET│             │ Prämie     │
                               │ Typ       │             │ gültig bis │
                               │ Ergebnis  │             │ Freigabe   │
                               │ Folgeakt. │             └────────────┘
                               └────┬──────┘
                                    │ 1
                                    │ N
                               ┌────▼──────┐         ┌──────────────┐
                               │  AUFGABE  │ N     1 │   BENUTZER   │
                               │ Fälligkeit├─────────▶ zuständig    │
                               │ Priorität │         └──────────────┘
                               │ Status    │
                               │ Eskalation│
                               └───────────┘
```

### 2.3 Unterstützender Bereich — Dokument, Audit, Datenschutz

```
   ┌────────────┐ 1      N ┌──────────────────┐ 1     N ┌───────────────┐
   │  VORGANG   ├──────────▶    DOKUMENT      ├─────────▶ DOKUMENT_     │
   └────────────┘          │ Typ, Herkunft    │         │ VERSION       │
                           │ Zugriffsklasse   │         │ Speicherschl. │
   ┌────────────┐ 1      N │ Aufbewahrung     │         │ SHA-256       │
   │   KUNDE    ├──────────▶ Löschdatum       │         │ Scanstatus    │
   └────────────┘          └──────────────────┘         └───────┬───────┘
                                                                │ 1
                                                                │ N
                                                        ┌───────▼────────┐
                                                        │ SIGNATUR_      │
                                                        │ VORGANG        │
                                                        │ Status, Stufe  │
                                                        └────────────────┘

   ┌──────────────────┐         ┌─────────────────────┐
   │  AUDITEINTRAG    │         │ AUFBEWAHRUNGSREGEL  │
   │ ereignis         │         │ klasse              │
   │ entitaet_typ ────┼┐        │ dauer_monate        │
   │ entitaet_id      ││        │ rechtsgrundlage     │
   │ akteur, rolle    ││        │ sperrt_loeschung    │
   │ zeitpunkt        ││        └─────────────────────┘
   └──────────────────┘│
                       └── kein Fremdschlüssel (D9):
                           bleibt gültig, auch wenn die
                           referenzierte Person anonymisiert wird

   ┌──────────────────┐         ┌─────────────────────┐
   │  LOESCHANTRAG    │         │  AUSKUNFTSANTRAG    │
   │ status           │         │ status              │
   │ gesperrt_bis     │         │ export_schluessel   │
   └──────────────────┘         └─────────────────────┘
```

---

## 3. Beziehungstabelle

| Von | Kardinalität | Nach | Bedeutung | Löschverhalten |
|---|---|---|---|---|
| Mandant | 1 : N | Kontakt, Organisation, Boot, Vertrag, … | Trennungsgrenze | `RESTRICT` — ein Mandant mit Daten wird nicht gelöscht |
| Kontakt | 1 : N | Einwilligung | Nachweis je Zweck | `CASCADE` bei Anonymisierung: Inhalte werden überschrieben, Datensatz bleibt |
| Kontakt | N : M | Kunde (über `Kontakt_Rolle`) | Person gehört zu wirtschaftlicher Einheit | `RESTRICT` |
| Kontakt | N : M | Organisation (über `Kontakt_Rolle`) | Ansprechpartner | `SET NULL` |
| Organisation | 1 : N | Organisationsrolle | Händler / Club / Partner / Makler | `CASCADE` |
| Organisation | 1 : N | Standort | Filialen, Marinas | `CASCADE` |
| Organisationsrolle | 1 : N | Vereinbarung | Konditionen und Provision je Rolle | `RESTRICT` |
| Kunde | 1 : N | Vertrag | Bestand | `RESTRICT` |
| Vertrag | 1 : N | Vertragsversion | Historie, unveränderlich | `CASCADE` |
| Vertrag | 1 : N | Deckung | Deckungsbausteine | `CASCADE` |
| Vertrag | 1 : N | Prämie | Beträge je Zeitraum | `CASCADE` |
| Vertrag | N : M | Boot (über `Vertragsobjekt`) | Versicherte Objekte | `RESTRICT` |
| Boot | N : 1 | Kunde | Eigentum, zeitlich begrenzt gültig | `SET NULL` bei Verkauf |
| Lead | N : 0..1 | Kontakt | Erst nach Identifikation | `SET NULL` |
| Lead | N : 0..1 | Organisation | Empfehlender Händler oder Club | `SET NULL` |
| Lead | N : 1 | Marketingkampagne | Attribution | `SET NULL` |
| Lead | 1 : N | Vorgang | Anfrage wird zum Vorgang | `RESTRICT` |
| Marketingkampagne | 1 : N | Newsletter | Ausgaben einer Kampagne | `CASCADE` |
| Newsletter | 1 : N | Versandnachweis | je Empfänger | `CASCADE` |
| Versandnachweis | 1 : N | Signal | Öffnung, Klick, Abmeldung | `CASCADE` |
| Kontakt | 1 : N | Signal | Verhalten insgesamt | wird bei Anonymisierung entpersonalisiert |
| Kontakt | 1 : N | Aktivität | dokumentierte Interaktion | `RESTRICT` |
| Aktivität | 1 : N | Aufgabe | Folgehandlung | `SET NULL` |
| Aufgabe | N : 1 | Benutzer | Zuständigkeit | `SET NULL` |
| Vorgang | 1 : N | Vorgangsereignis | Zustandsübergänge | `CASCADE` |
| Vorgang | 1 : N | Angebot | Angebotsfassungen | `CASCADE` |
| Vorgang | 1 : N | Dokument | Unterlagen des Vorgangs | `RESTRICT` bei Aufbewahrungspflicht |
| Dokument | 1 : N | Dokumentversion | Fassungen | `RESTRICT` |
| Dokumentversion | 1 : N | Signaturvorgang | Signatur bindet an genau eine Fassung | `RESTRICT` |
| Aufbewahrungsregel | 1 : N | Dokument | bestimmt Löschdatum | `RESTRICT` |

---

## 4. Entitätensteckbriefe

Aufgeführt sind die zentralen Felder, nicht das vollständige Schema. Alle
Entitäten tragen zusätzlich: `id (uuid)`, `mandant_id (uuid)`,
`erstellt_am`, `geaendert_am`, `erstellt_von`, `geaendert_von`.

### KONTAKT — natürliche Person

| Feld | Typ | Anmerkung |
|---|---|---|
| `vorname`, `nachname` | text | |
| `geburtsdatum` | date | Kalenderdatum ohne Zeitzone |
| `anrede`, `titel` | text | optional |
| `sprache` | text | Vorgabe `de` |
| `vergleichsschluessel` | text | Nachname + Geburtsdatum + PLZ, normalisiert. **Kein** Unique — gleiche Merkmale sind ein Hinweis, kein Beweis |
| `verifiziert` | bool | Identität bestätigt |
| `gesperrt` | bool | Kontaktaufnahme untersagt |
| `anonymisiert_am` | timestamptz | Nach Löschprozess: personenbezogene Felder überschrieben, Datensatz bleibt für Referenzen |

**Nicht enthalten:** Bankverbindung, Steuernummer, Gesundheitsangaben,
Bonitätsdaten. Keines davon hat im MVP einen dokumentierten Zweck (Prinzip P8).

### KUNDE — wirtschaftliche Einheit

| Feld | Typ | Anmerkung |
|---|---|---|
| `kundennummer` | text | fachlich, extern kommunizierbar, eindeutig je Mandant |
| `art` | enum | `PRIVAT`, `GEWERBE` |
| `firmenname` | text | nur bei `GEWERBE` |
| `betreuer_id` | uuid | zuständiger Benutzer |
| `customer_value_score` | int | 0–100, aus M1 |
| `risk_score` | int | 0–100, Abwanderungsrisiko, aus M1 |
| `seit` | date | Datum des ersten aktiven Vertrags |

### ORGANISATION — Händler, Bootsclub, Partner, Makler

| Feld | Typ | Anmerkung |
|---|---|---|
| `name` | text | |
| `rechtsform` | text | |
| `registernummer` | text | Firmenbuch / Handelsregister |
| `ust_id` | text | Umsatzsteuer-Identifikationsnummer |
| `website` | text | |
| `status` | enum | `INTERESSENT`, `AKTIV`, `RUHEND`, `BEENDET` |

### ORGANISATIONSROLLE — macht aus einer Organisation einen Händler

| Feld | Typ | Anmerkung |
|---|---|---|
| `organisation_id` | uuid | |
| `rolle` | enum | `HAENDLER`, `CLUB`, `PARTNER`, `MAKLER`, `LIEFERANT` |
| `gueltig_ab`, `gueltig_bis` | date | Rollen enden, ohne die Organisation zu löschen |
| `portalzugang` | bool | steuert die Sichtbarkeit des Hubs |
| `vermittlerregistrierung` | text | bei `MAKLER` verpflichtend |

> Eine Organisation kann mehrere Rollen gleichzeitig tragen: Ein Händler, der
> auch vermittelt, hat `HAENDLER` und `MAKLER`. Genau das wäre mit getrennten
> Tabellen nicht abbildbar, ohne die Stammdaten zu verdoppeln.

### BOOT — versichertes Objekt

| Feld | Typ | Anmerkung |
|---|---|---|
| `bootstyp` | enum | `SEGELYACHT`, `MOTORYACHT`, `SPORTBOOT`, `JOLLE`, `KATAMARAN`, `HAUSBOOT`, `SONSTIGES` |
| `hersteller`, `modell` | text | |
| `baujahr` | int | |
| `laenge_m`, `breite_m`, `tiefgang_m` | numeric(5,2) | |
| `motorleistung_kw` | int | |
| `hoechstgeschwindigkeit_kn` | int | tariflich relevant |
| `rumpfnummer` | text | Herstellerkennung (CIN/HIN) |
| `kennzeichen` | text | amtliche Kennung, sofern vorhanden |
| `neuwert`, `zeitwert` | numeric(14,2) + `waehrung` | |
| `liegeplatz_typ` | enum | `MARINA`, `TROCKEN`, `BOJE`, `TRAILER`, `PRIVATSTEG` |
| `liegeplatz_gewaesser` | text | Revier — tariflich und für Marketing relevant |
| `nutzungsart` | enum | `PRIVAT`, `CHARTER`, `GEWERBLICH`, `REGATTA` |
| `eigentuemer_kunde_id` | uuid | kann wechseln |

### VERTRAG — Police

| Feld | Typ | Anmerkung |
|---|---|---|
| `vertragsnummer` | text | eindeutig je Mandant |
| `versicherer` | text | Risikoträger |
| `sparte` | enum | `KASKO`, `HAFTPFLICHT`, `SKIPPER`, `CHARTER`, `TRANSPORT`, `PAKET` |
| `status` | enum | `ANGEBOT`, `BEANTRAGT`, `AKTIV`, `RUHEND`, `GEKUENDIGT`, `ABGELAUFEN`, `STORNIERT` |
| `beginn`, `ablauf` | date | |
| `hauptfaelligkeit` | date | Auslöser des Verlängerungsworkflows |
| `kuendigungsfrist_tage` | int | bestimmt den Startzeitpunkt der Ansprache |
| `zahlweise` | enum | `MONATLICH`, `VIERTELJAEHRLICH`, `HALBJAEHRLICH`, `JAEHRLICH` |
| `jahresbeitrag` | numeric(14,2) + `waehrung` | |
| `vermittler_organisation_id` | uuid | vermittelnde Organisation, für Provision |
| `produktdaten` | jsonb | produktspezifisch, mit `produktschema_version` |

### LEAD — Vertriebsabsicht

| Feld | Typ | Anmerkung |
|---|---|---|
| `kontakt_id` | uuid **nullable** | siehe D3 |
| `quelle` | enum | `WEBSITE`, `EMPFEHLUNG`, `HAENDLER`, `CLUB`, `MESSE`, `TELEFON`, `ANZEIGE`, `SONSTIGE` |
| `kampagne_id` | uuid | Attribution |
| `utm_quelle`, `utm_medium`, `utm_kampagne`, `utm_inhalt` | text | Rohattribution, unverändert erhalten |
| `land` | enum | `AT`, `DE` |
| `produktinteresse` | text | |
| `status` | enum | `NEU`, `IN_BEARBEITUNG`, `QUALIFIZIERT`, `GEWONNEN`, `VERLOREN` |
| `lead_score` | int | 0–100 |
| `score_faktoren` | jsonb | Top-Faktoren der Bewertung — Pflicht (Prinzip P5) |
| `verlustgrund` | enum | `KEINE_REAKTION`, `KEIN_BEDARF`, `PREIS`, `WETTBEWERB`, `NICHT_VERSICHERBAR`, `DUBLETTE`, `SONSTIGES` |

### VERSICHERER — Risikoträger

| Feld | Typ | Anmerkung |
|---|---|---|
| `name`, `kurzname` | text | |
| `agenturnummer` | text | eigene Kennung beim Träger |
| `kanal` | enum | `EMAIL`, `API`, `PORTAL` — **je Träger**, keine globale Einstellung (ADR-0010) |
| `anfrage_postfach` | text | Zielpostfach für Angebotsanfragen |
| `antrag_postfach` | text | abweichendes Postfach für Anträge, sofern vorhanden |
| `betreffkonvention` | text | Vorlage, falls der Träger ein eigenes Format erwartet |
| `tls_geprueft` | bool | Nimmt das Mailsystem TLS zuverlässig an? Bei `false` gehen **keine** Anlagen hinaus |
| `smime_faehig` | bool | Ende-zu-Ende-Verschlüsselung möglich |
| `antwortzeit_zusage_stunden` | int | Grundlage der Fristüberwachung |
| `laender` | enum[] | `AT`, `DE` — nicht jeder Träger ist in beiden Märkten verfügbar |
| `aktiv` | bool | |

### ANGEBOT — Ergänzungen gegenüber Fassung 1.0

| Feld | Typ | Anmerkung |
|---|---|---|
| `versicherer_id` | uuid | Von welchem Träger das Angebot stammt |
| `ausgewaehlt` | bool | Genau ein Angebot je Anfrage darf `true` sein |
| `auswahlgrund` | enum | `BESTER_PREIS`, `DECKUNGSUMFANG`, `SELBSTBEHALT`, `REVIERABDECKUNG`, `KUNDENWUNSCH`, `EINZIGER_ANBIETER`, `SONSTIGES` |
| `auswahlbegruendung` | text | **Pflicht.** Katalogwert allein genügt nicht |
| `ausgewaehlt_von`, `ausgewaehlt_am` | uuid, timestamptz | Wer wann entschieden hat |

### MARKETINGKAMPAGNE

| Feld | Typ | Anmerkung |
|---|---|---|
| `name`, `beschreibung` | text | |
| `kanal` | enum | `NEWSLETTER`, `LINKEDIN`, `GOOGLE_ADS`, `MESSE`, `KOOPERATION`, `PRINT`, `ORGANISCH` |
| `beginn`, `ende` | date | |
| `budget` | numeric(14,2) + `waehrung` | Grundlage der Kosten-pro-Lead-Rechnung |
| `zielsegment` | jsonb | Segmentdefinition, versioniert |
| `ziel_leads`, `ziel_abschluesse` | int | Zielwerte für M11 |

### NEWSLETTER — einzelne Ausgabe

| Feld | Typ | Anmerkung |
|---|---|---|
| `kampagne_id` | uuid | |
| `betreff`, `vorschautext` | text | |
| `inhalt_referenz` | text | Verweis auf den Inhalt in WordPress |
| `segment_definition` | jsonb | eingefroren zum Versandzeitpunkt |
| `geplant_fuer`, `versendet_am` | timestamptz | |
| `externe_kampagnen_id` | text | Kennung bei Brevo |
| `empfaenger_anzahl`, `oeffnungen`, `klicks`, `abmeldungen`, `bounces` | int | Rücklauf |

### AUFGABE

| Feld | Typ | Anmerkung |
|---|---|---|
| `titel`, `beschreibung` | text | |
| `zustaendig_benutzer_id` | uuid | |
| `bezug_typ`, `bezug_id` | text, uuid | Kontakt, Kunde, Vertrag, Lead, Vorgang |
| `faellig_am` | timestamptz | |
| `prioritaet` | enum | `NIEDRIG`, `NORMAL`, `HOCH`, `DRINGEND` |
| `status` | enum | `OFFEN`, `IN_ARBEIT`, `ERLEDIGT`, `ABGEBROCHEN` |
| `regel_code` | text | erzeugende Regel, etwa `A-21` aus dem Regelkatalog |
| `dublettenschluessel` | text **unique** | verhindert doppelte Erzeugung durch wiederholte Regelläufe |
| `eskalationsstufe` | int | |

### EINWILLIGUNG

| Feld | Typ | Anmerkung |
|---|---|---|
| `kontakt_id` | uuid | |
| `zweck` | enum | `ANGEBOTSBEARBEITUNG`, `KONTAKT_EMAIL`, `KONTAKT_TELEFON`, `UEBERMITTLUNG_VERSICHERER`, `MARKETING`, `PROFILBILDUNG` |
| `rechtsgrundlage` | enum | `EINWILLIGUNG`, `VERTRAG`, `RECHTLICHE_PFLICHT`, `BERECHTIGTES_INTERESSE` |
| `erteilt` | bool | |
| `erteilt_am`, `widerrufen_am` | timestamptz | Widerruf beendet, löscht nicht |
| `hinweis_version` | text | Fassung des Datenschutzhinweises zum Zeitpunkt der Erteilung |
| `herkunft` | text | Formular, Telefon, Papier — ohne IP-Adresse (unnötiger Personenbezug) |

---

## 5. Datenhoheit — wer besitzt was

| Datum | System of Record | Read Model in |
|---|---|---|
| Kontakt, Kunde, Einwilligung | Domänenkern (M0) | WordPress-Portal, Brevo (Teilmenge), Analytics |
| Organisation, Rolle, Vereinbarung | Domänenkern (M0) | Hubs, Analytics |
| Boot | Domänenkern (M0) | Kundenportal, Dealer Hub |
| Vertrag, Prämie, Deckung | Domänenkern (M0); fachlich beim Versicherer | Kundenportal, Analytics |
| Lead, Score, Aufgabe, Aktivität | Domänenkern (M1) | Hubs (nur eigene), Analytics |
| Kampagne, Newsletter, Versandnachweis | Domänenkern (M3) | Brevo (Versand), Analytics |
| Dokumentmetadaten | Domänenkern (M9) | Portale |
| Dokumentinhalt | Objektspeicher | — |
| Vorgang, Frist | Domänenkern (M10) | Portale, Analytics |
| Seiteninhalte, Medien | WordPress | CDN |
| Auditprotokoll | Domänenkern, append-only | — |

**Grundregel:** Steht ein Read Model im Widerspruch zum System of Record,
gewinnt immer das System of Record. Ein Read Model wird nie zur Quelle einer
Korrektur.

---

## 6. Mandantenfähigkeit

```
mandant_id in JEDER Kerntabelle
        │
        ├── Row Level Security in PostgreSQL
        │   USING (mandant_id = current_setting('app.mandant_id')::uuid)
        │
        ├── gesetzt je Datenbankverbindung durch den Domänenkern
        │   aus dem geprüften Zugriffstoken — nie aus einem Parameter des Aufrufs
        │
        └── Wirkung: Ein Programmfehler in einer Abfrage kann keine
            mandantenfremden Daten liefern, weil die Datenbank sie nicht ausgibt
```

Mandanten sind zunächst: `AT`, `DE`. Später mögliche Mandanten: weitere Länder,
White-Label-Marken für große Händlerketten, Vertriebseinheiten.

---

## 7. Bekannte offene Punkte des Modells

| Punkt | Auswirkung | Klärung durch |
|---|---|---|
| Produktspezifische Pflichtfelder je Sparte und je Träger | `produktdaten` bleibt vorerst schwach spezifiziert. Bei E-Mail-Anbindung erhebt man sie aus den Antragsformularen der Versicherer | Innendienst je Träger, Welle 1 |
| Tarifdaten für eine unverbindliche Richtprämie | Entscheidet über den Zuschnitt von M2 | **A-08** |
| Provisionsmodell je Organisationsrolle ist unbestimmt | `Vereinbarung` bleibt grob | Geschäftsführung |
| Schadenmodell ist nicht Bestandteil dieser Fassung | Kein `Schaden`-Entitätsbereich | eigene Architekturphase |
| Zahlungs- und Mahnwesen ist offen | Keine `Zahlung`-Entität | **A-06** |
| Aufbewahrungsfristen je Dokumentklasse | `Aufbewahrungsregel` ist als Struktur vorhanden, Werte fehlen | Rechtsberatung / Steuerberatung |
