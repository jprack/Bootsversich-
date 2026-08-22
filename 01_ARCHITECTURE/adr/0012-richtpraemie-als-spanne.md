# ADR-0012 — Richtprämie als Spanne aus eigenem Tarifwerk

**Status:** vorgeschlagen · 2026-08-21 · entscheidet **A-08**

## Kontext

Die Anbindung an die Versicherer läuft über E-Mail (ADR-0010). Damit kann die
Website keine verbindliche Prämie anzeigen. Offen war, ob stattdessen eine
unverbindliche Orientierung erscheint — und woher deren Daten kämen.

Die Tarife liegen als PDF und Excel vor. Damit ist die Datenfrage beantwortet.

## Geprüfte Optionen

| Option | Bewertung |
|---|---|
| **Weg A — reine Anfragestrecke, kein Preis** | Ehrlich und aufwandsfrei. Aber: Wettbewerber mit Rechner gewinnen den Erstkontakt. Bei einem Produkt, das online verglichen wird, ist das ein struktureller Nachteil |
| **Weg B — Punktwert („Ihre Prämie: 468 €")** | Höchste Umwandlung, höchstes Risiko. Jede Abweichung vom späteren Angebot wirkt wie eine Täuschung, und sie tritt zwangsläufig ein |
| **Weg B' — Spanne aus mehreren Trägern** *(gewählt)* | Zeigt eine belastbare Größenordnung, ohne eine Genauigkeit zu behaupten, die nicht besteht |

## Entscheidung

Die Website zeigt eine **Spanne**, errechnet serverseitig aus dem eigenen
Tarifwerk über alle in Frage kommenden Versicherer.

```
Versicherer A  412 €  ·  B  468 €  ·  C  kein Ergebnis  ·  D  531 €
        →  „typischerweise 410 – 530 € im Jahr"
```

## Warum die Spanne hier die ehrliche Darstellung ist

Als Mehrfachagent liegt tatsächlich keine Zahl vor, sondern eine Menge. Ein
einzelner Wert wäre eine willkürliche Auswahl daraus — die Spanne ist das, was
wirklich bekannt ist. Sie ist keine Absicherung gegen Ungenauigkeit, sondern die
zutreffende Beschreibung der Datenlage.

## Bedingungen, ohne die die Entscheidung kippt

1. **Serverseitige Berechnung.** Tarifdaten im Browser wären Geschäftsgeheimnis der Versicherer in fremder Hand.
2. **Weniger als zwei Träger mit Ergebnis → keine Anzeige.** Eine „Spanne" aus einem Wert ist eine Punktangabe mit falscher Aura.
3. **Keine passende Tarifposition → kein Ergebnis, keine Schätzung.** Eine geratene Prämie ist schlimmer als keine.
4. **Unübersehbare Kennzeichnung als unverbindlich**, mit Stichtag — nicht im Kleingedruckten.
5. **Abweichungsmessung ab Welle 2.** Liegen weniger als 80 % der echten Angebote in der angezeigten Spanne, wird das Tarifwerk überarbeitet oder die Spanne verbreitert.
6. **Benannte verantwortliche Person für die Tarifpflege.** Ein Tarifwerk verfällt still; das System erzeugt bei Überalterung selbst eine Aufgabe.

## Konsequenzen

**Positiv:** Deutlich geringerer Abbruch als bei einer reinen Anfragestrecke.
Die Spanne ist verteidigbar, weil sie die tatsächliche Datenlage abbildet.
Das Tarifwerk ist später wiederverwendbar — für Vergleichsvorschläge im
Innendienst und für die Plausibilitätsprüfung eingehender Angebote.

**Negativ:** Laufender Pflegeaufwand. Ohne Pflege veraltet die Anzeige unbemerkt.
Zusätzlich ist je Versicherer zu klären, ob die Anzeige seiner Prämien
vertraglich zulässig ist (**A-11**) — fällt die Antwort negativ aus, fließt
dieser Träger nicht in die Spanne ein.

## Wann diese Entscheidung falsch wäre

Wenn die Tarifstruktur so viele Merkmale braucht, dass eine brauchbare Indikation
zwölf Formularfelder erfordert. Dann kostet die Genauigkeit mehr Abbrüche, als
die Preisanzeige einbringt — und Weg A ist besser. Das ist an der realen
Excel-Struktur zu prüfen, nicht vorab zu entscheiden.
