# 12 — Datenschutzkonzept

> Fachkonzept, keine Rechtsberatung. Vor Inbetriebnahme zu bestätigen
> (**D-03**, und fortlaufend **L-02** aus Modul 03).

---

## 1. Was hier überhaupt personenbezogen ist

| Datum | Personenbezug | Folge |
|---|---|---|
| Firmenwortlaut, Anschrift, `info@`, Zentralnummer, Marken, Standorte, Umsatzklasse | **nein** | DSGVO greift nicht |
| Name und Funktion eines Ansprechpartners | **ja** | Volle Pflichten |
| `m.huber@haendler.example`, Mobilnummer | **ja** | Volle Pflichten |
| **Geburtstag** | **ja**, besonders sensibel im Verhältnis zum Zweck | Kapitel 2.5 |
| **Besuchsbericht** mit Einschätzungen zu Personen | **ja** | §5 |
| Einzelunternehmen als Händler | **ja** — der Unternehmer ist die Person | Volle Pflichten |
| Öffnungs- und Klickverhalten einer Person | **ja**, zusätzlich ePrivacy-Fragen | Nur mit Messeinwilligung |
| Händlerwert, Klasse | **nein** — bewertet wird der Betrieb | Kein Personenscoring |

**Die tragende Gestaltungsregel bleibt dieselbe wie in Modul 03:**

> Der weitaus größte Teil dieser Datenbank ist **nicht personenbezogen**. Marken,
> Standorte, Produktbereiche, Bootszahlen, Klassen und Werte beschreiben Betriebe.
> Personenbezug entsteht nur an drei Stellen: Ansprechpartner, Besuchsberichte,
> Verhaltensdaten.

Das ist keine Nebenbemerkung, sondern der Grund, weshalb dieses Modul mit
vergleichsweise wenig Aufwand rechtssicher betreibbar ist.

---

## 2. Rechtsgrundlagen

| Verarbeitung | Grundlage | Bedingung |
|---|---|---|
| Betriebsdaten: Marken, Standorte, Klassen, Werte | kein Personenbezug | — |
| Ansprechpartner führen und kontaktieren | **Art. 6 Abs. 1 lit. f** | Interessenabwägung (Modul 03, Kapitel 13.2.1), erweitert um die Betreuung |
| Anbahnung einer Kooperation | **Art. 6 Abs. 1 lit. b** | Ab konkretem Interesse |
| Laufende Kooperation | **Art. 6 Abs. 1 lit. b** | Vertragserfüllung |
| Newsletter | **Art. 6 Abs. 1 lit. a** | Double-Opt-in mit Nachweis |
| Individuelles Öffnungs- und Klicktracking | **Art. 6 Abs. 1 lit. a**, Zweck `PROFILBILDUNG` | Getrennte Einwilligung (Kapitel 8.4) |
| Geburtstag | **Art. 6 Abs. 1 lit. a**, konkludent durch freiwillige Nennung | Nur wenn genannt, Herkunft dokumentiert |
| Besuchsberichte | Art. 6 Abs. 1 lit. f | Enge Aufbewahrung, kein Kundenzugriff (§5) |

### 2.1 Erweiterung der Interessenabwägung

Die Abwägung aus Modul 03 deckt die **Erstansprache**. Für dieses Modul kommt die
**laufende Betreuung** hinzu. Zusätzlich zu dokumentieren:

| Punkt | Inhalt |
|---|---|
| **Erweiterter Zweck** | Pflege einer bestehenden Geschäftsbeziehung, Betreuung, Veranstaltungseinladungen |
| **Erweiterte Datenkategorien** | Funktion, Standortzuordnung, Gesprächsnotizen, freiwillige Angaben |
| **Betroffenenerwartung** | Wer als Ansprechpartner eines Betriebs auftritt, erwartet Kontaktpflege durch Geschäftspartner |
| **Zusätzliche Schutzmaßnahmen** | Kein Personenscoring · Besuchsberichte intern · Geburtstag nur freiwillig · Widerspruch sofort wirksam · Aufbewahrung 36 Monate für Vertriebsunterlagen |

---

## 3. Einwilligungen — drei getrennte Zwecke

