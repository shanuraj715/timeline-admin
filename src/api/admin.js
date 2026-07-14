import { apiFetch } from "../lib/apiClient";

export const fetchPlatformStats = () => apiFetch("/api/admin/stats");

export const fetchAdminTimelines = (q = "") =>
  apiFetch(`/api/admin/timelines${q ? `?q=${encodeURIComponent(q)}` : ""}`).then((d) => d.timelines);

export const fetchSecurityLog = () => apiFetch("/api/admin/security-log").then((d) => d.events);

export const runUserAction = (id, action) =>
  apiFetch(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ action }) });
