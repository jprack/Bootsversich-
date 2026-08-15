# 6. Aktivitätenmodell

## 6.1 Grundsatz

> **Was nicht dokumentiert ist, ist nicht passiert.**
> Und: **Jede Aktivität endet mit einer Entscheidung über die nächste Aktivität.**

Der zweite Satz ist die eigentliche Innovation. Klassische CRM-Systeme speichern
Vergangenheit. Dieses System erzwingt beim Abschluss jeder Aktivität die Angabe
der Folgeaktion — und schließt damit die Lücke, durch die Leads verschwinden.

## 6.2 Pflichtstruktur jeder Aktivität

Jede Aktivität — ohne Ausnahme, unabhängig vom Typ — trägt:

| Feld | Typ | Pflicht | Bemerkung |
|---|---|---|---|
| `id` | uuid | ✅ | |
| `typ` | Enum | ✅ | siehe 6.3 |
| `richtung` | Enum | ✅ | `eingehend`, `ausgehend`, `intern` |
| `zeitstempel` | timestamptz | ✅ | Zeitpunkt des Geschehens (nicht der Erfassung) |
| `erfasst_am` | timestamptz | ✅ | Systemzeit |
| `dauer_minuten` | int | – | Pflicht bei Anruf/Termin/Meeting |
| `benutzer_id` | uuid | ✅ | Wer hat gehandelt |
| `kontakt_id` | uuid | ✅¹ | Bezug Person |
| `kunde_id` | uuid | ✅¹ | Bezug Kunde |
| `lead_id` | uuid | – | Bezug Lead |
| `opportunity_id` | uuid | – | Bezug Chance |
| `betreff` | Text | ✅ | max. 200 Zeichen |
| `inhalt` | Text | – | Freitext / Gesprächsnotiz |
| `ergebnis` | Enum | ✅ | siehe 6.4 |
| `ergebnis_notiz` | Text | – | Pflicht bei Ergebnis `negativ`, `einwand`, `absage` |
| `folgeaktion` | Enum | ✅ | siehe 6.5 |
| `folgeaktion_am` | timestamptz | ✅² | Pflicht wenn Folgeaktion ≠ `keine` |
| `erzeugte_aufgabe_id` | uuid | – | automatisch gesetzt |
| `stimmung` | Enum | – | `positiv`, `neutral`, `negativ` — speist Risk Score |
| `kanal_referenz` | Text | – | Outlook-MessageId, Telefonanlagen-CallId, Termin-Id |
| `automatisch_erzeugt` | bool | ✅ | Unterscheidung System vs. Mensch |
| `sichtbarkeit` | Enum | ✅ | `team`, `vertraulich` (nur Betreuer + Leitung) |

¹ Mindestens einer von `kontakt_id` / `kunde_id` ist Pflicht.
² Erzwungen auf UI- **und** API-Ebene (HTTP 422 bei Verstoß).

## 6.3 Aktivitätstypen

| Typ | Beschreibung | Zusatzpflichtfelder | Automatische Erfassung |
|---|---|---|---|
| `email` | E-Mail-Korrespondenz | – | Outlook/Graph-Sync (bidirektional) |
| `anruf` | Telefonat | `dauer_minuten`, `ergebnis` | Telefonanlage/CTI optional |
| `termin` | Vereinbarter Termin | `dauer_minuten`, `ort` | Outlook-Kalender-Sync |
| `meeting` | Persönliches/Online-Gespräch | `dauer_minuten`, `teilnehmer[]` | Teams/Outlook |
| `angebot` | Angebot erstellt/versendet | `angebot_id` | System |
| `follow_up` | Nachfassaktion | `bezug_aktivitaet_id` | System/Mensch |
| `dokument` | Dokument gesendet/erhalten | `dokument_ref_id` | Dokumentenmodul |
| `empfehlung` | Empfehlung ausgesprochen/erhalten | `empfehlung_id` | System/Mensch |
| `besuch` | Vor-Ort-Besuch (Marina, Werft, Messe) | `ort`, `dauer_minuten` | Mobile App mit Standortvorschlag |
| `notiz` | Interne Information | – | Mensch |
| `system` | Systemereignis (Score-Sprung, Stufenwechsel) | `system_ereignis` | System |
| `kampagne` | Kampagnenkontakt (Brevo) | `kampagne_id` | Brevo-Konnektor |
| `whatsapp` / `chat` | Messenger-Kontakt | – | Konnektor (nur mit Consent) |

## 6.4 Ergebniskatalog

