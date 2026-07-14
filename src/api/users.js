import { apiFetch } from "../lib/apiClient";

export const fetchUsers = ({ q, page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("page", page);
  params.set("limit", limit);
  return apiFetch(`/api/admin/users?${params.toString()}`);
};

export const adjustUserCredits = (id, { amount, reason }) =>
  apiFetch(`/api/admin/users/${id}/credits`, { method: "POST", body: JSON.stringify({ amount, reason }) });
