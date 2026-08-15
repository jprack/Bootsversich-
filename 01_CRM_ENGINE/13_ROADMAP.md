# 13. Roadmap

## 13.1 Leitgedanke der Reihenfolge

Die Reihenfolge folgt nicht der technischen Bequemlichkeit, sondern dem
Wertbeitrag: **Zuerst darf nichts mehr verloren gehen. Dann wird priorisiert.
Dann wird vorhergesagt.** Ein Lead-Scoring ohne funktionierende Aufgabenlogik
ist wertlos — es erzeugt Erkenntnis ohne Handlung.

```
Phase 0        Phase 1            Phase 2           Phase 3            Phase 4
Fundament  →   Nichts geht  →     Priorisierung →   Vorhersage    →    Netzwerk &
               verloren                              & Bindung          Skalierung
(4 Wochen)     (8 Wochen)         (8 Wochen)        (10 Wochen)        (12 Wochen)
```

---

## 13.2 Phase 0 — Fundament (Woche 1–4)

| Lieferobjekt | Inhalt |
|---|---|
| Datenmodell | `crm_schema.sql` produktiv, Migrationswerkzeug, RLS aktiv |
| Identität | Anbindung Plattform-IAM, Benutzer-/Team-/Gebietsprojektion |
| Kataloge | Leadquellen, Produkte, Statusdefinitionen, Signaltypen befüllt |
| Read-Models | Consumer für Boot, Vertrag, Schaden, Dokument |
| Migration | Import Alt-CRM/Excel mit Dublettenbereinigung und Quellenzuordnung |
| API-Grundgerüst | Auth, Fehlermodell, Paginierung, Idempotenz, Audit |

**Abnahmekriterien:** Schema fehlerfrei ausgerollt · Read-Models synchronisieren
mit < 60 s Verzug · Migration mit ≥ 98 % Pflichtfeldvollständigkeit ·
Mandantentrennung durch Penetrationstest bestätigt.

**Risiko:** Datenqualität der Altsysteme. **Gegenmaßnahme:** Migration in zwei
Wellen — erst Bestandskunden mit aktivem Vertrag, dann historische Leads.

---

## 13.3 Phase 1 — „Nichts geht verloren" (Woche 5–12)

| Lieferobjekt | Inhalt |
|---|---|
| Kontakt-/Kunden-/Leadverwaltung | Vollständige CRUD-Funktionen, Lebenszyklus S0–S9 mit Historie |
| Aktivitätenmodell | Alle Typen, **Pflicht-Folgeaktion**, Timeline |
| Aufgabenmodell | Typen, SLA, Eskalation, Duplikatsschutz, Lastschutz |
| Wiedervorlagen | W-01 bis W-08 (Angebot, Hauptfälligkeit, Jahresgespräch, Geburtstag) |
| Automatisierungen | A-01 bis A-15 (Vergessenswächter, Erstkontakt-SLA, Angebotsstaffel) |
| Opportunity & Angebot | Pipeline, Pflichtgründe, Angebotsvarianten |
| Outlook-Integration | Mail- und Kalendersync bidirektional |
| UX | Startseite (Tagesliste), Leadübersicht, Kundenakte, Opportunity-Cockpit — Desktop + Mobile |
| Dashboards | Vertriebs- und CRM-Dashboard |

**Abnahmekriterien:** Vergessensquote (N-03) = 0 über 14 aufeinanderfolgende Tage ·
SLA-Erfüllung (P-01) ≥ 90 % · Folgeaktionsquote (P-07) ≥ 90 % ·
90 % der Vertriebsnutzer arbeiten die Tagesliste täglich ab.

**Nach dieser Phase ist das System bereits vollständig produktiv nutzbar.**
Alles Weitere erhöht die Wirkung, ist aber nicht Voraussetzung für den Betrieb.

---

## 13.4 Phase 2 — Priorisierung (Woche 13–20)

| Lieferobjekt | Inhalt |
|---|---|
| Signal Layer | Website-Tracker, Brevo-Webhooks, Academy/Marketplace-Signale, Consent-Prüfung |
| Identitätsauflösung | Tracking-ID → Kontakt, Session-Merge, progressives Profiling |
| Lead Score | **Regelbasiert** (Phase 1 des Scoringmodells), Kategorien A–D, Erklärung im UI |
| Intent Score | Signalverdichtung mit Zeitverfall, Muster M1–M4 |
| Priorisierung | Prioritäts-Score für Aufgaben, echte Next-Best-Action-Sortierung |
| Customer Value Score | Vollständige Berechnung mit Blockdarstellung und Historie |
| Automatisierungen | A-16 bis A-23, A-30 bis A-33 (Signale, NBO-Grundregeln) |
| Empfehlungsmanagement | Vollständig inkl. Statusrückmeldung und Prämien |
| Dashboards | Management-Dashboard, Quellenperformance mit CPL/CAC/ROI |

**Abnahmekriterien:** Ø Lead-Reaktionszeit (N-04) ≤ 4 h · A-Leads werden zu ≥ 95 %
im SLA kontaktiert · Quellen-Index für alle aktiven Quellen belastbar ·
Handlungsquote (N-01) ≥ 70 %.

---

## 13.5 Phase 3 — Vorhersage und Bindung (Woche 21–30)

| Lieferobjekt | Inhalt |
|---|---|
| KI-Lead-Scoring | Trainingspipeline, Blending Phase 2 (60/40), SHAP-Erklärungen, Drift-Überwachung |
| Churn Engine | Regelmodell R-01…R-13 + Survival-Modell, Risikostufen, Pflichthandlungen |
| Next Best Offer | NBO-01…NBO-10 mit gemessener Trefferquote und Rückkopplung |
| Muster M5–M8 | Stiller Rückzug, Angebotsdruck, Netzwerkaktivierung, Flottenpotenzial |
| Automatisierungen | A-24 bis A-29b, A-40 bis A-48 (Risiko, Rückholung, Steuerung, Nachtläufe) |
| Forecast | Gewichtet, Commit, Best Case, Prognosegütemessung |
| Sprachnotiz-Erfassung | Mobile Transkription mit menschlicher Freigabe |
| Reporting | Vollständiges Tages-/Wochen-/Monatsberichtswesen |

