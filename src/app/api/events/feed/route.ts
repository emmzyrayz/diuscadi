// app/api/events/feed/route.ts
// GET /api/events/feed
// Returns a personalized, filtered list of published upcoming events.
// Filtering happens entirely in MongoDB — no in-memory filtering.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { Filter } from "mongodb";
import { EventDocument } from "@/lib/models/Events";
import { ObjectId } from "mongodb";

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);
    const now = new Date();

    // ── Fetch user profile for personalization ────────────────────────────────
    const userData = await Collections.userData(db).findOne({ vaultId });
    if (!userData) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 404 },
      );
    }

    // ── Build personalized MongoDB filter ─────────────────────────────────────
    // Base: only published events with open registration and future event date
    const filter: Filter<EventDocument> = {
      status: "published",
      registrationDeadline: { $gt: now },
      eventDate: { $gt: now },
    };

    // EduStatus targeting
    // Show events targeting "all", or events specifically targeting the user's status
    if (userData.eduStatus) {
      filter["$or"] = [
        { targetEduStatus: "ALL" },
        { targetEduStatus: userData.eduStatus },
      ];
    }

    // Skills matching (optional boost — show events matching any of user's skills,
    // plus events with no required skills)
    if (userData.skills?.length > 0) {
      filter["$or"] = [
        ...(filter["$or"] ?? []),
        { requiredSkills: { $size: 0 } },
        { requiredSkills: { $in: userData.skills } },
      ];
    }

    // Parse pagination
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") ?? "20"));
    const skip = (page - 1) * limit;

    // ── Fetch events + slot counts in a single aggregation ────────────────────
    const pipeline = [
      { $match: filter },

      // Count active registrations per event (for slotsRemaining)
      {
        $lookup: {
          from: "eventRegistrations",
          let: { eventId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$eventId", "$$eventId"] },
                    { $ne: ["$status", "cancelled"] },
                  ],
                },
              },
            },
            { $count: "total" },
          ],
          as: "registrationCount",
        },
      },

      // Attach free ticket type (price info)
      {
        $lookup: {
          from: "ticketTypes",
          localField: "_id",
          foreignField: "eventId",
          as: "ticketTypes",
        },
      },

      // Check if current user is already registered
      {
        $lookup: {
          from: "eventRegistrations",
          let: { eventId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$eventId", "$$eventId"] },
                    { $eq: ["$userId", userData._id] },
                    { $ne: ["$status", "cancelled"] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "userRegistration",
        },
      },

      {
        $addFields: {
          registeredCount: {
            $ifNull: [{ $arrayElemAt: ["$registrationCount.total", 0] }, 0],
          },
          slotsRemaining: {
            $subtract: [
              "$capacity",
              {
                $ifNull: [{ $arrayElemAt: ["$registrationCount.total", 0] }, 0],
              },
            ],
          },
          isRegistered: { $gt: [{ $size: "$userRegistration" }, 0] },
          ticketType: { $arrayElemAt: ["$ticketTypes", 0] },
        },
      },

      { $unset: ["registrationCount", "userRegistration", "ticketTypes"] },
      { $sort: { eventDate: 1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const [events, total] = await Promise.all([
      Collections.events(db).aggregate(pipeline).toArray(),
      Collections.events(db).countDocuments(filter),
    ]);

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (err) {
    console.error("[GET /api/events/feed]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

export const GET = withAuth(handler);
