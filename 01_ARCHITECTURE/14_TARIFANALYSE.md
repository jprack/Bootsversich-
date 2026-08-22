# 14 — Analyse der vorliegenden Tarife

| Feld | Wert |
|---|---|
| Grundlage | Drei reale Quellen, übermittelt am 22.08.2026 |
| Zweck | Ableitung der Import-Vorlage; Prüfung der Annahmen aus Kapitel 13 |
| Ergebnis | Kapitel 13 ist an drei Stellen zu korrigieren. Zusätzlich elf Befunde im eigenen Entwurfstarif |

---

## 1. Die drei Quellen

| # | Datei | Was es ist | Markt |
|---|---|---|---|
| **Q1** | `NA_015_0824_Tarif.pdf` | **NAUTIMA-Tarif der Mannheimer Versicherung AG**, gültig ab 01.12.2024. Fremder Träger, vollständiges Tarifwerk für Kasko, Haftpflicht und Insassenunfall | DE |
| **Q2** | `Draft_Callidus_Tarif_2026.xlsx` | **Eigener Entwurfstarif 2026** für Segel- und Motoryacht, Kasko und Haftpflicht, mit Änderungshistorie | AT |
| **Q3** | `Charter_Folgeschaden_send_1.xlsx` | **Festpreisliste** eines Zusatzprodukts nach Bootslänge, mit Endkundenpreis, Steuer und Provision | AT |

Diese drei sind keine Varianten desselben Musters. Sie sind **drei verschiedene
Tarifarten** — und genau das war die wichtigste offene Frage.

---

## 2. Erste Korrektur an Kapitel 13: es gibt drei Tarifarten

Kapitel 13 ging von einer Bauart aus: Basisprämie je Merkmalskombination, darauf
Faktoren. Das trifft nur auf einen Teil zu.

| Art | Rechenweg | Beispiel | Merkmale |
|---|---|---|---|
| **Satztarif** | Satz × Versicherungssumme | Q1 Kasko, Q2 Kasko | Versicherungssumme ist selbst eine Eingabe; die Tabelle liefert einen Prozentsatz |
| **Stufentarif** | Merkmalsband → Betrag | Q1 Haftpflicht (kW-Bänder × Deckungssumme), Q2 Haftpflicht (Segelfläche), Q1 Insassenunfall | Kein Bezugswert; der Betrag steht in der Tabelle |
| **Festpreisliste** | Produktvariante → Betrag | Q3 (Bootslänge in Fuß) | Keine Berechnung, nur Nachschlagen |

**Folge für das Datenmodell:** `TARIFPOSITION` braucht ein Feld `berechnungsart`
mit den Werten `SATZ_VON_VS` und `FESTBETRAG`. Ohne dieses Feld ist eine
Prämie von `0,0143` nicht von einer Prämie von `39,32 €` zu unterscheiden — und
der Unterschied ist der Faktor 70.000.

---

## 3. Zweite Korrektur: die Verknüpfung der Faktoren ist je Träger verschieden

Kapitel 13 sah ein Feld `reihenfolge` an jedem Faktor vor. Das genügt nicht.

**Q1 (NAUTIMA) legt es ausdrücklich fest:**

> „Der zu berücksichtigende Prozentsatz ergibt sich aus dem **Saldo** aller
> Zuschläge und Nachlässe."

Das heißt: erst addieren, dann **einmal** anwenden. Ein Charterrisiko ohne
Skipper (+50 %) und ein Seen-Nachlass (−10 %) ergeben +40 %, nicht
`× 1,50 × 0,90 = × 1,35`. Der Unterschied beträgt hier gut 3 % der Prämie.

**Q2 nennt nur Prozentsätze ohne Verknüpfungsregel.** Ob saldiert oder
multipliziert wird, steht nirgends — und ist bei fünf möglichen Zuschlägen eine
Abweichung im zweistelligen Prozentbereich.

**Folge:** `TARIFWERK` braucht ein Feld `verknuepfung_faktoren` mit
`SALDO_ADDITIV` oder `MULTIPLIKATIV_SEQUENZIELL`. Die Reihenfolge am einzelnen
Faktor bleibt, greift aber nur im zweiten Fall.

