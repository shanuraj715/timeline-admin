import { useLocation, useNavigate } from "react-router-dom";

// URL-hash-driven tabs — the hash is the source of truth, so a tab is
// directly linkable/bookmarkable/shareable (e.g. /commerce#coupons) instead
// of living only in component state. Switching tabs replaces the history
// entry rather than pushing a new one, so the back button doesn't have to
// click through every tab a user visited on the way to what they wanted.
export function Tabs({ tabs, defaultTab, children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const activeKey = location.hash.replace("#", "") || defaultTab || tabs[0]?.key;
  const active = tabs.find((t) => t.key === activeKey) ? activeKey : tabs[0]?.key;

  function setActiveKey(key) {
    navigate({ hash: key }, { replace: true });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveKey(tab.key)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                active === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text"
              }`}
            >
              {Icon && <Icon size={15} />}
              {tab.label}
            </button>
          );
        })}
      </div>
      <div>{children(active)}</div>
    </div>
  );
}
