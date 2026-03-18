"use client";
// components/ui/ImageUploader.tsx
//
// The full self-contained image upload widget.
// Handles: file selection (click or drag-drop) → crop → upload → done.
//
// Usage:
//   <ImageUploader
//     uploadType="avatar"
//     currentUrl={profile.avatar?.imageUrl}
//     currentPublicId={profile.avatar?.imagePublicId}
//     onSuccess={(image) => console.log("uploaded:", image.imageUrl)}
//   />
//
//   <ImageUploader
//     uploadType="event-banner"
//     ownerId={event.slug}
//     currentUrl={event.eventBanner?.imageUrl}
//     currentPublicId={event.eventBanner?.imagePublicId}
//     onSuccess={(image) => setEventBanner(image)}
//     aspectHint="1200 × 630"
//   />

import React, { useRef, useCallback, useState } from "react";
import {
  LuUpload,
  LuImagePlus,
  LuTrash2,
  LuLoader,
  LuCircleAlert,
  LuCircleCheck,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { useImageCropper, CROP_ASPECT } from "@/hooks/useImageCropper";
import { useMedia } from "@/context/MediaContext";
import type { UploadType } from "@/lib/services/CloudinaryService";
import type { CloudinaryImage } from "@/types/cloudinary";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ImageUploaderProps {
  uploadType: UploadType;
  /** Current image URL for preview — pass CloudinaryImage.imageUrl */
  currentUrl?: string | null;
  /** Current image publicId — pass CloudinaryImage.imagePublicId, needed for removal */
  currentPublicId?: string | null;
  /** Required for all non-avatar types */
  ownerId?: string;
  /** Called with the full CloudinaryImage after a successful upload */
  onSuccess?: (image: CloudinaryImage) => void;
  /** Called after a successful remove */
  onRemove?: () => void;
  /** For gallery items: the imageId of the specific item to remove */
  galleryImageId?: string;
  className?: string;
  shape?: "square" | "circle";
  aspectHint?: string;
  label?: string;
  cropLabel?: string;
  maxMB?: number;
  disabled?: boolean;
}

// ─── Accepted MIME types ──────────────────────────────────────────────────────

const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif";
const ACCEPTED_EXT = ".jpg, .jpeg, .png, .webp, .gif";

// ─── Component ────────────────────────────────────────────────────────────────

export function ImageUploader({
  uploadType,
  currentUrl,
  currentPublicId,
  ownerId,
  onSuccess,
  onRemove,
  galleryImageId,
  className,
  shape = "square",
  aspectHint,
  label,
  cropLabel,
  maxMB = 10,
  disabled = false,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [successImage, setSuccessImage] = useState<CloudinaryImage | null>(
    null,
  );
  const [localError, setLocalError] = useState<string | null>(null);

  const { uploading, uploadError, uploadImage, removeImage, clearUploadError } =
    useMedia();
  const cropper = useImageCropper(uploadType);

  // Preview URL — prefer just-uploaded, then existing
  const previewUrl = successImage?.imageUrl ?? currentUrl ?? null;

  // ── File validation ────────────────────────────────────────────────────────
  const validateFile = useCallback(
    (file: File): string | null => {
      if (!file.type.startsWith("image/"))
        return "Please select an image file.";
      if (file.size > maxMB * 1024 * 1024)
        return `File must be under ${maxMB} MB.`;
      return null;
    },
    [maxMB],
  );

  // ── Handle file chosen ─────────────────────────────────────────────────────
  const handleFile = useCallback(
    (file: File) => {
      setLocalError(null);
      clearUploadError();
      const err = validateFile(file);
      if (err) {
        setLocalError(err);
        return;
      }
      cropper.selectFile(file);
    },
    [validateFile, cropper, clearUploadError],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  // ── Drag-and-drop ──────────────────────────────────────────────────────────
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  // ── Crop confirmed ────────────────────────────────────────────────────────
  const handleCropConfirm = useCallback(
    async (imgEl: HTMLImageElement) => {
      await cropper.confirmCrop(imgEl);
    },
    [cropper],
  );

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = useCallback(async () => {
    if (!cropper.croppedBlob) return;

    // uploadImage returns CloudinaryImage | null — no URL extraction needed
    const image = await uploadImage(cropper.croppedBlob, uploadType, ownerId);
    if (image) {
      setSuccessImage(image);
      onSuccess?.(image);
      cropper.reset();
    }
  }, [cropper, uploadImage, uploadType, ownerId, onSuccess]);

  // ── Remove ────────────────────────────────────────────────────────────────
  const handleRemove = useCallback(async () => {
    // Use the just-uploaded publicId first, then fall back to the prop
    const publicId = successImage?.imagePublicId ?? currentPublicId;
    if (!publicId) return;

    // removeImage(uploadType, publicId, ownerId?, galleryImageId?)
    const deleted = await removeImage(
      uploadType,
      publicId,
      ownerId,
      galleryImageId,
    );
    if (deleted) {
      setSuccessImage(null);
      onRemove?.();
    }
  }, [
    successImage,
    currentPublicId,
    removeImage,
    uploadType,
    ownerId,
    galleryImageId,
    onRemove,
  ]);

  const errorMsg = localError ?? uploadError;

  // ── Crop overlay ──────────────────────────────────────────────────────────
  if (cropper.state === "selected" || cropper.state === "cropping") {
    return (
      <div className={cn("w-full", className)}>
        {cropper.srcUrl && (
          <div className={cn("glass", "rounded-3xl", "p-5")}>
            <ImageCropper
              srcUrl={cropper.srcUrl}
              crop={cropper.crop}
              aspect={CROP_ASPECT[uploadType]}
              onCropChange={cropper.setCrop}
              onConfirm={handleCropConfirm}
              onCancel={cropper.reset}
              uploading={uploading}
              label={cropLabel}
            />
          </div>
        )}
      </div>
    );
  }

  // ── Post-crop preview ─────────────────────────────────────────────────────
  if (cropper.state === "cropped" && cropper.croppedBlob) {
    const blobUrl = URL.createObjectURL(cropper.croppedBlob);
    return (
      <div className={cn("w-full", className)}>
        <div
          className={cn(
            "glass",
            "rounded-3xl",
            "p-5",
            "flex",
            "flex-col",
            "gap-4",
          )}
        >
          <p
            className={cn(
              "text-sm",
              "font-bold",
              "text-foreground",
              "tracking-tight",
            )}
          >
            {label ?? "Preview"}
          </p>

          <div
            className={cn(
              "overflow-hidden bg-muted",
              shape === "circle"
                ? "rounded-full aspect-square w-32 mx-auto"
                : "rounded-2xl w-full",
              uploadType === "event-banner" || uploadType === "inst-banner"
                ? "aspect-[1200/630]"
                : uploadType === "event-gallery"
                  ? "aspect-[4/3]"
                  : "aspect-square",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blobUrl}
              alt="Cropped preview"
              className={cn("w-full", "h-full", "object-cover")}
            />
          </div>

          <div className={cn("flex", "gap-2")}>
            <button
              onClick={cropper.reset}
              disabled={uploading}
              className={cn(
                "flex-1 flex items-center justify-center gap-2",
                "px-4 py-2.5 rounded-xl bg-muted text-muted-foreground",
                "text-[10px] font-black uppercase tracking-widest",
                "hover:bg-border transition-colors disabled:opacity-50 cursor-pointer",
              )}
            >
              Recrop
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className={cn(
                "flex-[2] flex items-center justify-center gap-2",
                "px-4 py-2.5 rounded-xl bg-primary text-primary-foreground",
                "text-[10px] font-black uppercase tracking-widest",
                "hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer",
              )}
            >
              {uploading ? (
                <>
                  <LuLoader className={cn("w-3.5", "h-3.5", "animate-spin")} />{" "}
                  Uploading…
                </>
              ) : (
                <>
                  <LuUpload className={cn("w-3.5", "h-3.5")} /> Upload
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Default: drop zone ────────────────────────────────────────────────────
  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED}
        onChange={onInputChange}
        className="sr-only"
        disabled={disabled || uploading}
        aria-label={`Upload ${uploadType}`}
      />

      {/* Current image preview */}
      {previewUrl && (
        <div className={cn("relative", "mb-3", "group")}>
          <div
            className={cn(
              "overflow-hidden bg-muted",
              shape === "circle"
                ? "rounded-full aspect-square w-32 mx-auto"
                : "rounded-2xl w-full",
              uploadType === "event-banner" || uploadType === "inst-banner"
                ? "aspect-[1200/630]"
                : uploadType === "event-gallery"
                  ? "aspect-[4/3]"
                  : "aspect-square max-w-[200px] mx-auto",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={label ?? uploadType}
              className={cn("w-full", "h-full", "object-cover")}
            />
          </div>

          {/* Remove button */}
          {onRemove && !disabled && (
            <button
              onClick={handleRemove}
              disabled={uploading}
              className={cn(
                "absolute top-2 right-2 w-7 h-7 rounded-lg",
                "flex items-center justify-center",
                "bg-destructive/90 text-white opacity-0 group-hover:opacity-100",
                "transition-opacity shadow-lg disabled:opacity-50 cursor-pointer",
              )}
              aria-label="Remove image"
            >
              {uploading ? (
                <LuLoader className={cn("w-3.5", "h-3.5", "animate-spin")} />
              ) : (
                <LuTrash2 className={cn("w-3.5", "h-3.5")} />
              )}
            </button>
          )}

          {/* Success indicator */}
          {successImage && (
            <div
              className={cn(
                "absolute",
                "bottom-2",
                "right-2",
                "flex",
                "items-center",
                "gap-1",
                "bg-emerald-500",
                "text-white",
                "text-[9px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "px-2",
                "py-1",
                "rounded-lg",
                "shadow-lg",
              )}
            >
              <LuCircleCheck className={cn("w-3", "h-3")} /> Saved
            </div>
          )}
        </div>
      )}

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={(e) =>
          e.key === "Enter" && !disabled && fileInputRef.current?.click()
        }
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "w-full rounded-2xl border-2 border-dashed transition-all",
          "flex flex-col items-center justify-center gap-2 py-6 px-4",
          "cursor-pointer select-none",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-muted/50",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            "bg-muted text-muted-foreground",
            isDragging && "bg-primary/10 text-primary",
          )}
        >
          <LuImagePlus className={cn("w-5", "h-5")} />
        </div>

        <div className="text-center">
          <p
            className={cn(
              "text-[11px]",
              "font-black",
              "uppercase",
              "tracking-widest",
              "text-foreground",
            )}
          >
            {previewUrl ? "Change image" : "Upload image"}
          </p>
          <p className={cn("text-[10px]", "text-muted-foreground", "mt-0.5")}>
            Drag & drop or click to browse
          </p>
          {aspectHint && (
            <p
              className={cn(
                "text-[10px]",
                "text-muted-foreground/70",
                "mt-0.5",
              )}
            >
              Recommended: {aspectHint}
            </p>
          )}
          <p
            className={cn(
              "text-[9px]",
              "text-muted-foreground/50",
              "mt-1",
              "uppercase",
              "tracking-wider",
            )}
          >
            {ACCEPTED_EXT} · Max {maxMB} MB
          </p>
        </div>
      </div>

      {/* Error */}
      {errorMsg && (
        <div
          className={cn(
            "mt-2",
            "flex",
            "items-center",
            "gap-2",
            "text-destructive",
            "text-[11px]",
            "font-medium",
          )}
        >
          <LuCircleAlert className={cn("w-3.5", "h-3.5", "shrink-0")} />
          {errorMsg}
        </div>
      )}
    </div>
  );
}
