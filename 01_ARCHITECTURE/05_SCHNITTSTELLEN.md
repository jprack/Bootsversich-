# 05 — Schnittstellen

## 1. Verifikationsstatus

Eine Integration darf erst gebaut werden, wenn ihre Grundlage belegt ist. Bis
dahin steht sie hinter einem Adapter mit Mock.

| Status | Bedeutung |
|---|---|
| `VERIFIZIERT` | Offizielle Dokumentation oder Spezifikation liegt vor, Testzugang vorhanden |
| `ANNAHME` | Fähigkeit ist plausibel dokumentiert, aber nicht erprobt |
| `OFFEN` | Anbieter oder Verfahren noch nicht festgelegt |
| `NICHT ZULÄSSIG` | Technisch möglich, rechtlich oder vertraglich untersagt |

---

## 2. Eigene APIs

### 2.1 Domänenkern → nach innen

`https://core.intern/api/v1/` — **nicht aus dem Internet erreichbar.**

| Bereich | Ressourcen | Verbraucher |
|---|---|---|
| Personen | `/contacts`, `/customers`, `/consents` | WordPress, Portale |
| Netzwerk | `/organizations`, `/organizations/{id}/roles`, `/agreements` | Hubs |
| Objekte | `/boats` | Portale, Dealer Hub |
| Verträge | `/contracts`, `/contracts/{id}/versions`, `/premiums` | Kundenportal, Analytics |
| Vertrieb | `/leads`, `/activities`, `/tasks`, `/opportunities` | CRM-Oberfläche, Hubs |
| Vorgänge | `/cases`, `/cases/{id}/transitions/{code}` | Portale, Workflow |
| Dokumente | `/documents`, `/documents/{id}/versions`, `/documents/{id}/download-url` | Portale |
| Marketing | `/campaigns`, `/newsletters`, `/segments` | Redaktion, Brevo-Konnektor |
| Datenschutz | `/privacy/erasure-requests`, `/privacy/export-requests` | Kundenportal |

**Verbindliche Eigenschaften jeder Ressource:**

| Eigenschaft | Umsetzung |
|---|---|
| Spezifikation | OpenAPI 3.1, aus dem Code erzeugt, Abweichung bricht den Build |
| Version | Im Pfad (`/api/v1/`). Brechende Änderungen erzeugen `/v2/`, `/v1/` läuft mit Frist weiter |
| Authentifizierung | OAuth 2.0 / OIDC, zusätzlich gegenseitiges TLS zwischen WordPress und Kern |
| Autorisierung | Rolle **und** Objektbezug, serverseitig, in jedem Aufruf |
| Idempotenz | `Idempotency-Key` verpflichtend bei jedem schreibenden Aufruf mit Außenwirkung |
| Gleichzeitigkeit | `If-Match` mit `ETag` bei kritischen Datensätzen (Vertrag, Vorgang) |
| Seitenweise Ausgabe | Cursorbasiert, Vorgabe 25, Höchstwert 100 |
| Fehlerformat | RFC 9457 `application/problem+json`, immer mit `correlationId` |
| Nachverfolgung | `X-Correlation-Id` durchgereicht von der Website bis in das Protokoll |
| Ratenbegrenzung | Je Verbraucher und je Endpunkt |

**Keine generischen Statusänderungen.** Ein Vorgang wechselt seinen Zustand
ausschließlich über einen benannten Übergang
(`POST /cases/{id}/transitions/quote-approve`), nie über ein Feld in einem
allgemeinen `PATCH`.

### 2.2 WordPress → nach außen

`https://www.callidus.example/wp-json/callidus/v1/`

| Endpunkt | Zweck | Schutz |
|---|---|---|
| `POST /forms/{slug}/submit` | Formulareingang | Ratenbegrenzung, Bot-Schutz ohne Cookie, Einwilligungspflicht |
| `GET /products` | Produktdaten für Rechner | öffentlich, gecacht |
| `POST /quote/calculate` | Vorschaurechner | Ratenbegrenzung, keine Speicherung ohne Einwilligung |
| `GET /portal/me/*` | Portaldaten | angemeldet, objektbezogen geprüft |
| `POST /webhooks/{provider}` | Rückläufer externer Dienste | Signaturprüfung, Ereigniskennung, Wiedereinspielschutz |

Die WordPress-REST-API von Kern-WordPress (`/wp/v2/`) wird für nicht
angemeldete Zugriffe **eingeschränkt**: Benutzerlisten und Kommentarendpunkte
werden deaktiviert. Beides gibt sonst ohne Not Auskunft über die Organisation.

---

## 3. Fremdsysteme

