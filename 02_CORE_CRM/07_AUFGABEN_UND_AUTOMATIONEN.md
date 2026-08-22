# 07 — Aufgabenmanagement und Automationen

## Teil A — Aufgabenmanagement

### 1. Warum Aufgaben und nicht Erinnerungen

Ein Kalendereintrag erinnert. Eine Aufgabe **verpflichtet, ist zuweisbar,
eskaliert und wird ausgewertet**. Der Unterschied entscheidet, ob ein
Verlängerungsvorgang bearbeitet wird oder in der Urlaubsvertretung untergeht.

Jede Aufgabe beantwortet vier Fragen: **Was** ist zu tun, **wer** tut es,
**bis wann**, und **warum gibt es sie** (`regel_code`).

### 2. Herkunft

| Herkunft | Anteil (Erwartung) | Beispiel |
|---|---|---|
| **Automatisch aus einer Regel** | ~70 % | Hauptfälligkeit in 90 Tagen |
| Aus einer Aktivität | ~20 % | „Kunde bittet um Rückruf nächste Woche" |
| Manuell angelegt | ~10 % | Was der Vertrieb selbst plant |

Der hohe Automatikanteil ist Absicht. Ein CRM, in dem Menschen sich selbst
merken müssen, wann eine Frist läuft, ist eine Adressdatenbank.

### 3. Der Dublettenschlüssel — die wichtigste Bedingung des Moduls

```
dublettenschluessel = <regel_code>:<bezug_typ>:<bezug_id>:<periode>

Beispiele
  A-21:vertrag:8f3c…:2026-04-01     Verlängerung, je Hauptfälligkeit einmal
  A-31:kunde:2a91…:2026            Geburtstag, je Jahr einmal
  A-40:boot:cc17…:                 Cross-Selling, je Boot genau einmal
  A-12:vorgang:71bd…:v3            Angebotsnachfassung, je Angebotsversion
```

`UNIQUE` auf der Spalte. Ein zweimal laufender Nachtjob, ein wiederholtes
Ereignis oder ein Wiederanlauf nach Störung erzeugen **keine zweite Aufgabe**.

Die `periode` im Schlüssel entscheidet über die Wiederholbarkeit: Ein Geburtstag
kommt jedes Jahr, eine Cross-Selling-Prüfung je Boot nur einmal.

### 4. Priorisierung

Die Tagesliste wird nicht nach Fälligkeit sortiert, sondern nach einem Score aus
`01_CRM_ENGINE`. Sonst arbeitet der Vertrieb chronologisch statt wirksam.

```
score = f( prioritaet, ueberfaelligkeit, customer_value_score,
           risk_score, wirtschaftlicher_wert, eskalationsstufe )
```

Jede Aufgabe zeigt neben dem Score **warum** sie oben steht — „Kunde mit hohem
Wert, Frist überschritten, 14.280 € Vertragsvolumen". Ohne Begründung wird die
Reihenfolge ignoriert.

### 5. Eskalation

| Stufe | Auslöser | Wirkung |
|---|---|---|
| 0 | Aufgabe entsteht | Zuständiger sieht sie in der Tagesliste |
| 1 | Fälligkeit überschritten | Priorität steigt, Hinweis im Dashboard |
| 2 | Nach der halben Kulanzfrist | Zusätzlich an den Team-Eingang |
| 3 | Kulanzfrist abgelaufen | Zuweisung an die Führungskraft, Ereignis `aufgabe.eskaliert` |

Die Kulanzfrist steht an der Regel, nicht global. Eine Kündigungsfrist eskaliert
schneller als ein Geburtstagsgruß.

### 6. Wiedervorlage

Verschieben löscht nicht. Die Aufgabe wird auf `WARTET` gesetzt, eine neue
entsteht mit `wiedervorlage_von_id`. Damit bleibt sichtbar, **wie oft** etwas
verschoben wurde — eine dreimal verschobene Aufgabe ist ein eigenes Signal.

### 7. Lastschutz

Aus `01_CRM_ENGINE` übernommen und im Lasttest belegt:

| Mechanismus | Wirkung |
|---|---|
| **Bündelung** | Gleichartige Aufgaben zum selben Kunden werden zu einer Sammelaufgabe |
| **Staffelung** | Höchstens 25 fällige Aufgaben je Benutzer und Tag; der Rest rückt nach |
| **Kapazitätswarnung** | Übersteigt der Rückstau die Kapazität dauerhaft, entsteht eine Warnung an die Führung statt weiterer Aufgaben |

