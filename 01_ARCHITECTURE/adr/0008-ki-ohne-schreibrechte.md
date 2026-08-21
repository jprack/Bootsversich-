# ADR-0008 — KI ohne Schreibrechte auf Fachdaten

**Status:** vorgeschlagen · 2026-08-21

## Kontext

Der KI-Assistent (M8) soll Vorgänge zusammenfassen, Kommunikation entwerfen,
Dokumente auslesen und Fragen beantworten. Die naheliegende Erweiterung wäre,
ihn auch handeln zu lassen: Daten übernehmen, Aufgaben schließen, Angebote
versenden.

## Entscheidung

**Der KI-Assistent hat keine einzige schreibende Verbindung in den
Domänenkern.** Jede Ausgabe ist ein Vorschlag. Die Übernahme ist eine
menschliche Handlung und wird als solche protokolliert — mit Person, Zeitpunkt
und dem übernommenen Inhalt.

## Begründung

| Grund | Erläuterung |
|---|---|
| Rechtlich | Eine automatisierte Entscheidung mit erheblicher Wirkung ist im Versicherungsumfeld nur unter engen Bedingungen zulässig. Der einfachste Weg, sie zu erfüllen, ist, sie nicht zu treffen |
| Fachlich | Eine falsche Deckungsauslegung erzeugt Haftung. Kein Sprachmodell trägt sie |
| Technisch | Sprachmodelle sind nicht deterministisch. Ein nicht reproduzierbarer Schreibvorgang ist im Audit nicht erklärbar |
| Vertrauen | Ein Vertrieb, der der Automatik einmal misstraut, prüft danach alles doppelt — der Nutzen kehrt sich um |

## Umsetzung

- Eigenes Dienstkonto mit ausschließlich lesenden Rechten, technisch erzwungen.
- Jede Extraktion trägt einen Sicherheitswert; unterhalb eines Schwellwerts wird
  sie gar nicht erst angeboten.
- Das Originaldokument bleibt unverändert. Extrahierte Werte sind
  Vorbelegungen, nicht Wahrheit.
- Jede Ausgabe wird protokolliert: Modell, Modellversion, Prompt-Version,
  Eingabe-Hash, Sicherheitswert, Zeitpunkt.
- Personenbezogene Daten werden vor der Übermittlung pseudonymisiert und nach
  der Antwort zurückgeschrieben.

## Ausdrücklich untersagt

Automatische Ablehnung eines Kunden · automatische Prämien- oder
Deckungsentscheidung · automatischer Versand an Kunden ohne Freigabe ·
Rechtsberatung · Verarbeitung besonderer Datenkategorien · Training fremder
Modelle mit Kundendaten.

## Wann diese Entscheidung gelockert werden könnte

Für eng umgrenzte, folgenlose Schreibvorgänge — etwa das Setzen eines internen
Schlagworts — wäre eine Lockerung vertretbar. Sie erfordert eine eigene ADR mit
Nennung des konkreten Vorgangs, seiner Wirkung und seiner Rücknahmemöglichkeit.
Eine pauschale Freigabe wird es nicht geben.
