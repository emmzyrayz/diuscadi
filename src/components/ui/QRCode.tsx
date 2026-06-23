"use client";
// components/ui/QRCode.tsx
//
// Upgraded wrapper around qr-code-styling for client-side usage.
// Server-side pages (verify/ticket/[code]/page.tsx) continue using
// qrcode.react's QRCodeSVG directly — do NOT use this wrapper there.
//
// Usage (backwards-compatible):
//   <QRCode value="https://diuscadi.org.ng/verify/ticket/ABC123" size={128} />
//   <QRCode value={url} size={200} withLogo dotStyle="rounded" fgColor="#1e3a5f" />

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type DotStyle =
  | "square"
  | "dots"
  | "rounded"
  | "extra-rounded"
  | "classy"
  | "classy-rounded";

type CornerSquareStyle = "square" | "extra-rounded" | "dot";
type CornerDotStyle = "square" | "dot";
type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

interface LogoOptions {
  /** Path to logo image — must be in /public and same-origin */
  src: string;
  /** Logo width in px — defaults to size * 0.2 */
  width?: number;
  /** Logo height in px — defaults to size * 0.2 */
  height?: number;
  /** Clear dots behind logo for readability — default true */
  excavate?: boolean;
  /** Margin around logo in px — default 4 */
  margin?: number;
}

export interface QRCodeProps {
  /** The URL or string the QR code encodes */
  value: string;
  /** Size in px — both width and height. Default 128 */
  size?: number;
  /** Optional wrapper className */
  className?: string;

  // ── Visual customization ──────────────────────────────────────────────────

  /** Foreground (dot) color. Default #0f172a (slate-950) */
  fgColor?: string;
  /** Background color. Default #ffffff */
  bgColor?: string;
  /** Shape of the data dots. Default "square" */
  dotStyle?: DotStyle;
  /** Shape of the three corner squares. Default "square" */
  cornerSquareStyle?: CornerSquareStyle;
  /** Shape of the inner corner dots. Default "square" */
  cornerDotStyle?: CornerDotStyle;
  /** Error correction level. Auto-upgrades to "H" when logo is shown. Default "M" */
  errorCorrectionLevel?: ErrorCorrectionLevel;

  // ── Logo ──────────────────────────────────────────────────────────────────

  /**
   * Show a logo in the center.
   * - true → uses /logo-mark.png at 20% of size (backwards-compat with withLogo)
   * - LogoOptions → full control
   */
  withLogo?: boolean | LogoOptions;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QRCode({
  value,
  size = 128,
  className,
  fgColor = "#0f172a",
  bgColor = "#ffffff",
  dotStyle = "square",
  cornerSquareStyle = "square",
  cornerDotStyle = "square",
  errorCorrectionLevel = "M",
  withLogo = false,
}: QRCodeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Resolve logo options
  const logoOpts: LogoOptions | null = (() => {
    if (!withLogo) return null;
    if (withLogo === true) {
      return {
        src: "/logo-mark.webp",
        width: Math.round(size * 0.2),
        height: Math.round(size * 0.2),
        excavate: true,
        margin: 4,
      };
    }
    return {
      width: Math.round(size * 0.2),
      height: Math.round(size * 0.2),
      excavate: true,
      margin: 4,
      ...withLogo,
    };
  })();

  // Auto-upgrade error correction when a logo is present
  const resolvedLevel: ErrorCorrectionLevel =
    logoOpts && errorCorrectionLevel === "M" ? "H" : errorCorrectionLevel;

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    import("qr-code-styling").then(({ default: QrCodeStyling }) => {
      if (cancelled || !containerRef.current) return;

      const qr = new QrCodeStyling({
        width: size,
        height: size,
        type: "svg",
        data: value,
        qrOptions: {
          errorCorrectionLevel: resolvedLevel,
        },
        dotsOptions: {
          color: fgColor,
          type: dotStyle,
        },
        cornersSquareOptions: {
          color: fgColor,
          type: cornerSquareStyle,
        },
        cornersDotOptions: {
          color: fgColor,
          type: cornerDotStyle,
        },
        backgroundOptions: {
          color: bgColor,
        },
        ...(logoOpts
          ? {
              image: logoOpts.src,
              imageOptions: {
                crossOrigin: "anonymous",
                hideBackgroundDots: logoOpts.excavate ?? true,
                imageSize: (logoOpts.width ?? Math.round(size * 0.2)) / size,
                margin: logoOpts.margin ?? 4,
              },
            }
          : {}),
      });

      containerRef.current.innerHTML = "";
      qr.append(containerRef.current);
    });

    return () => {
      cancelled = true;
    };
  }, [
    value,
    size,
    fgColor,
    bgColor,
    dotStyle,
    cornerSquareStyle,
    cornerDotStyle,
    resolvedLevel,
    logoOpts,
  ]);

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center bg-white rounded-xl p-2",
        className,
      )}
      style={{ width: size + 16, height: size + 16 }}
    >
      <div ref={containerRef} style={{ width: size, height: size }} />
    </div>
  );
}

// ── URL builders ──────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://diuscadi.org.ng";

export function buildTicketQRValue(inviteCode: string): string {
  return `${BASE_URL}/verify/ticket/${inviteCode}`;
}

export function buildInviteQRValue(inviteCode: string): string {
  return `${BASE_URL}/auth?mode=signup&ref=${encodeURIComponent(inviteCode)}`;
}
