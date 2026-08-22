# 12 — Umsetzungsempfehlung WordPress

## 1. Die Rollenverteilung in einem Satz

> **WordPress ist die Werkbank. PostgreSQL ist der Aktenschrank.**

Der Innendienst arbeitet den ganzen Tag in `wp-admin`. Die Daten liegen keine
Sekunde dort. Eine kompromittierte WordPress-Instanz gibt keine einzige
Kundenakte preis — das ist die wirksamste Einzelmaßnahme der gesamten
Sicherheitsarchitektur und der Grund, warum Plugins überhaupt frei einsetzbar
bleiben.

```
   ┌──────────────────────────────────────────────────────────┐
   │  wp-admin                                                │
   │  ┌────────────────────────────────────────────────────┐  │
   │  │ Callidus CRM                                       │  │
   │  │  Tagesliste · Kunden · Leads · Verträge · Boote    │  │
   │  │  Organisationen · Aufgaben · Dokumente · Berichte  │  │
   │  └────────────────────────────────────────────────────┘  │
   │            │                                              │
   │            ▼  callidus-core-bridge                        │
   └────────────┼──────────────────────────────────────────────┘
                │ HTTPS + mTLS, privates Netz
   ┌────────────▼──────────────────────────────────────────────┐
   │  Domänenkern  /api/v1  ──▶  PostgreSQL                    │
   └───────────────────────────────────────────────────────────┘

   MariaDB enthält: Seiten, Medien, Menüs, Einstellungen.
   MariaDB enthält NICHT: Personen, Verträge, Dokumente, Aufgaben.
```

---

## 2. Warum kein fertiges CRM-Plugin

Geprüft und verworfen: HubSpot-Anbindungen, WP-CRM-Erweiterungen,
CRM-Plugins mit Custom Post Types.

| Punkt | Warum es scheitert |
|---|---|
| Speichert in `wp_postmeta` | Jede Person, jeder Vertrag läge in einer Tabelle, auf die jedes installierte Plugin Vollzugriff hat |
| Kein Berechtigungsmodell auf Objektebene | Ein Makler sähe fremde Bestände |
| Keine Mandantentrennung | AT und DE nicht trennbar |
| Keine Versionierung | Verträge nicht historisierbar |
| Kein revisionssicheres Protokoll | Nachweispflichten nicht erfüllbar |
| Nicht auf Versicherung zugeschnitten | Kein Vertrag, keine Deckung, kein Objekt, keine Frist |

Ein Standardprodukt zu erzwingen kostet mehr Anpassung als der Eigenbau — und
liefert am Ende ein System, das keine der Kernanforderungen erfüllt.

---

## 3. Plugin-Landschaft

Sechs Plugins mit klaren Grenzen. Kein Plugin, das „alles" kann.

| Plugin | Aufgabe | Greift auf Fachdaten zu |
|---|---|---|
| `callidus-core-bridge` | HTTP-Client zum Kern: Token, Wiederholungen, Zeitgrenzen, Cache, Fehlerübersetzung, Korrelationskennung | ja, ausschließlich über die API |
| `callidus-identity` | OIDC-Anmeldung, Zuordnung Kern-Identität ↔ WP-Benutzer, Rollen- und Capability-Mapping | nein |
| `callidus-crm` | **Die Werkbank.** Menüs, Listen, Kundenakte, Formulare, Aktionen | über die Bridge |
| `callidus-forms` | Öffentliche Formulare, Einwilligungen, Produktschemata, Richtprämie | über die Bridge |
| `callidus-portal` | Kundenportal, Dealer Hub, Club Hub, Partnerportal | über die Bridge |
| `callidus-content` | Inhaltstypen fürs Marketing: Produkte, Ratgeber, Standorte, Veranstaltungen | nein — **hier sind CPTs richtig** |

### Wo Custom Post Types richtig sind

CPTs sind kein Feind. Sie sind das richtige Werkzeug für **Inhalte**:
Produktseiten, Ratgeberartikel, Hafenstandorte, Veranstaltungen,
Kommunikationsvorlagen. Alles, was redaktionell gepflegt, versioniert und
veröffentlicht wird, gehört in WordPress — mit Vorschau, Revisionen und
Suchmaschinenanbindung.