Ohne Lastschutz erzeugt der erste Verlängerungslauf über den vollen Bestand
mehrere tausend Aufgaben an einem Tag — und das System wird ignoriert.

---

## Teil B — Automationen

### 8. Automationen sind Daten

Jede Regel liegt als Datensatz in `AUTOMATISIERUNGSREGEL`, gepflegt vom
Innendienst, freigegeben von der Administration. Kein Entwickler wird gebraucht,
um eine Frist von 90 auf 75 Tage zu ändern.

```
AUSLÖSER ──▶ BEDINGUNG ──▶ UNTERDRÜCKUNGSPRÜFUNG ──▶ AKTION ──▶ PROTOKOLL
Ereignis     Merkmale       fünf Prüfungen            Aufgabe    REGEL-
Zeitpunkt                   (siehe §10)               Nachricht  AUSLOESUNG
Frist                                                 Statuswechsel
Schwellwert                                           Eskalation
```

### 9. Regelkatalog

Fortführung der Nummerierung aus `01_CRM_ENGINE`.

#### Lead und Neugeschäft

| Code | Auslöser | Bedingung | Aktion | Frist |
|---|---|---|---|---|
| `A-01` | `lead.eingegangen` | — | Aufgabe **Erstkontakt** an Betreuer | Score ≥ 70: 2 h · sonst nächster Werktag |
| `A-02` | `lead.eingegangen` | Vergleichsschlüssel trifft vorhandenen Kontakt | Aufgabe **Dublette prüfen** — nie automatisch zusammenführen | 1 Werktag |
| `A-03` | `lead.eingegangen` | `quelle = HAENDLER \| CLUB` | Bestätigung an den empfehlenden Partner | sofort |
| `A-04` | Frist | Lead `NEU`, Erstkontaktfrist überschritten | Eskalation Stufe 1, Hinweis im Dashboard | — |
| `A-05` | Frist | Lead `IN_BEARBEITUNG`, 14 Tage ohne Aktivität | Aufgabe **Lead klären oder schließen** | — |
| `A-06` | `lead.eingegangen` | Bootsart nicht versicherbar | Aufgabe **freundlich absagen**, Vorschlagstext | 1 Werktag |
| `A-07` | `lead.eingegangen` | Anfragepflichtiges Merkmal erkannt | Aufgabe **manuelle Prüfung**, kein automatisches Angebot | 1 Werktag |

#### Angebot und Abschluss

| Code | Auslöser | Bedingung | Aktion | Frist |
|---|---|---|---|---|
| `A-10` | Frist | Angebotsanfrage an Versicherer ohne Antwort nach Zusagezeit | Aufgabe **beim Träger nachfassen** | je Träger |
| `A-11` | Frist | Angebot versendet, 3 Kalendertage ohne Reaktion | Erinnerung an den Kunden | T+3 |
| `A-12` | Frist | Angebot versendet, 7 Tage ohne Reaktion | Zweite Erinnerung | T+7 |
| `A-13` | Frist | 14 Tage ohne Reaktion | Aufgabe **persönlich nachfassen** | T+14 |
| `A-14` | Frist | 21 Tage ohne Reaktion | Aufgabe **Abschluss- oder Abbruchentscheidung** | T+21 |
| `A-15` | Frist | Angebot läuft in 5 Tagen ab | Aufgabe **Gültigkeit klärt sich**, Priorität `HOCH` | — |
| `A-16` | `angebot.eingegangen` | Mehr als ein Angebot vorliegend | Aufgabe **Vergleich und begründete Auswahl** | 2 Werktage |
| `A-17` | `pruefung.befund` | Prüfergebnis `WARNUNG`, `FEHLER` oder `UNBEKANNT` | Aufgabe **manuelle Prüfung** mit Regelverweis | 1 Werktag |
| `A-18` | `vorgang.unterlagen_unvollstaendig` | — | Aufgabe **Unterlagen anfordern**, Portalnachricht an den Kunden | 2 Werktage |

#### Onboarding und Bestandspflege

