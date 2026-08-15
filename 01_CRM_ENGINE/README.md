# 01_CRM_ENGINE

**Callidus Boat Intelligence Platform — Modul 01: CRM Engine**

| Feld | Wert |
|---|---|
| Modul-ID | `01_CRM_ENGINE` |
| Modultyp | Kernmodul (Relationship & Revenue Operating System) |
| Version | 1.0.0 |
| Status | Zielarchitektur / Design Freeze Kandidat |
| Fachliche Verantwortung | Vertrieb / Kundenmanagement |
| Abhängigkeiten | `00_MASTER_SYSTEM` (Regeln, Konventionen, Plattformdienste) |
| Sprache Fachmodell | Deutsch |
| Sprache Technik (Tabellen, Felder, API) | Deutsch, `snake_case` |

---

## 0. Wichtiger Hinweis zum Master System

Zum Zeitpunkt der Erstellung dieses Moduls existiert im Repository **kein Verzeichnis
`00_MASTER_SYSTEM`** (das Repository war leer). Damit dieses Modul trotzdem
anschlussfähig, prüfbar und nicht widersprüchlich ist, gilt:

1. Alle Regeln, die dieses Modul aus dem Master System übernimmt, sind in
   Kapitel 1 dieses Dokuments **explizit als erwarteter Vertrag** ausformuliert.
2. Sobald `00_MASTER_SYSTEM` vorliegt, ist ausschließlich Kapitel 1 abzugleichen.
   Weicht das Master System ab, gewinnt das Master System — die Anpassung
   beschränkt sich dann auf Kapitel 1 sowie auf die davon abgeleiteten
   technischen Artefakte (`schema/`, `api/`).
3. **Es wurde kein anderes Modul angelegt oder verändert.** Fremde Domänen
   (Boot, Vertrag, Schaden, Dokument, Academy, Marketplace, Partnerportal)
   werden hier ausschließlich *referenziert* und als *Read-Model* gespiegelt,
   niemals besessen.

---

## 1. Erwarteter Vertrag mit `00_MASTER_SYSTEM`

### 1.1 Plattformprinzipien (übernommen)

| Nr. | Prinzip | Auswirkung auf das CRM |
|---|---|---|
| P1 | **Signal vor Datensatz** | Jede Zustandsänderung erzeugt ein Event auf dem Plattform-Event-Bus. |
| P2 | **Jedes Modul besitzt genau eine Domäne** | Das CRM besitzt Beziehung, Vertrieb, Aufgabe. Nicht: Police, Schaden, Boot. |
| P3 | **Keine stillen Daten** | Ein Datum ohne Auswertung, Regel oder Aufgabe wird nicht erhoben. |
| P4 | **Entscheidung ist erklärbar** | Jeder Score liefert Begründung (Top-Faktoren), jede Automatisierung liefert Audit-Eintrag. |
| P5 | **Mandantenfähigkeit** | Jede Tabelle trägt `mandant_id`, jede Query ist mandantengefiltert (RLS). |
| P6 | **DSGVO by Design** | Einwilligung, Zweckbindung, Löschfristen, Auskunftsfähigkeit sind Modellbestandteil. |
| P7 | **Mobile First im Vertrieb** | Jede Vertriebsansicht ist auf dem Telefon vollständig bedienbar. |
| P8 | **Kein Modul ohne KPI** | Jedes Feature ist an mindestens eine Kennzahl gebunden. |

### 1.2 Technische Konventionen (übernommen)

| Thema | Festlegung |
|---|---|
| Datenbank | PostgreSQL ≥ 15 |
| Primärschlüssel | `uuid` (UUIDv7-fähig), Spaltenname `id` |
| Tabellenpräfix dieses Moduls | `crm_` |
| Read-Model fremder Module | Suffix `_ref` (z. B. `crm_boot_ref`) |
| Zeitstempel | `timestamptz`, UTC, Spalten `erstellt_am`, `geaendert_am` |
| Herkunft | `erstellt_von`, `geaendert_von` (uuid → Benutzer) |
| Löschung | Soft Delete via `geloescht_am timestamptz NULL` |
| Freiformdaten | `jsonb`, immer mit dokumentiertem Schlüsselvertrag |
| Enums | Katalogtabellen (`crm_status_definition`) statt DB-Enums, wo fachlich pflegbar |
| API | REST/JSON, Basis `/api/v1/crm`, OAuth2 / OIDC, Idempotenzschlüssel bei Schreibzugriff |
| Events | `crm.<aggregat>.<ereignis>` (z. B. `crm.lead.qualifiziert`) |
| Zeitzone Fachlogik | `Europe/Berlin` |
| Währung | EUR, Speicherung in `numeric(14,2)` |

### 1.3 Externe Modulschnittstellen (nur konsumiert)

| Rolle | Erwartetes Modul | CRM-Nutzung |
|---|---|---|
| Boots-/Objektdaten | Objektmodul | Read-Model `crm_boot_ref` |
| Vertrag / Police / Prämie | Vertragsmodul | Read-Model `crm_vertrag_ref` |
| Schaden | Schadenmodul | Read-Model `crm_schaden_ref` |
| Dokumente | Dokumentenmodul | Referenz `crm_dokument_ref` |
| Marketing / Newsletter | Brevo-Konnektor | Signale + Kampagnenrückschreibung |
| Partnerportal | Partnermodul | Partnerkontakte, Empfehlungen |
| Academy | Academy-Modul | Signale (Kursbesuch, Zertifikat) |
| Marketplace | Marketplace-Modul | Signale (Inserat, Anfrage, Kauf) |
| Identität | Plattform-IAM | Benutzer, Rollen, Teams |

