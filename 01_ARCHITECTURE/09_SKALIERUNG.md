# 09 — Skalierung

## 1. Grundsatz

Es wird für die Last gebaut, die absehbar entsteht — mit
**Schnittstellen**, die eine spätere Zehnfachung erlauben, aber ohne
**Infrastruktur**, die sie heute schon vorhält. Ein Kubernetes-Verbund für
40 Leads am Tag kostet mehr Aufmerksamkeit, als er einbringt.

Was von Anfang an vorhanden sein muss, weil es später sehr teuer wird:

| Ab Tag eins | Warum ein Nachrüsten teuer wäre |
|---|---|
| `mandant_id` in jeder Kerntabelle | Migration über den gesamten Bestand, bei laufendem Betrieb |
| UUID statt fortlaufender Zahlen | Schlüsselwechsel berührt jede Fremdschlüsselbeziehung |
| Ereignisse über eine Outbox | Nachträgliche Entkopplung bedeutet, jede Integration neu zu schreiben |
| Auditprotokoll append-only | Ein nachträglich eingeführtes Protokoll hat keine Vergangenheit |
| Trennung Lesen und Schreiben in den Abfragen | Read Replicas später einzuhängen ist sonst ein Umbau |
| Adapter vor jedem Fremdsystem | Ein fest verdrahteter Anbieter ist ein Neubau |

---

## 2. Lastannahmen

Grundlage der Auslegung. Sie sind zu prüfen, nicht zu glauben.

| Kennzahl | V1 (Jahr 1) | V2 (Jahr 2–3) | V3 (Jahr 4+) |
|---|---|---|---|
| Märkte | AT | AT, DE | AT, DE, weitere EU |
| Mandanten | 1 | 2–3 | 5–15 (inkl. White Label) |
| Besuche je Monat | 20.000 | 150.000 | 800.000 |
| Leads je Monat | 300 | 2.500 | 12.000 |
| Bestandskunden | 500 | 6.000 | 40.000 |
| Aktive Verträge | 700 | 9.000 | 65.000 |
| Boote im Bestand | 800 | 10.000 | 75.000 |
| Angebundene Organisationen | 10 | 120 | 700 |
| Interne Benutzende | 5 | 25 | 120 |
| Portalanmeldungen je Tag | 30 | 400 | 3.000 |
| Newsletter-Empfänger je Versand | 2.000 | 25.000 | 150.000 |
| Dokumente je Monat | 500 | 6.000 | 40.000 |
| Dokumentbestand | 20 GB | 400 GB | 4 TB |
| Ereignisse je Tag | 5.000 | 80.000 | 600.000 |
| API-Aufrufe je Sekunde (Spitze) | 15 | 120 | 900 |

**Muster der Spitzen:** Der Bootsmarkt ist ausgeprägt saisonal. März bis Juni
bringen den Großteil der Anfragen; im Januar und Februar liegt die Hälfte der
Hauptfälligkeiten. Die Auslegung folgt der **Saisonspitze**, nicht dem
Jahresmittel — sonst ist die Plattform genau dann langsam, wenn sie zählt.

---

## 3. Version 1 — Tragfähigkeit

**Ziel:** Ein Markt, ein Mandant, die Kernstrecke funktioniert vollständig und
nachweisbar.

### Aufbau

```
        Internet
           │
    ┌──────▼──────┐
    │ CDN + WAF   │
    └──────┬──────┘
           │
    ┌──────▼──────────────────────────┐
    │ Server A — Web                   │
    │ Nginx · PHP-FPM · WordPress      │
    │ Redis (Cache)                    │
    └──────┬──────────────────────────┘
           │ privates Netz, mTLS
    ┌──────▼──────────────────────────┐
    │ Server B — Kern                  │
    │ Symfony API · Worker · RabbitMQ  │
    └──────┬──────────────────────────┘
           │
    ┌──────▼──────────────────────────┐
    │ Managed PostgreSQL 16            │
    │ + Managed MariaDB                │
    │ + Objektspeicher (S3, EU)        │
    └─────────────────────────────────┘
```

| Bereich | Auslegung |
|---|---|
| Server | 2 Anwendungsserver (8 vCPU, 32 GB), Datenbanken als Managed Service |
| Datenbank | Ein Primärserver mit automatischer Sicherung und Point-in-Time-Recovery |
| Betrieb | Docker Compose, Auslieferung über die Pipeline |
| Skalierung | Vertikal — mehr Ressourcen, nicht mehr Maschinen |
| Verfügbarkeit | 99,5 %, geplante Wartungsfenster |
| Kostenrahmen | 400–900 € im Monat für Infrastruktur |

