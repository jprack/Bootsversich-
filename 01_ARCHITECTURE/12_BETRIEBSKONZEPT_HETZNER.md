# 12 — Betriebskonzept: Hetzner

| Feld | Wert |
|---|---|
| Betrifft | Offener Punkt **A-03**, jetzt entschieden |
| Anbieter | **Hetzner Online**, Standorte Nürnberg / Falkenstein / Helsinki |
| Ausbaustufe | V1 |
| Datenresidenz | EU/EWR, deutscher Betreiber ohne Drittlandbezug |

---

## 1. Warum die Entscheidung gut passt

| Punkt | Wirkung |
|---|---|
| Deutscher Betreiber, deutsche Rechenzentren | Die Drittlandbewertung entfällt vollständig. Das ist der größte einzelne Vorteil gegenüber AWS oder Azure und spart in der Datenschutzprüfung erhebliche Zeit |
| Preis-Leistung | Der V1-Rahmen aus Kapitel 09 (400–900 € im Monat) ist bei Hetzner komfortabel eingehalten |
| Feste IPv4 je Server | Erforderlich für die E-Mail-Zustellbarkeit und für Freischaltungen bei Versicherern |
| Private Netze | Der Domänenkern ist ohne Internetzugang betreibbar, wie in Kapitel 01 gefordert |
| S3-kompatibler Objektspeicher | Deckt den Dokumentenspeicher aus M9 ab |

---

## 2. Was Hetzner **nicht** liefert — und wie das aufgefangen wird

Das ist der wichtigere Teil dieses Kapitels. Kapitel 02 ging von „Managed
PostgreSQL" aus. Diese Annahme trägt bei Hetzner nicht.

| Fehlt | Folge | Kompensation |
|---|---|---|
| **Managed PostgreSQL** | Betrieb, Aktualisierung, Sicherung und Wiederherstellung liegen bei euch | Eigener Datenbankserver mit dedizierten vCPU; `pgBackRest` mit Point-in-Time-Recovery; feste Wartungsfenster; Betriebsaufwand einplanen (siehe §7) |
| **Managed Redis** | dito | Redis auf dem Kernserver, Persistenz aktiviert. Unkritisch: Redis hält nur Cache und Warteschlangenzustand |
| **Unveränderliche Sicherungen** | Snapshots und Backups liegen im selben Konto. Ein übernommenes Konto löscht beides | **Dritte Kopie außerhalb des Kontos.** Zu prüfen, ob der Hetzner-Objektspeicher Object Lock bietet; falls nicht, verschlüsselte Kopie zu einem zweiten EU-Anbieter mit WORM-Fähigkeit |
| **Managed Kubernetes** | Der V2-Pfad aus Kapitel 09 ist so nicht verfügbar | Entscheidung vertagen. Optionen für V2: `k3s` im Eigenbetrieb, oder für die Orchestrierung zu einem anderen EU-Anbieter wechseln. **Kein Grund, V1 zu ändern** |
| **Ausgehender Port 25 standardmäßig** | Bei Hetzner Cloud ist ausgehendes SMTP zunächst gesperrt (Freischaltung auf Anfrage) | Siehe §5 — der E-Mail-Weg braucht ohnehin eine eigene Entscheidung |

> Keiner dieser Punkte spricht gegen Hetzner. Sie verschieben Arbeit vom Preis
> in den Betrieb. Das ist bei dieser Größenordnung vertretbar — aber es muss
> jemand tun, und dieser Jemand muss benannt sein.

---

## 3. Aufbau V1

