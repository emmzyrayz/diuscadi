"use client";
// src/components/sections/tasks/ScreenshotUploadModal.tsx

import React, { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  LuUpload,
  LuLoader,
  LuCheck,
  LuImage,
  LuCircleAlert,
} from "react-icons/lu";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { useMedia } from "@/context/MediaContext";
import { useImageCropper, CROP_ASPECT } from "@/hooks/useImageCropper";

interface ScreenshotUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliverableLabel: string;
  onComplete: (result: { url: string; publicId: string }) => void;
  disabled?: boolean;
  ownerId?: string;
}

export function ScreenshotUploadModal({
  open,
  onOpenChange,
  deliverableLabel,
  onComplete,
  disabled,
  ownerId,
}: ScreenshotUploadModalProps) {
  const { uploading, uploadError, uploadImage, clearUploadError } = useMedia();
  const cropper = useImageCropper("task-screenshot");

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        cropper.reset();
        clearUploadError();
      }
      onOpenChange(nextOpen);
    },
    [cropper, clearUploadError, onOpenChange],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return;
      if (file.size > 15 * 1024 * 1024) return;
      cropper.selectFile(file);
      e.target.value = "";
    },
    [cropper],
  );

  const handleCropConfirm = useCallback(
    async (imgEl: HTMLImageElement) => {
      await cropper.confirmCrop(imgEl);
    },
    [cropper],
  );

  // Once cropped, upload immediately — mirrors the original modal's flow.
  const handleUpload = useCallback(async () => {
    if (!cropper.croppedBlob) return;
    const image = await uploadImage(
      cropper.croppedBlob,
      "task-screenshot",
      ownerId,
      deliverableLabel,
    );
    if (image) {
      onComplete({ url: image.imageUrl, publicId: image.imagePublicId });
      cropper.reset();
      setTimeout(() => handleOpenChange(false), 1200);
    }
  }, [cropper, uploadImage, ownerId, deliverableLabel, onComplete, handleOpenChange]);

  const stepTitle =
    cropper.state === "idle"
      ? "Upload Screenshot"
      : cropper.state === "selected" || cropper.state === "cropping"
        ? "Crop Screenshot"
        : uploading
          ? "Uploading…"
          : "Uploaded";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className={cn('text-base', 'font-black', 'uppercase', 'tracking-tight', 'flex', 'items-center', 'gap-2')}>
            <LuImage className={cn('w-4', 'h-4', 'text-primary', 'shrink-0')} />
            {stepTitle}
          </DialogTitle>
          <p className={cn('text-[11px]', 'text-muted-foreground', 'mt-1')}>
            Deliverable:{" "}
            <span className={cn('font-bold', 'text-foreground')}>
              {deliverableLabel}
            </span>
          </p>
        </DialogHeader>

        <div className="mt-2">
          {cropper.state === "idle" && (
            <div className="space-y-4">
              <label
                className={cn(
                  "flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-2xl p-10",
                  "cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all",
                  disabled && "pointer-events-none opacity-50",
                )}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={disabled}
                  className="hidden"
                />
                <LuUpload className={cn('w-10', 'h-10', 'text-muted-foreground/40')} />
                <div className="text-center">
                  <p className={cn('text-sm', 'font-bold', 'text-foreground')}>
                    Click to select a screenshot
                  </p>
                  <p className={cn('text-[10px]', 'text-muted-foreground', 'mt-1')}>
                    PNG, JPG, WEBP — max 15MB
                  </p>
                </div>
              </label>

              {uploadError && (
                <p className={cn('flex', 'items-center', 'gap-2', 'text-[11px]', 'text-red-500', 'font-bold')}>
                  <LuCircleAlert className={cn('w-3.5', 'h-3.5', 'shrink-0')} />
                  {uploadError}
                </p>
              )}

              <p className={cn('text-[10px]', 'text-muted-foreground', 'leading-relaxed')}>
                Your screenshot will be reviewed by evaluators. After
                evaluation, the image is automatically deleted — only your score
                and task details are kept permanently.
              </p>
            </div>
          )}

          {(cropper.state === "selected" || cropper.state === "cropping") &&
            cropper.srcUrl && (
              <div className="space-y-3">
                <p className={cn('text-[11px]', 'text-muted-foreground')}>
                  Adjust the crop if needed. The full screenshot is selected by
                  default.
                </p>
                <ImageCropper
                  srcUrl={cropper.srcUrl}
                  crop={cropper.crop}
                  aspect={CROP_ASPECT["task-screenshot"]}
                  onCropChange={cropper.setCrop}
                  onConfirm={handleCropConfirm}
                  onCancel={cropper.reset}
                  uploading={uploading}
                  label="Crop screenshot"
                />
              </div>
            )}

          {cropper.state === "cropped" && !uploading && (
            <div className="space-y-4">
              <button
                onClick={handleUpload}
                className={cn(
                  "w-full flex items-center justify-center gap-2",
                  "px-4 py-2.5 rounded-xl bg-primary text-primary-foreground",
                  "text-[10px] font-black uppercase tracking-widest",
                  "hover:opacity-90 transition-opacity cursor-pointer",
                )}
              >
                <LuUpload className={cn('w-3.5', 'h-3.5')} /> Confirm & upload
              </button>
              {uploadError && (
                <p className={cn('flex', 'items-center', 'gap-2', 'text-[11px]', 'text-red-500', 'font-bold')}>
                  <LuCircleAlert className={cn('w-3.5', 'h-3.5', 'shrink-0')} />
                  {uploadError}
                </p>
              )}
            </div>
          )}

          {uploading && (
            <div className={cn('flex', 'flex-col', 'items-center', 'justify-center', 'py-8', 'gap-3')}>
              <LuLoader className={cn('w-8', 'h-8', 'text-primary', 'animate-spin')} />
              <p className={cn('text-sm', 'font-bold', 'text-muted-foreground')}>
                Uploading screenshot…
              </p>
              <p className={cn('text-[10px]', 'text-muted-foreground/60')}>
                Please don&apos;t close this window
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
