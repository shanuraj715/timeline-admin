import { apiFetch } from "../lib/apiClient";

export const fetchPlatformSettings = () => apiFetch("/api/settings").then((d) => d.settings);
export const updatePlatformSettings = (data) =>
  apiFetch("/api/settings", { method: "PUT", body: JSON.stringify(data) }).then((d) => d.settings);
