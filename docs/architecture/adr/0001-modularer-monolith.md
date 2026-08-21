# ADR-0001 — Modularer Monolith statt Microservices

**Status:** angenommen · 2026-08-21

## Kontext
Das System bedient einen Versicherungsagenten mit kleinem Innendienst. Die
Prozesse (Anfrage → Angebot → Prüfung → Signatur → Übergabe) sind stark
gekoppelt und teilen sich dieselben Entitäten.

## Entscheidung
Ein modularer Monolith (`apps/api`) mit klaren Modulgrenzen und getrenntem
Worker-Prozess (`apps/worker`), der dieselbe Codebasis nutzt.

## Begründung
- Die fachlichen Transaktionen (Statuswechsel + Audit + Aufgabe) sind atomar; verteilte Transaktionen wären reine Zusatzkomplexität.
- Ein Einzelagent erzeugt keine Last, die Skalierung einzelner Dienste rechtfertigt.
- Betriebsaufwand und Angriffsfläche bleiben klein.

## Konsequenzen
- Modulgrenzen müssen durch Konventionen und Lint-Regeln geschützt werden, nicht durch Netzwerkgrenzen.
- Ein späteres Herauslösen ist möglich, sobald ein belegbarer Grund vorliegt (Lastprofil, Team-Topologie, abweichender Lebenszyklus).
