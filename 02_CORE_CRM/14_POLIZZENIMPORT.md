# 14 — Polizzenimport aus PDF

| Feld | Wert |
|---|---|
| Modul | `02_CORE_CRM` |
| Fassung | 1.0 |
| Datum | 2026-08-22 |
| Status | Fachkonzept |
| Präzisiert | **C-03** — kein Vorsystem, aber ein Bestandsweg |
| Eröffnet | **C-08** Sprachmodell in der Extraktion |
| Betrifft | [`08_DOKUMENTE.md`](08_DOKUMENTE.md) · [`02_DATENMODELL.md`](02_DATENMODELL.md) · [`13_STARTKONFIGURATION.md`](13_STARTKONFIGURATION.md) |

---

## 1. Was sich gegenüber Kapitel 13 ändert

**C-03 bleibt gültig:** Es wird kein Vorsystem migriert. Der Bestand kommt
stattdessen aus **PDF-Polizzen** — und das ist etwas anderes als eine Migration.

| | Migration aus einem Vorsystem | Polizzenimport |
|---|---|---|
| **Herkunft** | Strukturierte Tabellen | Fließtext, Layout, teils Scan |
| **Fehlerart** | Systematisch — ein Abbildungsfehler trifft alle Sätze gleich | Einzelfallabhängig — jede Polizze kann anders scheitern |
| **Prüfung** | Stichprobe genügt | **Jeder Beleg wird angesehen** |
| **Nachweis** | Das Altsystem, das später abgeschaltet wird | **Das Dokument selbst — und es bleibt liegen** |

Die letzte Zeile ist der eigentliche Gewinn. Bei einer Migration verschwindet
die Herkunft, sobald das Altsystem abgeschaltet wird. Hier bleibt sie: Jedes
übernommene Feld ist bis auf **Dokument, Seite und Stelle** zurückverfolgbar,
und der Beleg liegt daneben im Aktenschrank. Das ist eine bessere Beweislage,
als eine Migration sie je erzeugt.

Der Preis ist Handarbeit. Er lässt sich verkleinern, aber nicht abschaffen.

---

## 2. Acht Grundsätze

| Nr. | Grundsatz | Konsequenz |
|---|---|---|
| **I1** | **Zuerst ablegen, dann lesen** | Das PDF wird unverändert gespeichert, mit Prüfsumme, bevor irgendetwas extrahiert wird |
| **I2** | **Extraktion erzeugt Vorschläge, keine Datensätze** | Kein Vertrag entsteht ohne menschliche Freigabe |
| **I3** | **Jedes Feld behält seine Herkunft** | Dokument, Seite, Fundstelle, Konfidenz, bestätigende Person — je Feld, nicht je Beleg |
| **I4** | **Kritische Felder werden immer bestätigt** | Unabhängig von der Konfidenz. Auch bei 99 % |
| **I5** | **Keine erfundene Historie** | Was die Polizze nicht hergibt, bleibt leer und wird als unvollständig gekennzeichnet |
| **I6** | **Der Import löst keine Automation aus** | Sonst erzeugt der erste Stapel hunderte Aufgaben |
| **I7** | **Der Import erzeugt keine Einwilligung** | Eine Polizze ist kein Werbeeinverständnis |
| **I8** | **Text im Dokument ist Datum, nie Anweisung** | Ein PDF ist Fremdinhalt. Es steuert nichts |

**I1 ist der wichtigste.** Nach der bloßen Ablage sind die Polizzen bereits
durchsuchbar, einem Kunden zuordenbar und im Streitfall vorzeigbar. Jede weitere
Stufe ist Zugewinn, keine Voraussetzung. Das heißt: **Der Import kann jederzeit
angehalten werden, ohne dass die geleistete Arbeit verloren ist.**

---

## 3. Fünf Stufen

