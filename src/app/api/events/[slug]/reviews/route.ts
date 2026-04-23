// POST /api/events/[slug]/reviews  — submit a review (auth + checked-in + within window)
// GET  /api/events/[slug]/reviews  — fetch visible reviews + aggregate (members only)

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import type { EventReviewDocument } from "@/lib/models/EventReview";

type Context = {
  params?: Promise<Record<string, string>> | Record<string, string>;
};

// ── Shared: resolve event + check window ─────────────────────────────────────

async function resolveEventAndWindow(
  slug: string,
  db: Awaited<ReturnType<typeof import("@/lib/mongodb").getDb>>,
) {
  const event = await Collections.events(db).findOne(
    { slug, status: "published" },
    { projection: { _id: 1, eventDate: 1, endDate: 1 } },
  );
  if (!event) return null;

  const now = new Date();
  // Review window opens when event ends (endDate if set, otherwise eventDate)
  const windowStart = event.endDate
    ? new Date(event.endDate as Date)
    : new Date(event.eventDate as Date);
  // Closes 30 days after window opens
  const windowEnd = new Date(windowStart.getTime() + 30 * 24 * 60 * 60 * 1000);

  return {
    eventId: event._id as ObjectId,
    windowStart,
    windowEnd,
    isOpen: now >= windowStart && now <= windowEnd,
    hasEnded: now >= windowStart,
  };
}

// ── POST — submit a review ────────────────────────────────────────────────────

