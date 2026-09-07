import express from "express";
import db from "../db.js";
import { eintragAnlegen, historieVonKunde } from "../lib/historie.js";

const router = express.Router();

// Aus BootsCRM_reference.jsx (HISTORIE_TYPEN).
const HISTORIE_TYPEN = ["Anruf", "E-Mail", "Termin", "Notiz", "Sonstiges"];

router.get("/:id/historie", (req, res) => {
  res.json(historieVonKunde(req.params.id));
});

// POST /api/customers/:id/historie — manueller Eintrag.
router.post("/:id/historie", (req, res) => {
  const { id } = req.params;
  if (!db.prepare("SELECT 1 FROM customers WHERE id = ?").get(id)) {
    return res.status(404).json({ fehler: `Kunde ${id} nicht gefunden` });
  }

  const typ = String(req.body?.typ ?? "").trim();
  const text = String(req.body?.text ?? "").trim();
  if (!HISTORIE_TYPEN.includes(typ)) {
    return res.status(400).json({ fehler: `typ muss einer von ${HISTORIE_TYPEN.join(", ")} sein` });
  }
  if (!text) return res.status(400).json({ fehler: "text ist erforderlich" });

  // system bleibt hier immer false: automatische Einträge entstehen in den
  // Routen, in denen das Ereignis passiert, nicht auf Zuruf von außen.
  const eintragId = eintragAnlegen(id, typ, text, false);
  res.status(201).json(historieVonKunde(id).find((h) => h.id === eintragId));
});

export default router;
