# 13 — Skalierung und Roadmap

---

## 1. Was von Beginn an stehen muss

Vier Dinge lassen sich später nicht nachrüsten, ohne den bis dahin aufgebauten
Bestand zu entwerten:

| Von Anfang an | Warum nicht nachrüstbar |
|---|---|
| **Trennung Rechtsträger / Standort** | Ein Bestand, der Filialen als Firmen führt, ist nachträglich nicht sauber zu entwirren — die Vorgänge hängen bereits an den falschen Datensätzen |
| **Historisierte Markenvertretungen** | Für vergangene Jahre ist nicht rekonstruierbar, wer wann welche Marke führte |
| **Herkunft und Stand an beurteilenden Feldern** | Ohne sie ist nach zwei Jahren nicht unterscheidbar, was Auskunft und was Schätzung war |
| **Getrennte Einwilligungszwecke** | Eine Sammelzustimmung lässt sich nicht nachträglich aufteilen |

Alles Übrige — Automatisierungsgrad, Zahl der Kennzahlen, Portal, Anreicherung —
darf wachsen.

---

## 2. Vier Ausbaustufen

### V1 — Österreich

| | |
|---|---|
| **Umfang** | Alle Händler in AT: Größenordnung 40–60 Betriebe mit Vertriebsrelevanz, insgesamt bis ~250 Datensätze mit Gebraucht- und Kleinbetrieben |
| **Ziel** | Aktualitätsgrad ≥ 80 % bei Klasse A und B, ≥ 50 % gesamt · 8–12 aktive Kooperationen |
| **Technik** | Ein Schema, ein Server, nächtliche Läufe. Kein Suchindex nötig |
| **Kapazität** | Passt (Kapitel 4.5), aber an der Obergrenze |

**Abnahme von V1 — sieben Punkte:**

1. Ein Betrieb mit drei Filialen ist **eine** Organisation mit drei Standorten.
2. Eine beendete Markenvertretung ist samt Grund und Zeitraum abfragbar.
3. Der Händlerwert nennt zu jedem Punkt seine Tatsache und seine Herkunft.
4. Eine Kooperation lässt sich ohne signiertes Dokument nicht aktivieren.
5. Eine vollständige Auskunft über einen Ansprechpartner — **einschließlich
   Besuchsberichten** — ist in unter zehn Minuten erzeugbar.
6. Der Aktualitätsgrad ist je Klasse darstellbar und fällt sichtbar, wenn nicht
   gepflegt wird.
7. **Ein Händler ohne Einwilligung erscheint in keinem Brevo-Export** — technisch
   geprüft, nicht organisatorisch zugesichert.

Punkt 1 ist der Test, der die tragende Entscheidung dieses Moduls prüft. Punkt 7
ist der, dessen Verletzung am teuersten wäre.

### V2 — Deutschland

| | |
|---|---|
| **Neu** | Zweiter Mandant, etwa das Zehnfache an Betrieben, regionale Markenstrukturen, Importeure häufiger |
| **Was bricht** | Nicht die Technik, sondern die **Betreuungskapazität**. Bei 2.000 Händlern und derselben Klassenverteilung wären es rund 4.000 Kontakte im Jahr — das Vierfache der Kapazität |
| **Antwort** | **Nicht alle Händler betreuen.** Regionale Auswahl nach Revier, Klasse C bewusst unbetreut lassen und nur erfassen |
| **Technik** | Volltextsuche, Lesereplikat für Kennzahlen |
| **Vorbedingung** | Aktualitätsgrad AT über 70 % |

**Die wichtigste Einsicht für V2:** Ein zehnmal größerer Markt bedeutet nicht
zehnmal mehr Betreuung, sondern **schärfere Auswahl**. Die Datenbank wächst
vollständig, die Betreuung wächst nach Kapazität. Der Aktualitätsgrad wird
deshalb ab V2 **je Klasse** geführt, nicht mehr nur gesamt — sonst wirkt der
unbetreute C-Bereich wie ein Qualitätsproblem, obwohl er eine Entscheidung ist.

### V3 — Schweiz

| | |
|---|---|
| **Die Hürde** | **Nicht der Datenschutz, sondern die Vermittlerzulassung** (L-06 aus Modul 03) |
| **Wichtige Unterscheidung** | Die **Datenbank** darf vor der Zulassung aufgebaut werden — Marktdaten über Betriebe sind keine Versicherungsvermittlung. Die **Ansprache mit Vermittlungsabsicht** darf es nicht |
| **Datenschutz** | CH ist Drittland nach DSGVO; zusätzlich gilt das Schweizer Datenschutzgesetz. Beherrschbar, aber vor dem ersten Ansprechpartner zu klären |
| **Reihenfolge** | Marktdaten erfassen → Zulassung → Rechtsprüfung → Mandant → Ansprache |

