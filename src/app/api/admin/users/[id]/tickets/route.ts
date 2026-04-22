// GET /api/admin/users/[id]/tickets
// Admin/webmaster only. Returns paginated tickets for a specific user.
// Reuses same pipeline shape as GET /api/admin/tickets.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const GET = withAuth(
  async (
    req: AuthenticatedRequest,
    context?: {
      params?: Promise<Record<string, string>> | Record<string, string>;
    },
  ) => {
    try {
      if (req.auth.role !== "admin" && req.auth.role !== "webmaster") {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 },
        );
      }

      const params = context?.params
        ? await Promise.resolve(context.params)
        : {};
      const userId = params.id as string;

      if (!userId || !ObjectId.isValid(userId)) {
        return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
      }

      const { searchParams } = new URL(req.url);
      const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
      const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "10"));
      const skip = (page - 1) * limit;

      const db = await getDb();

      // Resolve userData._id from vaultId
      // AdminUser.id is the userData._id (not vaultId) — confirm via users route
      const userObjectId = new ObjectId(userId);

      const pipeline: object[] = [
        { $match: { userId: userObjectId } },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "_event",
          },
        },
        { $unwind: { path: "$_event", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "ticketTypes",
            localField: "ticketTypeId",
            foreignField: "_id",
            as: "_ticketType",
          },
        },
        { $unwind: { path: "$_ticketType", preserveNullAndEmptyArrays: true } },
      ];

      const projectStage = {
        $project: {
          _id: 0,
          id: { $toString: "$_id" },
          inviteCode: 1,
          status: 1,
          registeredAt: 1,
          checkedInAt: 1,
          createdAt: 1,
          eventId: { $toString: "$eventId" },
          eventTitle: { $ifNull: ["$_event.title", "Unknown Event"] },
          eventDate: { $ifNull: ["$_event.eventDate", null] },
          eventSlug: { $ifNull: ["$_event.slug", ""] },
          eventFormat: { $ifNull: ["$_event.format", ""] },
          eventStatus: { $ifNull: ["$_event.status", ""] },
          ticketTypeName: { $ifNull: ["$_ticketType.name", "General"] },
          ticketTypePrice: { $ifNull: ["$_ticketType.price", 0] },
          ticketTypeCurrency: { $ifNull: ["$_ticketType.currency", "NGN"] },
        },
      };

      const countPipeline = [...pipeline, { $count: "total" }];
      const [countResult] = await Collections.eventRegistrations(db)
        .aggregate(countPipeline)
        .toArray();
      const total = countResult?.total ?? 0;

      pipeline.push(
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        projectStage,
      );

      const tickets = await Collections.eventRegistrations(db)
        .aggregate(pipeline)
        .toArray();

      return NextResponse.json({
        tickets,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      });
    } catch (err) {
      console.error("[GET /api/admin/users/[id]/tickets]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
