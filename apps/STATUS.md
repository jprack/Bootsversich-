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

| Vorarbeit                                                   | Übernommen in                                   |
| ----------------------------------------------------------- | ----------------------------------------------- |
| Statusmaschine mit 23 Zuständen und 26 benannten Übergängen | `01_ARCHITECTURE/07_DATENFLUESSE.md`, Modul M10 |
| Rollen- und Berechtigungsmodell                             | `01_ARCHITECTURE/06_ROLLENMODELL.md`            |
| Deterministische Prüfregeln für Angebote                    | `01_ARCHITECTURE/07_DATENFLUESSE.md`, Fluss 4   |
| Geldbeträge ohne Gleitkomma                                 | `01_ARCHITECTURE/04_DATENMODELL.md`, D5         |
| Einwilligungsmodell mit Zweck und Rechtsgrundlage           | `01_ARCHITECTURE/04_DATENMODELL.md`, D7         |
| Erinnerungsstaffelung 3 / 7 / 14 / 21 Tage                  | `01_ARCHITECTURE/07_DATENFLUESSE.md`, Fluss 5   |

Der Code wird nicht weitergeführt. Die Analyse schon.

Siehe [`01_ARCHITECTURE/adr/0009-verhaeltnis-zu-vorarbeiten.md`](../01_ARCHITECTURE/adr/0009-verhaeltnis-zu-vorarbeiten.md).

## Was die Pipeline hier tut — und warum so wenig

`apps/api` besitzt eine `package.json` und ein Prisma-Schema, aber **kein
`src/`**. Die urspruengliche CI-Pipeline hat trotzdem Lint, Typpruefung, Tests,
Build, Datenbankmigrationen und einen OpenAPI-Abgleich fuer dieses Paket
verlangt. Sie konnte deshalb nie gruen werden.

Eine dauerhaft rote Pipeline ist schlimmer als keine: Irgendwann wird auch der
Geheimnis-Scan uebersehen, der wirklich zaehlt. Deshalb wurden die
Turbo-Skripte (`build`, `lint`, `typecheck`, `test`) aus `apps/api/package.json`
entfernt — nicht um einen Fehler zu verstecken, sondern weil es hier nichts zu
pruefen gibt. `prisma:generate` bleibt, weil das Schema Referenz ist.

Wird der Strang je wieder aufgenommen, kommen Skripte und Pipelineschritte
zusammen mit dem Quelltext zurueck.
