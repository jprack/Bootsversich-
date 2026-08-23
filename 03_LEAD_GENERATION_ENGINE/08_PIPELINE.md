# 08 — Vertriebspipeline

---

## 1. Zehn Zustände, zwei Endzustände, ein Sonderfall

Der Auftrag nennt: Neu · Zu prüfen · Kontaktiert · Termin · Angebot ·
Verhandlung · Gewonnen · Verloren · Partner · Kunde.

Beim Ordnen fällt auf: **„Partner" und „Kunde" sind keine Pipelinezustände.** Sie
beschreiben, *was jemand für uns ist*, nicht *wie weit ein Geschäft ist*. Eine
Organisation kann gleichzeitig Partner und Kunde sein — als Pipelinestatus wäre
das nicht darstellbar.

Die Auflösung, die dem Datenmodell des CRM entspricht:

| Zustand | Wo er lebt |
|---|---|
| Neu … Gewonnen / Verloren | **Pipeline** — der Weg |
| Partner, Kunde | **Organisationsrolle bzw. Kundendatensatz** — das Ergebnis |

`GEWONNEN` ist also der Pipelineabschluss. Ob daraus ein Partner (Vereinbarung),
ein Kunde (eigener Vertrag) oder beides wird, entscheidet, welcher Datensatz im
CRM entsteht. Die beiden Zustände bleiben im Modell erhalten — als
**Ergebnisart** am gewonnenen Vorgang, damit die Auswertung des Auftrags weiter
möglich ist.

---

## 2. Die acht Wegzustände

| Nr. | Status | Bedeutung | Verantwortung |
|---|---|---|---|
| 1 | `NEU` | Freigegeben, Aufgabe erzeugt, noch nicht angefasst | Vertrieb |
| 2 | `ZU_PRUEFEN` | Vor dem Erstkontakt ist etwas zu klären: Ansprechpartner, Zuständigkeit, Sperrlage | Innendienst |
| 3 | `KONTAKTIERT` | Erstansprache erfolgt, Reaktion offen | Vertrieb |
| 4 | `TERMIN` | Gespräch vereinbart oder geführt | Vertrieb |
| 5 | `ANGEBOT` | Etwas Konkretes liegt vor: Vereinbarung, Deckungsangebot, Konditionen | Vertrieb |
| 6 | `VERHANDLUNG` | Über Inhalt oder Konditionen wird gesprochen | Vertrieb |
| 7 | `GEWONNEN` | Unterschrift, Vereinbarung oder Antrag liegt vor | Vertrieb, Freigabe nötig |
| 8 | `VERLOREN` | Kein Geschäft, mit Grund | Vertrieb |

**`ZU_PRUEFEN` ist nicht die Prüfliste des Rechercheraums.** Jene entscheidet, ob
ein Objekt überhaupt ins CRM darf; dieser Status heißt: Es ist im CRM, aber noch
nicht ansprechbereit. Zwei verschiedene Rückstaus, die getrennt sichtbar sein
müssen — sonst weiß niemand, ob es an der Datenlage oder an der Vorbereitung
hängt.

---

## 3. Übergangsmatrix

Erlaubte Übergänge. Alles nicht Genannte ist gesperrt.

| von \ nach | ZU_PRUEFEN | KONTAKTIERT | TERMIN | ANGEBOT | VERHANDLUNG | GEWONNEN | VERLOREN |
|---|---|---|---|---|---|---|---|
| **NEU** | ✓ | ✓ | — | — | — | — | ✓ |
| **ZU_PRUEFEN** | — | ✓ | — | — | — | — | ✓ |
| **KONTAKTIERT** | ✓ | — | ✓ | ✓ | — | — | ✓ |
| **TERMIN** | — | ✓ | — | ✓ | — | — | ✓ |
| **ANGEBOT** | — | — | ✓ | — | ✓ | ✓ | ✓ |
| **VERHANDLUNG** | — | — | ✓ | ✓ | — | ✓ | ✓ |
| **GEWONNEN** | — | — | — | — | — | — | — |
| **VERLOREN** | — | ✓ | — | — | — | — | — |

### Die vier Regeln hinter der Matrix

**R1 — Kein Sprung über den Erstkontakt.** Von `NEU` führt kein Weg nach
`ANGEBOT`. Wer ein Angebot legt, ohne gesprochen zu haben, legt es ins Leere.

**R2 — Rückschritte sind erlaubt und werden gezählt.** `ANGEBOT` → `TERMIN` ist
normal: Es muss nochmal geredet werden. Was zählt, ist die **Zahl** der
Rückschritte je Vorgang — drei davon sind ein Warnsignal, kein Fehler.

**R3 — `GEWONNEN` ist endgültig.** Was danach kommt — Kündigung, Wechsel,
Auslaufen — ist Bestandsführung im CRM, nicht Pipeline. Ein gewonnener Vorgang,
der später wieder aufgemacht wird, macht jede Conversionrate wertlos.

