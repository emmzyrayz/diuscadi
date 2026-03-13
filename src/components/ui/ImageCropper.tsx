"use client";
// components/ui/ImageCropper.tsx
//
// The crop overlay panel. Rendered inside ImageUploader when a file is selected.
// Uses react-image-crop for the crop rectangle UI.
//
// Props:
//   srcUrl      — object URL of the selected file
//   crop        — controlled PercentCrop value
//   aspect      — aspect ratio (1 for avatar/logo, 1.905 for event-banner)
//   onCropChange — called whenever the user adjusts the crop rectangle
//   onConfirm   — called with the img element ref so the hook can canvas-render
//   onCancel    — back to idle
//   uploading   — disables confirm button during upload

import React, { useRef, useCallback } from "react";
import ReactCrop, { type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { LuCheck, LuX, LuLoader } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface ImageCropperProps {
  srcUrl: string;
  crop: PercentCrop;
  aspect: number;
  onCropChange: (c: PercentCrop) => void;
  onConfirm: (imgEl: HTMLImageElement) => Promise<void>;
  onCancel: () => void;
  uploading?: boolean;
  label?: string; // e.g. "Crop your profile picture"
}

export function ImageCropper({
  srcUrl,
  crop,
  aspect,
  onCropChange,
  onConfirm,
  onCancel,
  uploading = false,
  label,
}: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleConfirm = useCallback(async () => {
    if (!imgRef.current || uploading) return;
    await onConfirm(imgRef.current);
  }, [onConfirm, uploading]);

  return (
    <div className={cn("flex flex-col gap-4 w-full")}>
      {/* Header */}
      <div className={cn('flex', 'items-center', 'justify-between')}>
        <p className={cn('text-sm', 'font-bold', 'text-foreground', 'tracking-tight')}>
          {label ?? "Adjust crop"}
        </p>
        <button
          onClick={onCancel}
          disabled={uploading}
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center",
            "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
            "transition-colors disabled:opacity-50 cursor-pointer",
          )}
          aria-label="Cancel crop"
        >
          <LuX className={cn('w-3.5', 'h-3.5')} />
        </button>
      </div>

      {/* Crop area */}
      <div className={cn('relative', 'w-full', 'overflow-hidden', 'rounded-2xl', 'bg-muted/50')}>
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => onCropChange(percentCrop)}
          aspect={aspect}
          minWidth={20}
          minHeight={20}
          keepSelection
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={srcUrl}
            alt="Crop preview"
            className={cn('max-h-[420px]', 'w-full', 'object-contain')}
            style={{ display: "block" }}
          />
        </ReactCrop>
      </div>

      {/* Hint */}
      <p className={cn('text-[10px]', 'font-medium', 'text-muted-foreground', 'text-center', 'tracking-wide', 'uppercase')}>
        Drag to reposition · Resize from corners
      </p>

      {/* Actions */}
      <div className={cn('flex', 'gap-2')}>
        <button
          onClick={onCancel}
          disabled={uploading}
          className={cn(
            "flex-1 flex items-center justify-center gap-2",
            "px-4 py-2.5 rounded-xl",
            "bg-muted text-muted-foreground",
            "text-[10px] font-black uppercase tracking-widest",
            "hover:bg-border transition-colors disabled:opacity-50 cursor-pointer",
          )}
        >
          <LuX className={cn('w-3.5', 'h-3.5')} /> Cancel
        </button>

        <button
          onClick={handleConfirm}
          disabled={uploading}
          className={cn(
            "flex-[2] flex items-center justify-center gap-2",
            "px-4 py-2.5 rounded-xl",
            "bg-primary text-primary-foreground",
            "text-[10px] font-black uppercase tracking-widest",
            "hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer",
          )}
        >
          {uploading ? (
            <LuLoader className={cn('w-3.5', 'h-3.5', 'animate-spin')} />
          ) : (
            <LuCheck className={cn('w-3.5', 'h-3.5')} />
          )}
          {uploading ? "Uploading…" : "Use this crop"}
        </button>
      </div>
    </div>
  );
}
