# Architekturentscheidungen (ADR)

Format: Kontext — Entscheidung — Begründung — Konsequenzen — Status.
Eine ADR wird nie gelöscht, sondern durch eine neue ersetzt (`Ersetzt durch`).

> **Abgelöst.** Diese ADR gehören zur Vorarbeit in [`apps/`](../../../apps/STATUS.md).
> Gültig ist [`01_ARCHITECTURE/adr/`](../../../01_ARCHITECTURE/adr/README.md).
> Die fachliche Analyse ist übernommen, die Technologieentscheidungen sind es nicht.

| ADR                                                      | Titel                                                             | Status                        |
| -------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------- |
| [0001](0001-modularer-monolith.md)                       | Modularer Monolith statt Microservices                            | angenommen                    |
| [0002](0002-namensraum-callidus.md)                      | Bedeutung des Namens „Callidus"                                   | angenommen, mit offenem Punkt |
| [0003](0003-jsonb-fuer-produktdaten.md)                  | JSONB ausschließlich für produktspezifische Risikodaten           | angenommen                    |
| [0004](0004-geldbetraege-als-decimal.md)                 | Geldbeträge als Decimal mit Währung                               | angenommen                    |
| [0005](0005-signatur-abstraktion.md)                     | Signatur hinter einer Abstraktion, ohne Aussage zur Signaturstufe | angenommen                    |
| [0006](0006-audit-unveraenderlich.md)                    | Audit-Protokoll ist aus der Anwendung nicht veränderbar           | angenommen                    |
| [0007](0007-statusmaschine-statt-generischer-updates.md) | Benannte Statusübergänge statt generischer Update-Endpunkte       | angenommen                    |
