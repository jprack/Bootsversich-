# 04 — Quellenstrategie

---

## 1. Die Vorfrage, die über allem steht

Bevor eine Quelle nach Nutzen und Qualität bewertet wird, ist eine andere Frage
zu beantworten: **Darf sie überhaupt so genutzt werden?**

Drei verschiedene Regelwerke greifen gleichzeitig, und sie sind unabhängig
voneinander — eine Quelle kann öffentlich zugänglich und trotzdem unzulässig
auswertbar sein:

| Ebene | Frage | Wirkung bei Verstoß |
|---|---|---|
| **Nutzungsbedingungen** | Erlaubt der Betreiber automatisierte Abfrage und Speicherung? | Vertragsbruch, Sperre, Unterlassungsanspruch |
| **Datenschutz** | Sind personenbezogene Daten betroffen? Welche Rechtsgrundlage? | Aufsichtsverfahren, Bußgeld |
| **Urheber- und Datenbankrecht** | Ist die Sammlung als Datenbank geschützt? | Unterlassung, Schadenersatz |

**Die stehende Vorgabe dieses Projekts gilt unverändert:** Keine Automatisierung
fremder Portale durch Screen Scraping, Browser-Bots oder Credential Sharing ohne
ausdrückliche schriftliche Erlaubnis, technische Freigabe und rechtliche
Prüfung. Sie war ursprünglich für das Partnerportal formuliert; sie gilt für
jede fremde Plattform gleichermaßen.

---

## 2. Vier Zulässigkeitsklassen

| Klasse | Bedeutung | Beispiele |
|---|---|---|
| **A — frei nutzbar** | Öffentliche Veröffentlichung ohne einschränkende Bedingungen, manuelle oder maschinelle Übernahme in üblichem Umfang | Verbandsverzeichnisse, Herstellerhändlerlisten, Impressumsangaben |
| **B — nutzbar unter Bedingungen** | Nutzung erlaubt, aber Speicherung, Weitergabe oder Anzeige eingeschränkt | Kartendienste mit API-Bedingungen, lizenzierte Branchendaten |
| **C — nur auf Zusage** | Nutzung erst nach schriftlicher Erlaubnis des Betreibers | Mitgliederlisten, die nicht öffentlich stehen; Messeteilnehmerlisten |
| **D — nicht nutzbar** | Automatisierte Erfassung durch Nutzungsbedingungen untersagt | Soziale Netzwerke (§5) |

Jede Quelle trägt ihre Klasse im Feld `erlaubnis`. **Klasse D wird nicht
angelegt, sondern in einer Ausschlussliste geführt** — damit sie nicht in einem
Jahr als „gute Idee" wiederkommt.

---

## 3. Bewertete Quellenübersicht

Spalten: **Nutzen** (Reichweite in die Zielgruppe) · **Güte** (Vollständigkeit
und Aktualität der Angaben) · **Autom.** (automatisierbar) · **Klasse**

