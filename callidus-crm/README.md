# Callidus Boots-CRM

Lokales CRM für Bootsversicherungen. Läuft komplett auf einem PC — kein
Server, kein Internet, keine Cloud. Datenbank ist eine einzelne Datei.

Aufbau und Begründung der Technikentscheidungen: siehe `ARCHITECTURE.md`.

## Installation (einmalig)

[Node.js](https://nodejs.org) installieren (LTS-Version genügt), dann im
Projektordner:

```
npm run install:all
```

Das installiert die Abhängigkeiten an allen drei Stellen (Root, `server/`,
`client/`). Wer es einzeln machen will:

```
npm install
npm --prefix server install
npm --prefix client install
```

## Starten

```
npm run dev
```

Startet Backend und Frontend gemeinsam. Danach im Browser öffnen:

**http://localhost:5173**

| Was | Adresse |
|---|---|
| Anwendung (Frontend) | http://localhost:5173 |
| Backend-API | http://localhost:3001/api |
| Health-Check | http://localhost:3001/api/health |

Beenden mit `Strg + C` im Terminal.

## Wo die Daten liegen — wichtig fürs Backup

| Was | Ort |
|---|---|
| Gesamte Datenbank (Kunden, Boote, Polizzen, Aufgaben, Historie) | `server/callidus.db` |
| Hochgeladene Dokumente (PDFs) | `server/uploads/<kunden-id>/` |

**Ein vollständiges Backup ist das Kopieren dieser beiden Orte.** Am
einfachsten den gesamten Ordner `server/` sichern — regelmäßig auf einen
USB-Stick oder in einen Cloud-Sync-Ordner (OneDrive o. ä.).

Beide sind bewusst von der Versionsverwaltung ausgenommen (`.gitignore`):
Sie enthalten echte Kundendaten und gehören nicht in ein Repository.

Zum Zurückspielen genügt es, die gesicherten Dateien wieder an ihren Platz
zu legen — die Anwendung muss dabei gestoppt sein.

Beim Start wird die Datenbank automatisch angelegt, falls sie fehlt; das
Schema steht in `server/schema.sql`.

## Stand

Der Fahrplan steht in `PROMPTS.md` (9 Schritte). Erledigt sind:

| Schritt | Inhalt | |
|---|---|---|
| 1 | Projekt-Grundgerüst, Health-Check | fertig |
| 2 | Backend Kunden & Boote, `api.js` | fertig |
| 3 | Frontend Kunden-Tab portiert | fertig |
| 4 | Partner (Backend + Frontend) | fertig |
| 5 | Polizzen & Prämienrechner | offen |
| 6 | Aufgaben (automatische Erinnerungen) | offen |
| 7 | Nächster-Schritt-Bereich, Vergleich, Textbausteine | offen |
| 8 | Historie, Dokumente, Newsletter, Import | offen |
| 9 | Wochenziel, Pipeline-Übersicht, `start-crm.bat` | offen |

Zum Weiterarbeiten in einer neuen Sitzung genügt:
„Lies ARCHITECTURE.md und PROMPTS.md, wir sind bei Prompt 5."

Die Vorlage für alle noch offenen Teile ist `BootsCRM_reference.jsx` im
Projekt-Root — die bisherige App, aus der portiert wird. Sie wird nicht
ausgeführt, nur gelesen.
