# 06 — Dublettenprüfung

---

## 1. Vier Prüfstellen, nicht eine

Dubletten entstehen an verschiedenen Stellen und brauchen verschiedene
Antworten. Ein einziger Abgleich am Ende reicht nicht.

| Stelle | Wogegen | Wirkung |
|---|---|---|
| **① Vor der Anlage** | `SPERRVERMERK` | Objekt entsteht **gar nicht** |
| **② Innerhalb des Laufs** | Andere Treffer desselben Laufs | Zusammenführung im Lauf, bevor etwas gespeichert wird |
| **③ Gegen den Rechercheraum** | Bestehende `RECHERCHEOBJEKT` | `ABGLEICHVORSCHLAG` |
| **④ Gegen das CRM** | Bestehende `ORGANISATION` | `ABGLEICHVORSCHLAG` — **die wichtigste Prüfung** |

**Warum ④ die wichtigste ist:** Eine Organisation, die bereits Kunde oder Partner
ist, ein zweites Mal als kalter Lead anzusprechen, ist der peinlichste Fehler,
den dieses System machen kann. Er passiert genau dann, wenn nur gegen die eigene
Recherchetabelle geprüft wird.

---

## 2. Normalisierung — die eigentliche Arbeit

Ein Abgleich ist nur so gut wie die Form, in der verglichen wird. Normalisiert
wird **bei der Speicherung**, in ein zusätzliches Feld; der Rohwert bleibt
unverändert daneben stehen.

| Feld | Regel | Beispiel |
|---|---|---|
| **Domain** | Kleinschreibung · Schema, `www.`, Pfad, Parameter entfernen · auf registrierbare Domain kürzen · Umlautdomains in Punycode | `https://WWW.Marina-Attersee.at/kontakt` → `marina-attersee.at` |
| **E-Mail** | Kleinschreibung · Leerzeichen weg · **keine** anbieterspezifischen Kürzungen | `Info@Marina-Attersee.AT` → `info@marina-attersee.at` |
| **Telefon** | E.164 mit Landesvorwahl aus `land` · Trennzeichen, Klammern, führende Null weg · Durchwahlangaben abtrennen | `0 76 66 / 12 34-15` (AT) → `+4376661234`, Durchwahl `15` |
| **Name** | Kleinschreibung · Diakritika auflösen · Rechtsform entfernen (`GmbH`, `e.U.`, `AG`, `Verein`, `e.V.`, `ZVR`) · Füllwörter entfernen (`der`, `die`, `das`, `und`, `&`) · Mehrfachleerzeichen · Bindestrich zu Leerzeichen | `Yacht- und Segelclub Attersee e.V.` → `yacht segelclub attersee` |
| **Adresse** | Straßenbezeichnung vereinheitlichen (`Str.`, `Straße`, `strasse` → `strasse`) · Hausnummer trennen · PLZ als Text mit führender Null | `Seestr. 4a` → `seestrasse` + `4a` |

**Die Rechtsformentfernung im Namen ist der Fall mit dem größten Nutzen.**
„Bootscenter Müller GmbH" und „Bootscenter Müller" sind dasselbe Unternehmen; im
Rohvergleich sind sie es nicht.

---

## 3. Die Schlüssel, nach Beweiskraft geordnet

| Rang | Schlüssel | Beweiskraft | Falsch-positiv-Risiko |
|---|---|---|---|
| **1** | `domain_norm` | **sehr hoch** | niedrig — aber siehe §4 |
| **2** | `email` (unpersönlich) | hoch | niedrig |
| **3** | `telefon_e164` | hoch | **mittel** — Verbünde, Sammelanschlüsse, Zentralen |
| **4** | `name_norm` + PLZ | mittel | mittel |
| **5** | `name_norm` + Ort | mittel | mittel |
| **6** | Geokoordinate < 100 m + gleiche Untergruppe | mittel | **hoch** — mehrere Betriebe an einem Hafen |
| **7** | `name_norm` allein | niedrig | **sehr hoch** |

**Rang 7 wird nie allein verwendet.** „Yachtclub Seewalchen" gibt es an mehreren
Seen; „Bootsservice Huber" gibt es in jedem Bundesland.

---

## 4. Regelwerk

Jede Regel liefert einen Beitrag zur Kennzahl. Die Kennzahl entscheidet über den
Weg, **nie über die Zusammenführung**.

