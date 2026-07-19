import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../lib/permissions";
import { EmptyState } from "./ui/Table";

// Every page under Content/Commerce/Platform/Notifications self-gates by
// filtering its own tabs to hasPermission(user, ...) — but pages/new and
// pages/:id are top-level routes (the page editor isn't a tab), so nothing
// stopped an admin with zero content.pages permission from navigating there
// directly and seeing the full editor UI before any save attempt 403s
// server-side. This wraps a route the same way RequireAuth does, one level
// down (permission, not just authentication).
export function RequirePermission({ permission, children }) {
  const { user } = useAuth();

  if (!hasPermission(user, permission)) {
    return <EmptyState title="No access" description="You don't have access to this section." />;
  }

  return children;
}
