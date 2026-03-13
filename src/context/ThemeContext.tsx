"use client";
// context/ThemeContext.tsx
//
// Applies the full DIUSCADI theme system to <html>.
//
// Each accent is a FULL THEME — not just a primary color swap.
// The CSS does the heavy lifting via [data-accent="x"].dark / :not(.dark)
// attribute selectors in globals.css. ThemeProvider's job is to:
//   1. Toggle class="dark" on <html>
//   2. Set data-accent="orange|emerald|violet|rose|amber" on <html>
//   3. Set data-theme="light|dark|system" on <html>
//   4. Patch --primary, --ring, --primary-foreground + gradient blobs
//      via style.setProperty() for instant JS-driven swaps.
//
// The CSS [data-accent] blocks in globals.css are the SSR / first-paint
// fallback. ThemeProvider re-applies the same values after hydration.

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { useUser } from "@/context/UserContext";
import type { ThemeMode, AccentColor } from "@/types/domain";
import { DEFAULT_PREFERENCES } from "@/types/domain";

// ─── Per-accent token tables ──────────────────────────────────────────────────

interface AccentModeTokens {
  primary: string;
  primaryForeground: string;
  ring: string;
  gradientBlobA: string;
  gradientBlobB: string;
  gradientBlobC: string;
}

interface AccentTheme {
  light: AccentModeTokens;
  dark: AccentModeTokens;
}

