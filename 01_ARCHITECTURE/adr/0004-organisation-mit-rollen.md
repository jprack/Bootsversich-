# ADR-0004 — Händler, Club und Partner als Rollen einer Organisation

**Status:** vorgeschlagen · 2026-08-21

## Kontext

Der Auftrag nennt `Händler`, `Bootsclub` und `Partner` als eigene Entitäten und
Dealer Hub, Club Hub und Partnerportal als eigene Module. Die Frage ist, ob
daraus drei Datenstrukturen folgen.

## Beobachtung

Alle drei sind: eine juristische Person mit Namen, Rechtsform, Anschrift,
Ansprechpartnern, einer Vereinbarung, einem Portalzugang und einer
Abrechnungsregel. Sie unterscheiden sich in **Konditionen, Sichtbarkeit und
Portalansicht** — nicht im Aufbau.

Und sie überschneiden sich: Ein Händler, der auch vermittelt, ist Händler
**und** Makler. Eine Marina kann Club **und** Partner sein.

## Geprüfte Optionen

| Option | Bewertung |
|---|---|
| Drei getrennte Tabellen | Drei Adressverwaltungen, drei Kontaktzuordnungen, dreifache Pflege. Eine Organisation mit zwei Rollen müsste doppelt angelegt werden — mit garantiert auseinanderlaufenden Stammdaten |
| Eine Tabelle mit Typfeld | Besser, aber Mehrfachrollen bleiben unmöglich |
| **Organisation + Organisationsrolle** *(gewählt)* | Stammdaten einmal, Rollen mehrfach, zeitlich begrenzbar |

## Entscheidung

```
ORGANISATION            (Stammdaten, einmal je juristischer Person)
      │ 1
      │ N
ORGANISATIONSROLLE      rolle: HAENDLER | CLUB | PARTNER | MAKLER | LIEFERANT
      │                 gueltig_ab, gueltig_bis, portalzugang
      │ 1
      │ N
VEREINBARUNG            Konditionen und Provision je Rolle
```

Die drei Module M4, M5 und M6 bleiben als **Portalansichten** bestehen. Sie
unterscheiden sich in Oberfläche, Rechten und Kennzahlen — nicht im Datenmodell.

## Konsequenzen

**Positiv**

- Stammdaten werden einmal gepflegt.
- Mehrfachrollen sind möglich, ohne Datensätze zu verdoppeln.
- Eine Rolle kann enden, ohne die Organisation zu löschen — wichtig für
  Historie und Abrechnung.
- M5 und M6 sind nach M4 überwiegend Konfiguration. Das ist der Grund, warum
  Welle 3 der Roadmap so kompakt ausfällt.

**Negativ**

- Abfragen brauchen einen Verbund über die Rollentabelle.
- Rollenspezifische Felder (etwa die Vermittlerregistrierung beim Makler) liegen
  an der Rolle, nicht an der Organisation. Das ist gewöhnungsbedürftig, aber
  fachlich richtig: Die Registrierung gehört zur Vermittlereigenschaft, nicht
  zum Unternehmen an sich.

## Wann diese Entscheidung falsch wäre

Wenn sich die drei Typen in mehr als der Hälfte ihrer Felder unterschieden.
Geprüft: Sie teilen alle Stammdatenfelder; rollenspezifisch sind je zwei bis
vier Felder. Die Entscheidung ist damit belegt, nicht bloß plausibel.
