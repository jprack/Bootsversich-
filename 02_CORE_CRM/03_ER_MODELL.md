# 03 — Beziehungsmodell und ER-Diagramm

## 1. Die vier Achsen des Modells

Bevor die Kanten: Das Modell hat vier Achsen, und wer sie kennt, findet jede
Beziehung selbst.

| Achse | Frage | Zentrale Entität |
|---|---|---|
| **Wer** | Welche Person, welche Organisation? | `KONTAKT`, `ORGANISATION` |
| **Für wen** | Welche wirtschaftliche Einheit hält den Vertrag? | `KUNDE` |
| **Was** | Welches Objekt, welche Police? | `BOOT`, `VERTRAG` |
| **Wann und warum** | Was ist geschehen, was ist zu tun? | `AKTIVITAET`, `AUFGABE`, `LEAD` |

Der häufigste Modellfehler ist, die ersten beiden Achsen zusammenzuwerfen.
Dann kann ein Ehepaar keinen gemeinsamen Vertrag halten, und ein Händler kann
nicht gleichzeitig Partner und Kunde sein.

---

## 2. ER-Diagramm

### 2.1 Personen, Organisationen, Kunden

```
                            ┌─────────────────┐
                            │    MANDANT      │   AT · DE
                            └────────┬────────┘
                                     │ 1
                ┌────────────────────┼────────────────────┐
                │ N                  │ N                  │ N
       ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
       │    KONTAKT      │  │  ORGANISATION   │  │    BENUTZER     │
       │  nat. Person    │  │  jur. Person    │  │  Anmeldung      │
       │  ├ vergleichs-  │  │  ├ name         │  └─────────────────┘
       │  │  schluessel  │  │  ├ registernr.  │
       │  ├ kontaktsperre│  │  └ status       │
       │  └ anonymisiert │  └───┬─────────┬───┘
       └──┬───┬───┬───┬──┘      │ 1       │ 1
          │   │   │   │         │ N       │ N
          │   │   │   │   ┌─────▼──────┐  │
          │   │   │   │   │ORGANISATIONS│ │
          │   │   │   └───┤   ROLLE     │ │      HAENDLER · CLUB
          │   │   │   N:M │ HAENDLER    │ │      PARTNER · MAKLER
          │   │   │       │ CLUB        │ │      LIEFERANT
          │   │   │  (KONTAKT_          │ │      HERSTELLER
          │   │   │   ORGANISATION)     │ │      VERSICHERER
          │   │   │       │ PARTNER     │ │
          │   │   │       │ MAKLER      │ │
          │   │   │       │ HERSTELLER  │ │
          │   │   │       │ VERSICHERER │ │
          │   │   │       └──────┬──────┘ │
          │   │   │              │ 1      │
          │   │   │              │ 1      │
          │   │   │       ┌──────▼──────┐ │
          │   │   │       │ ROLLENPROFIL│ │  je Rolle eigene Felder:
          │   │   │       │             │ │  haendler · club · partner
          │   │   │       └─────────────┘ │  hersteller · versicherer
          │   │   │                       │
     ┌────▼──┐ │ ┌▼──────────┐            │
     │ADRESSE│ │ │KONTAKTWEG │◀───────────┘
     └───────┘ │ └───────────┘
               │ N
        ┌──────▼───────┐            ┌──────────────────┐
        │ EINWILLIGUNG │            │      KUNDE       │
        │ zweck        │            │ kundennummer     │
        │ rechtsgrund  │      N:M   │ art              │
        │ hinweis_vers.│  ┌─────────┤ betreuer         │
        │ widerrufen   │  │ (KUNDE_ │ customer_value   │
        └──────────────┘  │ KONTAKT)│ risk_score       │
                          │  Rollen:│ score_faktoren   │
        KONTAKT ──────────┘  VN     └────────┬─────────┘
                             MITVERS.        │ 1
                             BEVOLLM.        │ N
                             ZAHLER      ┌───▼────────┐
                                         │  VERTRAG   │
                                         └────────────┘
```

### 2.2 Objekte und Verträge

