import { apiFetch } from "../lib/apiClient";

export const fetchEmailTemplates = () => apiFetch("/api/email-templates").then((d) => d.templates);
export const updateEmailTemplate = (eventKey, data) =>
  apiFetch(`/api/email-templates/${eventKey}`, { method: "PATCH", body: JSON.stringify(data) }).then((d) => d.template);
export const previewEmailTemplate = (eventKey, draft = {}) =>
  apiFetch(`/api/email-templates/${eventKey}/preview`, { method: "POST", body: JSON.stringify(draft) });
export const testEmailTemplate = (eventKey, to) =>
  apiFetch(`/api/email-templates/${eventKey}/test`, { method: "POST", body: JSON.stringify({ to }) });

export function uploadEmailTemplateImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  return apiFetch("/api/email-templates/images", { method: "POST", body: formData });
}
