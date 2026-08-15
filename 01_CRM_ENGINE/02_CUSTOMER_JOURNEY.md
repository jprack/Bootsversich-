# 2. Customer Journey / Lebenszyklus

## 2.1 Modellprinzip

Der Lebenszyklus wird **zweidimensional** modelliert. Das ist die wichtigste
Designentscheidung dieses Kapitels, weil „VIP", „Empfehlungsgeber" und
„Bestandskunde" fachlich *gleichzeitig* zutreffen können.

| Dimension | Feld | Eigenschaft |
|---|---|---|
| **Lebenszyklusstufe** | `lifecycle_stufe` | Linear, monoton vorwärts (Ausnahme: Reaktivierung), genau ein Wert |
| **Rollen (Overlay)** | `rollen[]` | Mehrfach gleichzeitig möglich: `empfehlungsgeber`, `vip`, `partner`, `multiplikator`, `testimonial` |
| **Statusgrund** | `stufen_grund` | Warum die aktuelle Stufe erreicht/verlassen wurde |

```
S0 Unbekannter Kontakt
      │ Identifikation
      ▼
S1 Lead ─────────────────┐
      │ Qualifizierung   │ Disqualifikation
      ▼                  ▼
S2 Qualifizierter Lead  (S9 Archiviert / D-Lead-Pool)
      │ Bedarf + Wert bestätigt
      ▼
S3 Opportunity
      │ Angebot erstellt
      ▼
S4 Angebot
      │ Annahme                     Ablehnung ──▶ S9 (mit Wiedervorlage)
      ▼
S5 Abschluss
      │ Police aktiv
      ▼
S6 Bestandskunde ◀──────── Reaktivierung ──────── S8 Ehemaliger Kunde
      │  ▲                                              ▲
      │  │  Overlay-Rollen                              │ Kündigung / Ablauf ohne Verlängerung
      │  ├─▶ R1 Empfehlungsgeber (≥ 1 erfolgreiche Empfehlung)
      │  └─▶ R2 VIP Kunde (CVS ≥ 80)
      └──────────────────────────────────────────────────┘
```

> **Regel:** Die Stufen S6 (Bestandskunde), R1 (Empfehlungsgeber) und R2 (VIP)
> werden in Berichten getrennt ausgewiesen, aber technisch als Stufe S6 + Rollen geführt.
> Ein VIP-Kunde ist immer auch Bestandskunde.

---

## 2.2 Stufendefinition im Detail

### S0 — Unbekannter Kontakt

| Aspekt | Festlegung |
|---|---|
| **Definition** | Verhalten ohne aufgelöste Identität (Website-Session, anonymer Klick, Messebesuch ohne Datenübergabe). |
| **Eintrittskriterien** | Mindestens ein Signal mit gültiger Geräte-/Session-ID und wirksamer Einwilligung (Consent Tracking). |
| **Austrittskriterien** | Identität auflösbar: E-Mail, Telefonnummer, Formularabgabe, Newsletter-Klick, Partnerübergabe, QR-Scan auf Messe. |
| **Automatisierungen** | Signalaufzeichnung, Session-Merge, Retargeting-Freigabe (nur bei Consent), Progressive-Profiling-Formular ab 3. Besuch. |
| **Aufgaben** | Keine. **Ausnahme:** ≥ 5 Sessions auf Produktseiten in 7 Tagen ohne Identifikation → Aufgabe an Marketing „Identifikationsangebot prüfen". |
| **KPIs** | Anonyme Sessions, Identifikationsrate, Ø Sessions bis Identifikation |
| **Datenschutz** | Speicherung ausschließlich pseudonym, max. 90 Tage, kein Profilaufbau ohne Consent. |

### S1 — Lead

| Aspekt | Festlegung |
|---|---|
| **Definition** | Identifizierte Person mit erkennbarem Bedarfsbezug, noch ohne geprüfte Qualität. |
| **Eintrittskriterien** | Identität aufgelöst **und** eine der folgenden Bedingungen: Formularabgabe, Angebotsanfrage, Empfehlung, Partnermeldung, Messekontakt, Newsletter-Anmeldung mit Produktinteresse, Marketplace-Anfrage. |
| **Austrittskriterien** | **Vorwärts:** Qualifizierungskriterien erfüllt (siehe S2). **Rückwärts:** Disqualifikation (kein Boot, kein Bedarf, Fremdmarkt, Datenqualität unbrauchbar, Widerspruch). |
| **Automatisierungen** | Dublettenprüfung, Quellen-Zuordnung, Lead Score Erstberechnung, Zuweisung an Verantwortlichen nach Gebiets-/Round-Robin-Regel, Empfangsbestätigung binnen 5 Minuten (A-02), Aufnahme in Nurturing-Strecke bei Score < 60. |
| **Aufgaben** | **Erstkontakt** mit SLA nach Kategorie: A-Lead 4 h, B-Lead 24 h, C-Lead 72 h, D-Lead automatisiert. |
| **KPIs** | Neue Leads / Tag, Reaktionszeit (Median), Disqualifikationsquote, Leads je Quelle, Kosten je Lead |
| **Pflichtfelder** | Nachname, Kontaktkanal (E-Mail oder Telefon), Quelle, Einwilligungsstatus |

