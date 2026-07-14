import { NavLink } from "react-router-dom";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ to: "/", label: "Dashboard", end: true }],
  },
  {
    label: "Site content",
    items: [
      { to: "/navigation", label: "Navigation" },
      { to: "/footer", label: "Footer" },
      { to: "/pages", label: "Pages" },
      { to: "/themes", label: "Themes" },
    ],
  },
  {
    label: "Billing",
    items: [
      { to: "/pricing", label: "Pricing plans" },
      { to: "/payment-gateways", label: "Payment gateways" },
      { to: "/orders", label: "Orders" },
    ],
  },
  {
    label: "Platform",
    items: [{ to: "/feature-flags", label: "Feature flags" }],
  },
];

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <span className="text-base font-semibold text-text">Timeline Admin</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-surface-hover hover:text-text"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