**Abnahmekriterien:** AUC Lead Score ≥ 0,75 auf Holdout · Churn-Modell erkennt
≥ 60 % der tatsächlichen Kündiger im Top-Risiko-Quintil · Prognosegüte (V-09) ≥ 80 % ·
Rückholquote bei Risk ≥ 65 messbar über Kontrollgruppe.

**Methodische Auflage:** Vor Freischaltung der Rückholautomatik läuft 8 Wochen ein
A/B-Test gegen eine Kontrollgruppe ohne Automatik. Ohne nachgewiesenen Effekt
wird die Regel nicht ausgerollt.

---

## 13.6 Phase 4 — Netzwerk und Skalierung (Woche 31–42)

| Lieferobjekt | Inhalt |
|---|---|
| Partnermanagement | Partner Value Score, Partnerportal-Übergabe, Partnerkennzahlen |
| Netzwerkgraph | Kunde ↔ Marina ↔ Werft ↔ Club ↔ Empfehlungsgeber als navigierbare Sicht |
| Kampagnensteuerung | CRM steuert Brevo-Strecken direkt aus Segmenten (Score, CVS, Risiko, Fahrgebiet) |
| Blending Phase 3 | 40/60 zugunsten des Modells, sofern AUC ≥ 0,78 stabil |
| Territorien & Kapazität | Automatische Gebietsoptimierung, Auslastungssteuerung |
| Mehrsprachigkeit | Vollständig DE/EN für internationale Reviere |
| Offline-Fähigkeit Mobile | Messe-/Marinabetrieb ohne Netz, Synchronisation danach |
| Erweiterte BI | Kohortenanalyse, Lifetime-Value-Prognose, Szenariorechnung |

**Abnahmekriterien:** Systemgenerierter Umsatzanteil (N-02) ≥ 35 % ·
Empfehlungsanteil (V-12) ≥ 30 % · Bestandsverlustquote (N-06) ≤ 6 % ·
Handlungsquote (N-01) ≥ 80 %.

---

## 13.7 Übersicht Lieferobjekte je Phase

| Bereich | P0 | P1 | P2 | P3 | P4 |
|---|:--:|:--:|:--:|:--:|:--:|
| Datenmodell & Migration | ●●● | ● | ○ | ○ | ○ |
| Lead-/Kunden-/Opportunity-Verwaltung | ○ | ●●● | ● | ○ | ○ |
| Aktivitäten & Aufgaben | ○ | ●●● | ●● | ● | ○ |
| Signale & Scoring | ○ | ○ | ●●● | ●● | ● |
| KI-Modelle | ○ | ○ | ○ | ●●● | ●● |
| Empfehlungen & Partner | ○ | ● | ●● | ● | ●●● |
| Dashboards & Reporting | ○ | ●● | ●● | ●●● | ●● |
| Integrationen | ○ | ●● (Outlook) | ●● (Brevo, Web) | ● | ●●● (Portal, Academy, Marketplace) |
| UX | ○ | ●●● | ●● | ● | ●● |

● Nebenaufwand · ●● wesentlicher Aufwand · ●●● Schwerpunkt · ○ nicht in dieser Phase

## 13.8 Übergreifende Risiken

| Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|
| **Aufgabenflut** — System erzeugt mehr, als bearbeitbar ist | Nutzer ignorieren das System, N-01 bricht ein | Tageslimit + Bündelung ab Phase 1; wöchentliche Prüfung der Verwerfungsquote |
| **Datenqualität aus Altsystemen** | Scores unbrauchbar | Zweiwellenmigration, Pflichtfeldkampagne, A-41 |
| **Mangelnde Nutzerakzeptanz** | Dokumentation unterbleibt, Lernschleife fehlt | Sprachnotiz + Ein-Klick-Abschluss + sichtbarer Nutzen (Begründung an jeder Aufgabe) |
| **KI ohne Trainingsdaten** | Fehlprognosen früh | Cold-Start-Phase rein regelbasiert, Freigabeschwellen |
| **Datenschutzverstoß beim Tracking** | Rechtliches Risiko | Consent-Gate vor Persistenz, Löschautomatik, Auskunfts-API, DSFA vor Phase 2 |
| **Abhängigkeit von Fremdmodulen** | Read-Models veralten | Verzugsüberwachung, Alarm bei Sync-Verzug > 15 min, degradierter Betrieb definiert |
| **Zu frühe Automatisierung der Kundenkommunikation** | Beziehungsschaden | Automatisierungsgrenzen (10.3) sind verbindlich |

## 13.9 Meilensteine

| Meilenstein | Termin | Kriterium |
|---|---|---|
| **M1 Fundament steht** | Ende Woche 4 | Schema + Migration + Read-Models abgenommen |
| **M2 Produktivbetrieb** | Ende Woche 12 | Vertrieb arbeitet vollständig im neuen System, N-03 = 0 |
| **M3 Priorisierung wirkt** | Ende Woche 20 | N-04 ≤ 4 h, N-01 ≥ 70 % |
| **M4 Vorhersage produktiv** | Ende Woche 30 | AUC ≥ 0,75, Churn-Rückholung A/B-validiert |
| **M5 Netzwerk skaliert** | Ende Woche 42 | N-02 ≥ 35 %, V-12 ≥ 30 % |
