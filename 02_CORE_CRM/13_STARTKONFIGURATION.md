# 13 — Startkonfiguration

| Feld | Wert |
|---|---|
| Modul | `02_CORE_CRM` |
| Fassung | 1.0 |
| Datum | 2026-08-22 |
| Status | entschieden |
| Schließt | **C-02** Kundennummernkreis · **C-03** Bestandsübernahme · **C-04** Arbeitsplätze |
| Eröffnet | **C-07** Bestand beim Versicherer |

Dieses Kapitel hält drei Entscheidungen der Produktverantwortung fest und zieht
die Folgerungen daraus. Es steht getrennt, weil zwei davon **rückwirkend nicht
änderbar** sind: Ein Nummernkreis, der einmal vergeben wurde, und eine
Datenbank, die einmal befüllt wurde, lassen sich nicht neu beginnen.

---

## 1. Die drei Entscheidungen

| ID | Frage | Entscheidung |
|---|---|---|
| **C-02** | Kundennummernkreis | **Fortlaufend ab 1, ohne Bedeutung, mandantenübergreifend** |
| **C-03** | Bestandsübernahme | **Keine. Start auf leerer Datenbank** |
| **C-04** | Gleichzeitige Arbeitsplätze | **Zwei** |

Die drei hängen zusammen: Ein leerer Start erlaubt es, den Nummernkreis bei 1 zu
beginnen, weil keine Fremdnummer zu berücksichtigen ist. Und zwei Arbeitsplätze
machen die Werkbank aus [ADR-0005](adr/0005-wordpress-als-werkbank.md)
unstrittig — der Punkt, an dem neu zu entscheiden wäre, liegt beim Siebeneinhalbfachen.

---

## 2. C-02 — Der Kundennummernkreis

### 2.1 Festlegung

| Eigenschaft | Wert |
|---|---|
| **Beginn** | 1 |
| **Schrittweite** | 1 |
| **Geltungsbereich** | mandantenübergreifend — **eine** Folge für AT und DE |
| **Bedeutung** | keine. Die Nummer trägt keinerlei Information |
| **Darstellung** | sechsstellig mit führenden Nullen: `000001`, `000002`, … `001043` |
| **Speicherung** | `kundennummer text(20)`, global `UNIQUE` |
| **Vergabezeitpunkt** | beim Entstehen des `KUNDE`-Datensatzes — **nicht** beim Lead |
| **Wiederverwendung** | nie, auch nicht nach Löschung |
| **Lückenlosigkeit** | nicht zugesichert |

### 2.2 Warum eine Folge für beide Mandanten

Zwei Zähler, die beide bei 1 beginnen, erzeugen zweimal die Nummer `000047`.
Spätestens beim ersten Dokument, das in beiden Märkten auftaucht, beim ersten
Kunden mit Wohnsitzwechsel und beim ersten Telefonat, in dem jemand „Kunde
siebenundvierzig" sagt, ist offen, wer gemeint ist. Ein Präfix (`AT-000047`)
würde das lösen — dann trägt die Nummer aber wieder Bedeutung, und zwar eine,
die sich ändern kann.

Die Mandantentrennung leistet `mandant_id` mit Row Level Security. Sie leistet
sie vollständig. Der Nummernkreis muss sie nicht wiederholen.

### 2.3 Warum keine sprechende Nummer

Sprechende Nummern (`AT-2026-HAE-0042`) verschlüsseln Tatsachen: Markt, Jahr,
Herkunftskanal, Betreuer. Alle vier ändern sich. Ein Kunde wechselt den
Betreuer, ein Händler wird zum Direktkunden, ein Zuzug ändert den Markt. Dann
steht in der Nummer etwas Falsches — und eine Nummer, die man korrigieren
möchte, ist keine Nummer mehr, sondern ein Feld.

**Grundsatz:** Merkmale gehören in Spalten, nicht in Schlüssel. Jedes Merkmal,
das jemand in der Nummer sucht, steht im Datenmodell als eigenes Feld und ist
dort filterbar, auswertbar und **änderbar**.

