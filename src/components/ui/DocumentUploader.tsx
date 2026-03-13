"use client";
// components/ui/DocumentUploader.tsx
//
// Full document upload widget. Drop zone → upload progress → processing spinner
// → done state with available format downloads.
//
// Usage:
//   <DocumentUploader
//     ownerType="user"
//     label="Upload your CV"
//     onUploaded={(id) => saveToProfile(id)}
//   />
//
//   <DocumentUploader
//     ownerType="event"
//     ownerId={event.slug}
//     allowedMimes={["application/pdf"]}
//     label="Event Schedule (PDF only)"
//     onUploaded={(id) => attachToEvent(id)}
//   />

import React, { useRef, useCallback, useState } from "react";
import {
  LuFileUp,
  LuFile,
  LuFileCheck2,
  LuFileX2,
  LuLoader,
  LuTrash2,
  LuDownload,
  LuCircleAlert,
  LuCircleCheck,
  LuClock,
  LuChevronDown,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import {
  useDocumentUploader,
  MIME_LABELS,
  SUPPORTED_MIMES,
  type UploaderState,
} from "@/hooks/useDocumentUploader";
import type { FileOwnerType } from "@/lib/models/FileDocument";

// ─── Props ────────────────────────────────────────────────────────────────────

interface DocumentUploaderProps {
  ownerType: FileOwnerType;
  ownerId?: string;
  label?: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  allowedMimes?: string[];
  maxMB?: number;
  onUploaded?: (fileId: string) => void;
  onProcessed?: (fileId: string, status: string) => void;
  className?: string;
  disabled?: boolean;
  /** Show download buttons after processing completes */
  showDownloads?: boolean;
}

// ─── Format display labels ────────────────────────────────────────────────────

const FORMAT_LABELS: Record<string, string> = {
  original: "Original",
  storage: "Optimised",
  web: "Web Preview",
  pdf: "PDF",
  html: "HTML",
  docx: "Word (.docx)",
  xlsx: "Excel (.xlsx)",
};

// ─── State colours / icons ────────────────────────────────────────────────────

function StateIcon({
  state,
  className,
}: {
  state: UploaderState;
  className?: string;
}) {
  const cls = cn("w-5 h-5", className);
  switch (state) {
    case "uploading":
      return <LuLoader className={cn(cls, "animate-spin")} />;
    case "processing":
      return <LuClock className={cn(cls, "animate-pulse")} />;
    case "ready":
      return <LuFileCheck2 className={cn(cls, "text-emerald-500")} />;
    case "skipped":
      return <LuFileCheck2 className={cn(cls, "text-emerald-500")} />;
    case "failed":
      return <LuFileX2 className={cn(cls, "text-destructive")} />;
    case "selecting":
      return <LuFile className={cls} />;
    default:
      return <LuFileUp className={cls} />;
  }
}

const STATE_LABEL: Record<UploaderState, string> = {
  idle: "Select file",
  selecting: "Ready to upload",
  uploading: "Uploading…",
  processing: "Processing…",
  ready: "Ready",
  failed: "Processing failed",
  skipped: "Ready",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function DocumentUploader({
  ownerType,
  ownerId,
  label,
  description,
  tags,
  isPublic,
  allowedMimes = SUPPORTED_MIMES as unknown as string[],
  maxMB = 500,
  onUploaded,
  onProcessed,
  className,
  disabled = false,
  showDownloads = true,
}: DocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);

  const uploader = useDocumentUploader({
    ownerType,
    ownerId,
    description,
    tags,
    isPublic,
    onUploaded,
    onProcessed,
    maxBytes: maxMB * 1024 * 1024,
    allowedMimes,
  });

  const { state, progress, error, selectedFile, availableFormats, getUrl } =
    uploader;

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFile = useCallback(
    (file: File) => {
      setLocalError(null);
      const validationError = uploader.selectFile(file);
      if (validationError) setLocalError(validationError);
    },
    [uploader],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

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

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = useCallback(
    async (format: string) => {
      const url = await getUrl(format);
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.download = selectedFile?.name ?? "download";
        a.click();
      }
    },
    [getUrl, selectedFile],
  );

  const errorMsg = localError ?? error;

  const isDone = state === "ready" || state === "skipped";
  const isWorking = state === "uploading" || state === "processing";
  const isIdle = state === "idle";

  // ── File size formatter ────────────────────────────────────────────────────
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const acceptString = allowedMimes.join(",");

  return (
    <div className={cn("w-full flex flex-col gap-3", className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptString}
        onChange={onInputChange}
        className="sr-only"
        disabled={disabled || isWorking}
        aria-label={label ?? "Upload document"}
      />

      {/* ── Idle / selecting state: drop zone ── */}
      {(isIdle || state === "selecting") && (
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
            "flex flex-col items-center justify-center gap-3 py-8 px-4",
            "cursor-pointer select-none",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/50 hover:bg-muted/50",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <div
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center",
              "bg-muted text-muted-foreground transition-colors",
              isDragging && "bg-primary/10 text-primary",
            )}
          >
            <LuFileUp className={cn("w-6", "h-6")} />
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
              {label ?? "Upload document"}
            </p>
            <p className={cn("text-[10px]", "text-muted-foreground", "mt-0.5")}>
              Drag & drop or click to browse
            </p>
            <p
              className={cn(
                "text-[9px]",
                "text-muted-foreground/60",
                "mt-1",
                "uppercase",
                "tracking-wider",
              )}
            >
              {allowedMimes
                .map((m) => MIME_LABELS[m]?.split(" ")[0] ?? m)
                .join(" · ")}{" "}
              · Max {maxMB} MB
            </p>
          </div>
        </div>
      )}

      {/* ── File selected (not yet uploaded) ── */}
      {state === "selecting" && selectedFile && (
        <div
          className={cn(
            "glass",
            "rounded-2xl",
            "p-4",
            "flex",
            "items-center",
            "gap-3",
          )}
        >
          <div
            className={cn(
              "w-9",
              "h-9",
              "rounded-xl",
              "bg-muted",
              "flex",
              "items-center",
              "justify-center",
              "shrink-0",
            )}
          >
            <LuFile className={cn("w-4.5", "h-4.5", "text-muted-foreground")} />
          </div>
          <div className={cn("flex-1", "min-w-0")}>
            <p
              className={cn(
                "text-[11px]",
                "font-bold",
                "text-foreground",
                "truncate",
              )}
            >
              {selectedFile.name}
            </p>
            <p className={cn("text-[10px]", "text-muted-foreground")}>
              {MIME_LABELS[selectedFile.type] ?? selectedFile.type} ·{" "}
              {formatSize(selectedFile.size)}
            </p>
          </div>
          <div className={cn("flex", "items-center", "gap-2", "shrink-0")}>
            <button
              onClick={() => uploader.reset()}
              className={cn(
                "w-7",
                "h-7",
                "rounded-lg",
                "bg-muted",
                "text-muted-foreground",
                "hover:bg-destructive/10",
                "hover:text-destructive",
                "transition-colors",
                "flex",
                "items-center",
                "justify-center",
                "cursor-pointer",
              )}
              aria-label="Remove"
            >
              <LuTrash2 className={cn("w-3.5", "h-3.5")} />
            </button>
            <button
              onClick={() => uploader.upload()}
              className={cn(
                "flex",
                "items-center",
                "gap-1.5",
                "px-3",
                "py-1.5",
                "rounded-xl",
                "bg-primary",
                "text-primary-foreground",
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "hover:opacity-90",
                "transition-opacity",
                "cursor-pointer",
              )}
            >
              <LuFileUp className={cn("w-3.5", "h-3.5")} />
              Upload
            </button>
          </div>
        </div>
      )}

      {/* ── Uploading state ── */}
      {state === "uploading" && selectedFile && (
        <div
          className={cn(
            "glass",
            "rounded-2xl",
            "p-4",
            "flex",
            "flex-col",
            "gap-3",
          )}
        >
          <div className={cn("flex", "items-center", "gap-3")}>
            <div
              className={cn(
                "w-9",
                "h-9",
                "rounded-xl",
                "bg-primary/10",
                "flex",
                "items-center",
                "justify-center",
                "shrink-0",
              )}
            >
              <LuLoader
                className={cn("w-4.5", "h-4.5", "text-primary", "animate-spin")}
              />
            </div>
            <div className={cn("flex-1", "min-w-0")}>
              <p
                className={cn(
                  "text-[11px]",
                  "font-bold",
                  "text-foreground",
                  "truncate",
                )}
              >
                {selectedFile.name}
              </p>
              <p className={cn("text-[10px]", "text-muted-foreground")}>
                Uploading · {progress}%
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div
            className={cn(
              "w-full",
              "h-1.5",
              "rounded-full",
              "bg-muted",
              "overflow-hidden",
            )}
          >
            <div
              className={cn(
                "h-full",
                "rounded-full",
                "bg-primary",
                "transition-all",
                "duration-300",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Processing state ── */}
      {state === "processing" && (
        <div
          className={cn(
            "glass",
            "rounded-2xl",
            "p-4",
            "flex",
            "items-center",
            "gap-3",
          )}
        >
          <div
            className={cn(
              "w-9",
              "h-9",
              "rounded-xl",
              "bg-amber-500/10",
              "flex",
              "items-center",
              "justify-center",
              "shrink-0",
            )}
          >
            <LuClock
              className={cn(
                "w-4.5",
                "h-4.5",
                "text-amber-500",
                "animate-pulse",
              )}
            />
          </div>
          <div className="flex-1">
            <p className={cn("text-[11px]", "font-bold", "text-foreground")}>
              Processing…
            </p>
            <p className={cn("text-[10px]", "text-muted-foreground")}>
              Generating web preview and storage variants
            </p>
          </div>
        </div>
      )}

      {/* ── Done state (ready / skipped) ── */}
      {isDone && selectedFile && (
        <div
          className={cn(
            "glass",
            "rounded-2xl",
            "p-4",
            "flex",
            "flex-col",
            "gap-3",
          )}
        >
          <div className={cn("flex", "items-center", "gap-3")}>
            <div
              className={cn(
                "w-9",
                "h-9",
                "rounded-xl",
                "bg-emerald-500/10",
                "flex",
                "items-center",
                "justify-center",
                "shrink-0",
              )}
            >
              <LuFileCheck2
                className={cn("w-4.5", "h-4.5", "text-emerald-500")}
              />
            </div>
            <div className={cn("flex-1", "min-w-0")}>
              <p
                className={cn(
                  "text-[11px]",
                  "font-bold",
                  "text-foreground",
                  "truncate",
                )}
              >
                {selectedFile.name}
              </p>
              <p className={cn("text-[10px]", "text-muted-foreground")}>
                {formatSize(selectedFile.size)} · {availableFormats.length}{" "}
                format{availableFormats.length !== 1 ? "s" : ""} available
              </p>
            </div>
            <div className={cn("flex", "items-center", "gap-2", "shrink-0")}>
              {showDownloads && availableFormats.length > 0 && (
                <button
                  onClick={() => setDownloadOpen(!downloadOpen)}
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-1.5",
                    "px-3",
                    "py-1.5",
                    "rounded-xl",
                    "bg-muted",
                    "text-muted-foreground",
                    "text-[10px]",
                    "font-black",
                    "uppercase",
                    "tracking-widest",
                    "hover:bg-border",
                    "transition-colors",
                    "cursor-pointer",
                  )}
                >
                  <LuDownload className={cn("w-3.5", "h-3.5")} />
                  Download
                  <LuChevronDown
                    className={cn(
                      "w-3 h-3 transition-transform",
                      downloadOpen && "rotate-180",
                    )}
                  />
                </button>
              )}
              <button
                onClick={() => uploader.reset()}
                className={cn(
                  "w-7",
                  "h-7",
                  "rounded-lg",
                  "bg-muted",
                  "text-muted-foreground",
                  "hover:bg-destructive/10",
                  "hover:text-destructive",
                  "transition-colors",
                  "flex",
                  "items-center",
                  "justify-center",
                  "cursor-pointer",
                )}
                aria-label="Remove and replace"
              >
                <LuTrash2 className={cn("w-3.5", "h-3.5")} />
              </button>
            </div>
          </div>

          {/* Download format list */}
          {showDownloads && downloadOpen && availableFormats.length > 0 && (
            <div
              className={cn(
                "flex",
                "flex-wrap",
                "gap-2",
                "pt-1",
                "border-t",
                "border-border",
              )}
            >
              {availableFormats.map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleDownload(fmt)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
                    "bg-muted text-muted-foreground",
                    "text-[9px] font-black uppercase tracking-widest",
                    "hover:bg-primary hover:text-primary-foreground",
                    "transition-colors cursor-pointer",
                  )}
                >
                  <LuDownload className={cn("w-3", "h-3")} />
                  {FORMAT_LABELS[fmt] ?? fmt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Failed state ── */}
      {state === "failed" && (
        <div
          className={cn(
            "glass",
            "rounded-2xl",
            "p-4",
            "flex",
            "items-center",
            "gap-3",
          )}
        >
          <div
            className={cn(
              "w-9",
              "h-9",
              "rounded-xl",
              "bg-destructive/10",
              "flex",
              "items-center",
              "justify-center",
              "shrink-0",
            )}
          >
            <LuFileX2 className={cn("w-4.5", "h-4.5", "text-destructive")} />
          </div>
          <div className={cn("flex-1", "min-w-0")}>
            <p
              className={cn(
                "text-[11px]",
                "font-bold",
                "text-foreground",
                "truncate",
              )}
            >
              {selectedFile?.name ?? "Upload failed"}
            </p>
            <p className={cn("text-[10px]", "text-muted-foreground")}>
              Original is saved · conversion failed
            </p>
          </div>
          {/* Still allow download of original even on processing failure */}
          <div className={cn("flex", "items-center", "gap-2", "shrink-0")}>
            <button
              onClick={() => handleDownload("original")}
              className={cn(
                "flex",
                "items-center",
                "gap-1.5",
                "px-3",
                "py-1.5",
                "rounded-xl",
                "bg-muted",
                "text-muted-foreground",
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "hover:bg-border",
                "transition-colors",
                "cursor-pointer",
              )}
            >
              <LuDownload className={cn("w-3.5", "h-3.5")} />
              Original
            </button>
            <button
              onClick={() => uploader.reset()}
              className={cn(
                "w-7",
                "h-7",
                "rounded-lg",
                "bg-muted",
                "text-muted-foreground",
                "hover:bg-destructive/10",
                "hover:text-destructive",
                "transition-colors",
                "flex",
                "items-center",
                "justify-center",
                "cursor-pointer",
              )}
              aria-label="Retry"
            >
              <LuTrash2 className={cn("w-3.5", "h-3.5")} />
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMsg && state !== "failed" && (
        <div
          className={cn(
            "flex",
            "items-start",
            "gap-2",
            "text-destructive",
            "text-[11px]",
            "font-medium",
          )}
        >
          <LuCircleAlert
            className={cn("w-3.5", "h-3.5", "shrink-0", "mt-0.5")}
          />
          {errorMsg}
        </div>
      )}
    </div>
  );
}
