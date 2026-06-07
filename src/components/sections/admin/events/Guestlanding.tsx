"use client";
// src/components/sections/admin/events/GuestLandingSection.tsx

import React, { useRef, useState, useCallback } from "react";
import {
  LuLink,
  LuCopy,
  LuCheck,
  LuDownload,
  LuQrCode,
  LuGlobe,
  LuLock,
  LuShare2,
  LuFileDown,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { QRCode } from "@/components/ui/QRCode";
import { shareUrl } from "@/lib/shareUtils";
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

  // Ref wrapping the QR card — captured by html2canvas for PNG download
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

  // ── Share (Web Share API → clipboard fallback) ─────────────────────────────
  const handleShare = useCallback(async () => {
    await shareUrl({
      title: `${event.title} — Guest Registration`,
      url: landingUrl,
      text: `Register as a guest for ${event.title} on DIUSCADI`,
    });
  }, [event.title, landingUrl]);

  // ── PNG download ───────────────────────────────────────────────────────────
  // Uses html2canvas (already installed) to capture the QR card div.
  // withLogo={false} on QRCode avoids the missing /images/logo-qr.png fetch.
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

  // ── PDF download via window.print() ──────────────────────────────────────
  // Strategy: inject a <style> into <head> that hides everything except the
  // QR card when printing, then call window.print(). No jsPDF needed.
  const handleDownloadPdf = useCallback(() => {
    const styleId = "guest-landing-print-style";

    // Remove any previous injection
    document.getElementById(styleId)?.remove();

    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      @media print {
        body > * { display: none !important; }
        #guest-qr-print-root { display: flex !important; }
      }
    `;
    document.head.appendChild(style);

    // Create a temporary full-page print container
    const printRoot = document.createElement("div");
    printRoot.id = "guest-qr-print-root";
    printRoot.style.cssText = `
      display: none;
      position: fixed;
      inset: 0;
      background: white;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 24px;
      font-family: 'DM Sans', system-ui, sans-serif;
      z-index: 99999;
    `;

    // Clone the QR card into the print root so it renders at full size
    if (qrCardRef.current) {
      const clone = qrCardRef.current.cloneNode(true) as HTMLElement;
      clone.style.transform = "scale(2)";
      clone.style.transformOrigin = "center center";
      clone.style.margin = "80px auto";
      printRoot.appendChild(clone);
    }

    // Event title + URL below the QR
    const caption = document.createElement("div");
    caption.style.cssText = "text-align:center; margin-top: 120px;";
    caption.innerHTML = `
      <p style="font-size:18px; font-weight:900; color:#0f172a; letter-spacing:-0.02em; margin:0 0 8px;">
        ${event.title}
      </p>
      <p style="font-size:11px; font-weight:700; color:#64748b; font-family:monospace; margin:0;">
        ${landingUrl}
      </p>
      <p style="font-size:9px; font-weight:700; color:#94a3b8; letter-spacing:0.15em; text-transform:uppercase; margin:8px 0 0;">
        Guest Registration · DIUSCADI
      </p>
    `;
    printRoot.appendChild(caption);

    document.body.appendChild(printRoot);

    // Give browser one frame to render, then print
    requestAnimationFrame(() => {
      window.print();

      // Clean up after print dialog closes
      setTimeout(() => {
        printRoot.remove();
        document.getElementById(styleId)?.remove();
      }, 1000);
    });
  }, [event.title, landingUrl]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
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

          {/* Copy */}
          <button
            onClick={handleCopy}
            disabled={!isPublished}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background",
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
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background",
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
          {/* QR card — captured by html2canvas */}
          <div
            ref={qrCardRef}
            className="bg-white rounded-2xl p-5 flex flex-col items-center gap-3 border border-border shrink-0"
            style={{ minWidth: 180 }}
          >
            {/*
              withLogo={false} — avoids fetching /images/logo-qr.png which
              does not exist in /public. QR still scans at level "M" error
              correction without the logo overlay.
            */}
            <QRCode value={landingUrl} size={140} withLogo={false} />

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

          {/* Right side */}
          <div className="flex-1 space-y-4 w-full">
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

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {/* PNG */}
              <button
                onClick={handleDownloadPng}
                disabled={!isPublished || downloadingPng}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl",
                  "text-[9px] font-black uppercase tracking-widest",
                  "hover:bg-primary transition-all active:scale-95 cursor-pointer",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                )}
              >
                <LuDownload className="w-3.5 h-3.5" />
                {downloadingPng ? "Exporting…" : "PNG"}
              </button>

              {/* PDF via print */}
              <button
                onClick={handleDownloadPdf}
                disabled={!isPublished}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 border-2 border-border bg-background text-foreground rounded-xl",
                  "text-[9px] font-black uppercase tracking-widest",
                  "hover:bg-muted transition-all active:scale-95 cursor-pointer",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                )}
              >
                <LuFileDown className="w-3.5 h-3.5" />
                PDF
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                disabled={!isPublished}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 border-2 border-border bg-background text-foreground rounded-xl",
                  "text-[9px] font-black uppercase tracking-widest",
                  "hover:bg-muted transition-all active:scale-95 cursor-pointer",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                )}
              >
                <LuShare2 className="w-3.5 h-3.5" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
