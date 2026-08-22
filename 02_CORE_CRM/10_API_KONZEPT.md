# 10 — API-Konzept

## 1. Die API ist der eigentliche Liefergegenstand

Das Kern-CRM wird von sieben späteren Systemen benutzt. Keines davon greift auf
die Datenbank zu. Die API ist damit **der** Vertrag des Moduls — und der einzige
Hebel, mit dem später mehrere Stränge parallel arbeiten können.

```
   Lead Engine ─┐
   Newsletter ──┤
   Partnerportal┤        ┌───────────────────────┐
   Kundenportal ┼───────▶│  /api/v1  (Kern)      │───▶ PostgreSQL
   Power Autom. ┤        │  REST · OpenAPI 3.1   │
   Brevo ───────┤        │  OAuth2 · mTLS        │
   KI-Agenten ──┘        └───────────────────────┘
                              nicht aus dem Internet erreichbar
```

**Erst der Vertrag, dann die Umsetzung.** Steht die OpenAPI-Definition, kann das
Frontend gegen einen Mock bauen und die Integration gegen einen Mock testen,
ohne auf den Kern zu warten. Entsteht der Vertrag erst mit dem Code, kollabieren
sechs parallele Stränge auf einen.

---

## 2. Verbindliche Eigenschaften

| Eigenschaft | Umsetzung |
|---|---|
| Spezifikation | OpenAPI 3.1, aus dem Code erzeugt. Abweichung bricht den Build |
| Version | Im Pfad `/api/v1/`. Brechende Änderungen erzeugen `/v2/`, `/v1/` läuft mit Frist weiter |
| Authentifizierung | OAuth 2.0 / OIDC; zwischen WordPress und Kern zusätzlich gegenseitiges TLS |
| Autorisierung | Rolle **und** Objektbezug, serverseitig, in jedem Aufruf |
| Mandant | Aus dem Token, **nie** aus einem Aufrufparameter |
| Idempotenz | `Idempotency-Key` verpflichtend bei jedem schreibenden Aufruf mit Außenwirkung |
| Gleichzeitigkeit | `If-Match` mit `ETag` bei Vertrag, Kunde, Vorgang |
| Seitenweise Ausgabe | Cursorbasiert, Vorgabe 25, Höchstwert 100 |
| Fehlerformat | RFC 9457 `application/problem+json`, immer mit `correlationId` |
| Nachverfolgung | `X-Correlation-Id` von der Oberfläche bis ins Protokoll |
| Ratenbegrenzung | Je Verbraucher und je Endpunkt |
| Feldauswahl | `?fields=` — spart Last bei Listenansichten |

**Keine generischen Statusänderungen.** Ein Vertrag wechselt seinen Status
ausschließlich über einen benannten Übergang, nie über ein Feld in einem
allgemeinen `PATCH`.

---

## 3. Endpunktkatalog

### 3.1 Personen und Organisationen

| Methode | Pfad | Zweck | Verbraucher |
|---|---|---|---|
| `GET` | `/contacts` | Suchen und filtern | Werkbank, Portale |
| `POST` | `/contacts` | Anlegen | Lead Engine, Werkbank |
| `GET` | `/contacts/{id}` | Einzelabruf | alle |
| `PATCH` | `/contacts/{id}` | Ändern | Werkbank, Kundenportal |
| `GET` | `/contacts/{id}/duplicates` | **Dublettenkandidaten** — Vorschlag, keine Zusammenführung | Werkbank |
| `POST` | `/contacts/{id}/merge-proposal` | Zusammenführung **beantragen** | Werkbank |
| `GET` | `/contacts/{id}/consents` | Einwilligungen je Zweck | Newsletter, Portale |
| `POST` | `/contacts/{id}/consents` | Erteilen oder widerrufen | Lead Engine, Portale |
| `GET` | `/organizations` | Suchen, filterbar nach Rolle | Hubs, Werkbank |
| `POST` | `/organizations` | Anlegen | Werkbank |
| `GET` | `/organizations/{id}/roles` | Rollen und Profile | Hubs |
| `POST` | `/organizations/{id}/roles` | Rolle erteilen | Werkbank |
| `DELETE` | `/organizations/{id}/roles/{role}` | Rolle beenden — setzt `gueltig_bis`, löscht nicht | Werkbank |
| `GET` | `/manufacturers` | Herstellerliste mit Premiumkennzeichen | **Tarifwerk**, Formulare |

### 3.2 Kunden

