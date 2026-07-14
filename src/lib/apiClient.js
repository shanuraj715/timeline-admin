// Shared fetch wrapper for all calls to the backend, mirroring the main
// Timeline app's src/lib/apiClient.js exactly: same CSRF header
// convention, same silent-refresh-on-401 behavior. Requests go to /api/*
// on this app's own origin, which vite.config.js proxies to the backend —
// see that file's comment for why (keeps cookies same-origin).

let refreshPromise = null;

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: { "X-Requested-With": "timeline-app" },
    })
      .then((res) => res.ok)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export class ApiError extends Error {
  constructor(message, { status, code, fieldErrors } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  const doFetch = () =>
    fetch(path, {
      ...options,
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        "X-Requested-With": "timeline-app",
        ...(options.headers || {}),
      },
    });

  let res = await doFetch();

  if (res.status === 401 && !options._retried && path !== "/api/auth/refresh") {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await doFetch();
    }
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json().catch(() => ({})) : null;

  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, {
      status: res.status,
      code: data?.code,
      fieldErrors: data?.fieldErrors,
    });
  }

  return data;
}
