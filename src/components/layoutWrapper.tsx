// components/LayoutWrapper.tsx
"use client";
import { useNotFound } from "@/context/notFoundContext";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface LayoutConfig {
  showNavbar: boolean;
  showFooter: boolean;
  showAds: boolean;
  containerClass?: string;
}

interface LayoutWrapperProps {
  children: ReactNode;
  navbar?: ReactNode;
  footer?: ReactNode;
  ads?: ReactNode;
}

/**
 * Route Configuration
 * Define which layout components appear on which routes
 */
const routeConfigs: Record<string, LayoutConfig> = {
  // ============================================
  // AUTH ROUTES - No layout components
  // ============================================
  "/auth": {
    showNavbar: false,
    showFooter: false,
    showAds: false,
  },
  "/auth/signin": {
    showNavbar: false,
    showFooter: false,
    showAds: false,
  },
  "/auth/signup": {
    showNavbar: false,
    showFooter: false,
    showAds: false,
  },
  "/login": {
    showNavbar: false,
    showFooter: false,
    showAds: false,
  },
  "/register": {
    showNavbar: false,
    showFooter: false,
    showAds: false,
  },
  "/auth/reset-password": {
    showNavbar: false,
    showFooter: false,
    showAds: false,
  },
  "/auth/forgot-password": {
    showNavbar: false,
    showFooter: false,
    showAds: false,
  },
  "/auth/verify-email": {
    showNavbar: false,
    showFooter: false,
    showAds: false,
  },

  // ============================================
  // DASHBOARD ROUTES - Navbar only, no footer/ads
  // ============================================
  "/dashboard": {
    showNavbar: false,
    showFooter: false,
    showAds: false,
    containerClass: "bg-gray-50",
  },
  "/profile": {
    showNavbar: true,
    showFooter: true,
    showAds: false,
  },
  "/profile/edit": {
    showNavbar: false,
    showFooter: false,
    showAds: false,
  },
  "/settings": {
    showNavbar: true,
    showFooter: false,
    showAds: false,
  },
  "/account": {
    showNavbar: true,
    showFooter: false,
    showAds: false,
  },

  // ============================================
  // CHECKOUT/PAYMENT - Minimal layout
  // ============================================
  "/checkout": {
    showNavbar: true,
    showFooter: false,
    showAds: false,
  },
  "/payment": {
    showNavbar: true,
    showFooter: false,
    showAds: false,
  },

  // ============================================
  // PUBLIC PAGES - Full layout with all components
  // ============================================
  "/": {
    showNavbar: true,
    showFooter: true,
    showAds: true,
  },
  "/services": {
    showNavbar: true,
    showFooter: true,
    showAds: true,
  },
  "/not-found": {
    showNavbar: false,
    showFooter: false,
    showAds: true,
  },
  "/pricing": {
    showNavbar: true,
    showFooter: true,
    showAds: false, // No ads on pricing page
  },
  "/about": {
    showNavbar: true,
    showFooter: true,
    showAds: false,
  },
  "/contact": {
    showNavbar: true,
    showFooter: true,
    showAds: false,
  },
  "/careers": {
    showNavbar: true,
    showFooter: true,
    showAds: false,
  },
  "/docs": {
    showNavbar: true,
    showFooter: true,
    showAds: false,
  },
  "/api": {
    showNavbar: true,
    showFooter: true,
    showAds: false,
  },
  "/blog": {
    showNavbar: true,
    showFooter: true,
    showAds: true,
  },
};

/**
 * Get layout configuration for the current route
 * Uses longest-match-first algorithm for nested routes
 */
const getRouteConfig = (pathname: string): LayoutConfig => {
  // Direct exact match
  if (routeConfigs[pathname]) {
    return routeConfigs[pathname];
  }

  // Sort routes by length (longest first) for best prefix matching
  const sortedRoutes = Object.keys(routeConfigs).sort(
    (a, b) => b.length - a.length,
  );

  // Find first route that matches as prefix
  for (const route of sortedRoutes) {
    if (pathname.startsWith(route) && route !== "/") {
      return routeConfigs[route];
    }
  }

  // Check if root matches
  if (routeConfigs["/"] && pathname === "/") {
    return routeConfigs["/"];
  }

  // Default configuration for unmatched routes
  return {
    showNavbar: true,
    showFooter: true,
    showAds: true,
  };
};

/**
 * Layout Wrapper Component
 * Conditionally renders layout components based on current route
 */
export default function LayoutWrapper({
  children,
  navbar,
  footer,
  ads,
}: LayoutWrapperProps) {
  const pathname = usePathname();
  const { isNotFound } = useNotFound();
  const config = getRouteConfig(pathname);

  // If it's a 404 page, render only the children
  if (isNotFound) {
    return <>{children}</>;
  }

  return (
    <div
      className={`flex flex-col min-h-screen items-center ${config.containerClass || ""}`}
    >
      {/* Navbar */}
      {config.showNavbar && navbar}

      {/* Top Ads (Optional - if you want ads at top) */}
      {/* {config.showAds && ads} */}

      {/* Main Content */}
      <main
        className={clsx("flex-1", "w-full", "flex", "flex-col", "items-center")}
      >
        {children}
      </main>

      {/* Bottom Ads */}
      {config.showAds && ads}

      {/* Footer */}
      {config.showFooter && footer}
    </div>
  );
}

/**
 * Export config getter for use in other components if needed
 */
export { getRouteConfig, type LayoutConfig };