| Code | Auslöser | Bedingung | Aktion | Frist |
|---|---|---|---|---|
| `A-20` | `vertrag.aktiviert` | Erster Vertrag des Kunden | **Onboarding-Strecke**: Willkommensnachricht, Portalzugang, Aufgabe Erstgespräch nach 14 Tagen | mehrstufig |
| `A-21` | Frist | Hauptfälligkeit in 90 Tagen, Vertrag `AKTIV` | Verlängerungsvorgang anlegen; bei Wert ≥ 70 oder Risiko ≥ 60 zusätzlich Aufgabe **persönliche Ansprache** | T-90 |
| `A-22` | Frist | Verlängerungsvorgang offen | Kundenansprache mit Angebot | T-60 |
| `A-23` | Frist | Keine Reaktion, Kündigungsfrist naht | Eskalation Stufe 1 | T-45 |
| `A-24` | Frist | Keine Reaktion | Aufgabe `DRINGEND` an den Betreuer | T-14 |
| `A-25` | `vertrag.gekuendigt` | — | Aufgabe **Rückgewinnungsgespräch**, Kündigungsgrund erfassen | 3 Werktage |
| `A-26` | Frist | 30 Tage nach Kündigung | Aufgabe **Rückgewinnungsansprache** | T+30 |
| `A-27` | `praemie.verzug` | Zahlung 14 Tage überfällig | Aufgabe **Zahlung klären**, Risiko erhöhen | — |
| `A-28` | Frist | Bestandsprüfung vor Hauptfälligkeit | Interne Prüfaufgabe: Zeitwert, Nutzung, Revier, Eigentum | T-120 |

#### Beziehungspflege

| Code | Auslöser | Bedingung | Aktion | Frist |
|---|---|---|---|---|
| `A-30` | Zeitpunkt | Geburtstag des Versicherungsnehmers | Glückwunsch — **Kanal je Kundenwert**: Score ≥ 80 persönlicher Anruf, sonst Nachricht | am Tag |
| `A-31` | Zeitpunkt | Kundenjubiläum (5, 10, 15, 20 Jahre) | Aufgabe **Jubiläumsansprache** mit Vorschlag | 5 Tage vorher |
| `A-32` | Frist | Bestandskunde ohne Aktivität seit 270 Tagen | Aufgabe **Bestandskundenkontakt** — Stille ist der stärkste Vorbote der Kündigung | — |
| `A-33` | Zeitpunkt | Saisonbeginn im Revier des Kunden | Serviceerinnerung, Deckungsprüfung | jährlich |
| `A-34` | `signal.mehrfach_geklickt` | Drei Klicks auf dasselbe Produkt binnen 14 Tagen | Aufgabe **Kaufsignal — anrufen** | 2 Werktage |
| `A-35` | `kunde.risiko_erhoeht` | `risk_score` steigt um ≥ 15 Punkte | Aufgabe **Risikogespräch**, Priorität nach Kundenwert | 5 Werktage |

#### Boot und Cross-Selling

| Code | Auslöser | Bedingung | Aktion | Frist |
|---|---|---|---|---|
| `A-40` | `boot.erfasst` | Kein aktiver Vertrag für dieses Objekt und diese Sparte | Aufgabe **Cross-Selling prüfen** | 5 Werktage |
| `A-41` | `boot.veraeussert` | — | Aufgabe **Nachfolgeboot?** `HOCH`; Vertragsobjekt beenden; Risiko erhöhen | 3 Werktage |
| `A-42` | `boot.wert_geaendert` | Abweichung zur Versicherungssumme > 15 % | Aufgabe **Versicherungssumme anpassen** | 10 Werktage |
| `A-43` | Frist | `zeitwert_stichtag` älter als 24 Monate | Aufgabe **Zeitwert aktualisieren** | jährlich |
| `A-44` | `vertrag.geaendert` | Vertrag deckt kein aktives Objekt mehr | Aufgabe **Vertrag ohne Objekt klären**, `DRINGEND` | sofort |

#### Datenqualität und Nachweis