### Bewusste Auslassungen in V1

Kein Kubernetes · keine Read Replicas · keine getrennte Suche · kein Data
Warehouse · kein Vektorindex · keine automatische Skalierung.

**Grund:** Bei 15 Anfragen je Sekunde ist die Datenbank zu 3 % ausgelastet.
Jede zusätzliche Komponente wäre ein weiterer Ausfallpunkt ohne Gegenwert.

### Engpässe von V1

| Engpass | Tritt auf bei | Erkennung | Gegenmittel |
|---|---|---|---|
| PHP-FPM-Prozesse | Spitzen im Frühjahr | Warteschlangenlänge | Prozesszahl erhöhen, Full Page Cache prüfen |
| Nächtlicher Score-Lauf | > 5.000 Kunden | Laufzeit | Stapelverarbeitung, Indizes — das vorhandene CRM-Modul zeigt: 5.000 Leads und 2.000 Kunden in gut 20 Sekunden |
| Newsletter-Versand | > 10.000 Empfänger | Rückstau | Drosselung, Versand über Nacht |
| Dokumentspeicher | > 50 GB | Belegung | Objektspeicher wächst elastisch, unkritisch |

---

## 4. Version 2 — Ausbau

**Ziel:** Zwei Märkte, alle Portale, alle elf Module, mehrere Mandanten.

### Änderungen gegenüber V1

| Bereich | V2 |
|---|---|
| Betrieb | Managed Kubernetes; Web, API und Worker getrennt skalierbar |
| Datenbank | Primär + zwei Read Replicas; Auswertung und KI lesen ausschließlich von Replikaten |
| Verbindungen | PgBouncer — sonst wird die Verbindungszahl vor der Rechenleistung zum Engpass |
| Suche | OpenSearch für Bootsmarkt und Dokumentsuche |
| Wissensbasis | pgvector für den KI-Assistenten |
| Warteschlangen | RabbitMQ im Verbund, getrennte Warteschlangen je Priorität |
| Cache | Redis im Verbund |
| WordPress | Multisite: `at.` und `de.`, gemeinsame Codebasis |
| Skalierung | Horizontal, automatisch nach Auslastung und Warteschlangenlänge |
| Verfügbarkeit | 99,9 %, Auslieferung ohne Ausfall |
| Kostenrahmen | 2.500–5.000 € im Monat |

### Neue Engpässe und ihre Behandlung

| Engpass | Ursache | Gegenmittel |
|---|---|---|
| Schreiblast auf dem Primärserver | Signale und Ereignisse | Signale gebündelt schreiben; Zeitreihen in eine eigene Tabelle mit Partitionierung nach Monat |
| Auswertungsabfragen bremsen den Betrieb | Berichte auf Betriebsdaten | Strikt: Auswertung nur auf Replikaten |
| Warteschlange bei Kampagnen | 25.000 Empfänger auf einmal | Eigene Warteschlange mit niedriger Priorität, Drosselung, Versandfenster |
| Nächtlicher Lauf über alle Mandanten | Mandantenzahl steigt | Parallelisierung je Mandant, Lastschutz aus dem CRM-Modul |
| Dokumentabrufe | Portalnutzung steigt | Signierte Links direkt zum Objektspeicher — die Anwendung liefert keine Bytes aus |

### Ab wann V2

Wenn **eines** dieser Merkmale eintritt: zweiter Markt startet · mehr als
1.000 Leads im Monat · mehr als 5.000 Kunden · mehr als 50 angebundene
Organisationen · nächtlicher Lauf länger als 30 Minuten · Verfügbarkeit wird
vertraglich zugesagt.

---

## 5. Version 3 — Plattform

**Ziel:** Mehrere Länder, White-Label-Mandanten, zugesagte Verfügbarkeit,
Datenprodukte.

| Bereich | V3 |
|---|---|
| Regionen | Zwei EU-Zonen aktiv, Übernahme mit dokumentierter Umschaltzeit |
| Datenbank | Partitionierung nach Mandant und Zeit; große Mandanten auf eigenen Instanzen |
| Ereignisse | Kafka statt RabbitMQ, sobald Wiedergabe und lange Aufbewahrung gebraucht werden |
| Auswertung | Eigenes Data Warehouse (ClickHouse), Aufbereitung mit `dbt`, tägliche Ladung |
| Domänenkern | Erste Module herausgelöst — **nur bei belegtem Grund**: abweichender Lebenszyklus, abweichendes Lastprofil oder eigenes Team |
| Mandanten | Vollständige Trennung inklusive Marke, Domäne, Vorlagen, Produkten |
| Verfügbarkeit | 99,95 % mit Bereitschaft rund um die Uhr |
| Kostenrahmen | 8.000–20.000 € im Monat |

