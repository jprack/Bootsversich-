# 9. API-Konzept

Formale Spezifikation: [`api/openapi_crm.yaml`](api/openapi_crm.yaml) (OpenAPI 3.1)

## 9.1 Grundsätze

| Thema | Festlegung |
|---|---|
| Stil | REST/JSON, ressourcenorientiert |
| Basis-URL | `https://api.callidus.example/api/v1/crm` |
| Authentifizierung | OAuth 2.0 / OIDC (Client Credentials für System-zu-System, Authorization Code für Benutzer) |
| Autorisierung | Rollenbasiert + Mandant aus Token-Claim `mandant_id`; niemals aus dem Request-Body |
| Idempotenz | `Idempotency-Key`-Header bei allen `POST` (24 h Gültigkeit) |
| Nebenläufigkeit | `ETag` / `If-Match` bei `PATCH`; `409` bei Konflikt |
| Paginierung | Cursor-basiert: `?cursor=…&limit=50` (max. 200) |
| Sortierung/Filter | `?sort=-lead_score&filter[status]=neu&filter[kategorie]=A` |
| Teilfelder | `?fields=id,name,lead_score` |
| Fehlerformat | RFC 9457 `application/problem+json` |
| Ratenbegrenzung | 600 Anfragen/Minute je Client; `429` + `Retry-After` |
| Versionierung | URL-Pfad (`/v1`); Breaking Changes nur mit neuer Major-Version, 12 Monate Parallelbetrieb |
| Zeitformat | RFC 3339 UTC |
| Sprache | Feldnamen deutsch, `snake_case` — identisch zum Datenmodell |

### Fehlermodell
```json
{
  "type": "https://api.callidus.example/errors/folgeaktion-erforderlich",
  "title": "Folgeaktion erforderlich",
  "status": 422,
  "detail": "Aktivitäten zu aktiven Leads benötigen eine Folgeaktion mit Datum.",
  "code": "FOLGEAKTION_ERFORDERLICH",
  "instance": "/api/v1/crm/aktivitaeten",
  "felder": [{ "feld": "folgeaktion_am", "meldung": "Pflichtfeld" }]
}
```

Fachliche Fehlercodes (Auszug): `FOLGEAKTION_ERFORDERLICH`, `VERLUSTGRUND_ERFORDERLICH`,
`GEWINNGRUND_ERFORDERLICH`, `DISQUALIFIKATIONSGRUND_ERFORDERLICH`,
`AUFGABE_BEREITS_VORHANDEN`, `CONSENT_FEHLT`, `STUFENWECHSEL_UNZULAESSIG`,
`SLA_VERLETZUNG_ESKALIERT`, `DUBLETTE_ERKANNT`.

---

## 9.2 Endpunkte

### 9.2.1 Lead Management
| Methode | Pfad | Zweck |
|---|---|---|
| `POST` | `/leads` | Lead anlegen (mit Dublettenprüfung, Scoring, Zuweisung) |
| `GET` | `/leads` | Liste mit Filtern (`status`, `kategorie`, `quelle`, `verantwortlicher`, `score_min`) |
| `GET` | `/leads/{id}` | Detail inkl. Score-Erklärung |
| `PATCH` | `/leads/{id}` | Teilaktualisierung |
| `POST` | `/leads/{id}/qualifizieren` | Übergang S1→S2 (prüft BOOT-Kriterien) |
| `POST` | `/leads/{id}/disqualifizieren` | Grund Pflicht |
| `POST` | `/leads/{id}/konvertieren` | Erzeugt Opportunity (+ optional Kunde) |
| `POST` | `/leads/{id}/zuweisen` | Verantwortlichen ändern |
| `POST` | `/leads/{id}/zusammenfuehren` | Dublettenzusammenführung |
| `POST` | `/leads/{id}/score/neuberechnen` | Erzwungene Neuberechnung |
| `GET` | `/leads/{id}/score/historie` | Score-Verlauf |
| `POST` | `/leads/importieren` | Massenimport (asynchron, liefert `job_id`) |
| `GET` | `/leads/dubletten-pruefung` | Prüft E-Mail/Telefon/Name+PLZ vor dem Anlegen |