```
   ┌──────────────────┐                    ┌────────────────────┐
   │      KUNDE       │ 1              N   │      VERTRAG       │
   │                  ├────────────────────▶ vertragsnummer     │
   └────────┬─────────┘                    │ polizzennummer     │
            │ 1                            │ sparte             │
            │ N                            │ hauptfaelligkeit ──┼──▶ Verlängerungslauf
   ┌────────▼─────────┐                    │ status             │    90 Tage vorher
   │      BOOT        │                    └──┬──────┬───────┬──┘
   │ bootstyp         │                    1  │      │ 1     │ 1
   │ bauart           │         ┌─────────────▼┐   ┌─▼───────▼────────┐
   │ hersteller ──────┼───┐     │ VERTRAGS_    │   │ VERTRAGSVERSION  │
   │ baujahr          │   │     │ OBJEKT       │   │ unveränderlich   │
   │ rumpfmaterial    │   │     │ rolle:       │   │ version          │
   │ segelflaeche     │   │  N:M│  HAUPTOBJEKT │   │ anlass           │
   │ motorleistung_kW │   │◀────┤  BEIBOOT     │   │ praemie_netto    │
   │ nutzungsart      │   │     │  TRAILER     │   │ vst_satz         │
   │ fahrtgebiet      │   │     │  AUSSENBORDER│   │ sfr_stufe        │
   │ gesamtvers.summe │   │     │ gueltig_ab   │   │ zuschlaege_saldo │
   │ flaggenland      │   │     └──────────────┘   │ berechnungsprot. │
   │ veraeussert_am ──┼───┼──▶ Risiko + Rückgew.   └──┬────────────┬──┘
   └──────────────────┘   │                          │ 1          │ 1
                          │                          │ N          │ N
              ┌───────────▼──────────┐       ┌───────▼──────┐ ┌───▼────────┐
              │ ORGANISATION         │       │   DECKUNG    │ │  PRAEMIE   │
              │ Rolle HERSTELLER     │       │ code         │ │ zeitraum   │
              │ ist_premiumhersteller│       │ summe/SB     │ │ faellig_am │
              │        │             │       │ bedingungs-  │ │ status     │
              │        └─────────────┼──────▶│ werk → DOKU  │ └────────────┘
              └──────────────────────┘       └──────────────┘
                    steuert den
                    Tarifnachlass
```

### 2.3 Vertrieb, Nachweis, Steuerung

```
   ┌──────────────┐                     ┌────────────────┐
   │  KAMPAGNE    │ 1               N   │      LEAD      │
   │  (M3)        ├─────────────────────▶ leadnummer     │
   └──────────────┘   Attribution       │ quelle_detail  │
                                        │ utm_* (roh)    │
   ┌──────────────┐  0..1               │ lead_score     │
   │   KONTAKT    │◀────────────────────┤ score_faktoren │
   └──────────────┘  erst nach          │ indikation_*   │
                     Identifikation     │ erstkontakt_   │
   ┌──────────────┐  0..1               │  frist         │
   │ ORGANISATION │◀────────────────────┤ verlustgrund   │
   │ (empfehlend) │                     │ kunde_id ──────┼──▶ bei GEWONNEN
   └──────────────┘                     └───────┬────────┘
                                                │ 1
                                                │ N
   ┌──────────────┐  N            1     ┌───────▼────────┐  1        N ┌──────────┐
   │  BENUTZER    │◀────────────────────┤   AUFGABE      │◀────────────┤AKTIVITAET│
   │ zuständig    │                     │ bezug_typ/_id  │  Folge-     │ art      │
   └──────────────┘                     │ faellig_am     │  aufgabe    │ ergebnis │
                                        │ regel_code     │             │ ist_ber. │
                                        │ dubletten-     │             │  dokum.  │
                                        │  schluessel ⚷  │             └──────────┘
                                        │ eskalations-   │
                                        │  stufe         │             ┌──────────┐
                                        └───────▲────────┘             │  NOTIZ   │
                                                │ erzeugt              │ sicht-   │
                                    ┌───────────┴──────────┐           │  barkeit │
                                    │ AUTOMATISIERUNGSREGEL│           └──────────┘
                                    │ code A-01 … A-49     │
                                    │ ausloeser · bedingung│
                                    │ aktion               │
                                    └───────────┬──────────┘
                                                │ 1
                                                │ N
                                    ┌───────────▼──────────┐
                                    │  REGELAUSLOESUNG     │
                                    │ ergebnis             │
                                    │ unterdrueckungsgrund │
                                    └──────────────────────┘

   ┌──────────────┐ 1        N ┌─────────────────┐
   │  DOKUMENT    ├────────────▶ DOKUMENTVERSION │      ┌──────────────────┐
   │ typ          │            │ speicherschl.   │      │  AUDITEINTRAG    │
   │ zugriffskl.  │            │ sha256          │      │ entitaet_typ ────┼┐
   │ aufbewahrung │            │ scanstatus      │      │ entitaet_id      ││
   │ loeschdatum  │            │ signaturstatus  │      │ ergebnis         ││
   └──────────────┘            └─────────────────┘      └──────────────────┘│
                                                                            │
                                        kein Fremdschlüssel ────────────────┘
                                        bleibt gültig, auch wenn die
                                        Person anonymisiert wird
```

---

## 3. Beziehungstabelle

