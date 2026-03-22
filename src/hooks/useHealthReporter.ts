// hooks/useHealthReporter.ts
// Fires once per navigation, collects RUM metrics, and silently POSTs
// to /api/health/report. Skips silently if no auth token is present
// (avoids 401 during initial page load before auth hydrates).

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function getBrowserInfo(): { name: string; version: string } {
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua))
    return { name: "Edge", version: ua.match(/Edg\/([\d.]+)/)?.[1] ?? "" };
  if (/OPR\//i.test(ua))
    return { name: "Opera", version: ua.match(/OPR\/([\d.]+)/)?.[1] ?? "" };
  if (/Chrome\//i.test(ua))
    return { name: "Chrome", version: ua.match(/Chrome\/([\d.]+)/)?.[1] ?? "" };
  if (/Firefox\//i.test(ua))
    return {
      name: "Firefox",
      version: ua.match(/Firefox\/([\d.]+)/)?.[1] ?? "",
    };
  if (/Safari\//i.test(ua))
    return {
      name: "Safari",
      version: ua.match(/Version\/([\d.]+)/)?.[1] ?? "",
    };
  return { name: "Unknown", version: "" };
}

function getOsInfo(): { name: string; version: string } {
  const ua = navigator.userAgent;
  if (/Windows NT ([\d.]+)/i.test(ua))
    return {
      name: "Windows",
      version: ua.match(/Windows NT ([\d.]+)/i)?.[1] ?? "",
    };
  if (/Android ([\d.]+)/i.test(ua))
    return {
      name: "Android",
      version: ua.match(/Android ([\d.]+)/i)?.[1] ?? "",
    };
  if (/iPhone OS ([\d_]+)/i.test(ua))
    return {
      name: "iOS",
      version: ua.match(/iPhone OS ([\d_]+)/i)?.[1]?.replace(/_/g, ".") ?? "",
    };
  if (/iPad.*OS ([\d_]+)/i.test(ua))
    return {
      name: "iOS",
      version: ua.match(/OS ([\d_]+)/i)?.[1]?.replace(/_/g, ".") ?? "",
    };
  if (/Mac OS X ([\d_.]+)/i.test(ua))
    return {
      name: "macOS",
      version: ua.match(/Mac OS X ([\d_.]+)/i)?.[1]?.replace(/_/g, ".") ?? "",
    };
  if (/Linux/i.test(ua)) return { name: "Linux", version: "" };
  return { name: "Unknown", version: "" };
}

function getDevice(): "mobile" | "tablet" | "desktop" {
  const ua = navigator.userAgent;
  if (/Mobi|Android.*Mobile|iPhone/i.test(ua)) return "mobile";
  if (/Tablet|iPad|Android(?!.*Mobile)/i.test(ua)) return "tablet";
  return "desktop";
}

interface NetworkInformation {
  effectiveType?: string;
  type?: string;
}
interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

function getNetworkType(): string {
  const nav = navigator as NavigatorWithConnection;
  const conn = nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
  if (!conn) return "unknown";
  return conn.effectiveType ?? conn.type ?? "unknown";
}

export function useHealthReporter() {
  const pathname = usePathname();

  useEffect(() => {
    const jsErrors: Array<{
      message: string;
      source?: string;
      line?: number;
      col?: number;
    }> = [];

    const onError = (e: ErrorEvent) => {
      jsErrors.push({
        message: e.message?.slice(0, 500) ?? "Unknown error",
        source: e.filename?.slice(0, 200),
        line: e.lineno,
        col: e.colno,
      });
    };

    const onUnhandledRejection = (e: PromiseRejectionEvent) => {
      jsErrors.push({
        message: String(
          e.reason?.message ?? e.reason ?? "Unhandled promise rejection",
        ).slice(0, 500),
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    const send = () => {
      // ── Guard: skip entirely if not authenticated ──────────────────────────
      // Reading here (not at hook call time) because localStorage hydrates
      // asynchronously after the initial render. If no token exists yet,
      // silently bail — the next navigation will catch it once auth settles.
      const token =
        typeof window !== "undefined"
          ? (localStorage.getItem("diuscadi_token") ?? "")
          : "";

      if (!token) {
        // Not authenticated yet — skip this report silently
        window.removeEventListener("error", onError);
        window.removeEventListener("unhandledrejection", onUnhandledRejection);
        return;
      }

      const nav = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;

      const payload: Record<string, unknown> = {
        page: pathname,
        referrer: document.referrer || undefined,
        domContentLoaded: nav
          ? Math.round(nav.domContentLoadedEventEnd)
          : undefined,
        windowOnLoad: nav ? Math.round(nav.loadEventEnd) : undefined,
        ttfb: nav ? Math.round(nav.responseStart) : undefined,
        browser: getBrowserInfo(),
        os: getOsInfo(),
        device: getDevice(),
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        networkType: getNetworkType(),
        jsErrors,
      };

      // FCP
      const paintEntries = performance.getEntriesByType("paint");
      const fcp = paintEntries.find((e) => e.name === "first-contentful-paint");
      if (fcp) payload.fcp = Math.round(fcp.startTime);

      const doSend = (extraPayload: Record<string, unknown> = {}) => {
        fetch("/api/health/report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...payload, ...extraPayload }),
          keepalive: true,
        }).catch(() => {
          /* silently ignore — never break the UI */
        });

        window.removeEventListener("error", onError);
        window.removeEventListener("unhandledrejection", onUnhandledRejection);
      };

      // LCP via PerformanceObserver — give it 1s then send
      try {
        let lcpValue: number | undefined;
        const lcpObs = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            lcpValue = Math.round(entries[entries.length - 1].startTime);
          }
        });
        lcpObs.observe({ type: "largest-contentful-paint", buffered: true });
        setTimeout(() => {
          lcpObs.disconnect();
          doSend(lcpValue !== undefined ? { lcp: lcpValue } : {});
        }, 1000);
      } catch {
        // Browser doesn't support PerformanceObserver — send without LCP
        doSend();
      }
    };

    if (document.readyState === "complete") {
      setTimeout(send, 100);
    } else {
      window.addEventListener("load", send, { once: true });
    }

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [pathname]);
}