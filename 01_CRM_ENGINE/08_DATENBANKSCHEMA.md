# 8. Datenbankschema

Ausführbares DDL: [`schema/crm_schema.sql`](schema/crm_schema.sql)
(PostgreSQL ≥ 15, geprüft gegen PostgreSQL 16 — 43 Tabellen + 4 Partitionen,
6 Sichten, 135 Indizes, 184 Fremdschlüssel, 501 Prüfbedingungen).

## 8.1 Entitätsübersicht

```
                         ┌────────────────────┐
                         │ crm_organisation   │
                         └─────────┬──────────┘
                                   │ 1:n
┌────────────────┐  n:m   ┌────────▼───────────┐  1:n   ┌─────────────────┐
│  crm_kunde     │◀──────▶│   crm_kontakt      │───────▶│   crm_lead      │
│  (Account)     │ kunde_ │   (Person)         │        │   (Absicht)     │
└───┬──┬──┬──────┘ kontakt└────┬──────┬────────┘        └────────┬────────┘
    │  │  │                    │      │                          │
    │  │  │                    │      │ 1:n                      │ 1:1 (Konversion)
    │  │  │                    │      ▼                          ▼
    │  │  │                    │  ┌────────────┐        ┌─────────────────┐
    │  │  │                    │  │crm_consent │        │ crm_opportunity │
    │  │  │                    │  └────────────┘        └────┬───────┬────┘
    │  │  │                    │                             │ 1:n   │ 1:n
    │  │  │                    │                             ▼       ▼
    │  │  │                    │                    ┌───────────┐ ┌──────────────────┐
    │  │  │                    │                    │crm_angebot│ │crm_opportunity_  │
    │  │  │                    │                    └───────────┘ │position          │
    │  │  │                    │                                  └──────────────────┘
    │  │  │                    │
    │  │  │    ┌───────────────┴──────────────────────────────┐
    │  │  │    ▼                    ▼                         ▼
    │  │  │ ┌──────────────┐  ┌──────────────┐        ┌──────────────┐
    │  │  │ │crm_aktivitaet│  │  crm_aufgabe │        │  crm_signal  │
    │  │  │ └──────────────┘  └──────────────┘        └──────────────┘
    │  │  │        ▲ 1:1 erzeugte_aufgabe/-aktivitaet
    │  │  │
    │  │  └──────▶ crm_empfehlung ──────▶ crm_lead (erzeugter_lead_id)
    │  │                 ▲
    │  │                 │ Geber
    │  └──────▶ crm_partner ◀──── crm_partner_beziehung ────▶ crm_kunde / crm_boot_ref
    │
    └──────▶ READ-MODELS: crm_boot_ref · crm_vertrag_ref · crm_schaden_ref · crm_dokument_ref
```

## 8.2 Tabellenverzeichnis

