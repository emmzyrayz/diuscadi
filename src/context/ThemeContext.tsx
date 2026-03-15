"use client";
// context/ThemeContext.tsx
//
// Applies the DIUSCADI theme system to <html>.
//
// Light mode:  accent-driven. CSS [data-accent="x"]:not(.dark) blocks in
//              globals.css define a full coloured surface system per accent.
//
// Dark mode:   universal. CSS .dark defines a pure black/white/grey surface
//              system regardless of accent. Only --primary, --ring, and a
//              very faint gradient-blob-a carry the accent colour so that
//              buttons, links, and focus rings still feel themed.
//
// ThemeProvider's jobs:
//   1. Toggle class="dark" on <html>
//   2. Set data-accent on <html>        (CSS picks up light mode surfaces)
//   3. Set data-theme on <html>         (for any future CSS targeting)
//   4. Patch --primary, --ring, --primary-foreground via style.setProperty()
//      for instant JS-driven swaps (both modes)
//   5. In dark mode only: patch --gradient-blob-a with a faint primary tint
//      (5%) so there's just a hint of colour depth in the background

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

// ─── Per-accent primary tokens ────────────────────────────────────────────────
// Only primary / ring / primaryForeground differ per accent.
// Everything else (surfaces, borders, blobs) is handled by CSS.

interface AccentTokens {
  primary: string;
  primaryForeground: string;
  ring: string;
  // Light-mode gradient blobs — full colour
  lightBlobA: string;
  lightBlobB: string;
  lightBlobC: string;
  // Dark-mode gradient blobs — very faint primary tint only
  darkBlobA: string;
}

const ACCENT_TOKENS: Record<AccentColor, AccentTokens> = {
  orange: {
    primary: "oklch(0.65 0.22 47)",
    primaryForeground: "oklch(1 0 0)",
    ring: "oklch(0.65 0.22 47)",
    lightBlobA: "oklch(0.65 0.22 47 / 18%)",
    lightBlobB: "oklch(0.82 0.10 55  / 14%)",
    lightBlobC: "oklch(0.90 0.05 35  / 10%)",
    darkBlobA: "oklch(0.65 0.22 47 /  5%)",
  },
  emerald: {
    primary: "oklch(0.55 0.18 162)",
    primaryForeground: "oklch(1 0 0)",
    ring: "oklch(0.55 0.18 162)",
    lightBlobA: "oklch(0.65 0.18 162 / 18%)",
    lightBlobB: "oklch(0.82 0.08 155 / 14%)",
    lightBlobC: "oklch(0.88 0.05 175 / 10%)",
    darkBlobA: "oklch(0.55 0.18 162 /  5%)",
  },
  violet: {
    primary: "oklch(0.55 0.25 293)",
    primaryForeground: "oklch(1 0 0)",
    ring: "oklch(0.55 0.25 293)",
    lightBlobA: "oklch(0.60 0.25 293 / 18%)",
    lightBlobB: "oklch(0.78 0.10 280 / 14%)",
    lightBlobC: "oklch(0.88 0.06 310 / 10%)",
    darkBlobA: "oklch(0.55 0.25 293 /  5%)",
  },
  rose: {
    primary: "oklch(0.58 0.23 10)",
    primaryForeground: "oklch(1 0 0)",
    ring: "oklch(0.58 0.23 10)",
    lightBlobA: "oklch(0.65 0.23 10  / 18%)",
    lightBlobB: "oklch(0.82 0.10 355 / 14%)",
    lightBlobC: "oklch(0.88 0.06 25  / 10%)",
    darkBlobA: "oklch(0.58 0.23 10  /  5%)",
  },
  // Amber: primary-foreground is DARK — gold cannot carry white text
  amber: {
    primary: "oklch(0.72 0.18 84)",
    primaryForeground: "oklch(0.15 0.04 84)",
    ring: "oklch(0.72 0.18 84)",
    lightBlobA: "oklch(0.78 0.18 84 / 20%)",
    lightBlobB: "oklch(0.88 0.10 72 / 14%)",
    lightBlobC: "oklch(0.92 0.06 95 / 10%)",
    darkBlobA: "oklch(0.72 0.18 84 /  5%)",
  },
};

// Dark mode neutral blob values (blob-b and blob-c are always achromatic)
const DARK_BLOB_B = "oklch(1 0 0 / 2.0%)";
const DARK_BLOB_C = "oklch(1 0 0 / 1.5%)";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return mode;
}

function applyFullTheme(mode: ThemeMode, accent: AccentColor): void {
  const html = document.documentElement;
  const resolved = resolveMode(mode);
  const tokens = ACCENT_TOKENS[accent];

  // 1. Dark class + data attributes
  html.setAttribute("data-theme", mode);
  html.setAttribute("data-accent", accent);
  if (resolved === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }

  const set = (k: string, v: string) => html.style.setProperty(k, v);

  // 2. Primary / ring — always the accent colour regardless of mode
  set("--primary", tokens.primary);
  set("--primary-foreground", tokens.primaryForeground);
  set("--ring", tokens.ring);
  set("--sidebar-primary", tokens.primary);
  set("--sidebar-ring", tokens.ring);

  // Amber sidebar also needs the dark foreground
  if (accent === "amber") {
    set("--sidebar-primary-foreground", tokens.primaryForeground);
  } else {
    html.style.removeProperty("--sidebar-primary-foreground");
  }

  // 3. Gradient blobs
  //    Light → full-colour blobs from accent
  //    Dark  → blob-a = faint primary tint; blob-b/c = achromatic neutral
  if (resolved === "light") {
    set("--gradient-blob-a", tokens.lightBlobA);
    set("--gradient-blob-b", tokens.lightBlobB);
    set("--gradient-blob-c", tokens.lightBlobC);
  } else {
    set("--gradient-blob-a", tokens.darkBlobA); // whisper of accent
    set("--gradient-blob-b", DARK_BLOB_B);
    set("--gradient-blob-c", DARK_BLOB_C);
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useUser();

  const mode =
    profile?.preferences.appearance.theme ??
    DEFAULT_PREFERENCES.appearance.theme;
  const accent =
    profile?.preferences.appearance.accent ??
    DEFAULT_PREFERENCES.appearance.accent;

  // profileLoaded ensures we re-apply when the real profile replaces the seed,
  // even if mode/accent values happen to match the defaults.
  const profileLoaded = profile !== null;

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
    return resolveMode(mode);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ resolvedTheme, accent }}>
      {children}
    </ThemeContext.Provider>
  );
}