```
                        Internet
                            │
                   ┌────────▼────────┐
                   │ Cloud Firewall  │  nur 80/443 + SSH aus Verwaltungsnetz
                   └────────┬────────┘
                            │
        ┌───────────────────▼───────────────────┐
        │  web-01        öffentliche IPv4/IPv6   │
        │  Nginx · PHP-FPM 8.3 · WordPress MU    │
        │  MariaDB (nur Inhalte) · Redis (Cache) │
        └───────────────────┬───────────────────┘
                            │  privates Netz 10.0.0.0/16
                            │  keine öffentliche Route
        ┌───────────────────▼───────────────────┐
        │  core-01       KEINE öffentliche IP    │
        │  Symfony API · Worker · RabbitMQ       │
        │  Redis (Queue) · Mail-Abholung IMAP    │
        └───────────────────┬───────────────────┘
                            │
        ┌───────────────────▼───────────────────┐
        │  db-01         KEINE öffentliche IP    │
        │  PostgreSQL 16 · dedizierte vCPU       │
        │  pgBackRest                            │
        └───────────────────┬───────────────────┘
                            │
        ┌───────────────────▼───────────────────┐
        │  Object Storage (S3)  privat, versioniert│
        │  crm-documents · crm-backups            │
        └────────────────────────────────────────┘
```

### Ausgangsgrößen

Bewusst als Ausgangsgröße bezeichnet, nicht als Endstand — bei Hetzner ist
Hochskalieren eine Sache von Minuten.

| Server | Typ | Begründung |
|---|---|---|
| `web-01` | 4–8 vCPU, 16 GB, gemeinsam genutzte vCPU genügt | PHP-Last ist stoßweise und gut cachebar |
| `core-01` | 4 vCPU, 8 GB | API und Worker; wächst mit der Zahl der Vorgänge, nicht der Besucher |
| `db-01` | **dedizierte vCPU**, 16 GB, NVMe | Eine Datenbank auf gemeinsam genutzten vCPU liefert unvorhersagbare Antwortzeiten. Das ist der eine Posten, an dem nicht gespart wird |

### Netz und Zugriff

| Regel | Umsetzung |
|---|---|
| `core-01` und `db-01` ohne öffentliche IP | Erreichbar nur über das private Netz |
| Verwaltungszugang | Über einen Sprungpunkt oder WireGuard, nie direkt aus dem Internet |
| SSH | Nur Schlüssel, kein Passwort, kein `root`-Login |
| Firewall | Standardmäßig alles verboten, einzelne Regeln erlauben |
| Zwischen web und core | Zusätzlich gegenseitiges TLS, wie in Kapitel 02 festgelegt |
| Zwei Umgebungen | `produktion` und `vorproduktion` in **getrennten Projekten**, nicht nur getrennten Servern — sonst reicht ein Fehlgriff |

---

## 4. Datenbank im Eigenbetrieb

| Thema | Festlegung |
|---|---|
| Version | PostgreSQL 16, Aktualisierung im Wartungsfenster |
| Sicherung | `pgBackRest` in den Objektspeicher: Vollsicherung täglich, fortlaufende Archivierung für Point-in-Time-Recovery |
| Wiederherstellungsziele | RPO 15 Minuten, RTO 1 Stunde (Kapitel 08) — **muss belegt werden, nicht behauptet** |
| Zugriff | Die Anwendungsrolle ist kein Superuser. Row Level Security ist aktiv. `UPDATE` und `DELETE` auf dem Auditprotokoll sind entzogen |
| Verschlüsselung | Verschlüsselte Volumes; zusätzlich Feldverschlüsselung für die Schutzklasse K4 |
| Überwachung | Verbindungszahl, Sperren, langsame Abfragen, Alter der letzten Sicherung |
| Replik | Erst ab V2. In V1 gibt es nichts, was sie zu tun hätte |

### Der Punkt, der übersehen wird

Eine Sicherung, die nie zurückgespielt wurde, ist keine Sicherung. Bei
selbst betriebener Datenbank gilt das doppelt, weil niemand sonst zuständig ist.
**Erste Wiederherstellungsprobe gehört in Welle 0**, nicht in die Betriebsphase.

---

## 5. E-Mail — der kritische Punkt

Durch die Entscheidung zu A-01 ist E-Mail kein Nebenkanal mehr, sondern der
Geschäftsprozess (Kapitel 11). Das verändert die Anforderungen deutlich.

### Drei Mailwege, die zu trennen sind