| Gruppe | Tabelle | Zweck | Wichtigste Fremdschlüssel |
|---|---|---|---|
| **Plattform** | `crm_mandant_ref` | Mandantenprojektion | – |
| | `crm_benutzer_ref` | Benutzerprojektion (IAM) | `mandant_id`, `vertretung_id` |
| | `crm_team`, `crm_team_mitglied` | Teamstruktur | `leiter_id`, `benutzer_id` |
| | `crm_gebiet` | Vertriebsgebiet / Zuweisungsregeln | `verantwortlicher_id`, `team_id` |
| **Kataloge** | `crm_status_definition` | Fachlich pflegbare Statuskataloge | `mandant_id` |
| | `crm_produkt` | Produktkatalog (Sparten) | `mandant_id` |
| | `crm_lead_quelle` | Leadquellen | `partner_id` |
| | `crm_lead_quelle_kosten` | Monatskosten je Quelle | `quelle_id` |
| | `crm_kampagne` | Kampagnen (Brevo/Meta/LinkedIn) | `quelle_id` |
| **Kern** | `crm_organisation` | Firma / Verein | `mandant_id` |
| | `crm_kontakt` | Person, Lebenszyklus, Rollen | `organisation_id`, `verantwortlicher_id`, `gebiet_id`, `dublette_von_id` |
| | `crm_consent` | DSGVO-Einwilligungen (historisiert) | `kontakt_id` |
| | `crm_kunde` | Account, Wirtschaft, Scores | `organisation_id`, `haupt_kontakt_id`, `betreuer_id` |
| | `crm_kunde_kontakt` | n:m Kunde↔Kontakt mit Rolle | `kunde_id`, `kontakt_id` |
| | `crm_lifecycle_historie` | Alle Stufenwechsel | `kontakt_id`, `kunde_id` |
| **Read-Models** | `crm_boot_ref` | Objekte aus dem Objektmodul | `kunde_id`, `liegeplatz_partner_id` |
| | `crm_vertrag_ref` | Policen aus dem Vertragsmodul | `kunde_id`, `boot_ref_id` |
| | `crm_schaden_ref` | Schäden aus dem Schadenmodul | `kunde_id`, `vertrag_ref_id` |
| | `crm_dokument_ref` | Dokumentenreferenzen | `kunde_id`, `kontakt_id` |
| **Vertrieb** | `crm_lead` | Lead inkl. Score & SLA | `kontakt_id`, `quelle_id`, `empfehlung_id`, `boot_ref_id` |
| | `crm_lead_attribution` | First/Last/Multi-Touch | `lead_id`, `quelle_id` |
| | `crm_opportunity` | Verkaufschance | `kunde_id`, `kontakt_id`, `lead_id`, `boot_ref_id` |
| | `crm_opportunity_position` | Produktpositionen | `opportunity_id`, `produkt_id` |
| | `crm_opportunity_stufen_historie` | Pipeline-Verlauf | `opportunity_id` |
| | `crm_angebot` | Angebotsvarianten inkl. Tracking | `opportunity_id`, `dokument_ref_id` |
| **Interaktion** | `crm_aktivitaet` | Jede Interaktion mit Ergebnis+Folge | 8 optionale Bezüge |
| | `crm_aufgabe` | Handlungsanweisung | `zugewiesen_an`, polymorpher Bezug |
| | `crm_wiedervorlage_regel` | Regelwerk W-01…W-16 | `mandant_id` |
| **Netzwerk** | `crm_partner` | Werft, Marina, Händler, Club | `organisation_id`, `betreuer_id` |
| | `crm_partner_beziehung` | Partner↔Kunde/Boot | `partner_id`, `kunde_id`, `boot_ref_id` |
| | `crm_empfehlung` | Empfehlungsvorgang | 3 Geber-FKs, `erzeugter_lead_id` |
| **Signale/Scoring** | `crm_signal_typ` | Signalkatalog mit Gewichten | `mandant_id` |
| | `crm_signal` | Rohsignale (**partitioniert je Quartal**) | `kontakt_id`, `signal_typ_id` |
| | `crm_signal_muster` | Erkannte Muster M1–M8 | `kontakt_id`, `kunde_id` |
| | `crm_score_lead_historie` | Score-Verlauf je Lead | `lead_id` |
| | `crm_kunde_score` | CVS aktuell mit Blockdetails | `kunde_id` |
| | `crm_kunde_score_historie` | Monatliche Snapshots | `kunde_id` |
| | `crm_churn_bewertung` | Risikobewertung mit Treibern | `kunde_id`, `erzeugte_aufgabe_id` |
| | `crm_nbo_vorschlag` | Next Best Offer | `kunde_id`, `produkt_id`, `opportunity_id` |
| **Automatisierung** | `crm_automation_regel` | Regelkatalog A-01…A-42 | `mandant_id` |
| | `crm_automation_lauf` | Ausführungsprotokoll | `regel_id` |
| | `crm_audit_log` | Revisionssicheres Änderungsprotokoll | – |

## 8.3 Zentrale Integritätsregeln (in der Datenbank erzwungen)

Diese Prüfbedingungen sind der technische Kern der Mission — sie machen die
fachlichen Grundsätze **unumgehbar**, auch bei Zugriff außerhalb der Anwendung:

| Constraint | Regel | Fachlicher Grundsatz |
|---|---|---|
| `crm_akt_folgeaktion_datum` | Folgeaktion ≠ `keine` ⇒ `folgeaktion_am` Pflicht | Kein Lead bleibt liegen |
| `crm_akt_ergebnis_notiz` | Ergebnis `einwand`/`absage` ⇒ Notiz Pflicht | Verlust ist auswertbar |
| `crm_akt_bezug` | Aktivität ohne Bezug unmöglich | Keine verwaisten Daten |
| `crm_lead_disq_grund` | Status `disqualifiziert` ⇒ Grund Pflicht | Quellenbewertung bleibt valide |
| `crm_opp_verlustgrund` | Stufe `verloren` ⇒ Verlustgrund Pflicht | Lernschleife |
| `crm_opp_gewinngrund` | Stufe `gewonnen` ⇒ Gewinngrund Pflicht | Erfolgsmuster erkennen |
| `crm_opp_pausiert` | Stufe `pausiert` ⇒ `pausiert_bis` Pflicht | Nichts verschwindet still |
| `crm_aufgabe_abschluss` | Abschluss ⇒ Ergebnis Pflicht | Wirkung messbar |
| `crm_aufgabe_verworfen_grund` | `verworfen` ⇒ Begründung Pflicht | Regelqualität messbar |
| `idx_aufgabe_dedup` (unique) | Max. **eine** offene Automatikaufgabe je (Bezug, Typ, Regel) | Kein Aufgaben-Spam |
| `crm_empf_lead` | Empfehlung ab Status `kontaktiert` ⇒ Lead Pflicht | Jede Empfehlung wird zum Lead |
| `crm_empf_geber` | Mindestens ein Geber gesetzt | Empfehlung ist zurechenbar |
| `crm_kontakt_erreichbarkeit` | Kontakt braucht Kanal (außer Stufe S0) | Kontaktierbarkeit gesichert |
| `crm_opp_bezug` | Opportunity braucht Kunde oder Kontakt | Zuordenbarkeit |

