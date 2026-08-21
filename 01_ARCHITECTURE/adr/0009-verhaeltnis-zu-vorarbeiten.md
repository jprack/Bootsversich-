# ADR-0009 — Verhältnis zu vorhandenen Arbeiten im Repository

**Status:** angenommen · 2026-08-21

## Kontext

Das Repository enthält zwei Vorarbeiten aus früheren Aufträgen:

1. **`01_CRM_ENGINE/`** — vollständige Spezifikation und ein lauffähiger
   PostgreSQL-Prototyp einer CRM-Engine für Bootsversicherung: Lead Score,
   Customer Value Score, Kündigungsrisiko, Regelkatalog A-01…A-49,
   Priorisierung, Lastschutz. Mit Demobestand und Testsuite; im Lasttest
   5.009 Leads und 2.010 Kunden in gut 20 Sekunden.

2. **`apps/`, `packages/`, `docs/`** — halbfertiges Gerüst eines eigenen
   Versicherungs-CRM in TypeScript (NestJS, Prisma, Next.js) aus einem
   Auftrag, der ausdrücklich **ohne** WordPress arbeiten sollte.

## Entscheidung

| Vorarbeit | Umgang |
|---|---|
| `01_CRM_ENGINE/` | **Wird übernommen.** Es ist das Modul M1 dieser Architektur. Fachmodell, Scoring und Regelkatalog gelten unverändert. Die Engine läuft in derselben PostgreSQL-Instanz wie der übrige Domänenkern |
| `apps/`, `packages/`, `docs/` | **Wird abgelöst, aber nicht gelöscht.** Bleibt als Referenz erhalten, ist nicht Bestandteil dieser Architektur und wird nicht weiterentwickelt |

## Begründung

**Zu 1:** Die CRM-Engine ist die wertvollste vorhandene Arbeit. Sie ist
spezifiziert, umgesetzt, getestet und unter Last gemessen. Sie neu zu bauen,
wäre Verschwendung; sie zu ignorieren, wäre schlimmer. Ihre Übernahme verkürzt
Welle 1 der Roadmap erheblich.

**Zu 2:** Das TypeScript-Gerüst folgt einer Vorgabe, die durch den aktuellen
Auftrag abgelöst ist (WordPress als Plattformbasis). Es zu löschen wäre
verlustreich: Die dort ausgearbeitete Statusmaschine mit 23 Zuständen und
26 benannten Übergängen, das Berechtigungsmodell und die Prüfregeln für
Angebote sind fachlich gültig und in Kapitel 04 und 07 dieser Architektur
eingeflossen. Der Code wird nicht weitergeführt, die Fachanalyse schon.

## Konsequenzen

- Das Modul `01_CRM_ENGINE/` bleibt unverändert und wird in dieser Phase nicht
  angefasst.
- Beim Anschluss ist eine Namensangleichung nötig: `01_CRM_ENGINE` verwendet
  deutsche `snake_case`-Spalten mit Präfix `crm_`, diese Architektur ebenfalls.
  Es besteht kein Konflikt.
- `apps/` und `packages/` erhalten einen Hinweis auf ihren Status. Sie werden
  in keiner Auslieferung gebaut und in keiner Umgebung betrieben.
- Sollte die Entscheidung zu ADR-0001 anders ausfallen als vorgeschlagen, wäre
  `apps/` wieder anschlussfähig. Das ist der zweite Grund, es zu erhalten.
