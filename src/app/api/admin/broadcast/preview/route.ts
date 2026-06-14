// POST /api/admin/broadcast/preview
// Returns the first 10 matching recipients + total/account/guest counts.
// Uses resolveRecipients — same logic as the send route.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { BroadcastFilter } from "@/types/broadcast";
import { resolveRecipients } from "@/lib/broadcast/recipientResolver";

const ALLOWED_ROLES = ["admin", "webmaster"];

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
    const { recipients, accountCount, guestCount, total } =
      await resolveRecipients(db, filter);

    const preview = recipients.slice(0, 10).map((r) => ({
      email: r.email,
      fullName: r.fullName,
      type: r.type,
      userId: r.userId ?? null,
    }));

    return NextResponse.json({
      preview,
      totalCount: total,
      accountCount,
      guestCount,
      isLargeAudience: total > 1000,
    });
  } catch (err) {
    console.error("[POST /api/admin/broadcast/preview]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
