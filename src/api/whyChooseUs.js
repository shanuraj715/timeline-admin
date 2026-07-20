import { apiFetch } from "../lib/apiClient";

export const fetchWhyChooseUs = () => apiFetch("/api/cms/why-choose-us").then((d) => d.whyChooseUs);
export const updateWhyChooseUs = (data) =>
  apiFetch("/api/cms/why-choose-us", { method: "PUT", body: JSON.stringify(data) }).then((d) => d.whyChooseUs);
