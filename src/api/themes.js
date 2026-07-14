import { apiFetch } from "../lib/apiClient";

export const fetchThemes = () => apiFetch("/api/themes").then((d) => d.themes);
export const createTheme = (data) => apiFetch("/api/themes", { method: "POST", body: JSON.stringify(data) }).then((d) => d.theme);
export const updateTheme = (id, data) =>
  apiFetch(`/api/themes/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((d) => d.theme);
export const deleteTheme = (id) => apiFetch(`/api/themes/${id}`, { method: "DELETE" });
export const setDefaultTheme = (id) => apiFetch(`/api/themes/${id}/set-default`, { method: "POST" }).then((d) => d.theme);

export async function uploadThemeImage(id, file) {
  const formData = new FormData();
  formData.append("image", file);
  return apiFetch(`/api/themes/${id}/image`, { method: "POST", body: formData }).then((d) => d.theme);
}
