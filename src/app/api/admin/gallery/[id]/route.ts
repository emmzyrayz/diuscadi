import { NextResponse } from "next/server";
import {
  withAuth,
  AuthenticatedRequest,
  resolveParams,
} from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { Collections } from "@/lib/db/collections";
import { deleteCloudinaryAsset } from "@/lib/services/CloudinaryService";

const ALLOWED_ROLES = ["admin", "webmaster"];

export const PATCH = withAuth(async (req: AuthenticatedRequest, context) => {
  if (!ALLOWED_ROLES.includes(req.auth.role)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const { id } = await resolveParams(context);
    const db = await getDb();
    const body = await req.json();

    const $set: Record<string, unknown> = {
      updatedAt: new Date(),
      updatedBy: new ObjectId(req.auth.vaultId),
    };

    const allowedFields = [
      "caption",
      "category",
      "eventId",
      "featured",
      "published",
      "order",
      "youtubeUrl",
      "youtubeId",
    ];

    for (const field of allowedFields) {
      if (field in body) {
        if (field === "eventId") {
          $set[field] = body[field] ? new ObjectId(body[field]) : null;
        } else {
          $set[field] = body[field];
        }
      }
    }

    const result = await Collections.gallery(db).updateOne(
      { _id: new ObjectId(id) },
      { $set },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/admin/gallery/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

export const DELETE = withAuth(async (req: AuthenticatedRequest, context) => {
  if (!ALLOWED_ROLES.includes(req.auth.role)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const { id } = await resolveParams(context);
    const db = await getDb();
    const item = await Collections.gallery(db).findOne({
      _id: new ObjectId(id),
    });

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete from Cloudinary if it's an image
    if (item.mediaType === "image" && item.imagePublicId) {
      await deleteCloudinaryAsset(item.imagePublicId).catch(() =>
        console.warn(
          "[gallery/delete] Failed to delete Cloudinary asset:",
          item.imagePublicId,
        ),
      );
    }

    await Collections.gallery(db).deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/gallery/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