```
   PDF-Polizze
        │
   ┌────▼─────────────────────────────────────────────────┐
   │ Stufe 0  ABLAGE                                       │
   │ Unverändert in den Objektspeicher. SHA-256.           │
   │ Virenprüfung. DOKUMENT + DOKUMENTVERSION entstehen.   │
   │ Ergebnis: durchsuchbar und vorzeigbar. Schon nützlich.│
   └────┬─────────────────────────────────────────────────┘
        │
   ┌────▼─────────────────────────────────────────────────┐
   │ Stufe 1  KLASSIFIKATION                               │
   │ Welcher Versicherer? Polizze, Nachtrag, Rechnung      │
   │ oder Kündigung? Erkannt an Merkmalen im Dokument,     │
   │ nicht am Dateinamen.                                  │
   │ Unklar ⇒ Stapelplatz „ungeklärt“, kein Rateversuch.   │
   └────┬─────────────────────────────────────────────────┘
        │
   ┌────▼─────────────────────────────────────────────────┐
   │ Stufe 2  EXTRAKTION                                   │
   │ Nach dem POLIZZENPROFIL des erkannten Versicherers.   │
   │ Je Feld: Rohwert, Normwert, Seite, Stelle, Konfidenz. │
   │ Plausibilitätsprüfungen laufen mit.                   │
   └────┬─────────────────────────────────────────────────┘
        │
   ┌────▼─────────────────────────────────────────────────┐
   │ Stufe 3  PRÜFUNG                                      │
   │ Zweispaltige Maske: links das PDF an der Fundstelle,  │
   │ rechts das Feld. Kritische Felder erzwingen eine      │
   │ Bestätigung. Ablehnen ist ein gültiges Ergebnis.      │
   └────┬─────────────────────────────────────────────────┘
        │
   ┌────▼─────────────────────────────────────────────────┐
   │ Stufe 4  ÜBERNAHME                                    │
   │ KUNDE · KONTAKT · BOOT · VERTRAG · VERTRAGSVERSION v1 │
   │ Jedes Feld mit Belegverweis. quelle = POLIZZENIMPORT. │
   │ Keine Automation, keine Kampagne, keine Mail.         │
   └──────────────────────────────────────────────────────┘
```

| Stufe | Abbruchkriterium — was den Beleg anhält |
|---|---|
| 0 | Virenbefund, defektes PDF, Größe über Grenzwert |
| 1 | Versicherer nicht erkennbar, Dokumenttyp uneindeutig |
| 2 | Keine Textebene **und** OCR-Güte unter Schwelle ⇒ vollständige Handerfassung, **keine Teilextraktion** |
| 3 | Prüfende Person lehnt ab — mit Grund, der erhalten bleibt |
| 4 | Vertragsnummer beim selben Versicherer existiert bereits |

Eine halbe Extraktion ist schlechter als keine: Sie erzeugt Vertrauen, wo keines
angebracht ist. Deshalb kippt Stufe 2 bei schlechter Vorlage vollständig in die
Handerfassung, statt einzelne Felder zu liefern.

---

## 4. Was in einer Polizze steht — und was nicht

### 4.1 Regelmäßig enthalten

| Feld | Konfidenzklasse | Bemerkung |
|---|---|---|
| Versicherer | hoch | Aus Logo, Kopfzeile, Rechtstext |
| **Polizzennummer** | **kritisch** | Schlüssel gegen Doppelanlage |
| Versicherungsnehmer, Name und Anschrift | hoch | Anschrift oft ohne Trennung von Straße und Nummer |
| **Beginn und Ablauf** | **kritisch** | Fehler hier heißt: verpasste Frist |
| **Hauptfälligkeit** | **kritisch** | Steuert den gesamten Verlängerungslauf |
| **Prämie brutto** | **kritisch** | |
| Versicherungssteuer | mittel | Oft nur als Betrag, nicht als Satz |
| **Versicherungssumme** | **kritisch** | |
| **Selbstbehalt** | **kritisch** | Häufig je Deckungsart verschieden |
| Deckungsarten | mittel | Kasko, Haftpflicht, Unfall, Zusatzbausteine |
| Boot: Name, Typ, Baujahr, Länge | mittel | Schreibweisen uneinheitlich |
| Motorleistung, Rumpfnummer, Kennzeichen | mittel | Rumpfnummer oft fehlerträchtig im OCR |
| Fahrtgebiet | mittel | Freitext, muss auf die eigene Liste abgebildet werden |
| Zahlweise, Inkassoart | mittel | |

### 4.2 Regelmäßig **nicht** enthalten

E-Mail-Adresse · Telefonnummer · Geburtsdatum · **Einwilligung** ·
Schadenfreiheitsklasse · Schadenhistorie · Beratungsdokumentation ·
Provisionssatz · Wertnachweis des Bootes · Zweitkontakt im Haushalt.

