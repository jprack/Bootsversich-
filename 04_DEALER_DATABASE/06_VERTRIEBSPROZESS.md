# 06 — Vertriebsprozess

---

## 1. Zehn Zustände — und die Trennung, die sie erst brauchbar macht

Der Auftrag nennt: Neu · Zu prüfen · Kontaktiert · Termin vereinbart · Angebot ·
Verhandlung · Partner · Aktiv · Inaktiv · Beendet.

Beim Ordnen fällt dasselbe auf wie in Modul 03: **Die letzten vier sind keine
Wegzustände.** „Partner", „Aktiv", „Inaktiv" und „Beendet" beschreiben nicht,
wie weit die Anbahnung ist, sondern **in welchem Zustand die Beziehung ist,
nachdem sie zustande kam**.

Die Auflösung — zwei Abschnitte einer Linie, nicht zehn gleichartige Stufen:

```
   ANBAHNUNG                                    BESTAND
   ─────────────────────────────────────        ──────────────────────────
   NEU → ZU_PRUEFEN → KONTAKTIERT →             PARTNER_AKTIV
   TERMIN → ANGEBOT → VERHANDLUNG                  ⇅
                          │                     PARTNER_RUHEND
                          ├──▶ PARTNER_AKTIV       │
                          │    (Unterschrift)      ▼
                          └──▶ VERLOREN         BEENDET
```

`VERLOREN` kommt im Auftrag nicht vor und wird ergänzt: Ohne einen Zustand für
„kommt nicht zustande" wandern gescheiterte Anbahnungen entweder auf `INAKTIV`
(dann ist der Bestand verfälscht) oder bleiben ewig in `VERHANDLUNG` (dann ist
die Pipeline verfälscht). Beides macht jede Conversionrate wertlos.

---

## 2. Die Zustände im Einzelnen

### Anbahnung

| Status | Bedeutung | Höchstverweildauer |
|---|---|---|
| `NEU` | Aus der Recherche freigegeben, noch nicht angefasst | 10 AT (Klasse A: 5) |
| `ZU_PRUEFEN` | Vor dem Erstkontakt ist etwas zu klären: Ansprechpartner, Marken, Sperrlage, Wettbewerb | 15 AT |
| `KONTAKTIERT` | Erstansprache erfolgt, Reaktion offen | 21 Tage |
| `TERMIN` | Gespräch vereinbart oder geführt | Termin + 5 AT |
| `ANGEBOT` | Konkretes liegt vor: Kooperationsentwurf, Konditionen, Deckungsangebot | Frist + 3 AT |
| `VERHANDLUNG` | Über Inhalt oder Konditionen wird gesprochen | 60 Tage |

### Bestand

| Status | Bedeutung | Bedingung |
|---|---|---|
| `PARTNER_AKTIV` | Vereinbarung unterzeichnet und laufend | **`KOOPERATION` mit `dokument_id`** |
| `PARTNER_RUHEND` | Vereinbarung läuft, aber keine Aktivität seit 12 Monaten | automatisch erkannt |
| `BEENDET` | Vereinbarung gekündigt oder ausgelaufen | mit Beendigungsgrund |
| `VERLOREN` | Anbahnung gescheitert | mit Verlustgrund |

**`PARTNER_AKTIV` ohne unterzeichnetes Dokument ist technisch nicht setzbar.**
Das ist dieselbe Regel wie beim Portalzugang: Ein aktiver Partner ohne Papier
ist im Streitfall kein Partner, trägt aber Provisionsansprüche und Datenzugriff.

---

## 3. Übergangsmatrix

| von \ nach | ZU_PRUEFEN | KONTAKTIERT | TERMIN | ANGEBOT | VERHANDL. | PARTNER_AKTIV | RUHEND | VERLOREN | BEENDET |
|---|---|---|---|---|---|---|---|---|---|
| **NEU** | ✓ | ✓ | — | — | — | — | — | ✓ | — |
| **ZU_PRUEFEN** | — | ✓ | — | — | — | — | — | ✓ | — |
| **KONTAKTIERT** | ✓ | — | ✓ | ✓ | — | — | — | ✓ | — |
| **TERMIN** | — | ✓ | — | ✓ | — | — | — | ✓ | — |
| **ANGEBOT** | — | — | ✓ | — | ✓ | ✓ | — | ✓ | — |
| **VERHANDLUNG** | — | — | ✓ | ✓ | — | ✓ | — | ✓ | — |
| **PARTNER_AKTIV** | — | — | — | — | — | — | ✓ | — | ✓ |
| **PARTNER_RUHEND** | — | ✓ | — | — | — | ✓ | — | — | ✓ |
| **VERLOREN** | — | ✓ | — | — | — | — | — | — | — |
| **BEENDET** | — | ✓ | — | — | — | — | — | — | — |

### Fünf Regeln hinter der Matrix

