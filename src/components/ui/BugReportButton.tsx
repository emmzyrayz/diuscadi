"use client";
// components/ui/BugReportButton.tsx
//
// Floating bug report button — only visible when:
//   1. debugMode is true in platform config
//   2. Current user is in debugTargets (resolved server-side as isDebugTarget)
//
// When clicked:
//   - Intercepts console for debugDuration ms (default 7000)
//   - Captures fetch/XHR network calls during that window
//   - Takes a full-page screenshot via html2canvas
//   - Posts everything to POST /api/health/report
//
// Install: npm install html2canvas
// TODO: npm install html2canvas

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuBug, LuLoader, LuCircleCheck, LuX } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface Props {
  isDebugTarget: boolean; // resolved from GET /api/platform/config
}

type Phase = "idle" | "capturing" | "uploading" | "done" | "error";

const DEBUG_DURATION_MS = 7000; // 7 seconds of capture

export const BugReportButton: React.FC<Props> = ({ isDebugTarget }) => {
  const { token } = useAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  // Console interceptor — captures last 50 log entries
  const consoleLogRef = useRef<string[]>([]);
  const networkLogRef = useRef<
    { url: string; method: string; status: number | null; ms: number }[]
  >([]);
  const cleanupRef = useRef<(() => void) | null>(null);

  const startCapture = useCallback(() => {
    const logs: string[] = [];
    const net: typeof networkLogRef.current = [];

    // ── Intercept console ────────────────────────────────────────────────────
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;

    const intercept =
      (level: string) =>
      (...args: unknown[]) => {
        const line = `[${level}] ${args
          .map((a) => {
            try {
              return typeof a === "object" ? JSON.stringify(a) : String(a);
            } catch {
              return String(a);
            }
          })
          .join(" ")}`;
        logs.push(line);
        if (logs.length > 50) logs.shift();
      };

    console.log = intercept("LOG");
    console.warn = intercept("WARN");
    console.error = intercept("ERR");

    // ── Intercept fetch ───────────────────────────────────────────────────────
    const origFetch = window.fetch;
    window.fetch = async (input, init) => {
      const start = Date.now();
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : (input as Request).url;
      const method = (init?.method ?? "GET").toUpperCase();
      try {
        const res = await origFetch(input, init);
        net.push({ url, method, status: res.status, ms: Date.now() - start });
        return res;
      } catch (err) {
        net.push({ url, method, status: null, ms: Date.now() - start });
        throw err;
      }
    };

    // ── Cleanup restores originals ────────────────────────────────────────────
    cleanupRef.current = () => {
      console.log = origLog;
      console.warn = origWarn;
      console.error = origError;
      window.fetch = origFetch;
    };

    consoleLogRef.current = logs;
    networkLogRef.current = net;
  }, []);

  const stopCapture = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  const handleReport = useCallback(async () => {
    if (phase !== "idle") return;
    setPhase("capturing");
    setMessage(`Capturing for ${DEBUG_DURATION_MS / 1000}s…`);

    startCapture();

    // Wait for debug window
    await new Promise((r) => setTimeout(r, DEBUG_DURATION_MS));
    stopCapture();

    setPhase("uploading");
    setMessage("Sending report…");

    try {
      // ── Screenshot ────────────────────────────────────────────────────────
      let screenshot: string | undefined;
      try {
        // Dynamic import so build doesn't break if html2canvas isn't installed yet
        const html2canvas = (
          (await import("html2canvas" as never)) as never as {
            default: (
              el: HTMLElement,
              opts?: unknown,
            ) => Promise<HTMLCanvasElement>;
          }
        ).default;
        const canvas = await html2canvas(document.body, {
          useCORS: true,
          allowTaint: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: document.documentElement.scrollWidth,
          windowHeight: document.documentElement.scrollHeight,
          scale: 0.5, // half resolution to keep payload manageable
        });
        screenshot = canvas.toDataURL("image/png");
      } catch {
        // html2canvas not installed or failed — continue without screenshot
      }

      // ── Browser + performance info ────────────────────────────────────────
      const nav = navigator as Navigator & {
        connection?: { effectiveType?: string };
      };
      const perf = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;

      const payload = {
        page: window.location.pathname,
        referrer: document.referrer || undefined,
        ttfb: perf
          ? Math.round(perf.responseStart - perf.requestStart)
          : undefined,
        fcp: performance.getEntriesByName("first-contentful-paint")[0]
          ?.startTime
          ? Math.round(
              performance.getEntriesByName("first-contentful-paint")[0]
                .startTime,
            )
          : undefined,
        browser: { name: getBrowserName(), version: getBrowserVersion() },
        os: { name: getOsName(), version: "" },
        device: getDevice(),
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        networkType: nav.connection?.effectiveType ?? "unknown",
        jsErrors: [], // window.onerror captures in useHealthReporter
        userAgent: navigator.userAgent,
        // Debug-specific
        triggeredByUser: true,
        screenshot,
        consoleLog: consoleLogRef.current.slice(-50),
        networkLog: networkLogRef.current.slice(-30),
        debugDuration: DEBUG_DURATION_MS,
      };

      const res = await fetch("/api/health/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Upload failed");

      setPhase("done");
      setMessage("Report sent — thank you!");
      setTimeout(() => {
        setPhase("idle");
        setMessage("");
      }, 4000);
    } catch {
      setPhase("error");
      setMessage("Failed to send report");
      setTimeout(() => {
        setPhase("idle");
        setMessage("");
      }, 4000);
    }
  }, [phase, token, startCapture, stopCapture]);

  if (!isDebugTarget) return null;

  const PHASE_CONFIG = {
    idle: { bg: "bg-foreground", Icon: LuBug, label: "Report Bug" },
    capturing: { bg: "bg-amber-500", Icon: LuLoader, label: "Capturing…" },
    uploading: { bg: "bg-blue-500", Icon: LuLoader, label: "Uploading…" },
    done: { bg: "bg-emerald-500", Icon: LuCircleCheck, label: "Sent!" },
    error: { bg: "bg-rose-500", Icon: LuBug, label: "Failed — Retry" },
  };

  const cfg = PHASE_CONFIG[phase];
  const Icon = cfg.Icon;

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-2">
      {/* Info tooltip */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="bg-foreground text-background rounded-2xl p-4 max-w-[220px] shadow-2xl"
          >
            <p className="text-[10px] font-black uppercase tracking-widest mb-1">
              Debug Mode Active
            </p>
            <p className="text-[9px] font-medium opacity-70 leading-relaxed">
              Clicking &quot;Report Bug&quot; captures a screenshot and{" "}
              {DEBUG_DURATION_MS / 1000}s of console + network logs, then sends
              them to the admin dashboard.
            </p>
            <button
              onClick={() => setShowInfo(false)}
              className="mt-2 text-[9px] font-black uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
            >
              Got it
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-foreground text-background rounded-2xl px-4 py-2"
          >
            <p className="text-[10px] font-black uppercase tracking-widest">
              {message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main button */}
      <div className="flex items-center gap-2">
        {/* Info toggle */}
        <button
          onClick={() => setShowInfo((v) => !v)}
          className={cn(
            "w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
          )}
        >
          {showInfo ? (
            <LuX className="w-3.5 h-3.5" />
          ) : (
            <span className="text-[10px] font-black">?</span>
          )}
        </button>

        {/* Report button */}
        <motion.button
          onClick={handleReport}
          disabled={phase !== "idle" && phase !== "error"}
          whileHover={phase === "idle" ? { scale: 1.05 } : {}}
          whileTap={phase === "idle" ? { scale: 0.95 } : {}}
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-2xl text-background font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all cursor-pointer disabled:cursor-not-allowed",
            cfg.bg,
          )}
        >
          <Icon
            className={cn(
              "w-4 h-4",
              (phase === "capturing" || phase === "uploading") &&
                "animate-spin",
            )}
          />
          {cfg.label}
        </motion.button>
      </div>
    </div>
  );
};

// ── Browser/OS detection helpers ─────────────────────────────────────────────

function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
  return "Unknown";
}

function getBrowserVersion(): string {
  const ua = navigator.userAgent;
  const map = [
    { key: "Edg/", name: "Edg/" },
    { key: "Chrome/", name: "Chrome/" },
    { key: "Firefox/", name: "Firefox/" },
    { key: "Version/", name: "Version/" },
  ];
  for (const { key, name } of map) {
    if (ua.includes(key)) {
      const idx = ua.indexOf(name) + name.length;
      return ua.slice(idx).split(/[\s;]/)[0] ?? "";
    }
  }
  return "";
}

function getOsName(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  if (ua.includes("Mac OS X")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  return "Unknown";
}

function getDevice(): "mobile" | "tablet" | "desktop" {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}
