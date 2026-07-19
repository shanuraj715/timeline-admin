// Mirrors timeline-backend/src/lib/permissions.js — the 19-key catalog is
// the source of truth server-side; this is just the labeled/grouped copy
// for rendering nav filters and the grant-access checkbox list. Labels
// reuse each page's own TABS array wording exactly.
export const PERMISSION_GROUPS = [
  { key: "dashboard", label: "Dashboard", permissions: [{ key: "dashboard", label: "Dashboard" }] },
  {
    key: "content",
    label: "Content",
    permissions: [
      { key: "content.navigation", label: "Navigation" },
      { key: "content.footer", label: "Footer" },
      { key: "content.pages", label: "Pages" },
      { key: "content.themes", label: "Themes" },
    ],
  },
  {
    key: "commerce",
    label: "Commerce",
    permissions: [
      { key: "commerce.pricing", label: "Pricing plans" },
      { key: "commerce.currencies", label: "Currencies" },
      { key: "commerce.coupons", label: "Coupons" },
      { key: "commerce.gateways", label: "Payment gateways" },
      { key: "commerce.orders", label: "Orders" },
    ],
  },
  {
    key: "platform",
    label: "Platform",
    permissions: [
      { key: "platform.users", label: "Users" },
      { key: "platform.timelines", label: "Timelines" },
      { key: "platform.storage", label: "Storage" },
      { key: "platform.system", label: "System health" },
      { key: "platform.security", label: "Security log" },
      { key: "platform.flags", label: "Feature flags" },
      { key: "platform.settings", label: "Settings" },
      { key: "platform.admins", label: "Admins" },
    ],
  },
  {
    key: "notifications",
    label: "Notifications",
    permissions: [
      { key: "notifications.templates", label: "Email templates" },
      { key: "notifications.providers", label: "Email providers" },
    ],
  },
];

// Maps each PERMISSION_GROUPS key to its top-level route — shared by
// Sidebar.jsx (which nav items to show) and Dashboard.jsx (where to send a
// limited admin who lacks "dashboard" but lands on "/" anyway, e.g. via a
// bookmark or the login redirect).
export const GROUP_ROUTES = {
  dashboard: "/",
  content: "/content",
  commerce: "/commerce",
  platform: "/platform",
  notifications: "/notifications",
};

export function firstAccessibleRoute(user) {
  const group = PERMISSION_GROUPS.find((g) => hasAnyPermission(user, g.permissions.map((p) => p.key)));
  return group ? GROUP_ROUTES[group.key] : null;
}

export const PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));

export const PERMISSION_LABELS = Object.fromEntries(
  PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => [p.key, p.label]))
);

export function hasPermission(user, key) {
  if (!user) return false;
  if (user.role === "superadmin") return true;
  return user.role === "admin" && (user.permissions || []).includes(key);
}

export function hasAnyPermission(user, keys) {
  return keys.some((key) => hasPermission(user, key));
}
