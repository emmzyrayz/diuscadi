// app/api/media/confirm/route.ts
//
// Called by the client AFTER a successful Cloudinary upload.
// Persists the returned secure_url to the correct MongoDB field.
//
// Request:
//   POST {
//     uploadType: "avatar" | "event-banner" | "org-logo",
//     secureUrl:  string,   // from Cloudinary response
//     publicId:   string,   // from Cloudinary response — stored for future deletion
//     ownerId?:   string,   // required for event-banner and org-logo
//   }
//
// The route also deletes the previous Cloudinary asset (if any) so
// orphaned images don't accumulate.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import {
  UploadType,
  deleteCloudinaryAsset,
  extractPublicId,
} from "@/lib/services/CloudinaryService";

interface ConfirmBody {
  uploadType: UploadType;
  secureUrl: string;
  publicId: string;
  ownerId?: string;
}

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = (await req.json()) as Partial<ConfirmBody>;
    const { uploadType, secureUrl, publicId, ownerId } = body;

    if (!uploadType || !secureUrl || !publicId) {
      return NextResponse.json(
        { error: "uploadType, secureUrl and publicId are required" },
        { status: 400 },
      );
    }

    // Basic URL validation
    try {
      new URL(secureUrl);
    } catch {
      return NextResponse.json({ error: "Invalid secureUrl" }, { status: 400 });
    }

    const db = await getDb();

    // ── avatar ─────────────────────────────────────────────────────────────
    if (uploadType === "avatar") {
      const userData = await Collections.userData(db).findOne({
        vaultId: new ObjectId(req.auth.vaultId),
      });

      // Delete previous avatar from Cloudinary if it was a Cloudinary asset
      if (userData?.avatar) {
        const oldPublicId = extractPublicId(userData.avatar);
        if (oldPublicId) {
          await deleteCloudinaryAsset(oldPublicId).catch(() => {
            // Non-fatal — old asset cleanup failure shouldn't block the update
            console.warn(
              "[media/confirm] Failed to delete old avatar:",
              oldPublicId,
            );
          });
        }
      }

      await Collections.userData(db).updateOne(
        { vaultId: new ObjectId(req.auth.vaultId) },
        {
          $set: {
            avatar: secureUrl,
            updatedAt: new Date(),
          },
        },
      );

      return NextResponse.json({ secureUrl, publicId });
    }

    // ── event-banner ───────────────────────────────────────────────────────
    if (uploadType === "event-banner") {
      if (!ownerId) {
        return NextResponse.json(
          { error: "ownerId (event slug or id) required for event-banner" },
          { status: 400 },
        );
      }

      // Must be admin or webmaster to update event images
      const vault = await Collections.vault(db).findOne({
        _id: new ObjectId(req.auth.vaultId),
      });
      if (!vault || !["admin", "webmaster"].includes(vault.role as string)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Find event by slug or ObjectId
      const query = ObjectId.isValid(ownerId)
        ? { _id: new ObjectId(ownerId) }
        : { slug: ownerId };

      const event = await Collections.events(db).findOne(query);
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      // Delete old banner
      if (event.image) {
        const oldPublicId = extractPublicId(event.image);
        if (oldPublicId) {
          await deleteCloudinaryAsset(oldPublicId).catch(() => {
            console.warn(
              "[media/confirm] Failed to delete old event banner:",
              oldPublicId,
            );
          });
        }
      }

      await Collections.events(db).updateOne(query, {
        $set: { image: secureUrl, updatedAt: new Date() },
      });

      return NextResponse.json({ secureUrl, publicId });
    }

    // ── org-logo ───────────────────────────────────────────────────────────
    if (uploadType === "org-logo") {
      if (!ownerId) {
        return NextResponse.json(
          { error: "ownerId (institution id) required for org-logo" },
          { status: 400 },
        );
      }

      // Webmaster only
      const vault = await Collections.vault(db).findOne({
        _id: new ObjectId(req.auth.vaultId),
      });
      if (!vault || vault.role !== "webmaster") {
        return NextResponse.json(
          { error: "Forbidden — webmaster only" },
          { status: 403 },
        );
      }

      if (!ObjectId.isValid(ownerId)) {
        return NextResponse.json({ error: "Invalid ownerId" }, { status: 400 });
      }

      const institution = await Collections.institutions(db).findOne({
        _id: new ObjectId(ownerId),
      });
      if (!institution) {
        return NextResponse.json(
          { error: "Institution not found" },
          { status: 404 },
        );
      }

      // Delete old logo if stored
      const oldLogo = (institution as Record<string, unknown>).logo as
        | string
        | undefined;
      if (oldLogo) {
        const oldPublicId = extractPublicId(oldLogo);
        if (oldPublicId) {
          await deleteCloudinaryAsset(oldPublicId).catch(() => {
            console.warn(
              "[media/confirm] Failed to delete old logo:",
              oldPublicId,
            );
          });
        }
      }

      await Collections.institutions(db).updateOne(
        { _id: new ObjectId(ownerId) },
        { $set: { logo: secureUrl, updatedAt: new Date() } },
      );

      return NextResponse.json({ secureUrl, publicId });
    }

    return NextResponse.json(
      { error: "Unhandled uploadType" },
      { status: 400 },
    );
  } catch (err) {
    console.error("[POST /api/media/confirm]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
