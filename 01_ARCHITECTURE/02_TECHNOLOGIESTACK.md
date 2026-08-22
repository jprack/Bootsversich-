# 02 — Technologiestack

Jede Festlegung nennt die geprüfte Alternative und den Grund der Entscheidung.
Wo eine Entscheidung noch aussteht, steht das ausdrücklich da.

---

## 1. Frontend

### 1.1 Öffentliche Websites und Portale

| Baustein | Festlegung | Alternative | Warum so |
|---|---|---|---|
| CMS | **WordPress 6.x, Multisite** | Einzelinstallationen je Land | Eine Codebasis, eine Aktualisierung, gemeinsame Benutzerverwaltung; Länder und Marken als Sites. |
| Theme | **Eigenes Block-Theme** (`callidus-theme`, Full Site Editing) | Gekauftes Theme | Gekaufte Themes bringen Code mit, den niemand verantwortet — bei einer Plattform mit Personendaten inakzeptabel. |
| PHP | **8.3** | 8.2 | Typisierte Konstanten, `readonly`-Klassen, bessere Fehlermeldungen; Supportzeitraum passt zur Roadmap. |
| Mehrsprachigkeit | **Multisite je Land** + `WPML` oder `Polylang` je Site | Übersetzungsdienst im Kern | Recht, Produkte und Preise unterscheiden sich je Land — Sprache allein trennt nicht ausreichend. |
| Interaktive Bereiche | **React-Inseln** (`@wordpress/scripts`, TypeScript strict) | Vollständiges SPA | Rechner, Portaltabellen und Dashboards brauchen echtes Frontend. Der Rest bleibt serverseitig gerendert — gut für Suchmaschinen und Ladezeit. |
| Styling | **Design Tokens + SCSS**, Ausgabe als Theme-JSON | Utility-Framework | Tokens gelten für WordPress-Blöcke, React-Inseln und E-Mail-Vorlagen gleichermaßen. |
| Barrierefreiheit | **WCAG 2.2 AA** verbindlich | „später" | Öffentliche Stellen und große Anbieter sind in AT/DE zunehmend verpflichtet; Nachrüsten ist teurer als Einbauen. |
| Formulare | **Eigene Formular-Engine als Plugin** | Gravity Forms, WPForms | Einwilligungstexte, Versionierung, Prüfpfad und Weitergabe an den Kern sind Fachlogik, keine Konfiguration. Siehe [`adr/0005-eigene-formular-engine.md`](adr/0005-eigene-formular-engine.md). |

### 1.2 Leistung

| Maßnahme | Ziel |
|---|---|
| Full Page Cache (Nginx FastCGI oder Varnish) | Öffentliche Seiten ohne PHP-Ausführung ausliefern |
| Object Cache (Redis) | Wiederholte Abfragen und API-Antworten zwischenspeichern |
| Bildverarbeitung (WebP/AVIF, responsive Größen) | Bootsbilder sind der größte Ladeanteil |
| CDN mit EU-PoPs | Statische Auslieferung nah am Nutzer |
| Kennzahl | Largest Contentful Paint < 2,0 s auf Mobilgerät im 4G-Profil |

**Nicht gecacht werden** Portalseiten und alles hinter einer Anmeldung. Das ist
keine Optimierungslücke, sondern Absicht: ein Cache-Treffer über
Sitzungsgrenzen hinweg wäre ein Datenschutzvorfall.

---

## 2. Backend

### 2.1 WordPress-Plugins (Plattformschicht)

| Plugin | Aufgabe |
|---|---|
| `callidus-core-bridge` | HTTP-Client zum Domänenkern, Wiederholungen, Zeitgrenzen, Cache, Fehlerübersetzung |
| `callidus-identity` | OIDC-Anmeldung, Zuordnung Kern-Identität ↔ WP-Benutzer, Rollen-Mapping |
| `callidus-forms` | Formulardefinitionen, Einwilligungen, Validierung, Übergabe an den Kern |
| `callidus-portal` | Portalansichten für Kunde, Händler, Club, Partner |
| `callidus-content` | Inhaltstypen für Marketing: Produkte, Ratgeber, Standorte, Veranstaltungen |
| `callidus-analytics` | Einwilligungsgesteuerte Messung, serverseitige Ereignisse |

