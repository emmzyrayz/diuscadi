// GET /api/events/feed
// Auth required. Returns personalized paginated event feed filtered by
// the user's eduStatus and skills. Includes registration state per event.
// Query params: ?page=1&limit=10

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

const FALLBACK_IMAGE = "/images/events/default.jpg";

function resolveEventImage(e: Record<string, unknown>): string {
  if (
    e.hasEventBanner &&
    (e.eventBanner as Record<string, unknown>)?.imageUrl
  ) {
    return (e.eventBanner as Record<string, unknown>).imageUrl as string;
  }
  if (e.hasEventLogo && (e.eventLogo as Record<string, unknown>)?.imageUrl) {
    return (e.eventLogo as Record<string, unknown>).imageUrl as string;
  }
  return FALLBACK_IMAGE;
}

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(20, parseInt(searchParams.get("limit") ?? "10"));
    const skip = (page - 1) * limit;
    const now = new Date();

    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    const userData = await Collections.userData(db).findOne(
      { vaultId },
      { projection: { _id: 1, eduStatus: 1, skills: 1 } },
    );
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userDataId = userData._id as ObjectId;
    const eduStatus = userData.eduStatus as string;
    const skills = (userData.skills ?? []) as string[];

    const matchStage = {
      status: "published",
      eventDate: { $gt: now },
      registrationDeadline: { $gt: now },
      $or: [
        { targetEduStatus: "ALL" },
        { targetEduStatus: eduStatus },
        { requiredSkills: { $in: skills.length > 0 ? skills : ["__none__"] } },
      ],
    };

    const pipeline = [
      { $match: matchStage },
      { $sort: { eventDate: 1 as const } },
      {
        $facet: {
          total: [{ $count: "count" }],
          events: [
            { $skip: skip },
            { $limit: limit },
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
            {
              $lookup: {
                from: "ticketTypes",
                localField: "_id",
                foreignField: "eventId",
                pipeline: [{ $match: { isActive: true } }],
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
                        {
                          $ifNull: [
                            { $arrayElemAt: ["$regCount.total", 0] },
                            0,
                          ],
                        },
                      ],
                    },
                  ],
                },
                isRegistered: { $gt: [{ $size: "$myReg" }, 0] },
                myRegistration: { $arrayElemAt: ["$myReg", 0] },
              },
            },
            { $project: { regCount: 0, myReg: 0 } },
          ],
        },
      },
    ];

    const [result] = await Collections.events(db).aggregate(pipeline).toArray();
    const totalCount = (result.total[0]?.count ?? 0) as number;
    const events = result.events as Array<Record<string, unknown>>;

    const serialised = events.map((e) => ({
      id: (e._id as ObjectId).toString(),
      slug: e.slug,
      title: e.title,
      overview: e.overview,
      category: e.category,
      tags: e.tags,
      level: e.level ?? null,
      format: e.format,
      location: e.location ?? null,
      eventDate: (e.eventDate as Date).toISOString(),
      endDate: e.endDate ? (e.endDate as Date).toISOString() : null,
      registrationDeadline: (e.registrationDeadline as Date).toISOString(),
      duration: e.duration ?? null,
      capacity: e.capacity,
      registeredCount: e.registeredCount,
      slotsRemaining: e.slotsRemaining,
      // Resolve CloudinaryImage → plain URL string
      image: resolveEventImage(e),
      instructor: e.instructor ?? null,
      targetEduStatus: e.targetEduStatus,
      requiredSkills: e.requiredSkills,
      locationScope: e.locationScope,
      isRegistered: e.isRegistered,
      myRegistrationId: e.myRegistration
        ? (e.myRegistration as Record<string, unknown>)._id!.toString()
        : null,
      ticketTypes: (e.ticketTypes as Array<Record<string, unknown>>).map(
        (t) => ({
          id: (t._id as ObjectId).toString(),
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
        }),
      ),
    }));

    return NextResponse.json({
      events: serialised,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error("[GET /api/events/feed]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
