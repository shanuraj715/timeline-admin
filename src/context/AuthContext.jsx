import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiFetch, ApiError } from "../lib/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = logged out
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch("/api/auth/me");
      // Defense in depth: a session that's valid but no longer belongs to a
      // superadmin (e.g. demoted after logging in here) shouldn't be
      // treated as authenticated for this app, even though login() already
      // rejects this case at sign-in time.
      setUser(data.user.role === "superadmin" ? data.user : null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function login(email, password) {
    setError(null);
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (data.user.role !== "superadmin") {
        await apiFetch("/api/auth/logout", { method: "POST" });
        setError("This account doesn't have admin access.");
        setUser(null);
        return false;
      }
      setUser(data.user);
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to log in.");
      return false;
    }
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, error, login, logout, refresh }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
