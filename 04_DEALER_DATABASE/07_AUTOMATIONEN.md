# 07 — Automatische Aufgaben

Alle Regeln sind **Daten**, kein Programmcode — wie im Kern-CRM
([ADR-0004](../02_CORE_CRM/adr/0004-automationen-als-daten.md)). Eigener
Codebereich `D-…`, damit Herkunft und Wirkung auseinanderzuhalten sind.

---

## 1. Regelkatalog

### Gruppe 1 — Zugang

| Code | Auslöser | Aufgabe | Frist | Prio |
|---|---|---|---|---|
| `D-01` | Neuer Händler aus der Recherche freigegeben | Erstansprache vorbereiten | 5 AT | HOCH |
| `D-02` | Neuer Ansprechpartner erfasst | Zuordnung prüfen: Standort, Funktion, Entscheidungsbefugnis | 10 AT | NORMAL |
| `D-03` | Händler ohne benannten Betreuer, Klasse A oder B | Betreuer benennen | 5 AT | HOCH |
| `D-04` | Neue Kooperation auf `AKTIV` | Aufnahmegespräch: Ablauf, Ansprechpartner, Unterlagen | 10 AT | HOCH |

### Gruppe 2 — Betreuungsfristen

| Code | Auslöser | Aufgabe | Prio |
|---|---|---|---|
| `D-11` | Klassenfrequenz überschritten (A 60 · B 120 · C 365 Tage) | Betreuungskontakt | nach Klasse |
| `D-12` | **Kein Kontakt seit 90 Tagen** bei Klasse A oder B | Nachfassen — vor der Frequenzgrenze | HOCH |
| `D-13` | **Kein Kontakt seit 180 Tagen**, gleich welche Klasse | Lage klären: besteht die Beziehung noch? | HOCH |
| `D-14` | Kein Kontakt seit 365 Tagen bei aktiver Kooperation | **Eskalation an die Führung** | DRINGEND |
| `D-15` | `PARTNER_AKTIV` ohne Vermittlung seit 12 Monaten | Ursache klären, Status `PARTNER_RUHEND` prüfen | HOCH |

**`D-14` ist die wichtigste Regel des Katalogs.** Eine unterschriebene
Kooperation, bei der ein Jahr lang niemand angerufen hat, ist der Normalfall
kurz vor der Kündigung — und der einzige Fall, in dem die Führung es erfahren
muss, bevor der Vertrieb es meldet.

### Gruppe 3 — Marken, Standorte, Datenqualität

| Code | Auslöser | Aufgabe |
|---|---|---|
| `D-21` | `HAENDLER_MARKE.gueltig_bis` erreicht oder Marke entzogen | Folgen klären: Ersatzmarke, Klassenwirkung, Gesprächsanlass |
| `D-22` | Neue Marke bei einem bestehenden Händler entdeckt | Bestätigen und Gebiet erfassen |
| `D-23` | Neuer Standort entdeckt | Zuordnung prüfen: eigener Rechtsträger oder Filiale? (Kapitel 3.5) |
| `D-24` | `boote_pro_jahr` fehlt, Klasse A oder B | **Anreicherung im nächsten Gespräch** — nicht per Anruf eigens |
| `D-25` | Tragende Angaben älter als 12 Monate | Datenstand bestätigen (Aktualitätsgrad) |
| `D-26` | Umsatzklasse oder Bootszahl mit Herkunft `SCHAETZUNG` | Im nächsten Gespräch belegen lassen |
| `D-27` | Website nicht erreichbar, Post unzustellbar | Existenz prüfen |

### Gruppe 4 — Anlässe

| Code | Auslöser | Aufgabe | Bedingung |
|---|---|---|---|
| `D-31` | **Geburtstag** eines Ansprechpartners | Persönlicher Gruß | **Nur wenn das Feld befüllt ist** und die Person Klasse A oder B betreut (§3) |
| `D-32` | Messe im Kalender, Händler ist Aussteller | Standbesuch vorbereiten | 21 Tage vorher |
| `D-33` | Messe im Kalender, Händler ist nicht gemeldet | Einladung zum gemeinsamen Termin | 30 Tage vorher |
| `D-34` | Saisonstart im Revier | Sammelaufgabe: Saisonansprache je Revier | jährlich |
| `D-35` | Jahrestag der Kooperation | Jahresgespräch mit Zahlen | 14 Tage vorher |
| `D-36` | Veranstaltungsteilnahme erfasst | Nachbereitung binnen 5 AT | |

### Gruppe 5 — Cross-Selling

| Code | Auslöser | Aufgabe |
|---|---|---|
| `D-41` | Händler vermittelt, hat aber **selbst keinen Vertrag** | Eigenen Bedarf ansprechen: Betriebshaftpflicht, fremdes Eigentum in Obhut |
| `D-42` | Händler betreibt Winterlager oder Halle, keine entsprechende Deckung bekannt | Lagerrisiko ansprechen |
| `D-43` | Händler betreibt Charter (Produktbereich `CHARTER`) | Flottenangebot — die Festpreisliste liegt vor |
| `D-44` | Händler betreibt Marina oder Liegeplätze | Liegeplatzhaftung ansprechen |
| `D-45` | Produktbereich `VERSICHERUNG` gesetzt | **Keine Vertriebsaufgabe.** Hinweis an den Betreuer: anderer Gesprächseinstieg |

**`D-41` ist wirtschaftlich die ergiebigste Regel dieses Moduls.** Ein Händler,
der uns Kunden schickt und selbst woanders versichert ist, ist der einfachste
Abschluss im gesamten Bestand — und fällt ohne Regel niemandem auf.

