# 01 — Gesamtkonzept der Lead Generation Engine

| Feld | Wert |
|---|---|
| Modul | `03_LEAD_GENERATION_ENGINE` |
| Fassung | 1.0 |
| Datum | 2026-08-23 |
| Grundlage | [`01_ARCHITECTURE/`](../01_ARCHITECTURE/README.md) Fassung 1.3 · [`02_CORE_CRM/`](../02_CORE_CRM/README.md) Fassung 1.2 |

---

## 1. Was dieses Modul ist — und was es nicht ist

Der Auftrag spricht von einer Engine, die „automatisch neue Kontakte
identifiziert, qualifiziert und dem CRM zuführt". Das ist erreichbar. Zwei
Annahmen darin tragen jedoch nicht, und weil das ganze Modul auf ihnen aufsitzt,
stehen sie am Anfang und nicht im Kleingedruckten.

### 1.1 Die Zielgruppen sind Organisationen, keine Personen

Segelclub, Marina, Werft, Händler, Charterunternehmen — das sind
**Organisationen**. Eine Person kommt erst später dazu, wenn bekannt ist, wer
dort Ansprechpartner ist. Die Engine erzeugt daher primär **Organisations­kandidaten**,
nicht Personendatensätze.

Das ist kein Formalismus. Es entscheidet über das Datenmodell (Kapitel 3), über
das Recht (eine juristische Person hat keine personenbezogenen Daten, ein
namentlicher Ansprechpartner schon — Kapitel 13) und über die Ansprache: Man
gewinnt keinen Yachtclub, man gewinnt dessen Obmann.

### 1.2 Der Markt ist endlich — und das ändert die Leitkennzahl

Es gibt in Österreich nicht beliebig viele Segelclubs. Es gibt eine bestimmte,
zählbare Menge, und sie wächst um wenige Einheiten im Jahr. Dasselbe gilt für
Marinas, Werften, Händler und Charterbetriebe im gesamten DACH-Raum.

**Damit ist Leadgenerierung hier kein Mengenproblem, sondern ein
Vollständigkeitsproblem.** Eine Engine, die monatlich 400 neue Leads ausspuckt,
beschreibt nicht den Markt, sondern ihre eigene Dublettenrate.

Die Leitkennzahl ist deshalb nicht „neue Leads pro Monat", sondern:

> **Abdeckungsgrad** — wie viel Prozent der bekannten Grundgesamtheit einer
> Zielgruppe in einem Land ist erfasst, bewertet und in einem definierten
> Bearbeitungszustand?

Eine Zahl, die gegen 100 % läuft und dort bleibt. Das ist unbequemer als eine
Kurve, die immer weiter steigt — aber es ist die Wahrheit über diesen Markt.

### 1.3 Was das Modul nicht tut

| Nicht Aufgabe | Wo es hingehört |
|---|---|
| Verträge, Prämien, Policen | `02_CORE_CRM`, Tarifwerk |
| Newsletterversand | Brevo (Modul M3) |
| Endkundengewinnung über die Website | Modul M2 — anderer Kanal, andere Rechtslage |
| Automatische Ansprache ohne Freigabe | **Nie**, siehe [ADR-0004](adr/0004-ansprache-ohne-kaltmail.md) |
| Zusammenführen von Organisationen | Nur Vorschlag, Entscheidung beim Menschen |

---

## 2. Die Systemgrenze

```
    ┌─────────────────────────────────────────────────────────────────┐
    │  RECHERCHERAUM  (eigenes Schema, außerhalb des CRM)             │
    │                                                                  │
    │   Quellen ──▶ Erfassung ──▶ Normalisierung ──▶ Bewertung        │
    │                                    │                             │
    │                                    ▼                             │
    │                           Dublettenabgleich                      │
    │                                    │                             │
    │                                    ▼                             │
    │                          ┌──────────────────┐                    │
    │                          │  PRÜFLISTE       │  ← Mensch          │
    │                          │  Freigabe / Weg  │                    │
    │                          └────────┬─────────┘                    │
    └───────────────────────────────────┼─────────────────────────────┘
                                        │  nur freigegebene Datensätze
                     ════════════════════▼════════════════════
    ┌─────────────────────────────────────────────────────────────────┐
    │  CRM  (02_CORE_CRM)                                              │
    │   ORGANISATION + ORGANISATIONSROLLE + KONTAKT + AUFGABE          │
    └─────────────────────────────────────────────────────────────────┘
```

**Die doppelte Linie ist die wichtigste Grenze dieses Moduls.**

Recherchedaten sind naturgemäß unsicher: unvollständig, veraltet, doppelt,
manchmal schlicht falsch. Sie stammen aus Quellen, die niemand von uns
kontrolliert. Käme das direkt in den Aktenschrank, wäre in sechs Monaten nicht
mehr unterscheidbar, welche Organisation ein geprüfter Geschäftspartner ist und
welche eine Zeile aus einem Verzeichnis.

Der Rechercheraum ist die **Werkbank vor der Werkbank**. Er darf schmutzig sein.
Das CRM darf es nicht. Begründung: [ADR-0001](adr/0001-rechercheraum-getrennt.md).

Dasselbe Muster wie beim Polizzenimport
([`02_CORE_CRM/14_POLIZZENIMPORT.md`](../02_CORE_CRM/14_POLIZZENIMPORT.md)):
**erfassen, vorschlagen, prüfen, übernehmen** — nie direkt schreiben.

---

## 3. Sieben Schichten

