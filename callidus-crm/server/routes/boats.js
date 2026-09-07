import express from "express";
import db from "../db.js";
import { BOOT_FELDER, nurErlaubte } from "../lib/felder.js";
import { update } from "../lib/sql.js";

const router = express.Router();

// PUT /api/boats/:id — Boot aktualisieren (nur mitgeschickte Felder).
// customer_id bleibt außen vor: ein Boot wechselt nicht den Besitzer,
// dafür wäre Löschen und Neuanlegen der richtige Weg.
router.put("/:id", (req, res) => {
  const { id } = req.params;
  if (!db.prepare("SELECT 1 FROM boats WHERE id = ?").get(id)) {
    return res.status(404).json({ fehler: `Boot ${id} nicht gefunden` });
  }

  const daten = nurErlaubte(req.body ?? {}, BOOT_FELDER);
  if (Object.keys(daten).length > 0) update(db, "boats", id, daten);

  res.json(db.prepare("SELECT * FROM boats WHERE id = ?").get(id));
});

// DELETE /api/boats/:id
router.delete("/:id", (req, res) => {
  const ergebnis = db.prepare("DELETE FROM boats WHERE id = ?").run(req.params.id);
  if (ergebnis.changes === 0) {
    return res.status(404).json({ fehler: `Boot ${req.params.id} nicht gefunden` });
  }
  res.json({ geloescht: true, id: req.params.id });
});

export default router;