### S2 — Qualifizierter Lead

| Aspekt | Festlegung |
|---|---|
| **Definition** | Bedarf, Objekt und Entscheidungsfähigkeit sind bestätigt. |
| **Eintrittskriterien** | Alle vier Kriterien erfüllt (**BOOT-Kriterium**): **B**edarf konkret benannt · **O**bjekt bekannt (Boot mit Typ und Wert oder Kaufabsicht) · **O**perativ zuständig (Entscheider oder direkter Zugang) · **T**ermin/Zeitfenster genannt. Zusätzlich: Lead Score ≥ 60 **oder** manuelle Qualifizierung durch Vertrieb mit Begründung. |
| **Austrittskriterien** | **Vorwärts:** Opportunity angelegt (Wert + Wahrscheinlichkeit + Termin gesetzt). **Rückwärts:** Bedarf entfällt, Verschiebung > 12 Monate (→ Nurturing mit Wiedervorlage), kein Erreichen nach 5 dokumentierten Versuchen über 2 Kanäle. |
| **Automatisierungen** | Objektdaten-Anreicherung aus dem Objektmodul, Fahrgebiets- und Segmentableitung, Vorschlag passender Produktbündel (Next Best Offer), Terminvorschlag über Outlook-Verfügbarkeit. |
| **Aufgaben** | Bedarfsanalyse-Termin vereinbaren; Angebotsunterlagen vorbereiten; bei A-Lead zusätzlich Anruf durch Senior-Vertrieb. |
| **KPIs** | Qualifizierungsquote (S1→S2), Ø Dauer S1→S2, Qualifizierungsquote je Quelle |

### S3 — Opportunity

| Aspekt | Festlegung |
|---|---|
| **Definition** | Bewertete Verkaufschance mit Geldwert, Wahrscheinlichkeit und erwartetem Abschlussdatum. |
| **Eintrittskriterien** | Pflichtfelder gesetzt: Name, Kunde/Kontakt, Wert (EUR), Produktinteresse, Quelle, Verantwortlicher, erwartetes Abschlussdatum. |
| **Austrittskriterien** | Angebot versendet (→ S4), gewonnen (→ S5), verloren (→ S9 mit Verlustgrund — **Pflichtfeld**). |
| **Automatisierungen** | Wahrscheinlichkeitsberechnung aus Pipeline-Stufe × KI-Uplift, Forecast-Aufnahme, Aktivitätsüberwachung (Stillstand > 10 Tage → Eskalation A-15), Vollständigkeitsprüfung. |
| **Aufgaben** | Nächster Schritt ist **Pflicht**: Eine Opportunity ohne offene Aufgabe ist ein Systemfehler und wird im Dashboard rot markiert. |
| **KPIs** | Pipelinewert, Ø Opportunity-Wert, Stillstandsquote, Prognosegüte |

### S4 — Angebot

| Aspekt | Festlegung |
|---|---|
| **Definition** | Verbindliches oder unverbindliches Angebot ist beim Interessenten. |
| **Eintrittskriterien** | Angebotsdokument erzeugt, versendet und im CRM verknüpft (Dokumentreferenz + Versanddatum + Gültigkeit). |
| **Austrittskriterien** | Annahme (→ S5), Ablehnung (→ S9 + Grund), Ablauf der Gültigkeit ohne Reaktion (→ Nurturing + Wiedervorlage 90 Tage). |
| **Automatisierungen** | Nachfassstaffel **T+3 / T+7 / T+14 / T-3 vor Ablauf**; Öffnungs-/Downloadtracking des Angebots; automatische Wahrscheinlichkeitsanhebung bei Öffnung, Absenkung bei Nichtreaktion. |
| **Aufgaben** | Nachfassanruf T+3 (Pflicht, nicht überspringbar), Einwandbehandlung, Ablaufprüfung. |
| **KPIs** | Angebotsquote, Angebotsöffnungsrate, Annahmequote, Ø Zeit Angebot→Entscheidung |

### S5 — Abschluss

