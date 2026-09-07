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

## Am Handy testen (gleiches WLAN)

Die App läuft normalerweise nur auf dem PC selbst. Zum Testen am Handy gibt
es einen zweiten Startbefehl, der sie zusätzlich im lokalen Netz sichtbar
macht:

```
npm run dev:lan
```

Dann:

1. **IP des PCs herausfinden** — Eingabeaufforderung öffnen, `ipconfig`
   eingeben, bei „IPv4-Adresse" ablesen (z. B. `192.168.0.42`).
   Vite gibt die Adresse beim Start auch selbst aus, in der Zeile
   `➜ Network:`.
2. **Windows-Firewall**: Beim ersten Start fragt Windows, ob Node.js im
   Netzwerk kommunizieren darf. **Erlauben** — und zwar für *private*
   Netzwerke. Ohne diese Freigabe ist der PC vom Handy aus nicht erreichbar.
3. **Handy ins selbe WLAN** (nicht Mobilfunk!) und im Browser aufrufen:
   `http://192.168.0.42:5173` — mit deiner eigenen IP von Schritt 1.

### Was dabei zu beachten ist

- **Es gibt keine Anmeldung.** Solange `dev:lan` läuft, kann jedes Gerät im
  selben WLAN die Kundendaten sehen und ändern. Zu Hause ist das in Ordnung.
  In einem Hotel-, Hafen- oder Café-WLAN nicht — dort besser den normalen
  `npm run dev` nutzen, der nur den eigenen Rechner bedient.
- **Der normale `npm run dev` bleibt unverändert** auf den eigenen Rechner
  beschränkt. Der Netzbetrieb ist eine bewusste Ausnahme, kein Standard.
- **Nur zum Ansehen und Ausprobieren gedacht.** Die Datenbank liegt weiter
  auf dem PC; das Handy ist nur ein Fenster darauf. Läuft der PC nicht,
  läuft die App nicht.

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
| 5 | Polizzen & Prämienrechner | fertig |
| 6 | Aufgaben (automatische Erinnerungen) | fertig |
| 7 | Nächster-Schritt-Bereich, Vergleich, Textbausteine | offen |
| 8 | Historie, Dokumente, Newsletter, Import | offen |
| 9 | Wochenziel, Pipeline-Übersicht, `start-crm.bat` | offen |

Zum Weiterarbeiten in einer neuen Sitzung genügt:
„Lies ARCHITECTURE.md und PROMPTS.md, wir sind bei Prompt 7."

Die Vorlage für alle noch offenen Teile ist `BootsCRM_reference.jsx` im
Projekt-Root — die bisherige App, aus der portiert wird. Sie wird nicht
ausgeführt, nur gelesen.
