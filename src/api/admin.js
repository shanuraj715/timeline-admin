import { apiFetch } from "../lib/apiClient";

function toQueryString(params = {}) {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") usp.set(key, value);
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

export const fetchPlatformStats = () => apiFetch("/api/admin/stats");

export const fetchAdminTimelines = ({ q, page = 1, limit = 20 } = {}) =>
  apiFetch(`/api/admin/timelines${toQueryString({ q, page, limit })}`);

export const updateTimelineStorageQuota = (id, quotaBytes) =>
  apiFetch(`/api/admin/timelines/${id}/storage`, { method: "PATCH", body: JSON.stringify({ quotaBytes }) });

export const fetchAdminOrders = ({ page = 1, limit = 20, status } = {}) =>
  apiFetch(`/api/admin/orders${toQueryString({ page, limit, status })}`);

export const fetchSecurityLogActions = () =>
  apiFetch("/api/admin/security-log/actions").then((d) => d.actions);

export const fetchSecurityLog = ({ cursor, limit = 50, userEmail, action, ip, dateFrom, dateTo } = {}) =>
  apiFetch(`/api/admin/security-log${toQueryString({ cursor, limit, userEmail, action, ip, dateFrom, dateTo })}`);

export const runUserAction = (id, action) =>
  apiFetch(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ action }) });

export const fetchUserTimelines = (id) =>
  apiFetch(`/api/admin/users/${id}/timelines`).then((d) => d.timelines);

export const fetchVideoQueue = ({ status, page = 1, limit = 20 } = {}) =>
  apiFetch(`/api/admin/video-queue${toQueryString({ status, page, limit })}`);

export const retryVideoProcessing = (mediaId) =>
  apiFetch(`/api/admin/video-queue/${mediaId}/retry`, { method: "POST" });

export const suspendTimeline = (id, reason) =>
  apiFetch(`/api/admin/timelines/${id}/suspend`, { method: "POST", body: JSON.stringify({ reason }) });

export const restoreTimeline = (id) =>
  apiFetch(`/api/admin/timelines/${id}/restore`, { method: "POST" });

export const transferTimelineOwnership = (id, newOwnerUserId) =>
  apiFetch(`/api/admin/timelines/${id}/transfer-ownership`, {
    method: "POST",
    body: JSON.stringify({ newOwnerUserId }),
  });

export const banUser = (id, reason) =>
  apiFetch(`/api/admin/users/${id}/ban`, { method: "POST", body: JSON.stringify({ reason }) });

export const unbanUser = (id) => apiFetch(`/api/admin/users/${id}/unban`, { method: "POST" });

export const forceLogoutUser = (id) => apiFetch(`/api/admin/users/${id}/force-logout`, { method: "POST" });

export const bulkUserAction = (ids, action) =>
  apiFetch("/api/admin/users/bulk", { method: "POST", body: JSON.stringify({ ids, action }) });

export const bulkTimelineAction = (ids, action) =>
  apiFetch("/api/admin/timelines/bulk", { method: "POST", body: JSON.stringify({ ids, action }) });