### 4.3 Die zwei Folgerungen, die man leicht übersieht

**Ein importierter Kunde ist zunächst nicht erreichbar.** Es gibt eine
Postanschrift und sonst nichts. Der Kontaktweg entsteht beim ersten realen
Kontakt — Verlängerungsanruf, Schaden, Rückfrage. Der Import füllt das Wissen
über Verträge, nicht das über Menschen.

**Ein importierter Kontakt darf keine Werbung erhalten.** Rechtsgrundlage der
Verarbeitung ist die Vertragserfüllung, nicht die Einwilligung. Importierte
Kontakte werden deshalb technisch aus allen Marketingsegmenten ausgeschlossen,
bis eine `EINWILLIGUNG` mit eigenem Nachweis vorliegt. Das ist keine
Vorsichtsmaßnahme, sondern der Unterschied zwischen einem Bestand und einem
Bußgeld.

**Bankverbindung:** Wird sie in der Polizze genannt und liegt das Inkasso beim
Versicherer, wird sie **nicht übernommen**. Ein Datum, das nicht gebraucht wird,
wird nicht erhoben (Grundsatz P8 der Architektur).

---

## 5. Vier neue Entitäten

### 5.1 IMPORTSTAPEL

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `bezeichnung` | text(120) | ja | „NAUTIMA Bestand Fälligkeit Q4" |
| `angelegt_von` | uuid | ja | |
| `angelegt_am` | timestamptz | ja | |
| `anzahl_belege` | int | ja | |
| `status` | enum | ja | `OFFEN`, `IN_PRUEFUNG`, `ABGESCHLOSSEN`, `ABGEBROCHEN` |
| `abgeschlossen_am` | timestamptz | nein | **Erst danach dürfen Automationen auf die Verträge greifen** |
| `mandant_id` | uuid | ja | |

### 5.2 IMPORTBELEG

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `stapel_id` | uuid | ja | |
| `dokument_id` | uuid | ja | Verweis auf das abgelegte PDF — entsteht in Stufe 0 |
| `dateiname_original` | text(255) | ja | Unverändert, auch wenn er nichts taugt |
| `pruefsumme_sha256` | text(64) | ja | **unique je Mandant** — dieselbe Datei kommt nicht zweimal herein |
| `seitenzahl` | int | ja | |
| `hat_textebene` | boolean | ja | Steuert, ob OCR nötig ist |
| `ocr_guete` | numeric(4,3) | nein | Nur bei Scans |
| `versicherer_organisation_id` | uuid | nein | Ergebnis der Klassifikation |
| `polizzenprofil_id` | uuid | nein | Verwendetes Profil samt Fassung |
| `dokumentart` | enum | nein | `POLIZZE`, `NACHTRAG`, `RECHNUNG`, `KUENDIGUNG`, `UNGEKLAERT` |
| `status` | enum | ja | `ABGELEGT`, `KLASSIFIZIERT`, `EXTRAHIERT`, `IN_PRUEFUNG`, `UEBERNOMMEN`, `ABGELEHNT`, `HANDERFASSUNG` |
| `ablehnungsgrund` | text(500) | nein | **Bleibt erhalten.** Ein abgelehnter Beleg verschwindet nicht |
| `geprueft_von` / `geprueft_am` | uuid / timestamptz | nein | |
| `vertrag_id` | uuid | nein | Gesetzt bei `UEBERNOMMEN` |

### 5.3 EXTRAKTIONSFELD

Die Tabelle, die den Unterschied zwischen einem Import und einem Ratespiel macht.

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `importbeleg_id` | uuid | ja | |
| `feldname` | text(60) | ja | Zielfeld im Datenmodell, z. B. `vertrag.hauptfaelligkeit` |
| `rohwert` | text | nein | Genau wie im Dokument: „01.04.2024" |
| `normwert` | text | nein | Normalisiert: `2024-04-01` |
| `seite` | int | nein | |
| `fundstelle` | jsonb | nein | Rechteck auf der Seite — die Prüfmaske springt dorthin |
| `konfidenz` | numeric(4,3) | nein | |
| `klasse` | enum | ja | `KRITISCH`, `NORMAL` |
| `ergebnis` | enum | ja | `VORSCHLAG`, `BESTAETIGT`, `KORRIGIERT`, `LEER_GELASSEN` |
| `wert_final` | text | nein | Nach Bestätigung oder Korrektur |
| `bestaetigt_von` / `bestaetigt_am` | uuid / timestamptz | nein | |