## 8.4 Indexstrategie

| Zweck | Index | Begründung |
|---|---|---|
| **Tagesliste** | `idx_aufgabe_tagesliste` (partial, `zugewiesen_an, status, prioritaets_score DESC, faellig_am`) | Häufigste Query des Systems — muss < 20 ms liefern |
| **Heiße Leads** | `idx_lead_offen` (partial, Kategorie + Score DESC) | Dashboard-Kachel |
| **SLA-Wächter** | `idx_lead_sla` (partial `WHERE erstkontakt_am IS NULL`) | Nachtjob prüft nur offene SLAs |
| **Forecast** | `idx_opp_forecast` | Aggregation nach Monat und Wahrscheinlichkeit |
| **Stillstand** | `idx_opp_stillstand` (`stufe_seit`) | A-15 Eskalation |
| **Hauptfälligkeiten** | `idx_vertrag_hauptfaelligkeit` (partial `status='aktiv'`) | W-03 Staffel |
| **Dublettensuche** | `idx_kontakt_name_trgm` (GIN/trigram) | Fuzzy-Match bei Leadeingang |
| **Signalauflösung** | `idx_kontakt_tracking` (GIN auf `text[]`) | Cookie → Kontakt |
| **Geburtstage** | Funktionsindex auf (Monat, Tag) | W-05 ohne Full Scan |
| **Volltext** | `idx_akt_volltext` (GIN, `to_tsvector('german', …)`) | Suche in Gesprächsnotizen |
| **Rollen** | `idx_kontakt_rollen` (GIN auf `text[]`) | VIP-/Empfehlungsgeber-Filter |
| **Dedup** | `idx_aufgabe_dedup` (partial unique) | Duplikatschutz als Datenbankregel |

**Partitionierung:** `crm_signal` ist die einzige Tabelle mit sehr hohem Volumen
(erwartet 10⁶–10⁷ Zeilen/Jahr). Sie wird nach Quartal range-partitioniert.
Vorteile: schnelles Löschen alter Partitionen (DSGVO-Aufbewahrung 24 Monate =
`DROP PARTITION` statt `DELETE`), Partition Pruning bei Zeitfensterabfragen.

## 8.5 Mandantentrennung

Row Level Security auf allen 16 fachlichen Tabellen. Die Anwendung setzt je Sitzung:

```sql
SET app.mandant_id = '…uuid…';
```

Die Policy `mandant_id = crm_fn_aktueller_mandant()` gilt für Lesen **und** Schreiben
(`USING` + `WITH CHECK`). Ein fehlender Sitzungsparameter liefert `NULL` und damit
**keine** Zeilen — Fail-Closed statt Fail-Open.

## 8.6 Historisierung

| Objekt | Verfahren |
|---|---|
| Lebenszyklus | `crm_lifecycle_historie` (jeder Wechsel, mit Verweildauer) |
| Pipeline | `crm_opportunity_stufen_historie` (inkl. Wahrscheinlichkeit vorher/nachher) |
| Lead Score | `crm_score_lead_historie` (jede Neuberechnung mit Erklärung + Modellversion) |
| Customer Value | `crm_kunde_score_historie` (Monatsstichtag) |
| Churn | `crm_churn_bewertung` (jede Bewertung, append-only) |
| Einwilligungen | `crm_consent` append-only — **niemals** UPDATE, nur neue Zeile |
| Alles Übrige | `crm_audit_log` (Insert/Update/Delete/sensibles Lesen/Export) |

## 8.7 Datenlebenszyklus und Löschkonzept

| Datenart | Aufbewahrung | Mechanik |
|---|---|---|
| Rohsignale (`crm_signal`) | 24 Monate | Partition-Drop |
| Anonyme Tracking-IDs ohne Auflösung | 90 Tage | Nachtjob |
| Leads ohne Konversion | 36 Monate nach letzter Aktivität | Anonymisierung (Pseudonymisierung der Person, Kennzahlen bleiben) |
| Kundendaten | Gesetzliche Aufbewahrung (VVG/HGB/AO, i. d. R. 10 Jahre nach Vertragsende) | Sperrung statt Löschung |
| Aktivitäten | Wie Bezugsobjekt | kaskadierend |
| Audit-Log | 10 Jahre | Archivpartition |
| Widerspruch (Art. 21 DSGVO) | Sofortige Sperre, Rohsignale binnen 72 h gelöscht | Ereignisgesteuert |

**Anonymisierung statt Löschung:** Bei Verjährung werden personenbezogene Felder
überschrieben, aber Score, Quelle, Verlustgrund und Wert bleiben erhalten —
so bleibt die Vertriebsstatistik über Jahre valide, ohne Personenbezug.
