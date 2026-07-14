import { apiFetch } from "../lib/apiClient";

export const fetchCoupons = () => apiFetch("/api/coupons").then((d) => d.coupons);
export const createCoupon = (data) =>
  apiFetch("/api/coupons", { method: "POST", body: JSON.stringify(data) }).then((d) => d.coupon);
export const updateCoupon = (id, data) =>
  apiFetch(`/api/coupons/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((d) => d.coupon);
export const deleteCoupon = (id) => apiFetch(`/api/coupons/${id}`, { method: "DELETE" });
