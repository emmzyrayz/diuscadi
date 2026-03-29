// GET /api/events/[slug]
// Auth required. Returns full event detail by slug.
// Includes slot count, all ticket types, and the user's registration state.

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
      const params = context?.params
        ? await Promise.resolve(context.params)
        : {};
      const slug = params.slug as string;

      if (!slug) {
        return NextResponse.json(
          { error: "Event slug is required" },
          { status: 400 },
        );
      }

      const db = await getDb();
      const vaultId = new ObjectId(req.auth.vaultId);

      const userData = await Collections.userData(db).findOne(
        { vaultId },
        { projection: { _id: 1 } },
      );
      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const userDataId = userData._id as ObjectId;

      const pipeline = [
        { $match: { slug, status: "published" } },
        { $limit: 1 },

        // Count active registrations
        {
          $lookup: {
            from: "eventRegistrations",
            let: { eid: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$eventId", "$$eid"] },
                      { $ne: ["$status", "cancelled"] },
                    ],
                  },
                },
              },
              { $count: "total" },
            ],
            as: "regCount",
          },
        },

        // Check user's registration
        {
          $lookup: {
            from: "eventRegistrations",
            let: { eid: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$eventId", "$$eid"] },
                      { $eq: ["$userId", userDataId] },
                      { $ne: ["$status", "cancelled"] },
                    ],
                  },
                },
              },
              { $limit: 1 },
            ],
            as: "myReg",
          },
        },

        // All ticket types
        {
          $lookup: {
            from: "ticketTypes",
            localField: "_id",
            foreignField: "eventId",
            pipeline: [
              { $match: { isActive: true } },
              { $sort: { price: 1 as const } },
            ],
            as: "ticketTypes",
          },
        },

        {
          $addFields: {
            registeredCount: {
              $ifNull: [{ $arrayElemAt: ["$regCount.total", 0] }, 0],
            },
            slotsRemaining: {
              $max: [
                0,
                {
                  $subtract: [
                    "$capacity",
                    { $ifNull: [{ $arrayElemAt: ["$regCount.total", 0] }, 0] },
                  ],
                },
              ],
            },
            isRegistered: { $gt: [{ $size: "$myReg" }, 0] },
            myRegistration: { $arrayElemAt: ["$myReg", 0] },
          },
        },
        { $project: { regCount: 0, myReg: 0 } },
      ];

      const [event] = await Collections.events(db)
        .aggregate(pipeline)
        .toArray();
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      return NextResponse.json({
        event: {
          id: event._id!.toString(),
          slug: event.slug,
          title: event.title,
          overview: event.overview,
          learningOutcomes: event.learningOutcomes,
          category: event.category,
          tags: event.tags,
          level: event.level ?? null,
          format: event.format,
          location: event.location ?? null,
          instructor: event.instructor ?? null,
          eventDate: (event.eventDate as Date).toISOString(),
          endDate: event.endDate ? (event.endDate as Date).toISOString() : null,
          registrationDeadline: (
            event.registrationDeadline as Date
          ).toISOString(),
          duration: event.duration ?? null,
          capacity: event.capacity,
          registeredCount: event.registeredCount,
          slotsRemaining: event.slotsRemaining,
          image: event.image,
          targetEduStatus: event.targetEduStatus,
          requiredSkills: event.requiredSkills,
          locationScope: event.locationScope,
          isRegistered: event.isRegistered,
          myRegistrationId: event.myRegistration
            ? (event.myRegistration as Record<string, unknown>)._id!.toString()
            : null,
          ticketTypes: (
            event.ticketTypes as Array<Record<string, unknown>>
          ).map((t) => ({
            id: t._id!.toString(),
            name: t.name,
            price: t.price,
            currency: t.currency,
            maxQuantity: t.maxQuantity,
            availableFrom: t.availableFrom
              ? (t.availableFrom as Date).toISOString()
              : null,
            availableUntil: t.availableUntil
              ? (t.availableUntil as Date).toISOString()
              : null,
          })),
        },
      });
    } catch (err) {
      console.error("[GET /api/events/[slug]]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
