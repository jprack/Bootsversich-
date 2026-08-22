# 06 — Vertrags- und Bootsverwaltung

## Teil A — Vertragsverwaltung

### 1. Der Grundsatz: ein Vertrag wird nie geändert

Jede Änderung erzeugt eine `VERTRAGSVERSION`. Der Kopfsatz `VERTRAG` trägt nur,
was sich nie ändert: Nummer, Kunde, Versicherer, Sparte, Beginn.

```
VERTRAG  KA-AT-2019-0871      Kunde: Familie Berger · Versicherer: Mannheimer
   │
   ├─ v1  01.04.2019 – 31.03.2021   NEUABSCHLUSS      1.240,00 €   SFR 0 %
   ├─ v2  01.04.2021 – 31.03.2023   VERLAENGERUNG     1.190,00 €   SFR 25 %
   ├─ v3  01.06.2022 – 31.03.2023   OBJEKTWECHSEL     1.420,00 €   neues Boot
   ├─ v4  01.04.2023 – 31.03.2025   VERLAENGERUNG     1.380,00 €   SFR 40 %
   └─ v5  01.04.2025 – offen        PRAEMIENANPASSUNG 1.465,00 €   ← gilt
```

**Warum das nicht verhandelbar ist.** Bei einem Schaden im August 2022 lautet
die Frage: Welche Deckung galt damals, mit welchem Selbstbehalt, für welches
Boot? Ohne Versionen ist die Antwort eine Rekonstruktion aus E-Mails. Mit
Versionen ist sie eine Abfrage.

Version `v3` zeigt den häufigsten Fall: Der Kunde kauft ein größeres Boot
mitten in der Laufzeit. Beginn und Ende der alten Version werden nicht
verändert — es entsteht eine neue mit eigenem Gültigkeitsbeginn.

### 2. Statusmaschine des Vertrags

```
                    ┌──────────┐
                    │ ANGEBOT  │  Angebot erfasst, noch nicht beantragt
                    └────┬─────┘
                         │ Kunde nimmt an
                    ┌────▼─────┐
              ┌─────┤BEANTRAGT │  Antrag beim Versicherer
              │     └────┬─────┘
              │          │ Policierung bestätigt
              │     ┌────▼─────┐
              │     │  AKTIV   │◀────────┐
              │     └──┬───┬───┘         │ Zahlung nachgeholt
              │        │   │             │
              │        │   └─────────┐   │
              │        │       ┌─────▼───┴──┐
              │        │       │   RUHEND   │  Zahlungsverzug, Saisonpause
              │        │       └────────────┘
              │        │ Kündigung eingegangen
              │   ┌────▼──────┐
              │   │GEKUENDIGT │  Kündigung wirksam zum Ablauf
              │   └────┬──────┘
              │        │ Ablaufdatum erreicht
              │   ┌────▼──────┐
              │   │ABGELAUFEN │  Endzustand
              │   └───────────┘
              │ Antrag abgelehnt oder zurückgezogen
         ┌────▼──────┐
         │STORNIERT  │  Endzustand
         └───────────┘
```

Statuswechsel erfolgen ausschließlich über **benannte Übergänge** mit eigener
Berechtigung, Vorbedingung und Auditeintrag. Es gibt keinen allgemeinen Weg,
einen Vertrag „auf aktiv zu setzen".

### 3. Fristen — der wirtschaftliche Kern

| Frist | Bedeutung | Folge |
|---|---|---|
| `hauptfaelligkeit` | Jahrestag der Prämienfälligkeit | **Auslöser des Verlängerungslaufs 90 Tage vorher** |
| `ablauf` | Vertragsende | Ohne Verlängerung endet der Schutz |
| `kuendigungsfrist_tage` | Vorlauf der ordentlichen Kündigung | Bestimmt, wann die Ansprache spätestens laufen muss |
| Gültigkeit eines Angebots | Aus dem Angebot | Nach Ablauf ist eine Neuanfrage nötig |
| Zahlungsfälligkeit | `PRAEMIE.faellig_am` | Verzug erhöht das Kündigungsrisiko |

```
        T-120        T-90         T-60      T-45    T-30   T-14    T-0
          │            │            │         │       │      │      │
     Bestands-    Vorgang      Kunden-   Kündigungs- Erinne- Eskala- Haupt-
      prüfung     angelegt     ansprache   frist naht  rung    tion  fälligkeit
     (intern)     Aufgabe bei              Stufe 1           Stufe 2
                  hohem Wert
                  oder Risiko
```

**Fristen werden in der Zeitzone des Vertragslands gerechnet.** `Europe/Vienna`
und `Europe/Berlin` sind meist gleich — die Annahme ist trotzdem falsch zu
treffen.

### 4. Verlängerung

