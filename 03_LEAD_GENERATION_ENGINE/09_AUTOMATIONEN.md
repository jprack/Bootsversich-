# 09 — Automationen und Aufgabenmanagement

Alle Regeln sind **Daten**, kein Programmcode — dieselbe Festlegung wie im
Kern-CRM ([ADR-0004](../02_CORE_CRM/adr/0004-automationen-als-daten.md)). Sie
liegen in derselben Tabelle `AUTOMATISIERUNGSREGEL`, mit eigenem Codebereich
`L-…`, damit Herkunft und Wirkung auseinanderzuhalten sind.

---

## 1. Regelkatalog

### Gruppe 1 — Neue Ziele (Auslöser: Freigabe ins CRM)

| Code | Auslöser | Aufgabe | Frist | Priorität |
|---|---|---|---|---|
| `L-01` | Freigabe, Basiswert ≥ 75 | Erstansprache vorbereiten und durchführen | 5 AT | HOCH |
| `L-02` | Freigabe, Basiswert 55–74 | Erstansprache | 15 AT | NORMAL |
| `L-03` | Freigabe, Basiswert 35–54 | **Sammelaufgabe** je Woche und Revier | wöchentlich | NIEDRIG |
| `L-04` | Freigabe Untergruppe `BOOTSHAENDLER` | Händlergespräch — Dealer Hub vorstellen | 5 AT | HOCH |
| `L-05` | Freigabe Untergruppe `MARINA`/`HAFENBETREIBER` | Betreibergespräch — eigene Deckung prüfen | 10 AT | HOCH |
| `L-06` | Freigabe Cluster Z3 | **Nur im Fenster Okt–Feb.** Außerhalb: Wiedervorlage auf 1. Oktober | 15 AT | NORMAL |
| `L-07` | Freigabe Untergruppe `CHARTER` | Flottengespräch, Festpreisliste vorbereiten | 10 AT | HOCH |
| `L-08` | Freigabe Cluster Z5 | **Keine Vertriebsaufgabe.** Datenpflegeaufgabe: Händlerliste auswerten | 30 AT | NIEDRIG |

**`L-08` ist die Regel, die den meisten Nutzen bringt und am wenigsten wie
Vertrieb aussieht.** Ein Hersteller wird nicht angerufen — sein Verzeichnis wird
als Quelle angelegt. Ein Hersteller liefert dreißig Händler.

### Gruppe 2 — Fristen und Nachfassen

| Code | Auslöser | Aufgabe | Frist |
|---|---|---|---|
| `L-11` | `NEU` überschreitet Höchstverweildauer | Eskalation, Priorität steigt um eine Stufe | sofort |
| `L-12` | `KONTAKTIERT` ohne Reaktion, 21 Tage | Zweitansprache über anderen Kanal | sofort |
| `L-13` | Zweitansprache ohne Reaktion, 21 Tage | Entscheidung erzwingen: verloren oder Wiedervorlage | sofort |
| `L-14` | `TERMIN` + 5 Tage ohne Nachbereitung | Gesprächsergebnis erfassen, Potenzialwert setzen | sofort |
| `L-15` | Angebotsfrist + 3 Tage | Nachfassen | sofort |
| `L-16` | `VERHANDLUNG` 60 Tage | Klärung: Wer entscheidet, bis wann? | sofort |
| `L-17` | Wiedervorlagedatum erreicht | Erneute Ansprache | am Tag |
| `L-18` | Genannte Hauptfälligkeit − 120 Tage | **Ansprache vor Ablauf der bestehenden Deckung** | am Tag, HOCH |