**Regeln für alle Plugins:** PSR-12, Composer-Autoloading, eigene Tabellen mit
Präfix `cal_` statt `wp_postmeta`, keine direkte Datenbankverbindung zum
Domänenkern, vollständige Deinstallationsroutine.

### 2.2 Domänenkern

| Baustein | Festlegung | Alternative | Warum so |
|---|---|---|---|
| Sprache und Rahmenwerk | **PHP 8.3 mit Symfony 7 (LTS)** | Node.js/NestJS, Java/Spring | Eine Sprache für WordPress-Plugins und Kern senkt Betriebs-, Werkzeug- und Personalaufwand erheblich. Symfony bringt Messenger, Workflow, Security und Validator mit. Siehe [`adr/0002-symfony-als-domaenenkern.md`](adr/0002-symfony-als-domaenenkern.md). |
| Aufbau | **Modularer Monolith**, Modulgrenzen im Code erzwungen (`deptrac`) | Microservices je Modul | Elf Dienste zu betreiben kostet mehr, als es an Entkopplung bringt. Herauslösen bleibt möglich, wenn ein Grund entsteht. |
| API | **REST/JSON**, OpenAPI 3.1 erzeugt, Version im Pfad (`/api/v1/`) | GraphQL | Die Verbraucher sind wenige und bekannt. REST ist einfacher zu cachen, zu protokollieren und abzusichern. |
| Zustandsmaschinen | **Symfony Workflow**, Übergänge als Daten | Statusfeld mit `if` | Übergänge, Rechte und Nebenwirkungen werden prüfbar und testbar. |
| Asynchrone Verarbeitung | **Symfony Messenger** auf **RabbitMQ** | Redis-Queue | Verlässliche Zustellung, Dead Letter, Prioritäten. Redis bleibt Cache. |
| Zeitsteuerung | **Scheduler im Kern** (nicht `wp-cron`) | `wp-cron` | `wp-cron` hängt an Seitenaufrufen und ist für Verlängerungsläufe ungeeignet. |
| Validierung | Schemata **einmal** definiert, für Kern und Formular-Engine nutzbar | Doppelte Pflege | Verhindert, dass Website und Kern verschiedene Regeln anwenden. |

### 2.3 Grenzen der Verantwortung

```
Browser ──HTTPS──▶ WordPress ──HTTPS + mTLS──▶ Domänenkern ──▶ PostgreSQL
                       │                            │
                       │                            ├──▶ RabbitMQ ──▶ Worker
                       │                            └──▶ Objektspeicher
                       └──▶ MariaDB (nur Inhalte)
```

Der Domänenkern ist **nicht** aus dem Internet erreichbar. Zugriff
ausschließlich aus dem privaten Netz, zusätzlich mit gegenseitiger
TLS-Authentifizierung zwischen WordPress und Kern.

---

## 3. Datenbank

| Datenbank | Verwendung | Begründung |
|---|---|---|
| **PostgreSQL 16** | System of Record des Domänenkerns | Row Level Security für Mandantentrennung, `jsonb` für produktspezifische Daten, `numeric` für Geldbeträge, ausgereifte Replikation und Point-in-Time-Recovery. Das vorhandene Modul `01_CRM_ENGINE` setzt bereits darauf auf. |
| **MariaDB 11** (oder MySQL 8) | WordPress-Inhalte | Vorgabe der Plattform. Enthält ausschließlich Inhalte, keine Fachdaten. |
| **Redis 7** | Objekt-Cache, Sitzungen, Ratenbegrenzung, kurzlebige Sperren | Schnell, einfach, ersetzbar. |
| **RabbitMQ 4** | Ereignisse und Aufträge | Zustellgarantien, Dead-Letter-Warteschlangen. |
| **Objektspeicher (S3-kompatibel, EU)** | Dokumentinhalte, Bilder, Exportpakete | Binärdaten gehören nicht in eine relationale Datenbank. |
| **pgvector** (Erweiterung in PostgreSQL) | Wissensbasis der KI, ab V2 | Kein zusätzliches System für den erwarteten Umfang. Bei starkem Wachstum ablösbar. |
| **OpenSearch** | Volltext- und Facettensuche für den Bootsmarkt, ab V2 | PostgreSQL-Volltext genügt für V1, nicht für Marktplatzsuche mit Filtern. |
| **Data Warehouse** (PostgreSQL-Replica + `dbt`, ab V3 ClickHouse) | Auswertung | Trennt Auswertungslast vom Betrieb. |