Die Grenze verläuft nicht bei „CPT ja oder nein", sondern bei der Frage:
**Muss dieses Datum in drei Jahren vor einem Prüfer bestehen?**

---

## 4. Verzeichnisaufbau

```
wp-content/plugins/callidus-crm/
├── callidus-crm.php              Bootstrap, Aktivierung, Deinstallation
├── composer.json                 PSR-4, feste Versionen
├── src/
│   ├── Admin/
│   │   ├── Menu.php              Menüregistrierung, Capability-Prüfung
│   │   ├── Screen/               je Bildschirm eine Klasse
│   │   │   ├── DayListScreen.php
│   │   │   ├── CustomerListScreen.php
│   │   │   ├── CustomerDossierScreen.php
│   │   │   ├── ContractListScreen.php
│   │   │   └── …
│   │   └── Table/                WP_List_Table-Ableitungen
│   ├── Api/
│   │   ├── CoreClient.php        Fassade über die Bridge
│   │   ├── Resource/             je Ressource ein Repository
│   │   └── Dto/                  typisierte Antwortobjekte
│   ├── Capability/
│   │   ├── CapabilityMap.php     Kernrolle → WP-Capability
│   │   └── ScreenGuard.php       Prüfung vor jedem Rendern
│   ├── View/                     Templates, kein Logikanteil
│   └── Support/
├── assets/
│   ├── src/                      TypeScript, React-Inseln
│   └── build/                    erzeugt, nicht versioniert
├── tests/
│   ├── Unit/
│   └── Integration/              gegen einen Mock-Kern
└── languages/
```

**Kein Code in `functions.php`.** Kein Datenbankzugriff außerhalb von
`src/Api/`. Beides wird per statischer Analyse geprüft.

---

## 5. Serverseitig gerendert oder React-Insel

Nicht alles braucht React, und nicht alles kommt ohne aus.

| Bildschirm | Umsetzung | Begründung |
|---|---|---|
| Listen (Kunden, Verträge, Leads, Boote) | **`WP_List_Table`**, serverseitig | Sortierung, Filter, Massenaktionen und Seitennavigation sind gelöst. Vertraute Bedienung |
| **Tagesliste** | **React-Insel** | Erledigen, Verschieben, Zuweisen ohne Seitenneuladen. Der meistbenutzte Bildschirm |
| **Kundenakte** | **React-Insel** | Reiter, Nachladen, Verlauf mit Filter. Ein Seitenneuladen je Reiter wäre unbrauchbar |
| Formulare (Kontakt, Vertrag, Boot) | serverseitig, mit gezielten Inseln | Formularfelder aus dem Produktschema sind eine Insel, der Rahmen nicht |
| Dashboards | React-Insel | Kacheln, Zeiträume, Verläufe |
| Konfiguration | serverseitig | Selten benutzt, Einfachheit schlägt Komfort |

**Regel:** React kommt dort zum Einsatz, wo mehr als drei Interaktionen ohne
Seitenwechsel nötig sind. Überall sonst ist serverseitiges Rendern schneller zu
bauen, schneller zu laden und leichter zu warten.

Technik: `@wordpress/scripts`, TypeScript strict, `@wordpress/components` für
das vertraute Aussehen, Datenzugriff über eigene REST-Routen des Plugins — die
Insel spricht **nie** direkt mit dem Kern.

---

## 6. Die Core Bridge

Das Herzstück. Alles, was schiefgehen kann, geht hier schief.

| Anforderung | Umsetzung |
|---|---|
| **Zeitgrenze** | 2 s lesend, 5 s schreibend. Danach saubere Fehlermeldung statt hängender Seite |
| **Wiederholung** | Nur bei Netzwerkfehlern und `5xx`, mit wachsendem Abstand, höchstens dreimal. **Nie bei `4xx`** |
| **Idempotenz** | Schreibende Aufrufe tragen einen Schlüssel; eine Wiederholung erzeugt keinen zweiten Datensatz |
| **Cache** | Redis-Objektcache. Stammdaten 5 min, Herstellerliste 1 h, Produktschemata 1 h. **Nie**: Aufgaben, Vorgänge, Akten |
| **Cache-Verwerfung** | Ereignisgesteuert über einen Webhook des Kerns, nicht nur zeitgesteuert |
| **Korrelation** | `X-Correlation-Id` wird erzeugt und im WordPress-Protokoll mitgeführt |
| **Fehlerübersetzung** | `problem+json` wird zu einer deutschen Meldung. Technische Ursachen erreichen den Browser nie |
| **Token** | Client-Credentials-Fluss, Token im Objektcache, Erneuerung vor Ablauf, **nie in der Datenbank** |
| **Ausfall des Kerns** | Wartungshinweis mit Korrelationskennung. Formulareingänge werden verschlüsselt zwischengespeichert und laufen nach |
| **Bündelung** | Ein Bildschirm ruft **einen** Endpunkt auf. `/customers/{id}/dossier` statt sieben Einzelaufrufe |

