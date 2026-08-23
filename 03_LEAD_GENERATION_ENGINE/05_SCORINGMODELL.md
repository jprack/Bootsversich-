# 05 — Scoringmodell

---

## 1. Das Problem mit dem geforderten Score

Der Auftrag nennt acht Kriterien: Unternehmensgröße, Marktrelevanz, Region,
Bootsbestand, Online-Präsenz, Kooperationspotenzial, Versicherungspotenzial,
Umsatzpotenzial.

**Vier davon sind zum Zeitpunkt der Recherche nicht bekannt** — nicht schwer zu
ermitteln, sondern schlicht nicht vorhanden: Bootsbestand, Kooperationspotenzial,
Versicherungspotenzial, Umsatzpotenzial. Wer sie trotzdem in eine Zahl schreibt,
schätzt — und die Schätzung ist danach von einer Tatsache nicht mehr zu
unterscheiden.

Das ist kein theoretischer Einwand. Ein Vertriebsmitarbeiter, der einen Lead mit
„87" angezeigt bekommt, ruft dort zuerst an. Wenn die 87 zu zwei Dritteln aus
Annahmen besteht, ist die Reihenfolge der Gespräche zufällig — und niemand merkt
es, weil das System sicher aussieht.

**Deshalb zwei Werte statt einem.**

---

## 2. Zweistufiges Modell

| Wert | Speist sich aus | Wann verfügbar | Wofür |
|---|---|---|---|
| **Basiswert** 0–100 | ausschließlich **beobachtbaren** Tatsachen | sofort nach der Erfassung | **Reihenfolge der Ansprache** |
| **Potenzialwert** 0–100 | Angaben aus dem **Gespräch** | erst nach Erstkontakt | Priorität der Weiterverfolgung, Prognose |

Der Basiswert beantwortet: *Wen rufe ich als Nächstes an?*
Der Potenzialwert beantwortet: *Wie viel Mühe ist dieser Partner wert?*

**Ein leerer Potenzialwert ist die richtige Anzeige, solange niemand gesprochen
hat.** Er wird als „—" dargestellt, nicht als 0 und nicht als Schätzung. Die
Oberfläche zeigt beide Werte nebeneinander und nie eine Summe: Eine Summe würde
Gemessenes und Erfragtes vermischen.

---

## 3. Basiswert — Gewichtung

Fünf Kriterien, 100 Punkte. Alle fünf sind ohne Gespräch feststellbar.

| Nr. | Kriterium | Punkte | Woher |
|---|---|---|---|
| **B1** | **Zielgruppentyp** | **30** | Cluster und Untergruppe |
| **B2** | **Größenindikator** | **25** | Liegeplätze, Mitglieder, Flotte, Mitarbeiter |
| **B3** | **Revier- und Regionsgewicht** | **20** | Standort |
| **B4** | **Erreichbarkeit und Datenlage** | **15** | Vollständigkeit belegter Felder |
| **B5** | **Marktsichtbarkeit** | **10** | Website, Aktualität, Nennung in mehreren Quellen |
| | **Summe** | **100** | |

### B1 — Zielgruppentyp (30)

Der Typ ist das stärkste bekannte Merkmal, weil er den Zugangsweg und den Hebel
festlegt (Kapitel 2).

| Untergruppe | Punkte |
|---|---|
| Bootshändler | 30 |
| Marina / Hafenbetreiber | 28 |
| Charterunternehmen | 26 |
| Yachtmakler | 24 |
| Yacht- / Segel- / Motorbootclub | 20 |
| Werft | 18 |
| Wassersportverein | 16 |
| Servicebetrieb | 12 |
| Wassersportschule | 10 |
| Boots- / Motorenhersteller | 6 |

Hersteller stehen absichtlich unten: Sie sind als **Datenquelle** wertvoll, nicht
als Vertriebsziel — und der Basiswert steuert die Ansprache, nicht die
Datenpflege.

### B2 — Größenindikator (25)

Je Zielgruppe eine eigene Skala, weil „groß" bei einem Verein etwas anderes heißt
als bei einer Marina.

