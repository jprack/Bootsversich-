# ADR-0002 — Bedeutung des Namens „Callidus"

**Status:** angenommen, mit offenem Punkt · 2026-08-21

## Kontext
Im Bestandsmodul `01_CRM_ENGINE` bezeichnet „Callidus" die **eigene** Plattform
(*Callidus Boat Intelligence Platform*, `api.callidus.example`). Der Auftrag für
dieses MVP bezeichnet mit „Callidus" die **externe** Versicherungsplattform und
Produktquelle.

## Entscheidung
In `apps/`, `packages/` und `docs/` bezeichnet „Callidus" ausschließlich das
**externe** System. Das eigene System heißt im Code `platform` beziehungsweise
`crm`. Das Bestandsmodul bleibt unverändert.

## Begründung
Der Auftrag ist in diesem Punkt eindeutig und beschreibt eine Adaptergrenze zu
einem Dritten. Eine stillschweigende Umdeutung würde die Discovery-Regeln
aushebeln.

## Konsequenzen
- Solange O-01 offen ist, darf kein öffentlich sichtbares Artefakt (Domain, Impressum, E-Mail-Vorlage) beide Bedeutungen mischen.
- Wird O-01 anders entschieden, ist eine Umbenennung von `packages/callidus-sdk` und der zugehörigen Tabellen erforderlich — ein mechanischer, aber breiter Eingriff.

## Offener Punkt
`docs/callidus/open-items.md`, O-01.