Die letzte Zeile ist der häufigste Leistungsfehler in dieser Architektur. Sieben
Aufrufe je Bildschirm sind das erste, was der Innendienst als „langsam" bemerkt
— und der Moment, in dem er auf Excel ausweicht.

---

## 7. Rollen und Capabilities

```php
// Beim Aktivieren registriert, beim Deinstallieren entfernt.
callidus_admin      → callidus_view_crm, callidus_manage_config,
                      callidus_manage_users, callidus_view_audit
callidus_sales      → callidus_view_crm, callidus_edit_customer,
                      callidus_approve_quote, callidus_manage_tasks
callidus_office     → callidus_view_crm, callidus_edit_customer,
                      callidus_manage_tasks, callidus_import_tariff
callidus_marketing  → callidus_view_segments, callidus_manage_campaigns
callidus_broker     → callidus_view_portal_broker
callidus_partner    → callidus_view_portal_partner
callidus_customer   → callidus_view_portal_customer
```

**Was die Capability leistet und was nicht:**

| Leistet | Leistet nicht |
|---|---|
| Menüpunkte ein- und ausblenden | Über die Herausgabe eines Fachdatums entscheiden |
| Schaltflächen anzeigen oder verbergen | Einen Datensatz freigeben |
| Bildschirme sperren (`ScreenGuard`) | Objektbezogene Sichtbarkeit herstellen |

Jeder Aufruf an den Kern trägt das Token des angemeldeten Benutzers. Der Kern
prüft Rolle **und** Objektbezug — unabhängig davon, was WordPress erlaubt hätte.
Wer die Capability-Prüfung umgeht, bekommt vom Kern ein `404`.

---

## 8. Leistung

| Maßnahme | Wirkung |
|---|---|
| Redis als Objektcache | Wiederholte Stammdatenabrufe kosten nichts |
| Ein Endpunkt je Bildschirm | Verhindert das N+1-Problem über HTTP |
| Listen serverseitig, seitenweise | 25 Zeilen, nie „alle laden" |
| React-Inseln laden Daten selbst nach | Die Seite steht, bevor die Daten da sind |
| Kein Full-Page-Cache in `wp-admin` | Ein Cache-Treffer über Sitzungsgrenzen wäre ein Datenschutzvorfall |
| Persistente Verbindungen zum Kern | Spart TLS-Aufbau je Aufruf |
| Autoload-Optionen klein halten | Ein aufgeblähtes `wp_options` bremst **jeden** Seitenaufruf |

**Ziele:** Kundenakte-Kopf < 300 ms · vollständige Akte < 700 ms ·
Tagesliste < 300 ms · Listenansicht < 500 ms.

Diese Werte sind Abnahmekriterium, nicht Absichtserklärung.

---

## 9. Härtung

