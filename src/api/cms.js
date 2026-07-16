import { apiFetch } from "../lib/apiClient";

// ---- Nav items ----
export const fetchNavItems = () => apiFetch("/api/cms/nav").then((d) => d.items);
export const createNavItem = (data) =>
  apiFetch("/api/cms/nav", { method: "POST", body: JSON.stringify(data) }).then((d) => d.item);
export const updateNavItem = (id, data) =>
  apiFetch(`/api/cms/nav/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((d) => d.item);
export const deleteNavItem = (id) => apiFetch(`/api/cms/nav/${id}`, { method: "DELETE" });
export const reorderNavItems = (items) =>
  apiFetch("/api/cms/nav/reorder", { method: "PATCH", body: JSON.stringify({ items }) });

// ---- Footer columns ----
export const fetchFooterColumns = () => apiFetch("/api/cms/footer").then((d) => d.columns);
export const createFooterColumn = (data) =>
  apiFetch("/api/cms/footer", { method: "POST", body: JSON.stringify(data) }).then((d) => d.column);
export const updateFooterColumn = (id, data) =>
  apiFetch(`/api/cms/footer/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((d) => d.column);
export const deleteFooterColumn = (id) => apiFetch(`/api/cms/footer/${id}`, { method: "DELETE" });
export const reorderFooterColumns = (items) =>
  apiFetch("/api/cms/footer/reorder", { method: "PATCH", body: JSON.stringify({ items }) });

// ---- Pages ----
export const fetchPages = () => apiFetch("/api/cms/pages").then((d) => d.pages);
export const fetchPage = (id) => apiFetch(`/api/cms/pages/${id}`).then((d) => d.page);
export const createPage = (data) =>
  apiFetch("/api/cms/pages", { method: "POST", body: JSON.stringify(data) }).then((d) => d.page);
export const updatePage = (id, data) =>
  apiFetch(`/api/cms/pages/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((d) => d.page);
export const deletePage = (id) => apiFetch(`/api/cms/pages/${id}`, { method: "DELETE" });

// Image/video uploads embedded inline in a page's rich-text content — not
// tied to a specific page id, see cms.js's cmsMediaKey comment on the
// backend. Returns the URL to insert directly into the editor.
export function uploadCmsMedia(file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch("/api/cms/media", { method: "POST", body: formData });
}
