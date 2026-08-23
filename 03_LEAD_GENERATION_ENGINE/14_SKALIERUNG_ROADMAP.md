# 14 — Skalierung und Roadmap

---

## 1. Was von Beginn an vorhanden sein muss

Vier Dinge lassen sich später nicht nachrüsten, ohne den bis dahin aufgebauten
Bestand zu entwerten:

| Von Anfang an | Warum nicht nachrüstbar |
|---|---|
| **Belegkette je Feld** (`OBJEKTBELEG`) | Für bereits erfasste Objekte ist die Herkunft nicht rekonstruierbar. Und ohne sie ist keine Auskunft möglich |
| **Sperrvermerke** quellenübergreifend | Ein Widerspruch, der beim Eingang nicht wirkt, wirkt nie |
| **Mandantentrennung** `AT` / `DE` | Ein gemischter Bestand ist nachträglich nicht sauber zu trennen |
| **Score-Herleitung** | Ohne sie sind alte Werte nicht deutbar, sobald sich das Modell ändert |

Alles Übrige — Automatisierungsgrad, Zahl der Quellen, Anreicherung, Oberfläche —
darf wachsen.

---

## 2. Vier Ausbaustufen

### V1 — Österreich

| | |
|---|---|
| **Umfang** | Cluster Z1 und Z2 vollständig, Z4 teilweise. Drei bis fünf Quellen der Klasse A |
| **Automatisierung** | Erfassung halbautomatisch: Verzeichnisse eingelesen, Websites angereichert. Prüfung vollständig manuell |
| **Ziel** | Abdeckung Z1 ≥ 80 %, Z2 ≥ 70 % |
| **Menge** | 300–500 Objekte — die Größenordnung, die zwei Personen in einem Jahr beurteilen können |
| **Technik** | Ein Schema, ein Server, nächtliche Läufe. Keine Warteschlange, kein Suchindex |

**Abnahme von V1 — sieben Punkte:**

1. Ein Verzeichnis wird eingelesen und erzeugt Objekte mit Belegen.
2. Ein Objekt ist in unter 60 Sekunden entscheidbar.
3. Eine Freigabe erzeugt Organisation, Rolle und **genau eine** Aufgabe.
4. Ein Widerspruch verhindert jede weitere Verarbeitung — quellenübergreifend.
5. Eine Auskunft nach Art. 15 ist in unter zehn Minuten vollständig erzeugbar.
6. Der Abdeckungsgrad ist mit Nenner, Quelle und Stand darstellbar.
7. **Ein zweiter Lauf derselben Quelle erzeugt keine einzige Dublette.**

Punkt 7 ist der härteste und der beste Gesamttest: Er prüft Normalisierung,
Abgleich, Gedächtnis für Nicht-Dubletten und Verwerfungslogik in einem Zug.

### V2 — Deutschland

| | |
|---|---|
| **Neu** | Zweiter Mandant, zehnfache Grundgesamtheit, regionale Verbandsstruktur |
| **Was bricht** | Nichts an der Struktur. Die Menge trifft **Prüfkapazität und Reviergewichtung**, nicht die Technik |
| **Änderung** | Reviere und Regionen als Pflegetabelle statt Liste. Priorisierung nach Küste, Binnenrevier, Seen |
| **Vorbedingung** | Abdeckung AT über 70 % — sonst werden zwei halbe Märkte bearbeitet |
| **Technik** | Volltextsuche wird nötig. Lesereplikat für Kennzahlen |

### V3 — DACH

| | |
|---|---|
| **Neu** | Schweiz und Liechtenstein |
| **Die eigentliche Hürde** | **Nicht der Datenschutz, sondern die Vermittlerzulassung.** Ohne Zulassung darf nicht vermittelt werden — dann ist jede Recherche wertlos (**L-06**) |
| **Datenschutz** | CH ist Drittland nach DSGVO; zusätzlich gilt das Schweizer Datenschutzgesetz. Beides beherrschbar, aber vor dem ersten Objekt zu klären |
| **Reihenfolge** | Zulassung → Rechtsprüfung → Mandant → Recherche. **Nie umgekehrt** |

Der häufige Fehler wäre, zuerst zu recherchieren und die Zulassung „parallel" zu
betreiben. Dann liegt ein Bestand vor, der nicht genutzt werden darf — und
dessen Aufbewahrung ohne Zweck nicht zu rechtfertigen ist.

