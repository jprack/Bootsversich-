# Prüfstand

Der lauffähige Teil des Moduls. Er beweist nicht, dass die Engine fertig ist —
er beweist, dass die **Zusicherungen des Fachkonzepts einlösbar** sind.

## Starten

```bash
# Ohne vorhandene Datenbank (legt eine kurzlebige Instanz an)
./run_demo.sh

# Gegen eine eigene, leere Datenbank
./run_demo.sh --db "postgresql://benutzer:passwort@localhost:5432/leaddemo"

# Instanz nach dem Lauf wieder beenden
./run_demo.sh --stop
```

Voraussetzung: PostgreSQL 14 oder neuer (`psql`, für die temporäre Instanz auch
`initdb` und `pg_ctl`).

## Was der Lauf zeigt

| Ausgabe | Aussage |
|---|---|
| **Quellenbilanz** | Was jede Quelle geliefert hat — gefunden, neu, bekannt, gesperrt. Die einzige Grundlage, eine Quelle abzuschalten |
| **Prüfliste** | Was auf eine menschliche Entscheidung wartet, mit Basiswert, Klasse und Dublettenlage. Der Potenzialwert steht als `—`, nicht als 0 |
| **Testsuite** | 50 Prüfungen gegen die laufende Engine |
| **Abdeckungsgrad** | Die Leitkennzahl, mit Nenner und dessen Erhebungsdatum |
| **Tagesliste** | Die erzeugten Aufgaben, im Rahmen des Kontingents |

Der **vollständige Endstand** — jede Tabelle, jeder Beleg, jeder Score-Posten —
wird mit einem zweiten Aufruf ausgegeben:

```bash
psql -h /tmp -p 55433 -U crm -d leaddemo -f 03_ergebnis.sql
```

## Die Daten

**Alles erfunden.** Keine realen Organisationen, keine realen Personen, keine
realen Rufnummern; alle Domains liegen unter `.example` (nach RFC 2606
reserviert und nicht registrierbar).

Die Demodaten sind **absichtlich unsauber**, weil ein Prüffall, der nur saubere
Daten kennt, nichts prüft:

| Fall | Was er prüft |
|---|---|
| `Bootscenter Steinbach GmbH` mit zwei Filialen unter einer Domain | Domain ist der stärkste Schlüssel, aber **nicht eindeutig** |
| `Yacht- und Segelclub Seeblick e.V.` und `Yachtclub Seeblick` | Namensnormalisierung und Ähnlichkeitsregel |
| `Marina Seeblick`, im CRM bereits Partner | Der Abgleich gegen das CRM — die wichtigste der vier Prüfstellen |
| `Segelschule Nordwind` mit Widerspruch | Sperre wirkt **vor** der Anlage: es entsteht kein Objekt |
| `Hafenbetriebe Nordufer` und `Bootsservice Nordufer`, gleiche Rufnummer | Regel D8: gemeinsame Zentrale ist keine Dublette |
| `Hafen Seestern` in der Schweiz | Kein Mandant, kein Objekt |
| `Ruderriege Donaustadt` | Klasse D: keine Aufgabe, trotzdem gespeichert und in der Abdeckung gezählt |
| Ein Ansprechpartner, 30 Tage alt, nicht informiert | Art. 14 DSGVO — Regel `L-31` |
| Telefonnummern in fünf Schreibweisen | Normalisierung auf E.164 |

## Der aussagekräftigste Test

**T39 bis T41 — der wiederholte Lauf.** Dieselbe Quelle wird ein zweites Mal
eingelesen. Erwartet wird: **kein einziges neues Objekt**. Das prüft
Normalisierung, Dublettenabgleich, Gedächtnis für Nicht-Dubletten und die
Sperrlogik in einem Zug — und ist der Abnahmepunkt 7 aus
[`../14_SKALIERUNG_ROADMAP.md`](../14_SKALIERUNG_ROADMAP.md).

T41 zeigt zusätzlich den Rückfluss: Zwischen den beiden Läufen ist eine Absage
eingegangen. Das Ziel wird **nicht wieder erfasst**. Ohne dieses Gedächtnis
schlägt das System dieselbe Marina in sechs Monaten erneut vor, und der
Vertrieb ruft ein zweites Mal an.

## Was der Prüfstand nicht ist

| Nicht enthalten | Warum |
|---|---|
| Erfassung aus echten Quellen | Zulässigkeit je Quelle ist zu klären (L-01), und der Weg dorthin ist Handwerk, keine Architektur |
| Oberfläche | Die Prüfmaske gehört in die WordPress-Werkbank |
| Regeln als Datensätze | Hier sind sechs Regeln als Funktion abgebildet; im Betrieb liegen sie in `AUTOMATISIERUNGSREGEL` |
| Anbindung an das echte CRM | Die drei `crm_`-Tabellen sind ein Abbild der Übergabestelle, nicht das Kern-CRM |
| Row Level Security | Die Mandantenspalte ist da und wird geprüft; die Durchsetzung gehört in den Kern |

Der Prüfstand ist die **Antwort auf die Frage, ob das Konzept trägt** — nicht
der Beginn der Umsetzung.
