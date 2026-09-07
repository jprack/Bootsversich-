import express from "express";
import { randomUUID } from "node:crypto";
import db from "../db.js";
import { VERTRAG_FELDER, SPARTE_FELDER, QUOTE_FELDER, nurErlaubte } from "../lib/felder.js";
import { insert } from "../lib/sql.js";
import { kundeMitBooten } from "../lib/kunden.js";
import { createEmpfehlungsTask } from "../lib/tasks-logic.js";

const router = express.Router();

// Vertrag, Sparten und der Statuswechsel auf 'polizze' gehören zusammen:
// entweder alles oder nichts. better-sqlite3 ist synchron, deshalb genügt
// db.transaction() ohne async-Verrenkungen.
const polizzeAnlegen = db.transaction((customerId, vertrag, sparten) => {
  // Vor dem Einfügen prüfen: ist das die erste Polizze dieses Kunden?
  const erstePolizze = db.prepare("SELECT COUNT(*) AS n FROM vertraege WHERE customer_id = ?").get(customerId).n === 0;

  const vertragId = randomUUID();
  insert(db, "vertraege", { id: vertragId, customer_id: customerId, ...vertrag });

  for (const sparte of sparten) {
    insert(db, "sparten", { id: randomUUID(), vertrag_id: vertragId, ...sparte });
  }

  db.prepare("UPDATE customers SET status = 'polizze', updated_at = datetime('now') WHERE id = ?")
    .run(customerId);

  // Nach der ersten Polizze nach einer Empfehlung fragen — 30 Kalendertage
  // später, wie in BootsCRM_reference.jsx.
  if (erstePolizze) {
    createEmpfehlungsTask(db.prepare("SELECT * FROM customers WHERE id = ?").get(customerId));
  }

  return vertragId;
});

// POST /api/customers/:id/vertraege — Polizze mit Sparten erfassen.
// Setzt den Kundenstatus in derselben Transaktion auf 'polizze'.
router.post("/:id/vertraege", (req, res) => {
  const { id } = req.params;
  if (!db.prepare("SELECT 1 FROM customers WHERE id = ?").get(id)) {
    return res.status(404).json({ fehler: `Kunde ${id} nicht gefunden` });
  }

  const vertrag = nurErlaubte(req.body ?? {}, VERTRAG_FELDER);
  if (!vertrag.versicherer || !String(vertrag.versicherer).trim()) {
    return res.status(400).json({ fehler: "versicherer ist erforderlich" });
  }

  const roh = Array.isArray(req.body?.sparten) ? req.body.sparten : [];
  const sparten = roh
    .map((s) => nurErlaubte(s ?? {}, SPARTE_FELDER))
    .filter((s) => s.sparte && String(s.sparte).trim());

  if (sparten.length === 0) {
    return res.status(400).json({ fehler: "mindestens eine Sparte mit Bezeichnung ist erforderlich" });
  }

  polizzeAnlegen(id, vertrag, sparten);
  res.status(201).json(kundeMitBooten(id));
});

// DELETE /api/vertraege/:id — Sparten gehen per ON DELETE CASCADE mit.
// Der Kundenstatus bleibt unangetastet: ob nach dem Storno wieder "Antrag"
// gilt, ist eine fachliche Entscheidung und gehört nicht in eine Löschroute.
export const vertragRouter = express.Router();
vertragRouter.delete("/:id", (req, res) => {
  const ergebnis = db.prepare("DELETE FROM vertraege WHERE id = ?").run(req.params.id);
  if (ergebnis.changes === 0) {
    return res.status(404).json({ fehler: `Vertrag ${req.params.id} nicht gefunden` });
  }
  res.json({ geloescht: true, id: req.params.id });
});

// POST /api/customers/:id/quotes — Prämienberechnung beim Kunden vermerken.
// Nicht in Prompt 5 aufgeführt, aber der portierte RechnerTab hat den Bereich
// "Bei bestehendem Kunden vermerken"; ohne diesen Endpunkt wäre der Knopf tot.
// Tabelle quotes steht bereits in schema.sql.
router.post("/:id/quotes", (req, res) => {
  const { id } = req.params;
  if (!db.prepare("SELECT 1 FROM customers WHERE id = ?").get(id)) {
    return res.status(404).json({ fehler: `Kunde ${id} nicht gefunden` });
  }
  const quoteId = randomUUID();
  insert(db, "quotes", { id: quoteId, customer_id: id, ...nurErlaubte(req.body ?? {}, QUOTE_FELDER) });
  res.status(201).json(db.prepare("SELECT * FROM quotes WHERE id = ?").get(quoteId));
});

// GET /api/customers/:id/quotes — neueste zuerst
router.get("/:id/quotes", (req, res) => {
  res.json(db.prepare("SELECT * FROM quotes WHERE customer_id = ? ORDER BY erstellt DESC, rowid DESC").all(req.params.id));
});

export default router;
