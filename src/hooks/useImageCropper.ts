// hooks/useImageCropper.ts
//
// Manages the crop state machine:
//   idle → selected (file chosen) → cropping (user adjusting) → cropped (ready to upload)
//
// Returns:
//   - state:        current step
//   - srcUrl:       object URL of the selected file (for the crop preview)
//   - crop:         react-image-crop PercentCrop value (controlled)
//   - croppedBlob:  the cropped image as a Blob (ready to POST to Cloudinary)
//   - selectFile:   call with a File to enter "selected" state
//   - setCrop:      update the crop rectangle
//   - confirmCrop:  call with the HTMLImageElement ref to produce croppedBlob
//   - reset:        return to idle and revoke the object URL

"use client";

import { useState, useCallback, useRef } from "react";
import type { PercentCrop } from "react-image-crop";
import type { UploadType } from "@/lib/services/CloudinaryService";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CropperState = "idle" | "selected" | "cropping" | "cropped";

export interface CropperResult {
  state: CropperState;
  srcUrl: string | null;
  crop: PercentCrop;
  croppedBlob: Blob | null;
  selectFile: (file: File) => void;
  setCrop: (c: PercentCrop) => void;
  confirmCrop: (imgEl: HTMLImageElement) => Promise<void>;
  reset: () => void;
}

// ─── Default crop rectangles per upload type ──────────────────────────────────
// These match the aspect ratios from cloudinaryService.ts

const DEFAULT_CROPS: Record<UploadType, PercentCrop> = {
  avatar: {
    unit: "%",
    x: 12.5,
    y: 12.5,
    width: 75,
    height: 75,
  },
  "event-banner": {
    unit: "%",
    x: 0,
    y: 10,
    width: 100,
    height: 80, // approx 1200:630 ≈ 1.9:1
  },
  "org-logo": {
    unit: "%",
    x: 12.5,
    y: 12.5,
    width: 75,
    height: 75,
  },
};

// ─── Aspect ratios ─────────────────────────────────────────────────────────────

export const CROP_ASPECT: Record<UploadType, number> = {
  avatar: 1, // 1:1
  "event-banner": 1200 / 630, // ~1.905:1
  "org-logo": 1, // 1:1
};

// ─── Output dimensions (canvas size for croppedBlob) ─────────────────────────

const OUTPUT_DIMS: Record<UploadType, { width: number; height: number }> = {
  avatar: { width: 400, height: 400 },
  "event-banner": { width: 1200, height: 630 },
  "org-logo": { width: 400, height: 400 },
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useImageCropper(uploadType: UploadType): CropperResult {
  const [state, setState] = useState<CropperState>("idle");
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<PercentCrop>(DEFAULT_CROPS[uploadType]);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

  // Track the current object URL so we can revoke it on reset
  const objectUrlRef = useRef<string | null>(null);

  // ── selectFile ─────────────────────────────────────────────────────────────
  const selectFile = useCallback(
    (file: File) => {
      // Revoke any previous object URL to avoid memory leaks
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setSrcUrl(url);
      setCrop(DEFAULT_CROPS[uploadType]);
      setCroppedBlob(null);
      setState("selected");
    },
    [uploadType],
  );

  // ── confirmCrop ────────────────────────────────────────────────────────────
  // Renders the cropped region onto an offscreen canvas and produces a Blob.
  const confirmCrop = useCallback(
    async (imgEl: HTMLImageElement) => {
      if (!srcUrl || !imgEl) return;

      setState("cropping");

      const { width: outW, height: outH } = OUTPUT_DIMS[uploadType];

      // Convert percent crop → pixel crop on the natural image dimensions
      const naturalW = imgEl.naturalWidth;
      const naturalH = imgEl.naturalHeight;

      const pixelX = (crop.x / 100) * naturalW;
      const pixelY = (crop.y / 100) * naturalH;
      const pixelW = (crop.width / 100) * naturalW;
      const pixelH = (crop.height / 100) * naturalH;

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setState("selected");
        return;
      }

      // For org-logo: fill background white first (pad mode)
      if (uploadType === "org-logo") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, outW, outH);
      }

      // Draw the cropped region scaled to output dimensions
      ctx.drawImage(imgEl, pixelX, pixelY, pixelW, pixelH, 0, 0, outW, outH);

      // Produce a Blob (webp preferred, fallback jpeg)
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", 0.92);
      });

      if (!blob) {
        setState("selected");
        return;
      }

      setCroppedBlob(blob);
      setState("cropped");
    },
    [srcUrl, crop, uploadType],
  );

  // ── reset ──────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSrcUrl(null);
    setCrop(DEFAULT_CROPS[uploadType]);
    setCroppedBlob(null);
    setState("idle");
  }, [uploadType]);

  return {
    state,
    srcUrl,
    crop,
    croppedBlob,
    selectFile,
    setCrop,
    confirmCrop,
    reset,
  };
}