Q1 legt außerdem die Gesamtabfolge fest, die als Vorgabe übernommen wird:

```
Grundbeitrag (Satz × Versicherungssumme)
   → Saldo aller Zuschläge und Nachlässe, einmal angewandt
      → Schadenfreiheitsrabatt vom Zwischenergebnis abgezogen
         → Mindestbeitrag als Untergrenze  ← greift ZULETZT
```

Der letzte Schritt ist ausdrücklich geregelt: der Mindestbeitrag „darf nicht
unterschritten werden (auch nicht durch Nachlass- und SFR-Gewährung)". Ein
Modell, das den Mindestbeitrag vor den Nachlässen prüft, rechnet falsch.

---

## 4. Dritte Korrektur: Faktoren können einander bedingen

Q1 enthält:

> „Unterschlagungsrisiko (**nur versicherbar bei Charterrisiken ohne Skipper**) 30 %"

Ein Faktor mit Vorbedingung. Das Modell aus Kapitel 13 kennt nur unabhängige
Faktoren.

**Folge:** `TARIFFAKTOR` erhält `voraussetzung_code`. Ist er gesetzt, greift der
Faktor nur, wenn der genannte andere Faktor ebenfalls greift.

Ebenso zu modellieren sind Faktoren mit **Wertelisten** statt Bedingungen: der
Premiumhersteller-Nachlass (15 Werften namentlich) und der Seen-Nachlass
(7 Gewässer namentlich). Beide sind gepflegte Listen, keine Regeln.

---

## 5. Was Q1 vorbildlich löst

Zwei Dinge, die in den eigenen Unterlagen fehlen und übernommen werden sollten:

| Vorbild | Warum es zählt |
|---|---|
| **„–" für nicht angebotene Kombinationen** | Q1 markiert jede nicht angebotene Kombination von Versicherungssumme und Selbstbehalt ausdrücklich. Q2 lässt sie leer. Leer ist mehrdeutig: vergessen oder nicht angeboten? Die Import-Vorlage erzwingt deshalb ein Feld `status` |
| **Ausdrückliche Verknüpfungsregel** | Siehe Abschnitt 3. Ohne sie ist jede Nachrechnung Auslegung |

Und ein drittes, das bereits im eigenen Haus existiert: **das Blatt
„Änderungen" in Q2 ist ein Änderungsprotokoll** mit Datum, betroffenem Blatt
und Begründung — bis hin zu „Überarbeitung der Tarife, basierend auf
Marktrückmeldungen" (21.01.2026). Der Versionierungsgedanke ist da. Er wird nur
noch nicht erzwungen.

---

## 6. Befunde im eigenen Entwurfstarif 2026

Elf Punkte. Sie sind kein Vorwurf — sie sind der übliche Zustand einer
gewachsenen Arbeitsdatei und genau der Grund, warum der Import eine
Plausibilitätsprüfung braucht.

### Rechnerisch wirksam

| # | Befund | Wirkung |
|---|---|---|
| **B1** | **Lücke in den Versicherungssummen-Bändern.** Die Bänder lauten „< 70.000" und „170.000 – 300.000". Der Bereich **70.000 – 170.000 fehlt** — in allen vier Kaskotabellen | Ein Boot im Wert von 100.000 € erhält keinen Satz. Das Änderungsblatt erwähnt am 06.03.2023 einen „Sprung bei 100.000", der „durch Formel ersetzt" wurde — der Sprung ist offenbar zurückgekehrt |
| **B2** | **Widerspruch zwischen Zuschlag und Annahmerichtlinie.** „Segelboote älter 20 Jahre +10 %" steht neben „Anfragepflichtig sind: Wassersportfahrzeuge älter als 15 Jahre" | Ein 21 Jahre altes Segelboot ist anfragepflichtig. Der Zuschlag kann nie zur Anwendung kommen — entweder ist die Altersgrenze falsch oder der Zuschlag überflüssig |
| **B3** | **Segelyacht-Haftpflicht folgt nicht der eigenen Regel.** Das Änderungsblatt hält am 28.12.2023 fest: „Aufschlag von HP 5 Mio auf 10 Mio **immer 30 %**". Die Motoryacht-Tabelle setzt das per Formel um (× 1,3). Die Segelyacht-Tabelle nicht: 65→75 (+15,4 %), 120→150 (+25 %), 160→210 (+31,3 %), 200→250 (+25 %) | Vier verschiedene Aufschläge, wo einer dokumentiert ist |
| **B4** | **Fehlende Mindestprämie Haftpflicht.** Das Änderungsblatt nennt am 12.12.2023 „75 € Mindestprämie Brutto". In den Haftpflicht-Blättern steht keine | Bei kleinen Booten kann die Prämie unter die Untergrenze fallen |

