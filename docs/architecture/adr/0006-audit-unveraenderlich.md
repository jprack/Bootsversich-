# ADR-0006 — Audit-Protokoll ist aus der Anwendung nicht veränderbar

**Status:** angenommen · 2026-08-21

## Entscheidung

`AuditEvent` ist für die Anwendungsrolle append-only. `UPDATE` und `DELETE`
werden auf Datenbankebene entzogen und zusätzlich durch einen Trigger
blockiert. Löschung erfolgt ausschließlich über einen getrennten
Aufbewahrungsprozess mit eigener Datenbankrolle.

## Begründung

Revisionsfähigkeit ist nur belastbar, wenn ein kompromittiertes Anwendungskonto
Spuren nicht beseitigen kann.

## Konsequenzen

- Fehlerhafte Audit-Einträge werden durch einen korrigierenden Folgeeintrag richtiggestellt, nicht überschrieben.
- `AuditEvent` referenziert Entitäten über `entityType` + `entityId` ohne Fremdschlüssel, damit Anonymisierung anderer Tabellen das Protokoll nicht beschädigt.
- Personenbezug im Audit wird auf das Nötige beschränkt (Akteur, Objekt, Aktion, Zeitpunkt) — keine Nutzdaten.
