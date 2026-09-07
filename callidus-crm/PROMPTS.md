# Prompts für Claude Code — Boots-CRM lokal aufbauen

## So verwendest du das

1. Leg einen neuen Ordner an, z. B. `callidus-crm`, und kopiere diese Dateien hinein:
   `ARCHITECTURE.md`, `schema.sql`, `PROMPTS.md`, `BootsCRM_reference.jsx`
2. Öffne Claude Code in diesem Ordner (`claude` im Terminal, oder über die
   Claude-Code-Desktop-App → "Open Folder").
3. Arbeite die Prompts unten **der Reihe nach** ab — jeder baut auf dem
   vorigen auf. Kopier einen Prompt-Block komplett, warte bis Claude Code
   fertig ist und du es kurz ausprobiert hast, dann erst den nächsten.
4. Am Anfang jeder Sitzung (auch an einem anderen Tag): sag einfach
   "Lies ARCHITECTURE.md und PROMPTS.md, wir sind bei Prompt X" — Claude Code
   liest sich dann selbst wieder ein.
5. Nach JEDEM Prompt: kurz `npm run dev` laufen lassen und im Browser
   `http://localhost:5173` (oder die von Vite ausgegebene Adresse) prüfen,
   bevor du weitermachst. Kleine Schritte, oft testen — nicht alles auf
   einmal bauen lassen.

---

## Prompt 1 — Projekt-Grundgerüst

```
Lies ARCHITECTURE.md und schema.sql in diesem Ordner — das ist der Bauplan
für ein lokales Boots-CRM (Node/Express/SQLite-Backend + React/Vite-Frontend).

Bau mir jetzt das Grundgerüst:

1. Root-package.json mit Skript "dev", das server und client gleichzeitig
   startet (via "concurrently"), z. B. `npm run dev` startet beides.
2. server/: Express-App (server/index.js) auf Port 3001, CORS erlaubt für
   localhost:5173. server/db.js verbindet sich mit better-sqlite3 auf
   server/callidus.db und führt beim Start schema.sql aus (falls Tabellen
   noch nicht existieren). Lege server/uploads/ als leeren, git-ignorierten
   Ordner an (mit .gitkeep).
3. client/: Vite + React Grundgerüst (client/src/main.jsx, App.jsx mit
   Platzhalter-Text "Callidus Boots-CRM läuft"). Ein einfacher fetch-Test
   gegen einen Health-Check-Endpunkt (GET /api/health am Server) soll
   beweisen, dass Frontend und Backend miteinander reden.
4. Eine .gitignore (node_modules, server/callidus.db, server/uploads/*
   außer .gitkeep, .env).
5. README.md im Root: wie installiert man (npm install in Root, server/,
   client/), wie startet man (npm run dev), wo liegt die Datenbank/die PDFs
   (fürs Backup wichtig).

Danach: npm install überall ausführen und npm run dev kurz testen, dass
beide Server hochfahren und der Health-Check im Browser sichtbar ist.
```

---

## Prompt 2 — Backend: Kunden & Boote

