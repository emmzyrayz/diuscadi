import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { BroadcastFilter } from "@/types/broadcast";
import { ObjectId } from "mongodb";
import {
  buildAudienceQuery,
  buildPostLookupMatch,
} from "@/lib/broadcast/audienceQuery";

const ALLOWED_ROLES = ["admin", "webmaster"];

interface PreviewDoc {
  _id: ObjectId;
  email: string | null;
  fullName: string;
}

// ─── POST /api/admin/broadcast/preview ───────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  if (!ALLOWED_ROLES.includes(req.auth.role)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const { filter } = body as { filter: BroadcastFilter };

    if (!filter?.audience) {
      return NextResponse.json(
        { error: "Audience filter is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const preMatch = buildAudienceQuery(filter);
    const postMatch = buildPostLookupMatch(filter);

    const pipeline = [
      { $match: preMatch },
      {
        $lookup: {
          from: "vault",
          localField: "vaultId",
          foreignField: "_id",
          as: "_vault",
        },
      },
      { $unwind: { path: "$_vault", preserveNullAndEmptyArrays: true } },
      ...(postMatch ? [{ $match: postMatch }] : []),
      {
        $project: {
          _id: 1,
          email: "$_vault.email",
          fullName: 1,
        },
      },
      { $limit: 100 },
    ];

    const users = await Collections.userData(db)
      .aggregate<PreviewDoc>(pipeline)
      .toArray();

    const totalCount = await Collections.userData(db).countDocuments(preMatch);

    const preview = users.slice(0, 10).map((u) => ({
      email: u.email,
      fullName: u.fullName,
      userId: u._id.toString(),
    }));

    const recipients = users.map((u) => ({
      email: u.email,
      fullName: u.fullName,
      userId: u._id.toString(),
    }));

    return NextResponse.json({
      recipients,
      totalCount,
      preview,
      isLargeAudience: totalCount > 1000,
    });
  } catch (err) {
    console.error("[POST /api/admin/broadcast/preview]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