### Erst in V3 sinnvoll

Kafka mit Ereigniswiedergabe · getrenntes Data Warehouse · aktive Zweitregion ·
eigene Dienste je Modul · eigenes KI-Modell im Eigenbetrieb.

**Jeder dieser Punkte verdoppelt den Betriebsaufwand.** Sie werden einzeln
begründet, nicht als Paket eingeführt.

---

## 6. Was in jeder Stufe gleich bleibt

| Unverändert über V1 bis V3 | Grund |
|---|---|
| Datenmodell und Entitäten | Ein Modellwechsel ist der teuerste aller Umbauten |
| Ereignisnamen und Vertragsformate | Nachgelagerte Systeme verlassen sich darauf |
| Statusmaschinen | Zustände sind fachliche Wahrheit, nicht technische Wahl |
| Berechtigungsmodell | Sicherheitsregeln dürfen nicht mit der Ausbaustufe schwanken |
| Auditformat | Nachweise müssen über Jahre vergleichbar bleiben |
| Adaptergrenzen | Erlauben den Anbieterwechsel in jeder Stufe |

Was sich ändert, ist ausschließlich, **wo** und **auf wie vielen Maschinen** der
Code läuft.

---

## 7. Leistungsziele

Gemessen am 95. Perzentil unter Saisonlast.

| Vorgang | Ziel | Bemerkung |
|---|---|---|
| Öffentliche Seite, erster sichtbarer Inhalt | < 1,5 s | aus dem Cache |
| Größter sichtbarer Inhalt (Mobil, 4G) | < 2,0 s | Bootsbilder sind der kritische Anteil |
| Formularabsendung mit Bestätigung | < 800 ms | ohne nachgelagerte Schritte |
| Portal-Anmeldung bis Übersicht | < 1,2 s | |
| Kundenakte im CRM | < 700 ms | |
| Tagesliste der nächstbesten Handlungen | < 300 ms | Das vorhandene CRM-Modul erreicht bei 5.000 Leads unter 5 ms |
| Dokumentabruf (signierter Link) | < 500 ms | Umleitung, kein Durchreichen |
| Nächtlicher Score-Lauf | < 30 min bei 50.000 Kunden | Hochrechnung aus dem Lasttest des CRM-Moduls |
| Newsletter, 100.000 Empfänger | < 4 h | begrenzt durch den Versanddienst |
| Wiederherstellung der Datenbank | < 1 h | vierteljährlich zu belegen |

---

## 8. Kostentreiber

| Treiber | Wächst mit | Steuerung |
|---|---|---|
| Dokumentspeicher | Bestand, nie sinkend | Aufbewahrungsfristen durchsetzen; kalte Ablage für Altbestände |
| E-Mail-Versand | Empfänger × Frequenz | Frequenzgrenzen, Segmentierung statt Rundschreiben |
| KI-Nutzung | Anfragen × Modellgröße | Zwischenspeicherung, kleines Modell für einfache Aufgaben, Kontingente je Modul |
| Datenbank | Bestand + Schreiblast | Partitionierung, Archivierung, Signale gebündelt schreiben |
| CDN | Besuche × Seitengewicht | Bildoptimierung ist der größte Hebel |
| Betriebsaufwand Menschen | Anzahl der Komponenten | **Der größte und am häufigsten unterschätzte Posten.** Jede vermiedene Komponente spart dauerhaft |

---

## 9. Entscheidungspunkte

| Wenn … | dann … | nicht … |
|---|---|---|
| die Antwortzeit steigt | zuerst messen, wo — meist ist es eine einzelne Abfrage | sofort Maschinen hinzufügen |
| der nächtliche Lauf zu lange dauert | je Mandant parallelisieren | den Lauf seltener ausführen |
| Auswertungen den Betrieb bremsen | Read Replica einsetzen | Berichte einschränken |
| ein Modul deutlich mehr Last erzeugt | dieses Modul herauslösen | alle Module herauslösen |
| ein Fremdsystem instabil ist | Circuit Breaker und Warteschlange | mehr Wiederholungen |
| die Datenbank groß wird | nach Zeit partitionieren, archivieren | vorschnell auf eine andere Datenbank wechseln |
