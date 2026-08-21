# ADR-0006 — Zwei getrennte Datenbanken

**Status:** vorgeschlagen · 2026-08-21

## Entscheidung

| Datenbank | Inhalt | Zugriff |
|---|---|---|
| **MariaDB** | WordPress: Seiten, Medien, Menüs, Einstellungen | ausschließlich WordPress |
| **PostgreSQL 16** | Domänenkern: alle Fachdaten | ausschließlich der Kern |

Keine gemeinsame Verbindung, keine Fremdschlüssel über die Grenze, getrennte
Zugangsdaten, kein Netzweg von WordPress zu PostgreSQL.

## Begründung

| Grund | Erläuterung |
|---|---|
| Sicherheit | Eine SQL-Injektion in einem beliebigen WordPress-Plugin erreicht keine Vertragsdaten. Das ist die wirksamste Einzelmaßnahme der gesamten Sicherheitsarchitektur |
| Fähigkeiten | PostgreSQL bietet Row Level Security für Mandantentrennung, `numeric` für Geldbeträge, `jsonb` mit Schemabindung, partielle Indizes, ausgereifte Point-in-Time-Wiederherstellung |
| Anschluss | Das vorhandene Modul `01_CRM_ENGINE` ist bereits PostgreSQL |
| Sicherungsstrategie | Inhalte und Fachdaten haben unterschiedliche RPO-Anforderungen (1 h gegenüber 15 min) |

## Konsequenzen

**Positiv:** Klare Trennung, unterschiedliche Sicherungsziele möglich,
Wiederherstellung von WordPress ohne Berührung der Fachdaten.

**Negativ:** Zwei Datenbanken im Betrieb. Kein Verbund über die Grenze — jede
gemeinsame Ansicht entsteht in der Anwendung. Das ist der beabsichtigte Preis.

## Praktische Regel

Braucht eine Portalseite Inhalt **und** Fachdaten, holt WordPress den Inhalt aus
MariaDB und die Fachdaten über die API. Erscheint das umständlich, ist es genau
die Trennung, die im Ernstfall die Kundendaten schützt.