> Die finalen Modulnummern dieser Partner werden aus `00_MASTER_SYSTEM` übernommen.
> Das CRM adressiert sie ausschließlich über logische Namen und Event-Topics.

---

## 2. Struktur dieses Moduls

| Datei | Ergebnis-Nr. | Inhalt |
|---|---|---|
| [`01_ZIELBILD.md`](01_ZIELBILD.md) | 1 | Zielbild CRM, Architekturprinzip, Wirkkette |
| [`02_CUSTOMER_JOURNEY.md`](02_CUSTOMER_JOURNEY.md) | 2 | Lebenszyklus, Stufen, Ein-/Austritt, KPIs |
| [`03_LEADMODELL.md`](03_LEADMODELL.md) | 3 | Leadverwaltung, Quellen, Lead Score, Buying Signals |
| [`04_KUNDENMODELL.md`](04_KUNDENMODELL.md) | 4 | 360°-Kundenakte, Customer Value Engine, Kündigungsrisiko, Empfehlungen, Partner |
| [`05_OPPORTUNITY_MODELL.md`](05_OPPORTUNITY_MODELL.md) | 5 | Opportunity, Pipeline, Forecast, Angebot |
| [`06_AKTIVITAETENMODELL.md`](06_AKTIVITAETENMODELL.md) | 6 | Aktivitätentypen, Pflichtfelder, Ergebnis-/Folgelogik |
| [`07_AUFGABENMODELL.md`](07_AUFGABENMODELL.md) | 7 | Aufgabenlogik, Wiedervorlagen, Priorisierung, SLA |
| [`08_DATENBANKSCHEMA.md`](08_DATENBANKSCHEMA.md) | 8 | Tabellen, Felder, Beziehungen, Indizes |
| [`09_APIS.md`](09_APIS.md) | 9 | API-Konzept, Endpunkte, Events, Webhooks |
| [`10_AUTOMATISIERUNGEN.md`](10_AUTOMATISIERUNGEN.md) | 10 | Regelkatalog A-01 … A-42 |
| [`11_DASHBOARDS.md`](11_DASHBOARDS.md) | 11 | Vertriebs-, CRM- und Management-Dashboard, Reporting |
| [`12_KPIS.md`](12_KPIS.md) | 12 | Kennzahlendefinitionen, Formeln, Zielwerte |
| [`13_ROADMAP.md`](13_ROADMAP.md) | 13 | Phasen, Lieferobjekte, Abnahmekriterien |
| [`14_UX_KONZEPT.md`](14_UX_KONZEPT.md) | 14 | Screens, Interaktion, Mobile, Barrierefreiheit |
| [`schema/crm_schema.sql`](schema/crm_schema.sql) | 8 | Ausführbares PostgreSQL-DDL: Tabellen, Sichten, Indizes, RLS |
| [`schema/crm_engine.sql`](schema/crm_engine.sql) | 3–10 | Ausführbare Engine, Fassung 1.3: Scoring, Mustererkennung, Regelwerk, Lastschutz, Regelkatalog |
| [`api/openapi_crm.yaml`](api/openapi_crm.yaml) | 9 | OpenAPI 3.1 Spezifikation |
| [`demo/`](demo/README.md) | — | Lauffähige Demo mit Engine, Demobestand und Testsuite (`run_demo.sh`) |

**Empfohlene Lesereihenfolge:** 01 → 02 → 03 → 05 → 07 → 10 → 08 → 09 → 11 → 13.

---

## 3. Glossar (verbindlich)

| Begriff | Definition |
|---|---|
| **Kontakt** | Natürliche Person. Zentrale Identität im CRM, unabhängig von der Lebenszyklusstufe. |
| **Lead** | Vertriebliche Absicht eines Kontakts zu einem Bedarf. Ein Kontakt kann mehrere Leads haben. |
| **Kunde (Account)** | Wirtschaftliche Einheit mit mindestens einem aktiven oder historischen Vertrag. |
| **Opportunity** | Konkrete, bewertbare Verkaufschance mit Wert, Wahrscheinlichkeit und Termin. |
| **Aktivität** | Dokumentierte Interaktion mit Zeitstempel, Ergebnis und Folgeaktion. |
| **Aufgabe** | Verbindliche, terminierte Handlungsanweisung an eine Person. |
| **Wiedervorlage** | Zeitgesteuert erzeugte Aufgabe aus einer Regel. |
| **Signal** | Maschinell erfasstes Verhalten (Klick, Besuch, Download, Öffnung, Anmeldung). |
| **Lead Score** | 0–100, Kaufwahrscheinlichkeit und Attraktivität eines Leads. |
| **Customer Value Score (CVS)** | 0–100, wirtschaftlicher und strategischer Wert eines Kunden. |
| **Risk Score (Churn)** | 0–100, Kündigungs-/Abwanderungsrisiko. |
| **Next Best Action (NBA)** | Systemseitig priorisierte nächstbeste Handlung je Benutzer und Tag. |
