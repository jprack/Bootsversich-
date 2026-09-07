import express from "express";
import { randomUUID } from "node:crypto";
import db from "../db.js";
import { KUNDEN_FELDER, BOOT_FELDER, nurErlaubte } from "../lib/felder.js";
import { insert, update } from "../lib/sql.js";
import { alleKundenMitBooten, kundeMitBooten } from "../lib/kunden.js";
import { createOffertTasks, createKuendigungsTasks, clearKuendigungsTasks } from "../lib/tasks-logic.js";
import { eintragAnlegen } from "../lib/historie.js";
import fs from "node:fs";
import path from "node:path";
import { UPLOADS_DIR } from "../db.js";

// Aus BootsCRM_reference.jsx (STATUS_OPTIONS) — nur für den Protokolltext.
const STATUS_LABEL = { offert: "Offert", antrag: "Antrag", polizze: "Polizze" };
const statusText = (s) => STATUS_LABEL[s] || "kein Status";

const router = express.Router();

// GET /api/customers — alle Kunden inkl. Boote, nach Nachname/Vorname sortiert
router.get("/", (req, res) => {
  res.json(alleKundenMitBooten());
});

// GET /api/customers/:id — ein Kunde inkl. Boote
router.get("/:id", (req, res) => {
  const kunde = kundeMitBooten(req.params.id);
  if (!kunde) return res.status(404).json({ fehler: `Kunde ${req.params.id} nicht gefunden` });
  res.json(kunde);
});

// POST /api/customers — neuen Kunden anlegen
router.post("/", (req, res) => {
  const daten = nurErlaubte(req.body ?? {}, KUNDEN_FELDER);

  // nachname ist in schema.sql NOT NULL — hier abfangen, damit statt eines
  // SQLite-Fehlers eine verständliche Meldung zurückkommt.
  if (!daten.nachname || !String(daten.nachname).trim()) {
    return res.status(400).json({ fehler: "nachname ist erforderlich" });
  }

  const id = randomUUID();
  const anlegen = db.transaction(() => {
    insert(db, "customers", { id, ...daten });
    const kunde = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
    // Ein Kunde kann gleich mit Status "offert" angelegt werden — dann
    // gelten dieselben Nachfass-Erinnerungen wie beim späteren Wechsel.
    if (kunde.status === "offert") createOffertTasks(kunde);
    if (kunde.vorversicherung_hauptfaelligkeit) createKuendigungsTasks(kunde);
  });
  anlegen();
  res.status(201).json(kundeMitBooten(id));
});

// Änderung und die daraus folgenden Aufgaben gehören zusammen: sonst könnte
// ein Kunde auf "Offert" stehen, ohne dass die Nachfass-Erinnerungen
// existieren — und genau die sind der Zweck der Statusführung.
const kundeAktualisieren = db.transaction((id, daten, vorher) => {
  update(db, "customers", id, daten, "updated_at = datetime('now')");
  const kunde = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);

  // Statuswechsel im Kontaktverlauf festhalten — in der Referenz machte das
  // changeStatus im Browser, jetzt passiert es dort, wo der Wechsel stattfindet.
  if (kunde.status !== vorher.status) {
    eintragAnlegen(id, "Sonstiges", `Status geändert: ${statusText(vorher.status)} → ${statusText(kunde.status)}`, true);
  }

  // Nachfassen: nur beim Wechsel auf "offert", nicht bei jedem Speichern.
  if (kunde.status === "offert" && vorher.status !== "offert") {
    createOffertTasks(kunde);
  }

  // Kündigungsfrist: bei geänderter Hauptfälligkeit die alten Erinnerungen
  // wegräumen und neu berechnen.
  if (kunde.vorversicherung_hauptfaelligkeit &&
      kunde.vorversicherung_hauptfaelligkeit !== vorher.vorversicherung_hauptfaelligkeit) {
    clearKuendigungsTasks(id);
    createKuendigungsTasks(kunde);
  }
});

// PUT /api/customers/:id — Kunde aktualisieren (nur mitgeschickte Felder)
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const vorher = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
  if (!vorher) {
    return res.status(404).json({ fehler: `Kunde ${id} nicht gefunden` });
  }

  const daten = nurErlaubte(req.body ?? {}, KUNDEN_FELDER);
  if (Object.hasOwn(daten, "nachname") && !String(daten.nachname ?? "").trim()) {
    return res.status(400).json({ fehler: "nachname darf nicht leer sein" });
  }

  kundeAktualisieren(id, daten, vorher);
  res.json(kundeMitBooten(id));
});

// DELETE /api/customers/:id — löscht durch ON DELETE CASCADE auch Boote,
// Verträge samt Sparten, Quotes, Anträge, Aufgaben, Historie und Dokumente
router.delete("/:id", (req, res) => {
  const ergebnis = db.prepare("DELETE FROM customers WHERE id = ?").run(req.params.id);
  if (ergebnis.changes === 0) {
    return res.status(404).json({ fehler: `Kunde ${req.params.id} nicht gefunden` });
  }

  // ON DELETE CASCADE räumt die Datenbankzeilen ab, die hochgeladenen Dateien
  // liegen aber auf der Festplatte — die bleiben sonst als Datenrest zurück.
  const ordner = path.join(UPLOADS_DIR, req.params.id);
  try {
    if (fs.existsSync(ordner)) fs.rmSync(ordner, { recursive: true, force: true });
  } catch (e) {
    console.error("[documents] Upload-Ordner konnte nicht gelöscht werden:", e.message);
  }

  res.json({ geloescht: true, id: req.params.id });
});

// POST /api/customers/:id/boats — Boot zu einem Kunden hinzufügen
router.post("/:id/boats", (req, res) => {
  const { id } = req.params;
  if (!db.prepare("SELECT 1 FROM customers WHERE id = ?").get(id)) {
    return res.status(404).json({ fehler: `Kunde ${id} nicht gefunden` });
  }

  const bootId = randomUUID();
  insert(db, "boats", {
    id: bootId,
    customer_id: id,
    ...nurErlaubte(req.body ?? {}, BOOT_FELDER),
  });

  res.status(201).json(db.prepare("SELECT * FROM boats WHERE id = ?").get(bootId));
});

export default router;
