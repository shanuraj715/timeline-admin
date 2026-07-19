import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Proxies /api/* to the backend the same way the main Next.js frontend's
// rewrites() does — the browser stays same-origin (localhost:5174), so
// cookies set by the backend land on this app's own origin and the
// existing cookie-based auth/CSRF system works unchanged. See
// timeline-backend/src/lib/auth/csrf.js's ADMIN_APP_URL check, which is
// what actually accepts requests carrying this origin.
//
// The proxy *target* is this Vite dev server's own outbound request to the
// backend (server-to-server, not the browser), so it needs to name
// whatever host actually reaches the backend from wherever this process is
// running — "localhost:4000" for plain local dev, but "backend:4000" (the
// docker-compose service name) when this runs inside the admin container
// and "localhost" would otherwise resolve to that container itself.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    host: true,
    // Vite's dev server rejects unrecognized Host headers by default (DNS
    // rebinding protection) — needed since this runs behind nginx on
    // admin.mytimelyne.com in production, not just on localhost.
    allowedHosts: ["admin.mytimelyne.com"],
    proxy: {
      "/api": {
        target: process.env.BACKEND_URL || "http://localhost:4000",
        changeOrigin: false,
      },
    },
  },
});