**R4 — `VERLOREN` ist wiederbelebbar, aber nur bewusst.** Der einzige Weg zurück
führt nach `KONTAKTIERT`, verlangt eine Begründung und setzt einen neuen
Vorgang auf denselben Partner. Der verlorene Vorgang bleibt bestehen. So bleibt
sichtbar, dass es der zweite Anlauf ist.

---

## 4. Pflichtangaben an den Übergängen

| Übergang | Pflicht | Warum |
|---|---|---|
| → `KONTAKTIERT` | Aktivität mit Kanal, Datum, Ergebnis | Ohne dokumentierten Kontakt ist es kein Kontakt |
| → `TERMIN` | Datum, Ort oder Form, Teilnehmer | Grundlage der Wiedervorlage |
| → `ANGEBOT` | Was angeboten wurde, Frist | Ohne Frist kein Nachfassen |
| → `GEWONNEN` | **Ergebnisart** (`PARTNER`, `KUNDE`, `BEIDES`) + Beleg | §1 |
| → `VERLOREN` | **Grund aus der Liste**, Freitext optional | §5 |

---

## 5. Verlustgründe — die Liste, die den Motor verbessert

| Grund | Folge |
|---|---|
| `KEIN_INTERESSE` | Sperrvermerk 24 Monate |
| `BESTEHENDE_BINDUNG` | Wiedervorlage zum genannten Ablaufdatum, sonst 12 Monate |
| `WETTBEWERB` | Wiedervorlage 12 Monate, Wettbewerber wird erfasst |
| `KEINE_ENTSCHEIDUNG` | Wiedervorlage 6 Monate — der häufigste Fall bei Vereinen |
| `NICHT_ERREICHT` | **Zurück in die Anreicherung**, nicht verloren |
| `AUFGELOEST` | Objekt und Organisation auf beendet, Grundgesamtheit sinkt |
| `AUSSERHALB_ZIELGRUPPE` | Rückmeldung an das Scoringmodell — **B1 oder die Untergruppe war falsch** |
| `SONSTIGES` | Freitext **Pflicht** |

Die letzten beiden Zeilen sind die wertvollsten. `AUSSERHALB_ZIELGRUPPE` ist die
einzige Rückmeldung, die die Recherche selbst korrigiert; häufen sich diese
Fälle bei einer Quelle, ist die Quelle falsch eingestuft — nicht der Vertrieb
schlecht.

`NICHT_ERREICHT` ist kein Verlust. Wird es als Verlust gebucht, sinkt die
Abdeckung, obwohl niemand mit dem Ziel gesprochen hat.

---

## 6. Fristen je Zustand

| Status | Höchstverweildauer | Danach |
|---|---|---|
| `NEU` | 10 Arbeitstage (Klasse A: 5) | Eskalation, Aufgabe steigt in der Priorität |
| `ZU_PRUEFEN` | 15 Arbeitstage | Aufgabe an den Innendienst |
| `KONTAKTIERT` | 21 Tage ohne Reaktion | Zweitansprache, danach `VERLOREN`/`NICHT_ERREICHT` |
| `TERMIN` | Terminzeitpunkt + 5 Tage | Nachbereitung fällig |
| `ANGEBOT` | Angebotsfrist + 3 Tage | Nachfassen |
| `VERHANDLUNG` | 60 Tage | Klärungsaufgabe: Wer entscheidet, bis wann? |

**Ausnahme Z3.** Vereine entscheiden im Sitzungsrhythmus. Für Cluster Z3 gelten
die Fristen ab der nächsten Vorstandssitzung, nicht ab dem Kontakt — sonst
erzeugt das System monatlich Aufgaben für einen Vorgang, der planmäßig ruht. Das
Sitzungsdatum ist deshalb Pflichtfeld im Rollenprofil `CLUB`.

---

## 7. Wer darf was

| Übergang | Rolle |
|---|---|
| Alle bis `VERHANDLUNG` | `VERTRIEB`, `INNENDIENST` |
| → `GEWONNEN` mit Ergebnisart `PARTNER` | **Freigabe erforderlich** — wirtschaftlich bindend |
| → `GEWONNEN` mit Ergebnisart `KUNDE` | Wie jeder Antrag: Freigaberegel des Kern-CRM |
| → `VERLOREN` | `VERTRIEB`, `INNENDIENST` |
| Wiederbelebung aus `VERLOREN` | `VERTRIEB` |
| Statuskorrektur rückwirkend | **Niemand.** Ein Statuswechsel wird korrigiert durch einen neuen Wechsel mit Begründung, nicht durch Überschreiben |

Bei zwei Personen greift die Alleinfreigabe aus
[`02_CORE_CRM/13_STARTKONFIGURATION.md`](../02_CORE_CRM/13_STARTKONFIGURATION.md)
§4.5: möglich, aber mit Pflichtbegründung, Auditeintrag und monatlichem Bericht.
