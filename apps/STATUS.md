# Status dieses Verzeichnisses

**Abgelöst. Nicht in Entwicklung. Nicht ausliefern.**

`apps/` und `packages/` enthalten ein halbfertiges Gerüst eines eigenen
Versicherungs-CRM in TypeScript (NestJS, Prisma, Next.js). Es entstand unter
einer Vorgabe, die ausdrücklich **ohne** WordPress arbeiten sollte.

Die gültige Zielarchitektur ist [`01_ARCHITECTURE/`](../01_ARCHITECTURE/README.md).
Sie sieht WordPress als Plattformbasis und einen Domänenkern in PHP/Symfony vor.

## Warum es trotzdem erhalten bleibt

Die hier ausgearbeitete Fachanalyse ist gültig und in die Architektur
eingeflossen:

| Vorarbeit | Übernommen in |
|---|---|
| Statusmaschine mit 23 Zuständen und 26 benannten Übergängen | `01_ARCHITECTURE/07_DATENFLUESSE.md`, Modul M10 |
| Rollen- und Berechtigungsmodell | `01_ARCHITECTURE/06_ROLLENMODELL.md` |
| Deterministische Prüfregeln für Angebote | `01_ARCHITECTURE/07_DATENFLUESSE.md`, Fluss 4 |
| Geldbeträge ohne Gleitkomma | `01_ARCHITECTURE/04_DATENMODELL.md`, D5 |
| Einwilligungsmodell mit Zweck und Rechtsgrundlage | `01_ARCHITECTURE/04_DATENMODELL.md`, D7 |
| Erinnerungsstaffelung 3 / 7 / 14 / 21 Tage | `01_ARCHITECTURE/07_DATENFLUESSE.md`, Fluss 5 |

Der Code wird nicht weitergeführt. Die Analyse schon.

Siehe [`01_ARCHITECTURE/adr/0009-verhaeltnis-zu-vorarbeiten.md`](../01_ARCHITECTURE/adr/0009-verhaeltnis-zu-vorarbeiten.md).
