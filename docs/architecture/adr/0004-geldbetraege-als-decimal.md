# ADR-0004 — Geldbeträge als Decimal mit Währung

**Status:** angenommen · 2026-08-21

## Entscheidung

Geldbeträge werden als `Decimal(14,2)` in PostgreSQL gespeichert, in TypeScript
als `Decimal`-Objekt beziehungsweise `string` transportiert und **immer**
zusammen mit einem ISO-4217-Währungscode geführt.

## Begründung

Prämien sind rechtlich verbindliche Beträge. IEEE-754-Gleitkomma erzeugt
Rundungsfehler, die bei Vergleichen gegen Callidus-Angaben zu falschen
Prüfergebnissen führen.

## Konsequenzen

- `number` ist für Geldbeträge in der gesamten Codebasis unzulässig; eine Lint-Regel und ein Unit-Test überwachen dies.
- Toleranzvergleiche in Prüfregeln arbeiten mit Decimal-Arithmetik.
- An der API-Grenze werden Beträge als String serialisiert, um Präzisionsverlust in JSON zu vermeiden.