| Zweck | Wofür | Ohne sie |
|---|---|---|
| `MARKETING` | Newsletter, Einladungen per E-Mail | Kein Versand — auch nicht an Partner |
| `PROFILBILDUNG` | Individuelles Öffnungs- und Klickverhalten, abgeleitete Interessen | Nur aggregierte Kampagnenzahlen |
| `KONTAKT_TELEFON` | Telefonische Ansprache, wo sie Einwilligung verlangt (AT) | Kanalmatrix sperrt |

**Drei Zwecke, drei Nachweise, drei Widerrufe.** Ein Sammelhäkchen wäre für
keinen der drei tragfähig — und der Widerruf des einen darf die anderen nicht
beenden.

**Widerruf beendet, löscht nicht:** `widerrufen_am` wird gesetzt, der Nachweis
bleibt. Das ist die Regel des Kern-CRM und gilt unverändert.

---

## 4. Aufbewahrung und Löschung

| Datenart | Frist | Danach |
|---|---|---|
| Betriebsdaten (nicht personenbezogen) | unbefristet | Bleiben — Grundlage der Markttransparenz |
| Ansprechpartner **ohne** Kooperation, ohne Kontakt | **24 Monate** ab letzter Aktivität | Personendaten gelöscht, Betrieb bleibt |
| Ansprechpartner **mit** laufender Kooperation | Dauer + gesetzliche Fristen | dann obige Regel |
| Ansprechpartner nach Ausscheiden aus dem Betrieb | **12 Monate** ab Kenntnis | Zuordnung endet sofort, Kontakt danach gelöscht, sofern nicht anderweitig gebunden |
| **Besuchsberichte** | **36 Monate** | Gelöscht. Enthalten Einschätzungen, keine Vertragsunterlagen |
| Kooperationsvereinbarungen | Handels- und steuerrechtliche Fristen (C-06) | |
| Kampagnenhistorie, aggregiert | 36 Monate | Aggregat bleibt, Personenbezug entfällt |
| Individuelle Verhaltensdaten | **12 Monate** | Gelöscht — kürzer als alles andere, weil eingriffsintensiv |
| Geburtstag | mit dem Kontakt, oder sofort auf Wunsch | Einzeln löschbar |
| Sperrvermerk bei Widerspruch | dauerhaft | Nur normalisierter Schlüssel und Grund |
| Auditeinträge | wie im Kern-CRM | Ohne Nutzdaten |

### 4.1 Die Zeile, die am meisten Aufmerksamkeit braucht

**Ansprechpartner nach Ausscheiden aus dem Betrieb.** Die Zuordnung endet, sobald
es bekannt ist — die Person ist dann kein Ansprechpartner mehr, und die
Rechtsgrundlage für den Kontakt entfällt.

Der Datensatz bleibt zwölf Monate erhalten, aus einem einzigen praktischen Grund:
**Diese Person taucht mit hoher Wahrscheinlichkeit beim nächsten Betrieb wieder
auf.** Wird sie dort erneut Ansprechpartner, entsteht eine neue Zuordnung mit
neuer Grundlage — und die Gesprächshistorie beim alten Betrieb bleibt dort, wo
sie hingehört.

Wird sie es nicht, wird gelöscht.

---

## 5. Besuchsberichte — die heikelste Datenart des Moduls

Ein Besuchsbericht enthält typischerweise Einschätzungen: wie das Gespräch lief,
wer entscheidet, wie die Stimmung war, wer beim Wettbewerb sitzt. Das sind
personenbezogene Daten mit Bewertungscharakter.

| Regel | Umsetzung |
|---|---|
| **Nie kundensichtbar** | Zugriffsklasse `intern`, kein Dealer Hub |
| **Sachlich, nicht persönlich** | Über Geschäftliches, nicht über Personen. Vorgabe im Formular |
| **36 Monate** | Danach gelöscht |
| **Auskunftspflichtig** | Bei einem Auskunftsersuchen sind sie herauszugeben — das ist der eigentliche Grund für die Vorgabe „sachlich" |
| Zugriff protokolliert | Wie jeder Zugriff auf personenbezogene Vertriebsdaten |

> **Die Probe:** Würde man den Satz der Person vorlesen, wenn sie ein
> Auskunftsersuchen stellt? Wenn nein, gehört er nicht in den Bericht.

