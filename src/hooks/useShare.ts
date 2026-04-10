// hooks/useShare.ts
// React hook wrapping shareUtils for use in components.
// Tracks loading/copied state so components don't need local state for these.
//
// Usage:
//   const { share, download, addToCalendar, copying, downloading } = useShare();

import { useState, useCallback } from "react";
import {
  shareUrl,
  downloadPdf,
  addToCalendar as _addToCalendar,
  type ShareTarget,
  type PdfTarget,
  type CalendarEvent,
} from "@/lib/shareUtils";
import { useAuth } from "@/context/AuthContext";

export function useShare() {
  const { token } = useAuth();
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const share = useCallback(async (target: ShareTarget): Promise<boolean> => {
    setCopying(true);
    const result = await shareUrl(target);
    setCopying(false);
    return result;
  }, []);

  const download = useCallback(
    async (target: PdfTarget) => {
      setDownloading(true);
      await downloadPdf(target, token ?? undefined);
      setDownloading(false);
    },
    [token],
  );

  const addToCalendar = useCallback((event: CalendarEvent) => {
    _addToCalendar(event);
  }, []);

  return { share, download, addToCalendar, copying, downloading };
}
