// src/app/api/platform/leaderboard/route.ts
// ─── GET /api/platform/leaderboard ───────────────────────────────────────────
// Public-ish (auth required so we can resolve the caller's own rank).
// Returns users ranked by points.lifetime descending.
//
// Query params:
//   committee   slug — narrows to members of that committee only (optional)
//   page        number (default 1)
//   limit       number (default 20, max 50)
//
// Response includes:
//   - ranked list of users with name, avatar, lifetime points, current points,
//     direct referral count, committee slug/name
//   - caller's own rank + entry (so they can see their position even if they
//     fall outside the current page)
//   - pagination metadata
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    // ── 1. Parse query params ──────────────────────────────────────────────────

    const { searchParams } = new URL(req.url);
    const committeeFilter = searchParams.get("committee") ?? null;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(
        1,
        parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10),
      ),
    );
    const skip = (page - 1) * limit;

    // ── 2. Build base match query ──────────────────────────────────────────────
    // Only approved members with a points sub-document are eligible.
    // "points.lifetime" sparse index handles this efficiently.

    const matchQuery: Record<string, unknown> = {
      membershipStatus: "approved",
      "points.lifetime": { $exists: true },
    };

    if (committeeFilter) {
      matchQuery["committeeMembership.committee"] = committeeFilter;
    }

    // ── 3. Fetch ranked page + total count (parallel) ─────────────────────────

    const [entries, total] = await Promise.all([
      Collections.userData(db)
        .find(matchQuery, {
          projection: {
            _id: 1,
            fullName: 1,
            hasAvatar: 1,
            "avatar.imageUrl": 1,
            "points.current": 1,
            "points.lifetime": 1,
            "referralMeta.directCount": 1,
            "committeeMembership.committee": 1,
            "committeeMembership.role": 1,
          },
        })
        .sort({ "points.lifetime": -1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      Collections.userData(db).countDocuments(matchQuery),
    ]);

    // ── 4. Resolve committee display names for entries on this page ────────────

    const committeeSlugSet = new Set(
      entries
        .map((e) => e.committeeMembership?.committee as string | undefined)
        .filter(Boolean) as string[],
    );

    const committeeDocs =
      committeeSlugSet.size > 0
        ? await Collections.committees(db)
            .find(
              { slug: { $in: [...committeeSlugSet] } },
              { projection: { slug: 1, name: 1, color: 1 } },
            )
            .toArray()
        : [];

    const committeeMap = new Map(
      committeeDocs.map((c) => [
        c.slug as string,
        { name: c.name as string, color: c.color as string },
      ]),
    );

    // ── 5. Shape ranked entries ────────────────────────────────────────────────

    const ranked = entries.map((entry, idx) => {
      const fn = entry.fullName as
        | { firstname?: string; lastname?: string }
        | undefined;
      const committeeSlug = entry.committeeMembership?.committee as
        | string
        | undefined;
      const committeeMeta = committeeSlug
        ? committeeMap.get(committeeSlug)
        : undefined;

      return {
        rank: skip + idx + 1,
        userId: (entry._id as ObjectId).toString(),
        name:
          [fn?.firstname, fn?.lastname].filter(Boolean).join(" ") || "Member",
        avatarUrl: entry.hasAvatar
          ? ((entry.avatar as { imageUrl?: string } | undefined)?.imageUrl ??
            null)
          : null,
        lifetimePoints:
          (entry.points as { lifetime?: number } | undefined)?.lifetime ?? 0,
        currentPoints:
          (entry.points as { current?: number } | undefined)?.current ?? 0,
        directReferrals:
          (entry.referralMeta as { directCount?: number } | undefined)
            ?.directCount ?? 0,
        committee: committeeSlug
          ? {
              slug: committeeSlug,
              name: committeeMeta?.name ?? committeeSlug,
              color: committeeMeta?.color ?? "slate",
              role: entry.committeeMembership?.role as string | undefined,
            }
          : null,
      };
    });

    // ── 6. Resolve caller's own rank ──────────────────────────────────────────
    // If the caller appears in this page's results, we already have their rank.
    // If not (they're on a different page or filtered out), we compute it
    // separately so the UI can always show "Your rank: #142" regardless of
    // what page the user is browsing.

    const callerData = await Collections.userData(db).findOne(
      { vaultId },
      {
        projection: {
          _id: 1,
          fullName: 1,
          hasAvatar: 1,
          "avatar.imageUrl": 1,
          "points.current": 1,
          "points.lifetime": 1,
          "referralMeta.directCount": 1,
          "committeeMembership.committee": 1,
          "committeeMembership.role": 1,
        },
      },
    );

    let callerRankEntry = null;

    if (callerData) {
      const callerIdStr = (callerData._id as ObjectId).toString();
      const onPage = ranked.find((r) => r.userId === callerIdStr);

      if (onPage) {
        callerRankEntry = onPage;
      } else {
        // Count how many users have strictly more lifetime points — that is
        // the caller's 0-based position, so rank = count + 1.
        const callerLifetime =
          (callerData.points as { lifetime?: number } | undefined)?.lifetime ??
          0;

        const above = await Collections.userData(db).countDocuments({
          ...matchQuery,
          "points.lifetime": { $gt: callerLifetime },
        });

        const fn = callerData.fullName as
          | { firstname?: string; lastname?: string }
          | undefined;
        const callerCommitteeSlug = callerData.committeeMembership
          ?.committee as string | undefined;
        const callerCommitteeMeta = callerCommitteeSlug
          ? (committeeMap.get(callerCommitteeSlug) ??
            (await Collections.committees(db)
              .findOne(
                { slug: callerCommitteeSlug },
                { projection: { slug: 1, name: 1, color: 1 } },
              )
              .then((c) =>
                c
                  ? { name: c.name as string, color: c.color as string }
                  : undefined,
              )))
          : undefined;

        callerRankEntry = {
          rank: above + 1,
          userId: callerIdStr,
          name:
            [fn?.firstname, fn?.lastname].filter(Boolean).join(" ") || "Member",
          avatarUrl: callerData.hasAvatar
            ? ((callerData.avatar as { imageUrl?: string } | undefined)
                ?.imageUrl ?? null)
            : null,
          lifetimePoints: callerLifetime,
          currentPoints:
            (callerData.points as { current?: number } | undefined)?.current ??
            0,
          directReferrals:
            (callerData.referralMeta as { directCount?: number } | undefined)
              ?.directCount ?? 0,
          committee: callerCommitteeSlug
            ? {
                slug: callerCommitteeSlug,
                name: callerCommitteeMeta?.name ?? callerCommitteeSlug,
                color: callerCommitteeMeta?.color ?? "slate",
                role: callerData.committeeMembership?.role as
                  | string
                  | undefined,
              }
            : null,
        };
      }
    }

    // ── 7. Build response ──────────────────────────────────────────────────────

    return NextResponse.json({
      leaderboard: ranked,
      callerRank: callerRankEntry,
      filter: {
        committee: committeeFilter,
      },
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
    console.error("[GET /api/platform/leaderboard]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
