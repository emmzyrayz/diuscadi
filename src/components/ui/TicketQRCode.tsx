// src/components/ui/TicketQRCode.tsx
"use client";

import { QRCode } from "@/components/ui/QRCode";

interface TicketQRCodeProps {
  value: string;
}

export function TicketQRCode({ value }: TicketQRCodeProps) {
  return (
    <QRCode
      value={value}
      size={180}
      errorCorrectionLevel="H"
      withLogo={{ src: "/logo-mark.webp", width: 28, height: 28 }}
      dotStyle="rounded"
      cornerSquareStyle="extra-rounded"
      cornerDotStyle="dot"
    />
  );
}
