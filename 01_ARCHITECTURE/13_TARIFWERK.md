# 13 — Tarifwerk

| Feld | Wert |
|---|---|
| Betrifft | Offener Punkt **A-08**, zweite Hälfte geklärt |
| Fassung | 1.1 — überarbeitet nach Sichtung der realen Tarife, siehe [`14_TARIFANALYSE.md`](14_TARIFANALYSE.md) |
| Datenquelle | Vorhandene Tarife als **PDF und Excel** |
| Zweck | Unverbindliche Richtprämie auf der Website, ohne Online-Tarifierung beim Versicherer |
| Grundsatz | Excel ist die **Quelle**, nicht das System |

---

## 1. Was sich damit ändert

Ohne Tarifdaten wäre die Website eine reine Anfragestrecke gewesen: Formular
ausfüllen, warten, Angebot per E-Mail. Mit vorhandenen Tarifen wird Weg B
möglich — eine unverbindliche Größenordnung sofort auf der Seite, das
verbindliche Angebot danach über den E-Mail-Prozess.

Das ist der Unterschied zwischen einem Interessenten, der die Seite verlässt,
und einem, der ein Formular absendet.

---

## 2. Der Fehler, den man hier macht

Es gibt drei naheliegende Wege, und zwei davon führen in die Sackgasse.

| Weg | Was passiert | Warum es scheitert |
|---|---|---|
| **Excel bleibt Master, Werte werden abgeschrieben** | Der Innendienst pflegt weiter Excel, jemand überträgt Zahlen in die Website | Zwei Wahrheiten, die auseinanderlaufen. Nach dem dritten Tarifwechsel weiß niemand mehr, welche gilt |
| **Formel wird in die Website programmiert** | Ein Entwickler baut die Rechenlogik in JavaScript oder PHP ein | Jede Tarifanpassung wird zum Entwicklungsauftrag. Der Innendienst kann seinen eigenen Tarif nicht ändern. Nach acht Monaten ist die Seite veraltet, und niemand merkt es |
| **Tarifwerk als versionierte Daten im Kern** ✓ | Excel wird importiert, wird zu einem freigegebenen, versionierten Datensatz; die Berechnung läuft serverseitig gegen diese Daten | Der Innendienst pflegt, das System rechnet, jede Berechnung ist nachvollziehbar |

**Verbindlich: der dritte Weg.** Die Rechenregel ist Konfiguration, nicht Code.

---

## 3. Die Rolle von Excel und PDF

Die beiden Formate leisten Unterschiedliches. Sie gleich zu behandeln, wäre der
nächste Fehler.

| Format | Enthält typischerweise | Behandlung |
|---|---|---|
| **Excel** | Prämientabellen, Faktoren, Zu- und Abschläge, Mindestprämien — **rechenbar** | Import in das Tarifwerk über eine vorgegebene Struktur |
| **PDF — Prämientabelle** | dieselben Zahlen, aber als Bild oder Layouttabelle | Einmalige Übertragung in die Import-Struktur. KI darf vorschlagen, ein Mensch prüft (ADR-0008) |
| **PDF — Bedingungswerk** | Deckungsumfang, Ausschlüsse, Obliegenheiten — **nicht rechenbar** | Gehört ins Dokumentenmanagement (M9), nicht ins Tarifwerk. Verknüpft mit Produkt und Gültigkeitszeitraum |

> Die Unterscheidung ist wichtig, weil ein Bedingungswerk kein Preis ist. Es
> gehört an das Angebot, an die Police und in die Beratungsdokumentation — aber
> es hat im Rechenweg nichts verloren.

### Der Import-Weg

```
Excel des Versicherers (gewachsen, je Träger anders)
        │
        │  einmalige Zuordnung je Träger durch den Innendienst
        ▼
IMPORT-VORLAGE (von uns vorgegeben, für alle Träger gleich)
        │
        ▼
Import erzeugt TARIFWERK im Status ENTWURF
        │
        ├── Plausibilitätsprüfung: Lücken, Sprünge, fehlende Kombinationen
        ├── Probeberechnung gegen bekannte Fälle
        │
        ▼
FREIGABE durch eine berechtigte Person (nicht die importierende)
        │
        ▼
TARIFWERK Status FREIGEGEBEN, ab gueltig_ab wirksam
        │
        └── Originaldatei wandert ins Dokumentenmanagement (Herkunftsnachweis)
```

**Die Import-Vorlage geben wir vor.** Nicht das gewachsene Format des jeweiligen
Versicherers wird gelesen — sonst braucht jeder Träger einen eigenen Importer,
und jede Formatänderung bricht ihn. Der Innendienst ordnet einmal je Träger zu,
danach ist der Weg für alle gleich.

