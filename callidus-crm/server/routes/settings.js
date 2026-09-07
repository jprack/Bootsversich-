import express from "express";
import db from "../db.js";

const router = express.Router();

// Schlüssel-Wert-Ablage für Einstellungen wie das Wochenziel (Tabelle
// settings). Werte werden als Text gehalten — die App weiß, wie sie zu
// lesen sind.
router.get("/:key", (req, res) => {
  const zeile = db.prepare("SELECT value FROM settings WHERE key = ?").get(req.params.key);
  if (!zeile) return res.status(404).json({ fehler: `Einstellung ${req.params.key} nicht gesetzt` });
  res.json({ key: req.params.key, value: zeile.value });
});

router.put("/:key", (req, res) => {
  const wert = req.body?.value;
  if (wert === undefined || wert === null) {
    return res.status(400).json({ fehler: "value ist erforderlich" });
  }
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(req.params.key, String(wert));
  res.json({ key: req.params.key, value: String(wert) });
});

export default router;