Diese Reihenfolge weicht bewusst von Modul 03 ab, wo „Zulassung zuerst" gilt.
Der Grund: Dort ging es um **Ansprache**, hier um **Marktkenntnis**. Eine
Händlerlandkarte der Schweiz ist auch ohne Zulassung nützlich — für die
Verhandlung mit Herstellern und Versicherern. Personenbezogene Ansprechpartner
werden dabei **nicht** erfasst, solange keine Ansprache zulässig ist; das hält
die Verarbeitung auf Betriebsdaten und damit außerhalb der DSGVO.

### V4 — Europa

| | |
|---|---|
| **Neu** | Mittelmeerreviere: Kroatien, Italien, Griechenland, Spanien |
| **Was sich ändert** | **Charter dominiert statt Handel.** Die Klassenlogik verschiebt sich: Ein Charterbetrieb mit 30 Booten ist dort wichtiger als ein Händler mit 10 |
| **Struktur** | Mandant je Rechtsraum. Reviere werden wichtiger als Landesgrenzen |
| **Nutzen vor der Vermittlung** | Für **Bestandskunden** aus AT und DE ist die Mittelmeer-Infrastruktur schon vorher relevant — Fahrtgebiet Mittelmeer steht im Tarifwerk. Das ist ein anderer Zweck und braucht eine eigene Begründung |

---

## 3. Wo die Technik an Grenzen stößt

| Bestand | Was bricht | Antwort |
|---|---|---|
| ~500 Händler | nichts | — |
| ~2.000 | Listen unübersichtlich, Suche langsam | Volltextindex, Filter nach Revier, Klasse, Marke |
| ~10.000 | Markenlandkarte und Kennzahlen langsam | Vorberechnung, Lesereplikat |
| beliebig | **Betreuungskapazität** | Keine technische Antwort |

**Die letzte Zeile ist wieder die einzige, die zählt.** Sie wird bei 250
Datensätzen erreicht, nicht bei 10.000.

---

## 4. Roadmap

### Welle 0 — vor der ersten Zeile Code

| Schritt | Ergebnis | Braucht Entwickler |
|---|---|---|
| **Markenkatalog anlegen** | Welche Marken gibt es im Zielmarkt, welche sind Premiumwerften (mit Beleg) | nein |
| **Drei Herstellerverzeichnisse auswerten** | Das Händlernetz von AT fast vollständig | nein |
| **Interessenabwägung erweitern** (D-03) | Freigegebene Grundlage für die Betreuung | nein |
| **Einwilligungstexte** für Newsletter und Messung (D-02) | Zwei getrennte Texte | nein |

**Der Markenkatalog ist der beste Startpunkt des ganzen Moduls.** Er kostet
wenige Tage, erschließt über die Herstellerverzeichnisse den Großteil des
Händlernetzes und ist zugleich Voraussetzung dafür, dass das Tarifwerk den
Premiumwerften-Nachlass anwenden kann.

### Welle 1 — Fundament

Organisation mit Rolle `HAENDLER` · `ROLLENPROFIL_HAENDLER` · `STANDORT` ·
`MARKE` und `HAENDLER_MARKE` mit Historie · Herkunft und Stand an beurteilenden
Feldern · Händlerakte in einem Aufruf · Regeln `D-01`, `D-03`, `D-12`, `D-13`.

> **Ergebnis:** Händler kommen aus der Recherche herein und werden sauber
> geführt. Klasse und Wert fehlen noch — das ist verkraftbar.

### Welle 2 — Steuerung

`HAENDLERWERT` mit Herleitung · Klassifizierung mit Übersteuerung ·
Betreuungsfrequenzen · Aktualitätsgrad · `KOOPERATION` mit Dokumentbindung ·
Pipeline mit Übergangsmatrix · Regeln `D-11`, `D-14`, `D-15`, `D-41`.

### Welle 3 — Wirkung

Veranstaltungen und Teilnahmen · Besuchsberichte als Formular · Cross-Selling
(Gruppe 5) · Marketingübergabe mit getrennten Einwilligungen · Markenlandkarte ·
Vermittlungsquote.

### Welle 4 — Ausbau

Zweiter Mandant · Dealer Hub · Volltextsuche · Anreicherungsvorschläge aus
Herstellerlisten (nach L-05).

---

## 5. Priorisierung — die vier Fragen des Auftrags

### Welche Händler zuerst?

| Rang | Auswahl | Begründung |
|---|---|---|
| **1** | Vertragshändler von **Premiumwerften** im Hauptrevier | Höchste Versicherungssummen, und der Tarifnachlass macht das Angebot konkret |
| **2** | Händler mit **Neubootanteil über 50 %** | Jeder Verkauf ist eine Erstversicherung — kein Verdrängungswettbewerb |
| **3** | Händler mit **Charter- oder Winterlagerbetrieb** | Doppelter Anlass: Vermittlung und eigener Bedarf |
| **4** | Händler mit **mehreren Standorten** | Eine Beziehung, mehrere Reviere |
| **5** | Reine Gebrauchtboothändler | Relevant, aber ohne festen Kaufmoment im Jahresrhythmus |
| **nicht zuerst** | Betriebe mit Produktbereich `VERSICHERUNG` | Anderer Gesprächseinstieg, längerer Weg |

