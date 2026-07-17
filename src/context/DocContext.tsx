"use client";
// context/DocContext.tsx
//
// Client-side context for the Backblaze B2 document pipeline.
//
// Responsibilities:
//   - Upload documents (3-step: sign → PUT to B2 → confirm)
//   - Poll processing status until ready
//   - Fetch pre-signed download URLs (per format)
//   - Delete documents
//   - Cache file metadata so components don't re-fetch
//
// This context intentionally owns NO file bytes — uploads go
// directly from the browser to B2. This context only orchestrates
// the signalling (sign, confirm, poll) and caches metadata.

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { authFetch } from "@/lib/authFetch";
import type {
  FileDocument,
  FileOwnerType,
  ProcessingStatus,
} from "@/lib/models/FileDocument";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadDocOptions {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  ownerType: FileOwnerType;
  ownerId?: string;
  displayName?: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  /** Progress callback — 0 to 100 */
  onProgress?: (pct: number) => void;
}

export interface UploadDocResult {
  fileId: string;
  processingStatus: ProcessingStatus;
}

export interface DownloadUrlResult {
  url: string;
  mimeType: string;
  fileName: string;
  expiresIn: number;
}

export interface PollResult {
  processingStatus: ProcessingStatus;
  availableFormats: string[];
  processingError?: string;
}

interface DocContextType {
  /** Upload a File/Blob to B2. Returns { fileId } after confirm. */
  uploadDoc: (
    file: File | Blob,
    options: UploadDocOptions,
  ) => Promise<UploadDocResult | null>;

  /**
   * Poll /api/docs/[id]/status until status is no longer "processing".
   * Resolves with the final status once done (or after maxWait ms).
   */
  pollStatus: (
    fileId: string,
    interval?: number, // ms between polls, default 1500
    maxWait?: number, // ms max total wait, default 30000
  ) => Promise<PollResult>;

  /** Get a short-lived download URL for a file + format. */
  getDownloadUrl: (
    fileId: string,
    format?: string, // "original" | "web" | "storage" | "pdf" | etc.
  ) => Promise<DownloadUrlResult | null>;

  /** Delete a file and all its B2 variants. */
  deleteDoc: (fileId: string) => Promise<boolean>;

  /** Fetch full FileDocument metadata. Cached by fileId. */
  fetchFile: (fileId: string) => Promise<FileDocument | null>;

  /** Per-file upload progress (0–100). Keyed by a temp upload key. */
  uploadProgress: Record<string, number>;

  /** Global loading flag — true during any active upload */
  uploading: boolean;

  /** Last error message */
  uploadError: string | null;

  clearUploadError: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const DocContext = createContext<DocContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DocProvider({ children }: { children: ReactNode }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );

  // Simple in-memory cache: fileId → FileDocument
  const fileCache = useRef<Map<string, FileDocument>>(new Map());

  // ── Step 1: get presigned PUT URL ─────────────────────────────────────────
  const signUpload = useCallback(async (options: UploadDocOptions) => {
    return authFetch<{
      uploadUrl: string;
      fileKey: string;
      expiresIn: number;
    }>("/api/docs/sign", {
      method: "POST",
      body: JSON.stringify({
        fileName: options.fileName,
        mimeType: options.mimeType,
        sizeBytes: options.sizeBytes,
        ownerType: options.ownerType,
        ownerId: options.ownerId,
      }),
    });
  }, []);

