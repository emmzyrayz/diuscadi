// PATCH — update, toggle published, or edit fields
// DELETE — hard delete

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { Collections } from "@/lib/db/collections";

const ALLOWED_ROLES = ["admin", "webmaster"];

export const PATCH = withAuth(
  async (
    req: AuthenticatedRequest,
    context?: {
      params?: Promise<Record<string, string>> | Record<string, string>;
    },
  ) => {
    if (!ALLOWED_ROLES.includes(req.auth.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    try {
      const db = await getDb();
      const resolvedParams = await context?.params;
      const id = new ObjectId(resolvedParams?.id);
      const body = await req.json();

      const $set: Record<string, unknown> = {
        updatedAt: new Date(),
        updatedBy: new ObjectId(req.auth.vaultId),
      };

      const allowedFields = [
        "title",
        "desc",
        "type",
        "audience",
        "targetCommittee",
        "expiresAt",
        "ctaLabel",
        "ctaHref",
      ];

      for (const field of allowedFields) {
        if (field in body) {
          $set[field] =
            field === "expiresAt" && body[field]
              ? new Date(body[field])
              : (body[field] ?? null);
        }
      }

      // Handle publish toggle separately — set publishedAt on first publish
      if ("published" in body) {
        $set.published = Boolean(body.published);
        if (body.published) {
          // Only set publishedAt on first publish
          const existing = await Collections.announcements(db).findOne({
            _id: id,
          });
          if (existing && !existing.publishedAt) {
            $set.publishedAt = new Date();
          }
        }
      }

      const result = await Collections.announcements(db).updateOne(
        { _id: id },
        { $set },
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error("[PATCH /api/admin/settings/announcements/[id]]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);

export const DELETE = withAuth(
  async (
    req: AuthenticatedRequest,
    context?: {
      params?: Promise<Record<string, string>> | Record<string, string>;
    },
  ) => {
    if (!ALLOWED_ROLES.includes(req.auth.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    try {
      const db = await getDb();
      const resolvedParams = await context?.params;
      const id = new ObjectId(resolvedParams?.id);

      await Promise.all([
        Collections.announcements(db).deleteOne({ _id: id }),
        // Clean up read records for this announcement
        Collections.announcementReads(db).deleteMany({ announcementId: id }),
      ]);

      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error("[DELETE /api/admin/settings/announcements/[id]]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
