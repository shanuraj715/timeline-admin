// Mirrors the main Timeline app's src/lib/permissionStore.js exactly — a
// revoked/demoted admin's already-open tab has no other way to learn its
// permissions changed short of a manual page reload. apiClient.js flips
// this the instant any API call comes back 403 for a real RBAC reason.
const listeners = new Set();

export function notifyForbidden() {
  listeners.forEach((listener) => listener());
}

export function subscribeForbidden(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