### 3.1 Brevo — Newsletter und Transaktions-E-Mail

| Feld | Wert |
|---|---|
| **Status** | `ANNAHME` — Produkt dokumentiert, Vertrag und Datenstandort offen (**A-07**) |
| **Richtung** | Beide |
| **Protokoll** | REST/JSON, API-Schlüssel; Rückläufer per Webhook |
| **Hinaus** | Kontakt anlegen und aktualisieren (Teilmenge!), Liste zuordnen, Kampagne auslösen, Transaktionsmail senden |
| **Herein** | Zustellung, Öffnung, Klick, Abmeldung, Beschwerde, Bounce |
| **Übertragene Daten** | E-Mail, Anrede, Vorname, Nachname, Sprache, Segmentmerkmale. **Nicht** übertragen: Geburtsdatum, Adresse, Vertragsdaten, Bootsdaten, Scores |
| **Frequenz** | Ereignisgetrieben, Stapel bei Kampagnen |
| **Kritikalität** | B |
| **Ausfallverhalten** | Aufträge stauen sich in der Warteschlange und laufen nach. Formulare funktionieren weiter. Nach 30 Minuten Störung: Alarm |
| **Besonderheit** | Einwilligung und Widerspruch werden **bei uns** geführt. Vor jedem Versand wird gegen den eigenen Bestand geprüft. Ein Widerspruch, der nur in Brevo stünde, wäre bei einem Anbieterwechsel verloren |

### 3.2 Microsoft Power Automate

| Feld | Wert |
|---|---|
| **Status** | `ANNAHME` — Datenstandort und Umfang offen (**A-07**) |
| **Richtung** | Beide |
| **Protokoll** | HTTP-Trigger mit gemeinsamem Geheimnis und Signaturprüfung; ausgehend über eigene Webhooks |
| **Hinaus** | Freigabeanfrage in Teams, Kalendereintrag, Ablage in SharePoint, Aufgabe in Planner |
| **Herein** | Freigabeergebnis, Erledigungsmeldung |
| **Übertragene Daten** | Vorgangsnummer, Titel, Frist, Verantwortliche Person, **Verweis** auf den Vorgang. Keine Vertragsdetails, keine Dokumentinhalte |
| **Kritikalität** | C |
| **Ausfallverhalten** | Fachlicher Ablauf läuft in M10 weiter; nur die Bürobenachrichtigung entfällt |
| **Abgrenzung** | **Power Automate ist kein Ersatz für M10.** Fristen, Nachweise und Zustandslogik bleiben im Kern. Sonst läge die Prozesswahrheit in einem Werkzeug ohne Versionierung und ohne Audit |

### 3.3 Versicherer / Produktquelle

| Feld | Wert |
|---|---|
| **Status** | `VERIFIZIERT` — dokumentierter E-Mail-Prozess (A-01 geschlossen, ADR-0010) |
| **Kanal** | E-Mail, je Versicherer konfiguriert |
| **Träger** | Mehrere. Vermittlerstatus: Mehrfachagent |
| **Hinaus** | Angebotsanfrage als PDF und CSV, Antragsunterlagen, Änderungen, Kündigungen |
| **Herein** | Angebot, Policierung, Bestandsänderung, Dokumente, Rückfragen |
| **Korrelation** | Eigene Vorgangsnummer in eckigen Klammern am Betreffanfang; zusätzlich `Message-ID` und `In-Reply-To` |
| **Idempotenz** | Schlüssel aus Vorgangsnummer, Versicherer und laufender Nummer |
| **Kritikalität** | A |
| **Ausfallverhalten** | Bei E-Mail gibt es keine Fehlermeldung. **Schweigen ist der Normalfall des Scheiterns** — deshalb erzeugt eine überschrittene Antwortfrist zwingend eine Aufgabe |
| **Untersagt** | Automatisierung eines Versichererportals ohne schriftliche Erlaubnis — `NICHT ZULÄSSIG` |

Vollständige Ausarbeitung: [`11_ANBINDUNG_PRODUKTQUELLE.md`](11_ANBINDUNG_PRODUKTQUELLE.md).

**Die wichtigste Folge:** Es gibt keine Online-Tarifierung. Die Website kann keine
verbindliche Prämie anzeigen. Die Leitkennzahl verschiebt sich von der
Antwortzeit der Schnittstelle zur **Antwortzeit bis zum Angebot** — eine
organisatorische Größe, keine technische.

### 3.3a Posteingang (Rücklauf der Versicherer)