**V1 — Kein Sprung über den Erstkontakt.** Von `NEU` führt kein Weg nach
`ANGEBOT`. Wer eine Kooperation anbietet, ohne gesprochen zu haben, bietet ins
Leere.

**V2 — In den Bestand nur über Angebot oder Verhandlung.** `PARTNER_AKTIV` ist
von genau zwei Zuständen aus erreichbar, und beide setzen voraus, dass etwas
Schriftliches vorlag.

**V3 — Rückschritte sind erlaubt und werden gezählt.** Drei Rückschritte in einem
Vorgang sind ein Warnsignal, kein Fehler.

**V4 — `PARTNER_RUHEND` ist keine Sackgasse.** Der Weg zurück nach
`PARTNER_AKTIV` steht offen; der Weg nach `KONTAKTIERT` ebenfalls, wenn die
Beziehung neu aufgebaut wird.

**V5 — Aus `BEENDET` und `VERLOREN` führt genau ein Weg zurück: `KONTAKTIERT`,
mit Begründung.** Ein neuer Anlauf ist ein neuer Vorgang; der alte bleibt
sichtbar. So bleibt erkennbar, dass es der zweite Versuch ist.

---

## 4. Pflichtangaben an den Übergängen

| Übergang | Pflicht |
|---|---|
| → `ZU_PRUEFEN` | Was zu klären ist, in einem Satz |
| → `KONTAKTIERT` | Aktivität mit Kanal, Datum, Ergebnis |
| → `TERMIN` | Datum, Ort oder Form, Teilnehmer |
| → `ANGEBOT` | Was angeboten wurde, Frist |
| → `PARTNER_AKTIV` | **`KOOPERATION` mit `dokument_id`** + benannter Betreuer |
| → `PARTNER_RUHEND` | Automatisch; keine Eingabe, aber eine Aufgabe |
| → `BEENDET` | Beendigungsgrund aus der Liste |
| → `VERLOREN` | Verlustgrund aus der Liste |

---

## 5. Verlust- und Beendigungsgründe

| Grund | Wiedervorlage | Bemerkung |
|---|---|---|
| `WETTBEWERB` | 12 Monate | **Wettbewerber wird erfasst** — die wichtigste Einzelinformation |
| `KEIN_BEDARF` | 18 Monate | |
| `KEINE_ENTSCHEIDUNG` | 6 Monate | Häufigster Fall bei inhabergeführten Betrieben |
| `KONDITIONEN` | 12 Monate | Fließt in die Verhandlung mit dem Versicherer ein |
| `NICHT_ERREICHT` | **kein Verlust** | Zurück in die Anreicherung |
| `BETRIEBSAUFGABE` | — | Organisation auf `BEENDET` |
| `KEINE_UMSAETZE` | 12 Monate | Beendigung einer aktiven Kooperation ohne Vermittlung |
| `UNZUFRIEDEN` | 24 Monate | **Immer mit Freitext.** Die teuerste Zeile im ganzen Modul |

**`UNZUFRIEDEN` ist die einzige Zeile mit Freitextpflicht.** Ein Partner, der
geht, weil etwas schieflief, ist die wertvollste Rückmeldung, die dieses System
je bekommt — und die einzige, die sich nicht in eine Auswahlliste pressen lässt.

---

## 6. Wer darf was

| Übergang | Rolle |
|---|---|
| Alle bis `VERHANDLUNG` | `VERTRIEB`, `INNENDIENST` |
| → `PARTNER_AKTIV` | **Freigabe erforderlich** — wirtschaftlich bindend |
| → `BEENDET` | `VERTRIEB` mit Freigabe |
| → `VERLOREN` | `VERTRIEB`, `INNENDIENST` |
| Wiederaufnahme | `VERTRIEB` |
| Rückwirkende Korrektur | **niemand** — korrigiert wird durch einen neuen Wechsel mit Begründung |

Bei zwei Personen greift die Alleinfreigabe aus
[`02_CORE_CRM/13_STARTKONFIGURATION.md`](../02_CORE_CRM/13_STARTKONFIGURATION.md)
§4.5: möglich, mit Pflichtbegründung, Auditeintrag und monatlichem Bericht.

---

## 7. Was der Prozess über den Bestand aussagt

Drei Auswertungen, die erst durch die Trennung von Anbahnung und Bestand möglich
werden:

| Frage | Auswertung |
|---|---|
| Wie gut gewinnen wir Händler? | `PARTNER_AKTIV` ÷ (`PARTNER_AKTIV` + `VERLOREN`), **ohne `NICHT_ERREICHT`** |
| Wie gut halten wir sie? | Anteil `PARTNER_RUHEND` und `BEENDET` am Bestand |
| Wo bleibt es liegen? | Verweildauer je Anbahnungszustand |

Die zweite Zeile ist die wichtigere und wird meist nicht gemessen. **Einen
Partner zu verlieren kostet mehr, als einen zu gewinnen einbringt** — und
`PARTNER_RUHEND` ist die Vorstufe, die man noch sieht.