| Weg | Inhalt | Anforderung | Empfehlung |
|---|---|---|---|
| **Vorgangsmails an Versicherer** | personenbezogene Antragsdaten | Zustellbarkeit, erzwungenes TLS, Nachweisbarkeit, Aufbewahrung | **Eigener Transaktionsweg mit Auftragsverarbeitungsvertrag und EU-Standort** |
| **Transaktionsmails an Kunden** | Bestätigungen, Portalhinweise, Erinnerungen | Zustellbarkeit | Derselbe Weg wie oben |
| **Marketing-Newsletter** | Kampagnen | Zustellbarkeit, Abmeldeverwaltung | Brevo |

**Empfehlung: Marketing und Vorgangsmails trennen.** Marketing-Zustellbarkeit ist
schwankend — eine schlechte Kampagne beschädigt die Absenderreputation. Wenn
darüber auch die Angebotsanfragen laufen, beschädigt sie den Geschäftsprozess.
Getrennte Absenderdomänen oder Subdomänen (`mail.` für Marketing, `vorgang.` für
Geschäftsmails) trennen die Reputation sauber.

Zusätzlich datenschutzrechtlich: Antragsdaten über den Marketingdienstleister zu
schicken, erweitert dessen Auftragsverarbeitung erheblich. Getrennte Wege halten
den Umfang klein.

> **Neuer offener Punkt A-09:** Auswahl des Versandwegs für Vorgangsmails —
> Transaktionsdienst mit AVV und EU-Standort, oder eigener Relay mit
> freigeschaltetem Port 25. Zu entscheiden vor Welle 2.

### Verpflichtend, unabhängig vom Weg

| Maßnahme | Grund |
|---|---|
| SPF, DKIM und DMARC vollständig eingerichtet | Ohne diese landen Angebotsanfragen im Spam des Versicherers — und niemand merkt es |
| DMARC zunächst auf `p=none` mit Berichten, dann verschärfen | Erst messen, dann durchsetzen |
| Getrennte Absenderdomäne oder Subdomäne je Weg | Reputationstrennung |
| Postfach für den Rücklauf beim Mailanbieter, nicht selbst gebaut | Spamabwehr und Verfügbarkeit sind kein Nebenprojekt |
| Zugriff auf das Postfach über ein Dienstkonto | Der Prozess darf nicht an einer Person hängen |
| Überwachung: Zustellrate, Bounces, Alter der ältesten unverarbeiteten Mail | Schweigen ist bei E-Mail der Normalfall des Scheiterns |

---

## 6. Sicherungen und der Ernstfall

| Ebene | Umsetzung |
|---|---|
| Datenbank | `pgBackRest` in den Objektspeicher, PITR |
| Objektspeicher | Versionierung aktiviert |
| Server | Hetzner-Snapshots als Bequemlichkeit, **nicht** als Sicherungsstrategie |
| Konfiguration | Vollständig als Code im Repository — ein Server muss aus dem Nichts neu entstehen können |
| Geheimnisse | Eigener Speicher mit eigener Sicherung, getrennt vom Rest |
| **Dritte Kopie** | Verschlüsselt, außerhalb des Hetzner-Kontos, unveränderlich |

### Warum die dritte Kopie nicht verhandelbar ist

Snapshots, Backups und Objektspeicher liegen im selben Konto. Wer das Konto
übernimmt, löscht alle drei in wenigen Minuten. Genau darauf zielen
Verschlüsselungsangriffe. Eine Kopie außerhalb des Kontos ist der einzige Schutz,
der diesen Fall abdeckt — alles andere ist Schutz vor Festplattenausfall, und der
ist heute nicht das Problem.

Zusätzlich: **Zwei-Faktor-Anmeldung für das Hetzner-Konto selbst**, getrennte
Zugangsdaten für Sicherungen, und kein API-Token mit Vollzugriff in der
Auslieferungskette.

---

## 7. Was jetzt bei euch liegt

Selbstbetrieb ist eine bewusste Entscheidung mit einem Preis in Arbeitszeit.
Ehrlich beziffert:

