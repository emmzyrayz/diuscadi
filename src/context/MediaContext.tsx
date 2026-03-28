// context/MediaContext.tsx
"use client";

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

const MediaContext = createContext<MediaContextType | undefined>(undefined);

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

// Shape of what Cloudinary returns on a successful upload
interface CloudinaryUploadResponse {
  asset_id: string;
  public_id: string;
  secure_url: string;
  signature: string;
  timestamp: number;
  format: string;
  bytes: number;
  width: number;
  height: number;
  created_at: string;
  etag: string;
  // Present when Cloudinary itself returns an error with a 200 status
  error?: { message: string };
}

export function MediaProvider({ children }: { children: ReactNode }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  const uploadToCloudinary = useCallback(
    async (
      file: Blob | File,
      params: SignedUploadParams,
    ): Promise<CloudinaryUploadResponse> => {
      const form = new FormData();
      // Use a proper filename — Cloudinary uses this for format detection
      const filename =
        file instanceof File ? file.name : `upload_${Date.now()}.webp`;

      form.append("file", file, filename);
      form.append("api_key", params.apiKey);
      form.append("timestamp", String(params.timestamp));
      form.append("signature", params.signature);
      form.append("folder", params.folder);
      form.append("public_id", params.publicId);
      // Only append eager if it was included in the signature
      if (params.eager) {
        form.append("eager", params.eager);
      }

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`,
        { method: "POST", body: form },
      );

      const data = (await res.json()) as CloudinaryUploadResponse;

      // Cloudinary can return 200 with an error body — check explicitly
      if (!res.ok || data.error) {
        throw new Error(
          data.error?.message ?? `Cloudinary upload failed (${res.status})`,
        );
      }
      
      // Cloudinary does NOT echo timestamp back — inject it from signed params
    if (!data.timestamp) {
      data.timestamp = params.timestamp;
    }

      // Validate all fields the confirm route requires are actually present
      const required: (keyof CloudinaryUploadResponse)[] = [
        "asset_id",
        "public_id",
        "secure_url",
        "signature",
        "timestamp",
        "format",
        "bytes",
        "width",
        "height",
        "created_at",
        "etag",
      ];
      const missing = required.filter(
        (k) => data[k] === undefined || data[k] === null,
      );
      if (missing.length > 0) {
        throw new Error(
          `Cloudinary response missing fields: ${missing.join(", ")}`,
        );
      }

      return data;
    },
    [],
  );

  const confirmUpload = useCallback(
    async (
      uploadType: UploadType,
      cloudinaryResponse: CloudinaryUploadResponse,
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
          // Spread only the fields confirm route needs — avoids noise
          asset_id: cloudinaryResponse.asset_id,
          public_id: cloudinaryResponse.public_id,
          secure_url: cloudinaryResponse.secure_url,
          signature: cloudinaryResponse.signature,
          timestamp: cloudinaryResponse.timestamp,
          format: cloudinaryResponse.format,
          bytes: cloudinaryResponse.bytes,
          width: cloudinaryResponse.width,
          height: cloudinaryResponse.height,
          created_at: cloudinaryResponse.created_at,
          etag: cloudinaryResponse.etag,
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
        console.error("[MediaContext] uploadImage error:", msg);
        setUploadError(msg);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [fetchSignedParams, uploadToCloudinary, confirmUpload],
  );

  const removeImage = useCallback(
    async (
      uploadType: UploadType,
      publicId: string,
      ownerId?: string,
      galleryImageId?: string,
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
        console.error("[MediaContext] removeImage error:", msg);
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

export function useMedia(): MediaContextType {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error("useMedia must be used within a MediaProvider");
  return ctx;
}