### 2.4 Warum führende Nullen

Feste Länge, drei Wirkungen: Die Textsortierung entspricht der numerischen
Ordnung. Am Telefon ist die Nummer als Block vorlesbar. In Betreffzeilen,
Dateinamen und gescannten Belegen ist sie als Kundennummer erkennbar und nicht
als beliebige Zahl. Ab `999999` wächst die Darstellung auf sieben Stellen —
ohne Umstellung, weil das Feld Text ist und der Zähler weiterläuft.

### 2.5 Vergabemechanik

Eine PostgreSQL-Sequenz `kundennummer_seq`, gezogen in derselben Transaktion,
die den `KUNDE`-Datensatz anlegt.

**Lücken sind zulässig und werden nie nachgefüllt.** Ein abgebrochener
Anlagevorgang verbraucht eine Nummer. Lückenlosigkeit wäre nur mit einer
Sperrtabelle zu haben, die jede Kundenanlage serialisiert — und sie ist
fachlich nicht gefordert: Lückenlos müssen Rechnungsnummern sein, und die
entstehen nicht im CRM.

### 2.6 Abgrenzung zu den anderen Nummern

| Nummer | Herkunft | Form |
|---|---|---|
| **Kundennummer** | CRM | rein numerisch, `000001` |
| **Vertragsnummer** | **Versicherer** — wird übernommen, nie erzeugt | fremdes Format, unverändert gespeichert |
| **Vorgangsnummer** | CRM, eigener Kreis (Modul M10) | **mit Buchstabenpräfix**, z. B. `V-004711` |

Die Vorgangsnummer steht laut Kapitel 11 der Architektur in eckigen Klammern am
Anfang jeder E-Mail an den Versicherer. Sie **muss** sich von der Kundennummer
auf den ersten Blick unterscheiden, sonst ordnet der Posteingang eine
Antwortmail dem falschen Bezug zu. Deshalb: Kundennummer ohne Präfix,
Vorgangsnummer mit.

### 2.7 Folge für das Datenmodell

In [`02_DATENMODELL.md`](02_DATENMODELL.md) §7 ändert sich die Eindeutigkeit von
`kundennummer` von *je Mandant* auf *global*.

---

## 3. C-03 — Kein Altbestand

### 3.1 Festlegung

Es werden keine Daten aus einer Vorgängerlösung übernommen. Das CRM startet
leer.

### 3.2 Was damit entfällt

| Entfällt | Wirkung |
|---|---|
| Migrationsstrang in Welle 1 | Ein ganzer Arbeitsstrang, üblicherweise der unterschätzte |
| Abbildungstabellen Alt → Neu | Keine Doppelidentitäten |
| Prüflauf und Doppelpflegephase | Kein Zeitraum mit zwei führenden Systemen |
| **Risiko CR-05** | Gegenstandslos |

### 3.3 Was an seine Stelle tritt

Ein leerer Start ist kein reiner Gewinn. Drei Dinge ändern sich:

**1. Bestehende Verträge werden anlassbezogen erfasst, nicht migriert.**
Falls Verträge auf Papier oder in Tabellen geführt werden, entstehen sie im CRM
beim nächsten Anlass — Kundenkontakt, Verlängerung, Schadenmeldung — mit
`quelle = NACHERFASSUNG`. Kein Stichtag, keine Sammelaktion, kein Projekt. Der
Bestand wächst aus der laufenden Arbeit.

**2. Kennzahlen haben keine Vergangenheit.**
Bestandsentwicklung, Stornoquote und Kohortenauswertungen aus
[`09_DASHBOARD_UND_REPORTING.md`](09_DASHBOARD_UND_REPORTING.md) beginnen am Tag
der Inbetriebnahme. Erste belastbare Jahreswerte gibt es zwölf Monate später.
Wer vorher Vergleichswerte braucht, führt sie außerhalb — und weiß, dass sie
nicht aus dem System stammen.