| Aspekt | Festlegung |
|---|---|
| **Definition** | Zusage liegt vor, Übergabe an das Vertragsmodul zur Policierung läuft. |
| **Eintrittskriterien** | Opportunity-Status `gewonnen`, Antrag/Zusage dokumentiert. |
| **Austrittskriterien** | Police aktiv gemeldet vom Vertragsmodul (→ S6). Storno im Antragsprozess (→ S9 mit Grund `storno_antrag`). |
| **Automatisierungen** | Umsatz- und Provisionsbuchung im Forecast, Dankes-E-Mail binnen 24 h, Onboarding-Strecke, Quellenerfolg zurückschreiben (Attribution), KI-Trainingsdatensatz erzeugen. |
| **Aufgaben** | Vollständigkeitsprüfung Unterlagen, Willkommensanruf innerhalb 5 Werktagen, Cross-Sell-Prüfung nach 30 Tagen. |
| **KPIs** | Abschlüsse / Woche, Ø Abschlusswert, Ø Verkaufszyklus (S1→S5), Abschlussquote je Quelle |

### S6 — Bestandskunde

| Aspekt | Festlegung |
|---|---|
| **Definition** | Mindestens ein aktiver Vertrag. |
| **Eintrittskriterien** | Aktive Police im Vertragsmodul, gespiegelt in `crm_vertrag_ref`. |
| **Austrittskriterien** | Letzter Vertrag beendet ohne Nachfolgevertrag → S8 (Frist: 30 Tage nach Vertragsende ohne Neuvertrag). |
| **Automatisierungen** | Jahresgespräch-Wiedervorlage, Hauptfälligkeitsstaffel T-90/T-60/T-30, Geburtstagsgruß, Saisonkommunikation (Saisonstart / Winterlager), Deckungsprüfung bei Bootswechsel, Empfehlungsanfrage nach positivem Ereignis, Churn-Überwachung. |
| **Aufgaben** | Jahresgespräch, Vertragsprüfung bei Wertänderung, Rückmeldung nach Schadenabschluss, Cross-Sell aus Next Best Offer. |
| **KPIs** | Bestandskunden, Bestandsprämie, Verträge je Kunde, Cross-Sell-Quote, Bestandsverlustquote, CVS-Verteilung |

### R1 — Empfehlungsgeber *(Rolle, parallel zu S6/S8)*

| Aspekt | Festlegung |
|---|---|
| **Definition** | Kunde oder Partner, der mindestens eine Empfehlung ausgesprochen hat. |
| **Eintrittskriterien** | ≥ 1 erfasste Empfehlung (Status ≥ `eingegangen`). **Aktiver** Empfehlungsgeber: ≥ 1 Empfehlung in den letzten 12 Monaten. |
| **Austrittskriterien** | Widerruf der Rolle, keine Empfehlung > 24 Monate (→ Rolle bleibt, Kennzeichen `inaktiv`). |
| **Automatisierungen** | Statusrückmeldung an den Empfehlungsgeber bei jedem Fortschritt, Dank/Anerkennung bei Erfolg, Aufnahme in Referenzprogramm, Erfolgsquote fortschreiben. |
| **Aufgaben** | Persönlicher Dank binnen 48 h nach Abschluss aus Empfehlung; jährliche Empfehlungsanfrage bei Kunden mit CVS ≥ 70 und Risk Score < 35. |
| **KPIs** | Aktive Empfehlungsgeber, Empfehlungen je Geber, Erfolgsquote, Umsatz aus Empfehlungen, Anteil am Neugeschäft |

### R2 — VIP Kunde *(Rolle, parallel zu S6)*

| Aspekt | Festlegung |
|---|---|
| **Definition** | Kunde mit höchstem wirtschaftlichem oder strategischem Wert. |
| **Eintrittskriterien** | `customer_value_score ≥ 80` **und** Kundenbeziehung ≥ 24 Monate **und** kein offener Zahlungsverzug. **Oder** manuelle Ernennung durch die Vertriebsleitung mit Begründung und Befristung (12 Monate). |
| **Austrittskriterien** | CVS < 70 über 2 aufeinanderfolgende Quartalsmessungen (Hysterese verhindert Statusflattern) oder manueller Entzug. |
| **Automatisierungen** | Feste Betreuungszuordnung (Named Account), verkürzte SLA (Reaktion ≤ 2 h), Eskalationspfad zur Leitung, Priorisierung in allen NBA-Listen, Einladung zu Exklusivformaten (Regatta, Messe, Academy). |
| **Aufgaben** | Halbjahresgespräch statt Jahresgespräch, proaktive Deckungsprüfung, persönliche Saisoneröffnungskontakte. |
| **KPIs** | Anzahl VIP, Umsatzanteil VIP, VIP-Verlustquote (**Zielwert: 0**), Ø Reaktionszeit VIP |

### S8 — Ehemaliger Kunde

