import { apiFetch } from "../lib/apiClient";

export const fetchHomepage = () => apiFetch("/api/cms/homepage").then((d) => d.homepage);
export const updateHomepage = (data) =>
  apiFetch("/api/cms/homepage", { method: "PUT", body: JSON.stringify(data) }).then((d) => d.homepage);
