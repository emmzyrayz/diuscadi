// app/api/media/remove/route.ts
//
// Deletes a Cloudinary asset and clears the corresponding DB field.
//
// Request: DELETE {
//   uploadType:  UploadType,
//   publicId:    string,       // imagePublicId from the CloudinaryImage object
//   ownerId?:    string,       // required for non-avatar types
//   galleryImageId?: string,   // required for event-gallery — the CloudinaryImage.imageId
// }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import {
  isValidUploadType,
  allowedRolesForType,
  deleteCloudinaryAsset,
} from "@/lib/services/CloudinaryService";

export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = (await req.json()) as {
      uploadType?: unknown;
      publicId?: string;
      ownerId?: string;
      galleryImageId?: string; // CloudinaryImage.imageId — identifies gallery item to remove
    };

    const { publicId, ownerId, galleryImageId } = body;

    if (!isValidUploadType(body.uploadType)) {
      return NextResponse.json(
        { error: "Invalid or missing uploadType" },
        { status: 400 },
      );
    }
    const uploadType = body.uploadType;

    if (!publicId) {
      return NextResponse.json(
        { error: "publicId is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const vault = await Collections.vault(db).findOne({
      _id: new ObjectId(req.auth.vaultId),
    });

    if (!vault) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // ── Role guard ────────────────────────────────────────────────────────────
    const allowed = allowedRolesForType(uploadType);
    if (!allowed.includes(vault.role as string)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── avatar ────────────────────────────────────────────────────────────────
    if (uploadType === "avatar") {
      const deleted = await deleteCloudinaryAsset(publicId);

      if (deleted) {
        await Collections.userData(db).updateOne(
          { vaultId: new ObjectId(req.auth.vaultId) },
          {
            $set: { hasAvatar: false, updatedAt: new Date() },
            $unset: { avatar: "" },
          },
        );
      }

      return NextResponse.json({ deleted });
    }

    // ── event-logo ────────────────────────────────────────────────────────────
    if (uploadType === "event-logo") {
      if (!ownerId) {
        return NextResponse.json(
          { error: "ownerId required for event-logo" },
          { status: 400 },
        );
      }

      const query = ObjectId.isValid(ownerId)
        ? { _id: new ObjectId(ownerId) }
        : { slug: ownerId };

      const deleted = await deleteCloudinaryAsset(publicId);

      if (deleted) {
        await Collections.events(db).updateOne(query, {
          $set: { hasEventLogo: false, updatedAt: new Date() },
          $unset: { eventLogo: "" },
        });
      }

      return NextResponse.json({ deleted });
    }

    // ── event-banner ──────────────────────────────────────────────────────────
    if (uploadType === "event-banner") {
      if (!ownerId) {
        return NextResponse.json(
          { error: "ownerId required for event-banner" },
          { status: 400 },
        );
      }

      const query = ObjectId.isValid(ownerId)
        ? { _id: new ObjectId(ownerId) }
        : { slug: ownerId };

      const deleted = await deleteCloudinaryAsset(publicId);

      if (deleted) {
        await Collections.events(db).updateOne(query, {
          $set: { hasEventBanner: false, updatedAt: new Date() },
          $unset: { eventBanner: "" },
        });
      }

      return NextResponse.json({ deleted });
    }

    // ── event-gallery ─────────────────────────────────────────────────────────
    // Removes one item from the gallery array by imageId.
    // If the gallery becomes empty, flips hasEventGallery back to false.
    if (uploadType === "event-gallery") {
      if (!ownerId) {
        return NextResponse.json(
          { error: "ownerId required for event-gallery" },
          { status: 400 },
        );
      }
      if (!galleryImageId) {
        return NextResponse.json(
          {
            error:
              "galleryImageId required to identify which gallery item to remove",
          },
          { status: 400 },
        );
      }

      const query = ObjectId.isValid(ownerId)
        ? { _id: new ObjectId(ownerId) }
        : { slug: ownerId };

      const deleted = await deleteCloudinaryAsset(publicId);

      if (deleted) {
        // Pull the specific item by its imageId
        await Collections.events(db).updateOne(query, {
          $pull: { eventGallery: { imageId: galleryImageId } },
          $set: { updatedAt: new Date() },
        });

        // Check if gallery is now empty — flip flag if so
        const updated = await Collections.events(db).findOne(query, {
          projection: { eventGallery: 1 },
        });
        if (!updated?.eventGallery?.length) {
          await Collections.events(db).updateOne(query, {
            $set: { hasEventGallery: false },
          });
        }
      }

      return NextResponse.json({ deleted });
    }

    // ── inst-logo ─────────────────────────────────────────────────────────────
    if (uploadType === "inst-logo") {
      if (!ownerId || !ObjectId.isValid(ownerId)) {
        return NextResponse.json(
          { error: "Valid ownerId required for inst-logo" },
          { status: 400 },
        );
      }

      const deleted = await deleteCloudinaryAsset(publicId);

      if (deleted) {
        await Collections.institutions(db).updateOne(
          { _id: new ObjectId(ownerId) },
          {
            $set: { hasLogo: false, updatedAt: new Date() },
            $unset: { logo: "" },
          },
        );
      }

      return NextResponse.json({ deleted });
    }

    // ── inst-banner ───────────────────────────────────────────────────────────
    if (uploadType === "inst-banner") {
      if (!ownerId || !ObjectId.isValid(ownerId)) {
        return NextResponse.json(
          { error: "Valid ownerId required for inst-banner" },
          { status: 400 },
        );
      }

      const deleted = await deleteCloudinaryAsset(publicId);

      if (deleted) {
        await Collections.institutions(db).updateOne(
          { _id: new ObjectId(ownerId) },
          {
            $set: { hasBanner: false, updatedAt: new Date() },
            $unset: { banner: "" },
          },
        );
      }

      return NextResponse.json({ deleted });
    }

    return NextResponse.json(
      { error: "Unhandled uploadType" },
      { status: 400 },
    );
  } catch (err) {
    console.error("[DELETE /api/media/remove]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
