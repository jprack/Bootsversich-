# ADR-0002 — PHP und Symfony für den Domänenkern

**Status:** vorgeschlagen · 2026-08-21

## Kontext

ADR-0001 legt einen eigenen Domänenkern neben WordPress fest. Offen ist, in
welcher Sprache und mit welchem Rahmenwerk.

## Geprüfte Optionen

| Option | Dafür | Dagegen |
|---|---|---|
| **PHP 8.3 / Symfony 7** *(gewählt)* | Eine Sprache für WordPress-Plugins und Kern; Personal, Werkzeuge und Betrieb bleiben einfach. Symfony liefert Messenger, Workflow, Security, Validator und Serializer als geprüfte Bausteine. LTS mit langem Supportzeitraum. | Kein Vorteil bei stark nebenläufiger Last; kleineres Ökosystem für Datenverarbeitung als bei Python |
| Node.js / NestJS | Gemeinsame Sprache mit dem React-Anteil des Frontends; gute Werkzeuge | Zweite Sprache neben PHP; Betrieb, Abhängigkeitspflege und Personal verdoppeln sich für den Kern |
| Java / Spring Boot | Sehr reif, stark im Finanzumfeld | Deutlich höherer Betriebs- und Einarbeitungsaufwand; für ein Team dieser Größe unverhältnismäßig |
| Python / Django | Stark bei Datenverarbeitung und KI | Zweite Sprache; die datenintensiven Teile laufen ohnehin in PostgreSQL |

## Entscheidung

**PHP 8.3 mit Symfony 7 (LTS).**

Der entscheidende Punkt ist nicht die technische Überlegenheit — sie liegt bei
keinem der Kandidaten eindeutig vor. Entscheidend ist, dass die Plattform
WordPress ohnehin betreibt. Eine zweite Sprache bedeutet: zwei
Abhängigkeitspflegen, zwei Sicherheitsaktualisierungspfade, zwei
Auslieferungswege, zwei Kompetenzprofile bei Einstellung und Urlaubsvertretung.

Für ein Vorhaben dieser Größe wiegt das schwerer als jeder Sprachvorteil.

## Konsequenzen

**Positiv**

- Ein Kompetenzprofil deckt Plugins und Kern ab.
- Gemeinsame Werkzeuge: Composer, PHPStan, PHPUnit, PSR-12.
- Symfony Workflow bildet die Zustandsmaschinen aus Kapitel 07 unmittelbar ab.
- Symfony Messenger liefert die Outbox- und Warteschlangenmuster aus Kapitel 05.

**Negativ**

- Bei starker Nebenläufigkeit (etwa Massenversand) ist PHP nicht die erste
  Wahl. Begegnet wird das mit mehreren Worker-Prozessen; die eigentliche Last
  liegt beim Versanddienst, nicht bei der Anwendung.
- Rechenintensive Auswertungen gehören in PostgreSQL oder das Data Warehouse,
  nicht in die Anwendungsschicht.

**Verbindliche Trennung**

Der Kern teilt sich **keinen** Code mit den WordPress-Plugins. Gleiche Sprache
heißt nicht gemeinsame Bibliothek: Ein geteiltes Paket wäre der erste Schritt
zurück zu einem System (Risiko U-02). Gemeinsam sind ausschließlich die
API-Verträge.

## Wann diese Entscheidung falsch wäre

Wenn der Kern überwiegend Datenverarbeitung und Modellbetrieb enthielte, wäre
Python richtig. Er enthält Fachlogik, Zustandsmaschinen und Berechtigungen —
dafür ist Symfony gut geeignet.
