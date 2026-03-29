// lib/models/HealthReport.ts — extended with debug report fields
// Add these fields to the existing HealthReportDocument interface:

// ── Debug report (user-triggered via BugReportButton) ────────────────────────
// triggeredByUser?: boolean;   // true = user clicked the bug report button
// screenshot?:      string;    // base64 PNG or Cloudinary URL
// consoleLog?:      string[];  // last 50 intercepted console messages
// debugDuration?:   number;    // ms of monitoring window (5000–10000)
// networkLog?:      Array<{    // fetch/XHR calls captured during debug window
//   url:    string;
//   method: string;
//   status: number | null;
//   ms:     number;
// }>;

// Full updated interface — paste over existing:

import { ObjectId } from "mongodb";

export interface HealthReportDocument {
  _id?: ObjectId;
  userId?: ObjectId;
  sessionId?: string;

  page: string;
  referrer?: string;

  ttfb?: number;
  fcp?: number;
  lcp?: number;
  domContentLoaded?: number;
  windowOnLoad?: number;

  browser: { name: string; version: string };
  os: { name: string; version: string };
  device: "mobile" | "tablet" | "desktop";
  screenWidth: number;
  screenHeight: number;
  networkType?: string;

  jsErrors: Array<{
    message: string;
    source?: string;
    line?: number;
    col?: number;
  }>;

  // ── Debug-mode fields (only present when triggeredByUser: true) ───────────
  triggeredByUser?: boolean;
  screenshot?: string; // Cloudinary URL after upload, or base64 fallback
  consoleLog?: string[]; // last N console.log/warn/error messages
  networkLog?: Array<{
    url: string;
    method: string;
    status: number | null;
    ms: number;
  }>;
  debugDuration?: number; // how long the debug window ran in ms

  ip?: string;
  userAgent: string;
  reportedAt: Date;
}