### V4 — Europa

| | |
|---|---|
| **Neu** | Mittelmeerreviere: Kroatien, Italien, Griechenland, Spanien |
| **Was sich ändert** | Sprache in Quellen und Ansprache. Verbandsstrukturen je Land verschieden. **Charter dominiert** statt Handel |
| **Struktur** | Mandant je Land oder je Rechtsraum. Reviere werden wichtiger als Landesgrenzen — ein kroatischer Charterbetrieb hat mehr mit einem italienischen gemein als mit einem Wiener Händler |
| **Vorbedingung** | Zulassung je Land und Tarifwerk mit Auslandsdeckung |

**Der wirtschaftlich interessante Punkt an V4:** Die Mittelmeerreviere sind für
die *Bestandskunden* aus AT und DE relevant, lange bevor dort eigene Partner
gewonnen werden. Fahrtgebiet Mittelmeer steht bereits im Tarifwerk. Eine
Recherche in Kroatien kann also dem Bestand dienen, ohne dass dort vermittelt
wird — das ist ein anderer Zweck und braucht eine eigene Begründung.

---

## 3. Was ab welcher Menge nicht mehr trägt

| Grenze | Was bricht | Antwort |
|---|---|---|
| ~1.000 Objekte | nichts | — |
| ~5.000 | Prüfliste unübersichtlich, Namenssuche langsam | Volltextindex, Filter nach Revier und Klasse |
| ~20.000 | Dublettenabgleich paarweise zu langsam | Blockbildung nach Land, PLZ-Bereich und Untergruppe vor dem Vergleich |
| ~50.000 | Nächtliche Läufe überschreiten das Fenster | Läufe je Quelle verteilen, Kennzahlen auf Lesereplikat |
| beliebig | **Prüfkapazität** | Keine technische Antwort. Mehr Menschen oder engere Auswahl |

**Die letzte Zeile ist die einzige, die wirklich zählt.** Alle technischen
Grenzen liegen weit jenseits dieses Marktes; die menschliche Grenze wird im
ersten Monat erreicht.

---

## 4. Roadmap

### Welle 0 — bevor irgendetwas gebaut wird

| Schritt | Ergebnis | Braucht keinen Entwickler |
|---|---|---|
| **Grundgesamtheit erheben** (L-04) | Wie viele Händler, Marinas, Clubs, Charterbetriebe gibt es in AT? | ✓ |
| **Kanalmatrix rechtlich bestätigen** (L-02) | Was darf angesprochen werden, wie? | ✓ |
| **Interessenabwägung und Informationstext** (L-03) | Freigegebene Textbausteine | ✓ |
| Drei Quellen auswählen und Zulässigkeit prüfen | Erste Quellen der Klasse A | ✓ |

**Welle 0 ist die wichtigste und die billigste.** Ohne die Grundgesamtheit gibt
es keine Leitkennzahl; ohne die Kanalmatrix darf niemand angesprochen werden. Und
beides lässt sich vor jeder Zeile Code erledigen.

### Welle 1 — Fundament

Rechercheraum mit Objekt, Beleg, Quelle, Lauf · Normalisierung · Sperrvermerke ·
manuelle Erfassung · Prüfmaske · Freigabe ins CRM · Regeln `L-01`, `L-04`,
`L-31`, `L-32`.

> **Ergebnis:** Objekte kommen von Hand oder aus einer Liste herein und sauber
> ins CRM. **Das allein ist schon nutzbar** — der Rest ist Beschleunigung.

### Welle 2 — Erfassung

Verzeichnisse einlesen · Anreicherung über Impressum · Dublettenabgleich mit
Vorschlägen · Basiswert · Prüfliste mit Sortierung · Regeln `L-11`, `L-18`.

### Welle 3 — Steuerung

Abdeckungsgrad · Trichter mit Verweildauer · Quellenbilanz · Potenzialwert ·
Wiedervorlagen · restlicher Regelkatalog nach Trockenlauf.

### Welle 4 — Ausbau

Zweiter Mandant · Volltextsuche · Klassifikationsvorschläge (nach L-05) ·
Messeerfassung mobil.

---

## 5. Reihenfolge der Zielgruppen und Quellen

