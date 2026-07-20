import { apiFetch } from "../lib/apiClient";

export const fetchAdSettings = () => apiFetch("/api/ads/settings").then((d) => d.settings);
export const updateAdSettings = (data) =>
  apiFetch("/api/ads/settings", { method: "PUT", body: JSON.stringify(data) }).then((d) => d.settings);

export const fetchAdPlacements = () => apiFetch("/api/ads/placements").then((d) => d.placements);
export const updateAdPlacement = (key, data) =>
  apiFetch(`/api/ads/placements/${encodeURIComponent(key)}`, { method: "PUT", body: JSON.stringify(data) }).then(
    (d) => d.placement
  );
