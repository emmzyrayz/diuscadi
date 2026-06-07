"use client";
// src/components/sections/admin/events/GuestLandingSection.tsx
//
// Displays the guest landing page URL + QR code for an event inside
// AEViewModal. Allows the admin to copy the URL, download the QR as PNG,
// and download a one-page PDF share sheet — all client-side, nothing stored.

import React, { useRef, useState, useCallback } from "react";
import {
  LuLink,
  LuCopy,
  LuCheck,
  LuDownload,
  LuQrCode,
  LuGlobe,
  LuLock,
  LuFileDown,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { QRCode } from "@/components/ui/QRCode";
import type { AdminEvent } from "@/context/AdminContext";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface GuestLandingSectionProps {
  event: AdminEvent;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildLandingUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://diuscadi.org.ng";
  return `${base}/event-landing/${slug}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function GuestLandingSection({ event }: GuestLandingSectionProps) {
  const isPublished = event.status === "published";
  const landingUrl = buildLandingUrl(event.slug);

  const [copied, setCopied] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Ref wrapping the QR card — captured by html2canvas for downloads
  const qrCardRef = useRef<HTMLDivElement>(null);

  // ── Copy URL ───────────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(landingUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [landingUrl]);

  // ── PNG download ───────────────────────────────────────────────────────────
  const handleDownloadPng = useCallback(async () => {
    if (!qrCardRef.current) return;
    setDownloadingPng(true);
    const toastId = toast.loading("Preparing PNG…");

    try {
      const { default: html2canvas } = await import("html2canvas");

      const canvas = await html2canvas(qrCardRef.current, {
        backgroundColor: "#ffffff",
        scale: 3, // 3× for print-quality output
        useCORS: true,
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Export failed", { id: toastId });
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `guest-qr-${event.slug}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("PNG downloaded", { id: toastId });
      }, "image/png");
    } catch {
      toast.error("Export failed", { id: toastId });
    } finally {
      setDownloadingPng(false);
    }
  }, [event.slug]);

  // ── PDF download ───────────────────────────────────────────────────────────
  // Strategy: html2canvas → canvas → jsPDF single A4 page centred
  const handleDownloadPdf = useCallback(async () => {
    if (!qrCardRef.current) return;
    setDownloadingPdf(true);
    const toastId = toast.loading("Preparing PDF…");

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(qrCardRef.current, {
        backgroundColor: "#ffffff",
        scale: 3,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");

      // A4 in mm: 210 × 297
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // Scale the card image to fit within A4 with 20 mm margins
      const margin = 20;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;

      const imgW = canvas.width / 3; // px → mm @ 96dpi≈3.78 px/mm; close enough for centering
      const imgH = canvas.height / 3;
      const ratio = Math.min(maxW / imgW, maxH / imgH);

      const finalW = imgW * ratio;
      const finalH = imgH * ratio;
      const x = (pageW - finalW) / 2;
      const y = (pageH - finalH) / 2;

      pdf.addImage(imgData, "PNG", x, y, finalW, finalH);
      pdf.save(`guest-landing-${event.slug}.pdf`);

      toast.success("PDF downloaded", { id: toastId });
    } catch {
      toast.error("PDF export failed", { id: toastId });
    } finally {
      setDownloadingPdf(false);
    }
  }, [event.slug]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render — disabled state when not published
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Section label */}
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
        <LuQrCode className="w-3.5 h-3.5" />
        Guest Landing Page
      </p>

      {/* Not-published callout */}
      {!isPublished && (
        <div className="flex items-start gap-3 bg-muted rounded-2xl px-4 py-3">
          <LuLock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
            The guest landing page is only active when the event is{" "}
            <span className="font-black text-foreground">published</span>.
            Publish this event to generate a shareable link and QR code.
          </p>
        </div>
      )}

      {/* Main card */}
      <div
        className={cn(
          "border-2 border-border rounded-2xl overflow-hidden",
          !isPublished && "opacity-50 pointer-events-none select-none",
        )}
      >
        {/* URL row */}
        <div className="flex items-center gap-3 px-4 py-3 bg-muted border-b border-border">
          <LuGlobe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <p className="text-[10px] font-mono text-foreground flex-1 truncate">
            {landingUrl}
          </p>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            disabled={!isPublished}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5",
              "rounded-xl border border-border bg-background",
              "text-[9px] font-black uppercase tracking-widest",
              "hover:bg-primary hover:text-background hover:border-primary",
              "transition-all active:scale-95 cursor-pointer",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            )}
          >
            {copied ? (
              <>
                <LuCheck className="w-3 h-3" /> Copied
              </>
            ) : (
              <>
                <LuCopy className="w-3 h-3" /> Copy
              </>
            )}
          </button>

          {/* Open in tab */}
          <a
            href={isPublished ? landingUrl : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!isPublished}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5",
              "rounded-xl border border-border bg-background",
              "text-[9px] font-black uppercase tracking-widest",
              "hover:bg-foreground hover:text-background hover:border-foreground",
              "transition-all active:scale-95 cursor-pointer",
              !isPublished && "opacity-40 pointer-events-none",
            )}
          >
            <LuLink className="w-3 h-3" /> Open
          </a>
        </div>

        {/* QR + actions */}
        <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
          {/* QR card — this div is what html2canvas captures */}
          <div
            ref={qrCardRef}
            className="bg-white rounded-2xl p-5 flex flex-col items-center gap-3 border border-border shrink-0"
            style={{ minWidth: 180 }}
          >
            <QRCode value={landingUrl} size={140} withLogo={true} />

            {/* Caption inside the captured card */}
            <div className="text-center space-y-0.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                Guest Registration
              </p>
              <p
                className="text-[8px] font-mono text-gray-500 truncate max-w-[160px]"
                title={landingUrl}
              >
                {landingUrl.replace(/^https?:\/\//, "")}
              </p>
            </div>
          </div>

          {/* Right side — event meta + download buttons */}
          <div className="flex-1 space-y-4 w-full">
            {/* Event info pills */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 bg-muted rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  {event.format}
                </span>
                <span className="px-2.5 py-1 bg-muted rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  {event.targetEduStatus}
                </span>
                <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest">
                  {event.registered}/{event.capacity} registered
                </span>
              </div>

              <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
                Scan or share this QR code to let guests register without a
                platform account.
              </p>
            </div>

            {/* Download buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownloadPng}
                disabled={!isPublished || downloadingPng}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5",
                  "bg-foreground text-background rounded-xl",
                  "text-[9px] font-black uppercase tracking-widest",
                  "hover:bg-primary transition-all active:scale-95 cursor-pointer",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                )}
              >
                <LuDownload className="w-3.5 h-3.5" />
                {downloadingPng ? "Exporting…" : "PNG"}
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={!isPublished || downloadingPdf}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5",
                  "border-2 border-border bg-background text-foreground rounded-xl",
                  "text-[9px] font-black uppercase tracking-widest",
                  "hover:bg-muted transition-all active:scale-95 cursor-pointer",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                )}
              >
                <LuFileDown className="w-3.5 h-3.5" />
                {downloadingPdf ? "Exporting…" : "PDF"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