```
Baue jetzt die Backend-Routen für Kunden und Boote (server/routes/customers.js,
server/routes/boats.js), gemäß schema.sql (Tabellen customers, boats).

Endpunkte:
- GET    /api/customers            — alle Kunden inkl. ihrer Boote (als
                                      verschachteltes Array "boote") in einer
                                      Antwort, sortiert nach nachname, vorname
- GET    /api/customers/:id        — ein Kunde inkl. Boote
- POST   /api/customers            — neuen Kunden anlegen (Feldliste siehe
                                      schema.sql customers-Tabelle)
- PUT    /api/customers/:id        — Kunde aktualisieren
- DELETE /api/customers/:id        — Kunde löschen (CASCADE löscht Boote,
                                      Verträge, Aufgaben, Historie, Dokumente
                                      automatisch mit, siehe ON DELETE CASCADE
                                      in schema.sql)
- POST   /api/customers/:id/boats  — Boot zu Kunde hinzufügen
- PUT    /api/boats/:id            — Boot aktualisieren
- DELETE /api/boats/:id            — Boot löschen

Nutze crypto.randomUUID() für neue IDs. updated_at bei jedem PUT auf
datetime('now') setzen.

Baue außerdem client/src/api.js: ein fetch-Wrapper-Modul mit
`api.customers.list()`, `.get(id)`, `.save(data)` (erkennt selbst POST vs
PUT anhand ob data.id gesetzt ist), `.delete(id)`, `.addBoat(customerId, boat)`,
`.updateBoat(boat)`, `.deleteBoat(id)`. Basis-URL http://localhost:3001/api.

Test: Über die Browser-Konsole oder ein kurzes Testskript einen Kunden
anlegen, abrufen, ein Boot hinzufügen, wieder abrufen — Boot muss im
verschachtelten Array auftauchen.
```

---

## Prompt 3 — Frontend: Kunden-Tab portieren

```
Öffne BootsCRM_reference.jsx und suche folgende Teile:
- function fullName, function customerSortKey, function splitFullName
  (Namens-Hilfsfunktionen)
- function CustomerForm
- function CustomerDetail (nur den Grundgerüst-Teil: Kopfbereich, Sub-Tab-
  Navigation Übersicht/Boote/Dokumente/Historie, detail-grid — die anderen
  Sub-Tabs bauen wir in späteren Prompts)
- function KundenTab (Listenansicht, Suche, Pipeline-Leiste oben mit den
  Status-Zählern)
- function BoatForm, function BoatCard, function getBoats, function
  boatsSubtitle, BOAT_FIELD_DEFS
- Die zugehörigen CSS-Regeln (am Ende der Datei, z.B. .customer-row,
  .pipeline-bar, .pipeline-chip, .subtabnav, .subtab, .boat-card, ...)

Portiere das nach client/src/features/kunden/ (mehrere Dateien:
CustomerForm.jsx, CustomerDetail.jsx, KundenTab.jsx, BoatForm.jsx,
BoatCard.jsx, helpers.js für die Namens-Hilfsfunktionen).

WICHTIG: Ersetze jeden window.storage-Aufruf durch den passenden
api.customers.*-Aufruf aus client/src/api.js. Die restliche Logik
(Formularfelder, Validierung, Anzeige) soll inhaltlich unverändert bleiben.

Binde KundenTab in App.jsx als ersten (Standard-)Tab ein.

Test: Kunde anlegen, bearbeiten, Boot hinzufügen/bearbeiten/löschen, Kunde
löschen — alles über die UI durchklicken und prüfen, dass es nach einem
Seiten-Reload noch da ist (= wirklich in SQLite gespeichert, nicht nur im
Browser-State).
```

---

## Prompt 4 — Backend + Frontend: Partner

```
Gleiches Muster wie Kunden, jetzt für Partner (Tabelle partners in
schema.sql).

Backend: server/routes/partners.js mit GET/POST/PUT/DELETE analog zu
customers. bootsbauer_typ wird als JSON-String in der DB gehalten — beim
Lesen zu einem Array parsen, beim Schreiben zu einem JSON-String machen.

client/src/api.js: api.partners.list/get/save/delete ergänzen.

Frontend: Suche in BootsCRM_reference.jsx nach function PartnerForm,
PartnerDetail, PartnerTab, PartnerImport, partnerTypeLabel, PARTNER_TYPES.
Portiere nach client/src/features/partner/. PartnerDetail zeigt verlinkte
Kunden (customers mit passendem partner_id) — das kannst du entweder über
einen eigenen Endpunkt GET /api/partners/:id/customers lösen oder im
Frontend aus der schon geladenen customers-Liste filtern (letzteres ist
einfacher, wenn die App eh alle Kunden im State hält).

Ergänze im CustomerForm das Feld "Partner / Vermittler" (Dropdown aus
api.partners.list()) und "Provision (%)" — falls das im letzten Prompt noch
nicht mit portiert wurde.

Test: Partner anlegen, Kunde damit verknüpfen, in PartnerDetail muss der
Kunde auftauchen inkl. der Leistungsstatistik (Kunden gebracht / Polizze-
Quote / Prämie generiert — Logik dazu ebenfalls aus BootsCRM_reference.jsx
übernehmen, Funktion ist der Block direkt unter "Verlinkte Kunden" in
PartnerDetail).
```

