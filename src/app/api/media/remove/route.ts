// app/api/media/remove/route.ts
//
// Deletes a Cloudinary asset by public_id.
// Used when a user removes their avatar without replacing it,
// or an admin removes an event banner.
//
// Request: DELETE { publicId: string, uploadType: UploadType }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import {
  UploadType,
  deleteCloudinaryAsset,
} from "@/lib/services/CloudinaryService";

export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = (await req.json()) as {
      publicId?: string;
      uploadType?: UploadType;
    };
    const { publicId, uploadType } = body;

    if (!publicId || !uploadType) {
      return NextResponse.json(
        { error: "publicId and uploadType are required" },
        { status: 400 },
      );
    }

    const db = await getDb();

    // ── avatar — any authenticated user can remove their own ───────────────
    if (uploadType === "avatar") {
      const deleted = await deleteCloudinaryAsset(publicId);

      if (deleted) {
        await Collections.userData(db).updateOne(
          { vaultId: new ObjectId(req.auth.vaultId) },
          { $unset: { avatar: "" }, $set: { updatedAt: new Date() } },
        );
      }

      return NextResponse.json({ deleted });
    }

    // ── event-banner / org-logo — admin/webmaster only ─────────────────────
    const vault = await Collections.vault(db).findOne({
      _id: new ObjectId(req.auth.vaultId),
    });
    if (!vault || !["admin", "webmaster"].includes(vault.role as string)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deleted = await deleteCloudinaryAsset(publicId);
    return NextResponse.json({ deleted });
  } catch (err) {
    console.error("[DELETE /api/media/remove]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
