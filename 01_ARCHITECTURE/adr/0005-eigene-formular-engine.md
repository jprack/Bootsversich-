# ADR-0005 — Eigene Formular-Engine statt Formular-Plugin

**Status:** vorgeschlagen · 2026-08-21

## Kontext

Formulare sind der Einstiegspunkt jedes Leads. WordPress bietet ausgereifte
Formular-Plugins (Gravity Forms, WPForms, Formidable). Sie zu nutzen, wäre
schneller.

## Warum trotzdem eigen

Ein Formular dieser Plattform leistet mehr, als ein Formular-Plugin abbildet:

| Anforderung | Formular-Plugin | Eigene Engine |
|---|---|---|
| Einwilligungstext **mit Version** speichern | selten, meist nur Häkchen | verpflichtend |
| Rechtsgrundlage je Zweck erfassen | nein | verpflichtend |
| Nachweis: welcher Text galt zum Zeitpunkt der Erteilung | nein | verpflichtend |
| Felder aus einem versionierten Produktschema erzeugen | nein | Kernfunktion |
| Serverseitige Prüfung gegen dieselbe Regel wie der Kern | nein | ja |
| Eingang bei Ausfall des Kerns zwischenspeichern | nein | ja |
| Keine Speicherung von Personendaten in `wp_postmeta` | Plugins speichern genau dort | ausgeschlossen |
| Bot-Schutz ohne Cookies Dritter | meist reCAPTCHA | eigener Schutz |

Der letzte Punkt allein entscheidet: Formular-Plugins speichern Eingänge in der
WordPress-Datenbank. Das verletzt ADR-0001 an der empfindlichsten Stelle — dort,
wo die Personendaten zuerst entstehen.

## Entscheidung

Eine eigene Formular-Engine als Plugin `callidus-forms`.

- Formulardefinitionen kommen aus dem Domänenkern (versioniertes Produktschema).
- Eingaben werden **nicht** in WordPress gespeichert, sondern durchgereicht.
- Ausnahme: ein verschlüsselter Zwischenspeicher mit kurzer Frist, falls der
  Kern nicht erreichbar ist; er wird nach Zustellung geleert.
- Einwilligungen werden mit Zweck, Rechtsgrundlage, Text, Textversion und
  Zeitpunkt erfasst.
- Prüfregeln werden aus dem Kern bezogen, damit Website und Kern nie
  auseinanderlaufen.

## Konsequenzen

**Positiv:** Kein Personendatum in WordPress. Nachweisfähige Einwilligungen.
Neue Produkte brauchen kein neues Formular, nur ein neues Schema.

**Negativ:** Höherer Anfangsaufwand. Redaktionelle Anpassungen laufen über die
Schemapflege, nicht über einen Formularbaukasten — das ist bewusst so, weil ein
Pflichtfeld eine fachliche und keine gestalterische Entscheidung ist.
