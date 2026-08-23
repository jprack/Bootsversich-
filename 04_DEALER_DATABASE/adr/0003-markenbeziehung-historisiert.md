# ADR-0003 — Markenvertretungen werden historisiert

**Status:** vorgeschlagen · 2026-08-23

## Kontext

Markenvertretungen im Bootshandel wechseln im Jahresrhythmus: Ein Händler gibt
eine Marke ab, bekommt eine andere, verliert eine Gebietsvertretung. Das ist der
häufigste Grund, weshalb Händlerlisten veralten.

| Option | Bewertung |
|---|---|
| **Markenliste als Textfeld am Händler** | Nicht auswertbar, nicht datierbar, bei jeder Änderung überschrieben |
| **Zuordnungstabelle ohne Zeitraum** | Der aktuelle Stand ist richtig, die Vergangenheit ist gelöscht |
| **Zuordnung mit `gueltig_ab` / `gueltig_bis` und Grund** *(gewählt)* | Der aktuelle Stand ist eine Ansicht auf eine Folge |

## Entscheidung

`HAENDLER_MARKE` trägt Rang, Gebiet, Exklusivität, optionalen Importeur,
Gültigkeitszeitraum, Beendigungsgrund sowie Herkunft und Bestätigungsdatum.

Eine beendete Vertretung wird **nie gelöscht**, sondern mit `gueltig_bis` und
Grund abgeschlossen.

`MARKE` ist eine eigene Entität mit optionalem Bezug zum Hersteller. Das Feld
`ist_premiumwerft` steuert den Tarifnachlass und verlangt bei `true` zwingend
eine Quellenangabe.

## Begründung

- **„Wer hat dieses Boot 2024 verkauft?"** ist ohne Historie nicht beantwortbar —
  und die Antwort entscheidet über Provision und Vertrauen.
- **„Warum ist die Vermittlung eingebrochen?"** hat oft genau eine Ursache: Die
  Marke wurde entzogen. Ohne Historie ist sie unsichtbar.
- **Dieselbe Logik wie beim unveränderlichen Vertrag** (ADR-0002 des Kern-CRM).
  Zwei verschiedene Denkweisen für dasselbe Problem wären eine unnötige zweite.
- **Der Premiumwerften-Nachlass hängt an Marken, nicht an Unternehmen.** Ein
  Häkchen ohne Beleg führt zu einem Nachlass, den der Versicherer nicht gewährt.

## Konsequenzen

**Positiv:** Markenwechsel sind erklärbar, Altvorgänge zuordenbar, die
Markenlandkarte ist zeitlich auswertbar.

**Negativ:** Jede Abfrage des aktuellen Stands braucht einen Zeitfilter. Wer ihn
vergisst, sieht beendete Vertretungen — der klassische Fehler bei historisierten
Tabellen.
