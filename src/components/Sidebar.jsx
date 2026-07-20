import { NavLink } from "react-router-dom";
import { GalleryHorizontalEnd, LayoutDashboard, Layers, ShoppingBag, ShieldCheck, Bell, Megaphone, LogOut, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PERMISSION_GROUPS, hasAnyPermission } from "../lib/permissions";

// Each top-level item now contains its own tabbed sub-pages (see
// pages/Content.jsx, Commerce.jsx, Platform.jsx, Notifications.jsx) —
// collapsing what used to be ~11 flat sidebar links down to 5, with the
// specific section reachable via the URL hash (e.g. /commerce#coupons)
// instead of its own nav entry. Notifications was split out of Platform
// (which had grown to 8 tabs) into its own item once email templates/
// providers landed, keeping each grouped page to a handful of tabs.
//
// `group` matches a key in PERMISSION_GROUPS — a nav item is shown if the
// signed-in account holds at least one permission in that group (limited
// admins otherwise see only the sections they actually have tabs for).
const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true, icon: LayoutDashboard, group: "dashboard" },
  { to: "/content", label: "Content", icon: Layers, group: "content" },
  { to: "/commerce", label: "Commerce", icon: ShoppingBag, group: "commerce" },
  { to: "/platform", label: "Platform", icon: ShieldCheck, group: "platform" },
  { to: "/notifications", label: "Notifications", icon: Bell, group: "notifications" },
  { to: "/ads", label: "Ads", icon: Megaphone, group: "ads" },
];

// Static and always visible at lg+ (plenty of room); below that it's a
// fixed overlay drawer toggled from the Topbar's menu button, so the main
// content gets the full viewport width instead of losing 240px to a
// sidebar that a phone/tablet-width screen can't really spare.
export function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const items = NAV_ITEMS.filter((item) => {
    const group = PERMISSION_GROUPS.find((g) => g.key === item.group);
    return hasAnyPermission(user, group.permissions.map((p) => p.key));
  });

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-border px-5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GalleryHorizontalEnd size={16} />
            </span>
            <span className="text-base font-semibold text-text">Timeline Admin</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-1 text-text-muted hover:bg-surface-hover hover:text-text lg:hidden"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-0.5">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-surface-hover hover:text-text"
                  }`
                }
              >
                <item.icon size={17} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="border-t border-border px-3 py-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-danger"
          >
            <LogOut size={17} />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
