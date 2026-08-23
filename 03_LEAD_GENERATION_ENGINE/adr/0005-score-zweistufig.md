# ADR-0005 — Zweistufiger, erklärbarer Score

**Status:** vorgeschlagen · 2026-08-23

## Kontext

Der Auftrag nennt acht Scoring-Kriterien. Vier davon — Bootsbestand,
Kooperationspotenzial, Versicherungspotenzial, Umsatzpotenzial — sind zum
Zeitpunkt der Recherche nicht bekannt, sondern erst nach einem Gespräch.

| Option | Bewertung |
|---|---|
| **Ein Score aus allen acht**, Unbekanntes geschätzt | Zwei Drittel Annahme, sieht aus wie Wissen. Die Reihenfolge der Gespräche wird zufällig, und niemand merkt es |
| **Nur Beobachtbares bewerten**, Rest weglassen | Verliert die Information aus Gesprächen |
| **Zwei getrennte Werte** *(gewählt)* | Jede Zahl sagt, worauf sie beruht |

## Entscheidung

**Basiswert** (0–100) aus fünf beobachtbaren Kriterien: Zielgruppentyp 30,
Größenindikator 25, Revier und Region 20, Erreichbarkeit 15, Marktsichtbarkeit 10.
Verfügbar sofort, steuert die **Reihenfolge der Ansprache**.

**Potenzialwert** (0–100) aus vier Gesprächsergebnissen. Bleibt leer, bis
jemand gesprochen hat — angezeigt als „—", nicht als 0.

**Kein Gesamtscore.** Beide Werte stehen nebeneinander, nie als Summe.

**Jeder gesetzte Wert schreibt `score_herleitung`** mit Modellversion, Posten,
Punkten, Begründung und Belegverweis. Ohne diesen Eintrag ist das Setzen des
Scores technisch nicht möglich.

**Unbekannte Größe ergibt 0 Punkte, nicht den Mittelwert.** Ein Objekt ohne
Größenangabe erreicht höchstens 75 — und das ist die zutreffende Aussage.

## Begründung

- **Ein Score, dem niemand glaubt, steuert nichts.** Die Herleitung macht
  Widerspruch möglich: „Die 18 Punkte für 310 Liegeplätze stimmen nicht, das sind
  Trockenplätze" ist verwertbar; „der Score ist zu hoch" nicht.
- **Ein Mittelwert für Unbekanntes hebt schlecht dokumentierte Objekte künstlich
  an** — genau die Verzerrung, die vermieden werden soll.
- **Modelländerungen bleiben deutbar**, weil die Modellversion im Eintrag steht.

## Konsequenzen

**Positiv:** Ehrliche Zahlen, korrigierbar, nachvollziehbar.

**Negativ:** Zwei Zahlen statt einer in jeder Ansicht. Der Potenzialwert ist bei
den meisten Objekten leer — was richtig ist, aber erklärungsbedürftig aussieht.

**Verboten bleibt:** automatische Ablehnung wegen niedrigem Score · automatische
Ansprache ab Schwellenwert · Score auf Personen · sachfremde Merkmale.