`LEER_GELASSEN` ist ein gültiges, dokumentiertes Ergebnis. **Ein leeres Feld mit
Begründung ist besser als ein geratenes ohne.**

### 5.4 POLIZZENPROFIL

Extraktionswissen als **Daten**, nicht als Programmcode — derselbe Grundsatz wie
beim Tarifwerk und bei den Automationen ([ADR-0004](adr/0004-automationen-als-daten.md)).

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `versicherer_organisation_id` | uuid | ja | |
| `bezeichnung` | text(120) | ja | „NAUTIMA Polizze Layout ab 2023" |
| `fassung` | int | ja | Alte Fassungen bleiben — sonst ist ein alter Beleg nicht mehr nachvollziehbar |
| `erkennungsmerkmale` | jsonb | ja | Textanker, die den Versicherer und das Layout identifizieren |
| `feldregeln` | jsonb | ja | Je Zielfeld: Anker, Suchbereich, Muster, Normalisierung |
| `pruefregeln` | jsonb | ja | Plausibilität (§7) |
| `schema_version` | int | ja | Pflicht bei jsonb (Konvention aus Kapitel 2) |
| `gueltig_ab` / `gueltig_bis` | date | ja / nein | Layouts ändern sich |
| `freigegeben_von` | uuid | nein | **Nicht dieselbe Person, die das Profil erstellt hat** |

Ein neuer Versicherer bedeutet ein neues Profil — **keinen Entwicklungsauftrag.**

---

## 6. Konfidenz und Freigaberegel

| Fall | Behandlung |
|---|---|
| Feld **kritisch** (§4.1), jede Konfidenz | **Immer manuelle Bestätigung.** Der Wert ist vorbelegt, aber nicht übernommen |
| Feld normal, Konfidenz hoch, Plausibilität bestanden | Vorbelegt und mitübernommen, sichtbar markiert |
| Feld normal, Konfidenz mittel oder Plausibilität verletzt | Hervorgehoben, Bestätigung nötig |
| Feld normal, Konfidenz niedrig | Leer, mit Hinweis auf die Fundstelle |

Die kritischen Felder sind **Polizzennummer, Beginn, Ablauf, Hauptfälligkeit,
Prämie brutto, Versicherungssumme, Selbstbehalt**. Sie tragen Geld und Fristen.
Ein OCR-Fehler in der Hauptfälligkeit kostet einen Bestandsvertrag, und man
merkt es erst, wenn es zu spät ist.

---

## 7. Plausibilitätsprüfungen

| Prüfung | Bei Verletzung |
|---|---|
| `ablauf > beginn` | Beleg rot, keine Übernahme |
| Hauptfälligkeit liegt im Vertragszeitraum | Feld rot |
| Prämie brutto ≥ Prämie netto | Feld rot |
| Steueranteil plausibel zum Bruttobetrag | Hinweis, **keine Korrektur** — der Satz ist bis C-12 der Architektur nicht bestätigt |
| Versicherungssumme innerhalb der Bandbreite des Tarifwerks | Hinweis |
| Baujahr zwischen 1900 und dem Folgejahr | Feld rot |
| Länge, Motorleistung im plausiblen Bereich | Hinweis |
| Polizzennummer bereits vorhanden | **Beleg angehalten** (§8) |

**Eine Prüfung korrigiert nie.** Sie färbt, hält an oder weist hin. Der Moment,
in dem ein Importwerkzeug beginnt, Werte selbst zurechtzurücken, ist der Moment,
in dem niemand mehr weiß, was in der Polizze stand.

---

## 8. Dubletten, Nachträge, Versionen

### 8.1 Doppelte Belege

Drei Schlüssel, drei Wirkungen:

| Schlüssel | Wirkung |
|---|---|
| `pruefsumme_sha256` | Dieselbe Datei wird gar nicht erst angelegt |
| Polizzennummer + Versicherer | Beleg wird angehalten und dem bestehenden Vertrag zugeordnet |
| Name + Anschrift + Geburtsdatum | **Vorschlag** zur Zuordnung, nie automatische Zusammenführung ([CR-03](11_SKALIERUNG_ROADMAP.md)) |