| Methode | Pfad | Zweck | Verbraucher |
|---|---|---|---|
| `GET` | `/customers` | Suchen | Werkbank |
| `POST` | `/customers` | Anlegen | Werkbank, Lead-Umwandlung |
| `GET` | `/customers/{id}` | Stammdaten | alle |
| `GET` | **`/customers/{id}/dossier`** | **Gebündelte Kundenakte**: Kopf, Übersicht, Kennzahlen in einer Antwort | Werkbank |
| `GET` | `/customers/{id}/timeline` | Verlauf, seitenweise, filterbar | Werkbank |
| `GET` | `/customers/{id}/contacts` | Personen des Kundenverbunds mit Rollen | Werkbank, Portal |
| `GET` | `/customers/{id}/scores` | Werte **mit Faktoren** | Werkbank, KI |
| `POST` | `/customers/{id}/anonymize` | Löschprozess anstoßen | Datenschutzfunktion |

> `/dossier` ist der wichtigste Endpunkt des Moduls. Sieben Einzelaufrufe wären
> das erste, was der Innendienst als „langsam" bemerkt.

### 3.3 Leads

| Methode | Pfad | Zweck | Verbraucher |
|---|---|---|---|
| `GET` | `/leads` | Filtern nach Status, Betreuer, Quelle, Frist | Werkbank, Hubs |
| `POST` | `/leads` | **Anlegen** — der meistgenutzte schreibende Endpunkt | Website, Hubs, LinkedIn, Power Automate |
| `GET` | `/leads/{id}` | Einzelabruf | alle |
| `PATCH` | `/leads/{id}` | Betreuer, Priorität, Notiz | Werkbank |
| `POST` | `/leads/{id}/transitions/qualify` | Qualifizieren | Werkbank |
| `POST` | `/leads/{id}/transitions/convert` | In Kunde umwandeln | Werkbank |
| `POST` | `/leads/{id}/transitions/lose` | Schließen — **Verlustgrund Pflicht** | Werkbank |
| `GET` | `/leads/{id}/attribution` | Rohe und aufgelöste Herkunft | Analytics, Marketing |

### 3.4 Boote

| Methode | Pfad | Zweck | Verbraucher |
|---|---|---|---|
| `GET` | `/boats` | Suchen, filtern | Werkbank, Portale |
| `POST` | `/boats` | Anlegen | Werkbank, Kundenportal, Dealer Hub |
| `GET` | `/boats/{id}` | Einzelabruf | alle |
| `PATCH` | `/boats/{id}` | Ändern | Werkbank, Kundenportal |
| `POST` | `/boats/{id}/transitions/sell` | Als verkauft melden — löst `A-41` aus | Werkbank, Portal |
| `GET` | `/boats/{id}/risk-attributes` | **Tarifrelevante Merkmale in Tarifsprache** | Tarifwerk |
| `GET` | `/boats/without-contract` | Cross-Selling-Liste | Werkbank, Dashboard |

`/risk-attributes` übersetzt zwischen zwei Sprachwelten: Das CRM kennt
`nutzungsart = CHARTER_OHNE_SKIPPER`, das Tarifwerk kennt den Faktor
`CHARTER_OHNE_SKIPPER`. Die Übersetzung findet an der Systemgrenze statt, nicht
im Kopf der Entwickelnden.

### 3.5 Verträge

| Methode | Pfad | Zweck | Verbraucher |
|---|---|---|---|
| `GET` | `/contracts` | Filtern nach Status, Fälligkeit, Versicherer, Vermittler | Werkbank, Maklersicht |
| `POST` | `/contracts` | Anlegen | Werkbank |
| `GET` | `/contracts/{id}` | Kopf **und** geltende Version | alle |
| `GET` | `/contracts/{id}/versions` | Vollständige Historie | Werkbank, Auskunft |
| `POST` | `/contracts/{id}/versions` | **Neue Version** — der einzige Weg, einen Vertrag zu ändern | Werkbank |
| `POST` | `/contracts/{id}/transitions/{code}` | Benannte Übergänge: `activate`, `suspend`, `terminate`, `expire`, `cancel` | Werkbank, Workflow |
| `GET` | `/contracts/{id}/objects` | Versicherte Objekte mit Zeitbezug | Werkbank, Portal |
| `POST` | `/contracts/{id}/objects` | Objekt zuordnen oder beenden | Werkbank |
| `GET` | `/contracts/due-for-renewal` | **Fällig in n Tagen** — Grundlage des Verlängerungslaufs | Workflow, Dashboard |
| `GET` | `/contracts/{id}/coverages` | Deckungen mit Bedingungswerk | Portal, Werkbank |

### 3.6 Aufgaben und Aktivitäten

