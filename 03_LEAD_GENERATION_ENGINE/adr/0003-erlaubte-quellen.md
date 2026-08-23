# ADR-0003 — Nur erlaubte Quellen, keine Plattformautomatisierung

**Status:** entschieden · 2026-08-23

## Kontext

Der Auftrag nennt LinkedIn, Facebook, Instagram und YouTube als Leadquellen. Die
Nutzungsbedingungen dieser Plattformen untersagen automatisierte Erfassung ohne
Genehmigung ausdrücklich, und sie setzen das durch: Kontosperre,
Unterlassungsaufforderung, Klage.

Zusätzlich gilt die stehende Projektvorgabe: keine Automatisierung fremder
Portale durch Screen Scraping, Browser-Bots oder Credential Sharing ohne
ausdrückliche schriftliche Erlaubnis, technische Freigabe und rechtliche Prüfung.

## Entscheidung

Jede Quelle trägt eine Zulässigkeitsklasse:

| Klasse | Bedeutung |
|---|---|
| **A** | frei nutzbar |
| **B** | nutzbar unter Bedingungen (Speicherung, Anzeige, Weitergabe eingeschränkt) |
| **C** | nur nach schriftlicher Zusage des Betreibers |
| **D** | **nicht nutzbar** — automatisierte Erfassung untersagt |

Soziale Netzwerke sind Klasse D. Sie werden nicht als Quelle angelegt, sondern in
einer Ausschlussliste mit Begründung geführt.

`erlaubnis = UNGEKLAERT` verhindert den Recherchelauf **technisch**, nicht durch
Richtlinie.

## Begründung

- **Eine abschaltbare Datengrundlage ist kein Vermögenswert.** Bei zwei Personen
  ist ein Rechtsstreit mit einer Plattform existenziell.
- **Der umgekehrte Weg ist der bessere:** dort sichtbar sein und eingehende
  Anfragen verarbeiten. Eine eingehende Anfrage bringt eine Rechtsgrundlage mit,
  eine ausgelesene Adresse nicht.
- **Der Adressat der Recherche ist derselbe Mensch, der später unterschreiben
  soll.** Aggressive Erfassung verdirbt genau die Beziehung, die aufgebaut werden
  soll — in einem kleinen Revier spricht sich das herum.

## Konsequenzen

**Positiv:** Rechtssicher, ruf­schonend, dauerhaft nutzbar.

**Negativ:** Ansprechpartner müssen aus Impressum, Gespräch oder Verzeichnis
kommen, nicht aus Profilen. Das ist langsamer.

**Erlaubt bleibt:** die öffentliche Profil-URL als Feld speichern, wenn die
Website des Objekts sie verlinkt · ein Profil manuell aufrufen · dort Werbung
schalten und eingehende Anfragen verarbeiten.
