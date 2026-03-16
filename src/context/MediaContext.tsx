"use client";
// context/MediaContext.tsx
//
// Owns the Cloudinary upload pipeline:
//   1. POST /api/media/sign    → get signed params from server
//   2. POST to Cloudinary      → direct upload using signed params
//   3. POST /api/media/confirm → server assembles CloudinaryImage + persists to DB
//
// The context is a pure pipeline — it never assembles CloudinaryImage objects
// and never touches MongoDB. All DB logic lives in the confirm route.
//
// Public API:
//   uploadImage(file, uploadType, ownerId?, imageAlt?) → CloudinaryImage | null
//   removeImage(uploadType, publicId, ownerId?, galleryImageId?) → boolean
//   uploading: boolean
//   uploadError: string | null
//   clearUploadError: () => void

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type {
  UploadType,
  SignedUploadParams,
} from "@/lib/services/CloudinaryService";
import type { CloudinaryImage } from "@/types/cloudinary";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MediaContextType {
  uploading: boolean;
  uploadError: string | null;
  uploadImage: (
    file: Blob | File,
    uploadType: UploadType,
    ownerId?: string,
    imageAlt?: string,
  ) => Promise<CloudinaryImage | null>;
  removeImage: (
    uploadType: UploadType,
    publicId: string,
    ownerId?: string,
    galleryImageId?: string,
  ) => Promise<boolean>;
  clearUploadError: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const MediaContext = createContext<MediaContextType | undefined>(undefined);

// ─── Auth header helper ───────────────────────────────────────────────────────

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
    ): Promise<SignedUploadParams> => {
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
  // Returns the raw Cloudinary response — the confirm route will validate and
  // assemble the CloudinaryImage from it.
  const uploadToCloudinary = useCallback(
    async (
      file: Blob | File,
      params: SignedUploadParams,
    ): Promise<Record<string, unknown>> => {
      const form = new FormData();
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

      return res.json() as Promise<Record<string, unknown>>;
    },
    [],
  );

  // ── Step 3: confirm with our server ──────────────────────────────────────
  // Passes the raw Cloudinary response + metadata to the confirm route.
  // The confirm route assembles the CloudinaryImage and writes to DB.
  // Returns the assembled CloudinaryImage for the caller to use locally.
  const confirmUpload = useCallback(
    async (
      uploadType: UploadType,
      cloudinaryResponse: Record<string, unknown>,
      ownerId?: string,
      imageAlt?: string,
    ): Promise<CloudinaryImage> => {
      const res = await fetch("/api/media/confirm", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          uploadType,
          ownerId,
          imageAlt,
          // Spread the full Cloudinary response — confirm route picks what it needs
          ...cloudinaryResponse,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to confirm upload");
      }

      const data = (await res.json()) as { image: CloudinaryImage };
      return data.image;
    },
    [],
  );

  // ── Main upload function ───────────────────────────────────────────────────
  const uploadImage = useCallback(
    async (
      file: Blob | File,
      uploadType: UploadType,
      ownerId?: string,
      imageAlt?: string,
    ): Promise<CloudinaryImage | null> => {
      setUploading(true);
      setUploadError(null);

      try {
        const params = await fetchSignedParams(uploadType, ownerId);
        const cloudinaryResponse = await uploadToCloudinary(file, params);
        const image = await confirmUpload(
          uploadType,
          cloudinaryResponse,
          ownerId,
          imageAlt,
        );
        return image;
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
    async (
      uploadType: UploadType,
      publicId: string, // CloudinaryImage.imagePublicId
      ownerId?: string,
      galleryImageId?: string, // CloudinaryImage.imageId — for gallery items only
    ): Promise<boolean> => {
      setUploading(true);
      setUploadError(null);

      try {
        const res = await fetch("/api/media/remove", {
          method: "DELETE",
          headers: authHeaders(),
          body: JSON.stringify({
            uploadType,
            publicId,
            ownerId,
            galleryImageId,
          }),
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