**`POST /leads` — Anfrage**
```json
{
  "kontakt": { "vorname":"Jan","nachname":"Kramer","email":"j.kramer@example.com",
               "telefon":"+491701234567","plz":"24103","land":"DE" },
  "bedarfsart": "wechsel",
  "produktinteresse": ["kasko","haftpflicht"],
  "boot": { "typ":"segelyacht","laenge_m":14.2,"wert_eur":380000,"baujahr":2019,
            "fahrgebiet":"nord_ostsee","liegeplatz_marina":"Düsternbrook" },
  "bestehender_versicherer": "Muster Assekuranz",
  "hauptfaelligkeit_bestand": "2026-10-01",
  "zeitfenster": "3_monate",
  "quelle_code": "WERFT",
  "consent": { "email":"erteilt","telefon":"erteilt","nachweis_quelle":"formular:werft-uebergabe" }
}
```
**Antwort `201`**
```json
{
  "id":"…","leadnummer":"L-2026-004711","status":"neu",
  "lead_score":87,"lead_kategorie":"A",
  "score_erklaerung":[
    {"faktor":"Bootswert 380.000 €","punkte":13},
    {"faktor":"Empfehlung durch Werftpartner","punkte":11},
    {"faktor":"Hauptfälligkeit in 47 Tagen","faktor_typ":"multiplikator","wert":1.20}],
  "verantwortlicher_id":"…",
  "erstkontakt_faellig_am":"2026-08-15T14:00:00Z",
  "erzeugte_aufgabe_id":"…",
  "dubletten_kandidaten":[]
}
```

### 9.2.2 Kunden
| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/kunden` | Liste mit Filtern (`betreuungsstufe`, `risiko_stufe`, `cvs_min`) |
| `GET` | `/kunden/{id}` | Stammdaten |
| `GET` | `/kunden/{id}/akte` | **360-Grad-Sicht** (alle 12 Blöcke, aggregiert) |
| `PATCH` | `/kunden/{id}` | Aktualisieren |
| `GET` | `/kunden/{id}/boote` · `/vertraege` · `/schaeden` · `/dokumente` | Read-Models |
| `GET` | `/kunden/{id}/scores` | CVS + Risk + Engagement mit Erklärung |
| `GET` | `/kunden/{id}/scores/historie` | Zeitreihe |
| `GET` | `/kunden/{id}/empfehlungen` | Gegeben/erhalten |
| `GET` | `/kunden/{id}/next-best-offer` | Cross-/Upsell-Vorschläge |
| `POST` | `/kunden/{id}/vip` · `DELETE` | VIP-Rolle setzen/entziehen (Begründung Pflicht) |
| `GET` | `/kunden/{id}/dsgvo-export` | Vollständige Auskunft (Art. 15) |
| `POST` | `/kunden/{id}/dsgvo-loeschung` | Lösch-/Sperrantrag (Art. 17) |
| `GET` | `/kunden/risiko` | Alle Kunden mit Risk ≥ Schwelle, sortiert nach CVS |

### 9.2.3 Opportunities
| Methode | Pfad | Zweck |
|---|---|---|
| `POST` `GET` | `/opportunities` | Anlegen / Liste |
| `GET` `PATCH` | `/opportunities/{id}` | Detail / Aktualisieren |
| `POST` | `/opportunities/{id}/stufe` | Stufenwechsel (validiert Übergangsmatrix) |
| `POST` | `/opportunities/{id}/gewinnen` | Gewinngrund Pflicht |
| `POST` | `/opportunities/{id}/verlieren` | Verlustgrund Pflicht |
| `POST` | `/opportunities/{id}/pausieren` | `pausiert_bis` Pflicht |
| `GET` | `/opportunities/{id}/historie` | Stufenverlauf |
| `POST` `GET` | `/opportunities/{id}/angebote` | Angebot anlegen / auflisten |
| `POST` | `/angebote/{id}/versenden` | Versand + Nachfassstaffel starten |
| `POST` | `/angebote/{id}/entscheidung` | angenommen/abgelehnt + Grund |
| `GET` | `/pipeline` | Aggregation je Stufe/Monat/Team |
| `GET` | `/forecast` | Brutto, gewichtet, Commit, Best Case, Prognosegüte |

### 9.2.4 Aktivitäten
| Methode | Pfad | Zweck |
|---|---|---|
| `POST` | `/aktivitaeten` | Erfassen (**erzwingt Folgeaktion**) |
| `GET` | `/aktivitaeten` | Filter nach Bezug, Typ, Benutzer, Zeitraum |
| `GET` `PATCH` | `/aktivitaeten/{id}` | Detail / Korrektur (mit Audit) |
| `GET` | `/kontakte/{id}/timeline` | Chronologie inkl. Systemereignissen |
| `POST` | `/aktivitaeten/sprachnotiz` | Audio → Transkription → **Entwurf** (Freigabe erforderlich) |
| `POST` | `/aktivitaeten/batch` | Massenerfassung (Outlook-Sync) |

### 9.2.5 Aufgaben
| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/aufgaben` | Filter, sortiert nach `prioritaets_score` |
| `GET` | `/aufgaben/tagesliste` | **Next Best Actions des angemeldeten Benutzers** |
| `POST` | `/aufgaben` | Anlegen (Duplikatsschutz aktiv) |
| `PATCH` | `/aufgaben/{id}` | Aktualisieren |
| `POST` | `/aufgaben/{id}/erledigen` | Ergebnis + Aktivität in **einem** Aufruf |
| `POST` | `/aufgaben/{id}/verschieben` | Neues Datum (+ Zähler, ggf. Eskalation) |
| `POST` | `/aufgaben/{id}/delegieren` | Übergabe |
| `POST` | `/aufgaben/{id}/verwerfen` | Begründung Pflicht |
| `GET` | `/aufgaben/ueberfaellig` | SLA-Verstöße (Leitungssicht) |

