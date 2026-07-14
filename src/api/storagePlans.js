import { apiFetch } from "../lib/apiClient";

export const fetchStoragePlans = () => apiFetch("/api/storage-plans").then((d) => d.plans);
export const createStoragePlan = (data) =>
  apiFetch("/api/storage-plans", { method: "POST", body: JSON.stringify(data) }).then((d) => d.plan);
export const updateStoragePlan = (id, data) =>
  apiFetch(`/api/storage-plans/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((d) => d.plan);
export const deleteStoragePlan = (id) => apiFetch(`/api/storage-plans/${id}`, { method: "DELETE" });
