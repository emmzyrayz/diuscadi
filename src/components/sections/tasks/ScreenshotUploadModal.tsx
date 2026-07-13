"use client";
// src/components/sections/tasks/ScreenshotUploadModal.tsx

import React, { useState, useCallback } from "react";
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
  LuX,
  LuImage,
  LuCircleAlert,
} from "react-icons/lu";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { useMedia } from "@/context/MediaContext";

interface ScreenshotUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliverableLabel: string;
  onComplete: (result: { url: string; publicId: string }) => void;
  disabled?: boolean;
}

type Step = "select" | "crop" | "upload" | "done";

export function ScreenshotUploadModal({
  open,
  onOpenChange,
  deliverableLabel,
  onComplete,
  disabled,
}: ScreenshotUploadModalProps) {
  const { uploadMedia } = useMedia();
  const [step, setStep] = useState<Step>("select");
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStep("select");
      setRawImageSrc(null);
      setUploadError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select an image file");
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setUploadError("File too large — max 15MB");
        return;
      }
      setUploadError(null);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setRawImageSrc(ev.target?.result as string);
        setStep("crop");
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [],
  );

  const handleCropComplete = useCallback(
    async (file: File) => {
      setStep("upload");
      try {
        const result = await uploadMedia(file, "task_screenshot", {
          purpose: "task_submission",
        });
        if (!result.success || !result.url || !result.publicId) {
          throw new Error(result.error ?? "Upload failed");
        }
        setStep("done");
        onComplete({ url: result.url, publicId: result.publicId });
        setTimeout(() => handleOpenChange(false), 1200);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
        setStep("select");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [uploadMedia, onComplete],
  );

  const stepTitles: Record<Step, string> = {
    select: "Upload Screenshot",
    crop: "Crop Screenshot",
    upload: "Uploading…",
    done: "Uploaded",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2">
            <LuImage className="w-4 h-4 text-primary shrink-0" />
            {stepTitles[step]}
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground mt-1">
            Deliverable:{" "}
            <span className="font-bold text-foreground">
              {deliverableLabel}
            </span>
          </p>
        </DialogHeader>

        <div className="mt-2">
          {step === "select" && (
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
                <LuUpload className="w-10 h-10 text-muted-foreground/40" />
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">
                    Click to select a screenshot
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    PNG, JPG, WEBP — max 15MB
                  </p>
                </div>
              </label>

              {uploadError && (
                <p className="flex items-center gap-2 text-[11px] text-red-500 font-bold">
                  <LuCircleAlert className="w-3.5 h-3.5 shrink-0" />
                  {uploadError}
                </p>
              )}

              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Your screenshot will be reviewed by evaluators. After
                evaluation, the image is automatically deleted — only your score
                and task details are kept permanently.
              </p>
            </div>
          )}

          {step === "crop" && rawImageSrc && (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground">
                Adjust the crop if needed. The full screenshot is selected by
                default.
              </p>
              <ImageCropper
                imageSrc={rawImageSrc}
                onCropComplete={handleCropComplete}
                onCancel={() => {
                  setStep("select");
                  setRawImageSrc(null);
                }}
                // No aspect prop = freeform for screenshots
                outputFileName="task-screenshot.jpg"
                outputMimeType="image/jpeg"
                outputQuality={0.92}
              />
            </div>
          )}

          {step === "upload" && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <LuLoader className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-bold text-muted-foreground">
                Uploading screenshot…
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                Please don&apos;t close this window
              </p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <LuCheck className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-sm font-black text-foreground">
                Screenshot uploaded
              </p>
              <p className="text-[10px] text-muted-foreground">Closing…</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
