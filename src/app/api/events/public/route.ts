// GET /api/events/public
// No auth required — for landing page / public event listings.
// Supports ?limit= (max 20) and ?category= query params.

import { NextRequest, NextResponse } from "next/server";
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "6"), 20);
    const category = searchParams.get("category") ?? null;
    const now = new Date();

    const db = await getDb();

    const matchStage: Record<string, unknown> = {
      status: "published",
      eventDate: { $gt: now },
      registrationDeadline: { $gt: now },
    };
    if (category) matchStage.category = category;

    const pipeline = [
      { $match: matchStage },
      { $sort: { eventDate: 1 } },
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
                  { $ifNull: [{ $arrayElemAt: ["$regCount.total", 0] }, 0] },
                ],
              },
            ],
          },
        },
      },
      { $project: { regCount: 0 } },
    ];

    const events = await Collections.events(db).aggregate(pipeline).toArray();

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
      registeredCount: e.registeredCount as number,
      slotsRemaining: e.slotsRemaining as number,
      // Resolve CloudinaryImage → plain URL string
      image: resolveEventImage(e),
      instructor: e.instructor ?? null,
      targetEduStatus: e.targetEduStatus,
      requiredSkills: e.requiredSkills,
      locationScope: e.locationScope,
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

    return NextResponse.json({ events: serialised, total: serialised.length });
  } catch (err) {
    console.error("[GET /api/events/public]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
