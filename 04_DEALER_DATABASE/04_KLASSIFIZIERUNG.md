# 04 — Händlerklassifizierung

---

## 1. Was A, B, C leisten müssen — und was nicht

Eine Klassifizierung ist keine zweite Bewertung. Der **Händlerwert** (Kapitel 5)
sagt, wie viel ein Betrieb wert ist; die **Klasse** sagt, wie oft man hinfährt.

> **Die Klasse ist eine Betreuungsentscheidung, kein Urteil über den Betrieb.**

Deshalb wird sie **abgeleitet**, nicht von Hand vergeben — und deshalb ist die
einzige Frage, an der sie sich messen lassen muss: *Passt die Summe der
Kontaktfrequenzen zu der Zahl der Menschen, die sie leisten sollen?* (§5)

---

## 2. Die drei Klassen

### A — Schlüsselhändler

**Definition.** Trifft **mindestens zwei** der folgenden Bedingungen:

| Bedingung |
|---|
| Händlerwert ≥ 75 |
| `boote_pro_jahr` ≥ 25 aus `SELBSTAUSKUNFT` |
| Mindestens eine Marke der Preisklasse `PREMIUM` oder `LUXUS` als Vertragshändler |
| Aktive Kooperation `VERSICHERUNGSVERMITTLUNG` |
| Mehr als ein Standort im Hauptrevier |

**Umsatzpotenzial.** Der Bereich, in dem eine einzelne Beziehung den
Jahresertrag messbar verändert. Grobe Größenordnung: 25 vermittelte Boote im
Jahr, davon ein Teil versichert — das ist mehr als der gesamte C-Bereich
zusammen.

**Priorität.** Höchste. Bei knapper Kapazität wird hier **nicht** gekürzt.

**Kontaktfrequenz.** Alle **60 Tage** ein echter Kontakt (Besuch, Telefonat mit
Ergebnis, gemeinsame Veranstaltung). Eine Mail zählt nicht.

**Betreuung.** Namentlich zugeordnet. Ein A-Händler ohne benannten Betreuer ist
ein Fehler im Datenbestand, kein Zustand.

---

### B — Regelhändler

**Definition.** Händlerwert 50–74, oder A-Bedingungen nur einfach erfüllt.

**Umsatzpotenzial.** Trägt den Bestand. Einzeln unauffällig, in der Summe der
größte Block.

**Priorität.** Regulär. Der Bereich, in dem Automatisierung wirklich hilft —
Fristen, Wiedervorlagen, Veranstaltungseinladungen.

**Kontaktfrequenz.** Alle **120 Tage**.

---

### C — Beobachtungshändler

**Definition.** Händlerwert unter 50, oder Datenlage zu dünn für eine Einstufung.

**Umsatzpotenzial.** Gering oder unbekannt. **Beides ist ausdrücklich verschieden**
und wird unterschieden (§4).

**Priorität.** Nachrangig. Sammelbearbeitung, Kampagnenfenster,
Veranstaltungseinladungen.

**Kontaktfrequenz.** Einmal **jährlich**, gebündelt — typischerweise vor
Saisonbeginn.

---

## 3. Ableitung, Übersteuerung, Begründung

```
   Händlerwert  ──┐
   boote_pro_jahr ├──▶  Regelwerk  ──▶  klasse  (abgeleitet, nächtlich)
   Marken         │
   Kooperation    │
   Standorte    ──┘
                                         │
                                         ▼
                              klasse_manuell  (optional)
                              + klasse_begruendung  (Pflicht)
```

**Die Übersteuerung ist erlaubt und wird protokolliert.** Es gibt gute Gründe:
Ein Betrieb, der gerade zwei Marken verloren hat, kann trotzdem A bleiben, weil
die Beziehung trägt. Was nicht erlaubt ist, ist eine Übersteuerung **ohne
Begründung** — dann wandert innerhalb eines Jahres der halbe Bestand nach A, und
die Klassifizierung ist wertlos.

