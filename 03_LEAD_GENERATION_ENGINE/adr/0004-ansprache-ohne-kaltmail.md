# ADR-0004 — Keine Kaltakquise per E-Mail

**Status:** entschieden · 2026-08-23 · offener Punkt **L-02**

## Kontext

Werbe-E-Mail ohne vorherige Einwilligung ist nach der diesem Konzept zugrunde
gelegten Rechtslage in Österreich (§ 174 TKG 2021) und Deutschland
(§ 7 Abs. 2 UWG) unzulässig — **auch gegenüber Unternehmen**. Österreich ist
zusätzlich beim Werbeanruf enger als Deutschland.

Damit fällt genau der Kanal weg, den übliche Lead-Werkzeuge als Kernfunktion
anbieten.

## Entscheidung

1. **Keine automatisierte Ansprache. Der Motor findet, der Mensch spricht.**
2. Die zulässigen Kanäle liegen als **Kanalmatrix in Daten** vor — je Land,
   Empfängerart und Rechtsgrundlage. Ein nicht erlaubter Kanal ist in der
   Oberfläche nicht erfassbar und von keiner Automation auslösbar.
3. Bis zur anwaltlichen Klärung (**L-02**) gilt die engere Auslegung für beide
   Mandanten.
4. Zur Newsletter-Engine besteht aus dem Rechercheraum **keine Verbindung** —
   auch keine gesperrte.
5. Ein Telefonanruf, der auf mutmaßliche Einwilligung gestützt wird, verlangt
   einen **vor** dem Anruf dokumentierten Sachbezug. Ein Score ist kein
   Sachbezug.

## Begründung

- **Technische Sperre statt Richtlinie.** Eine Richtlinie wird unter Druck
  gebrochen, eine fehlende Schnittstelle nicht.
- **Der Markt ist klein und persönlich.** Ein Massenanschreiben an alle
  Yachtclubs eines Sees spricht sich schneller herum als jede Empfehlung — in die
  falsche Richtung.
- **Kaltmail braucht Masse, um zu funktionieren.** Bei ~10³ Adressen je Land
  wäre der Ertrag gering und der Schaden dauerhaft.

## Konsequenzen

**Positiv:** Rechtlich haltbar, passend zur Zielgruppe, kein Rufschaden.

**Negativ:** Langsamer. Die Ansprache braucht Menschen und ist damit an die
Kapazität aus ADR-0006 gebunden. Post ist teurer als E-Mail.

**Folge für den Zuschnitt des Moduls:** Die Engine wird an ihrer **Auswahlgüte**
gemessen, nicht an ihrer Reichweite. Wenn nur 200 Gespräche im Jahr möglich sind,
entscheidet die Reihenfolge über den Erfolg — und genau dafür ist der Basiswert
gebaut.
