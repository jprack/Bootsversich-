# ADR-0003 — Modularer Monolith statt Microservices

**Status:** vorgeschlagen · 2026-08-21

## Kontext

Der Domänenkern umfasst CRM, Vertrag, Objekt, Netzwerk, Workflow, Dokumente und
Kampagnen. Die naheliegende Frage: ein Dienst oder sieben?

## Entscheidung

**Ein Dienst mit im Code erzwungenen Modulgrenzen.** Zusätzlich laufen Worker
als eigene Prozesse — dieselbe Codebasis, anderer Einstiegspunkt.

## Begründung

| Grund | Erläuterung |
|---|---|
| Transaktionen | Ein Statuswechsel schreibt Vorgang, Aufgabe, Audit und Outbox-Ereignis **in einer** Transaktion. Verteilt bräuchte es Sagas und Ausgleichsvorgänge — erheblicher Aufwand für ein Problem, das hier nicht besteht |
| Lastprofil | Bei V1-Last (15 Anfragen je Sekunde) ist die Trennung reiner Zusatzaufwand |
| Teamgröße | Microservices lohnen sich, wenn Teams unabhängig ausliefern müssen. Bei einem Team erzeugen sie Koordination statt sie zu sparen |
| Betrieb | Sieben Dienste bedeuten sieben Auslieferungswege, sieben Überwachungen, sieben Sicherheitsaktualisierungen |

## Wie die Grenzen trotzdem halten

Ein Monolith zerfällt ohne Disziplin zu einem Klumpen. Deshalb:

- Ein Modul greift **nie** auf die Tabellen eines anderen zu, sondern auf dessen
  Dienst — technisch geprüft mit `deptrac`; ein Verstoß bricht den Build.
- Jedes Modul hat einen ausdrücklich öffentlichen Teil; alles andere ist intern.
- Modulübergreifende Zusammenarbeit läuft bevorzugt über Ereignisse.
- Jedes Modul ist einzeln testbar.

## Wann herausgelöst wird

Erst wenn **ein** Modul mindestens eines dieser Merkmale zeigt:

1. Deutlich abweichendes Lastprofil (etwa Dokumentverarbeitung bei Massenimport).
2. Abweichender Änderungsrhythmus (täglich gegenüber vierteljährlich).
3. Ein eigenes Team mit eigener Auslieferungshoheit.
4. Abweichende Anforderungen an Verfügbarkeit oder Datenstandort.

„Es wäre sauberer" ist kein Grund. Der erste Kandidat wäre der
Dokumentenkern — er hat das abweichendste Lastprofil.

## Konsequenzen

**Positiv:** Einfacher Betrieb, atomare Transaktionen, keine Netzlatenz
zwischen Modulen, ein Auslieferungsweg.

**Negativ:** Alle Module skalieren gemeinsam; ein schwerer Fehler betrifft
alles; die Grenzen brauchen Werkzeugunterstützung, sonst erodieren sie.
