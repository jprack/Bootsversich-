# 11 — API-Konzept

Ergänzt [`02_CORE_CRM/10_API_KONZEPT.md`](../02_CORE_CRM/10_API_KONZEPT.md). Die
dort festgelegten Eigenschaften — Versionierung im Pfad, Idempotenzschlüssel bei
schreibenden Aufrufen, Fehlerformat, Ereignisse über die Outbox, mTLS im privaten
Netz — gelten unverändert.

---

## 1. Wo die Händlerdaten leben

Es gibt **keinen eigenen Pfad** `/v1/dealers/…` neben `/v1/organisations/…`.
Ein Händler ist eine Organisation mit einer Rolle; ein zweiter Pfad wäre die
Wiederholung des Fehlers, den ADR-0001 vermeidet.

Stattdessen: **eine Rollensicht auf dieselbe Ressource.**

```
GET /v1/organisations/{id}                     → Stammdaten, alle Rollen
GET /v1/organisations/{id}/dealer-profile      → Rollenprofil HAENDLER
GET /v1/organisations?role=HAENDLER&…          → Händlerliste mit Filtern
```

Damit gilt jede Berechtigungs-, Mandanten- und Löschregel des Kern-CRM
unverändert — ohne dass sie ein zweites Mal geschrieben und ein zweites Mal
falsch werden kann.

---

## 2. Endpunkte

### 2.1 Händler und Profil

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/v1/organisations?role=HAENDLER` | Filter: Land, Region, Revier, Klasse, Wert, Marke, Produktbereich, Pipelinestatus, Aktualität |
| `GET` | `/v1/organisations/{id}/dealer-profile` | **Ein Aufruf, ganzer Bildschirm**: Profil, Standorte, Marken, Kooperationen, Wert mit Herleitung, Ansprechpartner, letzte Aktivitäten, offene Aufgaben |
| `PATCH` | `/v1/organisations/{id}/dealer-profile` | Profilfelder. Jede Änderung an beurteilenden Feldern verlangt `herkunft` |
| `POST` | `/v1/organisations/{id}/dealer-profile/confirm` | **Datenstand bestätigen** — hebt den Aktualitätsgrad |

`dealer-profile` ist der Endpunkt, an dem die Bedienbarkeit hängt. Sieben
Einzelaufrufe je Bildschirm sind der Grund, warum Vertriebssysteme umgangen
werden.

### 2.2 Standorte

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` `POST` | `/v1/organisations/{id}/locations` | Standorte lesen und anlegen |
| `PATCH` `DELETE` | `/v1/locations/{id}` | Ändern; Löschen setzt `aktiv_bis`, entfernt nichts |
| `POST` | `/v1/locations/{id}/promote` | **Filiale wird eigener Rechtsträger** — erzeugt eine neue Organisation und verschiebt den Standort |

`promote` ist selten und heikel: Es ist der einzige Weg, eine Filiale in eine
eigene Firma zu überführen, ohne die Historie zu verlieren. Ohne diesen Endpunkt
wird es von Hand gemacht — und dabei geht die Zuordnung der Altvorgänge verloren.

### 2.3 Marken

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` `POST` | `/v1/brands` | Markenkatalog |
| `PATCH` | `/v1/brands/{id}` | `ist_premiumwerft` nur mit `premiumwerft_quelle` |
| `GET` `POST` | `/v1/organisations/{id}/brands` | Vertretungen lesen, neue anlegen |
| `POST` | `/v1/dealer-brands/{id}/end` | Vertretung beenden — **mit Grund und Datum**, nie löschen |
| `GET` | `/v1/brands/{id}/dealers` | Händlernetz einer Marke |

`/v1/brands/{id}/dealers` ist die Grundlage der Markenlandkarte (Kapitel 10.5)
und zugleich das, was man einem Hersteller zeigt.

### 2.4 Kooperationen und Veranstaltungen

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` `POST` | `/v1/organisations/{id}/cooperations` | |
| `POST` | `/v1/cooperations/{id}/activate` | **Abgewiesen ohne signiertes Dokument** |
| `POST` | `/v1/cooperations/{id}/terminate` | Mit Beendigungsgrund |
| `GET` `POST` | `/v1/events` · `/v1/events/{id}/participants` | Veranstaltungen und Teilnahmen |

