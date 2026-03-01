export type UserRole = "STUDENT" | "FACULTY" | "ADMIN" | "WEBMASTER";

interface RouteConfig {
  path: string;
  authRequired: boolean;
  roles?: UserRole[];
  redirect?: string;
}

export const ROUTE_MANIFEST: RouteConfig[] = [
  { path: "/admin", authRequired: true, roles: ["ADMIN", "WEBMASTER"] },
  { path: "/profile", authRequired: true },
  { path: "/settings", authRequired: true },
  { path: "/tickets", authRequired: true },
  { path: "/auth", authRequired: false, redirect: "/admin/analytics" }, // Redirect if already logged in
];
