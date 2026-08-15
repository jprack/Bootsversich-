# 5. Opportunity Modell

## 5.1 Definition und Abgrenzung

Eine Opportunity ist eine **bewertete, terminierte, verantwortete Verkaufschance**.

Eine Opportunity existiert nur, wenn alle vier Angaben vorliegen:
**Wert** (EUR Jahresprämie) · **Wahrscheinlichkeit** · **erwartetes Abschlussdatum** ·
**Verantwortlicher**. Fehlt eines, ist es ein Lead, keine Opportunity.

> **Systemregel O-1:** Jede offene Opportunity hat zu jedem Zeitpunkt genau eine
> offene Aufgabe („nächster Schritt"). Eine Opportunity ohne offene Aufgabe ist ein
> Datenfehler und wird im Dashboard rot markiert sowie nächtlich reklamiert (A-14).

## 5.2 Felder

### 5.2.1 Pflichtfelder
| Feld | Typ | Bemerkung |
|---|---|---|
| `name` | Text | Konvention: `<Kunde> — <Produkt> — <Objekt>`, z. B. „Kramer — Kasko — Bavaria 46" |
| `kunde_id` / `kontakt_id` | uuid | Mindestens eines; Kunde bei Bestand, Kontakt bei Neugeschäft |
| `wert_eur` | numeric(14,2) | **Jahresprämie**, nicht Versicherungssumme |
| `wahrscheinlichkeit` | int 0–100 | Aus Pipelinestufe × KI-Uplift, manuell übersteuerbar mit Begründung |
| `produktinteresse` | Text[] | Mehrfachauswahl aus Produktkatalog |
| `quelle_id` | uuid | FK `crm_lead_quelle` |
| `verantwortlicher_id` | uuid | Benutzer |
| `status` | Enum | siehe Pipeline |
| `erwartetes_abschlussdatum` | date | Basis für Forecast |

### 5.2.2 Fachfelder Boot & Versicherung
| Feld | Bemerkung |
|---|---|
| `boot_ref_id` | Bezug zum Objekt (Read-Model) |
| `versicherungssumme_eur` | Kaskowert / Deckungssumme |
| `deckungsumfang` | `haftpflicht`, `kasko`, `vollkasko`, `skipper`, `unfall`, `rechtsschutz`, `transport`, `charter`, `flotte`, `winterlager` |
| `selbstbehalt_eur` | Verhandlungsgegenstand |
| `fahrgebiet` | Deckungsgebiet |
| `wettbewerber` | Text |
| `wettbewerbspraemie_eur` | falls bekannt |
| `hauptfaelligkeit_ziel` | date — gewünschter Vertragsbeginn |
| `courtage_prozent` / `deckungsbeitrag_eur` | Wirtschaftlichkeit |

### 5.2.3 Steuerfelder
| Feld | Bemerkung |
|---|---|
| `pipeline_stufe` | siehe 5.3 |
| `stufe_seit` | timestamptz — Basis für Stillstandserkennung |
| `naechster_schritt` | Text + `naechster_schritt_am` |
| `verlustgrund` | Pflicht bei `verloren` |
| `verlust_an_wettbewerber` | Text |
| `gewinngrund` | Pflicht bei `gewonnen` (Lernsignal!) |
| `kampagne_id` | Marketingbezug |
| `risiko_flags` | jsonb: `{unterlagen_fehlen, vorschaden, alter_bootsmotor, sanktionspruefung}` |

## 5.3 Pipeline

| # | Stufe | Definition (Exit-Kriterium zum Weiterrücken) | Basiswahrscheinlichkeit | Max. Verweildauer |
|---|---|---|---|---|
| 1 | **Neu** | Chance erkannt und bewertet; Verantwortlicher gesetzt | 10 % | 3 Werktage |
| 2 | **In Bearbeitung** | Bedarfsanalyse durchgeführt, Unterlagen vollständig, Tarifierung möglich | 25 % | 10 Werktage |
| 3 | **Angebot** | Angebot erstellt, versendet, im CRM verknüpft | 50 % | 21 Tage |
| 4 | **Verhandlung** | Rückmeldung des Kunden liegt vor, Konditionen werden verhandelt | 75 % | 14 Tage |
| 5 | **Gewonnen** | Zusage/Antrag liegt vor | 100 % | – |
| 6 | **Verloren** | Absage, Ablauf oder Abbruch, Grund dokumentiert | 0 % | – |

**Zusatzstufe `pausiert`:** Kunde verschiebt (z. B. Bootskauf verzögert sich).
Setzt eine Wiedervorlage mit Pflichtdatum, entfernt die Opportunity aus dem
aktiven Forecast, hält sie aber sichtbar. Maximal 12 Monate, danach automatisch `verloren`
mit Grund `zeitablauf`.

### 5.3.1 Wahrscheinlichkeitsberechnung

```
p_final = clamp( p_stufe · f_ki · f_signal · f_zeit , 5 , 95 )
```

| Faktor | Wirkung |
|---|---|
| `f_ki` | 0,7–1,3 — Modellprognose relativ zur Stufenbasis |
| `f_signal` | +0,15 bei Angebotsöffnung (`S-MAIL-02/03`), +0,10 bei Terminwahrnehmung, −0,20 bei 3 erfolglosen Kontaktversuchen |
| `f_zeit` | −0,10 je begonnener Woche Überschreitung der max. Verweildauer |

`gewonnen`/`verloren` setzen p auf 100/0. Manuelle Übersteuerung ist erlaubt,
wird protokolliert und beim Modelltraining als Expertensignal berücksichtigt.

### 5.3.2 Stufenregeln
- Stufen dürfen **übersprungen** werden (z. B. Neu → Angebot bei Standardprodukt), aber nie rückwärts ohne Begründung.
- Jeder Stufenwechsel schreibt `crm_opportunity_stufen_historie` (Stufe, von, nach, Dauer, Benutzer, Grund).
- Rückwärtswechsel erzeugt Aufgabe „Ursache dokumentieren".

## 5.4 Verlust- und Gewinngründe (geschlossene Kataloge)

### Verlustgründe
`preis` · `wettbewerbsangebot` · `bedingungen_deckung` · `selbstbehalt` ·
`kein_bedarf_mehr` · `boot_nicht_gekauft` · `boot_verkauft` · `zeitlich_verschoben` ·
`nicht_erreichbar` · `risiko_nicht_zeichenbar` · `unterlagen_fehlend` ·
`bestandsschutz_beim_wettbewerber` · `interne_kapazitaet` · `zeitablauf` · `sonstiges`

> `preis` und `wettbewerbsangebot` sind **immer** mit `wettbewerber` und
> `wettbewerbspraemie_eur` zu ergänzen — sonst ist der Verlust nicht auswertbar.

### Gewinngründe
`beratungsqualitaet` · `preis` · `deckungsumfang` · `schnelligkeit` ·
`empfehlung_vertrauen` · `bestandskundenbindung` · `partnerbeziehung` ·
`spezialloesung` · `service_schaden` · `sonstiges`

> Gewinngründe sind ebenso wichtig wie Verlustgründe. Sie erklären, *warum* das
> Unternehmen gewinnt, und steuern Argumentation und Marketing.

## 5.5 Cross-/Upsell-Engine (Next Best Offer)

Für jeden Bestandskunden wird nächtlich geprüft, welches Produkt **fehlt**,
aber zum Profil passt.

| Regel | Bedingung | Vorschlag | Ø Trefferquote (Zielwert) |
|---|---|---|---|
| `NBO-01` | Kaskoversicherung vorhanden, keine Skipper-Haftpflicht | Skipper-Haftpflicht | 40 % |
| `NBO-02` | Boot ≥ 12 m, keine Rechtsschutzdeckung | Wassersport-Rechtsschutz | 25 % |
| `NBO-03` | Fahrgebiet Mittelmeer, keine erweiterte Deckung | Fahrgebietserweiterung | 55 % |
| `NBO-04` | Winterlager gemeldet, kein Landdeckungseinschluss | Winterlagerdeckung | 35 % |
| `NBO-05` | Bootswert seit > 24 Monaten nicht geprüft | Wertüberprüfung / Anpassung | 60 % |
| `NBO-06` | Neues Boot im Profil ohne Vertrag | Neuversicherung | 70 % |
| `NBO-07` | Gewerbliche Nutzung erkannt, private Police | Umstellung Gewerbepolice | 50 % |
| `NBO-08` | ≥ 3 Boote, Einzelverträge | Flottenvertrag | 45 % |
| `NBO-09` | Trailer/Transport im Profil, keine Transportdeckung | Transportdeckung | 30 % |
| `NBO-10` | Crew/Charter erkannt, keine Unfalldeckung | Insassen-/Crew-Unfall | 28 % |

Vorschläge mit erwartetem Wert ≥ 200 EUR **oder** Trefferquote ≥ 40 % erzeugen
automatisch eine Opportunity in Stufe `Neu`. Alle übrigen erscheinen als Hinweis
im Kontextpanel der Kundenakte.

## 5.6 Forecast

| Sicht | Formel | Verwendung |
|---|---|---|
| **Pipeline (brutto)** | `Σ wert_eur` aller offenen Opportunities | Volumenüberblick |
| **Gewichteter Forecast** | `Σ (wert_eur · p_final)` | Standardsteuerung |
| **Commit** | Nur Stufe ≥ Verhandlung **und** `p_final ≥ 75` | Verbindliche Zusage an die Leitung |
| **Best Case** | Alle offenen mit `p_final ≥ 40` | Obergrenze |
| **Prognosegüte** | `1 − |forecast − ist| / ist` | Qualitätsmaß, Zielwert ≥ 85 % |

**Pipeline-Deckungsregel:** Der gewichtete Forecast des laufenden Quartals soll
≥ 100 % des Quartalsziels betragen; die Bruttopipeline ≥ 300 % (3× Coverage).
Unterschreitung erzeugt Aufgabe an die Vertriebsleitung „Pipeline-Aufbau erforderlich" (A-19).

## 5.7 Angebotsmodell

Ein Angebot ist ein eigenes Objekt (`crm_angebot`), nicht nur ein Statuswert —
denn eine Opportunity kann mehrere Angebotsvarianten haben.

| Feld | Bemerkung |
|---|---|
| `opportunity_id` | FK |
| `angebotsnummer` | fortlaufend, mandantenweit eindeutig |
| `variante` | `basis`, `komfort`, `premium` — Mehrvariantenstrategie erhöht Abschlussquote |
| `praemie_brutto_eur`, `praemie_netto_eur`, `selbstbehalt_eur` | Konditionen |
| `gueltig_bis` | Pflicht — steuert Nachfassstaffel |
| `versendet_am`, `versandkanal` | E-Mail, Post, persönlich |
| `dokument_ref_id` | Dokumentenmodul |
| `geoeffnet_am`, `oeffnungen_anzahl` | Trackingsignal |
| `status` | `entwurf`, `versendet`, `geoeffnet`, `in_verhandlung`, `angenommen`, `abgelehnt`, `abgelaufen` |
| `ablehnungsgrund` | Katalog wie Verlustgründe |

**Nachfassstaffel (A-11 bis A-13):**
T+3 Anruf (Pflichtaufgabe) → T+7 persönliche E-Mail → T+14 Anruf mit
Alternativvorschlag → T−3 vor Ablauf „Gültigkeit endet"-Kontakt →
T+1 nach Ablauf Statuswechsel `abgelaufen` + Wiedervorlage 90 Tage.
