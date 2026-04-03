import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { ReferralEventType } from "@/lib/models/ReferralEvent";
import { ReferralResourceType } from "@/lib/models/ReferralLink";

const VALID_EVENT_TYPES: ReferralEventType[] = [
  "share",
  "click",
  "register",
  "calendar_add",
  "ticket_pdf_download",
];
const VALID_RESOURCE_TYPES: ReferralResourceType[] = [
  "event",
  "ticket",
  "page",
  "other",
];

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const code = String(body.code ?? "").trim();
    const eventType = body.eventType as ReferralEventType;
    const resourceType = body.resourceType as ReferralResourceType;
    const resourceId = String(body.resourceId ?? "").trim();
    const metadata =
      typeof body.metadata === "object" && body.metadata !== null
        ? (body.metadata as Record<string, unknown>)
        : undefined;

    if (
      !code ||
      !resourceId ||
      !VALID_EVENT_TYPES.includes(eventType) ||
      !VALID_RESOURCE_TYPES.includes(resourceType)
    ) {
      return NextResponse.json(
        { error: "code, eventType, resourceType and resourceId are required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const actorVaultId = new ObjectId(req.auth.vaultId);

    const link = await Collections.referralLinks(db).findOne({
      code,
      resourceType,
      resourceId,
      isActive: true,
    });
    if (!link) {
      return NextResponse.json(
        { error: "Referral link not found for this resource" },
        { status: 404 },
      );
    }

    await Collections.referralEvents(db).insertOne({
      code,
      ownerVaultId: link.ownerVaultId,
      actorVaultId,
      eventType,
      resourceType,
      resourceId,
      metadata,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/referrals/event]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