**Monatlicher Bericht:** Wie viele Übersteuerungen bestehen, von wem, mit welcher
Begründung. Über 15 % ist ein Anlass, das Regelwerk zu prüfen — nicht die
Mitarbeiter.

---

## 4. „Gering" und „unbekannt" sind nicht dasselbe

Ein C-Händler mit belegten 4 Booten im Jahr ist ein kleiner Betrieb.
Ein C-Händler ohne jede Angabe ist ein **unbearbeiteter Datensatz**.

| Fall | Kennzeichen | Folge |
|---|---|---|
| Klein und bekannt | `boote_pro_jahr` gesetzt, Herkunft `SELBSTAUSKUNFT` | Klasse C, jährlicher Kontakt |
| Unbekannt | `boote_pro_jahr` leer | Klasse C **plus Anreicherungsaufgabe** |

Das ist derselbe Grundsatz wie im Scoringmodell des Moduls 03: Unbekanntes wird
nicht zum Mittelwert gerundet, sondern als unbekannt geführt — und erzeugt
Arbeit, nicht eine Zahl.

---

## 5. Die Kapazitätsprobe — ohne sie ist die Klassifizierung Zierde

Aus [`02_CORE_CRM/13_STARTKONFIGURATION.md`](../02_CORE_CRM/13_STARTKONFIGURATION.md):
**zwei Personen, 50 Aufgaben am Tag**, davon höchstens 15 für Akquise
([ADR-0006 Modul 03](../03_LEAD_GENERATION_ENGINE/adr/0006-kapazitaet-begrenzt.md)).

Rechnung für einen Bestand von 250 österreichischen Händlern in plausibler
Verteilung:

| Klasse | Anteil | Anzahl | Frequenz | Kontakte/Jahr |
|---|---|---|---|---|
| A | 8 % | 20 | 60 Tage | **122** |
| B | 30 % | 75 | 120 Tage | **228** |
| C | 62 % | 155 | jährlich | **155** |
| | | **250** | | **505** |

**505 Betreuungskontakte im Jahr** sind bei etwa 220 Arbeitstagen rund **2,3 am
Tag** — zusätzlich zu Bestandsarbeit, Angeboten und Schadenfällen.

| Bewertung | |
|---|---|
| Machbar? | **Knapp.** Es ist die Obergrenze, nicht der bequeme Fall |
| Was bricht zuerst? | Die B-Klasse — sie ist zahlenmäßig am größten und am wenigsten dringend |
| Wo wird gekürzt? | **Nie bei A.** Zuerst wird C von jährlich auf alle 18 Monate gestreckt |

**Die Folgerung für den Aufbau:** Der Bestand darf nicht schneller wachsen, als
Betreuung möglich ist. Ein vierter A-Händler ist mehr wert als vierzig neue
C-Datensätze — und genau das misst der Aktualitätsgrad, nicht die Anzahl.

---

## 6. Klassenwechsel

| Wechsel | Auslöser | Folge |
|---|---|---|
| C → B | Datenlage vervollständigt, Wert ≥ 50 | Betreuungsaufgabe entsteht |
| B → A | Kooperation unterzeichnet, oder Wert ≥ 75 | **Betreuer wird benannt** — Pflicht |
| A → B | Wert unter 75 über zwei Quartale | Aufgabe: Ursache klären, **nicht** stillschweigend absteigen |
| beliebig → C | Marken verloren, Betrieb ruht | Aufgabe: Lage prüfen |
| beliebig → beendet | `ORGANISATION.status = BEENDET` | Klasse entfällt, Datensatz bleibt |

**Ein Abstieg von A nach B erzeugt immer eine Aufgabe.** Ein Schlüsselhändler,
der leiser wird, ist die früheste Warnung, die dieses System überhaupt geben
kann — meist Monate, bevor die Kooperation endet.
