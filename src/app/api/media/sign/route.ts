// app/api/media/sign/route.ts
//
// Generates signed Cloudinary upload parameters for direct client uploads.
// The API secret never leaves the server.
//
// Request:  POST { uploadType: "avatar" | "event-banner" | "org-logo", ownerId?: string }
// Response: SignedUploadParams
//
// ownerId is optional — defaults to the authenticated user's vaultId.
// Admins pass an explicit ownerId when uploading on behalf of an entity
// (e.g. an event banner where ownerId = event slug).

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import {
  generateSignedParams,
  UploadType,
} from "@/lib/services/CloudinaryService";

const VALID_UPLOAD_TYPES: UploadType[] = ["avatar", "event-banner", "org-logo"];

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = (await req.json()) as {
      uploadType?: unknown;
      ownerId?: unknown;
    };

    const uploadType = body.uploadType as UploadType;
    if (!VALID_UPLOAD_TYPES.includes(uploadType)) {
      return NextResponse.json(
        {
          error: `Invalid uploadType. Must be one of: ${VALID_UPLOAD_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Default ownerId to the authenticated user's vaultId
    const ownerId =
      typeof body.ownerId === "string" && body.ownerId.length > 0
        ? body.ownerId
        : req.auth.vaultId;

    const params = generateSignedParams(uploadType, ownerId);

    return NextResponse.json(params);
  } catch (err) {
    console.error("[POST /api/media/sign]", err);
    return NextResponse.json(
      { error: "Failed to generate upload params" },
      { status: 500 },
    );
  }
});
