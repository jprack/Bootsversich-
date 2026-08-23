# 09 — Dokumentenmanagement

Ergänzt [`02_CORE_CRM/08_DOKUMENTE.md`](../02_CORE_CRM/08_DOKUMENTE.md). Die dort
festgelegten Regeln — zwei Speicherorte, Versionierung, Prüfsumme,
Virenprüfung, Zugriffsklassen, Aufbewahrungsklassen — gelten unverändert und
werden hier nicht wiederholt.

---

## 1. Zusätzliche Dokumenttypen

| Typ | Herkunft | Zugriffsklasse | Aufbewahrung | Bemerkung |
|---|---|---|---|---|
| `KOOPERATIONSVEREINBARUNG` | beide | intern | `VERTRAG` | **Trägt die Rechtsgrundlage der Zusammenarbeit** |
| `BESUCHSBERICHT` | Agent | intern | `VERTRIEB` | Der wertvollste Dokumenttyp dieses Moduls (§3) |
| `PRAESENTATION` | System | intern | `MARKETING` | Versionierte Verkaufsunterlage |
| `HAENDLERANGEBOT` | System | kundensichtbar | `VERTRAG` | Konditionen für den Betrieb selbst |
| `MARKENNACHWEIS` | Händler, Hersteller | intern | `VERTRAG` | Beleg der Vertretung — stützt `HAENDLER_MARKE` |
| `SCHULUNGSNACHWEIS` | System | kundensichtbar | `VERTRAG` | Wer im Betrieb geschult wurde |
| `KORRESPONDENZ` | beide | intern | `VERTRAG` | bereits im Kern-CRM vorhanden |

**Neue Aufbewahrungsklasse `VERTRIEB`:** Besuchsberichte und interne Notizen zu
einem Betrieb sind keine Vertragsunterlagen und brauchen keine handelsrechtliche
Frist. Sie enthalten aber personenbezogene Einschätzungen und gehören deshalb
nicht dauerhaft aufbewahrt — Vorgabe: **36 Monate** (Kapitel 12).

---

## 2. Ablagestruktur

Der Speicherschlüssel folgt der Organisation, nicht dem Standort — Verträge
schließt der Rechtsträger:

```
organisation/{organisation_id}/
    kooperation/{kooperation_id}/
        vereinbarung_v1.pdf
        vereinbarung_v2.pdf           ← Nachtrag, neue Version
        anlage_konditionen_v1.pdf
    marken/
        markennachweis_{marke_id}_v1.pdf
    vertrieb/
        besuchsbericht_2026-04-11.pdf
        besuchsbericht_2026-09-02.pdf
    angebote/
        haendlerangebot_2026-03-14_v1.pdf
    korrespondenz/
        {jahr}/{monat}/...
    schulung/
        nachweis_{kontakt_id}_2026-05-20.pdf

standort/{standort_id}/
    fotos/                            ← Halle, Ausstellung, Lage
```

### 2.1 Warum diese Struktur

| Entscheidung | Grund |
|---|---|
| Alles unter der **Organisation** | Ein Betrieb, eine Akte. Filialdokumente wären sonst verstreut |
| Kooperation als eigener Zweig | Sie hat Laufzeit, Nachträge und ein Ende — wie ein Vertrag |
| Besuchsberichte nach Datum, nicht nach Person | Der Betrieb wird gelesen, nicht der Mitarbeiter |
| Standortfotos separat | Sie hängen an der Adresse, nicht am Rechtsträger |
| Keine Ordner je Jahr über allem | Wer nach der Vereinbarung sucht, sucht nicht nach dem Jahr |

### 2.2 Was nicht abgelegt wird

| Nicht ablegen | Warum |
|---|---|
| Preislisten der Hersteller | Fremdes Urheberrecht, kein eigener Zweck |
| Kundendaten des Händlers | Nicht unsere Daten, keine Rechtsgrundlage |
| Screenshots von Profilen | Modul 03, ADR-0003 |
| Fotos mit erkennbaren Personen | Ohne Einwilligung kein Zweck |

---

## 3. Der Besuchsbericht

Der Dokumenttyp, der in Vertriebsorganisationen am häufigsten gefordert und am
seltensten geschrieben wird. Deshalb hier mit einer klaren Regel:

> **Ein Besuchsbericht ist ein Formular mit fünf Feldern, nicht ein Aufsatz.**

| Feld | Warum genau dieses |
|---|---|
| Wer war anwesend | Grundlage der Ansprechpartnerpflege |
| Was wurde besprochen | Zwei bis drei Sätze |
| **Was wurde bestätigt** | Bootszahl, Marken, Standorte — hebt den Aktualitätsgrad |
| Was ist vereinbart | Wird zur Aufgabe |
| Was ist aufgefallen | Wettbewerb, Stimmung, Veränderungen |

Die dritte Zeile ist der Grund, weshalb der Bericht überhaupt Pflicht ist: **Sie
verbindet den Besuch mit der Datenqualität.** Ein Besuch ohne bestätigte Angaben
war ein netter Termin; einer mit ihnen hat den Bestand verbessert.

Der Bericht entsteht als Pflichtabschluss der Aufgabe, nicht als eigener
Vorgang. Ohne ihn gilt der Betreuungskontakt als nicht erfolgt — und die
Klassenfrequenz läuft weiter.

---

## 4. Dokumentgetriebene Zustände

Zwei Zustände dieses Moduls hängen an einem Dokument, nicht an einem Häkchen:

| Zustand | Bedingung |
|---|---|
| `KOOPERATION.status = AKTIV` | `dokument_id` gesetzt, Typ `KOOPERATIONSVEREINBARUNG`, Version signiert |
| `pipeline_status = PARTNER_AKTIV` | ebenso |
| `dealer_hub_bereit = true` | ebenso |

**Die Signatur bindet an genau eine Dokumentversion** (Regel aus dem Kern-CRM).
Ein Nachtrag erzeugt eine neue Version, und die neue Version gilt nicht als
signiert, bis sie es ist. Das ist die einzige Absicherung dagegen, dass ein
nachträglich geändertes Konditionsblatt als vereinbart behandelt wird.

---

## 5. Zugriff

| Rolle | Sieht |
|---|---|
| `VERTRIEB`, `INNENDIENST` | alles im eigenen Mandanten |
| `ADMINISTRATOR` | alles, protokolliert |
| `MARKETING` | nur `PRAESENTATION` |
| Händler im Dealer Hub | nur `kundensichtbar`: eigene Vereinbarung, eigene Angebote, eigene Schulungsnachweise |
| Andere Händler | **nichts** |

**Besuchsberichte sind niemals kundensichtbar.** Sie enthalten Einschätzungen
über Personen und Wettbewerb; ihre Offenlegung würde jede künftige Offenheit im
Gespräch beenden.
