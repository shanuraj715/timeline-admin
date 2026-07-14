import { apiFetch } from "../lib/apiClient";

export const fetchFlags = () => apiFetch("/api/feature-flags").then((d) => d.flags);
export const createFlag = (data) => apiFetch("/api/feature-flags", { method: "POST", body: JSON.stringify(data) }).then((d) => d.flag);
export const updateFlag = (id, data) =>
  apiFetch(`/api/feature-flags/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((d) => d.flag);
export const deleteFlag = (id) => apiFetch(`/api/feature-flags/${id}`, { method: "DELETE" });