### Welche Regionen zuerst?

Nach **Revier**, nicht nach Bundesland: Salzkammergut und die großen Seen zuerst,
Bodensee und Neusiedler See danach, Binnenreviere ohne nennenswerten Bestand
zuletzt. Grund: Der Bootsbestand sammelt sich an Gewässern, und ein Betreuer
schafft an einem Tag ein Revier, nicht ein Bundesland.

### Welche Marken zuerst?

| Rang | Auswahl | Begründung |
|---|---|---|
| **1** | Marken der Premiumwerften-Liste des Tarifwerks | Direkter Prämienvorteil, belegbar |
| **2** | Marken mit dichtem Händlernetz im Zielmarkt | Ein Verzeichnis erschließt viele Betriebe |
| **3** | Segelmarken im Mittelmeer-Charterbereich | Anschluss an das vorhandene Charterprodukt |
| **4** | Motorenmarken | Erschließen Servicebetriebe, aber ohne Kaufmoment |

### Welche Kooperationspartner zuerst?

| Rang | Partner | Warum |
|---|---|---|
| **1** | Ein A-Händler mit **eigenem Versicherungsbedarf** | Beide Seiten des Geschäfts in einem Gespräch — der wahrscheinlichste erste Abschluss |
| **2** | Ein Betrieb, der bereits einen Kunden geschickt hat | Die Beziehung besteht schon, nur ohne Vereinbarung |
| **3** | Ein Hersteller oder Importeur | Wirkt auf das ganze Netz, dauert aber lange — nicht als erstes |
| **4** | Ein Verband | Reichweite ohne Verkaufsdruck, langsamste Entscheidung |

**Der erste Partner sollte klein genug sein, dass ein Fehler nicht wehtut, und
groß genug, dass der Erfolg zitierbar ist.** Die erste Vereinbarung ist die
Vorlage für alle folgenden — und der erste Beleg dafür, dass die Abläufe im
Alltag tragen.

---

## 6. Risiken

| ID | Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|---|
| **DR-01** | Filialen werden als eigene Firmen geführt | Doppelte Zählung, gespaltene Historie, falsche Provisionen | Standortmodell ab Welle 1, Prüfung `D-23` |
| **DR-02** | Der Bestand wächst schneller als die Betreuung | Datenbank ohne Beziehung, Aktualitätsgrad fällt | Klassenfrequenzen an die Kapazität gekoppelt (Kapitel 4.5) |
| **DR-03** | Geschätzte Werte werden zu Tatsachen | Der Vertrieb fährt jahrelang an die falschen Adressen | Herkunft an jedem beurteilenden Feld, Schätzungen bewerten nicht |
| **DR-04** | Kooperation ohne unterzeichnetes Dokument aktiv | Provisionsansprüche und Datenzugriff ohne Grundlage | Technische Bedingung, nicht Richtlinie |
| **DR-05** | Adressen ohne Einwilligung im Newsletter | Abmahnung, Rufschaden im kleinen Markt | Prüfung vor jedem Export, getrennte Zwecke |
| **DR-06** | Klassen werden übersteuert, bis alle A sind | Klassifizierung wertlos, Kapazität überzogen | Pflichtbegründung, monatlicher Bericht, Schwelle 15 % |
| **DR-07** | Besuchsberichte werden nicht geschrieben | Aktualitätsgrad fällt, Wissen bleibt in Köpfen | Formular mit fünf Feldern, Pflichtabschluss der Aufgabe |
| **DR-08** | Besuchsberichte enthalten Unhaltbares | Haftungsfall bei Auskunftsersuchen | Die Vorlese-Probe (Kapitel 12.5) |
| **DR-09** | Markenwechsel bleiben unbemerkt | Falsche Klassen, veraltete Landkarte, verlorener Nachlass | `D-21`, `D-22`, quartalsweise Herstellerlisten |
| **DR-10** | Recherche vor der Zulassung in CH mit Personenbezug | Verarbeitung ohne Zweck | V3: Betriebsdaten ja, Ansprechpartner nein |

---

## 7. Empfehlung

| Sofort | Warum |
|---|---|
| **Markenkatalog anlegen, Premiumwerften mit Beleg** | Erschließt das Händlernetz und macht den Tarifnachlass anwendbar. Braucht keinen Entwickler |
| **Drei Herstellerverzeichnisse auswerten** | Der schnellste Weg zu einem vollständigen Bestand |
| **Interessenabwägung erweitern** (D-03) | Vorlauf nötig, verhindert später Stillstand |
| **Einwilligungstexte trennen** (D-02) | Newsletter und Messung sind zwei Zwecke |

| Bewusst später | Warum |
|---|---|
| Dealer Hub | Braucht erst gefüllte Stammdaten und laufende Kooperationen |
| Provisionsabrechnung | Zahlungsdaten fehlen (C-05) |
| Zweiter Mandant | Erst ab 70 % Aktualitätsgrad in AT |
| Ausgefeilte Anreicherung | Der Besuchsbericht liefert bessere Daten als jede Recherche |