**`L-18` ist wirtschaftlich die stärkste Regel des ganzen Katalogs.** Sie
verwandelt eine Absage („wir sind versichert") in einen datierten Termin. Der
Wert steckt nicht im Score, sondern in dem Datum, das im Gespräch fällt.

### Gruppe 3 — Datenpflege und Verfall

| Code | Auslöser | Aufgabe |
|---|---|---|
| `L-21` | Objekt in zwei Läufen der Hauptquelle nicht mehr gefunden | Existenz prüfen |
| `L-22` | Domain löst nicht mehr auf | Erreichbarkeit prüfen |
| `L-23` | Post unzustellbar | Anschrift prüfen, Objekt auf `ZURUECKGESTELLT` |
| `L-24` | Dublettenvorschlag ≥ 0,80 seit 14 Tagen offen | Entscheidung erzwingen |
| `L-25` | Objekt ohne Größenindikator, Klasse A oder B | Anreicherung: Größe ermitteln |
| `L-26` | Quelle ohne Lauf seit ihrem Takt + 30 Tage | Quelle prüfen oder inaktiv setzen |

### Gruppe 4 — Recht und Nachweis

| Code | Auslöser | Aufgabe | Charakter |
|---|---|---|---|
| `L-31` | `AKQUISEKONTAKT` angelegt, `information_versendet_am` leer, **Beleg älter als 21 Tage** | Informationspflicht erfüllen | **Pflicht, nicht verschiebbar** |
| `L-32` | Widerspruch eingegangen | Sperrvermerk setzen, Verarbeitung beenden | **sofort, höchste Priorität** |
| `L-33` | Sperrfrist abgelaufen | Freigabe zur erneuten Ansprache prüfen | NORMAL |
| `L-34` | Objekt ohne Kontakt und ohne Aktivität, 24 Monate | Aufbewahrungsprüfung (Kapitel 13.4) | NORMAL |
| `L-35` | Quelle mit `erlaubnis = UNGEKLAERT` seit 30 Tagen | Zulässigkeit klären oder Quelle löschen | HOCH |

**`L-31` hat einen Vorlauf von 21 Tagen gegenüber der Monatsfrist.** Eine
Rechtspflicht, deren Aufgabe am Fälligkeitstag entsteht, wird verletzt, sobald
jemand krank ist.

### Gruppe 5 — Führung

| Code | Auslöser | Empfänger |
|---|---|---|
| `L-41` | Prüfliste > 100 Objekte | Führung, wöchentlich |
| `L-42` | Abdeckungsgrad einer Zielgruppe sinkt | Führung, monatlich |
| `L-43` | Verlustgrund `AUSSERHALB_ZIELGRUPPE` > 20 % einer Quelle | Quellenverantwortung — **die Quelle ist falsch eingestuft** |
| `L-44` | Aufgabenrückstau > Tageskapazität × 5 | Führung — Kapazitätswarnung |

---

## 2. Dublettenschlüssel

Format wie im Kern-CRM: `L-<regel>:<bezugstyp>:<bezug_id>:<zeitraum>`

```
L-18:ORGANISATION:9f31…:2027-03      Hauptfälligkeit, monatsgenau
L-03:REVIER:attersee:2026-W38        Sammelaufgabe, kalenderwochengenau
L-31:AKQUISEKONTAKT:4c7a…:einmalig   Rechtspflicht, genau einmal
```

Die Zeitkomponente bestimmt, wann dieselbe Regel wieder greifen darf. Ohne sie
erzeugt ein zweimal laufender Nachtjob eine zweite Aufgabe — der Grund, weshalb
das Feld im Kern-CRM `unique` ist.

---

## 3. Fünf Unterdrückungsprüfungen

Vor jeder Aufgabenerzeugung, in dieser Reihenfolge:

| Nr. | Prüfung | Wirkung |
|---|---|---|
| 1 | Dublettenschlüssel existiert | Keine zweite Aufgabe |
| 2 | Aktiver Sperrvermerk | **Keine Aufgabe, keine Ausnahme** |
| 3 | Offene Aufgabe gleicher Art zum selben Bezug | Bündelung statt Neuanlage |
| 4 | Objekt ist `ZURUECKGESTELLT` und Datum nicht erreicht | Verschiebung |
| 5 | Tageskapazität erschöpft | Staffelung (§4) |

Prüfung 2 steht bewusst vor allen inhaltlichen: Ein Widerspruch schlägt jede
Vertriebslogik.

---

## 4. Lastschutz — der Motor darf nicht schneller sein als die Hände

Die Grenze aus [`02_CORE_CRM/13_STARTKONFIGURATION.md`](../02_CORE_CRM/13_STARTKONFIGURATION.md)
§4.6 gilt unverändert: **25 fällige Aufgaben je Person und Tag, bei zwei
Personen 50.** Der Vertrieb teilt sich diese Grenze mit Bestandsarbeit und
Fristen.

**Kontingent für die Akquise: höchstens 15 Aufgaben am Tag.** Der Rest gehört dem
Bestand, weil ein verlorener Bestandskunde teurer ist als ein nicht angerufener
Interessent.

| Mechanismus | Wirkung |
|---|---|
| **Bündelung** | Klasse C wird nie einzeln zugestellt, sondern als Wochenliste je Revier |
| **Staffelung** | Übersteigt die Freigabe das Kontingent, rücken Aufgaben nach — nach Basiswert, dann nach Alter |
| **Kapazitätswarnung** | Rückstau dauerhaft über dem Fünffachen ⇒ Meldung an die Führung statt weiterer Aufgaben |
| **Freigabebremse** | Prüfliste über 100 ⇒ neue Recherche**läufe** pausieren, bis der Rückstau unter 50 liegt |

**Die Freigabebremse ist der Punkt, an dem sich dieses Modul von einem üblichen
Lead-Tool unterscheidet.** Ein Motor, der weiterfindet, während niemand prüft,
erzeugt eine Halde. Die Halde wird nie abgearbeitet, und irgendwann wird das
ganze System umgangen. Deshalb bremst hier das Ende den Anfang.

---

## 5. Was Automationen nie tun dürfen

| Verboten | Grund |
|---|---|
| Eine Nachricht an ein Ziel senden | Kapitel 10 — Ansprache ist Menschensache |
| Ein Objekt wegen niedrigem Score verwerfen | Stehende Projektvorgabe |
| Zwei Organisationen zusammenführen | CR-03 des Kern-CRM |
| Einen Sperrvermerk aufheben | Nur ein Mensch, mit Begründung |
| Eine Rechtsgrundlage setzen oder ändern | Kapitel 13 |
| Aufgaben ohne Dublettenschlüssel erzeugen | §2 |
| Über das Tageskontingent hinaus zustellen | §4 |

---

## 6. Einführung — Trockenlauf

Keine Regel geht ohne Trockenlauf in Betrieb: Der Lauf wird gegen den echten
Bestand gerechnet und zeigt, **wie viele Aufgaben er erzeugt hätte**, ohne eine
zu erzeugen.

| Ergebnis | Entscheidung |
|---|---|
| < 15 Aufgaben am Tag | Aktivierung |
| 15–40 | Bündeln oder Schwelle anheben, erneut prüfen |
| > 40 | **Nicht aktivieren.** Die Regel ist zu weit gefasst |

**Startpaket: sechs Regeln** — `L-01`, `L-04`, `L-11`, `L-18`, `L-31`, `L-32`.
Die vier Vertriebsregeln decken den Anfang; `L-31` und `L-32` sind
Rechtspflichten und ab dem ersten Tag aktiv, nicht ab dem ersten Ausbauschritt.
