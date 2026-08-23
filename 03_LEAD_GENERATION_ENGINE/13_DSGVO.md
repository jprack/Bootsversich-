# 13 — Datenschutzkonzept

> Fachkonzept, keine Rechtsberatung. Die Einordnung ist vor Inbetriebnahme
> anwaltlich zu bestätigen (**L-02**, **L-03**).

---

## 1. Die erste Unterscheidung: Wer ist überhaupt betroffen?

| Datum | Personenbezug | Folge |
|---|---|---|
| „Marina Attersee GmbH", Anschrift, `info@`, Zentralnummer | **nein** — juristische Person | DSGVO greift nicht |
| „Herr Huber, Hafenmeister" | **ja** | Volle Pflichten |
| `m.huber@marina-attersee.at` | **ja** — Person bestimmbar | Volle Pflichten |
| Einzelunternehmen „Bootsservice Huber e.U." | **ja** — Unternehmer ist die Person | Volle Pflichten |
| Verein „YC Mondsee" | nein | Aber jeder namentliche Funktionär: ja |

**Daraus folgt die wichtigste Gestaltungsregel dieses Moduls:**

> **Solange kein Name gespeichert ist, entsteht keine Pflicht.**

Für Erfassung, Bewertung und Priorisierung genügen Organisationsdaten
vollständig. Ein `AKQUISEKONTAKT` wird erst angelegt, wenn ein Ansprechpartner
konkret gebraucht wird — meist erst kurz vor dem Gespräch, oft erst danach.

Das ist Datenminimierung, die nichts kostet: Der Score braucht keinen Namen, die
Abdeckung braucht keinen Namen, die Reihenfolge braucht keinen Namen.

---

## 2. Rechtsgrundlagen

| Verarbeitung | Grundlage | Bedingung |
|---|---|---|
| Organisationsdaten erfassen und bewerten | kein Personenbezug | — |
| Ansprechpartner erfassen | **Art. 6 Abs. 1 lit. f** — berechtigtes Interesse | Interessenabwägung dokumentiert (§2.1) |
| Postalische Ansprache | Art. 6 Abs. 1 lit. f | Widerspruchsrecht, Hinweis im Schreiben |
| Telefonische Ansprache | Art. 6 Abs. 1 lit. f **plus** Zulässigkeit nach TKG/UWG (Kapitel 10) | Beide, nicht eine |
| Werbe-E-Mail | **Art. 6 Abs. 1 lit. a** — Einwilligung | Ohne Einwilligung kein Versand |
| Newsletter | Art. 6 Abs. 1 lit. a | Double Opt-in mit Nachweis |
| Weiterverarbeitung nach Vertragsanbahnung | Art. 6 Abs. 1 lit. b | Ab konkretem Interesse |

### 2.1 Interessenabwägung — einmal schriftlich, nicht je Fall

Eine dokumentierte Abwägung, versioniert, im Dokumentenmanagement abgelegt:

| Punkt | Inhalt |
|---|---|
| **Interesse** | Geschäftsanbahnung mit Betrieben und Vereinen der Wassersportbranche |
| **Erforderlichkeit** | Ohne Ansprechpartner ist eine gezielte Ansprache nicht möglich; unpersönliche Ansprache erreicht Vereinsvorstände nachweislich nicht |
| **Betroffenenerwartung** | Es werden **berufliche** Kontaktdaten verarbeitet, die die Person in ihrer Funktion veröffentlicht hat — die Verarbeitung liegt im Rahmen dessen, wofür sie veröffentlicht wurden |
| **Eingriffstiefe** | Gering: Name, Funktion, dienstliche Erreichbarkeit. **Keine** privaten Daten, kein Profiling von Personen, keine besonderen Kategorien |
| **Schutzmaßnahmen** | Kein Score auf Personen · Sperrvermerk quellenübergreifend · Widerspruch sofort wirksam · enge Aufbewahrung · getrenntes Schema mit engen Rechten |
| **Ergebnis** | Berechtigtes Interesse überwiegt für berufliche Kontaktdaten in der genannten Zielgruppe |