| Methode | Pfad | Zweck | Verbraucher |
|---|---|---|---|
| `GET` | **`/tasks/my-day`** | **Priorisierte Tagesliste mit Begründung** | Werkbank, Dashboard |
| `GET` | `/tasks` | Filtern | Werkbank, Führung |
| `POST` | `/tasks` | Anlegen — `dublettenschluessel` **Pflicht** | Werkbank, Automatik, Power Automate |
| `PATCH` | `/tasks/{id}` | Zuweisen, verschieben, priorisieren | Werkbank |
| `POST` | `/tasks/{id}/complete` | Erledigen — Ergebnis Pflicht | Werkbank, Power Automate |
| `POST` | `/tasks/{id}/defer` | Wiedervorlage — erzeugt Folgeaufgabe | Werkbank |
| `GET` | `/activities` | Verlauf zu einem Bezug | Werkbank |
| `POST` | `/activities` | Erfassen, optional mit Folgeaufgabe | Werkbank |
| `GET` | `/notes` · `POST` `/notes` | Notizen | Werkbank |

### 3.7 Dokumente

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/documents` | Liste je Bezug, nach Typ gruppiert |
| `POST` | `/documents/upload-url` | **Signierte Upload-Adresse** — der Inhalt läuft nie durch die Anwendung |
| `POST` | `/documents` | Metadaten nach erfolgtem Upload |
| `GET` | `/documents/{id}/download-url` | Signierter Link, ≤ 5 min, an Person und Version gebunden |
| `GET` | `/documents/{id}/versions` | Versionshistorie |
| `POST` | `/documents/{id}/versions` | Neue Version |

### 3.8 Datenschutz

| Methode | Pfad | Zweck |
|---|---|---|
| `POST` | `/privacy/access-requests` | Auskunft beantragen |
| `GET` | `/privacy/access-requests/{id}/export` | Export abrufen — **nach erneuter Autorisierung** |
| `POST` | `/privacy/erasure-requests` | Löschung beantragen |
| `POST` | `/privacy/objections` | Widerspruch, wirkt sofort systemweit |
| `GET` | `/privacy/audit/{entityType}/{entityId}` | Auditauszug |

### 3.9 Suche

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/search?q=` | Übergreifend: Name, Kundennummer, Vertragsnummer, Polizzennummer, Bootsname, Kennzeichen, Rumpfnummer |

Der Innendienst am Telefon sucht nach dem, was der Anrufer nennt — und das ist
oft die Polizzennummer oder der Bootsname, nicht der Nachname.

---

## 4. Ereignisse für Folgemodule

Nachgelagerte Systeme abonnieren Ereignisse, statt zu pollen. Die Namen sind
Verträge und werden nie umbenannt.

| Ereignis | Wer reagiert |
|---|---|
| `lead.eingegangen` | CRM-Scoring, Newsletter (Bestätigung), Partner-Hub |
| `lead.qualifiziert` · `lead.verloren` | Analytics, Partner-Hub |
| `kunde.entstanden` | Newsletter (Onboarding), Analytics |
| `boot.erfasst` · `boot.veraeussert` | CRM-Regeln, Analytics |
| `vertrag.aktiviert` | Newsletter, Partner (Provision), Analytics |
| `vertrag.faellig_in_90_tagen` | Workflow (Verlängerung) |
| `vertrag.gekuendigt` · `vertrag.verlaengert` | Analytics, Rückgewinnung |
| `aufgabe.erzeugt` · `aufgabe.eskaliert` | Power Automate (Teams), Dashboard |
| `einwilligung.widerrufen` | **Newsletter — sofort, ohne Verzögerung** |
| `dokument.abgelegt` | Workflow, KI-Indexierung |

Zustellung über **Outbox**: Fachliche Änderung und Ereignis werden in einer
Transaktion geschrieben. Ein Ausfall von Brevo oder Power Automate kann keinen
Vorgang beschädigen — er verzögert ihn nur.

---

## 5. Was die einzelnen Verbraucher brauchen

| System | Liest | Schreibt | Besonderheit |
|---|---|---|---|
| **Lead Engine** | Produkte, Herstellerliste, Dublettenkandidaten | Leads, Kontakte, Einwilligungen | Höchste Schreiblast. Idempotenzschlüssel Pflicht |
| **Newsletter Engine** | Segmente, Einwilligungen, Widersprüche | Signale, Versandnachweise | **Prüft Einwilligung bei uns, nicht bei Brevo** |
| **Partnerportal** | eigene Empfehlungen mit Status, Provision, Unterlagen | Empfehlungen, Auftragsrückmeldungen | Strikt auf die eigene Organisation begrenzt |
| **Kundenportal** | eigene Verträge, Boote, Dokumente, Vorgänge | Stammdaten, Uploads, Änderungsanträge | Objektbezogene Prüfung bei jedem Aufruf |
| **Power Automate** | Aufgaben, Fristen | Aufgabenerledigung, Freigaben | Nur Vorgangsnummer und Verweis, **keine** Vertragsdetails |
| **Brevo** | — | Rückläufer per Webhook | Signaturgeprüft, dedupliziert, idempotent |
| **KI-Agenten** | alles, **pseudonymisiert** | **nichts** | Eigenes Dienstkonto, technisch nur lesend |
| **Tarifwerk** | `/boats/{id}/risk-attributes`, `/manufacturers` | — | Synchron, < 200 ms |
| **Analytics** | Read Replica und Ereignisse | — | Nie auf Betriebstabellen |