### 8.2 Nachträge

Liegen zur selben Polizzennummer mehrere Dokumente vor, entstehen sie in
zeitlicher Reihenfolge als Kette von `VERTRAGSVERSION` — genau so, wie es
[ADR-0002](adr/0002-vertrag-unveraenderlich.md) für den laufenden Betrieb
vorsieht.

### 8.3 Der ehrliche Umgang mit fehlender Vorgeschichte

Liegt nur die aktuelle Polizze vor, entsteht **eine** Version, und der Vertrag
wird mit `historie_unvollstaendig = true` gekennzeichnet.

Es entsteht **keine** rückgerechnete Version, kein geschätzter Vorbeitrag, kein
angenommener Vertragsbeginn. Ein Vertrag, der eine Historie vortäuscht, die er
nicht hat, ist vor einer Prüfung schlechter als einer, der seine Lücke offen
ausweist.

---

## 9. Technik der Extraktion

| Punkt | Festlegung |
|---|---|
| **Verarbeitungsort** | Auf dem eigenen Server. Der Beleg verlässt die Umgebung nicht |
| **Digitale PDF** | Textebene wird ausgelesen, Position je Wort bleibt erhalten |
| **Scans** | OCR lokal. Unter der Gütegrenze ⇒ vollständige Handerfassung |
| **Versicherererkennung** | Über Merkmalsmenge im Dokument, nie über den Dateinamen |
| **Profile** | Als Daten, versioniert, mit Vier-Augen-Freigabe (§5.4) |
| **Externe KI-Dienste** | **Nicht ohne geprüfte Rechtsgrundlage und Auftragsverarbeitungsvertrag** — siehe C-08 |
| **Ausführung** | PDF wird nie ausgeführt, Vorschau serverseitig ohne aktive Inhalte |
| **Netz** | Der Extraktionsprozess läuft ohne ausgehende Netzverbindung |
| **Virenprüfung** | Vor jedem Abruf, bestehende Regel aus Kapitel 8 |

**Zur Sicherheit ausdrücklich (I8):** Ein PDF ist Fremdinhalt. Steht darin ein
Satz, der wie eine Anweisung aussieht — an ein Programm, an ein Sprachmodell, an
die prüfende Person —, ist er trotzdem nur Text im Dokument. Die Extraktion
kennt nur die Felder ihres Profils. Sie führt nichts aus, ruft nichts auf und
ändert nichts außerhalb des eigenen Belegs.

---

## 10. Reihenfolge, Aufwand, Kapazität

### 10.1 Reihenfolge

**Nach Fristennähe, nicht alphabetisch und nicht nach Eingang.** Zuerst die
Verträge, deren Hauptfälligkeit am nächsten liegt. Alles andere kann warten;
eine verpasste Frist kann es nicht.

### 10.2 Stapelgröße

25 bis 40 Belege. Klein genug, um an einem Vormittag fertig zu werden — und ein
abgeschlossener Stapel ist die Bedingung dafür, dass Automationen auf diese
Verträge greifen dürfen (§11).

### 10.3 Aufwand — als Annahme, nicht als Zusage

| Weg | Annahme je Polizze |
|---|---|
| Reine Handerfassung | 12–15 Minuten |
| Prüfung einer Extraktion mit passendem Profil | **3–5 Minuten** |
| Beleg ohne Textebene, schlechte Vorlage | wie Handerfassung |

Bei 400 Polizzen ergibt das rund 25 bis 35 Stunden Prüfarbeit. Verteilt auf zwei
Personen mit zwei Stunden am Tag: **sieben bis neun Wochen.**

**Diese Zahlen sind zu messen, nicht zu glauben.** Vorgehen: die ersten
**zwanzig** Belege mit Stoppuhr, danach hochrechnen. Weicht der Wert stark ab,
liegt es fast immer am Profil — und das ist zu verbessern, nicht zu ertragen.

### 10.4 Der Import läuft nicht über das Aufgabensystem

Zwei Personen haben 50 Aufgaben am Tag ([Kapitel 13](13_STARTKONFIGURATION.md)
§4.6). Ein Importstapel mit 40 Belegen würde davon 40 verbrauchen — und die
Fristenarbeit verdrängen.

**Der Import hat deshalb eine eigene Arbeitsliste mit eigenem Fortschritt und
zählt nicht gegen den Lastschutz.** Er ist Projektarbeit, keine Tagesarbeit.