### Strukturell

| # | Befund | Wirkung |
|---|---|---|
| **B5** | **Binnen-Werte der Motoryacht sind Formeln:** `Binnen = Mittelmeer − 0,0005`. Die Regel steht nirgends im Klartext | Beim Import ginge sie verloren, und die Binnen-Tabelle würde beim nächsten Mittelmeer-Update stillschweigend veralten |
| **B6** | **Dieselbe Regel gilt bei der Segelyacht nicht.** Dort sind die Binnen-Werte eigenständig eingetragen | Zwei Bauarten, zwei Pflegelogiken. Eine davon wird beim nächsten Update vergessen |
| **B7** | **Motoryacht Kasko Mittelmeer trägt die falschen Bauarten:** „Komfort" und „Sport" statt „Verdränger" und „Gleiter" | Ein Importer ordnet die Zeilen der falschen Bauart zu |
| **B8** | **Beide Haftpflicht-Blätter tragen den Titel „Segelyacht Haftpflicht Mittelmeer"** — auch das Motoryacht-Blatt | Verwechslungsgefahr bei der Pflege |
| **B9** | **Der Blattname „MY Haftpflicht " endet mit einem Leerzeichen** | Bricht jeden Zugriff über den Blattnamen |
| **B10** | **Probekalkulationen stehen in den Tarifblättern** (Zellen mit 32.000, 211,2, 169, 22.000, 191,4 nebst Formeln) | Ein generischer Importer liest sie als Tarifdaten |

### In der Festpreisliste

| # | Befund | Wirkung |
|---|---|---|
| **B11** | **Tarif und Provision sind vermischt.** Q3 enthält Endkundenprämie, Steuer, Nettoprämie **und** Provision (durchgehend 35 %) in einer Tabelle. Zusätzlich Gleitkomma-Artefakte wie `8,917927927927934` statt `8,92` | Die Provision ist keine Eigenschaft des Tarifs, sondern der Vereinbarung mit dem Träger. Vermischt lässt sich weder das eine noch das andere sauber pflegen. Die Gleitkommareste bestätigen die Festlegung aus ADR-0004 |

---

## 7. Was sich nebenbei geklärt hat

| Frage | Antwort aus den Quellen |
|---|---|
| **Versicherungssteuer (A-12)** | Aus Q3 zurückrechenbar: 89,99 € brutto zu 81,07 € netto entspricht **11 %**. Das deckt sich mit dem österreichischen Satz. Bestätigung durch die Steuerberatung bleibt erforderlich — eine Rückrechnung ist ein Indiz, kein Beleg |
| **Sind Netto- oder Bruttobeträge zu führen?** | Beide Träger führen **netto**: Q1 „Bei den ausgewiesenen Beiträgen handelt es sich um Nettobeiträge", Q2 „Preise in Netto". Nur Q3 nennt Endkundenpreise. Die Vorlage erzwingt netto |
| **Wie viele Merkmale braucht die Richtprämie?** | Q1 Kasko braucht vier: Fahrzeugart, Fahrtgebiet, Versicherungssumme, Selbstbehalt. Q2 braucht fünf (zusätzlich Bauart). **Das liegt im vertretbaren Rahmen** — die Sorge aus ADR-0012, es könnten zwölf Felder werden, hat sich nicht bestätigt |
| **Deckt ein Vorgang mehrere Sparten ab?** | Ja. Q1 führt Kasko, Haftpflicht und Insassenunfall getrennt, aber für dasselbe Fahrzeug. Die Spanne muss über die **Kombination** gerechnet werden, nicht je Sparte |

