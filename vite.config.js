import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Proxies /api/* to the backend the same way the main Next.js frontend's
// rewrites() does — the browser stays same-origin (localhost:5174), so
// cookies set by the backend land on this app's own origin and the
// existing cookie-based auth/CSRF system works unchanged. See
// timeline-backend/src/lib/auth/csrf.js's ADMIN_APP_URL check, which is
// what actually accepts requests carrying this origin.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: false,
      },
    },
  },
});
