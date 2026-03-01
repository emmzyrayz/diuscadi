"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/context/AuthContext";
import { ROUTE_MANIFEST } from "@/config/protectedRoutes";
import { SessionSplash } from "./sessionSplash";
import { LuConstruction } from "react-icons/lu";
import { useEffect } from "react";

// ─── Role → post-login destination ───────────────────────────────────────────
const ROLE_HOME: Record<User["role"], string> = {
  STUDENT: "/dashboard",
  FACULTY: "/dashboard",
  ADMIN: "/admin/analytics",
  WEBMASTER: "/admin/system",
};

// Routes the guard redirects to — never block these or you get a loop
const GUARD_SYSTEM_ROUTES = ["/auth", "/unauthorized"];

// ─── Component ────────────────────────────────────────────────────────────────
export const RouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, sessionStatus } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    // Development: all routes unlocked
    if (isDev) return;

    // Session still resolving — don't make any routing decisions yet
    if (sessionStatus === "pending") return;

    const isSystemRoute = GUARD_SYSTEM_ROUTES.some((r) =>
      pathname.startsWith(r),
    );

    // 1. Authenticated user on any /auth page → send to their home
    if (isAuthenticated && pathname.startsWith("/auth")) {
      router.replace(user ? ROLE_HOME[user.role] : "/dashboard");
      return;
    }

    if (isSystemRoute) return;

    // 2. Match manifest
    const routeRule = ROUTE_MANIFEST.find((route) =>
      pathname.startsWith(route.path),
    );

    if (!routeRule) return; // public route

    // 3. Auth required but not logged in
    if (routeRule.authRequired && !isAuthenticated) {
      router.replace("/auth");
      return;
    }

    // 4. Role-restricted
    if (routeRule.roles && routeRule.roles.length > 0 && user) {
      if (!routeRule.roles.includes(user.role)) {
        router.replace("/unauthorized");
      }
    }
  }, [pathname, isAuthenticated, sessionStatus, user, router, isDev]);

  return (
    <>
      {/* Session splash covers the app until the initial check resolves.
          AnimatePresence inside SessionSplash fades it out smoothly. */}
      {!isDev && <SessionSplash sessionStatus={sessionStatus} />}

      {children}

      {/* Dev-only badge */}
      {isDev && (
        <div
          className="fixed bottom-4 right-4 bg-amber-400 text-slate-900 px-4 py-2 rounded-full flex items-center gap-2 shadow-xl border-2 border-slate-900/20"
          style={{ zIndex: 9999 }}
        >
          <LuConstruction className="w-4 h-4 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Dev · Auth Bypassed
          </span>
        </div>
      )}
    </>
  );
};