**Neu zu bewerten, sobald sich etwas davon ändert** — insbesondere bei einer
Ausweitung auf Privatpersonen. Die Abwägung trägt die derzeitige Ausgestaltung,
nicht jede künftige.

---

## 3. Die Informationspflicht nach Art. 14 — der am häufigsten übersehene Punkt

Daten aus einer Quelle, nicht von der Person selbst: Dann ist die betroffene
Person **aktiv** zu informieren, **innerhalb eines Monats** ab Erhebung,
spätestens jedoch bei der ersten Kommunikation mit ihr.

Zu nennen sind unter anderem: Verantwortlicher, Zwecke, Rechtsgrundlage,
**Kategorien der Daten**, **Herkunft**, Empfänger, Speicherdauer,
Betroffenenrechte, Widerspruchsrecht, Beschwerderecht.

### 3.1 Wie das System es erzwingt

| Mechanismus | Wirkung |
|---|---|
| `AKQUISEKONTAKT.belegt_am` | Startet die Frist automatisch |
| Regel `L-31` | Aufgabe nach **21 Tagen**, nicht nach 30 — mit Puffer für Urlaub und Krankheit |
| `information_versendet_am` | Nachweis. Fehlt er, bleibt die Aufgabe offen und eskaliert |
| Erstansprache erfüllt die Pflicht mit | Der Hinweis ist Bestandteil des Anschreibens — die Frist erledigt sich im Normalfall von selbst |
| Kein Versand ohne Herkunftsangabe | Kapitel 10.5 |

**Der elegante Teil:** Wer innerhalb von drei Wochen ohnehin anschreibt, erfüllt
die Pflicht im selben Brief. Die Regel greift nur bei Kontakten, die *erfasst,
aber nicht angesprochen* werden — und genau die sind das Problem, weil sie
unbemerkt liegen bleiben.

### 3.2 Wenn keine Ansprache geplant ist

Dann gibt es zwei zulässige Wege, und einen unzulässigen:

| Weg | Bewertung |
|---|---|
| Person **nicht erfassen**, nur Organisationsdaten halten | **Empfohlen.** Keine Pflicht, kein Aufwand, kein Risiko |
| Person erfassen und fristgerecht informieren | Zulässig, aber Aufwand ohne Gegenwert |
| Person erfassen und nicht informieren | **Unzulässig** |

---

## 4. Aufbewahrung und Löschung

| Datenart | Frist | Danach |
|---|---|---|
| `RECHERCHEOBJEKT` ohne Personenbezug | unbefristet | Bleibt — Grundlage des Abdeckungsgrads |
| `AKQUISEKONTAKT` ohne Ansprache | **12 Monate** ab `belegt_am` | Personendaten gelöscht, Objekt bleibt |
| `AKQUISEKONTAKT` nach Ansprache ohne Reaktion | **24 Monate** ab letzter Aktivität | wie oben |
| `AKQUISEKONTAKT` in laufender Anbahnung | bis Abschluss oder Absage | dann obige Fristen |
| Nach Übernahme ins CRM | Fristen des Kern-CRM | Kapitel 8 des Kern-CRM |
| `SPERRVERMERK` bei Widerspruch | **dauerhaft** | Löschen würde den Widerspruch aufheben |
| `OBJEKTBELEG` mit Personenbezug | mit dem Kontakt | Organisationsbelege bleiben |
| `RECHERCHELAUF`, Kennzahlen | 36 Monate | Aggregat bleibt, Einzelbezug entfällt |

**Die Zeile zum Sperrvermerk ist der scheinbare Widerspruch, der keiner ist:**
Ein Widerspruch muss dauerhaft wirken, also muss der Schlüssel dauerhaft bekannt
bleiben. Gespeichert wird deshalb nur der **normalisierte Schlüssel** und der
Grund — nicht der Datensatz. Das ist die Verarbeitung mit dem geringsten Eingriff,
die den Widerspruch überhaupt durchsetzen kann.

**Löschen heißt löschen.** Der Datensatz verschwindet; ein Auditeintrag hält
fest, dass gelöscht wurde, und enthält keine Nutzdaten — dieselbe Regel wie im
Kern-CRM.

