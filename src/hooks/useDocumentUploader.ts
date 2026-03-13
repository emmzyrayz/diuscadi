"use client";
// hooks/useDocumentUploader.ts
//
// Manages the full document upload + processing lifecycle:
//
//   idle
//     → selecting      (file chosen, not yet uploaded)
//     → uploading      (PUT to B2 in progress, progress 0–100)
//     → processing     (B2 upload done, pipeline running server-side)
//     → ready          (all variants available)
//     → failed         (pipeline error — original still accessible)
//     → skipped        (no conversion needed — PDF, plain text)
//
// Designed to be used once per upload slot (e.g. one attachment field).
// For lists of attachments, instantiate multiple instances.
//
// Returns everything a DocumentUploader component needs:
//   - state, progress, error
//   - the selected File object
//   - availableFormats (once ready)
//   - selectFile, upload, reset, getUrl

import { useState, useCallback, useRef, useEffect } from "react";
import { useDoc } from "@/context/DocContext";
import type { FileOwnerType } from "@/lib/models/FileDocument";
import type { ProcessingStatus } from "@/lib/models/FileDocument";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UploaderState =
  | "idle"
  | "selecting"
  | "uploading"
  | "processing"
  | "ready"
  | "failed"
  | "skipped";

export interface UseDocumentUploaderOptions {
  ownerType: FileOwnerType;
  ownerId?: string;
  displayName?: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  /** Called with the fileId once the upload is confirmed */
  onUploaded?: (fileId: string) => void;
  /** Called once processing finishes (ready/skipped/failed) */
  onProcessed?: (fileId: string, status: ProcessingStatus) => void;
  /** Max file size in bytes — client-side guard */
  maxBytes?: number;
  /** Allowed MIME types — omit for all supported types */
  allowedMimes?: string[];
}

export interface UseDocumentUploaderResult {
  state: UploaderState;
  progress: number; // 0–100 during uploading
  error: string | null;
  selectedFile: File | null;
  fileId: string | null;
  availableFormats: string[];

  selectFile: (file: File) => string | null; // returns validation error or null
  upload: () => Promise<void>;
  reset: () => void;
  getUrl: (format?: string) => Promise<string | null>;
}

// ─── Supported MIME types (matches /api/docs/sign whitelist) ─────────────────

export const SUPPORTED_MIMES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/zip",
  "application/x-zip-compressed",
] as const;

export const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "Word (.docx)",
  "application/msword": "Word (.doc)",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    "Excel (.xlsx)",
  "application/vnd.ms-excel": "Excel (.xls)",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "PowerPoint (.pptx)",
  "application/vnd.ms-powerpoint": "PowerPoint (.ppt)",
  "text/plain": "Text (.txt)",
  "text/csv": "CSV",
  "text/markdown": "Markdown",
  "application/zip": "ZIP Archive",
  "application/x-zip-compressed": "ZIP Archive",
};

export const DEFAULT_MAX_BYTES = 500 * 1024 * 1024; // 500 MB

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDocumentUploader(
  options: UseDocumentUploaderOptions,
): UseDocumentUploaderResult {
  const {
    ownerType,
    maxBytes = DEFAULT_MAX_BYTES,
    allowedMimes = SUPPORTED_MIMES as unknown as string[],
  } = options;

  const { uploadDoc, pollStatus, getDownloadUrl, clearUploadError } = useDoc();

  const [state, setState] = useState<UploaderState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [availableFormats, setAvailableFormats] = useState<string[]>([]);

  // Keep a ref to the latest options so upload() never captures a stale closure
  // on callbacks like onUploaded/onProcessed. Synced in an effect, never during render.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  // ── selectFile ─────────────────────────────────────────────────────────────
  // Returns a validation error string, or null if the file is accepted.
  const selectFile = useCallback(
    (file: File): string | null => {
      setError(null);
      clearUploadError();

      if (!allowedMimes.includes(file.type)) {
        const supported = allowedMimes
          .map((m) => MIME_LABELS[m] ?? m)
          .join(", ");
        return `Unsupported file type. Supported: ${supported}`;
      }

      if (file.size > maxBytes) {
        return `File is too large. Maximum size is ${Math.round(maxBytes / 1024 / 1024)} MB.`;
      }

      if (file.size === 0) {
        return "File appears to be empty.";
      }

      setSelectedFile(file);
      setState("selecting");
      return null;
    },
    [allowedMimes, maxBytes, clearUploadError],
  );

  // ── upload ─────────────────────────────────────────────────────────────────
  const upload = useCallback(async (): Promise<void> => {
    if (!selectedFile) {
      setError("No file selected.");
      return;
    }

    setState("uploading");
    setProgress(0);
    setError(null);

    const result = await uploadDoc(selectedFile, {
      fileName: selectedFile.name,
      mimeType: selectedFile.type,
      sizeBytes: selectedFile.size,
      ownerType,
      ownerId: optionsRef.current.ownerId,
      displayName: optionsRef.current.displayName,
      description: optionsRef.current.description,
      tags: optionsRef.current.tags,
      isPublic: optionsRef.current.isPublic,
      onProgress: (pct) => setProgress(pct),
    });

    if (!result) {
      setState("failed");
      setError("Upload failed — please try again.");
      return;
    }

    setFileId(result.fileId);
    optionsRef.current.onUploaded?.(result.fileId);

    // ── Poll for processing completion ──────────────────────────────────────
    setState("processing");

    const poll = await pollStatus(result.fileId);

    // Map ProcessingStatus → UploaderState
    const stateMap: Record<ProcessingStatus, UploaderState> = {
      pending: "processing",
      processing: "processing",
      ready: "ready",
      failed: "failed",
      skipped: "skipped",
    };

    setState(stateMap[poll.processingStatus] ?? "ready");
    setAvailableFormats(poll.availableFormats);

    if (poll.processingError) {
      setError(`Processing warning: ${poll.processingError}`);
    }

    optionsRef.current.onProcessed?.(result.fileId, poll.processingStatus);
  }, [selectedFile, ownerType, uploadDoc, pollStatus]);

  // ── reset ──────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setState("idle");
    setProgress(0);
    setError(null);
    setSelectedFile(null);
    setFileId(null);
    setAvailableFormats([]);
    clearUploadError();
  }, [clearUploadError]);

  // ── getUrl ─────────────────────────────────────────────────────────────────
  const getUrl = useCallback(
    async (format = "original"): Promise<string | null> => {
      if (!fileId) return null;
      const result = await getDownloadUrl(fileId, format);
      return result?.url ?? null;
    },
    [fileId, getDownloadUrl],
  );

  return {
    state,
    progress,
    error,
    selectedFile,
    fileId,
    availableFormats,
    selectFile,
    upload,
    reset,
    getUrl,
  };
}