| Ergebnis | Bedeutung | Systemwirkung |
|---|---|---|
| `erreicht_positiv` | Gespräch geführt, Interesse bestätigt | Score +, Wahrscheinlichkeit + |
| `erreicht_neutral` | Gespräch geführt, keine Tendenz | – |
| `erreicht_einwand` | Gespräch geführt, Einwand geäußert | Einwandkatalog, Folgeaufgabe Pflicht |
| `erreicht_absage` | Klare Absage | Verlustgrund abfragen, Opportunity-Prüfung |
| `nicht_erreicht` | Kein Kontakt zustande gekommen | Versuchszähler +1; ab 3 → Kanalwechsel-Aufgabe |
| `terminiert` | Termin vereinbart | Score +6, Aufgabe „Termin vorbereiten" |
| `versendet` | Ausgehende Kommunikation raus | Nachfassstaffel starten |
| `beantwortet` | Kunde hat geantwortet | Score +, Reaktionszeit messen |
| `keine_reaktion` | Frist verstrichen | Score −, Eskalationsstufe + |
| `abgeschlossen` | Vorgang beendet | – |

## 6.5 Folgeaktionskatalog (Pflichtfeld)

| Folgeaktion | Erzeugt automatisch |
|---|---|
| `anruf` | Aufgabe Typ Anruf mit Datum |
| `email` | Aufgabe Typ E-Mail (optional mit Vorlage) |
| `termin_vereinbaren` | Aufgabe + Outlook-Verfügbarkeitsvorschlag |
| `angebot_erstellen` | Aufgabe + Opportunity-Statuswechsel |
| `unterlagen_anfordern` | Aufgabe + Checkliste fehlender Unterlagen |
| `wiedervorlage` | Aufgabe Typ Wiedervorlage zum gewählten Datum |
| `an_kollegen_uebergeben` | Aufgabe beim Zielbenutzer + Benachrichtigung |
| `opportunity_schliessen` | Dialog Gewinn-/Verlustgrund |
| `nurturing` | Aufnahme in Brevo-Strecke, keine persönliche Aufgabe |
| `keine` | **Nur zulässig** bei Endzuständen: gewonnen, verloren, disqualifiziert, ehemaliger Kunde ohne Win-Back |

> **Systemregel A-1 (härteste Regel des Systems):**
> `folgeaktion = keine` ist bei einem aktiven Lead, einer offenen Opportunity oder
> einem Bestandskunden mit CVS ≥ 35 **nicht speicherbar**. Die API antwortet mit
> `422 FOLGEAKTION_ERFORDERLICH`.

## 6.6 Automatische Aktivitätserfassung

| Quelle | Mechanik | Zuordnung |
|---|---|---|
| **Outlook / Microsoft 365** | Graph-API-Abo (Delta Query, Change Notifications) | E-Mail-Adresse → Kontakt; Kalendereintrag → Termin |
| **Brevo** | Webhook (öffnet, klickt, bounct, meldet ab) | E-Mail → Kontakt |
| **Website** | JS-Tracker → Signal-Endpoint | Cookie/Consent-ID → Kontakt bei Auflösung |
| **Telefonanlage (optional)** | CTI-Webhook | Rufnummer (E.164) → Kontakt |
| **Angebotstracking** | Pixel/Link im PDF-Versand | Angebots-ID → Opportunity |
| **Mobile App** | Sprachnotiz → Transkription → Aktivitätsentwurf | Aktiver Kontext |

**Sprachnotiz-Workflow (Mobile):** Der Außendienst spricht nach dem Termin 30 Sekunden.
Das System transkribiert, extrahiert Ergebnis, Folgeaktion und Datum, legt einen
Aktivitätsentwurf an und fragt zur Bestätigung. Aufwand: ein Klick statt fünf Minuten Tippen.
**Freigabe durch Menschen ist Pflicht** — keine automatische Speicherung von KI-Extraktionen.

## 6.7 Aktivitätsqualität

Nicht die Menge zählt, sondern die Wirkung. Gemessen wird:

| Kennzahl | Definition | Zielwert |
|---|---|---|
| Aktivitäten je Abschluss | Aktivitäten in gewonnenen Opportunities | 6–10 (Kennzahl, kein Ziel) |
| Erreichungsquote | `erreicht_*` / Anruf-Aktivitäten | ≥ 45 % |
| Folgeaktionsquote | Aktivitäten mit Folgeaktion ≠ `keine` | ≥ 95 % |
| Dokumentationsverzug | Median Zeit zwischen `zeitstempel` und `erfasst_am` | ≤ 4 h |
| Aktivitätslücke | Kontakte in aktivem Vorgang ohne Aktivität > 14 Tage | 0 |
| Automatisierungsanteil | Automatisch erfasste / alle Aktivitäten | ≥ 60 % |

## 6.8 Aktivitäts-Timeline (UI-Verhalten)

- Chronologisch absteigend, gruppiert nach Tag.
- **Filter:** Typ, Benutzer, Ergebnis, Zeitraum, „nur persönliche Kontakte", „nur System".
- Automatische Aktivitäten sind visuell gedämpft (grau), menschliche prominent.
- Systemereignisse (Score-Sprung, Stufenwechsel, Risikoänderung) erscheinen als
  farbige Marker in derselben Timeline — so entsteht **eine** Wahrheit statt zweier Historien.
- Volltextsuche über `betreff` und `inhalt` (GIN-Index, deutsche Textsuchkonfiguration).
