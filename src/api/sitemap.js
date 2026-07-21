import { apiFetch } from "../lib/apiClient";

export const fetchSitemap = () => apiFetch("/api/sitemap");
export const generateSitemap = () => apiFetch("/api/sitemap/generate", { method: "POST" });
