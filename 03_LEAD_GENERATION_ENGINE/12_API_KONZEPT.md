# 12 — API-Konzept

Ergänzt [`02_CORE_CRM/10_API_KONZEPT.md`](../02_CORE_CRM/10_API_KONZEPT.md). Die
dort festgelegten Eigenschaften — Versionierung im Pfad, Idempotenzschlüssel bei
schreibenden Aufrufen, Fehlerformat, Ereignisse über die Outbox, mTLS im privaten
Netz — gelten unverändert und werden hier nicht wiederholt.

---

## 1. Die Grenze, die auch in der Schnittstelle sichtbar ist

Der Rechercheraum liegt unter einem eigenen Pfad `/v1/research/…`, das CRM unter
`/v1/…`. **Kein Endpunkt schreibt über die Grenze hinweg**, mit genau einer
Ausnahme: der Freigabe (§3).

Das ist keine Kosmetik. Es macht die Trennung an der Stelle prüfbar, an der sie
sonst verloren geht — bei der nächsten Erweiterung.

---

## 2. Endpunkte des Rechercheraums

### 2.1 Quellen und Läufe

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/v1/research/sources` | Quellen mit Klasse, Güte, Takt, letzter Lauf |
| `POST` | `/v1/research/sources` | Quelle anlegen. `erlaubnis = UNGEKLAERT` ⇒ nicht ausführbar |
| `PATCH` | `/v1/research/sources/{id}` | Takt, Güte, Aktivkennzeichen |
| `POST` | `/v1/research/sources/{id}/runs` | Lauf starten. **Abgewiesen** bei ungeklärter Erlaubnis oder Freigabebremse |
| `GET` | `/v1/research/runs/{id}` | Stand, Zahlen, Fehler |

### 2.2 Objekte

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/v1/research/objects` | Filter: Zielgruppe, Land, Revier, Klasse, Status, Score |
| `GET` | `/v1/research/objects/{id}` | Vollbild **mit Belegen, Herleitung, Dubletten- und Sperrlage** — ein Aufruf für die Prüfmaske |
| `POST` | `/v1/research/objects` | Manuelle Erfassung, etwa nach einer Messe |
| `PATCH` | `/v1/research/objects/{id}` | Feldkorrektur. Erzeugt einen Beleg mit `quelle = MANUELL` |
| `GET` | `/v1/research/review-queue` | Prüfliste, sortiert nach Basiswert und Alter |

`GET /objects/{id}` ist der Endpunkt, an dem die Bedienbarkeit hängt: Die
Prüfmaske muss aus **einem** Aufruf gefüllt sein. Sieben Einzelaufrufe je
Bildschirm sind der Grund, warum Prüfarbeit liegen bleibt.

### 2.3 Abgleich und Sperren

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/v1/research/objects/{id}/matches` | Vorschläge mit Kennzahl und Regeltreffern |
| `POST` | `/v1/research/matches/{id}/decision` | `IST_DIESELBE`, `IST_ANDERE`, `UNKLAR`. **Führt nicht zusammen** |
| `GET` | `/v1/research/blocks` | Sperrvermerke |
| `POST` | `/v1/research/blocks` | Sperre setzen — **auch aus dem Vertrieb heraus, sofort** |
| `DELETE` | `/v1/research/blocks/{id}` | Nur mit Begründung, nur Administration, nie bei `WIDERSPRUCH` |

### 2.4 Kennzahlen

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/v1/research/coverage` | Abdeckungsgrad je Zielgruppe und Land, mit Nenner, Quelle und Stand |
| `GET` | `/v1/research/source-balance` | Quellenbilanz (Kapitel 11.4) |

---

## 3. Die Freigabe — der einzige Übergang

```
POST /v1/research/objects/{id}/release
Idempotency-Key: 7f2a9c14-…

{
  "organisationsrolle": "PARTNER",
  "betreuer_id": "…",
  "rechtsgrundlage": "BERECHTIGTES_INTERESSE",
  "kontakt_uebernehmen": true,
  "bemerkung": "Marina mit 310 Liegeplätzen, Betreiber bekannt aus Messe"
}
```

**Antwort 201**

```
{
  "organisation_id": "…",
  "kontakt_ids": ["…"],
  "aufgabe_id": "…",
  "regel_code": "L-05",
  "objektnummer": "R000418"
}
```

**Antwort 409** bei jeder verletzten Bedingung aus Kapitel 7.2 — mit Angabe,
welche:

```
{
  "typ": "https://callidus.example/errors/freigabe-blockiert",
  "titel": "Freigabe nicht möglich",
  "status": 409,
  "grund": "SPERRVERMERK_AKTIV",
  "detail": "Domain marina-beispiel.at gesperrt seit 2026-03-11 (WIDERSPRUCH)"
}
```

Der Aufruf ist **die einzige Stelle**, an der Recherchedaten ins CRM gelangen.
Ein Prüfer der Architektur muss genau einen Endpunkt ansehen, um zu beurteilen,
ob die Trennung hält.

---

## 4. Ereignisse

Über dieselbe Outbox wie das Kern-CRM, damit kein Verbraucher zwei Mechaniken
kennen muss.

| Ereignis | Verbraucher | Inhalt |
|---|---|---|
| `research.object.released` | CRM, Dashboard | Objekt, Organisation, Rolle, Klasse |
| `research.object.discarded` | Dashboard | Grund |
| `research.run.completed` | Dashboard, Betrieb | Zahlen, Dauer, Fehler |
| `research.match.pending` | Dashboard | Vorschläge ≥ 0,80 |
| `research.block.created` | CRM, Marketing | Schlüsselart, Schlüssel, Frist |
| `crm.organisation.status_changed` | **Rechercheraum** | Rückfluss (Kapitel 7.5) |
| `crm.contact.objected` | **Rechercheraum**, Marketing | Widerspruch — löst sofort Sperre aus |

Die beiden letzten Zeilen sind die Rückrichtung. Ohne sie fehlt dem
Rechercheraum das Gedächtnis, und das System schlägt abgelehnte Ziele erneut vor.

---

## 5. Verbraucher im Einzelnen

| Verbraucher | Darf | Darf ausdrücklich nicht |
|---|---|---|
| **CRM-Werkbank** (WordPress) | Prüfliste, Freigabe, Sperren, Kennzahlen | Rohdaten in WordPress speichern |
| **Newsletter-Engine (Brevo)** | **nichts aus dem Rechercheraum** | Jeder Zugriff — es besteht keine Verbindung (Kapitel 10.4.2) |
| **Marketing Automation** | Aggregierte Zahlen, Anlässe | Einzeladressen, Ansprechpartner |
| **Partnerportal** | nichts | Der Rechercheraum ist nach außen unsichtbar |
| **Power Automate** | Aufgaben und Termine im CRM | Schreibzugriff auf Objekte, Quellen, Sperren |
| **KI-Agent** | Lesen zur Vorschlagserzeugung | **Schreiben, freigeben, sperren, versenden** |
| **LinkedIn und andere Plattformen** | **keine Verbindung** | Kapitel 4.5, [ADR-0003](adr/0003-erlaubte-quellen.md) |

### 5.1 Zur Rolle eines KI-Agenten

Sinnvoll ist er an drei Stellen — und an keiner davon mit Schreibrecht:

| Aufgabe | Nutzen | Grenze |
|---|---|---|
| Klassifikation der Untergruppe aus Impressum und Beschreibung | Spart den größten Teil der Handarbeit | Vorschlag mit Konfidenz. Der Mensch bestätigt |
| Ansprechpartner und Funktion aus einer Kontaktseite lesen | Anreicherung | Kein Personendatensatz ohne Bestätigung |
| Dublettenvorschläge in unklaren Fällen begründen | Erklärt statt entscheidet | Keine Zusammenführung |

Verbindlich bleibt ADR-0008 der Gesamtarchitektur: **KI ohne Schreibrechte.**
Und: Personenbezogene Daten gehen nicht ohne geprüfte Rechtsgrundlage und
Auftragsverarbeitungsvertrag an einen externen Dienst — dieselbe Frage wie C-08
beim Polizzenimport. Solange sie offen ist, läuft die Klassifikation lokal oder
gar nicht.

---

## 6. Rechte

| Rolle | Rechercheraum |
|---|---|
| `ADMINISTRATOR` | Quellen, Läufe, Regeln, Sperren aufheben |
| `VERTRIEB` | Objekte lesen, prüfen, freigeben, verwerfen, sperren |
| `INNENDIENST` | wie Vertrieb, **ohne Freigabe** |
| `MARKETING` | **kein Zugriff** |
| `MAKLER`, `PARTNER`, `KUNDE` | **kein Zugriff** |

Dass Marketing keinen Zugriff hat, ist die praktische Absicherung von Kapitel 10:
Was nicht lesbar ist, kann nicht in einen Verteiler geraten.
