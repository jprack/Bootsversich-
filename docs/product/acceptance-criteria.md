# Abnahmekriterien

## Teil 1 — Technische Abnahmefähigkeit des MVP

Jedes Kriterium ist objektiv prüfbar. „Erfüllt" bedeutet: durch einen Befehl,
einen Test oder ein Dokument belegbar.

| # | Kriterium | Nachweis | Status |
|---|---|---|---|
| 1 | Lokale Installation über dokumentierte Befehle funktioniert. | `docs/operations/local-setup.md`, `pnpm dev` | offen |
| 2 | Datenbankmigrationen sind reproduzierbar. | `pnpm db:migrate` auf leerer DB | offen |
| 3 | Synthetische Seed-Daten sind verfügbar. | `pnpm db:seed` | offen |
| 4 | Website, Kundenportal und Agentenportal funktionieren. | E2E-Tests | offen |
| 5 | Ein vollständiger Vorgang lässt sich mit `MockCallidusAdapter` abschließen. | E2E `happy-path` | offen |
| 6 | Ein manueller Callidus-Fallback ist vorhanden. | `ManualCallidusAdapter` + E2E | offen |
| 7 | Keine unverifizierte Callidus-API wird verwendet. | `RealCallidusAdapter` deaktiviert, Test erzwingt Fehler | offen |
| 8 | Statusübergänge sind serverseitig geschützt. | Unit-Tests der Statusmaschine, kein generischer Status-Endpunkt | offen |
| 9 | Rollen und Objektberechtigungen sind getestet. | Integrationstests je Rolle, IDOR-Tests | offen |
| 10 | Dokumentzugriffe sind geschützt und auditiert. | Test: fremder Download → 404/403 + Audit-Eintrag | offen |
| 11 | Signaturstatus wird idempotent verarbeitet. | Test: doppeltes Webhook-Ereignis → ein Zustandswechsel | offen |
| 12 | Erinnerungen erzeugen keine Duplikate. | Test: zweifacher Job-Lauf → eine Kommunikation | offen |
| 13 | Angebot und Kundendaten werden regelbasiert geprüft. | `ValidationResult` je Regel mit Begründung | offen |
| 14 | Kritische Fehler erzeugen eine menschliche Aufgabe. | Test: `fail` → `Task` + `MANUAL_REVIEW_REQUIRED` | offen |
| 15 | Datenschutz- und Löschprozesse sind dokumentiert. | `docs/compliance/` | offen |
| 16 | Backup und Restore sind dokumentiert und testbar. | `docs/operations/backup-restore.md` | offen |
| 17 | Keine Secrets und keine echten Kundendaten im Repository. | Secret-Scan in CI, `.env.example` ohne Werte | offen |
| 18 | Linting, Type Checking, Tests und Build laufen erfolgreich. | CI grün | offen |
| 19 | OpenAPI-Dokumentation ist aktuell. | Generierung in CI, Abweichung bricht den Build | offen |
| 20 | Bekannte Einschränkungen sind transparent dokumentiert. | `docs/product/non-goals.md`, `docs/callidus/open-items.md` | offen |

## Teil 2 — Zusätzliche Voraussetzungen für den Produktivbetrieb

Diese Punkte sind **nicht** durch Programmierung erfüllbar.

| # | Voraussetzung | Verantwortung |
|---|---|---|
| 21 | Verifizierte Callidus-Schnittstelle **oder** schriftlich freigegebener manueller Prozess | Produktverantwortung / Callidus |
| 22 | Datenschutzprüfung (inkl. Verzeichnis von Verarbeitungstätigkeiten, ggf. DSFA) | Datenschutzbeauftragte Person |
| 23 | Rechtliche Prüfung (Gewerberecht AT/DE, Erstinformation, Beratungsprotokoll) | Rechtsberatung |
| 24 | Penetrationstest | externer Dienstleister |
| 25 | Auswahl und Prüfung des Hostingstandorts (EU/EWR) | Produktverantwortung |
| 26 | Auftragsverarbeitungsverträge mit allen Dienstleistern | Produktverantwortung |
| 27 | Durchgeführter Backup-Restore-Test | Betrieb |
| 28 | Freigegebener Incident-Response-Prozess | Betrieb + Datenschutz |
| 29 | Auswahl und Prüfung des realen Signaturanbieters inkl. Signaturstufe | Produktverantwortung + Rechtsberatung |
| 30 | Fachliche Abnahme durch den Versicherungsagenten | Versicherungsagent |
