# Callidus Boots-CRM — lokale Version — Architektur

## Ziel
Die bestehende Boots-CRM-App (aktuell ein einzelnes React-Artefakt, das im
Browser-Speicher von Claude.ai lebt) als **lokale Anwendung** auf einem
einzelnen PC (Windows 11) betreiben. Ein Nutzer, kein Internet nötig, ein
Befehl zum Starten.

## Warum dieser Stack

| Baustein | Wahl | Warum |
|---|---|---|
| Datenbank | **SQLite** (Datei `callidus.db`) | Kein Datenbankserver nötig, eine einzelne Datei, einfach zu sichern (kopieren reicht) |
| Backend | **Node.js + Express** | Leichtgewichtig, läuft lokal mit einem Befehl, gute SQLite-Anbindung |
| DB-Zugriff | **better-sqlite3** | Synchron (kein async/await-Ballast für einfache Abfragen), sehr schnell für lokale Nutzung |
| Frontend | **React + Vite** | Baut auf der bestehenden App auf (siehe `BootsCRM_reference.jsx`), Vite = schneller lokaler Dev-Server |
| Dateien (PDFs) | **Lokaler Ordner** `server/uploads/<customerId>/` | Statt Base64 im Speicher — echte Dateien, direkt im Windows-Explorer einsehbar |
| Start | **Ein Befehl** (`npm run dev` im Root, startet Backend + Frontend zusammen via `concurrently`) | Kein Docker, keine Cloud-Kontoeinrichtung |

## Ordnerstruktur

```
callidus-crm/
├── package.json                 # Root: Skripte zum gemeinsamen Starten
├── server/
│   ├── package.json
│   ├── index.js                 # Express-App, bindet alle Routen
│   ├── db.js                    # SQLite-Verbindung + Schema-Init (führt schema.sql aus)
│   ├── schema.sql                # Tabellenschema (siehe eigene Datei)
│   ├── routes/
│   │   ├── customers.js         # CRUD Kunden (inkl. Boote als verschachtelte Ressource)
│   │   ├── boats.js
│   │   ├── partners.js
│   │   ├── vertraege.js         # Polizzen inkl. Sparten
│   │   ├── tasks.js             # Aufgaben (Angebot nachfassen, Kündigungsfrist, Geburtstag...)
│   │   ├── historie.js
│   │   ├── documents.js         # Datei-Upload/-Download (multer)
│   │   └── settings.js          # Wochenziel etc.
│   ├── lib/
│   │   ├── tarife.js            # calcNautima/calcCallidus — 1:1 aus BootsCRM_reference.jsx portieren
│   │   └── tasks-logic.js       # Werktage-Berechnung, Kündigungsfrist, Geburtstags-Erinnerung
│   └── uploads/                 # PDF-Ablage, pro Kunde ein Unterordner (git-ignoriert)
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx              # Tab-Navigation (aus BootsCRM_reference.jsx übernehmen)
│       ├── api.js                # fetch-Wrapper — ERSETZT window.storage komplett
│       ├── lib/
│       │   ├── tarife.js         # gleiche Logik wie server/lib/tarife.js (dupliziert, da Rechner
│       │   │                     #   live im Browser rechnet — kein Server-Roundtrip pro Tastendruck)
│       │   └── format.js         # euro(), fullName(), Datumsformatierung
│       └── features/
│           ├── kunden/           # KundenTab, CustomerForm, CustomerDetail, BoatForm, BoatCard...
│           ├── partner/          # PartnerTab, PartnerForm, PartnerDetail
│           ├── aufgaben/         # AufgabenTab
│           ├── rechner/          # RechnerTab, NautimaAntragTab, CallidusDatenblattTab
│           ├── newsletter/       # NewsletterTab
│           └── import/           # ImportTab
└── BootsCRM_reference.jsx        # Die bestehende App — NUR als Referenz, wird nicht direkt ausgeführt
```

## Kernprinzip der Umstellung

Die bestehende App ruft überall Dinge wie auf:
```js
await window.storage.set(`customer:${id}`, record, true);
await storageGetJSON(`customer:${id}`, true);
await window.storage.list("customer:", true);
```

Das wird 1:1 ersetzt durch einen kleinen `api.js`-Client im Frontend:
```js
await api.customers.save(record);
await api.customers.get(id);
await api.customers.list();
```
`api.js` macht `fetch()`-Aufrufe gegen `http://localhost:3001/api/...`. Die
komplette UI-Logik (Formulare, Berechnungen, Anzeige) bleibt praktisch
unverändert — nur die Speicher-Aufrufe werden ausgetauscht. Das ist der
Grund, warum sich das Projekt gut in Phasen aufteilen lässt (siehe
`PROMPTS.md`): Erst Datenbank + API, dann Feature für Feature andocken.

## Was sich inhaltlich ändert (bewusste Verbesserungen beim Umbau)

- **Dokumente als echte Dateien** statt Base64-Text in der Datenbank — schneller, kleinere DB-Datei, im Explorer einsehbar/sicherbar.
- **Boote, Verträge/Sparten, Aufgaben, Historie** werden echte Tabellen mit Fremdschlüssel auf `customers.id` statt verschachtelter JSON-Arrays — sauberer abfragbar (z. B. für die Wochenziel-/Trichter-Auswertung), aber inhaltlich das gleiche Datenmodell wie jetzt.
- **Backup**: Da alles in `callidus.db` + `server/uploads/` liegt, reicht ein regelmäßiges Kopieren dieser zwei Orte (z. B. auf einen USB-Stick oder in einen Cloud-Sync-Ordner wie OneDrive) als vollständiges Backup.

## Nicht im Scope (bewusst weggelassen für v1 lokal)

- Mehrbenutzer-Login (nur du nutzt es lokal)
- Cloud-Hosting/Internet-Zugriff von unterwegs — falls das später gewünscht ist, ist der gleiche Stack (Node + SQLite) auch bei einem einfachen VPS einsetzbar, das ist ein späterer, separater Schritt
- Outlook-/Brevo-Anbindung — die lief bisher über Claude im Chat, nicht aus der App heraus. Das bleibt vorerst unverändert (Text kopieren → Claude im Chat einfügen), eine direkte Anbindung wäre ein eigenes, größeres Thema (Zugangsdaten/OAuth lokal verwalten)
