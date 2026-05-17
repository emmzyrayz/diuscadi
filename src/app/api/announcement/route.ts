// GET  — fetch announcements visible to this user
// POST — mark announcements as read

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId, Filter } from "mongodb";
import { Collections } from "@/lib/db/collections";
import { AnnouncementDocument } from "@/lib/models/Announcement";

// ── GET /api/announcements ────────────────────────────────────────────────────

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const db = await getDb();
    const now = new Date();

    // Resolve vaultId → userData for targeting fields
    const vaultId = new ObjectId(req.auth.vaultId);
    const userData = await Collections.userData(db).findOne(
      { vaultId },
      { projection: {
          _id: 1,
          eduStatus: 1,
          membershipStatus: 1,
          committeeMembership: 1,
      }},
    );

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userData._id!;
    const userEduStatus = userData.eduStatus;           // "STUDENT" | "GRADUATE"
    const userMembershipStatus = userData.membershipStatus;
    const userCommittee = userData.committeeMembership?.committee ?? null;

    // ── Build audience filter ─────────────────────────────────────────────
    // A user sees an announcement if ANY of these match:
    //   - audience === "global"
    //   - audience === "students" AND eduStatus === "STUDENT"
    //   - audience === "graduates" AND eduStatus === "GRADUATE"
    //   - audience === "members" AND membershipStatus === "approved"
    //   - audience === "committee" AND targetCommittee matches user's committee
    // const audienceFilter = {
    //   $or: [
    //     { audience: "global" },
    //     { audience: "students", ...(userEduStatus === "STUDENT" ? {} : { _forceNoMatch: true }) },
    //     { audience: "graduates", ...(userEduStatus === "GRADUATE" ? {} : { _forceNoMatch: true }) },
    //     { audience: "members", ...(userMembershipStatus === "approved" ? {} : { _forceNoMatch: true }) },
    //     ...(userCommittee
    //       ? [{ audience: "committee", targetCommittee: userCommittee }]
    //       : []),
    //   ],
    // };

    // Build a clean $or array based on user's actual attributes
    const orClauses: Record<string, unknown>[] = [{ audience: "global" }];
    if (userEduStatus === "STUDENT") orClauses.push({ audience: "students" });
    if (userEduStatus === "GRADUATE") orClauses.push({ audience: "graduates" });
    if (userMembershipStatus === "approved") orClauses.push({ audience: "members" });
    if (userCommittee) {
      orClauses.push({ audience: "committee", targetCommittee: userCommittee });
    }

    const filter = {
      published: true,
      $or: orClauses,
      $and: [
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: now } },
          ],
        },
      ],
    } as Filter<AnnouncementDocument>; 

    const announcements = await Collections.announcements(db)
      .find(filter)
      .sort({ publishedAt: -1 })
      .limit(20)
      .toArray();

    if (announcements.length === 0) {
      return NextResponse.json({ announcements: [], readIds: [] });
    }

    // ── Fetch which ones the user has already read ─────────────────────────
    const announcementIds = announcements.map((a) => a._id!);
    const reads = await Collections.announcementReads(db)
      .find({ userId, announcementId: { $in: announcementIds } })
      .project({ announcementId: 1 })
      .toArray();

    const readIds = new Set(reads.map((r) => r.announcementId.toString()));

    return NextResponse.json({
      announcements: announcements.map((a) => ({
        id: a._id!.toString(),
        title: a.title,
        desc: a.desc,
        type: a.type,
        audience: a.audience,
        ctaLabel: a.ctaLabel ?? null,
        ctaHref: a.ctaHref ?? null,
        publishedAt: a.publishedAt?.toISOString() ?? null,
        expiresAt: a.expiresAt?.toISOString() ?? null,
        isRead: readIds.has(a._id!.toString()),
      })),
      unreadCount: announcements.length - readIds.size,
    });
  } catch (err) {
    console.error("[GET /api/announcements]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// ── POST /api/announcements — mark as read ────────────────────────────────────

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);
    const { announcementIds } = (await req.json()) as {
      announcementIds: string[];
    };

    if (!Array.isArray(announcementIds) || announcementIds.length === 0) {
      return NextResponse.json({ error: "announcementIds required" }, { status: 400 });
    }

    const userData = await Collections.userData(db).findOne(
      { vaultId },
      { projection: { _id: 1 } },
    );
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userData._id!;
    const now = new Date();

    // Upsert a read record for each — ignore duplicates
    const ops = announcementIds.map((id) => ({
      updateOne: {
        filter: {
          announcementId: new ObjectId(id),
          userId,
        },
        update: { $setOnInsert: { announcementId: new ObjectId(id), userId, readAt: now } },
        upsert: true,
      },
    }));

    await Collections.announcementReads(db).bulkWrite(ops, { ordered: false });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/announcements]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});