| Aufgabe | Rhythmus | Aufwand |
|---|---|---|
| Betriebssystem- und Sicherheitsaktualisierungen | wöchentlich | 1 h |
| PostgreSQL-Pflege und Überwachung | monatlich | 1–2 h |
| Sicherung prüfen, einzelne Wiederherstellung | monatlich | 1 h |
| Vollständige Wiederherstellungsprobe | vierteljährlich | 4 h |
| Zertifikate, DNS, Mailreputation | monatlich | 1 h |
| Störungen | unregelmäßig | Bereitschaft erforderlich |

**Rund 4–6 Stunden im Monat im Normalbetrieb**, plus Bereitschaft. Das ist bei
AWS oder Azure geringer, dort aber mit Drittlandbewertung und höheren Kosten
erkauft. Die Entscheidung ist stimmig — sie braucht nur eine benannte
verantwortliche Person. Ohne diese Person verfällt der Betrieb still, und man
merkt es an dem Tag, an dem man die Sicherung braucht.

---

## 8. Reihenfolge der Einrichtung

Empfohlene Abfolge für Welle 0 — jeder Schritt ist einzeln prüfbar:

| # | Schritt | Fertig, wenn |
|---|---|---|
| 1 | Zwei Projekte anlegen: `produktion`, `vorproduktion`. Zwei-Faktor-Anmeldung aktivieren | Kein Zugang ohne zweiten Faktor |
| 2 | Privates Netz und Firewall anlegen, Standardregel „alles verboten" | Ein neuer Server ist ohne Regel nicht erreichbar |
| 3 | `db-01` mit dedizierten vCPU, PostgreSQL 16, ohne öffentliche IP | Erreichbar nur aus dem privaten Netz |
| 4 | Objektspeicher: `crm-documents` und `crm-backups`, beide privat, versioniert | Öffentlicher Abruf schlägt fehl |
| 5 | `pgBackRest` einrichten, **erste Wiederherstellung nach `vorproduktion` durchführen** | Gemessene Wiederherstellungszeit liegt vor |
| 6 | Dritte Sicherungskopie außerhalb des Kontos | Kopie existiert und ist lesbar |
| 7 | `core-01`, ohne öffentliche IP | API antwortet aus dem privaten Netz |
| 8 | `web-01` mit öffentlicher IP, TLS, Sicherheitskopfzeilen | Externe Prüfung der TLS-Konfiguration ohne Befund |
| 9 | DNS, SPF, DKIM, DMARC für alle Absenderdomänen | Testmail wird bei einem großen Anbieter zugestellt und geprüft |
| 10 | Postfach für den Rücklauf, Abholung durch `core-01` | Testmail erscheint als Vorgang |
| 11 | Überwachung und Alarmierung, externe Verfügbarkeitsprüfung | Ein abgeschalteter Dienst löst innerhalb von 5 Minuten Alarm aus |
| 12 | Sprungpunkt oder WireGuard für den Verwaltungszugang | Direkter SSH-Zugang aus dem Internet ist nicht möglich |

Schritt 5 und 6 vor Schritt 7: **Bevor die erste echte Person im System ist,
muss die Wiederherstellung nachgewiesen sein.** Danach findet man nie wieder
Zeit dafür.

---

## 9. Was sich gegenüber Fassung 1.0 ändert

| Dokument | Änderung |
|---|---|
| `02_TECHNOLOGIESTACK.md` | Hosting festgelegt; „Managed PostgreSQL" entfällt und wird zu Eigenbetrieb |
| `08_SICHERHEITSARCHITEKTUR.md` | Datenresidenz für Anwendung, Datenbank, Objektspeicher und Sicherungen ist geklärt; Drittlandbewertung entfällt für diese Ebene |
| `09_SKALIERUNG.md` | V2-Pfad über Managed Kubernetes ist bei Hetzner nicht verfügbar — Entscheidung vertagt, V1 unverändert |
| `10_ROADMAP.md` | Welle 0 erhält die Schrittfolge aus §8 |
