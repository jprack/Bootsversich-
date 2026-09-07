import express from "express";
import cors from "cors";
import { DB_PATH, UPLOADS_DIR, tabellen } from "./db.js";
import customersRouter from "./routes/customers.js";
import boatsRouter from "./routes/boats.js";
import partnersRouter from "./routes/partners.js";
import vertraegeRouter, { vertragRouter } from "./routes/vertraege.js";

const PORT = 3001;

// Standard ist 127.0.0.1: der Server ist dann nur vom eigenen Rechner aus
// erreichbar. "npm run dev:lan" setzt CRM_HOST=0.0.0.0 und macht ihn im
// lokalen Netz sichtbar — gedacht zum Testen am Handy, siehe README.
const HOST = process.env.CRM_HOST || "127.0.0.1";
const IM_NETZ = HOST === "0.0.0.0";

const app = express();

// Im Netzbetrieb ruft das Handy die App unter der IP des PCs auf, die wir
// vorher nicht kennen — deshalb wird jede Herkunft auf dem Vite-Port 5173
// akzeptiert. Ohne Netzbetrieb bleibt es bei localhost.
app.use(cors({
  origin: (herkunft, cb) => {
    if (!herkunft) return cb(null, true);                 // curl, gleiche Herkunft
    if (herkunft === "http://localhost:5173") return cb(null, true);
    if (IM_NETZ && /^http:\/\/[\w.-]+:5173$/.test(herkunft)) return cb(null, true);
    const fehler = new Error(`Herkunft nicht erlaubt: ${herkunft}`);
    fehler.status = 403;
    cb(fehler);
  },
}));
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
  // Abgelehnte Herkunft ist eine Entscheidung, kein Serverfehler.
  if (err.status === 403) {
    console.warn("[cors]", err.message);
    return res.status(403).json({ fehler: err.message });
  }
  // Verletzte Fremdschlüssel sind ein Eingabefehler des Aufrufers (etwa eine
  // partner_id, die es nicht gibt) — nicht ein Serverfehler.
  if (String(err.code).startsWith("SQLITE_CONSTRAINT")) {
    console.warn("[eingabe]", err.message);
    return res.status(400).json({ fehler: err.message });
  }
  console.error("[fehler]", err);
  res.status(500).json({ fehler: err.message });
});

app.listen(PORT, HOST, () => {
  console.log(`[server] http://localhost:${PORT}${IM_NETZ ? " (auch im lokalen Netz)" : ""}`);
  console.log(`[server] Datenbank: ${DB_PATH}`);
  console.log(`[server] Uploads:   ${UPLOADS_DIR}`);
});