| Maßnahme | Begründung |
|---|---|
| **Kein Fachdatum in WordPress-Tabellen** | Wichtigste Einzelmaßnahme |
| `DISALLOW_FILE_EDIT` | Verhindert Codeausführung über ein übernommenes Konto |
| `DISALLOW_FILE_MODS` | Installation nur aus dem Repository, jede Änderung versioniert |
| Plugin-Freigabeprozess | Jedes Plugin ist Fremdcode mit Datenbankzugriff. Kriterien: Wartung, Verbreitung, Sicherheitshistorie, Lesbarkeit |
| Composer mit festgeschriebenen Versionen und Prüfsummen | Schutz vor Lieferkettenangriffen |
| XML-RPC abgeschaltet | Wird nicht gebraucht, dient regelmäßig der Rohgewalt |
| REST-Benutzerliste abgeschaltet | Gibt sonst ohne Not Konten preis |
| `wp-admin` mit Ratenbegrenzung und Mehrfaktor | Häufigstes Angriffsziel |
| WordPress-Datenbankbenutzer ohne `DROP`, `CREATE USER`, `FILE` | Begrenzt den Schaden einer Injektion |
| **Kein Netzweg von WordPress zu PostgreSQL** | Die Trennung ist auch eine Netzwerkregel, nicht nur eine Konvention |
| Versionsangaben entfernt, WAF vorgeschaltet | Erschwert gezielte Angriffe |
| Automatische Sicherheitsaktualisierungen | Bekannte Lücken sind die häufigste Ursache |

---

## 10. Entwicklung und Qualität

| Thema | Festlegung |
|---|---|
| PHP | 8.3, `declare(strict_types=1)` in jeder Datei |
| Stil | PSR-12, geprüft in der Auslieferungskette |
| Statische Analyse | PHPStan Stufe 8 · zusätzlich eine Regel: **kein `$wpdb` außerhalb von `src/Api/`** |
| Tests | Unit für Capability-Mapping, Fehlerübersetzung, Formatierung · Integration gegen einen Mock-Kern |
| Übersetzung | Vollständig übersetzbar, Ausgangssprache Deutsch |
| Barrierefreiheit | WCAG 2.2 AA — auch im Adminbereich. Der Innendienst arbeitet hier acht Stunden am Tag |
| Auslieferung | Aus dem Repository, versioniert, mit Rückrollmöglichkeit |
| Umgebungen | `lokal`, `integration`, `vorproduktion`, `produktion` — synthetische Daten außerhalb der Produktion |

---

## 11. Was ausdrücklich nicht gebaut wird

| Ausgeschlossen | Grund |
|---|---|
| Fachdaten als Custom Post Type | Keine Relationen, keine Typsicherheit, keine Mandantentrennung, kein Nachweis |
| Direkte Datenbankverbindung zu PostgreSQL aus WordPress | Hebelt die Trennung aus, die den Schutz erzeugt |
| Eigene Benutzerverwaltung mit Passwörtern | Authentifizierung liegt beim OIDC-Anbieter |
| Formular-Plugin für Kundendaten | Speichert in `wp_postmeta`, erfasst keine versionierten Einwilligungen |
| Page Builder im Adminbereich | Werkbank braucht Geschwindigkeit, nicht Gestaltungsfreiheit |
| Ein Plugin, das alles kann | Nicht testbar, nicht ablösbar |
| Cronjobs über `wp-cron` | Hängt an Seitenaufrufen. Fristen laufen im Kern-Scheduler |

---

## 12. Der Umsetzungsweg

| # | Schritt | Ergebnis |
|---|---|---|
| 1 | WordPress-Grundinstallation, Multisite AT/DE, Härtung | Eine Instanz, die keine Fachdaten kennt |
| 2 | `callidus-identity` | Anmeldung über OIDC, Rollen kommen aus dem Kern |
| 3 | `callidus-core-bridge` | Ein Testaufruf gegen den Mock-Kern liefert Daten und übersetzt Fehler |
| 4 | `callidus-crm`, Grundgerüst | Menü, Capability-Prüfung, eine Liste |
| 5 | Listen und Formulare | Kunden, Leads, Verträge, Boote, Organisationen |
| 6 | Tagesliste als React-Insel | Der meistbenutzte Bildschirm, mit Erledigen ohne Neuladen |
| 7 | Kundenakte als React-Insel | Gebündelter `/dossier`-Aufruf, Reiter werden nachgeladen |
| 8 | Dashboards und Berichte | |
| 9 | `callidus-forms` | Öffentliche Anfrage mit Einwilligung und Richtprämie |
| 10 | `callidus-portal` | Erst in Version 2 |

Schritt 3 vor Schritt 4: **Die Bridge muss stehen und ihre Fehlerfälle
beherrschen, bevor der erste Bildschirm entsteht.** Sonst wird die
Fehlerbehandlung über zwanzig Bildschirme verstreut nachgerüstet — und dann nie
vollständig.