---

## Prompt 5 — Backend + Frontend: Polizzen (Verträge/Sparten) & Prämienrechner

```
Backend: server/routes/vertraege.js — Verträge inkl. verschachtelter
Sparten (Tabellen vertraege, sparten in schema.sql).
- POST /api/customers/:id/vertraege  — neuen Vertrag mit Sparten-Array anlegen,
  UND setzt customers.status auf 'polizze' (in einer Transaktion)
- GET wird über GET /api/customers/:id mitgeliefert (vertraege als
  verschachteltes Array in der Kunden-Antwort, analog zu boote)

Portiere aus BootsCRM_reference.jsx:
- function vertragTotal, function VertragCard, function PolizzeErfassenForm
- Die komplette Tarifrechen-Logik: function calcNautima, function
  calcCallidus, und alle Konstanten davor (NAUTIMA_KASKO_TABELLE,
  CALLIDUS_..._TABELLEN, ZONEN, SFR_OPTIONEN, etc. — such im Bereich
  zwischen "Prämien-Berechnung" und "Prämienrechner" in der Datei)
- function RechnerTab

Diese Rechenlogik läuft rein im Browser (client/src/lib/tarife.js) — kein
Server-Aufruf nötig, das ist reine Mathematik ohne Datenbank-Bezug. Portiere
sie unverändert (1:1 kopieren, keine Zwischen-API).

Binde RechnerTab als Tab in App.jsx ein. PolizzeErfassenForm wird von
CustomerDetail aus aufgerufen (Nächster-Schritt-Bereich, siehe Prompt 7).

Test: Im Rechner ein paar Bootsdaten eingeben, prüfen dass NAUTIMA- und
Callidus-Ergebnis exakt mit dem übereinstimmen, was BootsCRM_reference.jsx
für die gleichen Eingaben berechnen würde (ein paar Stichproben reichen).
```

---

## Prompt 6 — Backend + Frontend: Aufgaben (automatische Erinnerungen)

```
Backend: server/routes/tasks.js (Tabelle tasks) mit GET (alle, sortiert
nach faelligkeitsdatum), PUT (erledigt-Status togglen), DELETE.

Portiere die komplette Automatik-Logik aus BootsCRM_reference.jsx 1:1 nach
server/lib/tasks-logic.js (läuft serverseitig, damit sie unabhängig vom
Frontend zuverlässig läuft):
- OFFERT_NACHFASS_TAGE, createOffertTasks, addBusinessDays
- EMPFEHLUNG_NACHFASS_TAGE, createEmpfehlungsTask
- KUENDIGUNG_MONATE_VOR_HAUPTFAELLIGKEIT, KUENDIGUNG_ERINNERUNG_TAGE_VORHER,
  berechneKuendigungsfrist, createKuendigungsTasks, clearKuendigungsTasks
- GEBURTSTAG_VORLAUF_TAGE, parseGeburtsdatum, naechsterGeburtstag,
  createGeburtstagsTaskWennFaellig, pruefeGeburtstage

Rufe diese Funktionen server-seitig an den richtigen Stellen auf:
- createOffertTasks: wenn PUT /api/customers/:id den status auf 'offert'
  ändert (vorher war er das nicht)
- createEmpfehlungsTask: wenn POST /api/customers/:id/vertraege der erste
  Vertrag für diesen Kunden ist
- createKuendigungsTasks/clearKuendigungsTasks: wenn PUT /api/customers/:id
  vorversicherung_hauptfaelligkeit ändert
- pruefeGeburtstage: einmal beim Server-Start UND per einfachem
  setInterval alle paar Stunden serverseitig durchlaufen lassen (kein
  externer Cron-Dienst nötig — der Server läuft ja dauerhaft, solange der
  PC an ist)

client/src/features/aufgaben/: AufgabenTab aus BootsCRM_reference.jsx
portieren (Gruppierung überfällig/heute/anstehend, Mail-vorbereiten-Button
bei Geburtstags-Aufgaben — der Textgenerator dafür kann unverändert im
Frontend bleiben, das ist reine Textbausteinlogik ohne DB-Bezug).

Test: Kunden-Status auf "Offert" setzen → 3 Aufgaben müssen mit korrekten
Werktagen erscheinen (Wochenenden übersprungen). Vorversicherung mit
Hauptfälligkeit in 5 Monaten eintragen → Kündigungsfrist-Aufgaben müssen
erscheinen.
```

