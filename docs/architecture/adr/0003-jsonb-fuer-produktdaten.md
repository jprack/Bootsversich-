# ADR-0003 — JSONB ausschließlich für produktspezifische Risikodaten

**Status:** angenommen · 2026-08-21

## Kontext
Die Pflichtfelder je Versicherungsprodukt sind unbekannt (O-03) und werden sich
ändern. Sie dürfen nicht im Frontend hart codiert sein.

## Entscheidung
Produktspezifische Eingabedaten liegen in `QuoteRequestVersion.data` als `JSONB`,
gebunden an eine `ProductSchema`-Version. Alle zentralen CRM-Felder bleiben
relational.

## Bedingungen (alle verpflichtend)
1. Zu jedem `JSONB`-Feld existiert ein JSON-Schema in `ProductSchema.inputSchema`.
2. Die verwendete Schemaversion wird am Datensatz gespeichert (`productSchemaId`).
3. Zentrale CRM-Felder (Person, Land, Produkt, Beträge, Termine, Status) sind relational.
4. Sensible Felder sind im Schema klassifiziert (`x-classification`).
5. Für Suche und Auswertung benötigte Felder werden zusätzlich relational gespiegelt.

## Konsequenzen
- Änderungen am Produktschema erzeugen eine neue Version; bestehende Vorgänge behalten ihre Version.
- Validierung erfolgt serverseitig gegen das gespeicherte Schema, nicht gegen das jeweils neueste.
