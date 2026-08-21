# 01_ARCHITECTURE

**Callidus Boat Intelligence Platform — Systemarchitektur**

| Feld | Wert |
|---|---|
| Phase | `01_ARCHITECTURE` |
| Zweck | Vollständige Zielarchitektur der europäischen Boat-Insurance- und Boat-Marketing-Plattform |
| Status | Architekturentwurf zur Freigabe |
| Fassung | 1.0 |
| Datum | 2026-08-21 |
| Plattformbasis | WordPress (Experience- und Portalschicht) + eigener Domänenkern |
| Geltungsbereich | Deutschland, Österreich, perspektivisch EU/EWR |
| Sprache Fachmodell | Deutsch |

> **In dieser Phase wird nicht programmiert.** Es entsteht ausschließlich die
> Architektur: Systeme, Verantwortlichkeiten, Datenmodell, Schnittstellen,
> Sicherheit, Skalierung und Reihenfolge. Jede Aussage in diesen Dokumenten ist
> als Entwurfsentscheidung zu lesen, die vor der Umsetzung freigegeben wird.

---

## 1. Dokumente

| Datei | Inhalt | Adressat |
|---|---|---|
| [`01_GESAMTARCHITEKTUR.md`](01_GESAMTARCHITEKTUR.md) | Schichtenmodell, Systeme, Verantwortlichkeiten, Beziehungen, Architekturprinzipien | CTO, Architektur |
| [`02_TECHNOLOGIESTACK.md`](02_TECHNOLOGIESTACK.md) | Frontend, Backend, Datenbank, Hosting, Dienste, KI — mit Begründung und Alternativen | Technik, Betrieb |
| [`03_MODULUEBERSICHT.md`](03_MODULUEBERSICHT.md) | Elf Module: Zweck, Daten, Eingaben, Ausgaben, Abgrenzung | Produkt, Fachbereich |
| [`04_DATENMODELL.md`](04_DATENMODELL.md) | Entity Relationship Diagram als Text, Entitätensteckbriefe, Datenhoheit | Architektur, Entwicklung |
| [`05_SCHNITTSTELLEN.md`](05_SCHNITTSTELLEN.md) | API-Katalog, Integrationsmuster, Ausfallverhalten, Verifikationsstatus | Integration, Betrieb |
| [`06_ROLLENMODELL.md`](06_ROLLENMODELL.md) | Sechs Geschäftsrollen, Rechtematrix, Sichtbarkeitsregeln | Fachbereich, Datenschutz |
| [`07_DATENFLUESSE.md`](07_DATENFLUESSE.md) | Durchgängige Abläufe von der Anzeige bis zur Verlängerung | Produkt, Entwicklung |
| [`08_SICHERHEITSARCHITEKTUR.md`](08_SICHERHEITSARCHITEKTUR.md) | DSGVO, EU-Hosting, Berechtigungen, Audit, Backup, WordPress-Härtung | Datenschutz, Betrieb, Revision |
| [`09_SKALIERUNG.md`](09_SKALIERUNG.md) | Ausbaustufen V1, V2, V3 mit Lastannahmen und Engpässen | CTO, Betrieb |
| [`10_ROADMAP.md`](10_ROADMAP.md) | Reihenfolge, Abhängigkeiten, parallelisierbare Stränge, Meilensteine | Geschäftsführung, Projektsteuerung |
| [`adr/`](adr/) | Architekturentscheidungen mit Kontext, Alternativen und Konsequenzen | Architektur |

**Empfohlene Lesereihenfolge:** 01 → 03 → 04 → 07 → 02 → 05 → 06 → 08 → 09 → 10.

Für die Geschäftsführung genügen 01, 03, 09 und 10.

---

## 2. Die zentrale Entscheidung dieser Architektur

Die Plattform basiert auf WordPress. Das ist die Vorgabe, und sie ist für alles
richtig, was Besucher sehen: Websites, Inhalte, Kampagnenseiten, Formulare,
Portale, Mehrsprachigkeit, Suchmaschinensichtbarkeit. In diesem Bereich ist
WordPress dem Eigenbau deutlich überlegen — schnellere Umsetzung, gepflegtes
Ökosystem, Redaktion ohne Entwicklungsaufwand.

WordPress ist jedoch kein Verwaltungssystem für Versicherungsverträge. Ein
Vertrag, eine Einwilligung, ein Prüfergebnis und ein Auditeintrag brauchen
Eigenschaften, die WordPress nicht mitbringt: strenge Relationen,
Zustandsmaschinen, Nachweisbarkeit, Unveränderlichkeit, Mandantentrennung auf
Datenbankebene.

Daraus folgt das tragende Prinzip dieser Architektur:

