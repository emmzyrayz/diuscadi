"use client";
// components/ui/QRCode.tsx
//
// Wrapper around qrcode.react that renders a real scannable QR code.
// Install: npm install qrcode.react
//
// Usage:
//   <QRCode value="https://diuscadi.org.ng/verify/ticket/DIU-ABC123" size={128} />
//   <QRCode value={`https://diuscadi.org.ng/auth?mode=signup&ref=${inviteCode}`} size={128} />

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

interface QRCodeProps {
  /** The URL or string the QR code encodes */
  value: string;
  /** Size in px — both width and height */
  size?: number;
  /** Optional wrapper className */
  className?: string;
  /** Show a small DIUSCADI logo in the center of the QR */
  withLogo?: boolean;
}

export function QRCode({
  value,
  size = 128,
  className,
  withLogo = false,
}: QRCodeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center bg-white rounded-xl p-2",
        className,
      )}
      style={{ width: size + 16, height: size + 16 }}
    >
      <QRCodeSVG
        value={value}
        size={size}
        bgColor="#ffffff"
        fgColor="#0f172a" // slate-950 — high contrast, scans reliably
        level="M" // M = ~15% error correction — enough for a small logo overlay
        includeMargin={false}
        imageSettings={
          withLogo
            ? {
                src: "/images/logo-qr.png", // 40×40 white-bg logo for QR center
                x: undefined,
                y: undefined,
                height: Math.round(size * 0.2),
                width: Math.round(size * 0.2),
                excavate: true,
              }
            : undefined
        }
      />
    </div>
  );
}

// ── URL builders ──────────────────────────────────────────────────────────────
// Centralised here so every component uses the same URL shape.

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://diuscadi.org.ng";

/**
 * URL encoded in the ticket QR code.
 * Scanned by event staff at the door → opens the check-in verification page.
 */
export function buildTicketQRValue(inviteCode: string): string {
  return `${BASE_URL}/verify/ticket/${inviteCode}`;
}

/**
 * URL encoded in the member invite code QR.
 * Scanned by a new user → opens signup with the referral code pre-filled.
 */
export function buildInviteQRValue(inviteCode: string): string {
  return `${BASE_URL}/auth?mode=signup&ref=${encodeURIComponent(inviteCode)}`;
}
