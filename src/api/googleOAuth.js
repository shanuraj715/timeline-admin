import { apiFetch } from "../lib/apiClient";

export const fetchGoogleOAuthSettings = () => apiFetch("/api/google-oauth");
export const updateGoogleOAuthSettings = (data) =>
  apiFetch("/api/google-oauth", { method: "PUT", body: JSON.stringify(data) });
