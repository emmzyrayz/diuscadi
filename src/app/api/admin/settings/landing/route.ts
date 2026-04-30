import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import type {
  LandingSectionKey,
  LandingPageConfigDocument,
} from "@/lib/models/landingPageConfig";


const ALLOWED_ROLES = ["admin", "webmaster"];

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  if (!ALLOWED_ROLES.includes(req.auth.role)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const db = await getDb();
    const sections = await Collections.landingPageConfig(db).find({}).toArray();
    return NextResponse.json({ sections });
  } catch (err) {
    console.error("[GET /api/admin/settings/landing]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  if (!ALLOWED_ROLES.includes(req.auth.role)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const { sectionKey, data } = body as {
      sectionKey: LandingSectionKey;
      data: LandingPageConfigDocument["data"];
    };

    if (!sectionKey || !data) {
      return NextResponse.json(
        { error: "sectionKey and data required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();

    await Collections.landingPageConfig(db).updateOne(
      { sectionKey },
      {
        $set: { data, updatedBy: req.auth.vaultId, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/admin/settings/landing]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