`RESTRICT` = Löschen wird verweigert · `CASCADE` = Kinder folgen ·
`SET NULL` = Verweis wird geleert.

| Von | Kardinalität | Nach | Bedeutung | Löschverhalten |
|---|---|---|---|---|
| Mandant | 1 : N | alle Kernentitäten | Trennungsgrenze | `RESTRICT` |
| Kontakt | 1 : N | Adresse, Kontaktweg | Erreichbarkeit | `CASCADE` bei Anonymisierung: Inhalte überschrieben |
| Kontakt | 1 : N | Einwilligung | Nachweis je Zweck | `RESTRICT` — der Nachweis überlebt |
| Kontakt | N : M | Kunde (`KUNDE_KONTAKT`) | Person gehört zur wirtschaftlichen Einheit | `RESTRICT` |
| Kontakt | N : M | Organisation (`KONTAKT_ORGANISATION`) | Ansprechpartner | `SET NULL` |
| Kontakt | 0..1 : N | Lead | Erst nach Identifikation | `SET NULL` |
| Organisation | 1 : N | Organisationsrolle | Händler, Club, Partner … | `CASCADE` |
| Organisationsrolle | 1 : 1 | Rollenprofil | Rollenspezifische Felder | `CASCADE` |
| Organisation | 1 : N | Adresse | Sitz, Filialen | `CASCADE` |
| Organisation (Rolle `HERSTELLER`) | 1 : N | Boot | Werft des Bootes | `SET NULL` |
| Organisation (Rolle `VERSICHERER`) | 1 : N | Vertrag | Risikoträger | `RESTRICT` |
| Organisation (Rolle `MAKLER`/`HAENDLER`) | 1 : N | Vertrag | Vermittler, Provisionsgrundlage | `SET NULL` |
| Organisation | 1 : N | Lead | Empfehlender Händler oder Club | `SET NULL` |
| Kunde | 1 : N | Vertrag | Bestand | `RESTRICT` |
| Kunde | 1 : N | Boot | Eigentum, zeitlich begrenzt | `SET NULL` bei Verkauf |
| Vertrag | 1 : N | Vertragsversion | Historie, unveränderlich | `CASCADE` |
| Vertrag | N : M | Boot (`VERTRAGSOBJEKT`) | Versicherte Objekte, mit Zeitbezug | `RESTRICT` |
| Vertragsversion | 1 : N | Deckung, Prämie | Bausteine und Zahlungszeiträume | `CASCADE` |
| Deckung | N : 1 | Dokument | Bedingungswerk | `SET NULL` |
| Vertrag | 0..1 : 1 | Vertrag (`vorgaenger_vertrag_id`) | Umdeckung, Trägerwechsel | `SET NULL` |
| Lead | 0..1 : 1 | Kunde | Bei `GEWONNEN` | `SET NULL` |
| Lead | N : 1 | Kampagne | Attribution | `SET NULL` |
| Aktivität | 1 : N | Aufgabe | Folgehandlung | `SET NULL` |
| Aufgabe | N : 1 | Benutzer | Zuständigkeit | `SET NULL` |
| Aufgabe | 0..1 : 1 | Aufgabe (`wiedervorlage_von_id`) | Verschiebung | `SET NULL` |
| Automatisierungsregel | 1 : N | Regelauslösung | Protokoll jeder Anwendung | `CASCADE` |
| Dokument | 1 : N | Dokumentversion | Fassungen | `RESTRICT` bei Aufbewahrungspflicht |
| Aufbewahrungsregel | 1 : N | Dokument | Bestimmt das Löschdatum | `RESTRICT` |
| Auditeintrag | — | — | **Kein Fremdschlüssel** | nie |

---

## 4. Die vom Auftrag genannten Beziehungen — konkret

| Gefordert | Umsetzung | Anmerkung |
|---|---|---|
| **Kunde → Boote** | `BOOT.eigentuemer_kunde_id` | 1:N, mit `eigentum_seit`. Wechselt beim Verkauf |
| **Kunde → Verträge** | `VERTRAG.kunde_id` | 1:N. `RESTRICT` — ein Kunde mit Vertrag wird nicht gelöscht |
| **Vertrag → Boot** | `VERTRAGSOBJEKT` | **N:M mit Zeitbezug**, nicht 1:1. Ein Vertrag deckt Boot + Beiboot + Trailer |
| **Händler → Kunde** | `KUNDE.vermittler_organisation_id` sowie `BOOT.erworben_bei_organisation_id` | Zwei verschiedene Beziehungen: wer betreut, und wo gekauft wurde |
| **Partner → Kunde** | über `LEAD.organisation_id` und `VERTRAG.vermittler_organisation_id` | Ein Partner „besitzt" keinen Kunden. Er hat ihn empfohlen oder vermittelt |
| **Lead → Kunde** | `LEAD.kunde_id`, gesetzt bei `GEWONNEN` | Der Lead bleibt erhalten — er ist der Beleg der Attribution |
| **Bootsclub → Kontakte** | über `KONTAKT_ORGANISATION` | **Nur Ansprechpartner, keine Mitgliederliste.** Die Mitgliedschaft ist ein Merkmal am Kontakt, nicht eine gespiegelte Liste |

