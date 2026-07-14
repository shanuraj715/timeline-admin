import { createContext, useContext, useState } from "react";

// index.html's inline script already resolves system preference into a
// concrete "light"/"dark" attribute (and any saved accent) before first
// paint (avoids a flash of the wrong theme) — this context just reads that
// resolved value back and persists explicit user choices from then on.
const THEME_STORAGE_KEY = "timeline-admin-theme";
const ACCENT_STORAGE_KEY = "timeline-admin-accent";
export const ACCENTS = ["blue", "red", "green", "purple", "orange", "pink"];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => document.documentElement.getAttribute("data-theme") || "light"
  );
  const [accent, setAccentState] = useState(
    () => document.documentElement.getAttribute("data-accent") || "blue"
  );

  function setTheme(next) {
    setThemeState(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    document.documentElement.setAttribute("data-theme", next);
  }

  function setAccent(next) {
    setAccentState(next);
    localStorage.setItem(ACCENT_STORAGE_KEY, next);
    document.documentElement.setAttribute("data-accent", next);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accent, setAccent }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