| Code | Auslöser | Bedingung | Aktion | Frist |
|---|---|---|---|---|
| `A-45` | Frist | Kontakt ohne verifizierte E-Mail, aber mit aktivem Vertrag | Aufgabe **Kontaktdaten prüfen** | monatlich |
| `A-46` | `einwilligung.widerrufen` | — | Kommunikationssperre sofort systemweit, Bestätigung an den Kunden | sofort |
| `A-47` | Frist | Dokument erreicht das Löschdatum | Aufgabe **Aufbewahrung prüfen**, dann Löschlauf | — |
| `A-48` | `dokument.scan_befallen` | — | Quarantäne, Alarm, Aufgabe `DRINGEND`, Absender informieren | sofort |
| `A-49` | Schwellwert | Offene Aufgaben je Benutzer über Kapazität | **Kapazitätswarnung** an die Führung statt weiterer Aufgaben | täglich |

#### Partner

| Code | Auslöser | Bedingung | Aktion | Frist |
|---|---|---|---|---|
| `A-50` | `lead.status_geaendert` | Lead stammt von einem Partner | Statusaktualisierung im Hub des Partners | sofort |
| `A-51` | `vertrag.aktiviert` | Vermittler ist eine Partnerorganisation | Provisionsposition erzeugen, Hinweis im Hub | sofort |
| `A-52` | Frist | Partnerauftrag ohne Rückmeldung nach Zusagezeit | Aufgabe **beim Partner nachfassen** | je Vereinbarung |
| `A-53` | Frist | Partner ohne Empfehlung seit 180 Tagen | Aufgabe **Partnerkontakt** — ein schlafender Partner ist ein verlorener Kanal | halbjährlich |

### 10. Die fünf Prüfungen vor jeder Kundenansprache

Vor **jeder** kundengerichteten Aktion, ohne Ausnahme:

```
1. Ist der Vorgang noch offen?              nein → VORGANG_GESCHLOSSEN
2. Ist das Angebot noch gültig?             nein → ANGEBOT_ABGELAUFEN
3. Hat der Kunde bereits reagiert?           ja  → BEREITS_ERLEDIGT
4. Ist die Kommunikation zulässig?          nein → KOMMUNIKATION_UNZULAESSIG
      Einwilligung · Widerruf · Kontaktsperre · Bounce · Frequenzgrenze
5. Wurde für diesen Schritt schon gesendet?  ja  → BEREITS_GESENDET
```

Greift eine Prüfung, wird **nicht** gesendet — und der Grund wird in
`REGELAUSLOESUNG.unterdrueckungsgrund` protokolliert. Der unterdrückte Versand
ist genauso nachweispflichtig wie der ausgeführte: Nur so ist belegbar, dass ein
Widerruf beachtet wurde.

> Eine doppelte Mahnung an einen bereits verlängerten Kunden beschädigt die
> Beziehung mehr, als die Erinnerung nützt.

### 11. Was Automationen nicht dürfen

| Verboten | Grund |
|---|---|
| Einen Kunden automatisch ablehnen | Nachteilige Entscheidung ohne Menschen |
| Einen Vertrag automatisch kündigen oder verlängern | Wirtschaftlich bindend |
| Personendaten ohne Rechtsgrundlage übermitteln | Prüfung 4 ist nicht übersteuerbar |
| Kontakte automatisch zusammenführen | Praktisch nicht rückgängig zu machen |
| Kundenkommunikation ohne menschliche Freigabe versenden, wenn sie ein Angebot enthält | Wirtschaftlich bindend |
| Eine Aufgabe automatisch schließen, weil die Frist abgelaufen ist | Dann verschwindet genau das, was Aufmerksamkeit braucht |

### 12. Pflege und Kontrolle

| Frage | Antwort |
|---|---|
| Wer legt Regeln an? | Innendienst als Entwurf |
| Wer aktiviert sie? | Administration — **Vier-Augen-Prinzip** |
| Wie wird geprüft, ob eine Regel wirkt? | Auslösungen, Erledigungsquote und Wirkung je Regel im Reporting |
| Was passiert mit einer Regel, die nichts bewirkt? | Sie wird abgeschaltet. Eine Regel, deren Aufgaben regelmäßig ohne Ergebnis geschlossen werden, erzeugt Rauschen und untergräbt das Vertrauen in alle anderen |
| Wie werden Regeln getestet? | Trockenlauf gegen den echten Bestand: Wie viele Aufgaben entstünden, für wen? **Vor** der Aktivierung |

Der Trockenlauf ist die wichtigste Zeile dieser Tabelle. Eine Regel mit einer
falsch gesetzten Bedingung erzeugt sonst am ersten Tag viertausend Aufgaben —
und danach glaubt niemand mehr an das System.
