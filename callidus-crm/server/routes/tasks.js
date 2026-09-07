import express from "express";
import db from "../db.js";

const router = express.Router();

// GET /api/tasks — alle Aufgaben, früheste Fälligkeit zuerst.
// erstellt als Tiebreaker: faelligkeitsdatum ist zwar ISO mit Millisekunden,
// bei den drei Nachfass-Aufgaben derselben Offerte aber trotzdem eng
// beieinander — rowid macht die Reihenfolge stabil.
router.get("/", (req, res) => {
  const tasks = db
    .prepare("SELECT * FROM tasks ORDER BY faelligkeitsdatum ASC, rowid ASC")
    .all()
    .map((t) => ({ ...t, erledigt: t.erledigt === 1 }));
  res.json(tasks);
});

// PUT /api/tasks/:id — erledigt setzen. Ohne Angabe im Body wird umgeschaltet.
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!task) return res.status(404).json({ fehler: `Aufgabe ${id} nicht gefunden` });

  const neu = typeof req.body?.erledigt === "boolean" ? req.body.erledigt : task.erledigt !== 1;
  db.prepare("UPDATE tasks SET erledigt = ? WHERE id = ?").run(neu ? 1 : 0, id);

  const aktualisiert = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  res.json({ ...aktualisiert, erledigt: aktualisiert.erledigt === 1 });
});

// DELETE /api/tasks/:id
router.delete("/:id", (req, res) => {
  const ergebnis = db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
  if (ergebnis.changes === 0) {
    return res.status(404).json({ fehler: `Aufgabe ${req.params.id} nicht gefunden` });
  }
  res.json({ geloescht: true, id: req.params.id });
});

export default router;