**`GET /aufgaben/tagesliste` — Antwort**
```json
{
  "datum":"2026-08-15","benutzer_id":"…",
  "kapazitaet":{"offen":14,"heute_faellig":9,"ueberfaellig":2},
  "aufgaben":[
    { "id":"…","rang":1,"titel":"Rückholgespräch Nordwind Charter GmbH",
      "typ":"rueckhol_kontakt","prioritaets_score":98,
      "grund":"Risiko 71 (hoch) bei Kundenwert 86 — 312 Tage kein Kontakt",
      "erwarteter_wert_eur":14280,
      "kontext":{"kunde_id":"…","risk_score":71,"customer_value_score":86,
                 "gespraechsaufhaenger":["Hauptfälligkeit 01.10.","Prämie +18 % im Vorjahr",
                                          "Neues Boot seit 03/2026 nicht gedeckt"]},
      "aktionen":["anrufen","email","termin_vereinbaren","verschieben"] }
  ]
}
```

### 9.2.6 Empfehlungen
| Methode | Pfad | Zweck |
|---|---|---|
| `POST` | `/empfehlungen` | Erfassen → **erzeugt automatisch Lead + Aufgabe** |
| `GET` | `/empfehlungen` | Filter nach Status, Geber, Zeitraum |
| `PATCH` | `/empfehlungen/{id}/status` | Statuswechsel + Rückmeldung an Geber |
| `GET` | `/empfehlungen/statistik` | Erfolgsquote, Umsatz, Top-Geber |
| `GET` | `/kontakte/{id}/empfehlungspotenzial` | Prüft Anfragebedingungen |
| `POST` | `/empfehlungen/anfrage` | Empfehlungsanfrage auslösen |

### 9.2.7 Partner
| Methode | Pfad | Zweck |
|---|---|---|
| `GET` `POST` | `/partner` | Liste / Anlegen |
| `GET` `PATCH` | `/partner/{id}` | Detail / Aktualisieren |
| `GET` | `/partner/{id}/leads` · `/umsatz` · `/score` | Leistungsdaten |
| `POST` | `/partner/{id}/lead-uebergabe` | Endpunkt für das Partnerportal |

