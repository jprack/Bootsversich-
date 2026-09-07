import express from "express";
import { randomUUID } from "node:crypto";
import db from "../db.js";
import { antraegeVonKunde } from "../lib/antraege.js";
import { eintragAnlegen } from "../lib/historie.js";

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
  db.prepare("INSERT INTO antraege (id, customer_id, erstellt, typ, daten) VALUES (?, ?, ?, ?, ?)")
    .run(antragId, id, new Date().toISOString(), typ, JSON.stringify(req.body.daten));

  // Wie in BootsCRM_reference.jsx: "NAUTIMA-Antrag erstellt (… €/Jahr)".
  // Die Summe liefert die Maske mit, der Server kennt sie nicht.
  const summe = Number(req.body?.gesamt);
  const betrag = Number.isFinite(summe)
    ? ` (${summe.toLocaleString("de-AT", { style: "currency", currency: "EUR" })}/Jahr)`
    : "";
  eintragAnlegen(id, "Sonstiges", `${typ} erstellt${betrag}`, true);

  res.status(201).json(antraegeVonKunde(id).find((a) => a.id === antragId));
});

router.get("/:id/antraege", (req, res) => {
  res.json(antraegeVonKunde(req.params.id));
});

export default router;
