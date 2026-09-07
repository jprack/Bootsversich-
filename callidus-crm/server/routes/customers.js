import express from "express";
import { randomUUID } from "node:crypto";
import db from "../db.js";
import { KUNDEN_FELDER, BOOT_FELDER, nurErlaubte } from "../lib/felder.js";
import { insert, update } from "../lib/sql.js";
import { alleKundenMitBooten, kundeMitBooten } from "../lib/kunden.js";

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
  insert(db, "customers", { id, ...daten });
  res.status(201).json(kundeMitBooten(id));
});

// PUT /api/customers/:id — Kunde aktualisieren (nur mitgeschickte Felder)
router.put("/:id", (req, res) => {
  const { id } = req.params;
  if (!db.prepare("SELECT 1 FROM customers WHERE id = ?").get(id)) {
    return res.status(404).json({ fehler: `Kunde ${id} nicht gefunden` });
  }

  const daten = nurErlaubte(req.body ?? {}, KUNDEN_FELDER);
  if (Object.hasOwn(daten, "nachname") && !String(daten.nachname ?? "").trim()) {
    return res.status(400).json({ fehler: "nachname darf nicht leer sein" });
  }

  update(db, "customers", id, daten, "updated_at = datetime('now')");
  res.json(kundeMitBooten(id));
});

// DELETE /api/customers/:id — löscht durch ON DELETE CASCADE auch Boote,
// Verträge samt Sparten, Quotes, Anträge, Aufgaben, Historie und Dokumente
router.delete("/:id", (req, res) => {
  const ergebnis = db.prepare("DELETE FROM customers WHERE id = ?").run(req.params.id);
  if (ergebnis.changes === 0) {
    return res.status(404).json({ fehler: `Kunde ${req.params.id} nicht gefunden` });
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
