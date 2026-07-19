// Shared fetch wrapper for all calls to the backend, mirroring the main
// Timeline app's src/lib/apiClient.js exactly: same CSRF header
// convention, same silent-refresh-on-401 behavior. Requests go to /api/*
// on this app's own origin, which vite.config.js proxies to the backend —
// see that file's comment for why (keeps cookies same-origin).

import { notifyForbidden } from "./permissionStore";

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

  // A 403 (permission missing) or a 401 with code UNAUTHORIZED for a route
  // outside the login/session-bootstrap flow itself both mean the backend
  // just re-checked this account's real, current access (every route does
  // — see the backend's lib/auth/guards.js requirePermission) and said no.
  // If the sidebar/tabs still show an action as available, that access
  // changed since this tab last loaded (e.g. a superadmin edited this
  // account's permissions, or revoked it outright, while it stayed open) —
  // this is components/PermissionRevalidator.jsx's cue to refetch the
  // current user and re-render around the corrected permission set.
  const isAuthBootstrapRoute = path === "/api/auth/me" || path === "/api/auth/refresh" || path === "/api/auth/login";
  if ((res.status === 403 && data?.code === "FORBIDDEN") || (res.status === 401 && data?.code === "UNAUTHORIZED" && !isAuthBootstrapRoute)) {
    notifyForbidden();
  }

  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, {
      status: res.status,
      code: data?.code,
      fieldErrors: data?.fieldErrors,
    });
  }

  return data;
}
