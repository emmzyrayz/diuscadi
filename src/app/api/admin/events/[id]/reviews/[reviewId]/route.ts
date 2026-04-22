// PATCH /api/admin/events/[id]/reviews/[reviewId]
// Admin + webmaster only. Toggle review visibility for moderation.
// Body: { isVisible: boolean }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { EventReviewDocument } from "@/lib/models/EventReview";

const ALLOWED_ROLES = ["admin", "webmaster"];

type Context = {
  params?: Promise<Record<string, string>> | Record<string, string>;
};

export const PATCH = withAuth(
  async (req: AuthenticatedRequest, context?: Context) => {
    try {
      if (!ALLOWED_ROLES.includes(req.auth.role)) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 },
        );
      }

      const params = context?.params
        ? await Promise.resolve(context.params)
        : {};
      const reviewId = params.reviewId as string;
      if (!reviewId || !ObjectId.isValid(reviewId)) {
        return NextResponse.json(
          { error: "Invalid review ID" },
          { status: 400 },
        );
      }

      const { isVisible } = await req.json();
      if (typeof isVisible !== "boolean") {
        return NextResponse.json(
          { error: "isVisible (boolean) is required" },
          { status: 400 },
        );
      }

      const db = await getDb();
      const result = await db
        .collection<EventReviewDocument>("eventReviews")
        .updateOne(
          { _id: new ObjectId(reviewId) },
          { $set: { isVisible, updatedAt: new Date() } },
        );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: "Review not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        message: isVisible ? "Review made visible" : "Review hidden",
        reviewId,
        isVisible,
      });
    } catch (err) {
      console.error("[PATCH /api/admin/events/[id]/reviews/[reviewId]]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);

// GET — list all reviews for an event (admin, includes hidden ones)
export const GET = withAuth(
  async (req: AuthenticatedRequest, context?: Context) => {
    try {
      if (!ALLOWED_ROLES.includes(req.auth.role)) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 },
        );
      }

      const params = context?.params
        ? await Promise.resolve(context.params)
        : {};
      const id = params.id as string;
      if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid event ID" },
          { status: 400 },
        );
      }

      const db = await getDb();
      const eventId = new ObjectId(id);

      const reviews = await db
        .collection<EventReviewDocument>("eventReviews")
        .aggregate([
          { $match: { eventId } },
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
          {
            $project: {
              _id: 0,
              id: { $toString: "$_id" },
              rating: 1,
              body: 1,
              isAnonymous: 1,
              isVisible: 1,
              createdAt: 1,
              // Admin always sees the real author regardless of anonymity
              authorName: {
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
              authorEmail: { $ifNull: ["$_author.email", ""] },
              authorAvatar: { $ifNull: ["$_author.avatar.imageUrl", null] },
              userId: { $toString: "$userId" },
            },
          },
        ])
        .toArray();

      const totalVisible = reviews.filter((r) => r.isVisible).length;
      const totalHidden = reviews.length - totalVisible;
      const avgRating =
        reviews.length > 0
          ? Math.round(
              (reviews.reduce((s, r) => s + (r.rating as number), 0) /
                reviews.length) *
                10,
            ) / 10
          : 0;

      return NextResponse.json({
        reviews,
        stats: {
          total: reviews.length,
          visible: totalVisible,
          hidden: totalHidden,
          averageRating: avgRating,
        },
      });
    } catch (err) {
      console.error("[GET /api/admin/events/[id]/reviews]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