**3. Der Scoring-Motor braucht Verhalten, bevor er wirkt.**
`01_CRM_ENGINE` bewertet Signale. Auf leerer Datenbank liefert er neutrale Werte
für alle. **Empfehlung: Scoring erst aktivieren, wenn rund 200 Leads mit
Historie vorliegen.** Vorher erzeugt er Aufgaben, die auf nichts beruhen — und
genau das lehrt den Innendienst, Aufgaben zu ignorieren.

### 3.4 Der Vorteil, der nur einmal zu haben ist

Jede Migration erzwingt weiche Pflichtfelder, weil Altdaten unvollständig sind.
Aus „vorläufig optional" wird dauerhaft optional, und drei Jahre später fehlt
bei einem Drittel der Kunden die Einwilligung, das Geburtsdatum oder die
Bootskennung.

**Diese Konzession entfällt. Die Pflichtfelder aus
[`02_DATENMODELL.md`](02_DATENMODELL.md) gelten ab Datensatz 1 ohne Ausnahme.**
Auch die drei Pflichtfeldstufen aus
[`06_VERTRAG_UND_BOOT.md`](06_VERTRAG_UND_BOOT.md) — Anfrage, Angebot, Antrag —
werden von Beginn an technisch erzwungen und nicht „später scharf geschaltet".

Diese Gelegenheit gibt es genau einmal, und zwar jetzt.

### 3.5 Was trotzdem zu prüfen ist → C-07

Das CRM startet leer. Der **Versicherer** tut das nicht. Falls dort bereits
Verträge geführt werden, die über euch vermittelt wurden, weichen zwei Systeme
ab Tag 1 voneinander ab. Das ist kein Migrationsprojekt, aber eine
Abgleichpflicht: Bei einer Kündigung, einer Verlängerung oder einer
Provisionsabrechnung zu einem Vertrag, den das CRM nicht kennt, gibt es keinen
Vorgang, an den sich das anhängen lässt.

**C-07** ist damit eröffnet (§6).

---

## 4. C-04 — Zwei Arbeitsplätze

### 4.1 Festlegung

Zwei Personen arbeiten gleichzeitig im System.

### 4.2 Was daraus unmittelbar folgt

| Bereich | Folge |
|---|---|
| **Werkbank** | `wp-admin` genügt zweifelsfrei. Die Grenze aus [ADR-0005](adr/0005-wordpress-als-werkbank.md) liegt bei etwa fünfzehn Plätzen |
| **Oberfläche** | Keine eigene Anwendung, keine Massenerfassungsmasken, keine Tastaturoptimierung in Version 1 |
| **Sitzungen** | Zwei gleichzeitige Sitzungen — Sperrkonflikte auf demselben Datensatz sind selten, ein Hinweis „wird gerade bearbeitet von" genügt statt echter Sperren |
| **Server** | Die Dimensionierung folgt **nicht** den Arbeitsplätzen (§4.3) |
| **Rollen** | Eine Person trägt mehrere Rollen (§4.4) |
| **Vier-Augen-Prinzip** | Nur noch technisch, nicht organisatorisch abzusichern (§4.5) |
| **Automationen** | Die Tageskapazität ist die harte Obergrenze (§4.6) |

### 4.3 Serverdimensionierung — was zwei Arbeitsplätze **nicht** bedeuten

Die Last entsteht nicht durch den Innendienst, sondern durch
Website-Besucher, Vorgänge, Dokumente und Hintergrundläufe. Zwei Arbeitsplätze
senken daher nur den Anteil, der auf die Werkbank entfällt. Startgrößen für
[`01_ARCHITECTURE/12_BETRIEBSKONZEPT_HETZNER.md`](../01_ARCHITECTURE/12_BETRIEBSKONZEPT_HETZNER.md):

| Server | Start bei zwei Arbeitsplätzen | Unverändert |
|---|---|---|
| `web-01` | 4 vCPU, 8 GB, gemeinsam genutzt | Folgt den Besuchern, nicht den Arbeitsplätzen |
| `core-01` | 2 vCPU, 4 GB | Wächst mit Vorgängen und Hintergrundläufen |
| `db-01` | **dedizierte vCPU**, 8 GB, NVMe | **Die Dedizierung bleibt.** Hier wird nicht gespart, auch nicht bei zwei Nutzern |