Das ist keine juristische Feinheit — Auskunftsersuchen sind Alltag geworden, und
ein Bericht, der nicht vorgelesen werden kann, ist ein Haftungsfall und eine
zerstörte Geschäftsbeziehung in einem.

---

## 6. Betroffenenrechte

| Recht | Umsetzung | Frist |
|---|---|---|
| **Auskunft** (Art. 15) | Ein Aufruf liefert Kontaktdaten, Zuordnungen, Aktivitäten, Notizen, **Besuchsberichte**, Einwilligungen, Kampagnenhistorie, Sperrlage | 1 Monat |
| **Berichtigung** (Art. 16) | Feldkorrektur mit Herkunft `MANUELL`; alter Wert bleibt als Beleg | unverzüglich |
| **Löschung** (Art. 17) | Personendaten gelöscht, Betriebsdaten bleiben, Sperrschlüssel gesetzt | 1 Monat |
| **Widerspruch** (Art. 21) | Sofort wirksam, quellenübergreifend, höchste Priorität | sofort |
| **Einschränkung** (Art. 18) | Kontakt gesperrt, keine Aufgabe, keine Ansprache | unverzüglich |
| **Datenübertragbarkeit** (Art. 20) | Greift für Newsletter-Einwilligung; sonst nicht | 1 Monat |

**Die Auskunft ist auch hier die Probe aufs Ganze** — und sie ist in diesem Modul
schwieriger als in Modul 03, weil Besuchsberichte und Notizen dazugehören. Wer
sie in unter zehn Minuten vollständig erzeugen kann, hat ein sauberes Modell.

---

## 7. Rollen und Zugriff

| Rolle | Betriebsdaten | Personendaten | Besuchsberichte | Werte und Klassen |
|---|---|---|---|---|
| `ADMINISTRATOR` | ✓ | ✓ protokolliert | ✓ | ✓ |
| `VERTRIEB` | ✓ | ✓ | ✓ | ✓ |
| `INNENDIENST` | ✓ | ✓ | ✓ | ✓ lesend |
| `MARKETING` | ✓ | **nur Einwilligungsstatus** | ✗ | ✗ |
| `PARTNER` (Dealer Hub) | nur eigene | nur eigene | ✗ | ✗ |
| `KUNDE` | ✗ | ✗ | ✗ | ✗ |

Mandantentrennung über Row Level Security wie im Kern-CRM.

---

## 8. Protokollierung

| Ereignis | Warum |
|---|---|
| Händlerprofil geändert, insbesondere beurteilende Felder | Herkunft jeder Bewertung |
| Klasse übersteuert | §Kapitel 4.3 — Missbrauchsschutz |
| Kooperation aktiviert oder gekündigt | Wirtschaftlich bindend |
| Besuchsbericht abgerufen | Personenbezogene Einschätzungen |
| Personendatensatz angelegt oder gelöscht | Fristennachweis |
| Einwilligung erteilt oder widerrufen | Der Nachweis selbst |
| Export an Brevo | Wer wurde übergeben, mit welcher Grundlage |
| Auskunft erteilt | Fristnachweis |

---

## 9. Offene Punkte

| ID | Punkt | Blockiert | Zu klären durch |
|---|---|---|---|
| **D-01** | Aufbewahrungsfrist für Besuchsberichte und Vertriebsnotizen: 36 Monate tragfähig? | Löschkonzept | Rechts- und Datenschutzberatung |
| **D-02** | Getrennte Einwilligung für Messung (Öffnungs- und Klickverhalten): Textentwurf und Gestaltung | Marketingmodul | Datenschutzberatung |
| **D-03** | Erweiterung der Interessenabwägung auf die laufende Betreuung | Erfassung von Ansprechpartnern über die Erstansprache hinaus | Datenschutzberatung |
| **D-04** | Umsatzklasse und Bootszahl: Zulässigkeit der Speicherung bei Einzelunternehmen (dort personenbezogen) | Score bei Einzelunternehmen | Rechtsberatung |
| **D-05** | Schweiz: Vermittlerzulassung vor jeder Ansprache — die Datenbank selbst ist davon unberührt (Kapitel 13.3) | Ausbaustufe 3 | Geschäftsführung |