  // ── Step 2: PUT directly to B2 with XHR (supports progress) ──────────────
  // NEVER route through authFetch: this is a binary PUT straight to a
  // presigned Backblaze B2 URL, not our backend. No auth header belongs
  // here, and we need XHR (not fetch) for the progress event stream.
  const putToB2 = useCallback(
    (
      uploadUrl: string,
      file: File | Blob,
      mimeType: string,
      progressKey: string,
      onProgress?: (pct: number) => void,
    ): Promise<void> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            onProgress?.(pct);
            setUploadProgress((prev) => ({ ...prev, [progressKey]: pct }));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`B2 upload failed: HTTP ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () =>
          reject(new Error("B2 upload network error")),
        );
        xhr.addEventListener("abort", () =>
          reject(new Error("B2 upload aborted")),
        );

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", mimeType);
        xhr.send(file);
      });
    },
    [],
  );

  // ── Step 3: confirm with our server ──────────────────────────────────────
  const confirmUpload = useCallback(
    async (
      fileKey: string,
      options: UploadDocOptions,
    ): Promise<UploadDocResult> => {
      return authFetch<UploadDocResult>("/api/docs/confirm", {
        method: "POST",
        body: JSON.stringify({
          fileKey,
          fileName: options.fileName,
          mimeType: options.mimeType,
          sizeBytes: options.sizeBytes,
          ownerType: options.ownerType,
          ownerId: options.ownerId,
          displayName: options.displayName,
          description: options.description,
          tags: options.tags,
          isPublic: options.isPublic,
        }),
      });
    },
    [],
  );

  // ── Main upload function ───────────────────────────────────────────────────
  const uploadDoc = useCallback(
    async (
      file: File | Blob,
      options: UploadDocOptions,
    ): Promise<UploadDocResult | null> => {
      setUploading(true);
      setUploadError(null);

      // Use fileName as the progress key
      const progressKey = `${options.fileName}_${Date.now()}`;
      setUploadProgress((prev) => ({ ...prev, [progressKey]: 0 }));

      try {
        // 1. Sign
        const { uploadUrl, fileKey } = await signUpload(options);

        // 2. PUT to B2
        await putToB2(
          uploadUrl,
          file,
          options.mimeType,
          progressKey,
          options.onProgress,
        );

        // 3. Confirm
        const result = await confirmUpload(fileKey, options);

        // Clean up progress entry
        setUploadProgress((prev) => {
          const next = { ...prev };
          delete next[progressKey];
          return next;
        });

        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setUploadError(msg);

        setUploadProgress((prev) => {
          const next = { ...prev };
          delete next[progressKey];
          return next;
        });

        return null;
      } finally {
        setUploading(false);
      }
    },
    [signUpload, putToB2, confirmUpload],
  );

  // ── Poll processing status ─────────────────────────────────────────────────
  // authFetch throws on non-OK — the original loop just `break`s on a bad
  // response and falls through to the timed-out return, so we replicate
  // that by catching the throw and breaking the same way.
  const pollStatus = useCallback(
    async (
      fileId: string,
      interval = 1500,
      maxWait = 30_000,
    ): Promise<PollResult> => {
      const deadline = Date.now() + maxWait;

      while (Date.now() < deadline) {
        let data: PollResult;
        try {
          data = await authFetch<PollResult>(`/api/docs/${fileId}/status`);
        } catch {
          break;
        }

        if (
          data.processingStatus !== "processing" &&
          data.processingStatus !== "pending"
        ) {
          return data;
        }

        // Wait before next poll
        await new Promise<void>((r) => setTimeout(r, interval));
      }

      // Timed out — return whatever we have
      return {
        processingStatus: "processing",
        availableFormats: ["original"],
      };
    },
    [],
  );

  // ── Get download URL ──────────────────────────────────────────────────────
  const getDownloadUrl = useCallback(
    async (
      fileId: string,
      format = "original",
    ): Promise<DownloadUrlResult | null> => {
      try {
        return await authFetch<DownloadUrlResult>(
          `/api/docs/${fileId}/url?format=${format}`,
        );
      } catch {
        return null;
      }
    },
    [],
  );

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteDoc = useCallback(async (fileId: string): Promise<boolean> => {
    try {
      await authFetch(`/api/docs/${fileId}`, { method: "DELETE" });
      fileCache.current.delete(fileId);
      return true;
    } catch {
      return false;
    }
  }, []);

  // ── Fetch file metadata ───────────────────────────────────────────────────
  const fetchFile = useCallback(
    async (fileId: string): Promise<FileDocument | null> => {
      // Return cached version if available
      if (fileCache.current.has(fileId)) {
        return fileCache.current.get(fileId)!;
      }

      try {
        const data = await authFetch<{ file: FileDocument }>(
          `/api/docs/${fileId}`,
        );
        fileCache.current.set(fileId, data.file);
        return data.file;
      } catch {
        return null;
      }
    },
    [],
  );

  const clearUploadError = useCallback(() => setUploadError(null), []);

  return (
    <DocContext.Provider
      value={{
        uploadDoc,
        pollStatus,
        getDownloadUrl,
        deleteDoc,
        fetchFile,
        uploadProgress,
        uploading,
        uploadError,
        clearUploadError,
      }}
    >
      {children}
    </DocContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDoc(): DocContextType {
  const ctx = useContext(DocContext);
  if (!ctx) throw new Error("useDoc must be used within a DocProvider");
  return ctx;
}