### 3.1 Grundsätze der Datenhaltung

| Thema | Festlegung |
|---|---|
| Primärschlüssel | `uuid` (UUIDv7-fähig, zeitlich sortierbar) |
| Mandant | `mandant_id` in jeder Kerntabelle, durchgesetzt per Row Level Security |
| Zeitstempel | `timestamptz` in UTC; reine Kalenderdaten als `date` |
| Geldbeträge | `numeric(14,2)` **mit** Währungsfeld. Nie Gleitkomma. |
| Freiformdaten | `jsonb`, ausschließlich mit hinterlegtem Schema und gespeicherter Schemaversion |
| Löschung | Fachliches Löschkonzept (Anonymisierung, Aufbewahrungsklassen), kein hartes `DELETE` in Kerntabellen |
| Audit | Eigene Tabelle, ausschließlich `INSERT`, Rechte auf Datenbankebene entzogen |
| Migration | Versioniert, vorwärtsgerichtet, in der Vorproduktion geprüft |

---

## 4. Hosting und Betrieb

### 4.1 Standort

**Ausschließlich EU/EWR.** Das gilt für Anwendung, Datenbanken, Backups, Logs,
Fehlertracking und E-Mail-Versand.

| Kandidat | Region | Stärke | Schwäche |
|---|---|---|---|
| **Hetzner** (DE) | Nürnberg, Falkenstein | Preis-Leistung, deutscher Betreiber, kein Drittlandbezug | Weniger Managed Services, mehr Eigenbetrieb |
| **IONOS Cloud** (DE) | Frankfurt, Berlin | Deutscher Anbieter, EU-Zertifizierungen | Kleineres Ökosystem |
| **OVHcloud** (FR) | Frankfurt, Gravelines | EU-Betreiber, breites Angebot | Betriebsqualität schwankt |
| **AWS** | `eu-central-1` Frankfurt | Reifste Managed Services | US-Mutterkonzern → zusätzliche Prüfung nötig |
| **Azure** | Germany West Central | Nähe zu Microsoft 365 / Power Automate | Ebenso US-Mutterkonzern |

**Entschieden: Hetzner** (ADR-0011). Ein deutscher Betreiber ohne Drittlandbezug
lässt die Drittlandbewertung für Anwendung, Datenbank, Objektspeicher und
Sicherungen vollständig entfallen — der größte einzelne Zeitgewinn in der
Datenschutzprüfung.

**Was die Entscheidung kostet:** Hetzner bietet kein Managed PostgreSQL und keine
unveränderlichen Sicherungen. Die Datenbank läuft im Eigenbetrieb auf dedizierten
vCPU, und eine dritte Sicherungskopie liegt außerhalb des Kontos. Der V2-Pfad über
Managed Kubernetes ist neu zu bewerten; V1 bleibt unberührt.

Serveraufbau, Netzplan, Sicherungsstrategie, E-Mail-Zustellbarkeit und die
Einrichtungsreihenfolge stehen in
[`12_BETRIEBSKONZEPT_HETZNER.md`](12_BETRIEBSKONZEPT_HETZNER.md).

### 4.2 Ausbaustufen des Betriebs

| Stufe | Betriebsform | Begründung |
|---|---|---|
| **V1** | Docker Compose auf drei Servern bei Hetzner, PostgreSQL im Eigenbetrieb auf dedizierten vCPU | Kleines Team, überschaubare Last. Kubernetes wäre Selbstzweck. |
| **V2** | Orchestrierung, getrennte Umgebungen, Autoskalierung der Worker. **Bei Hetzner kein Managed Kubernetes** — `k3s` im Eigenbetrieb oder Anbieterwechsel für diese Ebene | Mehrere Länder, Portale, Kampagnenlast |
| **V3** | Mehrere Zonen, Read Replicas, getrenntes Data Warehouse | Verfügbarkeitszusagen gegenüber Partnern |

