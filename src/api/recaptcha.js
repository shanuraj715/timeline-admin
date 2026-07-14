import { apiFetch } from "../lib/apiClient";

export const fetchRecaptchaSettings = () => apiFetch("/api/recaptcha");
export const updateRecaptchaSettings = (data) =>
  apiFetch("/api/recaptcha", { method: "PUT", body: JSON.stringify(data) });
