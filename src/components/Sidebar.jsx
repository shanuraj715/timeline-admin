import { NavLink } from "react-router-dom";
import { GalleryHorizontalEnd, LayoutDashboard, Layers, ShoppingBag, ShieldCheck } from "lucide-react";

// Each top-level item now contains its own tabbed sub-pages (see
// pages/Content.jsx, Commerce.jsx, Platform.jsx) — collapsing what used to
// be ~11 flat sidebar links down to 4, with the specific section reachable
// via the URL hash (e.g. /commerce#coupons) instead of its own nav entry.
const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true, icon: LayoutDashboard },
  { to: "/content", label: "Content", icon: Layers },
  { to: "/commerce", label: "Commerce", icon: ShoppingBag },
  { to: "/platform", label: "Platform", icon: ShieldCheck },
];

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <GalleryHorizontalEnd size={16} />
        </span>
        <span className="text-base font-semibold text-text">Timeline Admin</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
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
    </aside>
  );
}
