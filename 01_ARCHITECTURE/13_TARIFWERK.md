# 13 — Tarifwerk

| Feld | Wert |
|---|---|
| Betrifft | Offener Punkt **A-08**, zweite Hälfte geklärt |
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
| `operation` | enum | `MULTIPLIKATIV`, `ADDITIV` |
| `faktor` | numeric(8,4) | |
| `reihenfolge` | int | **Entscheidend:** Die Reihenfolge der Anwendung verändert das Ergebnis |

### Warum die Reihenfolge ein Feld ist

Ein Nachlass von 10 % und ein Zuschlag von 200 € ergeben je nach Reihenfolge
verschiedene Prämien. Die Reihenfolge ist eine fachliche Festlegung des
Versicherers, keine technische Nebensache — deshalb steht sie in den Daten und
nicht in der Programmierung.

---

## 5. Berechnung

### Ablauf

```
1. Passendes TARIFWERK finden
      je Versicherer: gültig am Stichtag, Produkt, Land, Status FREIGEGEBEN

2. TARIFPOSITION treffen
      Bootstyp × Wertbereich × Revier → Basisprämie
      Keine Position gefunden → KEIN Ergebnis für diesen Träger
      (nicht: geraten)

3. TARIFFAKTOREN anwenden, in gespeicherter Reihenfolge

4. TARIFREGELN prüfen
      Mindestprämie · Höchstprämie · Ausschlusskriterien
      Ausschluss greift → dieser Träger liefert kein Ergebnis

5. VERSICHERUNGSSTEUER je Land aufschlagen

6. Ergebnis: eine Nettoprämie und eine Bruttoprämie je Träger
```

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

## 10. Was als Nächstes hilft

Eine repräsentative Excel-Datei eines Trägers — gerne mit erfundenen Zahlen, die
**Struktur** ist entscheidend, nicht der Inhalt. Daraus lässt sich die
Import-Vorlage konkret ableiten, statt sie zu erraten: welche Dimensionen es
gibt, wie die Faktoren aufgebaut sind, ob Mindestprämien je Kombination oder
global gelten.

Ohne diesen Blick bleibt die Vorlage eine Vermutung.
