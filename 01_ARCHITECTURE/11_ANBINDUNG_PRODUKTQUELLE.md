# 11 — Anbindung der Produktquelle

| Feld | Wert |
|---|---|
| Betrifft | Offener Punkt **A-01**, jetzt geschlossen |
| Kanal | **E-Mail** |
| Vermittlerstatus | **Mehrfachagent** — mehrere Versicherer, in deren Auftrag |
| Status der Schnittstelle | `VERIFIZIERT` als dokumentierter E-Mail-Prozess |

---

## 1. Was jetzt feststeht

Der Austausch mit den Versicherern läuft über E-Mail. Das ist eine belastbare
Grundlage: Ein dokumentierter E-Mail-Prozess ist eine zulässige Verifikationsquelle.
Der Adapter wird gebaut, nicht gemockt.

Gleichzeitig ist E-Mail die Anbindungsart mit den weitreichendsten Folgen für das
Produkt. Sie sind hier vollständig aufgeführt — auch die unangenehmen.

---

## 2. Die wichtigste Folge: es gibt keine Online-Tarifierung

Eine E-Mail antwortet nicht in 800 Millisekunden. Sie antwortet in Stunden oder
Tagen, und sie antwortet mit einem PDF, nicht mit einem Betrag.

**Damit kann die Website keine verbindliche Prämie anzeigen.** Das ist keine
technische Einschränkung, die sich wegoptimieren lässt — es ist die Eigenschaft
des gewählten Kanals.

### Was das für die Kundenstrecke bedeutet

| | Mit API | Mit E-Mail |
|---|---|---|
| Kunde füllt Formular aus | Prämie erscheint sofort | Bestätigung: „Ihr Angebot erhalten Sie …" |
| Abschluss möglich | in derselben Sitzung | erst nach Rückmeldung, in einer zweiten Sitzung |
| Abbruchrisiko | am Preis | **an der Wartezeit** |
| Entscheidende Kennzahl | Umwandlungsquote im Rechner | **Antwortzeit bis zum Angebot** |

Die zweite Sitzung ist der kritische Punkt: Zwischen Anfrage und Angebot verliert
man Interessenten, die in der Zwischenzeit woanders abschließen. Die
Gegenmaßnahme ist nicht Technik, sondern **Geschwindigkeit im Innendienst** —
und genau die ist ab jetzt eine Architekturanforderung, kein Serviceversprechen.

### Zwei Wege für die Website

| Weg | Beschreibung | Dafür | Dagegen |
|---|---|---|---|
| **A — Reine Anfragestrecke** | Kein Preis auf der Website. Klare Zusage: „Ihr persönliches Angebot binnen einem Werktag." | Ehrlich, kein Pflegeaufwand, keine Haftungsfrage | Deutlich geringere Umwandlung; Wettbewerber mit Rechner gewinnen den Erstkontakt |
| **B — Unverbindliche Richtprämie** | Eigene Tarifsystematik auf der Website errechnet eine Spanne; das verbindliche Angebot folgt per E-Mail-Prozess | Interessent bekommt sofort eine Größenordnung, Abbruch sinkt spürbar | Erfordert gepflegte Tarifdaten je Versicherer; Abweichung zwischen Indikation und Angebot muss erklärt werden; Kennzeichnung als unverbindlich ist rechtlich heikel |

**Empfehlung: Weg B**, aber mit drei Bedingungen — sonst wird er zur Falle:

1. Die Anzeige ist eine **Spanne**, kein Betrag („typischerweise 380–520 € im Jahr").
2. Sie ist unübersehbar als unverbindliche Orientierung gekennzeichnet, nicht im Kleingedruckten.
3. Die Tarifsystematik ist ein gepflegtes Datenobjekt mit Verantwortlichem und
   Aktualisierungsrhythmus — **nicht** eine Formel, die einmal jemand eingebaut hat.

Ohne Bedingung 3 veraltet die Indikation binnen Monaten, und jede Abweichung vom
späteren Angebot kostet Vertrauen an der teuersten Stelle des Prozesses.

> **Neuer offener Punkt A-08:** Entscheidung zwischen Weg A und Weg B. Bei Weg B
> zusätzlich: Woher kommen die Tarifdaten, und wer pflegt sie?
> Diese Entscheidung gehört in Welle 1 und beeinflusst den Zuschnitt von M2.

---

## 3. Die zweite Folge: Mehrfachagent heißt Fächerung

Als Mehrfachagent stehen mehrere Versicherer zur Verfügung. Bei E-Mail-Anbindung
bedeutet das: **eine Anfrage, mehrere ausgehende Mails, mehrere zurückkommende
Angebote, ein Vergleich.**

```
                        ┌──────────────────────────────┐
                        │ VORGANG                      │
                        │ Anfrage des Interessenten    │
                        └───────────────┬──────────────┘
                                        │
                        ┌───────────────▼──────────────┐
                        │ ANGEBOTSANFRAGE              │
                        │ eingefrorene Antragsdaten    │
                        └──┬──────────┬──────────┬─────┘
                           │          │          │
              ┌────────────▼──┐ ┌─────▼──────┐ ┌─▼────────────┐
              │ ÜBERMITTLUNG  │ │ ÜBERMITTL. │ │ ÜBERMITTLUNG │
              │ Versicherer A │ │ Vers. B    │ │ Versicherer C│
              │ E-Mail raus   │ │ E-Mail raus│ │ E-Mail raus  │
              └────────────┬──┘ └─────┬──────┘ └─┬────────────┘
                           │          │          │
              ┌────────────▼──┐ ┌─────▼──────┐ ┌─▼────────────┐
              │ ANGEBOT A     │ │ ANGEBOT B  │ │ keine Antwort│
              │ 468,00 €      │ │ 512,00 €   │ │ → Aufgabe    │
              └────────────┬──┘ └─────┬──────┘ └──────────────┘
                           │          │
                        ┌──▼──────────▼──┐
                        │ VERGLEICH      │
                        │ Agent wählt    │
                        │ + BEGRÜNDUNG   │  ← Pflichtfeld
                        └────────┬───────┘
                                 │
                        ┌────────▼───────┐
                        │ nur das gewählte
                        │ Angebot geht in │
                        │ die Antragsstrecke
                        └────────────────┘
```

### Warum die Begründung ein Pflichtfeld ist

Als Mehrfachagent empfehlen Sie aus mehreren Angeboten eines. Diese Empfehlung
ist dokumentationspflichtig. Wenn die Begründung erst nachträglich entsteht,
entsteht sie nie — deshalb ist sie technisch erzwungen: **Ohne erfasste
Begründung lässt sich kein Angebot auswählen.**

Zulässige Begründungen werden als Katalog geführt (bester Preis, passender
Deckungsumfang, Selbstbehalt, Revierabdeckung, Wunsch des Kunden, einziger
Anbieter) plus Freitext. Ein Katalog ist auswertbar, ein reines Freitextfeld
nicht.

> **Rechtlicher Hinweis:** Umfang und Form der Beratungs- und
> Dokumentationspflichten für Mehrfachagenten in AT und DE sind durch die
> Rechtsberatung zu bestätigen. Diese Architektur stellt die technischen Mittel
> bereit; sie legt den rechtlichen Umfang nicht fest.

### Folgen für das Datenmodell

| Änderung | Grund |
|---|---|
| `ANGEBOT` erhält `versicherer_id` | Mehrere Angebote je Anfrage von verschiedenen Trägern |
| `ANGEBOT` erhält `ausgewaehlt` (bool), `auswahlgrund` (Katalog), `auswahlbegruendung` (Text), `ausgewaehlt_von`, `ausgewaehlt_am` | Dokumentationspflicht |
| `ÜBERMITTLUNG` erhält `versicherer_id` | Je Versicherer eine eigene Übermittlung mit eigenem Status |
| `PRODUKTDEFINITION` erhält `versicherer_id` | Ein Produkt gehört zu genau einem Träger |
| Neue Entität `VERSICHERER` | Name, Kontaktpostfach, Betreffkonvention, Antwortzeitzusage, Agenturnummer |
| `VORGANG` erhält `angebotsfrist` | Ab wann fehlende Antworten zur Aufgabe werden |

---

## 4. Der ausgehende Kanal

### Aufbau einer Anfrage-Mail

| Bestandteil | Festlegung |
|---|---|
| Absender | Dienstpostfach, kein persönliches Postfach — sonst hängt der Prozess an einer Person |
| Empfänger | Postfach je Versicherer, gepflegt an der Entität `VERSICHERER` |
| Betreff | `[CAL-2026-004711] Angebotsanfrage · Bootskasko · Beispiel` — **Vorgangsnummer immer zuerst und in eckigen Klammern** |
| Textkörper | Kurzfassung, Agenturnummer, Verweis auf die Anlagen. Keine Prosa, die maschinell gelesen werden müsste |
| Anlage 1 | `antragsdaten.pdf` — menschenlesbar, für die Sachbearbeitung |
| Anlage 2 | `antragsdaten.csv` — flach, für Sachbearbeitung mit Erfassungssystem |
| Anlage 3 | Unterlagen des Interessenten, sofern erforderlich |
| Kopfzeilen | `Message-ID` wird gespeichert — sie ist die Korrelationskennung für den Rücklauf |

### Warum die Vorgangsnummer im Betreff steht

Die Gegenseite vergibt keine Kennung, die wir kennen. Ohne eigene Kennung im
Betreff ist der Rücklauf nur über Absender und Zeitfenster zuzuordnen — bei zwei
gleichzeitigen Vorgängen desselben Versicherers ist das eine Fehlzuordnung mit
personenbezogenen Daten. Die Vorgangsnummer im Betreff ist deshalb keine
Konvention, sondern eine Sicherheitsmaßnahme.

### Transportsicherheit

Eine Anfrage-Mail enthält Name, Anschrift, Geburtsdatum und Objektdaten. Sie ist
kein Rundschreiben.

| Maßnahme | Festlegung |
|---|---|
| Transportverschlüsselung | TLS wird erzwungen, nicht nur angeboten. Je Versicherer wird einmalig geprüft, ob sein Mailsystem TLS zuverlässig annimmt; das Ergebnis wird an der Entität `VERSICHERER` festgehalten |
| Kein TLS beim Empfänger | Dann **keine** Anlagen. Stattdessen Mail mit Link auf einen geschützten Bereich, Zugang gesondert übermittelt |
| Ende-zu-Ende | S/MIME oder PGP, sofern der Versicherer es unterstützt — wird je Träger erhoben, nicht vorausgesetzt |
| An den Kunden | **Unverändert: keine sensiblen Unterlagen als Anhang.** Die Regel aus dem Sicherheitsmodell gilt weiter. Der Kanal zum Versicherer ist ein Geschäftsprozess zwischen zwei Verantwortlichen; der Kanal zum Kunden ist es nicht |

### Idempotenz

Jede Übermittlung trägt einen Idempotenzschlüssel aus Vorgangsnummer,
Versicherer und laufender Nummer. Ein zweiter Versand desselben Schlüssels
erzeugt keine zweite Anfrage, sondern einen Protokolleintrag. Sonst entstehen
durch einen wiederholten Job zwei Anträge für denselben Kunden — bei E-Mail
merkt das niemand, bis die zweite Police kommt.

---

## 5. Der eingehende Kanal

Der Rücklauf ist der aufwändigere Teil. Er ist ein eigenes Teilsystem, kein
Nebenprodukt.

```
Postfach (IMAP)
   │
   ├─ Worker holt ab, im Minutentakt
   │
   ├─ ZUORDNUNG, in dieser Reihenfolge:
   │     1. Vorgangsnummer im Betreff        → eindeutig
   │     2. In-Reply-To / References          → eindeutig
   │     3. Absender + offene Übermittlung    → Vorschlag, nie automatisch
   │     4. keine Zuordnung möglich           → AUFGABE für den Innendienst
   │
   ├─ ANLAGEN
   │     Virenprüfung → SHA-256 → Objektspeicher → Dokumentversion
   │     Bis zum Prüfergebnis: kein Zugriff
   │
   ├─ ERFASSUNG der Angebotsdaten
   │     Innendienst trägt Prämie, Laufzeit, Beginn, Deckungen,
   │     Gültigkeit in ein Formular ein
   │     → dieselben Prüfregeln wie bei einem API-Import
   │
   └─ ORIGINAL-MAIL wird als Dokument abgelegt
         Sie ist der Nachweis. Sie bleibt nicht im Postfach.
```

### Verbindliche Regeln

| Regel | Grund |
|---|---|
| Eine unzuordenbare Mail wird **nie** stillschweigend verworfen | Sie enthält mit hoher Wahrscheinlichkeit ein Angebot, auf das ein Kunde wartet |
| Zuordnung über Absender ist ein **Vorschlag**, keine Entscheidung | Zwei gleichzeitige Vorgänge desselben Trägers wären sonst vertauschbar |
| Manuell erfasste Angebotsdaten durchlaufen dieselben Prüfregeln wie importierte | Ein Tippfehler bei der Prämie ist wahrscheinlicher als ein Übertragungsfehler einer API |
| Die Original-Mail wird ins Dokumentenmanagement überführt | Ein Postfach ist kein Archiv: nicht durchsuchbar für Prüfer, nicht fristgesteuert löschbar, an ein Konto gebunden |
| Ausbleibende Antwort erzeugt nach Frist eine Aufgabe | Bei E-Mail gibt es keine Fehlermeldung. Schweigen ist der Normalfall des Scheiterns |

### Der Punkt, an dem KI helfen darf — und wo nicht

Ein Angebots-PDF auszulesen ist die naheliegende Anwendung für M8. Erlaubt ist:
Prämie, Laufzeit, Beginn und Deckungen als **Vorbelegung** des Erfassungsformulars
vorschlagen, jeweils mit Sicherheitswert. Nicht erlaubt: das Formular ohne
Sichtprüfung abschicken. Das Original bleibt unverändert, die Verantwortung
bleibt beim Menschen (ADR-0008).

---

## 6. Was ausdrücklich nicht gebaut wird

| Ausgeschlossen | Grund |
|---|---|
| Automatisierung eines Versichererportals | Ohne schriftliche Erlaubnis rechtlich und betrieblich nicht tragbar |
| Eigener Mailserver mit eigenem MX | Betriebsaufwand, Spamabwehr und Zustellbarkeit stehen in keinem Verhältnis |
| Automatische Übernahme extrahierter Angebotsdaten | Siehe ADR-0008 |
| Weiterleitung von Kundenunterlagen ohne Prüfung des Transportwegs | Personenbezogene Daten über unverschlüsselte Zustellung |

---

## 7. Ablösepfad

Sobald ein Versicherer eine technische Schnittstelle anbietet, wird für **diesen
einen Träger** der Adapter getauscht. Alles darüber — Vorgang, Prüfregeln,
Vergleich, Antragsstrecke — bleibt unverändert. Genau dafür existiert die
Adaptergrenze.

Der Zustand „Versicherer A per API, Versicherer B und C per E-Mail" ist der
erwartete Normalfall, kein Übergangszustand. Die Auswahl des Kanals ist deshalb
eine Eigenschaft der Entität `VERSICHERER`, keine globale Einstellung.

---

## 8. Was sich gegenüber Fassung 1.0 der Architektur ändert

| Dokument | Änderung |
|---|---|
| `05_SCHNITTSTELLEN.md` | Zeile „Versicherer / Produktquelle": Status `OFFEN` → `VERIFIZIERT (E-Mail)`. Neue Zeile für den Posteingang |
| `04_DATENMODELL.md` | Entität `VERSICHERER`; Felder für Auswahl und Begründung am Angebot; Versichererbezug an Übermittlung und Produktdefinition |
| `07_DATENFLUESSE.md` | Fluss 4 erhält die Fächerung an mehrere Träger und den Vergleichsschritt |
| `03_MODULUEBERSICHT.md` | M2 hängt von der Entscheidung A-08 ab; neues Teilsystem Posteingang in M10 |
| `10_ROADMAP.md` | Welle 2 baut den E-Mail-Adapter real statt gegen einen Mock; Welle 1 entscheidet A-08 |
| `09_SKALIERUNG.md` | Antwortzeit bis zum Angebot wird zur Leitkennzahl, nicht die Antwortzeit der API |