---

## 3a. Drei Tarifarten

Die Sichtung der realen Quellen (Kapitel 14) hat gezeigt: Es gibt nicht eine
Bauart, sondern drei. Das Modell muss sie unterscheiden können.

| Art | Rechenweg | Vorkommen |
|---|---|---|
| **Satztarif** | Satz × Versicherungssumme | Kasko — sowohl NAUTIMA als auch der eigene Entwurf 2026 |
| **Stufentarif** | Merkmalsband → Betrag | Haftpflicht (Motorleistung, Segelfläche), Insassenunfall |
| **Festpreisliste** | Produktvariante → Betrag | Zusatzprodukte nach Bootslänge |

Ohne die Unterscheidung ist ein Wert von `0,0143` nicht von `39,32 €` zu
trennen — und der Unterschied beträgt den Faktor 70.000. Deshalb trägt jede
Tarifposition ein Feld `berechnungsart`.

## 4. Datenmodell

```
                    ┌─────────────────────────┐
                    │      TARIFWERK          │
                    │ versicherer_id          │
                    │ produkt_code, land      │
                    │ version (int)           │
                    │ gueltig_ab / gueltig_bis│
                    │ status                  │
                    │ quelle_dokument_id ─────┼──▶ Original-Excel im DMS
                    │ freigegeben_von / _am   │
                    └───┬────────┬────────┬───┘
                        │        │        │
          ┌─────────────▼──┐ ┌───▼──────┐ ┌▼──────────────┐
          │ TARIFPOSITION  │ │ TARIF-   │ │ TARIFREGEL    │
          │ Basisprämie je │ │ FAKTOR   │ │ Mindestprämie │
          │ Merkmals-      │ │ Merkmal  │ │ Höchstprämie  │
          │ kombination    │ │ Wert     │ │ Ausschluss-   │
          │                │ │ Operation│ │ kriterien     │
          │ bootstyp       │ │ Faktor   │ │               │
          │ wert_von/_bis  │ │ Reihen-  │ └───────────────┘
          │ revier         │ │ folge    │
          │ basispraemie   │ └──────────┘
          └────────────────┘

          ┌───────────────────────┐
          │ VERSICHERUNGSSTEUER   │   land · sparte · satz · gueltig_ab
          └───────────────────────┘
```

> **Nachtrag (Modul 02_CORE_CRM, ADR-0003):** Der Versicherer wird nicht als
> eigenständige Entität geführt, sondern als **Organisation mit der Rolle
> `VERSICHERER`** — dasselbe Muster wie Händler, Club und Partner. Die Felder
> bleiben unverändert, sie liegen im Rollenprofil. `versicherer_id` verweist
> damit auf eine Organisation.

### Entität TARIFWERK

| Feld | Typ | Anmerkung |
|---|---|---|
| `versicherer_id` | uuid | Je Träger ein eigenes Werk |
| `produkt_code`, `land` | text, enum | Ein Werk gilt für genau ein Produkt in genau einem Markt |
| `version` | int | Fortlaufend je Träger, Produkt und Land |
| `gueltig_ab`, `gueltig_bis` | date | Überschneidungsfrei erzwungen |
| `status` | enum | `ENTWURF`, `FREIGEGEBEN`, `ABGELOEST` |
| `quelle_dokument_id` | uuid | Verweis auf das importierte Original im DMS |
| `importiert_von`, `freigegeben_von` | uuid | **Müssen verschieden sein** — Vier-Augen-Prinzip |
| `pruefsumme_quelle` | text | SHA-256 der Quelldatei: belegt, welche Fassung importiert wurde |

### Entität TARIFFAKTOR

| Feld | Typ | Anmerkung |
|---|---|---|
| `merkmal` | text | `selbstbehalt`, `baujahr`, `schadenfreiheit`, `nutzungsart`, `motorleistung`, `revier` … |
| `wert_von`, `wert_bis` | text/numeric | Bereich oder Einzelwert |
| `art` | enum | `ZUSCHLAG`, `NACHLASS`, `SFR` |
| `rechenart` | enum | `PROZENT`, `BETRAG` |
| `faktor` | numeric(8,4) | Nachlässe negativ |
| `voraussetzung_code` | text | **Ein Faktor kann einen anderen bedingen.** NAUTIMA: „Unterschlagungsrisiko — nur versicherbar bei Charterrisiken ohne Skipper" |
| `reihenfolge` | int | Greift nur bei sequenzieller Verknüpfung, siehe unten |

### Die Verknüpfung der Faktoren gehört an das Tarifwerk, nicht an den Faktor

Die erste Fassung dieses Kapitels sah nur ein Feld `reihenfolge` vor. Das genügt
nicht, denn die Träger verknüpfen unterschiedlich.

