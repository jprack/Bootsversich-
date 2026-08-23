# 07 — CRM-Integration

---

## 1. Der Ablauf des Auftrags, vollständig ausgeführt

Der Auftrag beschreibt: gefunden → bewertet → geprüft → gespeichert → Aufgabe →
Benachrichtigung. Genau das, mit den Bedingungen, die jeder Schritt braucht.

```
 ① GEFUNDEN
    Recherchelauf erzeugt Rohobjekt
    Bedingung: Quelle aktiv, Erlaubnis geklärt, kein Sperrvermerk
    Ergebnis: bearbeitungsstatus = ROH
        │
 ② NORMALISIERT
    Domain, Telefon, Name, Adresse in Vergleichsform
    Ergebnis: NORMALISIERT
        │
 ③ BEWERTET
    Basiswert mit score_herleitung. Potenzialwert bleibt leer
    Ergebnis: BEWERTET
        │
 ④ GEPRÜFT — maschinell
    Vier Dublettenprüfungen, Vorschläge entstehen
    Ergebnis: ZUR_PRUEFUNG
        │
 ⑤ GEPRÜFT — menschlich          ◀── die Freigabegrenze
    Eine Maske: Objekt · Belege · Score-Herleitung · Dublettenlage
    Drei mögliche Entscheidungen, keine vierte:
        ├── FREIGEGEBEN
        ├── VERWORFEN (mit Grund)
        └── ZURUECKGESTELLT (mit Datum)
        │
 ⑥ GESPEICHERT
    ORGANISATION + ORGANISATIONSROLLE entstehen im CRM
    status = INTERESSENT · quelle = RECHERCHE
    Rückverweis auf objektnummer, Belegkette bleibt erreichbar
        │
 ⑦ AUFGABE
    Genau eine, mit Dublettenschlüssel, im Rahmen der Tageskapazität
    Klasse A: 5 Arbeitstage · B: laufende Welle · C: Sammelfenster · D: keine
        │
 ⑧ BENACHRICHTIGUNG
    Keine Einzelmeldung. Die Tagesliste ist die Benachrichtigung.
    Ausnahme: Klasse A mit Hauptfälligkeit in unter 30 Tagen
```

---

## 2. Die Freigabegrenze im Einzelnen

### 2.1 Was der Prüfende sieht

| Bereich | Inhalt |
|---|---|
| Kopf | Name, Untergruppe, Ort, Revier, Basiswert mit Klasse |
| **Belege** | Je Feld: Wert, Quelle, Fundstelle, Datum — anklickbar |
| **Herleitung** | Die fünf Posten des Basiswerts mit ihrer Begründung |
| **Dublettenlage** | Vorschläge mit Kennzahl und den anschlagenden Regeln, CRM-Treffer zuerst |
| **Sperrlage** | Bestehende Sperrvermerke zu Domain, Telefon, Ort |
| Rohdaten | Der unveränderte Quelltext der Felder |

**Ziel: eine Entscheidung in unter 60 Sekunden.** Wenn das nicht erreicht wird,
staut sich die Prüfliste, und die Engine ist nutzlos, egal wie gut sie findet.

### 2.2 Was Freigabe technisch bedeutet

| Prüfung vor der Übernahme | Bei Verstoß |
|---|---|
| Kein aktiver Sperrvermerk auf Domain, E-Mail, Telefon | Übernahme abgewiesen |
| Land liegt in einem Mandanten mit Zulassung | Übernahme abgewiesen |
| Pflichtfelder vorhanden: `name_norm`, `land`, `untergruppe` | Übernahme abgewiesen |
| Offene Dublettenvorschläge ≥ 0,80 sind entschieden | Übernahme abgewiesen |
| Untergruppe ist auf eine Organisationsrolle abbildbar | Übernahme abgewiesen |

Fünf serverseitige Prüfungen, keine davon in der Oberfläche allein — Grundsatz R1
des Rollenmodells.

### 2.3 Verwerfen ist ein Ergebnis, kein Abbruch

Ein verworfenes Objekt wird **nicht gelöscht**. Es behält Grund, Zeitpunkt und
Person und wird bei künftigen Läufen derselben Quelle nicht erneut vorgeschlagen.