---

## Prompt 7 — Nächster-Schritt-Bereich, Vergleich, Textbausteine

```
Portiere aus BootsCRM_reference.jsx in client/src/features/kunden/:
- Die "Nächster Schritt"-Logik aus CustomerDetail (nextStepBanner-Funktion):
  je nach Kundenstatus NAUTIMA-Antrag/Bootsdatenblatt/Polizze-erfassen-
  Buttons anzeigen
- function VergleichPanel (automatischer Prämienvergleich Vorversicherung
  vs. NAUTIMA vs. Callidus) — nutzt die in Prompt 5 portierte Tariflogik
- Die Textbaustein-Generatoren: generateAntragAnschreiben,
  generatePolizzeMail, generateKuendigungsschreiben — reine Textfunktionen,
  1:1 kopierbar, kein Server-Bezug nötig
- Die eingebetteten Formulare NautimaAntragTab und CallidusDatenblattTab
  (die kompletten Eingabemasken für die Versicherungs-Anträge) — diese
  erzeugen am Ende einen JSON-Text zum Kopieren für Claude im Chat, das
  bleibt inhaltlich unverändert, nur das Kunden-Verknüpfen (saveToCustomer)
  muss auf die neue API umgestellt werden (POST/PUT über api.customers)

WICHTIG bei der Umstellung von saveToCustomer: die bisherige Logik sucht
per Namens-/Adress-Abgleich nach einem bestehenden Kunden (function
findCustomerMatches, normalizeForMatch). Das kann unverändert im Frontend
bleiben — es braucht nur noch die volle Kundenliste von api.customers.list()
statt aus window.storage.

Test: Kompletten Weg durchklicken — Kunde mit Status "Offert" → "NAUTIMA-
Antrag" öffnen (Daten vorausgefüllt) → Zusammenfassung erzeugen → Status
manuell auf "Antrag" → "Anschreiben vorbereiten" (Text muss Name/Bootsname
enthalten) → "Polizze erfassen" → Status muss automatisch auf "Polizze"
springen → "Polizze-Mail vorbereiten" muss die erfasste Sparte + Prämie
im Text zeigen.
```

---

## Prompt 8 — Historie, Dokumente, Newsletter, Import