const ACCENT_THEMES: Record<AccentColor, AccentTheme> = {
  orange: {
    light: {
      primary: "oklch(0.65 0.22 47)",
      primaryForeground: "oklch(1 0 0)",
      ring: "oklch(0.65 0.22 47)",
      gradientBlobA: "oklch(0.65 0.22 47 / 18%)",
      gradientBlobB: "oklch(0.82 0.1 55 / 14%)",
      gradientBlobC: "oklch(0.9 0.05 35 / 10%)",
    },
    dark: {
      primary: "oklch(0.72 0.2 47)",
      primaryForeground: "oklch(1 0 0)",
      ring: "oklch(0.72 0.2 47)",
      gradientBlobA: "oklch(0.72 0.2 47 / 22%)",
      gradientBlobB: "oklch(0.5 0.15 55 / 15%)",
      gradientBlobC: "oklch(0.35 0.08 35 / 10%)",
    },
  },
  emerald: {
    light: {
      primary: "oklch(0.55 0.18 162)",
      primaryForeground: "oklch(1 0 0)",
      ring: "oklch(0.55 0.18 162)",
      gradientBlobA: "oklch(0.65 0.18 162 / 18%)",
      gradientBlobB: "oklch(0.82 0.08 155 / 14%)",
      gradientBlobC: "oklch(0.88 0.05 175 / 10%)",
    },
    dark: {
      primary: "oklch(0.7 0.18 162)",
      primaryForeground: "oklch(1 0 0)",
      ring: "oklch(0.7 0.18 162)",
      gradientBlobA: "oklch(0.7 0.18 162 / 22%)",
      gradientBlobB: "oklch(0.48 0.14 155 / 15%)",
      gradientBlobC: "oklch(0.32 0.07 175 / 10%)",
    },
  },
  violet: {
    light: {
      primary: "oklch(0.55 0.25 293)",
      primaryForeground: "oklch(1 0 0)",
      ring: "oklch(0.55 0.25 293)",
      gradientBlobA: "oklch(0.6 0.25 293 / 18%)",
      gradientBlobB: "oklch(0.78 0.1 280 / 14%)",
      gradientBlobC: "oklch(0.88 0.06 310 / 10%)",
    },
    dark: {
      primary: "oklch(0.72 0.24 293)",
      primaryForeground: "oklch(1 0 0)",
      ring: "oklch(0.72 0.24 293)",
      gradientBlobA: "oklch(0.72 0.24 293 / 22%)",
      gradientBlobB: "oklch(0.5 0.18 280 / 15%)",
      gradientBlobC: "oklch(0.35 0.1 310 / 10%)",
    },
  },
  rose: {
    light: {
      primary: "oklch(0.58 0.23 10)",
      primaryForeground: "oklch(1 0 0)",
      ring: "oklch(0.58 0.23 10)",
      gradientBlobA: "oklch(0.65 0.23 10 / 18%)",
      gradientBlobB: "oklch(0.82 0.1 355 / 14%)",
      gradientBlobC: "oklch(0.88 0.06 25 / 10%)",
    },
    dark: {
      primary: "oklch(0.72 0.22 10)",
      primaryForeground: "oklch(1 0 0)",
      ring: "oklch(0.72 0.22 10)",
      gradientBlobA: "oklch(0.72 0.22 10 / 22%)",
      gradientBlobB: "oklch(0.5 0.16 355 / 15%)",
      gradientBlobC: "oklch(0.34 0.08 25 / 10%)",
    },
  },
  // Amber: primary-foreground is DARK — gold is too bright for white text
  amber: {
    light: {
      primary: "oklch(0.72 0.18 84)",
      primaryForeground: "oklch(0.15 0.04 84)",
      ring: "oklch(0.72 0.18 84)",
      gradientBlobA: "oklch(0.78 0.18 84 / 20%)",
      gradientBlobB: "oklch(0.88 0.1 72 / 14%)",
      gradientBlobC: "oklch(0.92 0.06 95 / 10%)",
    },
    dark: {
      primary: "oklch(0.82 0.17 84)",
      primaryForeground: "oklch(0.15 0.04 84)",
      ring: "oklch(0.82 0.17 84)",
      gradientBlobA: "oklch(0.82 0.17 84 / 22%)",
      gradientBlobB: "oklch(0.58 0.13 72 / 15%)",
      gradientBlobC: "oklch(0.38 0.07 95 / 10%)",
    },
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return mode;
}

function applyFullTheme(mode: ThemeMode, accent: AccentColor): void {
  const html = document.documentElement;
  const resolved = resolveTheme(mode);

  // 1. Dark class
  html.setAttribute("data-theme", mode);
  if (resolved === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }

  // 2. Accent attribute — activates the full [data-accent="x"].dark / :not(.dark) blocks
  html.setAttribute("data-accent", accent);

  // 3. Inline style patch for instant swaps (overrides CSS specificity)
  const tokens = ACCENT_THEMES[accent][resolved];
  const set = (k: string, v: string) => html.style.setProperty(k, v);

  set("--primary", tokens.primary);
  set("--primary-foreground", tokens.primaryForeground);
  set("--ring", tokens.ring);
  set("--sidebar-primary", tokens.primary);
  set("--sidebar-ring", tokens.ring);
  set("--gradient-blob-a", tokens.gradientBlobA);
  set("--gradient-blob-b", tokens.gradientBlobB);
  set("--gradient-blob-c", tokens.gradientBlobC);

  // Amber sidebar needs dark foreground too
  if (accent === "amber") {
    set("--sidebar-primary-foreground", tokens.primaryForeground);
  } else {
    html.style.removeProperty("--sidebar-primary-foreground");
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  resolvedTheme: "light" | "dark";
  accent: AccentColor;
}

const ThemeContext = createContext<ThemeContextValue>({
  resolvedTheme: "light",
  accent: "orange",
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { profile } = useUser();

  const mode =
    profile?.preferences.appearance.theme ??
    DEFAULT_PREFERENCES.appearance.theme;
  const accent =
    profile?.preferences.appearance.accent ??
    DEFAULT_PREFERENCES.appearance.accent;

  // profileLoaded gates re-application when the profile first arrives.
  // Without this, if mode/accent happen to equal the defaults, React won't
  // re-run the effect after profile loads — and the correct tokens never apply.
  const profileLoaded = profile !== null;

  // mode, accent, AND profileLoaded are all deps — ensures we re-apply the
  // moment the real profile replaces the default seed.
  useEffect(() => {
    applyFullTheme(mode, accent);

    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyFullTheme("system", accent);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode, accent, profileLoaded]);

  const resolvedTheme: "light" | "dark" = useMemo(() => {
    if (typeof window === "undefined") return "light";
    return resolveTheme(mode);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ resolvedTheme, accent }}>
      {children}
    </ThemeContext.Provider>
  );
}
