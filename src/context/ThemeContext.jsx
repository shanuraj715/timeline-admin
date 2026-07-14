import { createContext, useContext, useState } from "react";

// index.html's inline script already resolves system preference into a
// concrete "light"/"dark" attribute before first paint (avoids a flash of
// the wrong theme) — this context just reads that resolved value back and
// persists explicit user choices from then on.
const STORAGE_KEY = "timeline-admin-theme";
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => document.documentElement.getAttribute("data-theme") || "light"
  );

  function setTheme(next) {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
