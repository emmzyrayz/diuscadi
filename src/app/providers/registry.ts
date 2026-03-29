import { AuthProvider } from "@/context/AuthContext";
import { PlatformProvider } from "@/context/PlatformContext";
import { UserProvider } from "@/context/UserContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { MediaProvider } from "@/context/MediaContext";
import { EventProvider } from "@/context/EventContext";
import { TicketProvider } from "@/context/TicketContext";
import { NotFoundProvider } from "@/context/notFoundContext";
import { HealthProvider } from "@/context/HealthContext";
import { AuthenticatedProviders } from "./AuthenticatedProviders";
import { ProviderConfig } from "./types";
import { DocProvider } from "@/context/DocContext";
import { DebugProvider } from "@/context/DebugContext";

/**
 * Provider Registry
 * Order matters — providers are composed top to bottom.
 * Earlier providers wrap later ones.
 *
 * Dependency order:
 *   AuthProvider
 *     └─ PlatformProvider        (public data, no auth needed)
 *         └─ UserProvider        (seeds from AuthContext on login)
 *             └─ ThemeProvider   (reads profile.preferences → writes to <html>)
 *                 └─ MediaProvider  (Cloudinary upload pipeline)
 *                     └─ EventProvider
 *                 └─ TicketProvider
 *                     └─ AuthenticatedProviders  (wraps ApplicationProvider + AdminProvider — need token)
 *                         └─ HealthProvider      (auto-reports on every navigation + webmaster dashboard)
 *                             └─ NotFoundProvider
 */
export const providerRegistry: ProviderConfig[] = [
  {
    id: "auth",
    provider: { component: AuthProvider },
    enabled: true,
  },
  {
    id: "debug",
    provider: { component: DebugProvider },
    enabled: true,
  },
  {
    id: "platform",
    provider: { component: PlatformProvider },
    enabled: true,
  },
  {
    id: "user",
    provider: { component: UserProvider },
    enabled: true,
  },
  {
    id: "theme",
    provider: { component: ThemeProvider },
    enabled: true,
    // Must be inside UserProvider so it can read profile.preferences.
    // Must wrap everything else so dark/accent applies to all children.
  },
  {
    id: "media",
    provider: { component: MediaProvider },
    enabled: true,
    // Inside ThemeProvider — uploads can trigger toasts that respect theme.
    // Inside UserProvider — uploadImage uses the auth token from localStorage.
  },
  {
    id: "doc",
    provider: { component: DocProvider },
    enabled: true,
    // Sibling of MediaProvider — both are upload pipelines under ThemeProvider.
    // Order doesn't matter relative to MediaProvider.
  },
  {
    id: "event",
    provider: { component: EventProvider },
    enabled: true,
  },
  {
    id: "ticket",
    provider: { component: TicketProvider },
    enabled: true,
  },
  {
    id: "authenticated",
    provider: { component: AuthenticatedProviders },
    enabled: true,
  },
  {
    id: "health",
    provider: { component: HealthProvider },
    enabled: true,
  },
  {
    id: "notFound",
    provider: { component: NotFoundProvider },
    enabled: true,
  },
];

export function getEnabledProviders(): ProviderConfig[] {
  return providerRegistry.filter((config) => config.enabled !== false);
}

export function getProviderById(id: string): ProviderConfig | undefined {
  return providerRegistry.find((config) => config.id === id);
}

export function isProviderEnabled(id: string): boolean {
  const provider = getProviderById(id);
  return provider?.enabled !== false;
}
