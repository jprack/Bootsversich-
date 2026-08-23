# 10 — Dashboard und Kennzahlen

---

## 1. Die Leitkennzahl

> **Aktualitätsgrad** = Händler, deren tragende Angaben in den letzten zwölf
> Monaten bestätigt wurden ÷ Händler im Bestand.

Sie steht oben, allein, größer als alles andere — und sie ersetzt bewusst die
naheliegende Zahl „Anzahl Händler".

**Tragende Angaben** sind genau fünf: Anschrift des Hauptsitzes ·
Ansprechpartner · Markenvertretungen · Produktbereiche · `boote_pro_jahr`.
Bestätigt heißt: durch Selbstauskunft im Gespräch, im Besuchsbericht oder in
einer aktuellen Herstellerliste.

| Warum diese Zahl | |
|---|---|
| **Sie kann nicht abgeschrieben werden** | Sie entsteht nur aus gepflegten Beziehungen |
| **Sie fällt von selbst** | Ohne Arbeit sinkt sie jeden Monat — das ist die gewünschte Eigenschaft |
| **Sie bindet Vertrieb und Datenqualität** | Jeder Besuch hebt sie, jede Aussendung nicht |

**Zielwert:** über 80 % bei Klasse A und B, über 50 % im Gesamtbestand. Unter
70 % im Gesamtbestand meldet `D-54` an die Führung.

---

## 2. Vertriebsansicht

```
┌─ Händler ─────────────────────────── KW 38 ─── AT ──────┐
│                                                          │
│   Aktualitätsgrad gesamt      ████████████░░░░   74 %    │
│   davon Klasse A              ███████████████░   91 %    │
│   davon Klasse B              ████████████░░░░   77 %    │
│   davon Klasse C              ████████░░░░░░░░   52 %    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│   Bestand      248     Partner aktiv        31           │
│   Klasse A      19     davon ruhend          4  ⚠        │
│   Klasse B      74     Betreuung überfällig 11           │
│   Klasse C     155     davon Klasse A        2  ⚠        │
├──────────────────────────────────────────────────────────┤
│   Nächste Betreuung                                      │
│   ▸ Bootscenter Steinbach     A · 87 ↓ · 71 Tage         │
│   ▸ Marina Nordufer           A · 81 → · 58 Tage         │
│   ▸ Yachtwelt Süd             B · 63 ↑ · 118 Tage        │
├──────────────────────────────────────────────────────────┤
│   Cross-Selling offen                              7     │
│   ▸ Partner ohne eigenen Vertrag — die einfachsten       │
│     Abschlüsse im Bestand                                │
└──────────────────────────────────────────────────────────┘
```

Zwei Zeilen mit Warnzeichen: **ruhende Partner** und **überfällige A-Betreuung**.
Beides sind Vorstufen eines Verlusts, und beide sind noch umkehrbar.

---

## 3. Kennzahlen mit Definition und Fallstrick

| Kennzahl | Definition | Fallstrick |
|---|---|---|
| **Aktualitätsgrad** | Bestätigte tragende Angaben ÷ Bestand, je Klasse | Wer „bestätigt" weich definiert, bekommt 100 % und weiß nichts |
| **Anzahl Händler** | Organisationen mit Rolle `HAENDLER`, nicht `BEENDET` | **Steigt mit jeder Recherche.** Nie ohne Aktualitätsgrad zeigen |
| **Aktive Händler** | `pipeline_status = PARTNER_AKTIV` | Ohne `PARTNER_RUHEND` daneben schönt die Zahl |
| **Partnerhändler** | Aktive Kooperation mit unterzeichnetem Dokument | Deckt sich nicht zwingend mit „aktiv" — Differenz ist ein Befund |
| **Neue Händler** | Freigaben aus Modul 03 im Zeitraum | Sagt nichts über Qualität. Immer mit Klassenverteilung |
| **Händler nach Region** | Über den **Hauptsitz**, nicht über alle Standorte | Sonst zählt ein Betrieb mit drei Filialen dreifach |
| **Händler nach Marke** | Über laufende `HAENDLER_MARKE` | Ein Betrieb mit vier Marken erscheint viermal — **beabsichtigt**, aber zu kennzeichnen |
| **Top-Potenziale** | Händlerwert ≥ 70, noch kein Partner | Höchstens zehn zeigen |
| **Offene Aufgaben** | Nach Klasse und Alter | Ohne Altersbänder wertlos |
| **Aktive Kooperationen** | Status `AKTIV`, Laufzeit nicht abgelaufen | Abgelaufene ohne Kündigung sind der häufigste stille Fehler |
| **Vermittlungsquote** | Händler mit ≥ 1 Anfrage in 12 Monaten ÷ Partner | **Die härteste Zahl des Moduls** (§4) |
| **Betreuungstreue** | Kontakte innerhalb der Klassenfrequenz ÷ Soll | Misst uns, nicht den Händler |

