import { apiFetch } from "../lib/apiClient";

export const fetchSummary = () => apiFetch("/api/analytics/summary");
export const fetchRevenueOverTime = (days = 30) => apiFetch(`/api/analytics/revenue-over-time?days=${days}`).then((d) => d.points);
export const fetchSignupsOverTime = (days = 30) => apiFetch(`/api/analytics/signups-over-time?days=${days}`).then((d) => d.points);
