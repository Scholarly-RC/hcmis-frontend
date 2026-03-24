"use client";

import type * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: "class" | "data-theme";
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  forcedTheme?: Exclude<Theme, "system">;
  storageKey?: string;
  value?: Record<string, string>;
};

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  forcedTheme?: Exclude<Theme, "system">;
  themes: Theme[];
  systemTheme?: ResolvedTheme;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "theme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(storageKey: string) {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return window.localStorage.getItem(storageKey) as Theme | null;
  } catch {
    return undefined;
  }
}

function applyThemeToDocument({
  attribute,
  theme,
  value,
  enableSystem,
  disableTransitionOnChange,
}: {
  attribute: "class" | "data-theme";
  theme: Theme;
  value?: Record<string, string>;
  enableSystem: boolean;
  disableTransitionOnChange: boolean;
}) {
  const root = document.documentElement;
  const resolvedTheme =
    theme === "system" && enableSystem ? getSystemTheme() : theme;
  const appliedTheme = value?.[resolvedTheme] ?? resolvedTheme;

  if (disableTransitionOnChange) {
    const style = document.createElement("style");
    style.setAttribute("data-theme-transition-disable", "true");
    style.appendChild(
      document.createTextNode(
        "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;transition:none!important}",
      ),
    );
    document.head.appendChild(style);

    window.getComputedStyle(root);
    window.setTimeout(() => {
      document.head.removeChild(style);
    }, 1);
  }

  if (attribute === "class") {
    root.classList.remove("light", "dark");
    root.classList.add(appliedTheme);
    return;
  }

  root.setAttribute(attribute, appliedTheme);
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
  forcedTheme,
  storageKey = STORAGE_KEY,
  value,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const storedTheme = getStoredTheme(storageKey);

    if (
      storedTheme === "light" ||
      storedTheme === "dark" ||
      storedTheme === "system"
    ) {
      return storedTheme;
    }

    return defaultTheme;
  });
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    getSystemTheme(),
  );
  const resolvedTheme: ResolvedTheme =
    theme === "system" && enableSystem
      ? systemTheme
      : theme === "dark"
        ? "dark"
        : "light";

  useLayoutEffect(() => {
    if (forcedTheme) {
      applyThemeToDocument({
        attribute,
        theme: forcedTheme,
        value,
        enableSystem,
        disableTransitionOnChange,
      });
      return;
    }

    applyThemeToDocument({
      attribute,
      theme,
      value,
      enableSystem,
      disableTransitionOnChange,
    });
  }, [
    attribute,
    disableTransitionOnChange,
    enableSystem,
    forcedTheme,
    theme,
    value,
  ]);

  useEffect(() => {
    if (forcedTheme) {
      return;
    }

    if (theme === "system" && enableSystem) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = (event: MediaQueryListEvent) => {
        setSystemTheme(event.matches ? "dark" : "light");
      };

      setSystemTheme(mediaQuery.matches ? "dark" : "light");
      mediaQuery.addEventListener("change", handleChange);

      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    return undefined;
  }, [enableSystem, forcedTheme, theme]);

  useEffect(() => {
    if (forcedTheme) {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // Ignore storage failures.
    }
  }, [forcedTheme, storageKey, theme]);

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      if (forcedTheme) {
        return;
      }

      setThemeState(nextTheme);
    },
    [forcedTheme],
  );

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      forcedTheme,
      themes: enableSystem ? ["light", "dark", "system"] : ["light", "dark"],
      systemTheme: enableSystem ? systemTheme : undefined,
    }),
    [enableSystem, forcedTheme, resolvedTheme, setTheme, systemTheme, theme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