| Feld | Wert |
|---|---|
| **Status** | `VERIFIZIERT` (eigen) |
| **Protokoll** | IMAP, Abholung durch den Worker im Minutentakt |
| **Zuordnung** | 1. Vorgangsnummer im Betreff · 2. `In-Reply-To` · 3. Absender und offene Übermittlung (**Vorschlag**, nie automatisch) · 4. Aufgabe für den Innendienst |
| **Anlagen** | Virenprüfung, SHA-256, Ablage als Dokumentversion. Bis zum Prüfergebnis kein Zugriff |
| **Kritikalität** | A |
| **Verbindlich** | Eine unzuordenbare Mail wird nie stillschweigend verworfen. Die Original-Mail wird ins Dokumentenmanagement überführt — ein Postfach ist kein Archiv |

### 3.4 Signaturdienst

| Feld | Wert |
|---|---|
| **Status** | `OFFEN` (**A-04**) |
| **Kandidaten** | EU-Anbieter mit eIDAS-Konformität |
| **Hinaus** | Dokumentversion, Empfänger, Signaturart |
| **Herein** | Gesendet, geöffnet, signiert, abgelehnt, abgelaufen — per Webhook |
| **Kritikalität** | A ab V2 |
| **Verbindlich** | Webhooks sind signaturgeprüft, dedupliziert und idempotent. Eine Signatur bindet an **genau eine** Dokumentversion. Eine spätere Fassung gilt nie als signiert. Das System behauptet keine qualifizierte Signatur, solange Anbieter und Stufe nicht belegt sind |

### 3.5 Google

| Dienst | Zweck | Status | Anmerkung |
|---|---|---|---|
| Analytics 4 | Reichweitenmessung | `ANNAHME` | Nur nach Einwilligung. Alternative: Matomo im Eigenbetrieb — datenschutzrechtlich deutlich einfacher, siehe [`adr/0007-messung-und-einwilligung.md`](adr/0007-messung-und-einwilligung.md) |
| Ads | Kampagnen, Conversion-Rückmeldung | `ANNAHME` | Serverseitige Conversion-Meldung mit pseudonymisierten Kennungen |
| Business Profile | Standortsichtbarkeit | `ANNAHME` | Für Häfen, Partner, Veranstaltungen |
| Maps | Karten für Standorte und Reviere | `ANNAHME` | Lädt erst nach Einwilligung. Alternative: OpenStreetMap |

### 3.6 LinkedIn

| Feld | Wert |
|---|---|
| **Status** | `ANNAHME` |
| **Zweck** | Reichweite im gewerblichen Umfeld (Charter, Werften, Händler), Lead Gen Forms, Unternehmensseite |
| **Herein** | Lead-Datensätze aus Formularen |
| **Kritikalität** | D |
| **Verbindlich** | Ein Lead Gen Form liefert eine Einwilligung nur, wenn deren Text und Zeitpunkt mitgeliefert und gespeichert werden. Sonst entsteht ein Lead ohne Rechtsgrundlage — und der ist unbrauchbar |

### 3.7 KI-Anbieter

| Feld | Wert |
|---|---|
| **Status** | `ANNAHME` (**A-07**) |
| **Anbieter** | Anthropic Claude, OpenAI — beide hinter derselben Abstraktion, gegeneinander austauschbar |
| **Hinaus** | Pseudonymisierte Texte, Auszüge der Wissensbasis, Aufgabenbeschreibung |
| **Herein** | Entwürfe, Zusammenfassungen, Extraktionsvorschläge mit Sicherheitswert |
| **Kritikalität** | D |
| **Ausfallverhalten** | Zeitgrenze, danach Rückfall auf Vorlage oder Hinweis. Kein Ablauf hängt an einer KI-Antwort |
| **Verbindlich** | Pseudonymisierung vor Übermittlung · keine besonderen Datenkategorien · Protokollierung von Modell, Version, Prompt-Version, Eingabe-Hash und Sicherheitswert · Auftragsverarbeitungsvertrag vor Produktivgang |

---

## 4. Integrationsmuster

### 4.1 Ausgehend: Transactional Outbox

Der klassische Fehler ist, in derselben Handlung die Datenbank zu ändern
**und** ein Fremdsystem aufzurufen. Schlägt der zweite Schritt fehl, ist der
Zustand inkonsistent.

```
1. Fachliche Änderung und Ereignis in EINER Datenbanktransaktion schreiben
   (Ereignis landet in der Tabelle "outbox", nicht bei Brevo)
2. Transaktion bestätigt → die Änderung gilt, das Ereignis ist sicher
3. Ein Versandprozess liest die Outbox und stellt an den Bus zu
4. Der Konnektor ruft das Fremdsystem auf, mit Wiederholung und Rückfall
5. Erfolg wird in der Outbox vermerkt
```

