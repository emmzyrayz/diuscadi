// DELETE /api/events/register/[id]
// Auth required. Cancels the authenticated user's registration.
// [id] is the eventRegistration._id
// Rules: cannot cancel if event has already started or if already checked-in.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const DELETE = withAuth(
  async (
    req: AuthenticatedRequest,
    context?: {
      params?: Promise<Record<string, string>> | Record<string, string>;
    },
  ) => {
    try {
      const params = context?.params
        ? await Promise.resolve(context.params)
        : {};
      const registrationId = params.id as string;

      if (!registrationId || !ObjectId.isValid(registrationId)) {
        return NextResponse.json(
          { error: "Invalid registration ID" },
          { status: 400 },
        );
      }

      const db = await getDb();
      const vaultId = new ObjectId(req.auth.vaultId);
      const now = new Date();

      const userData = await Collections.userData(db).findOne(
        { vaultId },
        { projection: { _id: 1 } },
      );
      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const registration = await Collections.eventRegistrations(db).findOne({
        _id: new ObjectId(registrationId),
        userId: userData._id as ObjectId,
      });

      if (!registration) {
        return NextResponse.json(
          { error: "Registration not found" },
          { status: 404 },
        );
      }
      if (registration.status === "cancelled") {
        return NextResponse.json(
          { error: "Registration is already cancelled" },
          { status: 400 },
        );
      }
      if (registration.status === "checked-in") {
        return NextResponse.json(
          { error: "Cannot cancel after check-in" },
          { status: 400 },
        );
      }

      // Cannot cancel after event has started
      const event = await Collections.events(db).findOne({
        _id: registration.eventId,
      });
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      if (event.eventDate <= now) {
        return NextResponse.json(
          { error: "Cannot cancel after the event has started" },
          { status: 400 },
        );
      }

      await Collections.eventRegistrations(db).updateOne(
        { _id: new ObjectId(registrationId) },
        { $set: { status: "cancelled", updatedAt: now } },
      );

      // Decrement analytics
      await Collections.userData(db).updateOne(
        { _id: userData._id as ObjectId },
        {
          $inc: { "analytics.eventsRegistered": -1 },
          $set: { updatedAt: now },
        },
      );

      return NextResponse.json({
        message: "Registration cancelled successfully",
      });
    } catch (err) {
      console.error("[DELETE /api/events/register/[id]]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