| Rang | Zielgruppe | Erste Quelle | Warum zuerst |
|---|---|---|---|
| **1** | **Z1 Handel** | Herstellerverzeichnisse | Höchster Hebel je Adresse, beste Quellenlage, Kaufmoment |
| **2** | **Z2 Infrastruktur** | Revierführer, Betreiberseiten | Eigener Bedarf **und** Multiplikator, wenige Adressen |
| **3** | **Z4 Charter** | Charterportale, Messeverzeichnisse | Produkt liegt bereits vor — kürzester Weg zum Abschluss |
| **4** | **Z3 Gemeinschaft** | Verbandslisten | Beste Reichweite je Aufwand, aber langsamste Entscheidung. **Fenster Okt–Feb** |
| **5** | **Z5 Industrie** | Herstellerseiten | Als **Quelle** sofort (Rang 1), als Vertriebsziel zuletzt |

**Die Zeile zu Z5 ist kein Widerspruch:** Der Hersteller wird in Welle 1
erfasst, weil sein Händlerverzeichnis Z1 erschließt und weil der
Premiumwerften-Nachlass eine gepflegte Herstellerliste braucht. Angesprochen
wird er zuletzt.

---

## 6. Risiken

| ID | Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|---|
| **LR-01** | Recherchedaten landen direkt im CRM | Geprüfter Bestand und Vermutung nicht mehr unterscheidbar | Getrenntes Schema, ein einziger Übergabeendpunkt ([ADR-0001](adr/0001-rechercheraum-getrennt.md)) |
| **LR-02** | Prüfliste wächst schneller als sie abgearbeitet wird | Halde, die nie abgebaut wird; System wird umgangen | **Freigabebremse** ab 100 offenen Objekten (Kapitel 9.4) |
| **LR-03** | Kaltmail wird „nur einmal" versucht | Abmahnung, Bußgeld, Rufschaden im kleinen Revier | Technische Sperre statt Richtlinie (Kapitel 10.2) |
| **LR-04** | Informationspflicht wird übersehen | Aufsichtsverfahren, und der Verstoß ist dokumentiert | `L-31` mit 21-Tage-Vorlauf, Aufgabe nicht verschiebbar |
| **LR-05** | Quelle wird ohne Zulässigkeitsprüfung genutzt | Sperre, Unterlassungsanspruch, Datengrundlage entfällt | `erlaubnis = UNGEKLAERT` verhindert den Lauf technisch |
| **LR-06** | Score wird als Wahrheit gelesen | Falsche Reihenfolge der Gespräche, unbemerkt | Zwei Werte, Herleitung sichtbar, kein Gesamtscore |
| **LR-07** | Grundgesamtheit wird geschätzt und nie geprüft | Abdeckungsgrad wird zur Wohlfühlzahl | Nenner mit Datum und Quelle, jährliche Prüfung |
| **LR-08** | Automatische Zusammenführung wird „aus Bequemlichkeit" eingebaut | Praktisch nicht rückgängig zu machen | Modell und API kennen nur Vorschläge |
| **LR-09** | Ablehnung wird nicht zurückgespielt | Dasselbe Ziel wird erneut angesprochen | Ereignisse `crm.organisation.status_changed` und `crm.contact.objected` |
| **LR-10** | Recherche läuft, bevor die Zulassung besteht (V3/V4) | Bestand, der nicht genutzt werden darf | Reihenfolge Zulassung → Recht → Mandant → Recherche |

---

## 7. Empfehlung

| Sofort | Warum |
|---|---|
| **Grundgesamtheit AT erheben** (L-04) | Ohne Nenner keine Leitkennzahl — und die Erhebung selbst liefert bereits die ersten hundert Objekte |
| **Kanalmatrix rechtlich klären** (L-02) | Ohne sie ist keine Ansprache zulässig. Der einzige echte Blocker |
| **Drei Herstellerverzeichnisse auswerten** | Erschließt Z1 fast vollständig, ohne Technik |
| Interessenabwägung und Informationstext erstellen (L-03) | Braucht Vorlauf, verhindert später Stillstand |

| Bewusst später | Warum |
|---|---|
| Anreicherung durch Sprachmodelle | Erst nach L-05, und erst wenn die Menge es rechtfertigt |
| Zweiter Mandant | Erst ab 70 % Abdeckung in AT |
| Ausgefeilte Scoringmodelle | Der Basiswert reicht für 500 Objekte vollkommen |
| Alles, was Kaltmail ähnelt | Kapitel 10 |