**`D-45` erzeugt bewusst keine Aufgabe**, sondern eine Kennzeichnung: Ein
Betrieb, der selbst vermittelt, ist kein leichteres Ziel, sondern ein anderes.

### Gruppe 6 — Führung

| Code | Auslöser | Empfänger |
|---|---|---|
| `D-51` | Klassenwechsel A → B | Führung, sofort |
| `D-52` | Kooperation gekündigt | Führung, sofort, mit Grund |
| `D-53` | Übersteuerte Klassen über 15 % des Bestands | Führung, monatlich |
| `D-54` | Aktualitätsgrad unter 70 % | Führung, monatlich |
| `D-55` | Betreuungsrückstand über zwei Wochen bei Klasse A | Führung, wöchentlich |

---

## 2. Dublettenschlüssel

Format wie im Kern-CRM: `D-<regel>:<bezugstyp>:<bezug_id>:<zeitraum>`

```
D-11:ORGANISATION:9f31…:2026-Q3      Betreuungsfrist, quartalsgenau
D-31:KONTAKT:4c7a…:2026              Geburtstag, jahresgenau
D-34:REVIER:attersee:2026            Saisonansprache, jährlich
D-41:ORGANISATION:9f31…:einmalig     Cross-Selling, genau einmal
```

Die Zeitkomponente bestimmt, wann dieselbe Regel wieder greifen darf. Das Feld
ist `UNIQUE` — ohne diese Bedingung erzeugt ein zweimal laufender Nachtjob eine
zweite Aufgabe.

---

## 3. Die Geburtstagsregel im Einzelnen

`D-31` ist die einzige Regel des Katalogs, die auf einem freiwillig genannten
personenbezogenen Datum beruht. Sie hat deshalb vier Bedingungen:

| Bedingung | Grund |
|---|---|
| Das Feld ist befüllt | Es wird nie recherchiert (Kapitel 2.5) |
| Die Herkunft ist `SELBSTAUSKUNFT` | Alles andere wäre kein freiwillig genanntes Datum |
| Die Person betreut einen Händler der Klasse A oder B | Bei C wäre der Anlass konstruiert |
| Es besteht kein Widerspruch | Wie bei jeder Ansprache |

**Fällt eine der vier weg, entsteht keine Aufgabe** — und es entsteht auch kein
Hinweis darauf, dass eine hätte entstehen können.

---

## 4. Fünf Unterdrückungsprüfungen

Vor jeder Aufgabenerzeugung, in dieser Reihenfolge:

| Nr. | Prüfung | Wirkung |
|---|---|---|
| 1 | Dublettenschlüssel existiert | Keine zweite Aufgabe |
| 2 | Aktiver Sperrvermerk oder Widerspruch | **Keine Aufgabe, keine Ausnahme** |
| 3 | Offene Aufgabe gleicher Art zum selben Bezug | Bündelung statt Neuanlage |
| 4 | Organisation auf `BEENDET` | Keine Aufgabe |
| 5 | Tageskontingent erschöpft | Staffelung (§5) |

---

## 5. Lastschutz

Die Grenze bleibt: **50 Aufgaben am Tag für zwei Personen**, davon höchstens 15
für Akquise. Dieses Modul erzeugt **Betreuungs**aufgaben, die aus einem eigenen
Kontingent kommen:

| Kontingent | Zweck |
|---|---|
| **15/Tag** | Akquise (Modul 03) |
| **12/Tag** | Händlerbetreuung (dieses Modul) |
| Rest | Bestand, Fristen, Schäden |

Aus der Kapazitätsprobe in Kapitel 4.5: 505 Betreuungskontakte im Jahr sind rund
2,3 am Tag. Das Kontingent von 12 ist damit nicht die Grenze — es fängt nur die
Spitzen ab, die entstehen, wenn mehrere Fristen zusammenfallen.

| Mechanismus | Wirkung |
|---|---|
| **Bündelung** | Klasse C nie einzeln, sondern als Revierliste |
| **Staffelung** | Über dem Kontingent rücken Aufgaben nach — nach Klasse, dann nach Alter |
| **Vorrang** | `D-14`, `D-52` und Rechtspflichten sind nie staffelbar |
| **Kapazitätswarnung** | Rückstau dauerhaft über dem Dreifachen ⇒ Meldung an die Führung |

---

## 6. Was Automationen nie tun dürfen

| Verboten | Grund |
|---|---|
| Eine Nachricht an den Händler senden | Der Motor findet, der Mensch spricht ([ADR-0004 Modul 03](../03_LEAD_GENERATION_ENGINE/adr/0004-ansprache-ohne-kaltmail.md)) |
| Einen Händler wegen niedrigem Wert stillschweigend abstufen | Kapitel 4.6 |
| Eine Kooperation als aktiv setzen | Nur mit unterzeichnetem Dokument |
| Zwei Organisationen zusammenführen | CR-03 des Kern-CRM |
| Einen Geburtstag ermitteln oder ergänzen | §3 |
| Personenbezogenes Tracking auslösen | Kapitel 8 |
| Aufgaben ohne Dublettenschlüssel erzeugen | §2 |

---

## 7. Einführung

Kein Trockenlauf, keine Aktivierung — wie im Kern-CRM. Über 40 Aufgaben am Tag
im Trockenlauf heißt: Regel zu weit gefasst.

**Startpaket: sieben Regeln** — `D-01`, `D-03`, `D-12`, `D-13`, `D-14`, `D-41`,
`D-52`. Vier davon sichern Fristen, zwei melden an die Führung, eine bringt
Umsatz. Alles Weitere kommt einzeln nach, mit zwei Wochen Beobachtung des
Rückstaus.
