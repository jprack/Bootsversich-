# 09 — Dashboards und Reporting

## 1. Ein Dashboard ist eine Handlungsaufforderung

Der häufigste Fehler: ein Dashboard, das den Zustand zeigt. Das nützt niemandem
im Alltag. Ein brauchbares Dashboard beantwortet **eine** Frage:

> Was soll ich als Nächstes tun — und warum ausgerechnet das?

Deshalb gilt für jede Kachel: Sie führt zu einer Liste, die Liste führt zu einem
Datensatz, der Datensatz hat eine Aktion. Eine Kennzahl ohne diesen Weg ist
Dekoration und wird entfernt.

---

## 2. Vertriebs-Dashboard — der tägliche Arbeitsplatz

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Guten Morgen, Marc.        Donnerstag, 22. August 2026                  │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────────┤
│ Heute fällig │  Überfällig  │ Neue Leads   │ Verlängerung │  Pipeline   │
│      14      │      3       │      5       │  47 in 90 T. │  86.400 €   │
│              │   ▲ +2       │  2 unbearb.  │  davon 6 VIP │  ▲ 12 %     │
├──────────────┴──────────────┴──────────────┴──────────────┴─────────────┤
│                                                                          │
│  NEXT BEST ACTIONS                                                       │
│  ─────────────────────────────────────────────────────────────────────  │
│  99 │ Rückholgespräch: Nordwind Charter GmbH      A-25 │ überfällig      │
│     │ Kündigung eingegangen · Wert 78 · 14.280 €                        │
│  98 │ Angebot AN-2026-0864 läuft am 25.08. ab     A-15 │  in 3 Tagen     │
│     │ Kunde hat zweimal geöffnet, nicht reagiert                        │
│  84 │ Nachfolgeboot? Familie Berger               A-41 │  heute          │
│     │ Boot verkauft am 19.08. · Risiko von 24 auf 58 gestiegen          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  ⚠ 3 Angebotsanfragen ohne Antwort über der Zusagezeit                   │
│  ⚠ 1 Vertrag ohne aktives Objekt                                        │
└──────────────────────────────────────────────────────────────────────────┘
```

| Element | Warum es hier steht |
|---|---|
| Tagesliste mit Score **und Begründung** | Ohne Begründung wird die Reihenfolge ignoriert |
| Regelcode je Aufgabe | Nachvollziehbar, welche Automatik sie erzeugt hat |
| Wirtschaftlicher Wert je Zeile | Trennt das Wichtige vom Dringenden |
| Verlängerungen in 90 Tagen, VIP hervorgehoben | Der Bestand ist wertvoller als das Neugeschäft |
| Warnzeilen unten | Was ohne Zutun stillsteht: unbeantwortete Träger, verwaiste Verträge |

**Die zweite Zeile jeder Aufgabe ist wichtiger als die erste.** „Rückholgespräch"
sagt nichts; „Kündigung eingegangen, Wert 78, 14.280 €" sagt alles.

---

## 3. Bestands-Dashboard

| Kachel | Kennzahl | Führt zu |
|---|---|---|
| Aktive Verträge | Anzahl, Veränderung zum Vormonat | Vertragsliste |
| Vertragsvolumen | Jahresprämie brutto, nach Sparte | Aufschlüsselung |
| Durchschnittsprämie | je Sparte und Mandant | Ausreißerliste |
| Bootsbestand | Anzahl nach Typ und Revier | Bootsliste |
| Verlängerungspipeline | Fällig in 30, 60, 90 Tagen | Verlängerungsvorgänge |
| Kündigungsquote | rollierend 12 Monate | Kündigungen mit Grund |
| Verträge ohne Objekt | Anzahl | Klärungsliste |
| Boote ohne Vertrag | Anzahl | **Cross-Selling-Liste** |

Die letzte Zeile ist die wertvollste im ganzen Dashboard: Jedes Boot ohne
passenden Vertrag ist ein Abschluss, den es noch nicht gibt.

---

## 4. Marketing-Dashboard

| Kachel | Kennzahl | Besonderheit |
|---|---|---|
| Leads im Zeitraum | nach Kanal | Aus eigenen Daten, nicht aus einem Messskript |
| Kosten je Lead | Budget ÷ Leads, je Kampagne | Nur mit gepflegtem Kampagnenbudget belastbar |
| Kosten je Abschluss | Budget ÷ gewonnene Leads | Die eigentliche Steuerungsgröße |
| Trichter | Besuch → Anfrage → Angebot → Abschluss | Zeigt, **wo** es bricht |
| Newsletter-Wirkung | Öffnung, Klick, daraus entstandene Leads | Nicht Öffnungsrate allein — die misst nichts |
| Einwilligungsbestand | erteilt, widerrufen, Nettoentwicklung | Ein schrumpfender Bestand ist ein Frühwarnsignal |
| Frequenzstand | Ansprachen je Kontakt im Quartal | Schützt vor Ermüdung |

**Die Attribution stammt aus den eigenen Daten**, nicht aus einer Skriptmessung.
Ein Lead trägt `quelle_detail` und die rohen `utm_*`-Werte; ein gewonnener Lead
trägt zusätzlich `kunde_id`. Damit ist die Kette von der Anzeige bis zur Police
lückenlos — unabhängig von Werbeblockern und Einwilligungsbannern.

---

## 5. Partner-Dashboard

| Sicht | Für uns | Für den Partner |
|---|---|---|
| Empfehlungen | je Partner, mit Umwandlungsquote | nur eigene |
| Abschlüsse aus Empfehlungen | Anzahl und Volumen | nur eigene |
| Provisionsvolumen | gesamt und je Partner | nur eigenes |
| Reaktionszeit | wie schnell **wir** auf Empfehlungen reagieren | sichtbar — das schafft Vertrauen |
| Schlafende Partner | ohne Empfehlung seit 180 Tagen | — |
| Auftragsdurchlauf | bei Dienstleistern | nur eigene |

Die vierte Zeile ist ungewöhnlich und wichtig: Der Partner sieht, wie schnell
wir auf **seine** Empfehlung reagieren. Ein Partner, dessen Empfehlungen
liegenbleiben, empfiehlt nicht wieder.

---

## 6. Führungs-Dashboard

| Kennzahl | Definition | Zielrichtung |
|---|---|---|
| Bestandsentwicklung | Aktive Verträge und Volumen im Zeitverlauf | Die eine Zahl, die zählt |
| Nettowachstum | Neugeschäft minus Abgang | Wachstum ohne Abgangsbetrachtung ist eine Illusion |
| Erneuerungsquote | verlängert ÷ fällig | Unter 85 % ist der Prozess das Problem, nicht der Preis |
| Kundenwert im Zeitverlauf | Mittelwert und Verteilung | |
| Kosten je Abschluss nach Kanal | | Steuert das Budget |
| **Antwortzeit bis zum Angebot** | Anfrage bis Angebot beim Kunden | **Leitkennzahl** seit der E-Mail-Anbindung (ADR-0010) |
| Reaktionszeit auf Leads | Eingang bis Erstkontakt | Wirkung folgt Geschwindigkeit |
| Indikationsgüte | Anteil Angebote innerhalb der gezeigten Spanne | Ziel > 80 %, sonst Tarifwerk überarbeiten |
| Automatisierungsgrad | automatisch erzeugte ÷ alle Aufgaben | Steigt er nicht, arbeitet das System nicht mit |

---

## 7. Kennzahlendefinitionen

Jede Kennzahl braucht eine Definition, sonst rechnet jeder anders.

| Kennzahl | Formel | Fallstricke |
|---|---|---|
| **Lead-Umwandlungsquote** | Leads mit `status = GEWONNEN` ÷ Leads im Zeitraum | Nach **Eingangs**monat des Leads, nicht nach Abschlussmonat. Sonst wandern Zahlen rückwirkend |
| **Reaktionszeit** | `erstkontakt_am − erstellt_am`, Median | Median, nicht Mittelwert. Ein Ausreißer verfälscht sonst alles |
| **Antwortzeit bis Angebot** | Angebot beim Kunden − Anfrage, Median, je Träger | Je Träger, sonst verdeckt ein schneller Träger einen langsamen |
| **Vertragsvolumen** | Summe `praemie_brutto` der geltenden Versionen aktiver Verträge | Nur die **geltende** Version, sonst wird die Historie mitgezählt |
| **Erneuerungsquote** | verlängert ÷ im Zeitraum fällig | Umdeckungen zählen als verlängert, nicht als Abgang und Neugeschäft |
| **Kündigungsquote** | gekündigt ÷ Bestand zu Periodenbeginn | Ohne Umdeckungen |
| **Kosten je Lead** | Kampagnenbudget ÷ zugeordnete Leads | Nur bei gepflegtem Budget |
| **Kosten je Abschluss** | Kampagnenbudget ÷ gewonnene Leads | Erst nach der typischen Vertriebsdauer belastbar |
| **Bestandsentwicklung** | Aktive Verträge zum Stichtag | Stichtag, nicht Durchschnitt |
| **Partner-Umwandlungsquote** | gewonnene ÷ empfohlene Leads je Partner | Erst ab 10 Empfehlungen aussagekräftig |
| **Indikationsgüte** | Angebote innerhalb der Spanne ÷ Angebote mit Indikation | Erst ab Welle 2 messbar |
| **Aufgabenerledigung** | erledigt innerhalb der Frist ÷ fällige Aufgaben | Getrennt je Regel — zeigt unwirksame Regeln |

---

## 8. Kohorten und Zeitachsen

Zwei Dinge, die aus einem Berichtswesen ein Steuerungsinstrument machen:

**Kohortenbetrachtung.** Kunden, die im selben Quartal gewonnen wurden, werden
gemeinsam über die Zeit verfolgt: Wie viele sind nach zwei Jahren noch da? Wie
entwickelt sich ihr Wert? Das beantwortet die Frage, ob ein Kanal **gute** oder
nur **viele** Kunden bringt.

**Bewegung statt Bestand.** Ein Risikoscore von 45 sagt wenig. Ein Score, der in
sechs Wochen von 24 auf 45 gestiegen ist, ist ein Alarm. Jede Kennzahl im
Führungs-Dashboard trägt deshalb ihre Veränderung, nicht nur ihren Wert.

---

## 9. Technische Umsetzung

| Regel | Begründung |
|---|---|
| Auswertungen laufen auf einer **Read Replica** | Ein Bericht darf den Betrieb nie ausbremsen |
| Kennzahlen werden nachts vorberechnet | Interaktive Aggregation über den vollen Bestand skaliert nicht |
| Dashboards lesen aus Zeitreihen, nicht aus Betriebstabellen | Die Tagesliste ist die Ausnahme: sie ist operativ und live |
| Definitionen liegen als Datensatz, nicht im Code | Eine geänderte Definition muss versioniert und nachvollziehbar sein |
| Historische Zahlen ändern sich nie rückwirkend | Ein Bericht von gestern muss morgen dasselbe zeigen |
| Keine personenbezogenen Daten in Telemetrie | Auswertungen sind aggregiert und pseudonymisiert |

**Ausnahme mit Absicht:** Die Tagesliste liest live aus dem Betriebssystem. Sie
ist kein Bericht, sondern Arbeitsvorrat — eine über Nacht berechnete Tagesliste
wäre am Vormittag falsch.

---

## 10. Berichte und Rhythmus

| Bericht | Empfänger | Rhythmus | Inhalt |
|---|---|---|---|
| Tagesliste | jeder Benutzer | täglich, live | Priorisierte Aufgaben |
| Verlängerungsvorschau | Vertrieb, Führung | wöchentlich | Fällig in 30/60/90 Tagen, nach Wert sortiert |
| Vertriebsbericht | Führung | monatlich | Leads, Umwandlung, Volumen, Reaktionszeiten |
| Marketingbericht | Marketing, Führung | monatlich | Kanäle, Kosten je Lead und Abschluss, Trichter |
| Partnerbericht | je Partner | quartalsweise | Eigene Empfehlungen, Abschlüsse, Provision |
| Bestandsbericht | Geschäftsführung | quartalsweise | Entwicklung, Kohorten, Erneuerungsquote |
| Regelwirkung | Administration | monatlich | Auslösungen, Erledigungsquote, unwirksame Regeln |
| Datenqualität | Innendienst | monatlich | Fehlende Pflichtfelder, veraltete Zeitwerte, Dublettenkandidaten |
| Rechteprüfung | Administration | quartalsweise | Wer hat was, seit wann, zuletzt benutzt wann |

Der Bericht **Regelwirkung** ist der, den man vergisst und am dringendsten
braucht. Eine Regel, deren Aufgaben regelmäßig ohne Ergebnis geschlossen werden,
erzeugt Rauschen — und Rauschen untergräbt das Vertrauen in alle anderen Regeln.