### 2.5 Auswertung

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/v1/dealers/coverage` | Aktualitätsgrad je Klasse, Region, Revier |
| `GET` | `/v1/dealers/portfolio` | Bestand nach Klasse, Marke, Region, Pipelinestatus |
| `GET` | `/v1/dealers/referral-performance` | Vermittlungsquote je Partner |
| `GET` | `/v1/dealers/due-for-contact` | Betreuung fällig — die Tagesliste des Vertriebs |

---

## 3. Ereignisse

| Ereignis | Verbraucher | Anlass |
|---|---|---|
| `dealer.profile.updated` | Dashboard, Suche | Profiländerung |
| `dealer.class.changed` | CRM, Führung | Klassenwechsel, mit alter und neuer Klasse |
| `dealer.brand.added` / `dealer.brand.ended` | Tarifwerk, Dashboard | **Tarifwerk hört mit**, wegen des Premiumwerften-Nachlasses |
| `dealer.cooperation.activated` / `.terminated` | Dealer Hub, Newsletter, Führung | Portalzugang und Verteiler folgen dem Vertrag |
| `dealer.location.added` / `.closed` | Lead Engine, Dashboard | Verhindert Neuerfassung als eigener Betrieb |
| `dealer.contact.confirmed` | Dashboard | Hebt den Aktualitätsgrad |
| `dealer.referral.received` | Händlerwert, Dashboard | Speist den Ertragsteil |

**`dealer.location.added` in Richtung Lead Engine** schließt die Lücke aus
Kapitel 3.4: Sobald eine Filiale bekannt ist, darf der Rechercheraum sie nicht
mehr als eigenständigen Betrieb vorschlagen.

---

## 4. Verbraucher im Einzelnen

| Verbraucher | Darf | Darf ausdrücklich nicht |
|---|---|---|
| **CRM-Werkbank** (WordPress) | Alles im eigenen Mandanten | Fachdaten in `wp_postmeta` speichern |
| **Lead Engine** (Modul 03) | Abgleich gegen Bestand, Standorte lesen, Sperren setzen | Händlerprofile schreiben |
| **Newsletter (Brevo)** | **Nur Kontakte mit Einwilligung** | Adressen ohne Einwilligung, Verhaltensdaten ohne Messeinwilligung |
| **Marketing Automation** | Aggregierte Zahlen, Veranstaltungsanlässe | Einzeladressen, Händlerwerte |
| **Partnerportal (Dealer Hub)** | **Nur eigene Daten** des angemeldeten Händlers | Andere Händler, Klassen, Werte, Besuchsberichte |
| **Kundenportal** | nichts | Händlerdaten sind nicht kundensichtbar |
| **Power Automate** | Aufgaben, Termine, Kalender | Schreibzugriff auf Profil, Marken, Kooperationen |
| **KI-Agent** | Lesen zur Vorschlagserzeugung | **Schreiben, freigeben, aktivieren, versenden** |

### 4.1 Der Dealer Hub sieht seine eigene Bewertung nicht

Klasse, Händlerwert, Wettbewerbsnotizen und Besuchsberichte sind **nicht**
Bestandteil der Partnersicht. Das ist keine Geheimniskrämerei, sondern
Betriebsnotwendigkeit: Eine offengelegte Klassifizierung wird zum
Verhandlungsgegenstand, und Besuchsberichte enthalten Einschätzungen, die
niemand mehr aufschreibt, sobald sie sichtbar sind.

**Was der Händler sieht:** eigene Stammdaten, eigene Standorte, eigene
Vereinbarung, eigene vermittelte Vorgänge mit Stand, eigene Provisionsübersicht,
eigene Schulungsnachweise.

### 4.2 Zur Rolle eines KI-Agenten

Drei sinnvolle Stellen, keine davon mit Schreibrecht:

| Aufgabe | Nutzen | Grenze |
|---|---|---|
| Besuchsbericht aus Stichpunkten formulieren | Senkt die Hürde, die Berichte überhaupt zu schreiben | Vorschlag, der Mensch bestätigt und verantwortet |
| Markenänderungen in Herstellerlisten erkennen | Hebt den Aktualitätsgrad ohne Handarbeit | Erzeugt `D-22`, ändert nichts selbst |
| Cross-Selling-Anlässe vorschlagen | Findet, was in Kapitel 7 Gruppe 5 formal nicht abgedeckt ist | Vorschlag, kein Kontakt |

Verbindlich bleibt ADR-0008 der Gesamtarchitektur: **KI ohne Schreibrechte.**
Personenbezogene Daten gehen nicht ohne geprüfte Rechtsgrundlage und
Auftragsverarbeitungsvertrag an einen externen Dienst — dieselbe offene Frage
wie C-08 und L-05.

---

## 5. Rechte

| Rolle | Händlerdaten |
|---|---|
| `ADMINISTRATOR` | vollständig, protokolliert |
| `VERTRIEB` | vollständig im eigenen Mandanten, Kooperationen aktivieren mit Freigabe |
| `INNENDIENST` | lesen und pflegen, **keine** Kooperationsaktivierung |
| `MARKETING` | Stammdaten und Einwilligungsstatus, **keine** Werte, Klassen, Berichte |
| `MAKLER` | nur eigene Zuordnungen |
| `PARTNER` (Dealer Hub) | §4.1 |
| `KUNDE` | kein Zugriff |
