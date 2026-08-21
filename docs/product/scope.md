# Umfang des MVP

## Systemgrenze

Die eigene Anwendung ist das **führende CRM**. Sie besitzt: Personen,
Einwilligungen, Leads, Versicherungsvorgänge, Angebotsdaten,
Dokumentreferenzen, Signaturstatus, Aufgaben, Kommunikation und Audit.

Callidus ist ein **externes System** hinter einer Adaptergrenze. Es besitzt:
Tarifierung, Prämienberechnung und die versicherungsseitige Antragsverarbeitung.

```
Interessent ─ Website ─┐
                       ├─ CRM (führend) ─ Adaptergrenze ─ Callidus (extern)
Kunde ─ Kundenportal ──┤                       │
Agent ─ Agentenportal ─┘                       ├─ Signaturdienst (extern)
                                               ├─ E-Mail-Provider (extern)
                                               └─ Object Storage (extern)
```

## Im Umfang

| # | Fähigkeit | Slice |
|---|---|---|
| 1 | Lokale Entwicklungsumgebung, CI-Prüfungen, Migrationen, synthetische Seeds | 1 |
| 2 | Identität, Rollen, Berechtigungen (serverseitig, objektbezogen) | 2 |
| 3 | Personen, Adressen, Kontaktwege, Einwilligungen | 3 |
| 4 | Leads und Versicherungsvorgänge mit expliziter Statusmaschine | 3 |
| 5 | Versionierte Produktdefinitionen und dynamische, datengetriebene Formulare | 4 |
| 6 | Öffentliche Produktanfrage mit serverseitiger Validierung | 4 |
| 7 | Angebotsanfrage über `MockCallidusAdapter` | 5 |
| 8 | Angebotsimport und deterministische, erklärbare Prüfregeln | 6 |
| 9 | Menschliche Freigabe im Agentenportal | 7 |
| 10 | Kundenportal: Vorgang ansehen, Daten ergänzen, Angebot einsehen | 7 |
| 11 | Dokumente: Upload, Prüfsumme, Malware-Scan, signierte Downloads | 8 |
| 12 | Signatur über `MockSignatureProvider`, idempotente Ereignisverarbeitung | 9 |
| 13 | `ManualCallidusAdapter`: Exportpaket, Übergabe, externe Referenz | 10 |
| 14 | Aufgaben, Erinnerungen, Eskalationen | 11 |
| 15 | Audit, Datenschutzprozesse, Betriebshandbuch | 12 |

## Außerhalb des Umfangs

Siehe `non-goals.md`.

## Abgrenzung zum Bestandsmodul `01_CRM_ENGINE`

`01_CRM_ENGINE` beschreibt eine Scoring- und Automatisierungs-Engine für
Bootsversicherung (Lead Score, Customer Value Score, Kündigungsrisiko,
Regelkatalog A-01…A-49) als lauffähigen PostgreSQL-Prototyp. Dieses MVP baut
den **Prozessteil** (Anfrage → Angebot → Prüfung → Signatur → Übergabe). Die
Engine bleibt unverändert erhalten und wird frühestens nach Abschluss von
Slice 12 als Quelle für Priorisierungsregeln herangezogen.