---

## 6. Beispiel — Lead aus einem Formular

```http
POST /api/v1/leads
Authorization: Bearer <token>
Idempotency-Key: web-2026-08-22-8f3c1a94b7e2
Content-Type: application/json

{
  "quelle_detail": "WEBSITE",
  "land": "AT",
  "utm": { "quelle": "google", "medium": "cpc", "kampagne": "kasko-fruehjahr" },
  "roh": { "vorname": "Anna", "nachname": "Beispiel",
           "email": "anna.beispiel@example.at", "telefon": "+436601234567" },
  "produktinteresse": ["KASKO", "HAFTPFLICHT"],
  "boot_angabe": {
    "bootstyp": "SEGELYACHT", "baujahr": 2018,
    "gesamtversicherungssumme": "185000.00",
    "fahrtgebiet": "MITTELMEER", "nutzungsart": "PRIVAT"
  },
  "indikation": { "von": "1210.00", "bis": "1580.00", "waehrung": "EUR" },
  "einwilligungen": [
    { "zweck": "ANGEBOTSBEARBEITUNG", "rechtsgrundlage": "VERTRAG",
      "erteilt": true, "hinweis_version": "2026-01" },
    { "zweck": "UEBERMITTLUNG_VERSICHERER", "rechtsgrundlage": "EINWILLIGUNG",
      "erteilt": true, "hinweis_version": "2026-01" }
  ]
}
```

```http
201 Created
Location: /api/v1/leads/9c2f…

{
  "id": "9c2f…", "leadnummer": "L-AT-2026-004711", "status": "NEU",
  "lead_score": 74,
  "score_faktoren": ["Versicherungssumme über 150.000",
                     "Revier Mittelmeer", "vollständige Angaben"],
  "erstkontakt_frist": "2026-08-22T16:30:00Z",
  "dublettenkandidaten": [
    { "kontakt_id": "3a71…", "uebereinstimmung": "Nachname, PLZ",
      "hinweis": "Vorschlag — keine automatische Zusammenführung" }
  ]
}
```

Drei Dinge fallen auf: Der Score kommt **mit Begründung** zurück, die
Erstkontaktfrist ist bereits berechnet, und Dubletten werden **vorgeschlagen**,
nicht aufgelöst.

---

## 7. Fehlerformat

```http
422 Unprocessable Content
Content-Type: application/problem+json

{
  "type": "https://crm.callidus.example/errors/validation-failed",
  "title": "Die Eingaben sind unvollständig oder ungültig.",
  "status": 422,
  "code": "VALIDATION_FAILED",
  "correlationId": "c-8f3c1a94",
  "errors": [
    { "pointer": "/einwilligungen",
      "rule": "required-consent",
      "message": "Ohne Einwilligung zur Übermittlung an den Versicherer kann die Anfrage nicht bearbeitet werden." }
  ]
}
```

Technische Ursachen erscheinen **nie** in der Antwort. Sie stehen im
Serverprotokoll, verbunden über `correlationId`.

---

## 8. Betrieb der Schnittstelle

| Thema | Festlegung |
|---|---|
| Erreichbarkeit | Nur aus dem privaten Netz. Der Kern hat keine öffentliche Adresse |
| Ratenbegrenzung | Je Dienstkonto; Lead-Anlage großzügiger als Massenabfragen |
| Zeitgrenzen | 2 s für Lesen, 5 s für Schreiben. Danach Abbruch mit klarem Fehler |
| Protokollierung | Jeder Aufruf mit Korrelationskennung, ohne Nutzdaten |
| Verträglichkeit | Neue optionale Felder sind erlaubt; Entfernen oder Umbenennen erzeugt `/v2/` |
| Abkündigung | Mindestens sechs Monate Vorlauf, mit `Deprecation`-Kopfzeile |
| Testumgebung | Vorproduktion mit synthetischen Daten, für jeden Verbraucher zugänglich |
