// hooks/useAdminExport.ts
//
// Generic CSV export hook for admin pages.
// Hits any admin route with ?export=csv (plus optional extra params),
// receives the blob, and triggers a browser download.
//
// Usage:
//   const { exporting, triggerExport } = useAdminExport({
//     route: "/api/admin/tickets",
//     filenamePrefix: "diuscadi-tickets",
//   });
//
//   // In component:
//   <button onClick={() => triggerExport({ search, status })} disabled={exporting}>
//     Export CSV
//   </button>

import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

interface UseAdminExportOptions {
  /** The API route to call, e.g. "/api/admin/tickets" */
  route: string;
  /**
   * Prefix for the downloaded filename.
   * Final filename: `{prefix}-YYYY-MM-DD.csv`
   * Defaults to the server's Content-Disposition filename if provided.
   */
  filenamePrefix?: string;
  /** Toast message shown while the export is in progress */
  loadingMessage?: string;
  /** Toast message shown on success */
  successMessage?: string;
}

interface TriggerExportParams {
  /** Additional query params to include alongside ?export=csv */
  [key: string]: string | number | boolean | undefined | null;
}

interface UseAdminExportReturn {
  exporting: boolean;
  triggerExport: (params?: TriggerExportParams) => Promise<void>;
}

export function useAdminExport({
  route,
  filenamePrefix = "diuscadi-export",
  loadingMessage = "Preparing export…",
  successMessage = "Export downloaded",
}: UseAdminExportOptions): UseAdminExportReturn {
  const { token } = useAuth();
  const [exporting, setExporting] = useState(false);

  const triggerExport = useCallback(
    async (params: TriggerExportParams = {}) => {
      if (!token || exporting) return;

      setExporting(true);
      const toastId = toast.loading(loadingMessage);

      try {
        // Build query string — always include export=csv, skip null/undefined values
        const qs = new URLSearchParams({ export: "csv" });
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null && value !== "") {
            qs.set(key, String(value));
          }
        }

        const res = await fetch(`${route}?${qs.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Export failed");
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        // Prefer the server-provided filename from Content-Disposition
        const disposition = res.headers.get("Content-Disposition") ?? "";
        const serverFilename = disposition.match(/filename="?([^"]+)"?/)?.[1];
        const fallbackFilename = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;

        const a = document.createElement("a");
        a.href = url;
        a.download = serverFilename ?? fallbackFilename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Revoke object URL after a short delay to allow the download to initiate
        setTimeout(() => URL.revokeObjectURL(url), 1500);

        toast.success(successMessage, { id: toastId });
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Export failed — please try again",
          { id: toastId },
        );
      } finally {
        setExporting(false);
      }
    },
    [token, route, filenamePrefix, loadingMessage, successMessage, exporting],
  );

  return { exporting, triggerExport };
}
