import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeForbidden } from "../lib/permissionStore";
import { useAuth } from "../context/AuthContext";

// Renders nothing — mounted once at the root (see App.jsx) purely for its
// effect. apiClient.js flips lib/permissionStore.js's signal the instant
// any API call comes back 403; this re-fetches the current user (the
// source of `user.permissions`, which Sidebar/Content/Commerce/Platform/
// Notifications all filter their nav and tabs against) so a tab that
// shouldn't be visible anymore actually disappears, without whoever's
// still on this page needing to reload it manually. Also invalidates every
// other query, since a permission change can affect any of them (e.g. a
// coupon list fetched while the account still had commerce.coupons).
export function PermissionRevalidator() {
  const { refresh } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    return subscribeForbidden(() => {
      refresh();
      queryClient.invalidateQueries();
    });
  }, [refresh, queryClient]);

  return null;
}