Sonst passiert das Vorhersehbare: Dieselbe aufgelöste Segelschule taucht jedes
Quartal wieder auf, und die Prüfliste füllt sich mit Arbeit, die schon getan
wurde.

---

## 3. Abbildung auf Organisationsrollen

| Untergruppe | Organisationsrolle | Rollenprofil |
|---|---|---|
| Bootshändler, Yachtmakler | `HAENDLER` | Marken, Standorte, Verkaufsvolumen |
| Marina, Hafenbetreiber | `PARTNER` | Liegeplätze, Reviere, Saison |
| Segel-, Motorboot-, Yachtclub, Wassersportverein | `CLUB` | Mitgliederzahl, Vorstand, Sitzungsrhythmus |
| Charter, Werft, Servicebetrieb, Wassersportschule | `PARTNER` | Art des Betriebs, Flotte |
| Boots-, Motorenhersteller | `HERSTELLER` | Marken, Premiumkennzeichen für den Werftnachlass |

**Die Rolle `MAKLER` wird hier nie vergeben.** Sie verlangt eine
Vermittlerregistrierung, und die entsteht erst im Vertragsverhältnis — nicht in
der Recherche.

Ein Objekt kann später **mehrere Rollen** bekommen: Der Händler, der auch
Charterbetrieb ist, ist eine Organisation mit zwei Rollen. Das ist genau der
Grund für ADR-0004 der Gesamtarchitektur.

---

## 4. Was beim Übergang mitwandert — und was nicht

| Wandert mit | Bleibt im Rechercheraum |
|---|---|
| Stammdaten, Anschrift, Erreichbarkeit | Rohwerte und Belegkette |
| Zielgruppenzuordnung als Rolle | Basiswert und Herleitung |
| Ansprechpartner, falls vorhanden | Dublettenvorschläge und ihre Entscheidungen |
| Rechtsgrundlage der Verarbeitung | Quellen- und Laufzuordnung |
| Rückverweis `objektnummer` | Alles Übrige |

**Der Score wandert absichtlich nicht ins CRM.** Er ist eine Akquisegröße; im
Bestand steuert der Customer Value Score aus `01_CRM_ENGINE`. Zwei Zahlen mit
demselben Namen an zwei Orten wären in einem Jahr widersprüchlich.

---

## 5. Rückfluss aus dem CRM

| Ereignis | Wirkung im Rechercheraum |
|---|---|
| Organisation wird `PARTNER` mit Vereinbarung | Objekt gilt als erschlossen, Abdeckungsgrad steigt |
| Pipeline auf `VERLOREN`, Grund `KEIN_INTERESSE` | `SPERRVERMERK` mit Frist, Vorgabe 24 Monate |
| Widerspruch gegen Ansprache | `SPERRVERMERK` **ohne** Frist, quellenübergreifend |
| Organisation auf `BEENDET` | Objekt `VERWORFEN`, Grund `AUFGELOEST`, Grundgesamtheit sinkt |
| Ansprechpartner scheidet aus | `AKQUISEKONTAKT` endet, Objekt bleibt |

Der Rückfluss läuft über Ereignisse, nicht über Abfragen — dieselbe Mechanik wie
die Outbox der Gesamtarchitektur. Grund: Der Rechercheraum darf nicht in das CRM
hineingreifen, sondern nur hören, was dort geschieht.

---

## 6. Benachrichtigung — bewusst sparsam

| Fall | Kanal |
|---|---|
| Neue Objekte in der Prüfliste | **Keine Meldung.** Zahl auf dem Dashboard |
| Aufgabe entstanden | Erscheint in der Tagesliste |
| Klasse A **und** bekannte Hauptfälligkeit < 30 Tage | Einzelmeldung — der einzige Fall mit Zeitdruck |
| Recherchelauf fehlgeschlagen | Meldung an die Administration, nicht an den Vertrieb |
| Prüfliste über 100 Objekte | Wöchentliche Sammelmeldung an die Führung |

**Begründung:** Bei zwei Personen ist jede Einzelmeldung eine Unterbrechung. Die
Tagesliste ist das Steuerungsinstrument; alles andere macht sie schwächer.
