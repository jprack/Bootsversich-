# Sicherheitsmodell

Orientierung: OWASP ASVS. Die folgenden Festlegungen sind verbindlich für jeden
Slice; ein Slice gilt erst als fertig, wenn seine Endpunkte diesen Regeln
genügen.

## 1. Authentifizierung

| Regel | Umsetzung |
|---|---|
| Keine eigene Passwort-Kryptografie | OIDC-Provider (lokal Keycloak, produktiv konfigurierbar) |
| MFA für Agent und Administrator | im Provider erzwungen, Anwendung prüft `amr`/`acr` |
| Sitzungen | serverseitig prüfbar, kurze Access-Token-Laufzeit, Rotation der Refresh-Token |
| Abmeldung | invalidiert Sitzung serverseitig, nicht nur clientseitig |
| Brute-Force | Rate Limiting am Edge **und** in der Anwendung, Sperrzeiten pro Konto und IP |
| Magic Link | einmalig verwendbar, ≤ 30 Minuten gültig, an genau einen Vorgang und Zweck gebunden, nur Hash gespeichert, Verbrauch auditiert |

## 2. Autorisierung

Drei Stufen, alle **serverseitig**:

1. **Rolle** — darf diese Rolle diese Operation grundsätzlich? (`@RequirePermission`)
2. **Objektbezug** — gehört das konkrete Objekt zum Zugriffsbereich? (Kunde sieht nur eigene Vorgänge, Agent nur zugewiesene oder Team-Vorgänge)
3. **Zustand** — erlaubt der aktuelle Status diesen Übergang? (Statusmaschine)

| Anti-Pattern | Ersatz |
|---|---|
| Schaltfläche ausblenden statt prüfen | Prüfung im Controller **und** im Use Case |
| `PATCH /cases/:id { status }` | benannte Übergänge, z. B. `POST /cases/:id/approve-quote` |
| `findUnique({ id })` ohne Zugriffsfilter | Repository-Methoden nehmen immer den Zugriffskontext entgegen |
| Rohes DTO in `prisma.update(data)` | explizite Feldauswahl, kein Mass Assignment |

**IDOR:** Fremde Objekte liefern `404`, nicht `403`, wenn schon die Existenz
eine Information wäre. Jeder Fehlzugriff erzeugt einen Audit-Eintrag.

## 3. Eingaben und Ausgaben

| Bedrohung | Maßnahme |
|---|---|
| SQL Injection | ausschließlich parametrisierte Abfragen über Prisma; `$queryRawUnsafe` ist per Lint-Regel verboten |
| XSS | React-Escaping, kein `dangerouslySetInnerHTML`, strikte Content-Security-Policy |
| CSRF | `SameSite=Lax`-Cookies, zusätzlicher Token bei zustandsändernden Formularrouten |
| SSRF | keine benutzerdefinierten URLs im Serverabruf; ausgehende Ziele stammen aus der Konfiguration, Allowlist |
| Mass Assignment | Zod-Schema an jeder Grenze, `strict()` — unbekannte Felder werden abgelehnt |
| Offene Weiterleitung | Redirect-Ziele nur aus Allowlist |

## 4. Dokumente

| Regel | Umsetzung |
|---|---|
| Kein Bucket öffentlich | Zugriff ausschließlich über signierte URLs |
| Downloadlink | ≤ 5 Minuten gültig, an Person und Dokumentversion gebunden, jeder Abruf auditiert |
| Upload | MIME-Type-Allowlist, Größenlimit, Prüfung des Inhalts, nicht nur der Endung |
| Malware | Scan vor Freigabe; bis zum Ergebnis Status `SCAN_PENDING`, kein Download möglich |
| Integrität | SHA-256 bei Upload, Prüfung vor Signatur und vor Übermittlung |
| Verschlüsselung | serverseitig im Storage, Transport ausschließlich TLS |
| Datenbank | nur Metadaten — niemals Base64-Inhalte |

## 5. Webhooks

| Regel | Umsetzung |
|---|---|
| Herkunft | Signaturprüfung mit konstanter Zeitvergleichsfunktion |
| Wiedereinspielung | Zeitstempelfenster + gespeicherte Ereignis-ID |
| Idempotenz | eindeutiger Index auf `(provider, externalEventId)`; doppelte Ereignisse werden protokolliert, aber nicht erneut angewendet |
| Reihenfolge | Ereignisse tragen Sequenz oder Zeitstempel; veraltete Zustände werden verworfen |
| Fehler | Antwort `2xx` erst nach dauerhafter Speicherung; Verarbeitung asynchron |

## 6. Protokollierung

| Regel | Umsetzung |
|---|---|
| Format | strukturiertes JSON mit `correlationId` |
| Maskierung | E-Mail, Telefon, Adresse, Dokumentnamen werden maskiert |
| Verboten im Log | Passwörter, Tokens, vollständige Bankdaten, Dokumentinhalte, Gesundheitsangaben |
| Telemetrie | keine personenbezogenen Daten in Metriken oder Fehlertracking |
| Audit | eigener, unveränderlicher Kanal — nicht dieselbe Senke wie technische Logs |

## 7. Unveränderlichkeit des Audit-Protokolls

- Die Anwendungsrolle in der Datenbank besitzt auf `AuditEvent` ausschließlich
  `INSERT` und `SELECT`. `UPDATE` und `DELETE` werden per `GRANT` entzogen und
  zusätzlich durch einen Trigger blockiert.
- Löschung erfolgt ausschließlich über einen getrennten Aufbewahrungsprozess mit
  eigener Rolle und eigenem Protokoll.

## 8. Secrets

| Regel | Umsetzung |
|---|---|
| Keine Secrets im Repository | `.env.example` enthält ausschließlich Platzhalter; Secret-Scan in CI |
| Herkunft | Umgebungsvariablen oder Secret Store, beim Start validiert |
| Rotation | Provider-Zugangsdaten und Webhook-Geheimnisse sind rotierbar ohne Codeänderung |
| Fehlender Wert | Anwendung startet **nicht** mit unsicherem Standardwert |

## 9. HTTP-Härtung

`Strict-Transport-Security`, `Content-Security-Policy` (keine Inline-Skripte),
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`X-Frame-Options: DENY`, restriktives CORS mit expliziter Ursprungsliste,
`Permissions-Policy` ohne unnötige Fähigkeiten.

## 10. Automatisierte Entscheidungen

Eine automatische Prüfung darf **nie** allein zu einer für den Kunden
nachteiligen Entscheidung führen. `fail` und `warning` erzeugen eine Aufgabe und
den Status `MANUAL_REVIEW_REQUIRED`. Die entscheidende Person, der Zeitpunkt und
die Begründung werden gespeichert.