```
1. Historie: server/routes/historie.js (Tabelle historie) mit GET
   (Verlauf eines Kunden) und POST (neuer Eintrag). Automatische Einträge
   (system=1) direkt in den jeweiligen Routen erzeugen, an den Stellen wo
   BootsCRM_reference.jsx appendHistorie aufruft (Statuswechsel, Polizze
   erfasst, Antrag erstellt, Dokument hochgeladen — such nach
   "appendHistorie" in der Referenzdatei für alle Fundstellen).
   Frontend: HistorieList-Komponente portieren.

2. Dokumente: server/routes/documents.js mit multer für Datei-Upload.
   POST /api/customers/:id/documents (multipart/form-data) speichert die
   Datei unter server/uploads/<customerId>/<uuid>_<originalname> und legt
   einen documents-Datenbankeintrag an (filepath relativ speichern, NICHT
   Base64 in die DB). GET /api/documents/:id/download liefert die Datei
   aus. DELETE löscht Datenbankeintrag UND Datei von der Festplatte.
   Frontend: die Dropzone aus CustomerDetail portieren, jetzt mit
   FormData-Upload statt FileReader-Base64.

3. Newsletter: NewsletterTab aus BootsCRM_reference.jsx portieren — reine
   Frontend-Logik (Empfängerauswahl aus schon geladenen Kunden/Partnern,
   Textbaustein mit Platzhaltern, JSON-Ausgabe zum Kopieren). Kein neuer
   Server-Endpunkt nötig.

4. Import-Tab: ImportTab aus BootsCRM_reference.jsx portieren. Die
   JSON-Einfügen-und-Abgleichen-Logik bleibt gleich, muss nur auf
   api.customers.list()/.save() umgestellt werden statt window.storage.

Test: Dokument zu einem Kunden hochladen, Server neu starten, Dokument muss
weiterhin abrufbar sein (Beweis: Datei liegt wirklich auf der Platte, nicht
nur im Arbeitsspeicher). Historie: ein paar Aktionen durchführen, prüfen
dass automatische Einträge in der richtigen Reihenfolge erscheinen.
```

---

## Prompt 9 — Wochenziel, Pipeline-Übersicht, letzter Schliff

```
1. server/routes/settings.js: einfacher Key-Value-Endpunkt
   (GET/PUT /api/settings/:key) für das Wochenziel (Tabelle settings).

2. Portiere function ZielTracker aus BootsCRM_reference.jsx
   (Wochenziel-Balken + Pipeline-Trichter mit Umwandlungsraten) —
   Berechnung läuft im Frontend über die schon geladene Kundenliste
   (customers inkl. vertraege), das Wochenziel selbst kommt über
   api.settings.

3. Vergleiche die komplette App noch einmal Tab für Tab gegen
   BootsCRM_reference.jsx: sind alle Tabs da (Kunden, Newsletter,
   Prämienrechner, Aufgaben, Partner, Import, NAUTIMA-Antrag,
   Bootsdatenblatt)? Fehlt CSS (schau ins <style>-Element/die CSS-Regeln
   am Ende der Referenzdatei — alles was noch nicht übernommen wurde,
   jetzt in client/src/index.css oder als CSS-Module ergänzen)?

4. Kurzer Daten-Check: leg 3-4 Test-Kunden mit unterschiedlichem Status an,
   lass die App einmal komplett durchlaufen (Lead → Offert → Antrag →
   Polizze), prüfe Wochenziel-Zähler und Pipeline-Trichter zeigen
   plausible Zahlen.

5. Erstelle eine Windows-Verknüpfung/Batch-Datei (start-crm.bat) im
   Root, die "npm run dev" ausführt, damit ich die App künftig per
   Doppelklick starten kann statt über die Kommandozeile.
```

---

## Danach: Laufender Betrieb

- **Backup**: regelmäßig `server/callidus.db` und `server/uploads/` an
  einen zweiten Ort kopieren (USB-Stick, OneDrive-Ordner). Das ist die
  gesamte Datengrundlage.
- **Migration von den bisherigen Testdaten**: falls in der Claude.ai-
  Version schon echte Kunden/Partner drinstehen, kannst du mir (Claude im
  Chat) sagen "exportiere meine Kundendaten als JSON" — dann bereite ich
  dir eine Importdatei vor, die du über den (in Prompt 8 gebauten)
  Import-Tab einspielen kannst.
- **Weiterentwicklung**: neue Wünsche einfach wieder als Prompt an Claude
  Code stellen, mit Verweis auf die betroffene Datei/den betroffenen Tab —
  das Projekt bleibt als echter Ordner bestehen, du kannst jederzeit
  weitermachen.
