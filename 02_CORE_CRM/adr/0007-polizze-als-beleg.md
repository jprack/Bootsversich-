# ADR-0007 — Die Polizze ist der Beleg, nicht die Datenquelle

**Status:** entschieden · 2026-08-22 · präzisiert **C-03**, eröffnet **C-08**

## Kontext

Der Bestand wird nicht aus einem Vorsystem migriert, sondern aus **PDF-Polizzen**
aufgebaut. Eine Polizze ist ein Dokument für Menschen: Fließtext, Layout, teils
ein Scan. Jede maschinelle Auswertung ist eine Schätzung mit einer Fehlerquote,
die nie null wird — und die Felder, um die es geht, tragen Geld und Fristen.

| Option | Bewertung |
|---|---|
| **Automatische Übernahme ab Konfidenzschwelle** | Erzeugt schnell einen Bestand, dessen Fehler erst auffallen, wenn eine Frist verstrichen ist. Nicht rückholbar |
| **Reine Handerfassung** | Fehlerarm, aber bei 400 Polizzen unbezahlbar und ohne Belegbindung |
| **Ablage zuerst, Extraktion als Vorschlag, Freigabe durch Menschen** *(gewählt)* | Der Beleg liegt ab der ersten Minute. Jedes Feld kennt seine Herkunft |

## Entscheidung

1. Das PDF wird **zuerst unverändert abgelegt**, mit Prüfsumme. Ab diesem Moment
   ist es durchsuchbar und vorzeigbar — auch wenn nie ein Feld extrahiert wird.
2. Die Extraktion erzeugt **Vorschläge**, keine Datensätze. Kein Vertrag entsteht
   ohne menschliche Freigabe.
3. Jedes übernommene Feld behält **Dokument, Seite, Fundstelle, Konfidenz und
   bestätigende Person** (`EXTRAKTIONSFELD`).
4. **Kritische Felder** — Polizzennummer, Beginn, Ablauf, Hauptfälligkeit, Prämie
   brutto, Versicherungssumme, Selbstbehalt — werden **immer** manuell bestätigt,
   unabhängig von der Konfidenz.
5. Das Extraktionswissen je Versicherer liegt als **Daten** vor
   (`POLIZZENPROFIL`), versioniert und mit Vier-Augen-Freigabe. Ein neuer
   Versicherer ist kein Entwicklungsauftrag.
6. **Keine erfundene Historie.** Fehlt die Vorgeschichte, entsteht eine Version
   und das Kennzeichen `historie_unvollstaendig`.
7. Der Import **löst keine Automation und keine Kundenkommunikation aus** und
   erzeugt **keine Einwilligung**.
8. Text im Dokument ist **Datum, nie Anweisung**. Die Extraktion kennt nur die
   Felder ihres Profils, führt nichts aus und läuft ohne ausgehende
   Netzverbindung.

## Begründung

- **Die Ablage steht vor der Auswertung.** Damit ist der Import jederzeit
  anhaltbar, ohne dass geleistete Arbeit verloren geht — und der Nutzen beginnt
  vor der ersten extrahierten Zahl.
- **Belegbindung schlägt Bequemlichkeit.** Ein Feld, das seine Fundstelle kennt,
  ist vor einer Prüfung mehr wert als zehn Felder, die schnell entstanden sind.
- **Eine halbe Extraktion ist schlechter als keine.** Sie erzeugt Vertrauen, wo
  keines angebracht ist. Deshalb kippt eine schlechte Vorlage vollständig in die
  Handerfassung.
- **Eine Prüfung korrigiert nie.** Sobald ein Importwerkzeug Werte selbst
  zurechtrückt, weiß niemand mehr, was in der Polizze stand.

## Konsequenzen

**Positiv:** Ein Bestand mit Beweislage statt einer Datenbank mit Behauptungen.
Der Beleg bleibt liegen, während bei einer Migration die Herkunft mit dem
Altsystem verschwindet.

**Negativ:** Handarbeit, die sich verkleinern, aber nicht abschaffen lässt.
Größenordnung: 3–5 Minuten je Polizze bei passendem Profil — eine Annahme, die
an den ersten zwanzig Belegen zu messen ist.

**Offen (C-08):** Ob zur Extraktion ein Sprachmodell eingesetzt wird, und wenn
ja, an welchem Ort und unter welchem Auftragsverarbeitungsvertrag. Ohne diese
Klärung verlässt kein Beleg die eigene Umgebung.

## Verweise

[`14_POLIZZENIMPORT.md`](../14_POLIZZENIMPORT.md) ·
[ADR-0002](0002-vertrag-unveraenderlich.md) ·
[ADR-0004](0004-automationen-als-daten.md)