### 4.3 Umgebungen

| Umgebung | Zweck | Daten |
|---|---|---|
| `lokal` | Entwicklung | ausschließlich synthetisch |
| `integration` | Automatische Tests, Vorschau je Zweig | ausschließlich synthetisch |
| `vorproduktion` | Abnahme, Migrationsprobe, Lasttest | synthetisch oder anonymisiert |
| `produktion` | Betrieb | echt |

**Verbindlich:** Aus `produktion` fließen niemals Daten in eine andere
Umgebung. Wird ein realistischer Bestand gebraucht, wird er erzeugt, nicht
kopiert.

### 4.4 Werkzeuge

| Zweck | Werkzeug |
|---|---|
| Versionsverwaltung, CI/CD | Git, GitHub Actions (Runner in der EU) |
| Container | Docker, eigene Registry |
| Infrastruktur als Code | Terraform oder OpenTofu |
| Konfiguration | Ansible (V1), GitOps mit Argo CD (ab V2) |
| Metriken und Logs | Prometheus, Grafana, Loki |
| Traces | OpenTelemetry |
| Fehler | Sentry, **EU-Region**, mit Maskierung personenbezogener Felder |
| Geheimnisse | HashiCorp Vault oder Cloud-Secret-Store; nie im Repository |
| Verfügbarkeitsprüfung | Externe Prüfung aus der EU, Alarmierung mit Bereitschaftsplan |

---

## 5. Externe Dienste

| Dienst | Zweck | Kritikalität | Ersetzbarkeit | Offener Punkt |
|---|---|---|---|---|
| **Brevo** | Newsletter und Marketing. **Nicht** für Vorgangsmails an Versicherer — siehe A-09 | B | Hinter Adapter, ersetzbar durch Mailjet, Sendinblue-Alternativen, eigenes SMTP | Auftragsverarbeitung, EU-Speicherung (**A-07**) |
| **Microsoft 365 / Power Automate** | Bürointerne Abläufe, Freigaben, Teams-Benachrichtigungen | C | Ersetzbar durch eigene Workflow-Engine | Datenstandort, Umfang der übertragenen Daten (**A-07**) |
| **Signaturdienst** | Elektronische Unterschrift | A (ab V2) | Hinter Adapter | Anbieter und Signaturstufe (**A-04**) |
| **Zahlungsdienst** | Beitragseinzug | A (ab V2) | Hinter Adapter | Modell: eigenes Inkasso oder Versichererinkasso (**A-06**) |
| **Versicherer / Produktquelle** | Angebot, Antrag, Bestand | A | Mehrere Träger parallel | **geklärt:** E-Mail, ADR-0010 |
| **LinkedIn** | Reichweite, Lead Gen Forms, Unternehmensseite | D | ersetzbar | Einwilligungsgrundlage |
| **Google** | Analytics 4, Ads, Business Profile, Maps | C | teils ersetzbar (Matomo, OpenStreetMap) | Drittlandübermittlung, Einwilligung |
| **Anthropic Claude / OpenAI** | KI-Assistenz, Textentwurf, Extraktion | D | Hinter Adapter, gegeneinander austauschbar | Auftragsverarbeitung, Datenminimierung (**A-07**) |

**Grundregel:** Kein externer Dienst wird zur Voraussetzung eines
geschäftskritischen Ablaufs, ohne dass ein Rückfallpfad dokumentiert und
geprüft ist ([`08_SICHERHEITSARCHITEKTUR.md`](08_SICHERHEITSARCHITEKTUR.md),
Runbooks).

---

## 6. Künstliche Intelligenz

### 6.1 Einsatzfelder und Grenzen

