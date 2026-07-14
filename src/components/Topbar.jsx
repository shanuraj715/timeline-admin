import { CircleUserRound, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "./ThemeToggle";

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <div />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="h-5 w-px bg-border" />
        <span className="flex items-center gap-1.5 text-sm text-text-muted">
          <CircleUserRound size={16} />
          {user?.name}
        </span>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-surface-hover hover:text-text"
        >
          <LogOut size={15} />
          Log out
        </button>
      </div>
    </header>
  );
}
