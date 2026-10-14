
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type AccentColor = "pink" | "purple" | "blue" | "sage";

type ThemeContextValue = {
  mode: ThemeMode;
  accent: AccentColor;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  mounted: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const ACCENTS: AccentColor[] = ["pink", "purple", "blue", "sage"];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [accent, setAccentState] = useState<AccentColor>("pink");
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback(
    (nextMode: ThemeMode, nextAccent: AccentColor) => {
      const root = document.documentElement;
      const isDark =
        nextMode === "dark" ||
        (nextMode === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      root.dataset.theme = isDark ? "dark" : "light";
      root.dataset.accent = nextAccent;
      root.style.colorScheme = isDark ? "dark" : "light";
    },
    [],
  );

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("hanan-theme-mode");
      const savedAccent = localStorage.getItem("hanan-theme-accent");

      const validMode: ThemeMode =
        savedMode === "light" ||
        savedMode === "dark" ||
        savedMode === "system"
          ? savedMode
          : "light";

      const validAccent: AccentColor = ACCENTS.includes(
        savedAccent as AccentColor,
      )
        ? (savedAccent as AccentColor)
        : "pink";

      setModeState(validMode);
      setAccentState(validAccent);
      applyTheme(validMode, validAccent);
    } catch {
      applyTheme("light", "pink");
    }

    setMounted(true);
  }, [applyTheme]);

  useEffect(() => {
    if (!mounted) return;

    applyTheme(mode, accent);

    try {
      localStorage.setItem("hanan-theme-mode", mode);
      localStorage.setItem("hanan-theme-accent", accent);
    } catch {
      // Tema tetap bisa digunakan jika penyimpanan browser tidak tersedia.
    }
  }, [mode, accent, mounted, applyTheme]);

  useEffect(() => {
    if (mode !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => applyTheme("system", accent);

    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [mode, accent, applyTheme]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        accent,
        setMode: setModeState,
        setAccent: setAccentState,
        mounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme harus digunakan di dalam ThemeProvider.");
  }

  return context;
}
