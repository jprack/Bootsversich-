# ADR-0010 — E-Mail als Kanal zur Produktquelle

**Status:** angenommen · 2026-08-21 · schließt offenen Punkt **A-01**

## Kontext

Der Austausch mit den Versicherern läuft über E-Mail. Der Vermittlerstatus ist
**Mehrfachagent**: mehrere Versicherer, in deren Auftrag. Zugelassene Märkte
sind Österreich und Deutschland.

Ein dokumentierter E-Mail-Prozess ist eine zulässige Verifikationsquelle. Der
Adapter wird also real gebaut, nicht gemockt — der Mock bleibt ausschließlich
für Tests.

## Entscheidung

E-Mail wird als **vollwertiger, auditierter Integrationskanal** umgesetzt, nicht
als Behelf neben einer „richtigen" Schnittstelle.

| Bestandteil | Festlegung |
|---|---|
| Korrelation | Eigene Vorgangsnummer in eckigen Klammern am Betreffanfang; zusätzlich `Message-ID` und `In-Reply-To` |
| Ausgehend | Strukturiertes Paket als PDF und CSV, Anlagen nur bei erzwungenem TLS |
| Eingehend | Dienstpostfach, Abholung durch den Worker, mehrstufige Zuordnung, unzuordenbare Mails erzeugen eine Aufgabe |
| Erfassung | Angebotsdaten werden strukturiert erfasst und durchlaufen dieselben Prüfregeln wie ein API-Import |
| Idempotenz | Schlüssel aus Vorgangsnummer, Versicherer und laufender Nummer |
| Kanalwahl | Eigenschaft der Entität `VERSICHERER`, keine globale Einstellung |

## Die Folge, die das Produkt verändert

**Es gibt keine Online-Tarifierung.** Die Website kann keine verbindliche Prämie
anzeigen. Damit verschiebt sich die entscheidende Kennzahl von der
Umwandlungsquote im Rechner zur **Antwortzeit bis zum Angebot** — und die ist
eine organisatorische Größe, keine technische.

Ob die Website eine unverbindliche Richtprämie anzeigt, ist damit eine offene
Produktentscheidung (**A-08**), nicht Teil dieser ADR.

## Die Folge aus dem Mehrfachagenten-Status

Eine Anfrage fächert sich in mehrere ausgehende Mails auf und sammelt mehrere
Angebote ein. Daraus folgt ein **Vergleichs- und Auswahlschritt mit
Pflichtbegründung**: Ohne erfasste Begründung lässt sich kein Angebot auswählen.

Das ist keine Bequemlichkeitsfunktion — die Empfehlung aus mehreren Angeboten
ist dokumentationspflichtig, und eine Begründung, die erst nachträglich entstehen
soll, entsteht nie.

## Geprüfte Alternativen

| Option | Bewertung |
|---|---|
| Auf eine API warten | Verschiebt den Produktivgang auf unbestimmte Zeit und macht die Plattform von einer Zusage abhängig, die niemand gegeben hat |
| Versichererportal automatisieren | Ohne schriftliche Erlaubnis rechtlich und betrieblich nicht tragbar. Untersagt |
| Eigener Mailserver mit eigenem MX | Betriebsaufwand, Spamabwehr und Zustellbarkeit stehen in keinem Verhältnis |
| **E-Mail als gestalteter Kanal** *(gewählt)* | Nutzt den vorhandenen, funktionierenden Geschäftsprozess und macht ihn nachweisbar |

## Konsequenzen

**Positiv**

- Der Produktivgang hängt an keiner fremden Zusage.
- Der Prozess entspricht dem, was die Versicherer heute schon tun — geringes Umstellungsrisiko.
- Ein Träger mit API kann später einzeln umgestellt werden, ohne die Domäne zu berühren.

**Negativ**

- Keine Sofortprämie auf der Website; die Umwandlung leidet.
- Der Posteingang ist ein eigenes Teilsystem mit eigenem Betriebsaufwand.
- Schweigen ist der Normalfall des Scheiterns: Ohne Fristüberwachung fällt ein
  verlorener Vorgang niemandem auf.
- Zustellbarkeit wird geschäftskritisch — siehe ADR-0011 und offenen Punkt A-09.

## Wann diese Entscheidung überholt wäre

Sobald ein Träger, der einen wesentlichen Teil des Geschäfts trägt, eine
belegte Schnittstelle anbietet. Dann wird für diesen Träger der Adapter
getauscht. Der Mischzustand ist der erwartete Normalfall, kein Übergang.