> Die letzte Zeile ist eine bewusste Einschränkung. Eine Mitgliederdatei des
> Clubs zu spiegeln, wäre unnötiger Personenbezug (Prinzip P8) und
> datenschutzrechtlich heikel, weil der Club eigener Verantwortlicher ist.

---

## 5. Eindeutigkeit und Prüfbedingungen

| Regel | Umsetzung |
|---|---|
| Kundennummer eindeutig je Mandant | `UNIQUE (mandant_id, kundennummer)` |
| Vertragsnummer eindeutig je Mandant | `UNIQUE (mandant_id, vertragsnummer)` |
| Polizzennummer eindeutig je Versicherer | `UNIQUE (versicherer_organisation_id, polizzennummer)` — schützt gegen Doppelanlage |
| Vertragsversionen überschneidungsfrei | Ausschlussbedingung über `(vertrag_id, gueltig_ab..gueltig_bis)` |
| Genau eine Hauptadresse je Bezug und Art | Partieller eindeutiger Index |
| Genau ein Hauptkontaktweg je Art | Partieller eindeutiger Index |
| Ein Kontaktweg nicht doppelt | `UNIQUE (kontakt_id, art, wert)` |
| Aufgaben-Dublettenschlüssel eindeutig | `UNIQUE (dublettenschluessel)` — **die wichtigste Bedingung des Moduls** |
| Genau ein Versicherungsnehmer je Kunde | Prüfbedingung über `KUNDE_KONTAKT` |
| Vermittlerregistrierung bei Rolle `MAKLER` | Prüfbedingung: nicht leer, wenn `rolle = MAKLER` |
| `score_faktoren` gesetzt, sobald ein Score gesetzt ist | Prüfbedingung. Ein Score ohne Begründung ist nicht erklärbar |
| Kein Abruf vor sauberem Scan | Prüfbedingung an der Downloadfunktion, nicht nur in der Oberfläche |
| Anonymisierter Kontakt hat keine Kontaktwege mehr | Prüflauf nach der Anonymisierung |

---

## 6. Indizes, die nicht offensichtlich sind

Die Fremdschlüsselindizes sind selbstverständlich. Diese hier entstehen aus dem
tatsächlichen Zugriffsmuster.

| Index | Wofür |
|---|---|
| `VERTRAG (mandant_id, hauptfaelligkeit) WHERE status = 'AKTIV'` | Der Verlängerungslauf ist die häufigste Massenabfrage des Systems |
| `AUFGABE (zustaendig_benutzer_id, status, faellig_am)` | Die Tagesliste. Wird von jedem Benutzer mehrfach täglich geladen |
| `AUFGABE (dublettenschluessel)` | Eindeutig. Jede Regelauslösung prüft dagegen |
| `KONTAKT (vergleichsschluessel)` | Dublettenerkennung bei jedem neuen Lead |
| `LEAD (status, betreuer_id, erstkontakt_frist)` | Offene Leads mit ablaufender Frist |
| `BOOT (eigentuemer_kunde_id) WHERE status = 'AKTIV'` | Cross-Selling-Prüfung |
| `AKTIVITAET (bezug_typ, bezug_id, zeitpunkt DESC)` | Der Verlauf in der Kundenakte |
| `DOKUMENT (loeschdatum) WHERE geloescht_am IS NULL` | Der Aufbewahrungslauf |
| `AUDITEINTRAG (entitaet_typ, entitaet_id, zeitpunkt)` | Auskunftsanspruch |

---

## 7. Mandantentrennung

```
mandant_id in JEDER Kerntabelle
        │
        ├── Row Level Security in PostgreSQL:
        │   USING (mandant_id = current_setting('app.mandant_id')::uuid)
        │
        ├── gesetzt je Datenbankverbindung aus dem geprüften Zugriffstoken —
        │   nie aus einem Parameter des Aufrufs
        │
        └── Wirkung: Ein vergessener Filter in einer Abfrage kann keine
            mandantenfremden Daten liefern, weil die Datenbank sie nicht ausgibt
```

Mandanten in Welle 1: `AT` und `DE`. Sie unterscheiden sich in Rechtstexten,
verfügbaren Versicherern, Versicherungssteuersätzen und Produktschemata — nicht
in der Struktur.
