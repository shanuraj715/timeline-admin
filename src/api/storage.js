import { apiFetch } from "../lib/apiClient";

// ---- Providers ----
export const fetchStorageProviders = () => apiFetch("/api/storage/providers").then((d) => d.providers);
export const createStorageProvider = (data) =>
  apiFetch("/api/storage/providers", { method: "POST", body: JSON.stringify(data) }).then((d) => d.provider);
export const updateStorageProvider = (id, data) =>
  apiFetch(`/api/storage/providers/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((d) => d.provider);
export const deleteStorageProvider = (id) => apiFetch(`/api/storage/providers/${id}`, { method: "DELETE" });
export const recalculateStorageProvider = (id) =>
  apiFetch(`/api/storage/providers/${id}/recalculate`, { method: "POST" }).then((d) => d.provider);

// Returns { activated: true } for a direct switch, or { migrationStarted: true, job }
// once `mode` is supplied. A 409 (thrown as ApiError with code
// MIGRATION_MODE_REQUIRED) means the caller needs to ask the admin move vs
// copy and re-call with `{ mode }`.
export const activateStorageProvider = (id, mode) =>
  apiFetch(`/api/storage/providers/${id}/activate`, {
    method: "POST",
    body: JSON.stringify(mode ? { mode } : {}),
  });

// ---- Jobs ----
export const fetchActiveStorageJob = () => apiFetch("/api/storage/jobs/active").then((d) => d.job);
export const fetchStorageJobs = () => apiFetch("/api/storage/jobs").then((d) => d.jobs);
export const fetchStorageJob = (id) => apiFetch(`/api/storage/jobs/${id}`).then((d) => d.job);
export const cancelStorageJob = (id) => apiFetch(`/api/storage/jobs/${id}/cancel`, { method: "POST" }).then((d) => d.job);

// ---- Orphan files ----
export const startOrphanScan = (providerId) =>
  apiFetch("/api/storage/orphan-scan", {
    method: "POST",
    body: JSON.stringify(providerId ? { providerId } : {}),
  }).then((d) => d.job);
export const fetchLatestOrphanScan = () => apiFetch("/api/storage/orphan-scan/latest").then((d) => d.job);
export const deleteOrphanFiles = (providerId, keys) =>
  apiFetch("/api/storage/orphan-files/delete", { method: "POST", body: JSON.stringify({ providerId, keys }) });