| Code | Bedingung | Kennzahl | Ergebnis |
|---|---|---|---|
| **D1** | `domain_norm` gleich | 0,95 | Vorschlag, oben angezeigt |
| **D2** | `email` gleich | 0,90 | Vorschlag |
| **D3** | `telefon_e164` gleich **und** Untergruppe gleich | 0,85 | Vorschlag |
| **D4** | `name_norm` gleich **und** PLZ gleich | 0,80 | Vorschlag |
| **D5** | `name_norm` gleich **und** Ort gleich | 0,70 | Vorschlag |
| **D6** | Namensähnlichkeit ≥ 0,9 **und** PLZ gleich | 0,65 | Vorschlag |
| **D7** | Geo < 100 m **und** Untergruppe gleich | 0,55 | Hinweis, nachrangig |
| **D8** | `telefon_e164` gleich, Untergruppe **verschieden** | 0,30 | **Kein Vorschlag** — Hinweis „gleiche Zentrale" |

**Schwellen:**

| Kennzahl | Weg |
|---|---|
| ≥ 0,80 | Objekt geht auf `ZUR_PRUEFUNG` mit vorausgewähltem Ziel. **Keine automatische Übernahme** |
| 0,50–0,79 | Objekt wird angelegt, Vorschlag hängt daran und erscheint in der Prüfliste |
| < 0,50 | Objekt wird angelegt, kein Vorschlag |

### 4.1 Warum auch 0,95 nicht automatisch zusammenführt

Der Grund steht bereits als Risiko CR-03 im Kern-CRM: Eine Zusammenführung ist
praktisch nicht rückholbar. Zwei Organisationen wieder zu trennen, deren
Aktivitäten, Aufgaben und Dokumente inzwischen vermischt sind, ist keine
Datenbankoperation, sondern Handarbeit über Wochen.

Der Gewinn wäre gering: Bei einem Bestand in der Größenordnung von 10³ ist die
Zahl der Zusammenführungsentscheidungen klein genug für Menschen. **Automatisieren
lohnt sich nur, wo die Menge groß und der Fehler billig ist. Hier ist beides
umgekehrt.**

---

## 5. Die vier Ausnahmen, an denen naive Regeln scheitern

| Fall | Erscheinung | Richtige Behandlung |
|---|---|---|
| **Mehrere Standorte, eine Domain** | Händler mit drei Filialen, alle unter `haendler.at` | **Nicht** dieselbe Organisation. D1 wird durch abweichende PLZ entkräftet → Vorschlag mit Hinweis „gleiche Domain, andere Anschrift" |
| **Verein und Betriebs-GmbH am selben Hafen** | Gleiche Adresse, gleiche Telefonnummer, verschiedene Rechtsträger | Zwei Organisationen, verbunden über die Beziehungstabelle des CRM. D8 greift |
| **Dachverband und Ortsgruppe** | Ähnlicher Name, verschiedene Orte | Zwei Organisationen. Namensähnlichkeit allein reicht nie (Rang 7) |
| **Betreiberwechsel** | Gleiche Marina, neuer Rechtsträger | **Neue** Organisation, alte auf `BEENDET`. Der Vertrag hängt am Rechtsträger, nicht am Steg |

Die letzte Zeile ist die folgenreichste: Wer bei einem Betreiberwechsel den
bestehenden Datensatz umbenennt, verliert die Zuordnung aller früheren Verträge
und Aktivitäten — und bemerkt es erst im Streitfall.

---

## 6. Gedächtnis für Nicht-Dubletten

Entscheidet ein Mensch `IST_ANDERE`, wird das Paar dauerhaft gespeichert und in
allen künftigen Läufen unterdrückt.

Ohne dieses Gedächtnis erscheint dieselbe falsche Dublette bei jedem Lauf erneut.
Nach dem dritten Mal klickt der Prüfende sie weg, ohne hinzusehen — und irgendwann
auch die richtige. **Ein Prüfschritt, der wiederholt Falsches zeigt, erzieht zum
Wegklicken.** Das ist derselbe Mechanismus, der schlechte Automationen im
Kern-CRM unbrauchbar macht.

---

## 7. Bewusst nicht gemacht

| Nicht umgesetzt | Grund |
|---|---|
| Unscharfe Suche über alle Felder gleichzeitig | Erzeugt viele Treffer geringer Beweiskraft und begräbt die guten |
| Anbieterspezifische E-Mail-Normalisierung (Punkte, Plus-Zusätze) | Bei Organisationsadressen (`info@`) ohne Nutzen, bei Personenadressen falsch |
| Zusammenführung über eine Ähnlichkeitsschwelle | §4.1 |
| Abgleich gegen fremde Datenbestände | Übermittlung an Dritte ohne Rechtsgrundlage |
