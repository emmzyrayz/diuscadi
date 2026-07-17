import { AccountRole } from "@/types/domain";

export type UserRole = AccountRole

interface RouteConfig {
  path: string;
  authRequired: boolean;
  roles?: UserRole[];
  redirect?: string;
}

export const ROUTE_MANIFEST: RouteConfig[] = [
  { path: "/admin", authRequired: true, roles: ["admin", "webmaster", "moderator"] },
  { path: "/profile", authRequired: true },
  { path: "/settings", authRequired: true },
  { path: "/tickets", authRequired: true },
  { path: "/home", authRequired: true },
  { path: "/events", authRequired: true },
  { path: "/leaderboard", authRequired: true },
  { path: "/users", authRequired: true },
  { path: "/auth", authRequired: false, redirect: "/home" }, // Redirect if already logged in
];
