# 08 — Marketing und Veranstaltungen

---

## 1. Die Grenze, die aus Modul 03 übernommen wird

Unverändert gültig
([ADR-0004 Modul 03](../03_LEAD_GENERATION_ENGINE/adr/0004-ansprache-ohne-kaltmail.md)):

> **Werbe-E-Mail ohne vorherige Einwilligung ist in Österreich (§ 174 TKG 2021)
> und Deutschland (§ 7 Abs. 2 UWG) unzulässig — auch gegenüber Unternehmen.**

Für dieses Modul ändert sich damit **eine** Sache gegenüber der Kaltakquise: Bei
einem Händler, mit dem eine Geschäftsbeziehung besteht, ist der Weg zur
Einwilligung kurz und natürlich. Sie wird beim Aufnahmegespräch eingeholt, nicht
erschlichen.

**Was sich nicht ändert:** Ohne dokumentierte Einwilligung geht keine Adresse an
Brevo. Auch nicht die eines Partners. Auch nicht `info@`.

---

## 2. Marketingstatus — abgeleitet, nicht gepflegt

Es gibt **kein Feld** `newsletterstatus`. Es gibt eine Ableitung aus
`EINWILLIGUNG` des Kern-CRM:

| Angezeigter Status | Bedingung |
|---|---|
| **Empfänger** | `EINWILLIGUNG` mit `zweck = MARKETING`, `rechtsgrundlage = EINWILLIGUNG`, `erteilt = true`, kein Widerruf |
| **Angefragt** | Double-Opt-in versendet, Bestätigung offen |
| **Kein Empfänger** | keine Einwilligung — der Regelfall bei neuen Händlern |
| **Widerrufen** | `widerrufen_am` gesetzt. **Bleibt sichtbar**, wird nie gelöscht |

**Warum abgeleitet:** Ein gepflegtes Statusfeld und eine Einwilligungstabelle
driften auseinander. Nach zwei Jahren steht im Feld „Empfänger" und in der
Tabelle ein Widerruf — und versendet wird nach dem Feld.

---

## 3. Vier zulässige Wege zur Einwilligung

| Weg | Nachweis |
|---|---|
| Anmeldung auf der Website | Double-Opt-in mit Bestätigungsmail |
| **Aufnahmegespräch bei Kooperationsabschluss** | Unterschriebener Abschnitt in der Vereinbarung |
| Messestand | Unterschriebener Beleg, gescannt |
| Ausdrückliche Bitte im Gespräch | Protokolliert, mit Datum und Person |

**Der zweite Weg ist der wichtigste und wird am häufigsten vergessen.** Wer die
Einwilligung nicht einholt, während die Vereinbarung ohnehin unterschrieben
wird, holt sie später fast nie ein.

Deshalb: Die Regel `D-04` (Aufnahmegespräch) trägt die Einwilligung als
Prüfpunkt in der Aufgabe — nicht als Erinnerung, sondern als Punkt, der
abgehakt oder ausdrücklich verneint wird.

---

## 4. Was gespeichert wird — und was nicht

Der Auftrag nennt Öffnungsraten, Klickverhalten und Kampagnenhistorie. Hier ist
die Grenze schärfer, als sie in Marketingwerkzeugen üblich ist.

| Datum | Speicherung | Grundlage |
|---|---|---|
| **Kampagnenhistorie** (wer stand im Verteiler) | ja | Nachweis der Verarbeitung |
| **Aggregierte Öffnungs- und Klickraten** je Kampagne | ja | Kein Personenbezug |
| **Individuelles Öffnungsverhalten** je Person | **nur mit Einwilligung für Messung** | ADR-0007 der Gesamtarchitektur |
| **Individuelles Klickverhalten** je Person | **nur mit Einwilligung für Messung** | wie oben |
| **Interessen**, aus Verhalten abgeleitet | **nur mit Einwilligung `PROFILBILDUNG`** | Profilbildung |
| **Interessen**, im Gespräch genannt | ja | Selbstauskunft, keine Messung |
| Leadquelle | ja | Attribution, ohne Personenbezug |

### 4.1 Die Regel dazu

> **Eine Einwilligung in den Newsletter ist keine Einwilligung in die Messung.**

Das sind zwei Zwecke, und das Kern-CRM führt sie getrennt (`zweck = MARKETING`
gegen `zweck = PROFILBILDUNG`). Wer beides in einem Häkchen bündelt, hat für
keines von beiden einen tragfähigen Nachweis.

**Praktische Folge:** Ohne Messeinwilligung stehen im Händlerdatensatz
aggregierte Kampagnenzahlen und die Teilnahmeliste — kein individuelles
Verhalten. Das genügt für die Steuerung: Für zweihundertfünfzig Händler ist die
Frage „hat er geöffnet?" ohnehin weniger wert als „war er auf der Hausmesse?".

