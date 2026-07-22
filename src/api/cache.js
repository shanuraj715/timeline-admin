import { apiFetch } from "../lib/apiClient";

export const fetchCacheReport = () => apiFetch("/api/cache").then((d) => d.resources);

export const purgeCache = (tags) =>
  apiFetch("/api/cache/purge", { method: "POST", body: JSON.stringify({ tags }) });

export const warmCache = (tags) =>
  apiFetch("/api/cache/warm", { method: "POST", body: JSON.stringify({ tags }) });
