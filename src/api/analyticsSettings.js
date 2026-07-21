import { apiFetch } from "../lib/apiClient";

export const fetchAnalyticsSettings = () => apiFetch("/api/analytics-settings");
export const updateAnalyticsSettings = (data) =>
  apiFetch("/api/analytics-settings", { method: "PUT", body: JSON.stringify(data) });
