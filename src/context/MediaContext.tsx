"use client";
// context/MediaContext.tsx
//
// Owns the Cloudinary upload pipeline:
//   1. POST /api/media/sign    → get signed params from server
//   2. POST to Cloudinary      → direct upload with the signed params
//   3. POST /api/media/confirm → persist secure_url to MongoDB
//
// Exposes:
//   uploadImage(file, uploadType, ownerId?) → { secureUrl, publicId }
//   removeImage(publicId, uploadType)       → void
//   uploading: boolean
//   uploadError: string | null
//
// Components never talk to Cloudinary or the sign/confirm endpoints directly —
// they call uploadImage() and get back a URL. That's the entire public API.

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { UploadType } from "@/lib/services/CloudinaryService";
import type { SignedUploadParams } from "@/lib/services/CloudinaryService";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadResult {
  secureUrl: string;
  publicId: string;
}

interface MediaContextType {
  uploading: boolean;
  uploadError: string | null;
  uploadImage: (
    file: Blob | File,
    uploadType: UploadType,
    ownerId?: string,
  ) => Promise<UploadResult | null>;
  removeImage: (publicId: string, uploadType: UploadType) => Promise<boolean>;
  clearUploadError: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const MediaContext = createContext<MediaContextType | undefined>(undefined);

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("diuscadi_token");
}

function authHeaders(extra?: Record<string, string>): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MediaProvider({ children }: { children: ReactNode }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ── Step 1: get signed params ─────────────────────────────────────────────
  const fetchSignedParams = useCallback(
    async (
      uploadType: UploadType,
      ownerId?: string,
    ): Promise<SignedUploadParams | null> => {
      const res = await fetch("/api/media/sign", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ uploadType, ownerId }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to get upload params");
      }

      return res.json() as Promise<SignedUploadParams>;
    },
    [],
  );

  // ── Step 2: upload directly to Cloudinary ─────────────────────────────────
  const uploadToCloudinary = useCallback(
    async (
      file: Blob | File,
      params: SignedUploadParams,
    ): Promise<{ secure_url: string; public_id: string }> => {
      const form = new FormData();

      // Cloudinary requires a filename — use "upload.webp" as a sensible default
      // since the cropper always produces webp. For File objects, use their name.
      const filename = file instanceof File ? file.name : "upload.webp";
      form.append("file", file, filename);
      form.append("api_key", params.apiKey);
      form.append("timestamp", String(params.timestamp));
      form.append("signature", params.signature);
      form.append("folder", params.folder);
      form.append("public_id", params.publicId);
      form.append("eager", params.eager);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`,
        { method: "POST", body: form },
      );

      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        throw new Error(data.error?.message ?? "Cloudinary upload failed");
      }

      return res.json() as Promise<{ secure_url: string; public_id: string }>;
    },
    [],
  );

  // ── Step 3: confirm with our server ──────────────────────────────────────
  const confirmUpload = useCallback(
    async (
      uploadType: UploadType,
      secureUrl: string,
      publicId: string,
      ownerId?: string,
    ): Promise<void> => {
      const res = await fetch("/api/media/confirm", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ uploadType, secureUrl, publicId, ownerId }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to confirm upload");
      }
    },
    [],
  );

  // ── Main upload function ───────────────────────────────────────────────────
  const uploadImage = useCallback(
    async (
      file: Blob | File,
      uploadType: UploadType,
      ownerId?: string,
    ): Promise<UploadResult | null> => {
      setUploading(true);
      setUploadError(null);

      try {
        // 1. Sign
        const params = await fetchSignedParams(uploadType, ownerId);
        if (!params) throw new Error("No upload params returned");

        // 2. Upload
        const { secure_url, public_id } = await uploadToCloudinary(
          file,
          params,
        );

        // 3. Confirm
        await confirmUpload(uploadType, secure_url, public_id, ownerId);

        return { secureUrl: secure_url, publicId: public_id };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setUploadError(msg);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [fetchSignedParams, uploadToCloudinary, confirmUpload],
  );

  // ── Remove ────────────────────────────────────────────────────────────────
  const removeImage = useCallback(
    async (publicId: string, uploadType: UploadType): Promise<boolean> => {
      setUploading(true);
      setUploadError(null);

      try {
        const res = await fetch("/api/media/remove", {
          method: "DELETE",
          headers: authHeaders(),
          body: JSON.stringify({ publicId, uploadType }),
        });

        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "Failed to remove image");
        }

        const data = (await res.json()) as { deleted: boolean };
        return data.deleted;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Remove failed";
        setUploadError(msg);
        return false;
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  const clearUploadError = useCallback(() => setUploadError(null), []);

  return (
    <MediaContext.Provider
      value={{
        uploading,
        uploadError,
        uploadImage,
        removeImage,
        clearUploadError,
      }}
    >
      {children}
    </MediaContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMedia(): MediaContextType {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error("useMedia must be used within a MediaProvider");
  return ctx;
}
