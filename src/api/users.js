import { apiFetch } from "../lib/apiClient";

export const fetchUsers = (q = "") =>
  apiFetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`).then((d) => d.users);

export const adjustUserCredits = (id, { amount, reason }) =>
  apiFetch(`/api/admin/users/${id}/credits`, { method: "POST", body: JSON.stringify({ amount, reason }) });
