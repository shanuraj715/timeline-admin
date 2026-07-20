import { apiFetch } from "../lib/apiClient";

export const fetchBranding = () => apiFetch("/api/cms/branding").then((d) => d.branding);
export const updateBranding = (data) =>
  apiFetch("/api/cms/branding", { method: "PUT", body: JSON.stringify(data) }).then((d) => d.branding);
