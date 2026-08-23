# Annahmen

Jede Annahme ist konservativ und reversibel gewählt. Wird eine Annahme
widerlegt, ändert sich Konfiguration oder ein einzelnes Modul — nicht die
Architektur.

## A. Geschäft und Recht

| ID   | Annahme                                                                        | Warum konservativ                                                          | Widerlegung ändert                |
| ---- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | --------------------------------- |
| A-01 | Nutzer ist **ein** Versicherungsagent mit kleinem Innendienst (< 20 Personen). | Kein Mandantenmodell im MVP, aber `tenantId`-fähige Schlüssel vorbereitet. | Aktivierung der Mandantentrennung |
| A-02 | Zielmärkte sind Österreich und Deutschland; UI-Sprache Deutsch.                | i18n-Struktur vorhanden, nur eine Sprache befüllt.                         | Zusätzliche Sprachdateien         |
| A-03 | Alle Beträge in EUR.                                                           | Währung wird trotzdem **immer** mitgespeichert.                            | Nur Konfiguration                 |
| A-04 | Es gibt keine Bestandsdatenmigration in das MVP.                               | Keine Importschnittstelle für Altdaten.                                    | Zusätzlicher Slice                |
| A-05 | Vertragsverwaltung, Schaden und Provision bleiben außerhalb des MVP.           | Klare Systemgrenze, siehe `non-goals.md`.                                  | Weitere Module                    |

## B. Callidus

| ID   | Annahme                                                                        | Warum konservativ                                                       | Widerlegung ändert                  |
| ---- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ----------------------------------- |
| A-06 | Es existiert **keine** verifizierte Callidus-API.                              | Führt zu Adapter + Mock + manuellem Prozess statt erfundener Endpunkte. | Freischaltung `RealCallidusAdapter` |
| A-07 | Der Austausch erfolgt bis auf Weiteres über Dateien und einen manuellen Kanal. | Exportpaket ist formatoffen (JSON + CSV + Dokumente).                   | Adaptertausch, kein Domänenumbau    |
| A-08 | Callidus vergibt eine externe Referenz je Vorgang.                             | Referenz ist optional und nachtragbar modelliert.                       | Nur Pflichtfeld-Schalter            |
| A-09 | Produktschemata ändern sich über die Zeit.                                     | `ProductSchema` ist versioniert, Vorgänge zeigen auf eine Version.      | nichts                              |

## C. Technik und Betrieb

| ID   | Annahme                                                                                                                         | Warum konservativ                                              | Widerlegung ändert                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------- |
| A-10 | Ein modularer Monolith genügt für die Last eines Einzelagenten.                                                                 | Klare Modulgrenzen erlauben späteres Herauslösen.              | Extraktion einzelner Module        |
| A-11 | PostgreSQL, Redis und S3-kompatibler Speicher stehen in der EU/EWR zur Verfügung.                                               | Speicherort ist konfigurierbar, nicht codiert.                 | Nur Konfiguration                  |
| A-12 | Identitätsverwaltung erfolgt über einen OIDC-Provider (lokal Keycloak).                                                         | Keine eigene Passwort-Kryptografie.                            | Providerwechsel über Konfiguration |
| A-13 | Signaturanbieter ist noch nicht ausgewählt; Signaturstufe unbestimmt.                                                           | Nur `MockSignatureProvider` und `ManualSignatureProvider`.     | Zusätzlicher Provider              |
| A-14 | Kunden authentifizieren sich im Portal über den OIDC-Provider; zusätzlich existieren kurzlebige Magic Links für Datenergänzung. | Magic Link ist einmalig, kurzlebig, an einen Vorgang gebunden. | Härtung oder Entfall               |
| A-15 | Keine echten personenbezogenen Daten in Entwicklung, Test oder Repository.                                                      | Ausschließlich synthetische Seeds.                             | nichts                             |

## D. Bestandsrepository

| ID   | Annahme                                                                                                          | Warum konservativ                                                                       | Widerlegung ändert                                 |
| ---- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| A-16 | `01_CRM_ENGINE` ist ein **Design- und Prototypmodul** für Scoring und Automatisierung, kein Produktivsystem.     | Es wird nicht verändert und nicht als Laufzeitabhängigkeit eingebunden.                 | Übernahme einzelner Regeln in einen späteren Slice |
| A-17 | Die dortige Namensgebung (deutsche `snake_case`-Spalten, Präfix `crm_`) gilt für jenes Modul, nicht für das MVP. | Auftrag §18 verlangt englische Code-Bezeichner. Getrennte Schemata vermeiden Kollision. | Vereinheitlichung in einem eigenen Slice           |
