# ADR-0001 — Kontakt, Kunde, Organisation und Lead sind vier Entitäten

**Status:** vorgeschlagen · 2026-08-22

## Kontext

Der naheliegende Entwurf kennt einen „Kunden" mit einem Statusfeld
(Interessent → Kunde). Er ist einfacher, schneller gebaut und in diesem
Geschäft falsch.

## Die vier Fälle, an denen ein einziger Datensatz scheitert

| Fall | Warum ein Datensatz nicht genügt |
|---|---|
| **Ehepaar mit gemeinsamer Yacht** | Ein Vertrag, zwei Personen, unterschiedliche Rollen (Versicherungsnehmer, mitversichert). Bei einem Datensatz verliert man eine der beiden Personen |
| **Händler, der selbst versichert ist** | Eine Organisation ist gleichzeitig Vertriebspartner und Kunde, und ihr Geschäftsführer ist ein Kontakt. Drei Beziehungen, ein Unternehmen |
| **Anfrage ohne identifizierte Person** | Ein Lead entsteht mit einer E-Mail-Adresse und einem Bootstyp. Wer dafür sofort einen Kontakt anlegt, erzeugt Dubletten, sobald die Person schon existiert |
| **Firmenboot mit wechselnden Nutzern** | Die Organisation hält den Vertrag, die Ansprechpartner wechseln. Personenwechsel darf den Vertrag nicht berühren |

## Entscheidung

```
KONTAKT       natürliche Person, zentrale Identität
ORGANISATION  juristische Person, mit Rollen (Händler, Club, Partner, …)
KUNDE         wirtschaftliche Einheit, hält Verträge
LEAD          vertriebliche Absicht, verweist optional auf Kontakt
```

Verbunden über `KUNDE_KONTAKT` (mit Rolle) und `KONTAKT_ORGANISATION` (mit
Funktion). `LEAD.kontakt_id` ist ausdrücklich optional.

## Konsequenzen

**Positiv:** Alle vier Fälle sind abbildbar. Personenwechsel berühren Verträge
nicht. Leads entstehen ohne verfrühte Identifikation. Die Dublettenprüfung
findet an einer Stelle statt.

**Negativ:** Vier Tabellen statt einer. Jede Abfrage braucht Verbünde. Die
Oberfläche muss den Unterschied verständlich machen — der Innendienst denkt
zunächst in „Kunden", nicht in vier Begriffen.

**Gegenmaßnahme zum Aufwand:** Die Kundenakte führt alle vier wieder zusammen.
Wer im Alltag arbeitet, sieht die Trennung nicht — sie wirkt im Modell, nicht
auf dem Bildschirm.

## Wann diese Entscheidung falsch wäre

Bei einem reinen Privatkundengeschäft ohne Firmenkunden, ohne Partnernetz und
ohne gemeinsam gehaltene Objekte. Keine dieser drei Bedingungen trifft hier zu.
