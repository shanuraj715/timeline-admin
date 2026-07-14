import { apiFetch } from "../lib/apiClient";

// ---- Pricing plans ----
export const fetchPlans = () => apiFetch("/api/pricing").then((d) => d.plans);
export const createPlan = (data) => apiFetch("/api/pricing", { method: "POST", body: JSON.stringify(data) }).then((d) => d.plan);
export const updatePlan = (id, data) =>
  apiFetch(`/api/pricing/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((d) => d.plan);
export const deletePlan = (id) => apiFetch(`/api/pricing/${id}`, { method: "DELETE" });

// ---- Payment gateways ----
export const fetchGateways = () => apiFetch("/api/payments/gateways").then((d) => d.gateways);
export const saveGateway = (provider, data) =>
  apiFetch(`/api/payments/gateways/${provider}`, { method: "PUT", body: JSON.stringify(data) }).then((d) => d.gateway);
export const deleteGateway = (provider) => apiFetch(`/api/payments/gateways/${provider}`, { method: "DELETE" });

// ---- Orders (admin view: all orders, via analytics' recent-orders) ----
export const fetchRecentOrders = (limit = 50) => apiFetch(`/api/analytics/recent-orders?limit=${limit}`).then((d) => d.orders);
export const refundOrder = (id) => apiFetch(`/api/payments/orders/${id}/refund`, { method: "POST" });
