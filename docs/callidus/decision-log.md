# Callidus — Entscheidungsprotokoll

Chronologisches Protokoll aller Entscheidungen, die die Callidus-Integration
betreffen. Jede Entscheidung ist datiert, begründet und reversibel gekennzeichnet.

| ID     | Datum      | Entscheidung                                                                                                | Begründung                                                                         | Reversibel                                   | Quelle             |
| ------ | ---------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------- | ------------------ |
| CD-001 | 2026-08-21 | Reale Callidus-Integration wird als **BLOCKIERT** geführt.                                                  | Keine zulässige Verifikationsquelle vorhanden (siehe `capability-matrix.md` §1).   | ja — Aufhebung nach Vorliegen der Unterlagen | Repository-Analyse |
| CD-002 | 2026-08-21 | Entwicklung erfolgt gegen `MockCallidusAdapter` und `ManualCallidusAdapter`.                                | Auftrag §3: Plattform bis zur Adaptergrenze bauen, ohne Schnittstelle zu erfinden. | ja                                           | Auftrag            |
| CD-003 | 2026-08-21 | `RealCallidusAdapter` wird als deaktiviertes Gerüst angelegt und wirft bei Nutzung einen expliziten Fehler. | Verhindert versehentliche Produktivnutzung eines unbelegten Pfades.                | ja                                           | Auftrag §9         |
| CD-004 | 2026-08-21 | Produktcodes und Produktschemata der Entwicklungsumgebung sind als synthetisch gekennzeichnet (`DEMO-…`).   | Verhindert, dass Platzhalter für belegte Callidus-Produkte gehalten werden.        | ja                                           | Auftrag §1         |
| CD-005 | 2026-08-21 | Keine Automatisierung des Partnerportals.                                                                   | Weder schriftliche Erlaubnis noch rechtliche Prüfung vorhanden.                    | nein — nur nach schriftlicher Freigabe       | Auftrag §1         |
| CD-006 | 2026-08-21 | Bestandsmodul `01_CRM_ENGINE` bleibt unverändert erhalten.                                                  | Auftrag §17: keine bestehende Funktionalität ohne Begründung entfernen.            | ja                                           | Repository-Analyse |

Architekturentscheidungen mit größerer Reichweite liegen als ADR unter
`docs/architecture/adr/`.
