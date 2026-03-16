// app/api/media/sign/route.ts
//
// Generates signed Cloudinary upload parameters for direct client uploads.
// The API secret never leaves the server.
//
// Request:  POST { uploadType: UploadType, ownerId?: string }
// Response: SignedUploadParams
//
// ownerId defaults to req.auth.vaultId for user-owned types (avatar).
// For entity-owned types (event-*, inst-*) the caller must pass an explicit
// ownerId — the event ObjectId/slug or institution ObjectId.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import {
  generateSignedParams,
  isValidUploadType,
  allowedRolesForType,
} from "@/lib/services/CloudinaryService";

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = (await req.json()) as {
      uploadType?: unknown;
      ownerId?: unknown;
    };

    // ── Validate uploadType ───────────────────────────────────────────────────
    if (!isValidUploadType(body.uploadType)) {
      return NextResponse.json(
        { error: "Invalid or missing uploadType" },
        { status: 400 },
      );
    }
    const uploadType = body.uploadType;

    // ── Role guard ────────────────────────────────────────────────────────────
    // Fetch the vault to get the canonical role — req.auth.role mirrors it but
    // we re-fetch here to be sure it hasn't been revoked mid-session.
    const db = await getDb();
    const vault = await Collections.vault(db).findOne({
      _id: new ObjectId(req.auth.vaultId),
    });

    if (!vault) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const allowed = allowedRolesForType(uploadType);
    if (!allowed.includes(vault.role as string)) {
      return NextResponse.json(
        {
          error: `Upload type "${uploadType}" requires one of: ${allowed.join(", ")}`,
        },
        { status: 403 },
      );
    }

    // ── Resolve ownerId ───────────────────────────────────────────────────────
    // avatar     → always the authenticated user's vaultId
    // everything else → caller must supply an explicit ownerId
    let ownerId: string;

    if (uploadType === "avatar") {
      ownerId = req.auth.vaultId;
    } else {
      if (
        typeof body.ownerId !== "string" ||
        body.ownerId.trim().length === 0
      ) {
        return NextResponse.json(
          { error: `ownerId is required for uploadType "${uploadType}"` },
          { status: 400 },
        );
      }
      ownerId = body.ownerId.trim();
    }

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