| Aspekt | Festlegung |
|---|---|
| **Definition** | Kein aktiver Vertrag mehr. |
| **Eintrittskriterien** | Alle Verträge beendet (Kündigung, Ablauf, Bootsverkauf, Wechsel zum Wettbewerb) und 30 Tage kein Neuvertrag. |
| **Austrittskriterien** | Neuer Vertrag → zurück nach S6 mit Kennzeichen `reaktiviert`. |
| **Automatisierungen** | Kündigungsgrund erfassen (**Pflichtfeld**), Win-Back-Strecke nach 3 / 9 / 12 Monaten, Ausschluss bei Widerspruch, Ausschluss bei Grund `bootsverkauf_endgueltig` und Alter > 75 (Sinnhaftigkeitsfilter). |
| **Aufgaben** | Exit-Gespräch binnen 5 Werktagen (Pflicht bei CVS ≥ 60), Win-Back-Kontakt vor der nächsten Saison, Wiedervorlage zur Hauptfälligkeit des Wettbewerbsvertrags (starkes Rückholfenster). |
| **KPIs** | Kündigungen / Monat, Kündigungsgründe (Top 5), Rückgewinnungsquote, verlorene Bestandsprämie, Ø CVS der Abgänge |

### S9 — Archiviert / Disqualifiziert *(technischer Endzustand)*

| Aspekt | Festlegung |
|---|---|
| **Definition** | Kein aktiver Vertriebsvorgang, Datensatz bleibt auswertbar. |
| **Eintrittskriterien** | Disqualifikation, Verlust, Storno, Widerspruch, Ablauf ohne Reaktion. |
| **Austrittskriterien** | Neues qualifizierendes Signal (z. B. neue Anfrage, Bootswechsel) → Reaktivierung nach S1/S2. |
| **Automatisierungen** | Verlust-/Disqualifikationsgrund auswerten, Quellenbewertung anpassen, DSGVO-Löschfrist starten. |
| **Aufgaben** | Keine, außer bei Verlustgrund `preis` und Wert ≥ 5.000 EUR → Wiedervorlage 10 Monate vor Hauptfälligkeit des Wettbewerbers. |
| **KPIs** | Verlustgründe, Verlustwert, Reaktivierungsquote |

---

## 2.3 Stufenübergangsmatrix

| Von \ Nach | S1 | S2 | S3 | S4 | S5 | S6 | S8 | S9 |
|---|---|---|---|---|---|---|---|---|
| **S0** | ✅ Identifikation | – | – | – | – | – | – | ⚪ Consent-Widerruf |
| **S1** | – | ✅ BOOT erfüllt | ⚪ direkt bei Empfehlung + Bedarf | – | – | – | – | ✅ Disqualifikation |
| **S2** | ⚪ Rückstufung | – | ✅ Opportunity angelegt | – | – | – | – | ✅ kein Bedarf |
| **S3** | – | ⚪ Rückstufung | – | ✅ Angebot versendet | ⚪ Direktabschluss | – | – | ✅ verloren |
| **S4** | – | – | ⚪ Neukalkulation | – | ✅ Annahme | – | – | ✅ Ablehnung/Ablauf |
| **S5** | – | – | – | – | – | ✅ Police aktiv | – | ⚪ Antragsstorno |
| **S6** | – | – | ✅ neue Opportunity | – | – | – | ✅ letzter Vertrag endet | – |
| **S8** | ⚪ neue Anfrage | – | ✅ Win-Back-Chance | – | – | ✅ Reaktivierung | – | ⚪ Widerspruch |
| **S9** | ✅ neues Signal | – | – | – | – | – | – | – |

Legende: ✅ Standardpfad · ⚪ Ausnahmepfad (begründungspflichtig) · – nicht zulässig

**Systemregel:** Jeder Stufenwechsel erzeugt ein Event `crm.kontakt.stufe_gewechselt`,
schreibt einen Eintrag in `crm_lifecycle_historie` und prüft die Automatisierungsregeln
der Zielstufe. Rückwärtswechsel sind immer begründungspflichtig.

---

## 2.4 Journey-Zeitziele (SLA je Stufe)

| Übergang | Zielzeit (Median) | Eskalation bei Überschreitung |
|---|---|---|
| S0 → S1 | 14 Tage | keine (Marketingthema) |
| S1 → Erstkontakt | A: 4 h · B: 24 h · C: 72 h | Teamleitung nach 2× SLA |
| S1 → S2 | 5 Werktage | Aufgabe an Teamleitung |
| S2 → S3 | 7 Werktage | Eskalation Vertriebsleitung |
| S3 → S4 | 5 Werktage | Aufgabe „Angebot überfällig" |
| S4 → S5 | 21 Tage | Nachfassstaffel + Leitungsprüfung ab Wert ≥ 10.000 EUR |
| S5 → S6 | 10 Werktage | Aufgabe an Innendienst |
| Stillstand jede Stufe | 10 Tage ohne Aktivität | Automatische Eskalation (A-15) |
