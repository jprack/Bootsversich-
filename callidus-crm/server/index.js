import express from "express";
import cors from "cors";
import { DB_PATH, UPLOADS_DIR, tabellen } from "./db.js";
import customersRouter from "./routes/customers.js";
import boatsRouter from "./routes/boats.js";
import partnersRouter from "./routes/partners.js";
import vertraegeRouter, { vertragRouter } from "./routes/vertraege.js";

const PORT = 3001;
const CLIENT_ORIGIN = "http://localhost:5173";

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    nachricht: "Callidus Boots-CRM Backend läuft",
    datenbank: DB_PATH,
    tabellen: tabellen(),
    zeit: new Date().toISOString(),
  });
});

app.use("/api/customers", customersRouter);
app.use("/api/boats", boatsRouter);
app.use("/api/partners", partnersRouter);
// Zweiter Router auf /api/customers: trägt die verschachtelten Ressourcen
// (Polizzen, Prämienberechnungen). Express probiert die Router der Reihe nach,
// der Kunden-Router hat für diese Pfade keine Route und reicht durch.
app.use("/api/customers", vertraegeRouter);
app.use("/api/vertraege", vertragRouter);

// Weitere Bereiche (tasks, historie, documents, settings)
// werden hier in den folgenden Schritten eingehängt.

app.use((req, res) => {
  res.status(404).json({ fehler: `Unbekannte Route: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  // Verletzte Fremdschlüssel sind ein Eingabefehler des Aufrufers (etwa eine
  // partner_id, die es nicht gibt) — nicht ein Serverfehler.
  if (String(err.code).startsWith("SQLITE_CONSTRAINT")) {
    console.warn("[eingabe]", err.message);
    return res.status(400).json({ fehler: err.message });
  }
  console.error("[fehler]", err);
  res.status(500).json({ fehler: err.message });
});

app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}`);
  console.log(`[server] Datenbank: ${DB_PATH}`);
  console.log(`[server] Uploads:   ${UPLOADS_DIR}`);
});