| Einsatz | Erlaubt | Grenze |
|---|---|---|
| Entwurf von Kundenkommunikation | ja | Ein Mensch gibt frei, bevor etwas den Kunden erreicht |
| Zusammenfassung eines Vorgangs für den Vertrieb | ja | Herkunft jeder Aussage nachvollziehbar |
| Extraktion aus Dokumenten (Police, Gutachten, Rechnung) | ja | Immer mit Sicherheitswert; Original bleibt unverändert; bei Unsicherheit menschliche Prüfung |
| Beantwortung von Produktfragen im Portal | ja, mit Wissensbasis | Keine Rechts- oder Deckungsauslegung; Verweis auf Beratung |
| Vorschlag der nächstbesten Handlung | ja | Vorschlag, keine automatische Ausführung |
| **Automatische Ablehnung eines Kunden** | **nein** | Untersagt |
| **Automatische Prämien- oder Deckungsentscheidung** | **nein** | Untersagt |
| **Verarbeitung von Gesundheitsdaten** | **nein** | Nicht Bestandteil dieser Plattform |

### 6.2 Technische Umsetzung

| Baustein | Festlegung |
|---|---|
| Anbieterabstraktion | Ein Interface, mindestens zwei Implementierungen (Claude, OpenAI) plus Mock für Tests |
| Modellwahl | Je Aufgabe konfiguriert, nicht im Code verdrahtet; leistungsfähiges Modell für Analyse, schnelles Modell für Klassifikation |
| Wissensbasis | Eigene Inhalte, Produktinformationen und freigegebene Dokumente; Index in `pgvector` |
| Datenminimierung | Pseudonymisierung vor jeder Übermittlung: Namen, Adressen und Kennungen werden ersetzt und nach der Antwort zurückgeschrieben |
| Nachvollziehbarkeit | Jede Ausgabe wird mit Modell, Modellversion, Prompt-Version, Eingabe-Hash, Sicherheitswert und Zeitpunkt protokolliert |
| Kostensteuerung | Zwischenspeicherung wiederkehrender Anfragen, Kontingente je Modul, Kostenüberwachung |
| Rückfall | Bei Zeitüberschreitung oder Ausfall: Vorlage statt Entwurf, Hinweis statt Antwort |

### 6.3 Warum kein eigenes Modell

Ein eigenes Modell zu betreiben, bindet Spezialwissen und Hardware, ohne im
Anwendungsfall besser zu sein. Sollte die Datenschutzprüfung eine Verarbeitung
außer Haus ausschließen, ist der Rückfall ein in der EU gehostetes offenes
Modell hinter derselben Abstraktion — eine Konfigurationsänderung, kein Umbau.

---

## 7. Zusammenfassung in einem Bild

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BROWSER                                                                 │
└───────────────┬─────────────────────────────────────────────────────────┘
                │ HTTPS, HSTS, CSP
┌───────────────▼─────────────────────────────────────────────────────────┐
│  CDN (EU-PoPs) + WAF + Ratenbegrenzung                                   │
└───────────────┬─────────────────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────────────────┐
│  WORDPRESS MULTISITE            PHP 8.3 · Block-Theme · React-Inseln     │
│  Plugins: core-bridge · identity · forms · portal · content · analytics  │
│  MariaDB (nur Inhalte)  ·  Redis Object Cache  ·  Nginx FastCGI Cache    │
└───────────────┬─────────────────────────────────────────────────────────┘
                │ REST /api/v1 · privates Netz · mTLS · Idempotenzschlüssel
┌───────────────▼─────────────────────────────────────────────────────────┐
│  DOMÄNENKERN                    PHP 8.3 · Symfony 7 · modularer Monolith │
│  CRM · Vertrag · Objekt · Netzwerk · Workflow · Dokument · Kampagne      │
│  PostgreSQL 16 (RLS, UUID, numeric, jsonb)  ·  RabbitMQ  ·  S3 (EU)      │
└───────────────┬─────────────────────────────────────────────────────────┘
                │ Ereignisse (Outbox → Bus)
┌───────────────▼─────────────────────────────────────────────────────────┐
│  INTEGRATION      Brevo · Power Automate · LinkedIn · Google · Versicherer│
│  ANALYTICS        Read Replica · dbt · Grafana                           │
│  KI               Claude / OpenAI hinter Adapter · pgvector · nur lesend │
└──────────────────────────────────────────────────────────────────────────┘
```
