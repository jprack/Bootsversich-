# 11 — Dashboard und Kennzahlen

---

## 1. Die Leitkennzahl

> **Abdeckungsgrad** = erfasste und beurteilte Objekte ÷ geschätzte
> Grundgesamtheit, je Zielgruppe und Land.

Sie steht oben, allein, größer als alles andere. Begründung in Kapitel 1.2: Der
Markt ist endlich. Eine Kennzahl „neue Leads pro Monat" belohnt in einem
endlichen Markt genau das falsche Verhalten — nämlich Dubletten und
Randzielgruppen.

**Zwei Eigenschaften machen sie ehrlich:**

1. Der Nenner ist eine **Schätzung mit Datum und Quelle**, nicht eine Zahl. Er
   wird angezeigt als „ca. 140, erhoben 2026-10, Quelle: Verbandsliste + eigene
   Zählung". Ändert er sich, ändert sich der Grad — das ist richtig so.
2. **Beurteilt zählt, nicht bearbeitet.** Ein Objekt der Klasse D, das bewusst
   ruht, ist beurteilt. Ein unbekanntes ist es nicht.

---

## 2. Vertriebsansicht

Für die beiden Personen, die täglich damit arbeiten.

```
┌─ Akquise ─────────────────────────── Woche 38 ─── AT ───┐
│                                                          │
│   Abdeckung Z1 Handel        ████████████░░░░   74 %     │
│   Abdeckung Z2 Infrastruktur ████████░░░░░░░░   52 %     │
│   Abdeckung Z3 Gemeinschaft  █████░░░░░░░░░░░   31 %     │
│   Abdeckung Z4 Betrieb       ██████████░░░░░░   66 %     │
│                                                          │
├──────────────────────────────────────────────────────────┤
│   Heute fällig            12      Rückstau         31    │
│   In Prüfung wartend      47      davon > 14 Tage   9    │
├──────────────────────────────────────────────────────────┤
│   Nächste Gespräche                                      │
│   ▸ Marina Attersee          A · 78 · Termin 25.09.      │
│   ▸ Bootscenter Traunsee     A · 81 · Nachfassen fällig  │
│   ▸ YC Mondsee               B · 62 · Sitzung 04.10.     │
├──────────────────────────────────────────────────────────┤
│   Hauptfälligkeiten in 120 Tagen                    6    │
│   ▸ die wirtschaftlich wertvollste Liste im System       │
└──────────────────────────────────────────────────────────┘
```

Die letzte Zeile ist keine Zierde: Ein bekanntes Ablaufdatum ist der einzige
Fall, in dem der Zeitpunkt der Ansprache objektiv richtig bestimmbar ist.

---

## 3. Kennzahlen mit Definition und Fallstrick

| Kennzahl | Definition | Fallstrick |
|---|---|---|
| **Abdeckungsgrad** | beurteilte Objekte ÷ geschätzte Grundgesamtheit, je Zielgruppe und Land | Ein zu klein geschätzter Nenner erzeugt Scheinerfolg. Nenner mit Datum und Quelle anzeigen |
| **Neue Objekte** | Objekte mit `erstmals_gesehen_am` im Zeitraum | Steigt bei jeder neuen Quelle sprunghaft. **Nie ohne Quellenangabe zeigen** |
| **Dublettenquote** | Vorschläge ≥ 0,80 ÷ gefundene Objekte je Lauf | Eine hohe Quote ist gut (Prüfung wirkt), eine steigende bei gleicher Quelle ist schlecht |
| **Freigabequote** | freigegeben ÷ geprüft | Unter 50 % ⇒ die Quelle liefert die falsche Zielgruppe, nicht der Prüfende ist streng |
| **Prüfrückstau** | Objekte in `ZUR_PRUEFUNG` | **Die Kennzahl, die als erste kippt.** Über 100 bremst die Recherche (Kapitel 9.4) |
| **Erstkontaktquote** | erreicht ÷ angesprochen | Trennt Datenqualität von Vertriebsleistung |
| **Reaktionszeit** | Freigabe → Erstansprache, Median | Median, nicht Mittelwert — ein Ausreißer verzerrt sonst alles |
| **Conversionrate** | `GEWONNEN` ÷ (`GEWONNEN` + `VERLOREN`) im Zeitraum | Ohne `NICHT_ERREICHT` im Nenner. Wer nicht erreicht wurde, hat nicht abgelehnt |
| **Partnerquote** | Organisationen mit Rolle und Vereinbarung ÷ freigegebene je Zielgruppe | Der eigentliche Erfolgsmaßstab von Z1 bis Z3 |
| **Offene Kontakte** | Vorgänge in `KONTAKTIERT`/`TERMIN`/`ANGEBOT`/`VERHANDLUNG` | Ohne Alterung ist die Zahl wertlos — immer mit Altersbändern |
| **Top-Chancen** | Klasse A oder Potenzialwert ≥ 70, offen | Höchstens zehn zeigen. Eine Liste mit 40 „Top-Chancen" hat keine |
| **Vertriebsleistung** | Gespräche, Termine, Abschlüsse je Person und Woche | **Nicht als Rangliste bei zwei Personen.** Nur als Zeitreihe gegen sich selbst |

---

## 4. Führungsansicht — monatlich

| Block | Inhalt |
|---|---|
| **Abdeckung im Verlauf** | Vier Zielgruppen, zwölf Monate, je Land |
| **Trichter** | Erfasst → beurteilt → freigegeben → angesprochen → Termin → gewonnen. **Mit Verweildauer je Stufe**, nicht nur mit Zahlen |
| **Quellenbilanz** | Je Quelle: gefunden, Dublettenquote, Freigabequote, daraus gewonnene Partner. Die einzige Grundlage, um eine Quelle abzuschalten |
| **Verlustgründe** | Verteilung. `AUSSERHALB_ZIELGRUPPE` über 20 % einer Quelle ist ein Befund, kein Rauschen |
| **Rechtsstand** | Offene Informationspflichten, Sperrvermerke, Quellen mit ungeklärter Erlaubnis |
| **Kapazität** | Rückstau gegen Tageskontingent, mit Kapazitätswarnungen des Monats |

**Der Trichter mit Verweildauer** ist die aussagekräftigste Darstellung. Er
beantwortet die Frage, die eine reine Mengenanzeige nie beantwortet: *Wo bleibt
es liegen?* Bei zwei Personen ist das fast immer wichtiger als *wie viel kommt
rein*.

---

## 5. Technische Regeln

| Regel | Grund |
|---|---|
| Alle Zahlen mit Stand und Zeitraum | Eine Zahl ohne Stichtag ist nicht überprüfbar |
| Grundgesamtheit als Datensatz mit Quelle und Datum, nicht als Konstante | §1 |
| Kennzahlen aus dem Rechercheraum und aus dem CRM **getrennt gekennzeichnet** | Sonst wird der Prüfrückstau mit dem Vertriebsrückstau verwechselt |
| Kein Live-Neuberechnen bei Aufruf | Nächtlich vorberechnet, sonst wird das Dashboard mit dem Bestand langsam |
| Keine personenbezogene Rangliste bei zwei Personen | Eine Rangliste unter zweien ist eine Bewertung, keine Kennzahl |
| Jede Kennzahl hat genau eine Definition, hinterlegt und aufrufbar | Zwei Definitionen derselben Zahl sind schlimmer als keine |
