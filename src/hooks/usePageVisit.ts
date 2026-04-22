// hooks/usePageVisit.ts
// Fire-and-forget hook. Call once per page mount.
// Sends a visit ping to /api/analytics/visit — used to build
// the hourly distribution dataset for the analytics heatmap.
// The 3hr dedup window is enforced server-side — safe to call on every mount.

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export function usePageVisit() {
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    // Don't track admin pages — they'd skew the distribution
    // since admins visit those pages far more than regular members
    if (pathname?.startsWith("/admin")) return;

    const payload = {
      page: pathname ?? "/",
      userId: user?.id ?? null,
    };

    // Fire and forget — don't await, don't show errors to user
    fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // keepalive ensures the request completes even if user navigates away
      keepalive: true,
    }).catch(() => {
      /* silently ignore */
    });
    // Only re-fire when the page changes — not on every re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}