> **WordPress ist das Gesicht der Plattform. Der Domänenkern ist ihr Gedächtnis.**

WordPress besitzt Inhalte, Darstellung und Interaktion. Der Domänenkern besitzt
Personen, Verträge, Vorgänge, Nachweise und Protokolle. Zwischen beiden liegt
eine klar definierte Schnittstelle, kein gemeinsamer Datenbankzugriff.

Die vollständige Begründung samt der geprüften Alternative „WordPress allein"
steht in [`adr/0001-wordpress-als-experience-layer.md`](adr/0001-wordpress-als-experience-layer.md).

---

## 3. Anschluss an vorhandene Arbeit

| Vorhandenes | Verhältnis zu dieser Architektur |
|---|---|
| [`01_CRM_ENGINE/`](../01_CRM_ENGINE/README.md) | Wird zum **CRM-Modul dieser Plattform**. Die dort spezifizierte und als PostgreSQL-Prototyp lauffähige Engine (Lead Score, Customer Value Score, Kündigungsrisiko, Regelkatalog A-01…A-49, Lastschutz) ist der Kern von Modul M1. Diese Architektur ändert daran nichts, sie ordnet es ein. |
| `apps/`, `packages/`, `docs/` | Rückstand eines abgelösten Auftrags („eigenes Versicherungs-CRM ohne WordPress"). Bleibt als Referenz für Datenmodell und Statusmaschine erhalten, ist aber **nicht** Bestandteil dieser Architektur. Siehe [`adr/0009-verhaeltnis-zu-vorarbeiten.md`](adr/0009-verhaeltnis-zu-vorarbeiten.md). |

---

## 4. Was diese Architektur bewusst offen lässt

Ein Architekturentwurf, der keine offenen Punkte nennt, verbirgt sie nur.

| ID | Offener Punkt | Blockiert | Zu klären durch |
|---|---|---|---|
| A-01 | Produktquelle und Risikoträger: Welche Versicherer, welche Produkte, welche technische Anbindung (API, BiPRO, GDV, Datei, Portal)? | Fundamentmodul M0 (Vertragskern), Tarifierung | Produktverantwortung, Versicherer |
| A-02 | Vermittlerstatus und Zulassung je Land (AT: GewO, DE: §34d GewO) | Öffentlicher Vertrieb, Erstinformation | Rechtsberatung |
| A-03 | Hostingpartner und konkrete Region | Betriebskonzept, AVV, DSFA | Geschäftsführung |
| A-04 | Signaturanbieter und erreichbare Signaturstufe | Antragsstrecke | Produktverantwortung, Rechtsberatung |
| A-05 | Notwendigkeit einer Datenschutz-Folgenabschätzung für Scoring und Profiling | Produktivgang von M1 und M8 | Datenschutzbeauftragte Person |
| A-06 | Zahlungsabwicklung: eigene Inkasso-Strecke oder Versichererinkasso | Vertragskern (M0) ab V2 | Geschäftsführung |
| A-07 | Auftragsverarbeitung mit Brevo, Microsoft, KI-Anbietern | Produktivgang von M3, M8 | Datenschutzbeauftragte Person |

Diese Punkte sind in [`10_ROADMAP.md`](10_ROADMAP.md) terminiert und in
[`08_SICHERHEITSARCHITEKTUR.md`](08_SICHERHEITSARCHITEKTUR.md) bewertet.

---

## 5. Glossar

| Begriff | Bedeutung in dieser Architektur |
|---|---|
| **Experience Layer** | Alles, was ein Mensch im Browser sieht. WordPress. |
| **Domänenkern** | Fachliche Wahrheit: Personen, Verträge, Vorgänge, Nachweise. Eigene Dienste, eigene Datenbank. |
| **Integrationsschicht** | Vermittlung zu Fremdsystemen. Ereignisse, Warteschlangen, Konnektoren. |
| **System of Record** | Das System, das ein Datum verbindlich besitzt. Es gibt je Datum genau eines. |
| **Read Model** | Eine Kopie fremder Daten für Anzeige und Auswertung. Nie Quelle einer Entscheidung. |
| **Kontakt** | Natürliche Person. Zentrale Identität, unabhängig von der Lebenszyklusstufe. |
| **Kunde** | Wirtschaftliche Einheit mit mindestens einem Vertrag. |
| **Organisation** | Händler, Bootsclub oder Partner. Unterscheidung über Rollen, nicht über getrennte Tabellen. |
| **Mandant** | Marke, Land oder Vertriebseinheit. Trennungsgrenze auf Datenbankebene. |
| **Vorgang** | Prozessualer Kern mit Zustandsmaschine (Anfrage, Angebot, Antrag, Schaden, Verlängerung). |