NAUTIMA legt ausdrücklich fest: *„Der zu berücksichtigende Prozentsatz ergibt
sich aus dem **Saldo** aller Zuschläge und Nachlässe."* Erst addieren, dann
einmal anwenden. Ein Charterzuschlag von +50 % und ein Seennachlass von −10 %
ergeben +40 %, nicht `× 1,50 × 0,90`.

Deshalb trägt `TARIFWERK` das Feld `verknuepfung_faktoren`:

| Wert | Bedeutung |
|---|---|
| `SALDO_ADDITIV` | Alle Zu- und Abschläge werden saldiert, dann einmal angewandt |
| `MULTIPLIKATIV_SEQUENZIELL` | Nacheinander multipliziert, in der Reihenfolge des Feldes `reihenfolge` |

Ebenso an das Tarifwerk gehört `mindestbeitrag_greift`. NAUTIMA: der
Mindestbeitrag *„darf nicht unterschritten werden (auch nicht durch Nachlass-
und SFR-Gewährung)"* — er wirkt also **zuletzt**. Ein Modell, das ihn vor den
Nachlässen prüft, rechnet falsch.

---

## 5. Berechnung

### Ablauf

```
1. Passendes TARIFWERK finden
      je Versicherer und Sparte: gültig am Stichtag, Produkt, Land,
      Status FREIGEGEBEN

2. TARIFPOSITION treffen
      Merkmalskombination → Satz oder Betrag, je berechnungsart
      status NICHT_ANGEBOTEN oder ANFRAGE → KEIN Ergebnis
      keine Position gefunden      → KEIN Ergebnis  (nicht: geraten)

3. GRUNDBEITRAG
      SATZ_VON_VS  → Satz × Versicherungssumme
      FESTBETRAG   → Betrag unverändert

4. FAKTOREN anwenden, gemäß verknuepfung_faktoren
      Faktoren mit voraussetzung_code nur, wenn die Voraussetzung greift

5. SCHADENFREIHEITSRABATT vom Zwischenergebnis abziehen

6. MINDESTBEITRAG als Untergrenze   ← greift ZULETZT

7. Über alle Sparten des Fahrzeugs summieren
      Kasko + Haftpflicht (+ Insassenunfall) ergeben EINEN Beitrag je Träger

8. VERSICHERUNGSSTEUER je Land aufschlagen
```

Schritt 7 ist neu gegenüber der ersten Fassung: Ein Kunde vergleicht keine
Kaskoprämien, sondern Gesamtbeiträge. Die Spanne entsteht über die Kombination,
nicht je Sparte.

### Die Spanne entsteht von selbst

Als Mehrfachagent rechnet der Schritt oben für **jeden** in Frage kommenden
Träger. Das Ergebnis ist keine Zahl, sondern eine Menge:

```
Versicherer A   412,00 €
Versicherer B   468,00 €
Versicherer C   —  (Revier nicht abgedeckt)
Versicherer D   531,00 €

Anzeige:  „typischerweise 410 – 530 € im Jahr"
```

Das ist der elegante Teil: Die Spanne ist keine Absicherung gegen Ungenauigkeit,
sondern die **ehrliche Darstellung dessen, was tatsächlich vorliegt.** Eine
einzelne Zahl wäre die Lüge, nicht die Spanne.

### Verbindliche Regeln

| Regel | Grund |
|---|---|
| `NICHT_ANGEBOTEN` wird **hingeschrieben**, nicht durch ein leeres Feld ausgedrückt | Leer ist mehrdeutig: vergessen oder nicht angeboten? NAUTIMA löst das vorbildlich mit „–" |
| Die Berechnung läuft **serverseitig** im Domänenkern | Im Browser wären Tarifdaten öffentlich einsehbar — das ist Geschäftsgeheimnis des Versicherers |
| Keine passende Position → **kein Ergebnis**, keine Schätzung | Eine geratene Prämie ist schlimmer als keine |
| Weniger als zwei Träger mit Ergebnis → **keine Spanne anzeigen** | Eine „Spanne" aus einem Wert ist eine Punktangabe mit falscher Aura |
| Jede Berechnung wird protokolliert | Siehe unten |
| Die Anzeige nennt immer den Stichtag und die Unverbindlichkeit | Nicht im Kleingedruckten |

---

## 6. Das Berechnungsprotokoll

Zu jeder angezeigten Indikation wird gespeichert:

| Feld | Zweck |
|---|---|
| `tarifwerk_version` je Träger | „Warum stand da 480 €?" ist acht Monate später beantwortbar |
| Eingabewerte (die Merkmale, nicht die Person) | Nachvollziehbarkeit ohne unnötigen Personenbezug |
| Angewandte Faktoren mit Reihenfolge | Der Rechenweg, nicht nur das Ergebnis |
| Ergebnis je Träger, angezeigte Spanne | |
| Zeitpunkt | |

**Ohne dieses Protokoll ist die Richtprämie nicht verantwortbar.** Ein Kunde,
der auf die Website verweist und eine höhere Rechnung erhält, hat einen
berechtigten Einwand — und die Antwort darauf muss aus den Daten kommen, nicht
aus der Erinnerung.

---

## 7. Die Kennzahl, ohne die das Tarifwerk verfällt

Eine Richtprämie ist nur so viel wert wie ihre Treffgenauigkeit. Deshalb wird sie
gemessen:

```
Am Vorgang gespeichert:
    indikation_spanne_von / _bis      (was die Website zeigte)
    indikation_tarifwerk_versionen    (womit gerechnet wurde)

Später, wenn das echte Angebot eintrifft:
    angebot.praemie                   (was der Versicherer nennt)

    → ABWEICHUNG = liegt die Prämie innerhalb der Spanne?
```

| Kennzahl | Zielwert | Wenn verfehlt |
|---|---|---|
| Anteil Angebote innerhalb der angezeigten Spanne | > 80 % | Tarifwerk überarbeiten oder Spanne verbreitern |
| Mittlere Abweichung nach oben | < 10 % | Kritischer als Abweichung nach unten: der Kunde fühlt sich getäuscht |
| Alter des ältesten freigegebenen Tarifwerks | < 12 Monate | Pflegeaufgabe erzeugen |

Die dritte Zeile ist die wichtigste. **Ein Tarifwerk verfällt still.** Niemand
bemerkt, dass die Zahlen von 2026 stammen — bis ein Kunde sich beschwert.
Deshalb erzeugt das System selbst eine Aufgabe, wenn ein Werk zu alt wird.

---

## 8. Was noch zu klären ist

| Punkt | Warum es zählt |
|---|---|
| **Dürfen die Tarifdaten so verwendet werden?** Die Tabellen gehören den Versicherern. Eine Preisanzeige auf der eigenen Website kann vertraglich geregelt oder untersagt sein | Vor dem Bau je Träger klären — nicht danach |
| **Versicherungssteuersätze je Land und Sparte** | AT und DE unterscheiden sich. Die Sätze werden als Datensatz gepflegt, nicht als Konstante im Code. Werte durch Steuerberatung bestätigen |
| **Welche Merkmale fragt die Website ab?** | Je mehr Merkmale, desto genauer die Indikation — und desto länger das Formular. Erfahrungsgemäß liegt das Optimum bei fünf bis sieben Feldern |
| **Wer pflegt das Tarifwerk?** | Ohne benannte Person verfällt es. Das ist keine Nebenaufgabe der Entwicklung |

> **Neuer offener Punkt A-11:** Vertragliche Zulässigkeit der Prämienanzeige je
> Versicherer. Zu klären vor dem Bau von M2 — die Antwort kann je Träger
> unterschiedlich ausfallen, dann fließt dieser Träger nicht in die Spanne ein.

---

## 9. Was das für die Roadmap bedeutet

| Welle | Ergänzung |
|---|---|
| **Welle 1** | Import-Vorlage festlegen · Tarifwerk-Modell · Import mit Vier-Augen-Freigabe · serverseitige Berechnung · Anzeige der Spanne auf der Website · Berechnungsprotokoll |
| **Welle 2** | Abweichungsmessung, sobald echte Angebote vorliegen — vorher gibt es nichts zu vergleichen |
| **Welle 4** | Auswertung der Indikationsgüte je Träger und Produkt in M11 |

Der Aufwand in Welle 1 ist überschaubar, **weil die Daten vorhanden sind**. Der
eigentliche Aufwand liegt nicht in der Programmierung, sondern in der einmaligen
Zuordnung je Träger — und die kann sofort beginnen, ohne auf Entwicklung zu
warten.

---

## 10. Die Import-Vorlage

Liegt vor: [`vorlagen/tarif_import_vorlage.xlsx`](vorlagen/tarif_import_vorlage.xlsx),
abgeleitet aus drei realen Quellen. Die Ableitung und die dabei gefundenen
Befunde stehen in [`14_TARIFANALYSE.md`](14_TARIFANALYSE.md).

Nächster Schritt ist nicht der Importer, sondern das **Ausfüllen der Vorlage für
einen vollständigen Träger**. Eine Vorlage, die noch niemand ausgefüllt hat, ist
eine Vermutung — der erste echte Träger deckt auf, was fehlt, und zwar bevor
Code darauf aufbaut.
