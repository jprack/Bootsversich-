# ADR-0004 — Automatisierungen sind Daten, keine Programmierung

**Status:** vorgeschlagen · 2026-08-22

## Entscheidung

Jede Automatisierungsregel liegt als Datensatz in `AUTOMATISIERUNGSREGEL`:
Auslöser, Bedingung, Aktion, Dublettenschlüsselmuster, Gültigkeit. Der
Innendienst legt an, die Administration gibt frei. Kein Entwickler wird
gebraucht, um eine Frist von 90 auf 75 Tage zu ändern.

Derselbe Grundsatz wie beim Tarifwerk
([Kapitel 13](../../01_ARCHITECTURE/13_TARIFWERK.md)) — und aus demselben Grund.

## Begründung

| Als Code | Als Daten |
|---|---|
| Jede Fristanpassung ist ein Entwicklungsauftrag | Der Fachbereich ändert selbst |
| Änderung braucht eine Auslieferung | Wirkt sofort, mit Freigabe |
| Regeln sind über die Codebasis verstreut | Alle an einer Stelle, auswertbar |
| Niemand weiß, welche Regeln aktiv sind | Eine Abfrage beantwortet es |
| Kein Trockenlauf möglich | Trockenlauf gegen den echten Bestand |

Der letzte Punkt wiegt am schwersten. Eine Regel mit falsch gesetzter Bedingung
erzeugt am ersten Tag viertausend Aufgaben — und danach glaubt niemand mehr an
das System.

## Bedingungen

1. **Trockenlauf vor jeder Aktivierung.** Wie viele Aufgaben entstünden, für wen?
2. **Vier-Augen-Prinzip.** Wer anlegt, gibt nicht frei.
3. **Jede Auslösung wird protokolliert** — auch die unterdrückte, mit Grund.
4. **Monatlicher Wirkungsbericht.** Eine Regel, deren Aufgaben regelmäßig ohne
   Ergebnis geschlossen werden, wird abgeschaltet.
5. **Codes sind stabil.** `A-21` bleibt `A-21`, auch wenn sich die Frist ändert.

## Grenzen

Nicht als Daten abbildbar sind Aktionen mit Nebenwirkungen außerhalb des CRM
(Signatur anfordern, Übermittlung an einen Versicherer). Solche Regeln lösen ein
Ereignis aus; die Ausführung liegt im Workflow-Modul.

Ebenso bleibt verboten, was in
[`07_AUFGABEN_UND_AUTOMATIONEN.md`](../07_AUFGABEN_UND_AUTOMATIONEN.md) §11
aufgeführt ist — insbesondere jede automatische nachteilige Entscheidung
gegenüber einem Kunden. Das ist keine Konfigurationsfrage.