Der Verlängerungslauf ist die einzige Automatisierung, deren Ausfall unmittelbar
Geld kostet.

| Schritt | Regel | Ergebnis |
|---|---|---|
| Bestandsprüfung T-120 | Zeitwert aktuell? Nutzung geändert? Revier geändert? Boot noch im Eigentum? | Intern, ohne Kundenkontakt |
| Vorgang T-90 | `A-21` | Verlängerungsvorgang mit Dublettenschutz |
| Kanalwahl | `customer_value_score ≥ 70` **oder** `risk_score ≥ 60` | Persönlicher Anruf statt E-Mail |
| Anpassungsbedarf | Zeitwert weicht > 15 % ab, Nutzungsart geändert, Revier erweitert | Neue Tarifierung anstoßen |
| Ansprache T-60 | `A-22` | Angebot im Portal, Hinweis per E-Mail |
| Eskalation T-45, T-14 | `A-23`, `A-24` | Aufgabe mit steigender Priorität |
| Abschluss | Bestätigung des Kunden | Neue Vertragsversion `VERLAENGERUNG` |
| Kündigung | Kündigungsgrund **Pflichtfeld** | Rückgewinnungsvorgang T+30 |

### 5. Umdeckung und Trägerwechsel

Wechselt ein Kunde den Versicherer, entsteht **kein** neuer Vertrag ohne Bezug.
Der neue Vertrag trägt `vorgaenger_vertrag_id`. Damit bleiben Bestandsdauer,
Schadenfreiheitsstufe und Kundenhistorie nachvollziehbar — und die Auswertung
unterscheidet eine Umdeckung von einem echten Neukunden.

### 6. Was der Vertrag **nicht** enthält

| Nicht enthalten | Wo stattdessen |
|---|---|
| Prämienberechnung | Tarifwerk. Der Vertrag speichert das **Ergebnis** samt `berechnungsprotokoll` |
| Bedingungswerk als Text | Dokumentenmanagement, verknüpft über `DECKUNG.bedingungswerk_dokument_id` |
| Schadenhistorie | Eigenes Modul. Nur `vorschaeden_anzahl` am Boot als tarifliches Merkmal |
| Zahlungseingänge | `PRAEMIE.status` als Sicht. Die Buchung liegt beim Inkassoberechtigten |
| Bestand des Versicherers | Wir führen unsere Sicht. Der Abgleich ist ein Prozess, keine Kopie |

---

## Teil B — Bootsverwaltung

### 7. Das Boot ist ein Risikoobjekt, kein Stammdatensatz

Jedes Feld des Bootes speist eine Tarifposition, einen Zuschlag oder eine
Annahmerichtlinie. Diese Zuordnung ist der Grund, warum das Modell so
detailliert ist — und der Beleg, dass kein Feld ohne Verwendung erhoben wird.

| Feld | Wozu | Quelle |
|---|---|---|
| `bootstyp` | Wahl der Tariftabelle | beide Tarife |
| `bauart` (Komfort/Sport, Verdränger/Gleiter) | Zeile in der Tariftabelle | Entwurf 2026 |
| `gesamtversicherungssumme` | Bemessungsgrundlage **und** Bandzuordnung | beide |
| `fahrtgebiet` | Spalte in der Tariftabelle | beide |
| `baujahr` | Alterszuschlag **und** Anfragepflicht ab 15 Jahren | beide |
| `rumpfmaterial` | Zuschlag 25 % bei Holz und Carbon | Entwurf 2026 |
| `mastmaterial` | Der Tarif setzt Aluminium voraus | Entwurf 2026 |
| `segelflaeche_m2` | Haftpflichtprämie bei Segelbooten | beide |
| `motorleistung_kw` | Haftpflichtprämie bei Motorbooten | beide |
| `hoechstgeschwindigkeit_kn` | Anfragepflicht über 40 kn | Entwurf 2026 |
| `nutzungsart` | Charterzuschlag 25 % bzw. 50 % | beide |
| `heimatgewaesser` | Seen-Nachlass 10 % | NAUTIMA |
| `hersteller_organisation_id` | Premiumwerften-Nachlass 10 % | NAUTIMA |
| `flaggenland` | Anfragepflicht außer AT, DE, SLO, HR | Entwurf 2026 |
| `hat_beiboot`, `hat_trailer` | Mitversicherung zum Satz des Fahrzeugs | NAUTIMA |
| `vorschaeden_anzahl` | Schadenfreiheitsstufe | NAUTIMA |
| `laenge_fuss` | Zusatzprodukte nach Fußlänge | Charter-Preisliste |

### 8. Pflichtfelder nach Stufe

Ein Interessent soll nicht 25 Felder ausfüllen, bevor er eine Größenordnung
sieht. Deshalb drei Stufen:

| Stufe | Pflichtfelder | Wozu es reicht |
|---|---|---|
| **Anfrage** | Bootstyp, Baujahr, Gesamtversicherungssumme, Fahrtgebiet, Nutzungsart | Unverbindliche Spanne auf der Website |
| **Angebot** | zusätzlich Bauart, Rumpfmaterial, Segelfläche oder Motorleistung, Höchstgeschwindigkeit, Liegeplatzart, Flaggenland | Anfrage an den Versicherer |
| **Antrag** | zusätzlich Hersteller, Modell, Rumpfnummer, Kennzeichen, Zeitwert mit Stichtag, Vorschäden, Zubehörwerte | Policierung |

Die Stufen werden am `PRODUKTSCHEMA` gepflegt, nicht im Formularcode.

### 9. Wertentwicklung

Ein Boot verliert an Wert. Ein Vertrag, der weiter den Neuwert versichert, ist
teurer als nötig — und einer, der einen zu niedrigen Wert versichert, führt zur
Unterversicherung.

| Regel | Umsetzung |
|---|---|
| `zeitwert` immer mit `zeitwert_stichtag` | Ein Zeitwert ohne Stichtag ist wertlos |
| Prüfung bei der Bestandsprüfung T-120 | Ist der Stichtag älter als 24 Monate: Aufgabe zur Aktualisierung |
| Abweichung > 15 % gegenüber der Versicherungssumme | Aufgabe „Versicherungssumme anpassen" |
| Historie | Jede Wertänderung erzeugt ein Ereignis `boot.wert_geaendert` |

### 10. Eigentümerwechsel — der teuerste Moment

```
   boot.veraeussert
        │
        ├─▶ BOOT.status = VERKAUFT, veraeussert_am gesetzt
        │
        ├─▶ VERTRAGSOBJEKT.gueltig_bis wird gesetzt
        │
        ├─▶ Prüfung: Deckt der Vertrag noch ein Objekt?
        │      nein → Aufgabe „Vertrag ohne Objekt — klären"
        │
        ├─▶ risk_score des Kunden steigt deutlich
        │      Ein verkauftes Boot ohne Nachfolger ist der stärkste
        │      Vorbote einer Kündigung
        │
        └─▶ Aufgabe „Nachfolgeboot?" mit hoher Priorität, binnen 3 Tagen
```

Der letzte Schritt ist der wertvollste im ganzen Modul. Wer ein Boot verkauft,
kauft meist ein anderes. Wer zu diesem Zeitpunkt nicht anruft, verliert den
Kunden an den Händler des neuen Bootes — der seinen eigenen Vermittler
mitbringt.

### 11. Boot ohne Vertrag — die Cross-Selling-Quelle

Jedes erfasste Boot ohne passenden aktiven Vertrag erzeugt eine Prüfaufgabe.
Solche Boote entstehen laufend:

| Herkunft | Beispiel |
|---|---|
| Kundenportal | Kunde trägt sein zweites Boot ein |
| Händler-Empfehlung | Bestandsobjekt aus dem Dealer Hub |
| Beratungsgespräch | „Wir haben noch ein Beiboot" |
| Bestandsprüfung | Vertrag deckt nur eines von zwei Objekten |

Die Regel prüft dabei: Gibt es eine aktive Deckung für **dieses** Objekt in
**dieser** Sparte? Ein Boot mit Haftpflicht, aber ohne Kasko, ist ebenso ein
Anlass wie ein Boot ganz ohne Vertrag.

### 12. Nicht versicherbar und anfragepflichtig

Aus den Annahmerichtlinien des Entwurfstarifs 2026, als Daten hinterlegt:

| Fall | Verhalten im CRM |
|---|---|
| Versicherungssumme über 1 Mio | Kein automatisches Ergebnis. Vorgang geht in die manuelle Bearbeitung |
| Fahrzeug älter als 15 Jahre | dito |
| Schneller als 40 kn | dito |
| Jetski, Zille, Katamaran, Trimaran, Schlauchboot ohne Festrumpf | dito |
| Flaggenland außer AT, DE, SLO, HR | dito |
| **Windsurfbrett, Ruderboot, Tretboot, Kajak, Kanu, Eigenbau** | **Nicht versicherbar.** Lead wird mit `verlustgrund = NICHT_VERSICHERBAR` geschlossen, freundlich abgelehnt |

> Der Unterschied ist wichtig: **anfragepflichtig** heißt „ein Mensch entscheidet",
> **nicht versicherbar** heißt „wir sagen ab". Beides wird nie geschätzt, und
> beides wird dem Interessenten unmissverständlich mitgeteilt — eine hängende
> Anfrage ist schlechter als eine klare Absage.
