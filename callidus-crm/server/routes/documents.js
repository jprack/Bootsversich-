import express from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import db from "../db.js";
import { UPLOADS_DIR } from "../db.js";
import { eintragAnlegen } from "../lib/historie.js";

const router = express.Router();

// Dateien landen als echte Dateien unter server/uploads/<kunde>/<id>_<name>,
// in der Datenbank steht nur der relative Pfad — kein Base64 mehr, so
// vorgesehen in ARCHITECTURE.md.
const MAX_BYTES = 5 * 1024 * 1024; // wie in BootsCRM_reference.jsx

// multer/busboy liefert originalname als latin1 — "Öhlinger" käme sonst als
// "Ãhlinger" an. Bei österreichischen Kundennamen ist das der Normalfall,
// nicht der Sonderfall.
function originalname(file) {
  return path.basename(Buffer.from(file.originalname, "latin1").toString("utf8"));
}

const speicher = multer.diskStorage({
  destination(req, file, cb) {
    const ordner = path.join(UPLOADS_DIR, req.params.id);
    fs.mkdirSync(ordner, { recursive: true });
    cb(null, ordner);
  },
  filename(req, file, cb) {
    // Der Originalname kommt vom Browser: Pfadanteile entfernen, damit
    // niemand über "../" aus dem Uploads-Ordner ausbrechen kann.
    const sauber = originalname(file).replace(/[/\\]/g, "_");
    cb(null, `${randomUUID()}_${sauber}`);
  },
});
const upload = multer({ storage: speicher, limits: { fileSize: MAX_BYTES } });

const ausDb = (d) => ({ ...d });

export function dokumenteVonKunde(customerId) {
  return db
    .prepare("SELECT * FROM documents WHERE customer_id = ? ORDER BY uploaded_at DESC, rowid DESC")
    .all(customerId)
    .map(ausDb);
}

router.get("/:id/documents", (req, res) => {
  res.json(dokumenteVonKunde(req.params.id));
});

// POST /api/customers/:id/documents — multipart/form-data, Feld "dateien"
router.post("/:id/documents", (req, res, next) => {
  const { id } = req.params;
  if (!db.prepare("SELECT 1 FROM customers WHERE id = ?").get(id)) {
    return res.status(404).json({ fehler: `Kunde ${id} nicht gefunden` });
  }
  upload.array("dateien")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ fehler: `Datei größer als ${MAX_BYTES / 1024 / 1024} MB` });
      }
      return next(err);
    }
    const dateien = req.files || [];
    if (dateien.length === 0) return res.status(400).json({ fehler: "keine Datei empfangen" });

    const einfuegen = db.prepare(`
      INSERT INTO documents (id, customer_id, filename, mime_type, size, filepath, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const anlegen = db.transaction(() => {
      for (const f of dateien) {
        einfuegen.run(
          randomUUID(), id, originalname(f),
          f.mimetype || "application/octet-stream", f.size,
          path.relative(UPLOADS_DIR, f.path),   // relativ, damit der Ordner verschiebbar bleibt
          new Date().toISOString()
        );
        eintragAnlegen(id, "Sonstiges", `Dokument hochgeladen: „${originalname(f)}"`, true);
      }
    });
    anlegen();
    res.status(201).json(dokumenteVonKunde(id));
  });
});

// Eigener Router für die Endpunkte, die nicht am Kunden hängen.
export const dokumentRouter = express.Router();

dokumentRouter.get("/:id/download", (req, res) => {
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id);
  if (!doc) return res.status(404).json({ fehler: `Dokument ${req.params.id} nicht gefunden` });

  const pfad = path.join(UPLOADS_DIR, doc.filepath);
  if (!fs.existsSync(pfad)) {
    return res.status(410).json({ fehler: `Datei fehlt auf der Festplatte: ${doc.filepath}` });
  }
  res.type(doc.mime_type);
  // inline, damit PDFs sich im Browser ansehen lassen; der Dateiname bleibt
  // für "Speichern unter" erhalten.
  res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(doc.filename)}`);
  fs.createReadStream(pfad).pipe(res);
});

dokumentRouter.delete("/:id", (req, res) => {
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id);
  if (!doc) return res.status(404).json({ fehler: `Dokument ${req.params.id} nicht gefunden` });

  // Erst die Datei, dann der Eintrag: bliebe der Eintrag stehen, während die
  // Datei weg ist, zeigte die App auf Nichts.
  const pfad = path.join(UPLOADS_DIR, doc.filepath);
  try {
    if (fs.existsSync(pfad)) fs.unlinkSync(pfad);
  } catch (e) {
    console.error("[documents] Datei konnte nicht gelöscht werden:", e.message);
    return res.status(500).json({ fehler: `Datei konnte nicht gelöscht werden: ${e.message}` });
  }
  db.prepare("DELETE FROM documents WHERE id = ?").run(req.params.id);
  res.json({ geloescht: true, id: req.params.id });
});

export default router;
