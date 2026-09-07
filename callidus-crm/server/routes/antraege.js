import express from "express";
import { randomUUID } from "node:crypto";
import db from "../db.js";
import { antraegeVonKunde } from "../lib/antraege.js";

const router = express.Router();

// POST /api/customers/:id/antraege — vollständige Rohdaten eines
// NAUTIMA-Antrags oder Bootsdatenblatts beim Kunden ablegen.
// In PROMPTS.md nicht eigens genannt, aber saveToCustomer in beiden
// Antragsmasken legt genau das ab; die Tabelle antraege steht im Schema.
router.post("/:id/antraege", (req, res) => {
  const { id } = req.params;
  if (!db.prepare("SELECT 1 FROM customers WHERE id = ?").get(id)) {
    return res.status(404).json({ fehler: `Kunde ${id} nicht gefunden` });
  }

  const typ = String(req.body?.typ ?? "").trim();
  if (!typ) return res.status(400).json({ fehler: "typ ist erforderlich" });
  if (req.body?.daten === undefined) return res.status(400).json({ fehler: "daten sind erforderlich" });

  const antragId = randomUUID();
  db.prepare("INSERT INTO antraege (id, customer_id, typ, daten) VALUES (?, ?, ?, ?)")
    .run(antragId, id, typ, JSON.stringify(req.body.daten));

  res.status(201).json(antraegeVonKunde(id).find((a) => a.id === antragId));
});

router.get("/:id/antraege", (req, res) => {
  res.json(antraegeVonKunde(req.params.id));
});

export default router;
