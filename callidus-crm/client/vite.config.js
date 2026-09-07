import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // CRM_HOST=0.0.0.0 (via "npm run dev:lan") macht den Dev-Server im
    // lokalen Netz sichtbar, sonst bleibt er auf dem eigenen Rechner.
    host: process.env.CRM_HOST || "127.0.0.1",
  },
});