| Zielgruppe | Maß | 25 P | 18 P | 12 P | 6 P | 0 P |
|---|---|---|---|---|---|---|
| Marina, Hafen | Liegeplätze | ≥ 500 | 250–499 | 100–249 | 30–99 | < 30 |
| Club, Verein | Mitglieder | ≥ 500 | 250–499 | 100–249 | 40–99 | < 40 |
| Charter | Flotte | ≥ 30 | 15–29 | 6–14 | 2–5 | 1 |
| Handel, Werft, Service | Mitarbeiter | ≥ 50 | 20–49 | 8–19 | 3–7 | < 3 |

**Unbekannt ⇒ 0 Punkte, nicht Mittelwert.** Ein Mittelwert für Unbekanntes hebt
schlecht dokumentierte Objekte künstlich an und erzeugt genau die Verzerrung, die
Kapitel 5.1 beschreibt. Ein Objekt ohne Größenangabe kann also höchstens 75
erreichen — und das ist die zutreffende Aussage: Wir wissen zu wenig.

### B3 — Revier und Region (20)

Nicht Postleitzahl, sondern **Revier** — das ist die fachlich richtige Einheit,
weil sich Bootsbestand an Gewässern sammelt und nicht an Verwaltungsgrenzen.

| Lage | Punkte |
|---|---|
| Hauptrevier im eigenen Mandanten, erreichbar an einem Tag | 20 |
| Nebenrevier im eigenen Mandanten | 14 |
| Anderer Mandant, in dem eine Zulassung besteht | 10 |
| Binnenland ohne nennenswerten Bestand | 4 |
| Außerhalb der Zulassung | **0 und Kennzeichen** — keine Ansprache |

Die Reviergewichtung ist als **Daten** gepflegt, nicht als Programmcode — wie
Tarifwerk und Automationsregeln. Ein neues Revier ist ein Datensatz, kein
Entwicklungsauftrag.

### B4 — Erreichbarkeit und Datenlage (15)

| Bedingung | Punkte |
|---|---|
| Telefonnummer belegt und normalisiert | 6 |
| Postanschrift vollständig | 4 |
| Unpersönliche E-Mail belegt | 3 |
| Ansprechpartner mit Funktion bekannt | 2 |

Warum Erreichbarkeit in den Score gehört: Ein hervorragendes Ziel ohne
Telefonnummer ist heute nicht bearbeitbar. Der Score steuert die
**Reihenfolge** — und ein nicht erreichbares Objekt gehört nicht an den Anfang,
sondern in die Anreicherung.

### B5 — Marktsichtbarkeit (10)

| Bedingung | Punkte |
|---|---|
| Eigene Website erreichbar | 4 |
| In mindestens zwei unabhängigen Quellen gefunden | 3 |
| Erkennbar gepflegt (Impressum aktuell, Saisonangaben) | 2 |
| Verbands- oder Herstellermitgliedschaft belegt | 1 |

Bewusst nur 10 Punkte. Eine aufwendige Website sagt über Versicherungsbedarf
wenig — sie sagt etwas über Marketingbudget. Der Auftrag gewichtet
„Online-Präsenz" höher; hier ist sie absichtlich klein gehalten, weil sonst der
kleine, gut versicherbare Familienbetrieb hinter der Agenturseite verschwindet.

---

## 4. Potenzialwert — nach dem Gespräch

Vier Kriterien, 100 Punkte. **Jedes Feld ist ein Gesprächsergebnis, kein
Rechercheergebnis.**

| Nr. | Kriterium | Punkte | Frage im Gespräch |
|---|---|---|---|
| **P1** | **Vermittlungspotenzial** | 35 | Wie viele Boote wechseln hier im Jahr den Halter oder kommen neu dazu? |
| **P2** | **Eigener Versicherungsbedarf** | 25 | Welche Deckungen bestehen, wann laufen sie aus, wer betreut sie? |
| **P3** | **Kooperationsbereitschaft** | 25 | Besteht Interesse an Empfehlung, Portal, gemeinsamer Ansprache? |
| **P4** | **Erreichbarkeit der Entscheidung** | 15 | Wer entscheidet, und wie lange dauert das? |

**P4 wird regelmäßig unterschätzt.** Ein Verein mit hohem P1, dessen Entscheidung
zwölf Monate braucht, bindet Kapazität, die anderswo im selben Zeitraum drei
Abschlüsse bringt. Bei zwei Personen ist das der Unterschied zwischen einem guten
und einem schlechten Jahr.