Was sich durch die kleine Nutzerzahl **nicht** verkleinert: Sicherung,
Wiederherstellungstest, Protokollierung, Verschlüsselung, Überwachung. Der
Betriebsaufwand von vier bis sechs Stunden im Monat bleibt bestehen — er hängt
an der Zahl der Systeme, nicht an der Zahl der Personen.

### 4.4 Rollenzuordnung bei zwei Personen

Das Rollenmodell aus [`04_ROLLENMODELL.md`](04_ROLLENMODELL.md) bleibt
unverändert — sieben Rollen. Rollen kosten nichts, solange sie nicht besetzt
sind, und sie nachträglich einzuführen ist teuer. Besetzt wird so:

| Person | Rollen | Bewusst nicht |
|---|---|---|
| **A** | `VERTRIEB`, `MARKETING` | keine `ADMINISTRATION` |
| **B** | `INNENDIENST`, `ADMINISTRATION` | keine `angebot:freigeben` aus der Innendienstrolle |

Damit bleiben zwei Trennungen des Rollenmodells organisatorisch echt:

- **Tarifimport und Tariffreigabe** liegen bei verschiedenen Personen. Wer
  importiert, gibt nicht frei — das gilt unverändert.
- **Marketing und Vertragszugriff:** Rolle `MARKETING` sieht keine Prämien.
  Trägt Person A beide Rollen, gilt die Summe der Rechte; die Trennung wirkt
  erst, wenn Marketing an Dritte oder eine Agentur geht. Das ist der Grund,
  weshalb die Rolle jetzt schon existiert.

### 4.5 Das Vier-Augen-Prinzip mit zwei Personen

Grundsatz **R5** verlangt: Vorbereiten und Freigeben sind verschiedene Personen.
Bei zwei Personen funktioniert das, solange beide anwesend sind — und bricht bei
Urlaub, Krankheit und am Freitagnachmittag.

Drei Wege standen zur Wahl:

| Weg | Bewertung |
|---|---|
| Regel abschalten | **Verworfen.** Eine abgeschaltete Kontrolle wird nie wieder eingeführt |
| Freigabe hart blockieren | **Verworfen.** Dann steht das Geschäft still, sobald eine Person fehlt — und es entsteht ein Umweg an der Software vorbei |
| **Alleinfreigabe zulassen, aber sichtbar machen** | **Gewählt** |

**Umsetzung der Alleinfreigabe:**

1. Die Freigabe ist technisch möglich, wenn Ersteller und Freigebender dieselbe
   Person sind.
2. Sie erfordert eine **Pflichtbegründung** — dasselbe Feld, das die
   Angebotsauswahl ohnehin verlangt.
3. Sie setzt `alleinfreigabe = true` auf dem Freigabevorgang.
4. Sie erzeugt einen `AUDITEINTRAG` eigener Art, der nicht in der Menge
   untergeht.
5. Sie erscheint in einem **monatlichen Bericht „Alleinfreigaben"** an die
   Geschäftsführung — mit Anzahl, Vorgang und Begründung.

Damit ist die Kontrolle nicht aufgehoben, sondern von einer *vorbeugenden* in
eine *nachweisende* umgewandelt. Das ist die einzige Form, die bei zwei Personen
ehrlich ist. **Ab der dritten Person wird die Alleinfreigabe wieder abgeschaltet
— festzuhalten als Auflage, nicht als Absicht.**

### 4.6 Tageskapazität — die eigentliche Obergrenze

Der Lastschutz aus [`07_AUFGABEN_UND_AUTOMATIONEN.md`](07_AUFGABEN_UND_AUTOMATIONEN.md)
§7 begrenzt auf 25 fällige Aufgaben je Benutzer und Tag.

**Zwei Personen ⇒ 50 Aufgaben am Tag. Das ist die Leistungsgrenze des Systems —
nicht der Server.**

