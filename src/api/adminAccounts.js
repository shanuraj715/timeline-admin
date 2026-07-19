import { apiFetch } from "../lib/apiClient";

export const fetchAdminAccounts = () => apiFetch("/api/admin-accounts").then((d) => d.accounts);

export const grantAdminAccess = (data) =>
  apiFetch("/api/admin-accounts", { method: "POST", body: JSON.stringify(data) }).then((d) => d.account);

export const updateAdminPermissions = (id, permissions) =>
  apiFetch(`/api/admin-accounts/${id}`, { method: "PATCH", body: JSON.stringify({ permissions }) }).then(
    (d) => d.account
  );

export const revokeAdminAccess = (id) => apiFetch(`/api/admin-accounts/${id}`, { method: "DELETE" });