| Quelle | Zielgruppe | Nutzen | Güte | Autom. | Klasse | Priorität |
|---|---|---|---|---|---|---|
| **Herstellerverzeichnisse** (Händlerlisten der Werften und Motorenmarken) | Z1 | **sehr hoch** | **hoch** | hoch | A | **1** |
| **Landes- und Bundesverbände** (Segel-, Motorboot-, Wassersportverbände) | Z3 | **sehr hoch** | hoch | mittel | A | **1** |
| **Marina- und Hafenverzeichnisse** (Revierführer, Hafenhandbücher, Betreiberportale) | Z2 | hoch | mittel | mittel | A/B | **1** |
| **Firmenbuch / Handelsregister, offene Datensätze** | Z1 Z4 Z5 | mittel | **sehr hoch** | mittel | A/B | 2 |
| **Bootsmessen** — Ausstellerverzeichnisse | Z1 Z4 Z5 | **hoch** | hoch | mittel | A | **1** |
| **Bootsmessen** — Standgespräche | alle | **sehr hoch** | **sehr hoch** | keine | A | **1** |
| **Kartendienste** (Points of Interest: Marinas, Händler, Werften) | Z1 Z2 Z4 | hoch | mittel | hoch | **B** | 2 |
| **Websites der Objekte** (Impressum, Kontakt, „Über uns") | alle | mittel | hoch | hoch | A | **1** |
| **Charterportale und Flottenlisten** | Z4 | hoch | mittel | mittel | B | 2 |
| **Branchenverzeichnisse** (allgemeine Firmenverzeichnisse) | alle | niedrig | **niedrig** | hoch | A/B | 3 |
| **Fachpresse, Regattaberichte, Clubnachrichten** | Z3 | mittel | mittel | niedrig | A | 3 |
| **Bestehende Partner — Empfehlungen** | alle | **sehr hoch** | **sehr hoch** | keine | A | **1** |
| **Eigene Website — Anfragen von Betrieben** | alle | hoch | **sehr hoch** | vollständig | A | **1** |
| **Soziale Netzwerke** | alle | — | — | — | **D** | **entfällt** |

### 3.1 Die drei Quellen, mit denen zu beginnen ist

**Herstellerverzeichnisse.** Ein einziges Verzeichnis liefert das vollständige
Händlernetz einer Marke für ein ganzes Land, mit Gebietszuordnung, gepflegt vom
Hersteller selbst, weil er ein Eigeninteresse an Richtigkeit hat. Kein anderer
Weg zu Z1 ist auch nur annähernd so effizient. Und Z1 ist Priorität 1.

**Verbandslisten.** Dasselbe für Z3, mit demselben Qualitätsargument: Ein Verband
führt seine Mitglieder korrekt, weil es seine Mitglieder sind.

**Standgespräche auf Messen.** Die einzige Quelle mit *sehr hoher* Güte über alle
Cluster — weil die Angaben von der Person selbst stammen und der Kontakt bereits
stattgefunden hat. Rechtlich ist sie außerdem die unproblematischste, weil ein
Gespräch die Grundlage bildet. **Bei knapper Kapazität hat eine Messe Vorrang vor
jedem Rechercheautomatismus.**

### 3.2 Die Quelle mit dem schlechtesten Ruf-Nutzen-Verhältnis

Allgemeine Branchenverzeichnisse: hohe Trefferzahl, niedrige Güte, viele
Dubletten, veraltete Einträge, häufig aus anderen Verzeichnissen abgeschrieben.
Sie erzeugen genau das, was Kapitel 1 als Fehlbild beschreibt — Menge statt
Abdeckung. **Priorität 3, und nur zur Lückenfüllung, nicht als Grundstock.**

---

## 4. Kartendienste — Klasse B, und warum das wichtig ist

Kartendienste sind für Z2 und Z4 verlockend: Marinas und Werften sind
geografische Objekte und dort vollständig erfasst.

Die Nutzungsbedingungen solcher Dienste erlauben jedoch typischerweise die
*Anzeige* und *Verwendung im Zusammenhang mit der Karte*, beschränken aber die
**dauerhafte Speicherung** der abgerufenen Angaben, teils bis auf eine technische
Kennung. Das ist kein Randdetail: Es entscheidet, ob Name, Adresse und Telefon
aus dieser Quelle überhaupt im eigenen Bestand liegen dürfen.

**Umgang damit, ohne Vermutungen:**

1. Die Bedingungen des konkret gewählten Dienstes werden vor der ersten Nutzung
   geprüft und das Ergebnis in `QUELLE.nutzungsbedingungen_geprueft_am`
   festgehalten. → **offener Punkt L-01**
2. Bis dahin gilt `speicherung_erlaubt = false`. Der Dienst darf dann nur zur
   **Existenzprüfung und Verortung** dienen: „An dieser Stelle gibt es eine
   Marina" — die Stammdaten selbst werden aus einer Quelle der Klasse A geholt,
   üblicherweise der eigenen Website des Objekts.
3. Diese Trennung ist ohnehin die bessere Datenqualität: Das Impressum einer
   Marina ist genauer als jeder Karteneintrag.

---

## 5. Soziale Netzwerke — Klasse D

LinkedIn, Facebook, Instagram und YouTube stehen im Auftrag als Quellen. Sie
werden **nicht automatisiert ausgewertet**, und das ist eine Entscheidung, keine
Nachlässigkeit ([ADR-0003](adr/0003-erlaubte-quellen.md)).

**Begründung.** Die Nutzungsbedingungen dieser Plattformen untersagen
automatisierte Erfassung ohne Genehmigung ausdrücklich. Verstöße werden
durchgesetzt: Kontosperre, Unterlassungsaufforderung, Klage. Ein Vertriebsmotor,
dessen Datengrundlage jederzeit abgeschaltet werden kann und dessen Nutzung
einen Rechtsstreit auslöst, ist kein Vermögenswert, sondern eine Verbindlichkeit.
Bei einem Unternehmen mit zwei Personen ist ein solcher Streit existenziell.

**Was stattdessen erlaubt und sinnvoll ist:**

| Erlaubt | Nicht erlaubt |
|---|---|
| Die öffentliche Profil-URL als **Feld** speichern, wenn sie von der Website des Objekts verlinkt ist | Profile automatisiert abrufen, durchsuchen oder auslesen |
| Ein Profil manuell aufrufen, um einen Ansprechpartner zu prüfen | Automatisierte Kontaktanfragen oder Nachrichten |
| Werbung auf diesen Plattformen schalten und **eingehende** Anfragen verarbeiten | Zugangsdaten in einem Automatisierungswerkzeug hinterlegen |
| Ein offizielles Programm des Anbieters nutzen, wenn es Datenexport ausdrücklich vorsieht | Umgehung technischer Schutzmaßnahmen |

**Der wirtschaftlich bessere Weg über diese Kanäle ist ohnehin der umgekehrte:**
nicht dort Daten holen, sondern dort sichtbar sein und Anfragen einsammeln. Eine
eingehende Anfrage bringt eine Rechtsgrundlage gleich mit — eine ausgelesene
Adresse nicht.

---

## 6. Websites der Objekte — die stille Hauptquelle

Für die Anreicherung ist die eigene Website des Objekts die beste Quelle: Sie ist
vom Objekt selbst veröffentlicht, zur Kontaktaufnahme bestimmt, in AT und DE
durch die Impressumspflicht (§ 5 ECG bzw. § 5 DDG) rechtlich vorgeschrieben und
damit **inhaltlich verlässlich**.

Regeln für den Abruf:

| Regel | Grund |
|---|---|
| `robots.txt` wird beachtet | Erklärter Wille des Betreibers |
| Erkennbare Kennung im Abruf, mit Kontaktmöglichkeit | Wer nicht erkennbar ist, wird zu Recht gesperrt |
| Ein Abruf je Domain und Lauf, mit Wartezeit | Kein spürbarer Aufwand für den Betreiber |
| Nur Kontakt-, Impressums- und Über-uns-Seiten | Kein Vollabzug der Seite |
| Keine Umgehung von Anmeldung, Sperre oder Schutzmaßnahme | Grenze zur unbefugten Nutzung |
| Kein Bild, kein Text zur Weiterverwendung | Urheberrecht |

Diese Regeln stehen nicht aus Vorsicht hier, sondern weil ihre Verletzung genau
die Betriebe verärgert, die als Partner gewonnen werden sollen. **Der
Adressat der Recherche ist derselbe Mensch, der später den Vertrag
unterschreiben soll.**

---

## 7. Aufnahme einer neuen Quelle

```
  Vorschlag
     │
     ▼
  Sichtung: Zielgruppe, erwartete Menge, Güte einer Stichprobe von 10
     │
     ▼
  Zulässigkeitsprüfung: Bedingungen lesen, Klasse festlegen
     │
     ├── Klasse D ──▶ Ausschlussliste, mit Begründung und Datum. Ende.
     │
     ▼
  Klasse B oder C: Erlaubnis einholen, Beleg ablegen
     │
     ▼
  Testlauf über einen begrenzten Ausschnitt
     │
     ▼
  Trefferprüfung von Hand: 20 Objekte, Güte messen statt schätzen
     │
     ├── Güte niedrig ──▶ Quelle inaktiv, Ergebnis dokumentiert
     │
     ▼
  Freigabe durch eine zweite Person · Takt festlegen · aktiv
```

**Die Stichprobe von 20 ist nicht verhandelbar.** Die einzige Alternative wäre,
die Güte zu schätzen — und geschätzte Datenqualität ist der Grund, weshalb
Recherchebestände unbrauchbar werden, ohne dass es jemand merkt.

---

## 8. Aktualisierung und Verfall

Eine erfasste Organisation ist keine dauerhafte Tatsache. Vereine lösen sich auf,
Marinas wechseln den Betreiber, Händler geben die Marke ab.

| Takt | Was geprüft wird |
|---|---|
| **Quartalsweise** | Quellen der Priorität 1: Ist das Objekt noch gelistet? `zuletzt_gesehen_am` wird gesetzt |
| **Jährlich** | Erreichbarkeit: Domain, Telefon, E-Mail |
| **Anlassbezogen** | Rückläufer, unzustellbare Post, Hinweis eines Partners |

**Regel:** Ein Objekt, das in **zwei aufeinanderfolgenden Läufen** seiner
Hauptquelle fehlt und dessen Domain nicht mehr auflöst, geht auf
`ZURUECKGESTELLT` mit Prüfaufgabe — **nicht** automatisch auf `VERWORFEN`. Ein
Verein ohne Website ist immer noch ein Verein.
