import { CircleUserRound, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "./ThemeToggle";

export function Topbar({ onToggleSidebar }) {
  const { user } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface px-6">
      <button
        onClick={onToggleSidebar}
        aria-label="Toggle menu"
        className="rounded-md p-1.5 text-text-muted hover:bg-surface-hover hover:text-text lg:hidden"
      >
        <Menu size={20} />
      </button>
      {/* flex-1 + justify-end here (not justify-between on the header)
          because the hamburger button above is `display:none` at lg+ —
          with only one visible flex child, justify-between collapses it to
          the start instead of the end. This stays right-aligned either way. */}
      <div className="flex flex-1 items-center justify-end gap-3">
        <ThemeToggle />
        <div className="h-5 w-px bg-border" />
        <span className="flex items-center gap-1.5 text-sm text-text-muted">
          <CircleUserRound size={16} />
          {user?.name}
        </span>
      </div>
    </header>
  );
}
