import { AuthProvider } from "@/context/AuthContext";
import { PlatformProvider } from "@/context/PlatformContext";
import { UserProvider } from "@/context/UserContext";
import { EventProvider } from "@/context/EventContext";
import { TicketProvider } from "@/context/TicketContext";
import { NotFoundProvider } from "@/context/notFoundContext";
import { HealthProvider } from "@/context/HealthContext";
import { AuthenticatedProviders } from "./AuthenticatedProviders";
import { ProviderConfig } from "./types";

/**
 * Provider Registry
 * Order matters — providers are composed top to bottom.
 * Earlier providers wrap later ones.
 *
 * Dependency order:
 *   AuthProvider
 *     └─ PlatformProvider        (public data, no auth needed)
 *         └─ UserProvider        (seeds from AuthContext on login)
 *             └─ EventProvider
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