---

## 11. Was der Import auslösen darf

| Nicht erlaubt | Grund |
|---|---|
| Automationsregeln auf importierte Verträge, solange der Stapel offen ist | Sonst laufen Verlängerungs- und Fristenregeln über einen halb geprüften Bestand |
| Kampagnen, Newsletter, Marketingsegmente | Keine Einwilligung (§4.3) |
| Jede ausgehende Nachricht an den Kunden | Der Kunde hat nichts angefragt |
| Angebots- oder Vorgangsanlage | Der Import bildet ab, er verkauft nicht |
| Scoring-Anstöße | Auf importierten Daten ohne Verhalten ohne Aussagekraft |
| Vertragsanlage ohne Freigabe | Grundsatz I2 |

| Erlaubt und erwünscht | |
|---|---|
| Volltextsuche über die abgelegten Belege | Ab Stufe 0 |
| Fristen- und Bestandsübersicht | Ab Stufe 4 |
| Kundenakte mit Vertrag und Beleg | Ab Stufe 4 |

**Nach Abschluss eines Stapels** läuft der Fristenlauf einmalig über die neuen
Verträge — mit Trockenlauf davor und mit Bündelung, wie in
[`07_AUFGABEN_UND_AUTOMATIONEN.md`](07_AUFGABEN_UND_AUTOMATIONEN.md) §7
beschrieben. Ohne diesen Schritt kommen die 400 Verträge auf einmal.

---

## 12. Abnahmekriterien

Der Import gilt als brauchbar, wenn alle sieben Punkte erfüllt sind:

| Nr. | Kriterium |
|---|---|
| 1 | Ein beliebiges übernommenes Feld lässt sich in unter 15 Sekunden bis auf **Dokument, Seite und Stelle** zurückverfolgen |
| 2 | Dieselbe Datei zweimal eingespielt erzeugt **keinen** zweiten Vertrag |
| 3 | Ein abgelehnter Beleg bleibt mit Grund erhalten und ist wiederaufnehmbar |
| 4 | Ein Stapel ist mittendrin unterbrechbar und ohne Verlust fortsetzbar |
| 5 | **Kein importierter Kontakt erscheint in einem Marketingsegment** |
| 6 | Ein fehlerhaft übernommener Vertrag wird **korrigiert, nicht gelöscht** — die falsche Fassung bleibt sichtbar |
| 7 | Ein Vertrag ohne Vorgeschichte ist als `historie_unvollstaendig` erkennbar, ohne die Akte zu öffnen |

Punkt 1 ist der Kern. Wer ihn erfüllt, hat einen Bestand mit Beweislage. Wer ihn
nicht erfüllt, hat eine Datenbank mit Behauptungen.

---

## 13. Folgen und offene Punkte

| Ort | Änderung |
|---|---|
| [`02_DATENMODELL.md`](02_DATENMODELL.md) | Vier Entitäten (§5), `quelle = POLIZZENIMPORT`, `historie_unvollstaendig` am Vertrag |
| [`08_DOKUMENTE.md`](08_DOKUMENTE.md) | Dokumentart `NACHTRAG`, Importbelege als Herkunft |
| [`13_STARTKONFIGURATION.md`](13_STARTKONFIGURATION.md) §3 | Nacherfassung wird planbarer Import statt anlassbezogener Erfassung |
| [`11_SKALIERUNG_ROADMAP.md`](11_SKALIERUNG_ROADMAP.md) | Eigener Strang, nicht Teil der acht Schnitte |
| [ADR-0007](adr/0007-polizze-als-beleg.md) | neu |

| ID | Punkt | Blockiert | Zu klären durch |
|---|---|---|---|
| **C-08** | Wird zur Extraktion ein Sprachmodell eingesetzt? Wenn ja: selbst betrieben oder unter Auftragsverarbeitungsvertrag, und an welchem Ort verarbeitet? | Umsetzung Stufe 2 | Geschäftsführung mit Datenschutzberatung |

**C-07 bleibt und bekommt eine neue Rolle:** Ein Bestandsauszug des Versicherers
ist die einzige Gegenprobe darauf, ob **alle** Polizzen vorliegen. Der Import
kann nur vollständig verarbeiten, was ihm gegeben wird — er weiß nicht, was
fehlt.