### 4.2 Was daraus für Brevo folgt

| Regel | Umsetzung |
|---|---|
| Übergeben wird nur, wer eine Einwilligung hat | Prüfung vor jedem Export |
| Tracking-Einstellung folgt der Messeinwilligung | Zwei Listen, nicht eine mit Vermerk |
| Ein Widerruf wirkt sofort und beidseitig | Ereignis in beide Richtungen |
| Kein Rückschreiben von Verhaltensdaten ohne Messeinwilligung | Der Rückkanal filtert, nicht die Auswertung |

---

## 5. Veranstaltungen

Der Auftrag nennt Veranstaltungsmanagement als eigenen Zweck. Für die Zielgruppe
ist es der **wirksamste Kanal überhaupt** — persönliche Ansprache ist rechtlich
unproblematisch, und im Bootshandel entscheidet Bekanntheit im Revier mehr als
jede Aussendung.

### 5.1 VERANSTALTUNG

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `bezeichnung` | text(160) | ja | |
| `art` | enum | ja | `MESSE`, `HAUSMESSE`, `SCHULUNG`, `REGATTA`, `SAISONERAOEFFNUNG`, `PARTNERTREFFEN`, `WEBINAR` |
| `rolle_callidus` | enum | ja | `AUSSTELLER`, `BESUCHER`, `VERANSTALTER`, `PARTNER`, `KEINE` |
| `von` / `bis` | date | ja / nein | |
| `ort` / `land` / `revier` | text / char(2) / text | ja | |
| `zielgruppe` | text(120) | nein | |
| `budget` / `kosten_ist` | numeric(14,2) + Währung | nein | |
| `ergebnis_notiz` | text | nein | |

### 5.2 TEILNAHME

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `veranstaltung_id` | uuid | ja | |
| `organisation_id` | uuid | ja | Der Händler |
| `kontakt_id` | uuid | nein | Wer konkret da war |
| `art` | enum | ja | `AUSSTELLER`, `BESUCHER`, `EINGELADEN`, `ABGESAGT`, `NICHT_ERSCHIENEN` |
| `gespraech_gefuehrt` | boolean | ja | **Die einzige Angabe, die wirklich zählt** |
| `ergebnis` | text(500) | nein | |
| `folgeaufgabe_id` | uuid | nein | |

### 5.3 Die Regel, die Veranstaltungen erst nützlich macht

> **Eine Teilnahme ohne Nachbereitung binnen fünf Arbeitstagen ist verlorenes
> Geld.**

Deshalb erzeugt jede erfasste Teilnahme mit `gespraech_gefuehrt = true` die
Aufgabe `D-36`. Und deshalb ist `gespraech_gefuehrt` ein Pflichtfeld: Die
Anwesenheitsliste einer Messe ist wertlos, die Liste der geführten Gespräche ist
der Ertrag.

### 5.4 Was Veranstaltungen für die Datenqualität leisten

Ein Messegespräch ist der beste Anlass, `boote_pro_jahr`, Marken und
Ansprechpartner zu bestätigen — freiwillig, im Gespräch, mit Herkunft
`SELBSTAUSKUNFT`. **Eine Messe im Jahr kann den Aktualitätsgrad eines ganzen
Reviers heben**, und zwar besser als jede Recherche.

Das ist der Grund, weshalb Veranstaltungen in diesem Modul stehen und nicht im
Marketing: Sie sind hier ein **Datenpflegeinstrument**, das nebenbei verkauft.

---

## 6. Interessen und Produkte am Händler

| Feld | Herkunft | Verwendung |
|---|---|---|
| `interessen` | **Nur Selbstauskunft** | Auswahl der Einladungen und Inhalte |
| Produktbereiche | Recherche + Bestätigung | Cross-Selling-Regeln (Kapitel 7, Gruppe 5) |
| Marken | Herstellerverzeichnis + Bestätigung | Klassifizierung, Tarifnachlass |

**`interessen` wird nie aus Verhalten abgeleitet**, solange keine Einwilligung
`PROFILBILDUNG` vorliegt (§4). Im Gespräch genannte Interessen sind davon
unberührt — sie sind eine Auskunft, keine Messung.

---

## 7. Was das Marketingmodul nicht darf

| Verboten | Grund |
|---|---|
| Adressen ohne Einwilligung exportieren | §1 |
| Newsletter an `info@`-Adressen aus der Recherche | Dasselbe Verbot |
| Individuelles Tracking ohne Messeinwilligung | §4 |
| Interessen aus Öffnungsverhalten ableiten ohne `PROFILBILDUNG` | §4 |
| Eine Einladung an einen Widersprechenden | Sperrvermerk wirkt vor allem |
| Kampagnendaten ohne Löschfrist | Kapitel 12 |