Was danach entsteht, rückt nach und wird älter. Das ist kein Fehler, sondern die
gewünschte Wirkung — aber es bestimmt, wie viele der 53 Regeln aus dem
Regelkatalog zum Start aktiv sein dürfen.

**Empfehlung für den Start: höchstens zwölf Regeln.** Und zwar die, die Fristen
sichern, nicht die, die Gelegenheiten suchen:

| Gruppe | Zum Start aktiv | Begründung |
|---|---|---|
| Fristen und Verlängerung | **ja** | Versäumte Fristen kosten Geld und Vertrauen |
| Angebotsnachfass | **ja** | Der wirtschaftlich wirksamste Anstoß |
| Dublettenprüfung | **ja** | Wirkt nur, wenn sie von Anfang an läuft |
| Datenqualität und Vollständigkeit | **ja, gebündelt** | Als wöchentliche Sammelaufgabe, nicht einzeln |
| Cross-Selling, Reaktivierung, Kampagnenanstöße | **nein** | Erzeugen die meisten Aufgaben und brauchen ohnehin erst Historie (§3.3) |

Jede weitere Regel wird **einzeln** aktiviert, nach Trockenlauf, und die
Rückstauentwicklung wird zwei Wochen beobachtet, bevor die nächste folgt.

### 4.7 Wann neu zu entscheiden ist

| Schwelle | Was neu zu bewerten ist |
|---|---|
| **3. Person** | Alleinfreigabe abschalten, R5 wieder organisatorisch führen |
| **5. Person** | Rollen entflechten, Marketing von Vertrieb trennen |
| **15. Person** | Werkbank neu bewerten — eigene Anwendung gegen dieselbe API ([ADR-0005](adr/0005-wordpress-als-werkbank.md)) |

---

## 5. Was sich in den anderen Kapiteln ändert

| Ort | Änderung |
|---|---|
| [`02_DATENMODELL.md`](02_DATENMODELL.md) §7 | `kundennummer` global eindeutig, Vergaberegel nach §2.1 |
| [`01_GESAMTKONZEPT.md`](01_GESAMTKONZEPT.md) §5.1 | Eingangsquelle „Bestandsübernahme" entfällt, „Nacherfassung" tritt an ihre Stelle |
| [`11_SKALIERUNG_ROADMAP.md`](11_SKALIERUNG_ROADMAP.md) | Strang „Bestandsübernahme vorbereiten" entfällt, Risiko **CR-05** entfällt, **CR-10** kommt hinzu |
| [`04_ROLLENMODELL.md`](04_ROLLENMODELL.md) | Alleinfreigabe als benannter Ausnahmefall mit Nachweispflicht |
| [`07_AUFGABEN_UND_AUTOMATIONEN.md`](07_AUFGABEN_UND_AUTOMATIONEN.md) | Startpaket von zwölf Regeln statt 53 |
| [`01_ARCHITECTURE/12_BETRIEBSKONZEPT_HETZNER.md`](../01_ARCHITECTURE/12_BETRIEBSKONZEPT_HETZNER.md) | Startgrößen nach §4.3 |
| [ADR-0006](adr/0006-kundennummer-fortlaufend.md) | neu |

**Neues Risiko:**

| ID | Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|---|
| **CR-10** | Alleinfreigabe wird zur Gewohnheit statt zur Ausnahme | Die einzige wirtschaftlich bindende Kontrolle wird faktisch wirkungslos | Monatlicher Bericht an die Geschäftsführung. Quote über 30 % ist ein Anlass zu handeln, nicht zu erklären |

---

## 6. Neuer offener Punkt

| ID | Punkt | Blockiert | Zu klären durch |
|---|---|---|---|
| **C-07** | Führt der Versicherer bereits vermittelte Verträge, die im CRM fehlen? Wenn ja: Abgleichweg und Zuständigkeit | Verlängerungslauf, Provisionsprüfung | Produktverantwortung, gemeinsam mit dem Versicherer |

Keine Migration, aber eine Frage, die vor dem ersten Verlängerungslauf
beantwortet sein muss — sonst trifft eine Kündigungsfrist auf einen Vertrag, den
das System nicht kennt.
