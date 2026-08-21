# ADR-0007 — Reichweitenmessung nur mit Einwilligung

**Status:** vorgeschlagen · 2026-08-21

## Kontext

Marketing braucht Messung. Google Analytics 4 ist der Standard, überträgt aber
Daten in ein Drittland und setzt Kennungen, die eine Einwilligung erfordern.
Ohne Einwilligung fehlen Daten; mit Einwilligungsbanner sinkt die
Zustimmungsquote und damit die Datenqualität.

## Entscheidung

**Zweistufig.**

| Stufe | Verfahren | Einwilligung |
|---|---|---|
| **1 — immer** | Serverseitige, aggregierte Messung im eigenen Betrieb: Seitenaufrufe, Verweisquelle, Kampagnenparameter, Trichterstufen. Keine geräteübergreifende Kennung, keine Cookies, IP-Adresse gekürzt und nicht gespeichert | nicht erforderlich |
| **2 — nach Zustimmung** | Google Analytics 4, Google Ads Conversion, Maps, LinkedIn Insight | erforderlich |

**Stufe 1 liefert die geschäftlich wichtigen Zahlen** — Leads je Kanal, Kosten
je Lead, Abbruchpunkte im Trichter — weil diese Kennzahlen aus den eigenen
Fachdaten stammen und nicht aus einem Messskript. Stufe 2 liefert Zusätzliches:
Zielgruppenmerkmale, geräteübergreifende Wege, Optimierung der Anzeigenausspielung.

## Konsequenzen

**Positiv**

- Ohne Einwilligung entsteht keine Messlücke bei den entscheidenden Zahlen.
- Die Attribution stammt aus den eigenen Daten und ist damit belastbarer als
  eine Skriptmessung, die von Werbeblockern beeinflusst wird.
- Die Drittlandbewertung betrifft nur Stufe 2 und damit einen entbehrlichen Teil.

**Negativ**

- Stufe 1 muss gebaut werden.
- Zahlen aus Stufe 1 und Stufe 2 weichen voneinander ab — das ist zu erklären,
  nicht zu verbergen: Stufe 1 misst Vorgänge, Stufe 2 misst Sitzungen.

## Empfehlung zur Prüfung

Vor dem Ausbau von Stufe 2 ist zu prüfen, ob **Matomo im Eigenbetrieb** den
Bedarf deckt. Es liegt in der EU, benötigt in einer Konfiguration ohne Cookies
keine Einwilligung und würde die Drittlandfrage vollständig entfallen lassen.
Für Anzeigenoptimierung bleibt Google Ads dennoch erforderlich.

## Verbindlich

Kein Messskript lädt vor der Zustimmung. Kein Einwilligungsbanner mit
irreführender Gestaltung: Ablehnen ist so leicht erreichbar wie Zustimmen.
