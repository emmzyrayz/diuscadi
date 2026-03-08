// lib/models/HealthReport.ts
// Real User Monitoring (RUM) data collected from client browsers.
// Posted by the client after page load via POST /api/health/report.

import { ObjectId } from "mongodb";

export interface HealthReportDocument {
  _id?: ObjectId;

  // Who reported (optional — null for public pages)
  userId?: ObjectId; // → UserData._id
  sessionId?: string; // JWT sessionId for cross-referencing

  // Page context
  page: string; // e.g. "/home", "/events/summit-2026"
  referrer?: string;

  // ── Performance timings (all in milliseconds) ─────────────────────────────
  ttfb?: number; // Time to First Byte
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  domContentLoaded?: number; // DOMContentLoaded event
  windowOnLoad?: number; // window.onload event

  // ── Browser + environment ─────────────────────────────────────────────────
  browser: {
    name: string; // "Chrome" | "Firefox" | "Safari" | "Edge" | ...
    version: string; // "132.0.0"
  };
  os: {
    name: string; // "Windows" | "Android" | "iOS" | "macOS" | ...
    version: string;
  };
  device: "mobile" | "tablet" | "desktop";
  screenWidth: number;
  screenHeight: number;
  networkType?: string; // "4g" | "3g" | "wifi" | "unknown"

  // ── Errors ────────────────────────────────────────────────────────────────
  jsErrors: Array<{
    message: string;
    source?: string;
    line?: number;
    col?: number;
  }>;

  // ── Meta ──────────────────────────────────────────────────────────────────
  ip?: string;
  userAgent: string;
  reportedAt: Date;
}
