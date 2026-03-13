// lib/services/cloudinaryService.ts
//
// Server-only. Never import this in client components.
// Handles Cloudinary signed upload parameter generation and asset deletion.
//
// Upload flow:
//   1. Client calls POST /api/media/sign with { uploadType, fileName }
//   2. This service generates signed params (timestamp + signature)
//   3. Client POSTs directly to Cloudinary using those params
//   4. Cloudinary returns { secure_url, public_id }
//   5. Client calls POST /api/media/confirm to persist the URL to the DB
//
// Why signed uploads?
//   - API secret never leaves the server
//   - We control folder structure, transformations, and file size limits
//   - Unsigned uploads require a public upload preset (less secure)

import crypto from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UploadType = "avatar" | "event-banner" | "org-logo";

export interface SignedUploadParams {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  publicId: string;
  // Eager transformation applied server-side by Cloudinary after upload
  eager: string;
  // Max file size enforced by Cloudinary (bytes)
  maxFileSize: number;
}

// ─── Env validation ───────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

// ─── Transformation presets ───────────────────────────────────────────────────
// These are applied by Cloudinary AFTER the upload (eager transforms).
// The client also crops before uploading — this is a server-side safety net
// to ensure consistent output dimensions and format regardless of client behaviour.

const TRANSFORM_PRESETS: Record<
  UploadType,
  {
    eager: string; // Cloudinary eager transformation string
    folder: string; // Storage folder in Cloudinary
    maxFileSize: number; // Bytes — enforced by Cloudinary
  }
> = {
  // Square crop, face-detect gravity, 400×400 webp — profile pictures
  avatar: {
    eager: "c_fill,g_face,w_400,h_400,f_webp,q_auto:good",
    folder: "diuscadi/avatars",
    maxFileSize: 5 * 1024 * 1024, // 5 MB
  },
  // Wide crop, 1200×630 (OG image ratio), webp — event banners
  "event-banner": {
    eager: "c_fill,w_1200,h_630,f_webp,q_auto:good",
    folder: "diuscadi/events",
    maxFileSize: 10 * 1024 * 1024, // 10 MB
  },
  // Pad (no crop — preserves logo ratio), 400×400, white bg, webp
  "org-logo": {
    eager: "c_pad,w_400,h_400,b_white,f_webp,q_auto:good",
    folder: "diuscadi/logos",
    maxFileSize: 3 * 1024 * 1024, // 3 MB
  },
};

// ─── Public ID generator ──────────────────────────────────────────────────────
// Deterministic per owner so re-uploads overwrite the previous asset
// (no orphaned files accumulating in Cloudinary).
//
// Pattern: diuscadi/{type}/{ownerId}_{timestamp}
// The timestamp suffix prevents browser caching the old image at the same URL.

function buildPublicId(type: UploadType, ownerId: string): string {
  const preset = TRANSFORM_PRESETS[type];
  const timestamp = Date.now();
  return `${preset.folder}/${ownerId}_${timestamp}`;
}

// ─── Signature ────────────────────────────────────────────────────────────────
// Cloudinary signature algorithm:
//   SHA1( "eager=...&folder=...&public_id=...&timestamp=..." + API_SECRET )
// Parameters must be sorted alphabetically and joined with &.

function sign(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(sorted + apiSecret)
    .digest("hex");
}

// ─── Main exports ─────────────────────────────────────────────────────────────

/**
 * Generate signed upload parameters for a direct client-to-Cloudinary upload.
 * Call from POST /api/media/sign.
 *
 * @param uploadType  - "avatar" | "event-banner" | "org-logo"
 * @param ownerId     - vaultId or entity id — used to build the public_id
 */
export function generateSignedParams(
  uploadType: UploadType,
  ownerId: string,
): SignedUploadParams {
  const apiKey = requireEnv("CLOUDINARY_API_KEY");
  const apiSecret = requireEnv("CLOUDINARY_API_SECRET");
  const cloudName = requireEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");

  const preset = TRANSFORM_PRESETS[uploadType];
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = buildPublicId(uploadType, ownerId);

  const paramsToSign: Record<string, string | number> = {
    eager: preset.eager,
    folder: preset.folder,
    public_id: publicId,
    timestamp,
  };

  const signature = sign(paramsToSign, apiSecret);

  return {
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder: preset.folder,
    publicId,
    eager: preset.eager,
    maxFileSize: preset.maxFileSize,
  };
}

/**
 * Delete a Cloudinary asset by its public_id.
 * Call from DELETE /api/media/remove.
 *
 * Returns true if deleted, false if not found.
 */
export async function deleteCloudinaryAsset(
  publicId: string,
): Promise<boolean> {
  const apiKey = requireEnv("CLOUDINARY_API_KEY");
  const apiSecret = requireEnv("CLOUDINARY_API_SECRET");
  const cloudName = requireEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");

  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign: Record<string, string | number> = {
    public_id: publicId,
    timestamp,
  };

  const signature = sign(paramsToSign, apiSecret);

  const body = new URLSearchParams({
    public_id: publicId,
    signature,
    api_key: apiKey,
    timestamp: String(timestamp),
  });

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    { method: "POST", body },
  );
  const data = (await res.json()) as { result?: string };

  return data.result === "ok";
}

/**
 * Extract the public_id from a Cloudinary secure_url.
 * Used when we need to delete the old asset before setting a new one.
 *
 * e.g. https://res.cloudinary.com/{cloud}/image/upload/v.../diuscadi/avatars/abc_123
 *   → "diuscadi/avatars/abc_123"
 */
export function extractPublicId(secureUrl: string): string | null {
  try {
    const url = new URL(secureUrl);
    const parts = url.pathname.split("/");
    // pathname: /image/upload/v{version}/{...publicId}
    const uploadIdx = parts.indexOf("upload");
    if (uploadIdx === -1) return null;
    // Skip the version segment (starts with "v" + digits)
    const afterUpload = parts.slice(uploadIdx + 1);
    const start = afterUpload[0]?.match(/^v\d+$/) ? 1 : 0;
    // Remove file extension from last segment
    const last = afterUpload[afterUpload.length - 1].replace(/\.[^.]+$/, "");
    afterUpload[afterUpload.length - 1] = last;
    return afterUpload.slice(start).join("/");
  } catch {
    return null;
  }
}