export const POST = withAuth(
  async (req: AuthenticatedRequest, context?: Context) => {
    try {
      const params = context?.params
        ? await Promise.resolve(context.params)
        : {};
      const slug = params.slug as string;
      if (!slug) {
        return NextResponse.json(
          { error: "Missing event slug" },
          { status: 400 },
        );
      }

      const db = await getDb();
      const vaultId = new ObjectId(req.auth.vaultId);

      // ── Resolve user ─────────────────────────────────────────────────────────
      const userData = await Collections.userData(db).findOne(
        { vaultId },
        { projection: { _id: 1, membershipStatus: 1, fullName: 1, avatar: 1 } },
      );
      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      // Members only
      if (userData.membershipStatus !== "approved") {
        return NextResponse.json(
          { error: "Only approved members can submit reviews" },
          { status: 403 },
        );
      }

      const userId = userData._id as ObjectId;

      // ── Resolve event + window ───────────────────────────────────────────────
      const eventInfo = await resolveEventAndWindow(slug, db);
      if (!eventInfo) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      if (!eventInfo.hasEnded) {
        return NextResponse.json(
          { error: "Reviews open after the event ends" },
          { status: 400 },
        );
      }
      if (!eventInfo.isOpen) {
        return NextResponse.json(
          { error: "The 30-day review window has closed" },
          { status: 400 },
        );
      }

      // ── Check user was checked-in ─────────────────────────────────────────────
      const registration = await Collections.eventRegistrations(db).findOne({
        eventId: eventInfo.eventId,
        userId,
        status: "checked-in",
      });
      if (!registration) {
        return NextResponse.json(
          { error: "Only attendees who checked in can review this event" },
          { status: 403 },
        );
      }

      // ── Check duplicate ───────────────────────────────────────────────────────
      const existing = await db
        .collection<EventReviewDocument>("eventReviews")
        .findOne({ eventId: eventInfo.eventId, userId });
      if (existing) {
        return NextResponse.json(
          { error: "You have already reviewed this event" },
          { status: 409 },
        );
      }

      // ── Validate body ─────────────────────────────────────────────────────────
      const body = await req.json();
      const rating = Number(body.rating);
      if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return NextResponse.json(
          { error: "rating must be an integer between 1 and 5" },
          { status: 400 },
        );
      }
      const reviewBody = body.body
        ? String(body.body).trim().slice(0, 500)
        : undefined;
      const isAnonymous = Boolean(body.isAnonymous);

      const now = new Date();
      const review: EventReviewDocument = {
        eventId: eventInfo.eventId,
        userId,
        vaultId,
        rating: rating as 1 | 2 | 3 | 4 | 5,
        body: reviewBody,
        isAnonymous,
        isVisible: true,
        createdAt: now,
        updatedAt: now,
      };

      const { insertedId } = await db
        .collection<EventReviewDocument>("eventReviews")
        .insertOne(review);

      return NextResponse.json(
        { message: "Review submitted", reviewId: insertedId.toString() },
        { status: 201 },
      );
    } catch (err) {
      console.error("[POST /api/events/[slug]/reviews]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);

// ── GET — fetch reviews + aggregate ──────────────────────────────────────────

export const GET = withAuth(
  async (req: AuthenticatedRequest, context?: Context) => {
    try {
      const params = context?.params
        ? await Promise.resolve(context.params)
        : {};
      const slug = params.slug as string;
      if (!slug) {
        return NextResponse.json(
          { error: "Missing event slug" },
          { status: 400 },
        );
      }

      const db = await getDb();
      const vaultId = new ObjectId(req.auth.vaultId);

      // ── Members only ─────────────────────────────────────────────────────────
      const userData = await Collections.userData(db).findOne(
        { vaultId },
        { projection: { _id: 1, membershipStatus: 1, fullName: 1, avatar: 1 } },
      );
      if (!userData || userData.membershipStatus !== "approved") {
        return NextResponse.json(
          { error: "Only approved members can view reviews" },
          { status: 403 },
        );
      }

      const userId = userData._id as ObjectId;

      // ── Resolve event ─────────────────────────────────────────────────────────
      const eventInfo = await resolveEventAndWindow(slug, db);
      if (!eventInfo) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      // Fetch visible reviews with author join (for named reviews)
      const reviews = await db
        .collection<EventReviewDocument>("eventReviews")
        .aggregate([
          {
            $match: {
              eventId: eventInfo.eventId,
              isVisible: true,
            },
          },
          {
            $lookup: {
              from: "userData",
              localField: "userId",
              foreignField: "_id",
              as: "_author",
            },
          },
          { $unwind: { path: "$_author", preserveNullAndEmptyArrays: true } },
          { $sort: { createdAt: -1 } },
          { $limit: 50 },
          {
            $project: {
              _id: 0,
              id: { $toString: "$_id" },
              rating: 1,
              body: 1,
              isAnonymous: 1,
              createdAt: 1,
              // Only expose author details when NOT anonymous
              authorName: {
                $cond: {
                  if: "$isAnonymous",
                  then: null,
                  else: {
                    $trim: {
                      input: {
                        $concat: [
                          { $ifNull: ["$_author.fullName.firstname", ""] },
                          " ",
                          { $ifNull: ["$_author.fullName.lastname", ""] },
                        ],
                      },
                    },
                  },
                },
              },
              authorAvatar: {
                $cond: {
                  if: "$isAnonymous",
                  then: null,
                  else: { $ifNull: ["$_author.avatar.imageUrl", null] },
                },
              },
              // Whether the current user wrote this review
              isOwn: { $eq: ["$userId", userId] },
            },
          },
        ])
        .toArray();

      // ── Aggregate stats ───────────────────────────────────────────────────────
      const [agg] = await db
        .collection<EventReviewDocument>("eventReviews")
        .aggregate([
          { $match: { eventId: eventInfo.eventId, isVisible: true } },
          {
            $group: {
              _id: null,
              totalReviews: { $sum: 1 },
              averageRating: { $avg: "$rating" },
              dist1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
              dist2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
              dist3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
              dist4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
              dist5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
            },
          },
        ])
        .toArray();

      const stats = agg
        ? {
            totalReviews: agg.totalReviews,
            averageRating: Math.round(agg.averageRating * 10) / 10,
            distribution: {
              1: agg.dist1,
              2: agg.dist2,
              3: agg.dist3,
              4: agg.dist4,
              5: agg.dist5,
            },
          }
        : {
            totalReviews: 0,
            averageRating: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          };

      // Check if current user has already reviewed
      const myReview = await db
        .collection<EventReviewDocument>("eventReviews")
        .findOne(
          { eventId: eventInfo.eventId, userId },
          { projection: { rating: 1, body: 1, isAnonymous: 1, createdAt: 1 } },
        );

      // ADD THIS: Check if the user is actually checked in to this event
      const registration = await Collections.eventRegistrations(db).findOne({
        eventId: eventInfo.eventId,
        userId,
        status: "checked-in",
      });

      return NextResponse.json({
        reviews,
        stats,
        window: {
          isOpen: eventInfo.isOpen,
          hasEnded: eventInfo.hasEnded,
          opensAt: eventInfo.windowStart.toISOString(),
          closesAt: eventInfo.windowEnd.toISOString(),
        },
        canReview: !!registration,
        myReview: myReview
          ? {
              rating: myReview.rating,
              body: myReview.body ?? null,
              isAnonymous: myReview.isAnonymous,
              createdAt: (myReview.createdAt as Date).toISOString(),
            }
          : null,
      });
    } catch (err) {
      console.error("[GET /api/events/[slug]/reviews]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