### 9.2.8 Dashboard & Reporting
| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/dashboard/vertrieb` | Heiße Leads, Pipeline, Angebote, Potenzial |
| `GET` | `/dashboard/crm` | Neue Leads/Kunden, Wiedervorlagen, offene Aufgaben |
| `GET` | `/dashboard/management` | Conversion, Pipeline, Umsatz, Quellen, CVS |
| `GET` | `/kpi/{code}` | Einzelkennzahl mit Zeitreihe und Zielwert |
| `GET` | `/reports/taeglich` · `/woechentlich` · `/monatlich` | Standardberichte (JSON/CSV/PDF) |
| `GET` | `/quellen/performance` | CPL, CAC, Conversion, ROI, Quellen-Index |

### 9.2.9 Signale (Ingest)
| Methode | Pfad | Zweck |
|---|---|---|
| `POST` | `/signale` | Einzelsignal (Website-Tracker, prüft Consent) |
| `POST` | `/signale/batch` | Massenaufnahme (max. 1.000) |
| `GET` | `/kontakte/{id}/signale` | Signalverlauf |
| `GET` | `/kontakte/{id}/intent` | Intent Score + erkannte Muster |

---

## 9.3 Webhooks (ausgehend)

Abonnierbar je Mandant, HMAC-SHA256-signiert (`X-Callidus-Signature`),
mindestens einmalige Zustellung, exponentielles Retry (1 min → 24 h), Dead-Letter-Queue.

| Ereignis | Nutzlast (Auszug) |
|---|---|
| `crm.lead.erstellt` | `lead_id, score, kategorie, quelle_code` |
| `crm.lead.kategorie_gewechselt` | `lead_id, von, nach` (Trigger für Echtzeit-Alarm bei →A) |
| `crm.lead.qualifiziert` / `.disqualifiziert` | `lead_id, grund` |
| `crm.opportunity.erstellt` / `.stufe_gewechselt` | `opportunity_id, von, nach, wert_eur` |
| `crm.opportunity.gewonnen` / `.verloren` | `opportunity_id, wert_eur, grund, quelle_code` |
| `crm.angebot.versendet` / `.geoeffnet` / `.abgelaufen` | `angebot_id, opportunity_id` |
| `crm.kunde.stufe_gewechselt` | `kunde_id, von, nach` |
| `crm.kunde.risiko_hoch` | `kunde_id, risk_score, top_treiber` |
| `crm.kunde.vip_erreicht` / `.vip_verloren` | `kunde_id, cvs` |
| `crm.empfehlung.eingegangen` / `.gewonnen` | `empfehlung_id, geber_id, wert_eur` |
| `crm.aufgabe.erstellt` / `.sla_verletzt` / `.eskaliert` | `aufgabe_id, benutzer_id, stufe` |
| `crm.signal.muster_erkannt` | `kontakt_id, muster_code, intent_score` |

## 9.4 Eingehende Integrationen

| System | Richtung | Mechanik | Frequenz |
|---|---|---|---|
| **Outlook / Microsoft 365** | ↔ | Graph API, Delta Query + Change Notifications; Kalender- und Mailabgleich; Kontakte als Ordner | Echtzeit |
| **Brevo** | ↔ | Webhooks (`opened`, `clicked`, `unsubscribed`, `hard_bounce`) → Signale; Kontaktlisten und Strecken werden aus dem CRM gesteuert | Echtzeit / 15 min |
| **Website** | → | JS-Tracker → `POST /signale` (Consent-geprüft); Formulare → `POST /leads` | Echtzeit |
| **Partnerportal** | → | `POST /partner/{id}/lead-uebergabe` mit Partner-API-Key | Echtzeit |
| **Academy** | → | `POST /signale` (`S-ACAD-01/02`) | Echtzeit |
| **Marketplace** | → | `POST /signale` (`S-MKT-01/02`) | Echtzeit |
| **Objekt-/Vertrags-/Schadenmodul** | → | Event-Bus → Read-Model-Consumer | Echtzeit |
| **BI / Data Warehouse** | ← | Read-Replica + tägliche Extrakte | Nacht |

### Konfliktregeln beim Outlook-Abgleich
1. Das CRM ist führend für: Lebenszyklus, Score, Aufgaben, Opportunities.
2. Outlook ist führend für: Kalendertermine (Zeit/Ort), gesendete E-Mails.
3. Bei Kontaktdatenkonflikt gewinnt die zuletzt **manuell** bestätigte Quelle;
   ungeklärte Fälle erzeugen eine `datenpflege`-Aufgabe statt stiller Überschreibung.
4. Als `vertraulich` markierte Aktivitäten werden **nicht** nach Outlook synchronisiert.

## 9.5 Nicht-funktionale Anforderungen

| Anforderung | Zielwert |
|---|---|
| Antwortzeit `GET /aufgaben/tagesliste` | p95 ≤ 300 ms |
| Antwortzeit `GET /kunden/{id}/akte` | p95 ≤ 700 ms |
| Antwortzeit `POST /leads` (inkl. Scoring) | p95 ≤ 800 ms |
| Signal-Ingest | ≥ 500 Ereignisse/s je Mandant |
| Verfügbarkeit | 99,5 % (Kernzeit 07:00–20:00 MEZ: 99,9 %) |
| Wiederherstellung | RPO ≤ 15 min, RTO ≤ 4 h |
| Hosting | EU-Rechenzentrum, Verschlüsselung ruhend und in Transit |
