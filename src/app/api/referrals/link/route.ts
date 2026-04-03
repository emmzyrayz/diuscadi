import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { ReferralResourceType } from "@/lib/models/ReferralLink";

function makeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

const VALID_RESOURCE_TYPES: ReferralResourceType[] = [
  "event",
  "ticket",
  "page",
  "other",
];

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const resourceType = body.resourceType as ReferralResourceType;
    const resourceId = String(body.resourceId ?? "").trim();
    const path = String(body.path ?? "/").trim() || "/";
    const title = body.title ? String(body.title).trim() : undefined;
    const parentCodeRaw = body.parentCode ? String(body.parentCode).trim() : "";
    const parentCode = parentCodeRaw || undefined;

    if (!VALID_RESOURCE_TYPES.includes(resourceType) || !resourceId) {
      return NextResponse.json(
        { error: "resourceType and resourceId are required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const ownerVaultId = new ObjectId(req.auth.vaultId);
    const now = new Date();

    const existing = await Collections.referralLinks(db).findOne({
      ownerVaultId,
      resourceType,
      resourceId,
      isActive: true,
    });
    if (existing) {
      return NextResponse.json({
        link: {
          id: existing._id!.toString(),
          code: existing.code,
          path: existing.path,
          resourceType: existing.resourceType,
          resourceId: existing.resourceId,
          title: existing.title ?? null,
        },
      });
    }

    let code = "";
    for (let i = 0; i < 8; i++) {
      const candidate = makeCode();
      const clash = await Collections.referralLinks(db).findOne({ code: candidate });
      if (!clash) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      return NextResponse.json(
        { error: "Could not allocate referral code" },
        { status: 500 },
      );
    }

    const { insertedId } = await Collections.referralLinks(db).insertOne({
      code,
      ownerVaultId,
      resourceType,
      resourceId,
      path,
      title,
      parentCode,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        link: {
          id: insertedId.toString(),
          code,
          path,
          resourceType,
          resourceId,
          title: title ?? null,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/referrals/link]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