| Nr. | Schicht | Aufgabe | Automatisierbar |
|---|---|---|---|
| ① | **Quellenverwaltung** | Welche Quelle, wie oft, mit welcher Erlaubnis | teilweise |
| ② | **Erfassung** | Rohdaten holen oder einlesen | ja, je Quelle verschieden |
| ③ | **Normalisierung** | Adressen, Telefonnummern, Domains, Namen in eine Form bringen | vollständig |
| ④ | **Anreicherung** | Impressum, Register, offene Verzeichnisse | teilweise |
| ⑤ | **Dublettenabgleich** | Gegen Rechercheraum **und** CRM | vollständig, aber nur als Vorschlag |
| ⑥ | **Bewertung** | Zweistufiger Score (Kapitel 5) | ja, mit Erklärungspflicht |
| ⑦ | **Freigabe** | Mensch entscheidet: übernehmen, verwerfen, zurückstellen | **nie automatisch** |

Schichten ② bis ⑥ laufen als Hintergrundläufe. Schicht ⑦ ist der Engpass — und
zwar bewusst (Kapitel 9.6).

---

## 4. Der Weg von der Quelle zum CRM-Lead

```
  ①  Quelle wird angelegt
     Verzeichnis, Verband, Karte, Liste, Messe, manuelle Eingabe
     Rechtsgrundlage und Erlaubnis werden dokumentiert (Kapitel 4)
        │
  ②  Recherchelauf
     Eine Quelle, ein Zeitpunkt, ein Ergebnisumfang. Jeder Lauf ist
     wiederholbar und hinterlässt eine Spur.
        │
  ③  RECHERCHEOBJEKT entsteht
     Eine Organisation als Vermutung. Jedes Feld trägt seinen Beleg:
     welche Quelle, welcher Lauf, welche Fundstelle.
        │
  ④  Normalisierung
     Domain auf Registrable Domain, Telefon auf E.164, Land auf ISO,
     Name ohne Rechtsform und Sonderzeichen (Kapitel 6.2)
        │
  ⑤  Dublettenabgleich
     Gegen den Rechercheraum und gegen das CRM. Ergebnis ist ein
     ABGLEICHVORSCHLAG mit Kennzahl, nie eine Zusammenführung.
        │
  ⑥  Bewertung
     Basiswert aus Beobachtbarem. Potenzialwert bleibt leer, bis jemand
     gesprochen hat (Kapitel 5).
        │
  ⑦  Prüfliste
     Der Mensch sieht Objekt, Belege, Score-Herleitung und Dublettenlage
     auf einem Bildschirm und entscheidet.
        │
        ├── VERWORFEN ──▶ bleibt mit Grund liegen, kommt nicht wieder
        │
        └── FREIGEGEBEN
              │
  ⑧  Übernahme ins CRM
     ORGANISATION + ORGANISATIONSROLLE (Rolle nach Zielgruppe)
     Status INTERESSENT · quelle = RECHERCHE
     Belegkette bleibt erhalten und verweist zurück
        │
  ⑨  Aufgabe entsteht
     Genau eine, mit Dublettenschlüssel, im Rahmen der Tageskapazität
        │
  ⑩  Vertrieb arbeitet
     Pipeline (Kapitel 8) — ab hier ist es normale CRM-Arbeit
```

**Zwischen ⑦ und ⑧ liegt die Grenze.** Davor ist alles Vermutung, danach ist
alles Bestand.

---

## 5. Datenfluss in die andere Richtung

Der Rückfluss ist genauso wichtig wie der Hinfluss und wird meistens vergessen:

| Ereignis im CRM | Wirkung im Rechercheraum |
|---|---|
| Organisation wird Partner | Zielgruppe gilt an dieser Stelle als erschlossen, Abdeckungsgrad steigt |
| Organisation lehnt ab | Sperrvermerk mit Frist — **keine erneute Erfassung** vor Ablauf |
| Kontakt widerspricht der Ansprache | Dauerhafter Sperrvermerk, quellenübergreifend |
| Organisation existiert nicht mehr | Grundgesamtheit sinkt, Abdeckungsgrad korrigiert sich |

**Ohne diesen Rückfluss schlägt die Engine dieselbe Marina in sechs Monaten
wieder vor**, und der Vertrieb ruft ein zweites Mal an. Das ist der schnellste
Weg, ein Recherchesystem unglaubwürdig zu machen — nach innen wie nach außen.

---

## 6. Zehn Grundsätze

| Nr. | Grundsatz | Konsequenz |
|---|---|---|
| **G1** | Der Rechercheraum ist nicht das CRM | Getrenntes Schema, eigene Rechte, eigene Aufbewahrung |
| **G2** | Kandidaten sind Organisationen | Personen entstehen erst mit einem konkreten Ansprechpartner |
| **G3** | Jedes Feld trägt seinen Beleg | Quelle, Lauf, Fundstelle, Zeitpunkt — sonst ist es Hörensagen |
| **G4** | Nur erlaubte Quellen | Keine Plattform gegen ihre Nutzungsbedingungen ([ADR-0003](adr/0003-erlaubte-quellen.md)) |
| **G5** | Keine automatische Ansprache | Der Motor findet, der Mensch spricht ([ADR-0004](adr/0004-ansprache-ohne-kaltmail.md)) |
| **G6** | Der Score ist erklärbar oder er ist nicht | Jeder Punkt auf eine Tatsache zurückführbar ([ADR-0005](adr/0005-score-zweistufig.md)) |
| **G7** | Keine automatische Ablehnung, keine automatische Zusammenführung | Beides praktisch nicht rückholbar |
| **G8** | Die Kapazität begrenzt den Motor, nicht umgekehrt | Zwei Personen, 50 Aufgaben am Tag ([ADR-0006](adr/0006-kapazitaet-begrenzt.md)) |
| **G9** | Ablehnung und Widerspruch wirken quellenübergreifend | Ein Nein gilt für das System, nicht für eine Tabelle |
| **G10** | Abdeckung schlägt Menge | Die Kennzahl misst den Markt, nicht die Maschine |
