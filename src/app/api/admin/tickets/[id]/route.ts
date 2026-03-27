// PATCH /api/admin/tickets/[id]
// Admin/webmaster only. Cancel a ticket with a reason.
// Body: { action: "cancel", reason: string }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (req.auth.role !== "admin" && req.auth.role !== "webmaster") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Extract id from URL — withAuth doesn't support context params
    const segments = req.nextUrl?.pathname.split("/") ?? req.url.split("/");
    const rawId = segments[segments.length - 1];

    let ticketId: ObjectId;
    try {
      ticketId = new ObjectId(rawId);
    } catch {
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });
    }

    const { action, reason } = await req.json();

    if (action !== "cancel") {
      return NextResponse.json(
        { error: "Only 'cancel' action is supported" },
        { status: 400 },
      );
    }

    const db = await getDb();

    // Use only status values that exist in EventRegistrationDocument:
    // "registered" | "checked-in" | "cancelled"
    // "registered" is the equivalent of "upcoming" — not yet checked in
    const result = await Collections.eventRegistrations(db).updateOne(
      {
        _id: ticketId,
        status: {
          $nin: ["cancelled"] as ("registered" | "checked-in" | "cancelled")[],
        },
      },
      {
        $set: {
          status: "cancelled" as const,
          cancellationNote: reason ?? "Cancelled by admin",
          cancelledAt: new Date(),
          cancelledBy: new ObjectId(req.auth.vaultId),
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Ticket not found or already cancelled" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Ticket cancelled" });
  } catch (err) {
    console.error("[PATCH /api/admin/tickets/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
