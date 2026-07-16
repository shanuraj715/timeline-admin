import { apiFetch } from "../lib/apiClient";

export const fetchCurrencies = () => apiFetch("/api/currencies").then((d) => d.currencies);
export const createCurrency = (data) =>
  apiFetch("/api/currencies", { method: "POST", body: JSON.stringify(data) }).then((d) => d.currency);
export const updateCurrency = (id, data) =>
  apiFetch(`/api/currencies/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((d) => d.currency);
export const deleteCurrency = (id) => apiFetch(`/api/currencies/${id}`, { method: "DELETE" });
