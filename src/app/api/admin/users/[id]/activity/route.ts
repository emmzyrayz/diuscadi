// GET /api/admin/users/[id]/activity
// Admin/webmaster only. Assembles a chronological activity feed for a user
// from registrations, applications, and check-ins.
// No dedicated activity collection yet — derived from existing collections.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

interface ActivityItem {
  type: string;
  label: string;
  meta: string;
  status: string;
  timestamp: Date | string;
}

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

      const db = await getDb();
      const userObjectId = new ObjectId(userId);

      // ── Pull from registrations ───────────────────────────────────────────
      const registrations = await Collections.eventRegistrations(db)
        .aggregate([
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
          { $sort: { createdAt: -1 } },
          { $limit: 20 },
          {
            $project: {
              _id: 0,
              type: { $literal: "registration" },
              label: {
                $concat: [
                  "Registered for ",
                  { $ifNull: ["$_event.title", "an event"] },
                ],
              },
              meta: { $ifNull: ["$_event.title", ""] },
              status: "$status",
              timestamp: "$createdAt",
            },
          },
        ])
        .toArray() as ActivityItem[];

      // ── Pull check-ins ────────────────────────────────────────────────────
      const checkIns = await Collections.eventRegistrations(db)
        .aggregate([
          {
            $match: {
              userId: userObjectId,
              status: "checked-in",
              checkedInAt: { $exists: true },
            },
          },
          {
            $lookup: {
              from: "events",
              localField: "eventId",
              foreignField: "_id",
              as: "_event",
            },
          },
          { $unwind: { path: "$_event", preserveNullAndEmptyArrays: true } },
          { $sort: { checkedInAt: -1 } },
          { $limit: 20 },
          {
            $project: {
              _id: 0,
              type: { $literal: "check-in" },
              label: {
                $concat: [
                  "Attended ",
                  { $ifNull: ["$_event.title", "an event"] },
                ],
              },
              meta: { $ifNull: ["$_event.title", ""] },
              status: { $literal: "checked-in" },
              timestamp: "$checkedInAt",
            },
          },
        ])
        .toArray() as ActivityItem[];

      // ── Pull applications ─────────────────────────────────────────────────
      // Applications store userId as vaultId reference — use userData lookup
      const userData = await Collections.userData(db).findOne(
        { _id: userObjectId },
        { projection: { vaultId: 1 } },
      );

      let applications: ActivityItem[] = [];
      if (userData?.vaultId) {
        applications = await Collections.applications(db)
          .find(
            { userId: userData.vaultId },
            {
              sort: { createdAt: -1 },
              limit: 20,
              projection: { type: 1, status: 1, createdAt: 1 },
            },
          )
          .toArray()
          .then((docs) =>
            docs.map((d): ActivityItem => ({
              type: "application",
              label: `Submitted ${d.type} application`,
              meta: d.type,
              status: d.status,
              timestamp: d.createdAt,
            })),
          );
      }

      // ── Merge, sort, cap ──────────────────────────────────────────────────
      const feed = [...registrations, ...checkIns, ...applications]
        .sort(
          (a, b) =>
            new Date(b.timestamp as string).getTime() -
            new Date(a.timestamp as string).getTime(),
        )
        .slice(0, 30);

      return NextResponse.json({ activity: feed });
    } catch (err) {
      console.error("[GET /api/admin/users/[id]/activity]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
