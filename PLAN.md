# PLAN — Versicherungs-CRM mit Callidus-Adaptergrenze

Stand: 2026-08-21 · Branch `claude/callidus-crm-engine-design-6ucfx8`

---

## Erledigt

| # | Ergebnis | Nachweis |
|---|---|---|
| 0.1 | Repository analysiert, Bestandsmodul `01_CRM_ENGINE` als unverändert erhalten festgelegt | `docs/callidus/decision-log.md` CD-006 |
| 0.2 | Callidus-Discovery-Gate angelegt (Capability Matrix, Fragebogen, Mapping, offene Punkte, manueller Fallback, Entscheidungsprotokoll) | `docs/callidus/` |
| 0.3 | Produktumfang, Annahmen, Nicht-Ziele, Abnahmekriterien dokumentiert | `docs/product/` |
| 0.4 | Architektur dokumentiert: Systemkontext, Container, Domänenmodell, Sicherheitsmodell, 7 ADRs | `docs/architecture/` |

---

## Aktuell

**Slice 1 — Projektgrundlage, lokale Infrastruktur, CI-Prüfungen**

| Aufgabe | Status |
|---|---|
| pnpm-Workspace + Turborepo | offen |
| TypeScript strict, ESLint, Prettier, Vitest | offen |
| Docker Compose: PostgreSQL, Redis, MinIO, Mailpit, Keycloak, ClamAV | offen |
| `@app/config` mit validierter Umgebungskonfiguration | offen |
| `apps/api` NestJS-Grundgerüst mit Health/Readiness | offen |
| `apps/web` Next.js-Grundgerüst | offen |
| `apps/worker` BullMQ-Grundgerüst | offen |
| Prisma-Grundschema + erste Migration | offen |
| CI: Lint, Typecheck, Test, Build, Secret-Scan | offen |
| `docs/operations/local-setup.md` | offen |

---

## Als Nächstes

| Slice | Inhalt | Abhängig von |
|---|---|---|
| 2 | Identity, Rollen, Berechtigungen; serverseitige Guards; Audit-Grundlage | 1 |
| 3 | Kunden, Adressen, Kontaktwege, Einwilligungen, Leads, Vorgänge, Statusmaschine | 2 |
| 4 | Produktdefinitionen, versionierte Schemata, dynamische Formulare, öffentliche Anfrage | 3 |
| 5 | `MockCallidusAdapter`, Angebotsanfrage, Übertragungsprotokoll | 4 |
| 6 | Angebotsimport, deterministische Prüfregeln, `ValidationRun`/`ValidationResult` | 5 |
| 7 | Agentenfreigabe, Kundenportal | 6 |
| 8 | Dokumente, Prüfsummen, Malware-Scan, signierte Downloads | 7 |
| 9 | `MockSignatureProvider`, idempotente Ereignisverarbeitung, Rücklaufkontrolle | 8 |
| 10 | `ManualCallidusAdapter`, Exportpaket, Übergabeprozess | 9 |
| 11 | Aufgaben, Erinnerungen (3/7/14/21 Tage), Eskalationen | 10 |
| 12 | Audit-Ansicht, Datenschutzprozesse, Betriebshandbuch, Runbooks | 11 |

---

## Blockiert

| Was | Wodurch | Umgehung im MVP |
|---|---|---|
| `RealCallidusAdapter` | O-02…O-05: keine verifizierte Quelle | Mock- und Manuell-Adapter |
| Realer Signaturanbieter | O-08: Anbieter nicht ausgewählt | `MockSignatureProvider`, `ManualSignatureProvider` |
| Produktive Datenübermittlung an Callidus | O-07: AVV und Datenstandort ungeklärt | ausschließlich synthetische Daten |
| Portalautomatisierung | O-06: keine schriftliche Erlaubnis | untersagt, kein Code |
| Aussage zur DSGVO-Konformität | Prüfung ausstehend | Checkliste mit offenen Freigaben |

---

## Risiken

| ID | Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|---|
| R-01 | Callidus liefert nie eine API | manueller Betrieb dauerhaft | Manueller Adapter ist vollwertig und auditiert, nicht Notbehelf |
| R-02 | Produktpflichtfelder weichen stark ab | Formulare müssen neu geschnitten werden | Datengetriebene, versionierte `ProductSchema` statt Code |
| R-03 | Namenskonflikt „Callidus" (O-01) | Umbenennung von Paketen und Tabellen | Bedeutung in ADR-0002 fixiert, Umbenennung wäre mechanisch |
| R-04 | Signaturstufe genügt rechtlich nicht | Anträge nicht rechtswirksam | Keine Stufenbehauptung; `assuranceLevel = UNDETERMINED` |
| R-05 | Personenbezogene Daten in Logs oder Telemetrie | Datenschutzverstoß | Maskierung, Verbotsliste, Test gegen Log-Ausgabe |
| R-06 | Doppelte Einreichung bei Callidus | Doppelvertrag beim Kunden | Idempotenzschlüssel + eindeutiger Index auf Übertragungen |
| R-07 | Angebot wird nach Änderung signiert | Signatur auf veralteter Fassung | Signatur bindet an `DocumentVersion`, Prüfregel erzwingt Aktualität |
| R-08 | Scope-Ausweitung Richtung Schaden/Provision | MVP wird nicht fertig | `non-goals.md` ist verbindlich |

---

## Entscheidungen

Siehe `docs/architecture/adr/` (ADR-0001 … ADR-0007) und
`docs/callidus/decision-log.md` (CD-001 … CD-006).

---

## Teststatus

| Ebene | Umfang | Status |
|---|---|---|
| Unit | Statusmaschine, Prüfregeln, Berechtigungen, Geld, Datum, Mapping, Dedupe, Adapter | nicht begonnen |
| Integration | PostgreSQL, Object Storage, Queue, E-Mail, Callidus-Mock, Signatur-Mock | nicht begonnen |
| E2E | Happy Path + 11 Fehlerfälle | nicht begonnen |
