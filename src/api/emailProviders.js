import { apiFetch } from "../lib/apiClient";

export const fetchEmailProviders = () => apiFetch("/api/email-providers").then((d) => d.providers);
export const saveEmailProvider = (provider, data) =>
  apiFetch(`/api/email-providers/${provider}`, { method: "PUT", body: JSON.stringify(data) }).then((d) => d.provider);
export const deleteEmailProvider = (provider) => apiFetch(`/api/email-providers/${provider}`, { method: "DELETE" });