**Hauptfälligkeit als Sonderfeld:** Wird in P2 ein Ablaufdatum bestehender
Deckungen genannt, entsteht daraus **keine Punktzahl, sondern eine
Wiedervorlage** — 120 Tage vor dem Termin (Kapitel 9). Ein Datum ist wertvoller
als jeder Score.

---

## 5. Klassen und was sie auslösen

| Klasse | Basiswert | Bedeutung | Auslösung |
|---|---|---|---|
| **A** | ≥ 75 | Vorrangig | Aufgabe binnen 5 Arbeitstagen, persönliche Ansprache |
| **B** | 55–74 | Regulär | Aufgabe in der laufenden Welle |
| **C** | 35–54 | Nachrangig | Sammelbearbeitung, Kampagnenfenster |
| **D** | < 35 | Ruht | Keine Aufgabe. Bleibt erfasst, zählt zur Abdeckung |

**Klasse D erzeugt keine Aufgabe und wird trotzdem gespeichert.** Das ist wichtig
für den Abdeckungsgrad: Ein bewusst nicht bearbeitetes Objekt ist bearbeitet
worden — es wurde beurteilt. Ein unbekanntes ist es nicht.

---

## 6. Erklärbarkeit — die Pflicht, ohne die der Score wertlos ist

Jeder gesetzte Wert schreibt `score_herleitung` mit. Ohne diesen Eintrag ist das
Setzen des Scores technisch nicht möglich.

```
{
  "modell": "basis-1.0",
  "berechnet_am": "2026-09-14T08:12:03Z",
  "summe": 78,
  "posten": [
    {"code":"B1","punkte":28,"grund":"untergruppe=MARINA"},
    {"code":"B2","punkte":18,"grund":"liegeplaetze=310","beleg":"OBJEKTBELEG:8f2c…"},
    {"code":"B3","punkte":20,"grund":"revier=Attersee (Hauptrevier AT)"},
    {"code":"B4","punkte":9,"grund":"telefon+anschrift belegt, keine E-Mail"},
    {"code":"B5","punkte":3,"grund":"zwei unabhängige Quellen"}
  ]
}
```

Drei Wirkungen:

1. **Der Vertrieb kann widersprechen.** „Die 18 Punkte für 310 Liegeplätze
   stimmen nicht, das sind Trockenplätze" ist eine verwertbare Rückmeldung. „Der
   Score ist zu hoch" ist keine.
2. **Modelländerungen sind nachvollziehbar.** Der Modellname steht im Eintrag;
   alte Werte bleiben nachvollziehbar, auch wenn die Gewichtung sich ändert.
3. **Ohne Erklärung glaubt es niemand** — und ein Score, dem niemand glaubt,
   steuert nichts.

---

## 7. Neuberechnung

| Anlass | Wirkung |
|---|---|
| Neuer oder geänderter Beleg | Basiswert neu, mit neuem Zeitstempel |
| Gewichtungsänderung | **Alle** Objekte neu, Modellversion erhöht |
| Gesprächsergebnis | Potenzialwert neu |
| Sperrvermerk | Beide Werte werden **nicht** gelöscht, die Klasse wird ausgesetzt |

**Der Score wird nachts neu berechnet, nicht bei jeder Änderung.** Ein Wert, der
sich während der Bearbeitung einer Liste verschiebt, macht die Liste unbrauchbar.

---

## 8. Was der Score niemals tun darf

| Verboten | Grund |
|---|---|
| **Automatische Ablehnung** eines Objekts wegen niedrigem Score | Stehende Projektvorgabe. Ein niedriger Score heißt „später", nicht „nie" |
| **Automatische Ansprache** ab einem Schwellenwert | Kapitel 10, [ADR-0004](adr/0004-ansprache-ohne-kaltmail.md) |
| Score auf **Personen** statt Organisationen | Bewertung natürlicher Personen ohne Notwendigkeit — vermeidbarer Personenbezug |
| Merkmale ohne sachlichen Bezug (Name, Herkunft, vermutete Zugehörigkeit) | Sachfremd und rechtlich angreifbar |
| Anzeige eines **Gesamtscores** aus Basis- und Potenzialwert | Vermischt Gemessenes mit Erfragtem |
| Score ohne `score_herleitung` | §6 |