---

## 8. Die Import-Vorlage

Abgeleitet aus allen drei Quellen:
[`vorlagen/tarif_import_vorlage.xlsx`](vorlagen/tarif_import_vorlage.xlsx)

Sieben Blätter: Anleitung · Tarifwerk-Kopfdaten · Grundtarif · Faktoren ·
Regeln · Steuer · Prüfung.

Die tragende Entscheidung der Vorlage ist das **Langformat**: eine Zeile je
Merkmalskombination statt einer Matrix. Grund: Die Spalten der Matrix sind bei
jedem Träger andere. Q1 hat fünf Fahrtgebiete und sechs Selbstbehalte, Q2 hat
zwei Reviere und je nach Blatt vier oder fünf Selbstbehalte. Ein Importer, der
Matrizen liest, braucht je Träger eine eigene Fassung — und bricht bei jeder
Formatänderung.

Das Langformat kostet Tipparbeit: Aus der NAUTIMA-Kaskotabelle werden rund
300 Zeilen. Dafür ist der Weg danach für jeden Träger derselbe, und die
Prüfungen greifen für alle gleich.

Das Blatt `06_Pruefung` rechnet mit: Zeilen ohne Status, Status `GILT` ohne
Wert, doppelte Kombinationen, Sätze außerhalb des plausiblen Bereichs,
Prozentwerte, die als `10` statt `0,10` eingetragen wurden, Nachlässe ohne
negatives Vorzeichen, Voraussetzungs-Codes ohne passenden Faktor.

**Die Bandlückenprüfung** — Befund B1 — läuft nicht in Excel, sondern beim
Import: Sie braucht die vollständige Bandliste je Kombination und ist damit eine
Prüfung über den ganzen Datensatz, nicht über eine Zeile.

---

## 9. Empfohlene Reihenfolge

| # | Schritt | Wer | Aufwand |
|---|---|---|---|
| 1 | **B1 bis B4 im Entwurfstarif klären** — das sind fachliche Fragen, keine Datenpflege | Produktverantwortung | Stunden |
| 2 | Q1 (NAUTIMA Kasko) in die Vorlage übertragen | Innendienst | ein Tag |
| 3 | Prüfblatt auswerten, Rückmeldung zur Vorlage | Innendienst | — |
| 4 | Vorlage anhand der Rückmeldung nachschärfen, danach Q2 und Q3 übertragen | gemeinsam | — |
| 5 | Erst dann: Importer und Berechnung bauen | Entwicklung | Welle 1 |

Schritt 2 vor Schritt 5 ist Absicht. **Eine Vorlage, die noch niemand
ausgefüllt hat, ist eine Vermutung.** Der erste vollständige Träger deckt auf,
was fehlt — und zwar bevor Code darauf aufbaut.

---

## 10. Änderungen an Kapitel 13

| Stelle | Änderung |
|---|---|
| Datenmodell | `TARIFPOSITION.berechnungsart` (`SATZ_VON_VS` / `FESTBETRAG`) |
| Datenmodell | `TARIFWERK.verknuepfung_faktoren` (`SALDO_ADDITIV` / `MULTIPLIKATIV_SEQUENZIELL`) |
| Datenmodell | `TARIFWERK.mindestbeitrag_greift` (`AM_ENDE` / `VOR_NACHLAESSEN`) |
| Datenmodell | `TARIFFAKTOR.voraussetzung_code` für einander bedingende Faktoren |
| Datenmodell | `TARIFPOSITION.status` (`GILT` / `NICHT_ANGEBOTEN` / `ANFRAGE`) statt leerer Felder |
| Berechnung | Feste Abfolge: Grundbeitrag → Faktoren → Schadenfreiheitsrabatt → Mindestbeitrag |
| Berechnung | Über mehrere Sparten je Fahrzeug, nicht je Sparte einzeln |