---

## 5. Betroffenenrechte

| Recht | Umsetzung | Frist |
|---|---|---|
| **Auskunft** (Art. 15) | Ein Aufruf liefert Objekt, Kontakt, **alle Belege mit Quelle und Fundstelle**, Aktivitäten, Sperrlage | 1 Monat |
| **Berichtigung** (Art. 16) | Feldkorrektur erzeugt Beleg `quelle = MANUELL`. Der alte Wert bleibt als historischer Beleg sichtbar | unverzüglich |
| **Löschung** (Art. 17) | Personendaten gelöscht, Organisationsdaten bleiben, Sperrschlüssel gesetzt | 1 Monat |
| **Widerspruch** (Art. 21) | **Sofort wirksam**, `L-32` mit höchster Priorität. Ab dann keine Verarbeitung zu Direktwerbung | sofort |
| **Einschränkung** (Art. 18) | Objekt auf `GESPERRT`, keine Aufgabe, keine Ansprache | unverzüglich |
| **Datenübertragbarkeit** (Art. 20) | Greift nicht — keine Einwilligung, kein Vertrag als Grundlage | — |

**Die Auskunft ist die Probe aufs Ganze.** Wer sie nicht in Minuten erzeugen
kann, hat kein Belegmodell, sondern eine Adressliste. Die Frage im Anruf lautet
nie „welche Daten haben Sie", sondern **„woher haben Sie meine Nummer"** — und
`OBJEKTBELEG` ist die einzige Struktur, die darauf eine Antwort gibt.

---

## 6. Rollen und Zugriff

| Rolle | Rechercheraum | Personendaten darin |
|---|---|---|
| `ADMINISTRATOR` | vollständig | ja, protokolliert |
| `VERTRIEB` | vollständig im eigenen Mandanten | ja |
| `INNENDIENST` | lesend, prüfend, ohne Freigabe | ja |
| `MARKETING` | **kein Zugriff** | **nein** |
| Portalrollen | **kein Zugriff** | nein |

Mandantentrennung über Row Level Security wie im Kern-CRM. Ein österreichischer
Benutzer sieht keine deutschen Objekte, außer er trägt beide Mandanten.

---

## 7. Protokollierung

Jeder dieser Vorgänge erzeugt einen `AUDITEINTRAG`:

| Ereignis | Warum |
|---|---|
| Objekt erzeugt, freigegeben, verworfen | Herkunft jedes CRM-Datensatzes |
| Personendatensatz angelegt oder gelöscht | Nachweis der Fristen |
| Informationspflicht erfüllt | Der Nachweis selbst |
| Sperrvermerk gesetzt oder aufgehoben | Aufhebung ist der heikle Fall |
| Quelle angelegt, Erlaubnis geändert | Zulässigkeitskette |
| Auskunft erteilt | Fristnachweis |
| Zugriff auf Personendaten durch Administration | Wer nicht fachlich zuständig ist, hinterlässt eine Spur |

---

## 8. Offene Punkte

| ID | Punkt | Blockiert | Zu klären durch |
|---|---|---|---|
| **L-01** | Nutzungsbedingungen des gewählten Kartendienstes: Speicherung erlaubt? | Quellenklasse B, Kapitel 4.4 | Produktverantwortung |
| **L-02** | Bestätigung der Kanalmatrix (TKG AT, UWG DE) — insbesondere Telefonansprache in Österreich | **Jede aktive Ansprache** | Rechtsberatung |
| **L-03** | Freigabe der Interessenabwägung und der Informationstexte | Erfassung von Ansprechpartnern | Datenschutzberatung |
| **L-04** | Grundgesamtheit je Zielgruppe und Land — Erhebung und Quelle | Abdeckungsgrad als Leitkennzahl | Produktverantwortung |
| **L-05** | Sprachmodell zur Klassifikation: lokal oder unter AVV? | Anreicherung Stufe 2 | Geschäftsführung (deckungsgleich mit C-08) |
| **L-06** | Schweiz: Vermittlerzulassung, nicht Datenschutz, ist die Hürde | Ausbaustufe 3 | Geschäftsführung |