---

## 4. Die Zahl, die niemand gern sieht

> **Vermittlungsquote** — wie viele der aktiven Partner haben in den letzten
> zwölf Monaten mindestens eine Anfrage geschickt?

Erfahrungsgemäß liegt diese Zahl in jungen Partnernetzen deutlich unter der
Erwartung. Sie ist trotzdem die wichtigste, weil sie die einzige ist, die den
Unterschied zwischen einer **unterschriebenen** und einer **funktionierenden**
Kooperation zeigt.

Zwei Ableitungen daraus, beide handlungsleitend:

| Beobachtung | Antwort |
|---|---|
| Viele Partner, niedrige Quote | Das Problem ist die Einführung, nicht die Gewinnung. `D-04` und `D-15` schärfen |
| Wenige Partner, hohe Quote | Das Modell trägt. Mehr gewinnen — die Kapazität erlaubt es (Kapitel 4.5) |

---

## 5. Führungsansicht — monatlich

| Block | Inhalt |
|---|---|
| **Aktualitätsgrad im Verlauf** | Zwölf Monate, je Klasse. **Ein fallender Verlauf ist der erste Warnhinweis überhaupt** |
| **Bestand nach Klasse** | Mit Wechseln des Monats, insbesondere A → B |
| **Kooperationen** | Neu, gekündigt, ruhend, mit Gründen |
| **Vermittlung** | Anfragen und Abschlüsse je Partner, Verteilung — nicht nur Summe |
| **Markenlandkarte** | Welche Marken sind erschlossen, welche fehlen ganz |
| **Reviere** | Händlerdichte gegen Bootsbestand — wo fehlt Präsenz |
| **Betreuungstreue** | Soll gegen Ist je Klasse |
| **Übersteuerungen** | Wie viele Klassen von Hand gesetzt, mit Begründung |

**Die Markenlandkarte ist die Zeile mit der größten strategischen Wirkung.** Eine
Marke, deren Händlernetz vollständig erschlossen ist, wirkt anders als zehn
einzelne Betriebe — und sie ist ein Argument gegenüber dem Hersteller.

---

## 6. Technische Regeln

| Regel | Grund |
|---|---|
| Alle Zahlen mit Stand und Zeitraum | Eine Zahl ohne Stichtag ist nicht überprüfbar |
| Regionalauswertung über den Hauptsitz | Sonst zählen Filialen mehrfach |
| Markenauswertung ausdrücklich als Mehrfachzählung gekennzeichnet | Ein Betrieb mit vier Marken ist vier Zeilen |
| Nächtlich vorberechnet | Kein Live-Neuberechnen bei Aufruf |
| Kein personenbezogener Leistungsvergleich bei zwei Personen | Eine Rangliste unter zweien ist eine Bewertung, keine Kennzahl |
| Jede Kennzahl hat genau eine hinterlegte Definition | Zwei Definitionen derselben Zahl sind schlimmer als keine |
