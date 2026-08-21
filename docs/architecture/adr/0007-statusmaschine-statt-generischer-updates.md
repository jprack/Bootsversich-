# ADR-0007 — Benannte Statusübergänge statt generischer Update-Endpunkte

**Status:** angenommen · 2026-08-21

## Entscheidung
Der Status eines `InsuranceCase` ist über keinen generischen Endpunkt
schreibbar. Jeder Übergang ist eine benannte Operation mit eigener
Berechtigung, eigenen Vorbedingungen, eigenen Nebenwirkungen und eigenem
Audit-Ereignis.

## Begründung
Ein generischer `PATCH` mit `status` verlagert die Regeln in den Client und ist
weder prüfbar noch absicherbar.

## Konsequenzen
- Die Übergangstabelle liegt als Datenstruktur in `@app/shared-types` und ist ohne Datenbank testbar.
- Jeder neue Übergang erfordert einen Eintrag in der Tabelle **und** einen Test — sonst ist er nicht ausführbar.
- Übergänge sind idempotent gestaltet: ein wiederholter Aufruf im Zielzustand ist ein No-Op mit Hinweis, kein Fehler.
