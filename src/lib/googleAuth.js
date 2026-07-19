// Mirrors the main app's src/lib/googleAuth.js exactly — same public,
// unauthenticated backend endpoint (safe to call from either app; only the
// client ID and an enabled flag come back, never the secret), same
// fetch-once-and-cache pattern since it just drives whether the button
// renders at all.
import { useEffect, useState } from "react";
import { apiFetch } from "./apiClient";

let configPromise = null;

function getGoogleOAuthConfig() {
  if (!configPromise) {
    configPromise = apiFetch("/api/public/google-oauth").catch(() => ({ enabled: false, clientId: null }));
  }
  return configPromise;
}

export function useGoogleSignInEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getGoogleOAuthConfig().then((config) => {
      if (!cancelled) setEnabled(Boolean(config.enabled));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return enabled;
}
