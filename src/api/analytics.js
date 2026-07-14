import { apiFetch } from "../lib/apiClient";

export const fetchSummary = () => apiFetch("/api/analytics/summary");

// `range` is either { days } (rolling window) or { from, to, groupBy }
// (explicit range, "from"/"to" as ISO date strings) — see
// DateRangeSelect.jsx, which produces both shapes depending on the preset.
function rangeQuery(range) {
  const params = new URLSearchParams();
  if (range.from && range.to) {
    params.set("from", range.from);
    params.set("to", range.to);
    if (range.groupBy) params.set("groupBy", range.groupBy);
  } else {
    params.set("days", range.days ?? 30);
  }
  return params.toString();
}

export const fetchRevenueOverTime = (range = { days: 30 }) =>
  apiFetch(`/api/analytics/revenue-over-time?${rangeQuery(range)}`).then((d) => d.points);
export const fetchSignupsOverTime = (range = { days: 30 }) =>
  apiFetch(`/api/analytics/signups-over-time?${rangeQuery(range)}`).then((d) => d.points);
