"use client";

// context/HealthContext.tsx
// Two responsibilities:
//
// 1. AUTO-REPORTING (all authenticated users)
//    Wraps useHealthReporter so any layout that uses HealthProvider
//    automatically sends RUM data after every page navigation.
//    No manual calls needed from the UI.
//
// 2. HEALTH DASHBOARD (webmaster only)
//    Exposes loadHealthAnalysis() and loadRawReports() for the
//    webmaster dashboard to read aggregated browser/performance data.
//
// Consumed by:
//   - Root authenticated layout → auto-reports on every navigation
//   - Webmaster dashboard       → browser analysis, raw logs

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useHealthReporter } from "@/hooks/useHealthReporter";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BrowserStat {
  browser: string;
  visits: number;
  avgTtfbMs: number | null;
  avgFcpMs: number | null;
  avgLcpMs: number | null;
  avgLoadMs: number | null;
  errorRatePct: number;
  lcpRating: "good" | "needs-improvement" | "poor" | null;
}

export interface BrowserRank {
  rank: number;
  browser: string;
  avgLcpMs: number | null;
  lcpRating: "good" | "needs-improvement" | "poor" | null;
  errorRatePct: number;
  visits: number;
  verdict: string;
}

export interface OsStat {
  os: string;
  visits: number;
  avgLcpMs: number | null;
}

export interface DeviceStat {
  device: string;
  visits: number;
  avgLcpMs: number | null;
}

export interface NetworkStat {
  type: string;
  visits: number;
  avgLcpMs: number | null;
}

export interface PageStat {
  page: string;
  visits: number;
  avgLcpMs?: number;
  errorRatePct?: number;
  errorDocs?: number;
  rating?: "good" | "needs-improvement" | "poor";
}

export interface JsError {
  browser: string;
  message: string;
  count: number;
}

export interface HealthAnalysis {
  period: { days: number; since: string };
  totalReports: number;
  browsers: BrowserStat[];
  browserRanking: BrowserRank[];
  os: OsStat[];
  devices: DeviceStat[];
  network: NetworkStat[];
  slowestPages: PageStat[];
  errorPages: PageStat[];
  topJsErrors: JsError[];
  generatedAt: string;
}

export interface RawReport {
  id: string;
  userId: string | null;
  page: string;
  referrer: string | null;
  ttfb: number | null;
  fcp: number | null;
  lcp: number | null;
  domContentLoaded: number | null;
  windowOnLoad: number | null;
  browser: { name: string; version: string };
  os: { name: string; version: string };
  device: string;
  screen: string;
  networkType: string | null;
  jsErrors: Array<{
    message: string;
    source?: string;
    line?: number;
    col?: number;
  }>;
  ip: string | null;
  reportedAt: string;
}

export interface RawReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface RawReportFilters {
  browser?: string;
  os?: string;
  device?: string;
  page?: string;
  hasErrors?: boolean;
  days?: number;
  pageNum?: number;
  limit?: number;
}

// ── State ─────────────────────────────────────────────────────────────────────

interface HealthState {
  analysis: HealthAnalysis | null;
  rawReports: RawReport[];
  rawPagination: RawReportPagination | null;
  rawFilters: RawReportFilters;
  loadingAnalysis: boolean;
  loadingRaw: boolean;
  error: string | null;
}

interface HealthContextValue extends HealthState {
  // Webmaster dashboard actions
  loadHealthAnalysis: (token: string, days?: number) => Promise<void>;
  loadRawReports: (token: string, filters?: RawReportFilters) => Promise<void>;
  // Reset on logout
  reset: () => void;
  clearError: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const HealthContext = createContext<HealthContextValue | null>(null);

export function useHealth(): HealthContextValue {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error("useHealth must be used within HealthProvider");
  return ctx;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

const INITIAL_STATE: HealthState = {
  analysis: null,
  rawReports: [],
  rawPagination: null,
  rawFilters: { days: 30 },
  loadingAnalysis: false,
  loadingRaw: false,
  error: null,
};

// ── Provider ──────────────────────────────────────────────────────────────────

export function HealthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HealthState>(INITIAL_STATE);

  // ── Auto-reporting ─────────────────────────────────────────────────────────
  // Fires silently on every page navigation for all authenticated users.
  // No state changes — purely a side effect.
  useHealthReporter();

  const clearError = useCallback(
    () => setState((s) => ({ ...s, error: null })),
    [],
  );
  const reset = useCallback(() => setState(INITIAL_STATE), []);

  // ── loadHealthAnalysis ─────────────────────────────────────────────────────
  const loadHealthAnalysis = useCallback(async (token: string, days = 30) => {
    setState((s) => ({ ...s, loadingAnalysis: true, error: null }));
    try {
      const res = await fetch(`/api/admin/health?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await handleResponse<HealthAnalysis>(res);
      setState((s) => ({ ...s, analysis: data, loadingAnalysis: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loadingAnalysis: false,
        error:
          err instanceof Error ? err.message : "Failed to load health analysis",
      }));
    }
  }, []);

  // ── loadRawReports ─────────────────────────────────────────────────────────
  const loadRawReports = useCallback(
    async (token: string, filters: RawReportFilters = {}) => {
      setState((s) => ({
        ...s,
        loadingRaw: true,
        error: null,
        rawFilters: filters,
      }));
      try {
        const params = new URLSearchParams();
        if (filters.browser) params.set("browser", filters.browser);
        if (filters.os) params.set("os", filters.os);
        if (filters.device) params.set("device", filters.device);
        if (filters.page) params.set("page", filters.page);
        if (filters.hasErrors) params.set("hasErrors", "true");
        if (filters.days) params.set("days", String(filters.days));
        if (filters.pageNum) params.set("pageNum", String(filters.pageNum));
        if (filters.limit) params.set("limit", String(filters.limit));

        const res = await fetch(`/api/admin/health/raw?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await handleResponse<{
          reports: RawReport[];
          pagination: RawReportPagination;
          filters: RawReportFilters;
        }>(res);

        setState((s) => ({
          ...s,
          rawReports: data.reports,
          rawPagination: data.pagination,
          rawFilters: data.filters,
          loadingRaw: false,
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          loadingRaw: false,
          error:
            err instanceof Error ? err.message : "Failed to load raw reports",
        }));
      }
    },
    [],
  );

  return (
    <HealthContext.Provider
      value={{
        ...state,
        loadHealthAnalysis,
        loadRawReports,
        reset,
        clearError,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
}