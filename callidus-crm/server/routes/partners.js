import express from "express";
import { randomUUID } from "node:crypto";
import db from "../db.js";
import { insert, update } from "../lib/sql.js";
import { allePartner, fuerDb, partner } from "../lib/partner.js";

const router = express.Router();

// GET /api/partners — alle Partner, nach Name sortiert
router.get("/", (req, res) => {
  res.json(allePartner());
});

// GET /api/partners/:id
router.get("/:id", (req, res) => {
  const gefunden = partner(req.params.id);
  if (!gefunden) return res.status(404).json({ fehler: `Partner ${req.params.id} nicht gefunden` });
  res.json(gefunden);
});

// POST /api/partners
router.post("/", (req, res) => {
  const daten = fuerDb(req.body);

  // name ist in schema.sql NOT NULL
  if (!daten.name || !String(daten.name).trim()) {
    return res.status(400).json({ fehler: "name ist erforderlich" });
  }

  const id = randomUUID();
  insert(db, "partners", { id, ...daten });
  res.status(201).json(partner(id));
});

// PUT /api/partners/:id — nur mitgeschickte Felder
router.put("/:id", (req, res) => {
  const { id } = req.params;
  if (!db.prepare("SELECT 1 FROM partners WHERE id = ?").get(id)) {
    return res.status(404).json({ fehler: `Partner ${id} nicht gefunden` });
  }

  const daten = fuerDb(req.body);
  if (Object.hasOwn(daten, "name") && !String(daten.name ?? "").trim()) {
    return res.status(400).json({ fehler: "name darf nicht leer sein" });
  }

  if (Object.keys(daten).length > 0) update(db, "partners", id, daten);
  res.json(partner(id));
});

// DELETE /api/partners/:id
// customers.partner_id ist ON DELETE SET NULL — verknüpfte Kunden bleiben
// also erhalten und verlieren nur die Zuordnung.
router.delete("/:id", (req, res) => {
  const ergebnis = db.prepare("DELETE FROM partners WHERE id = ?").run(req.params.id);
  if (ergebnis.changes === 0) {
    return res.status(404).json({ fehler: `Partner ${req.params.id} nicht gefunden` });
  }
  res.json({ geloescht: true, id: req.params.id });
});

export default router;