Wirkung: Ein Ausfall von Brevo, Power Automate oder LinkedIn kann keinen
fachlichen Vorgang beschädigen — er verzögert ihn nur.

### 4.2 Eingehend: Webhooks

| Regel | Umsetzung |
|---|---|
| Herkunft | Signaturprüfung mit zeitkonstantem Vergleich |
| Wiedereinspielung | Zeitfenster **und** gespeicherte Ereigniskennung |
| Idempotenz | Eindeutiger Index auf `(anbieter, externe_ereignis_id)`; ein bekanntes Ereignis wird protokolliert, aber nicht erneut angewendet |
| Reihenfolge | Ereignisse tragen einen Zeitstempel der Gegenseite; ein älteres Ereignis überschreibt nie einen neueren Zustand |
| Antwort | `2xx` erst nach dauerhafter Speicherung; die Verarbeitung läuft danach asynchron |
| Unbekannte Ereignisse | Werden gespeichert und ignoriert, nicht als Fehler beantwortet — sonst wiederholt der Anbieter endlos |

### 4.3 Wiederholung und Ausfall

| Fehlerart | Verhalten |
|---|---|
| Netzwerk, Zeitüberschreitung, `5xx` | Wiederholung mit wachsendem Abstand (1s, 4s, 15s, 1min, 5min, 30min), begrenzt |
| `429` Ratenbegrenzung | Wartezeit gemäß `Retry-After` beachten |
| `4xx` außer `429` | **Keine** Wiederholung. Fachlicher Fehler, erzeugt eine Aufgabe für einen Menschen |
| Dauerhafter Ausfall | Nach fünf Fehlschlägen: Dead-Letter-Warteschlange, Alarm, Aufgabe |
| Fremdsystem instabil | Circuit Breaker: nach einer Fehlerquote von 50 % über eine Minute wird für fünf Minuten nicht mehr angefragt |

### 4.4 Kennungszuordnung

Jeder Konnektor führt eine eigene Zuordnungstabelle:

```
externe_zuordnung
    system            'brevo' | 'power_automate' | 'linkedin' | 'versicherer_x'
    interne_entitaet  'kontakt' | 'kampagne' | 'vorgang'
    interne_id        uuid
    externe_id        text
    zuletzt_abgeglichen
    UNIQUE (system, interne_entitaet, interne_id)
    UNIQUE (system, externe_id)
```

Damit bleibt der Domänenkern frei von Fremdkennungen, und ein Anbieterwechsel
betrifft genau eine Tabelle.

---

## 5. Übersicht aller Schnittstellen

| # | System | Richtung | Protokoll | Kritikalität | Status | Rückfall |
|---|---|---|---|---|---|---|
| 1 | WordPress ↔ Domänenkern | beide | REST, mTLS | A | `VERIFIZIERT` (eigen) | Wartungsseite |
| 2 | Identitätsanbieter | beide | OIDC | A | `VERIFIZIERT` (eigen) | keiner — Anmeldung entfällt |
| 3 | Objektspeicher | beide | S3 | A | `VERIFIZIERT` | kein Dokumentzugriff |
| 4 | Versicherer / Produktquelle | beide | E-Mail (SMTP) | A | `VERIFIZIERT` | Anruf, Fristaufgabe |
| 4a | Posteingang Rücklauf | herein | IMAP | A | `VERIFIZIERT` | manuelle Sichtung des Postfachs |
| 5 | Signaturdienst | beide | REST + Webhook | A (V2) | **`OFFEN`** | manuelle Signatur |
| 6 | Brevo | beide | REST + Webhook | B | `ANNAHME` | Warteschlange, Nachlauf |
| 7 | Zahlungsdienst | beide | REST + Webhook | A (V2) | **`OFFEN`** | Versichererinkasso |
| 8 | Power Automate | beide | HTTP-Trigger | C | `ANNAHME` | Aufgabe im CRM |
| 9 | Google Analytics / Ads | hinaus | JS + REST | C | `ANNAHME` | Eigene Messung |
| 10 | Google Maps | hinaus | JS | D | `ANNAHME` | OpenStreetMap |
| 11 | LinkedIn | beide | REST | D | `ANNAHME` | manueller Export |
| 12 | Claude / OpenAI | hinaus | REST | D | `ANNAHME` | Vorlage statt Entwurf |
| 13 | Virenprüfung | hinaus | TCP | B | `VERIFIZIERT` | Upload gesperrt |
| 14 | Fehler- und Metrikdienste | hinaus | REST | D | `VERIFIZIERT` | lokale Protokolle |
