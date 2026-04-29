// GET /api/committees/[slug]/members — auth required, members only
import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

type Context = {
  params?: Promise<Record<string, string>> | Record<string, string>;
};

export const GET = withAuth(
  async (req: AuthenticatedRequest, context?: Context) => {
    try {
      const params = context?.params
        ? await Promise.resolve(context.params)
        : {};
      const slug = params.slug as string;

      const db = await getDb();

      // Verify caller is at least a member
      const caller = await Collections.userData(db).findOne(
        { vaultId: new ObjectId(req.auth.vaultId) },
        { projection: { membershipStatus: 1, role: 1 } },
      );
      const isMember =
        caller?.membershipStatus === "approved" ||
        ["moderator", "admin", "webmaster"].includes(caller?.role ?? "");
      if (!isMember) {
        return NextResponse.json({ error: "Members only" }, { status: 403 });
      }

      // Fetch all users in this committee
      const members = await Collections.userData(db)
        .aggregate([
          { $match: { "committeeMembership.committee": slug } },
          {
            $lookup: {
              from: "committeeRoles",
              localField: "committeeMembership.role",
              foreignField: "slug",
              as: "_role",
            },
          },
          { $unwind: { path: "$_role", preserveNullAndEmptyArrays: true } },
          { $sort: { "_role.rank": -1, "committeeMembership.joinedAt": 1 } },
          {
            $project: {
              _id: 0,
              id: { $toString: "$_id" },
              fullName: 1,
              hasAvatar: 1,
              avatar: 1,
              role: 1,
              committeeMembership: 1,
              skills: 1,
              verifiedSkills: 1,
              roleRank: "$_role.rank",
              roleName: "$_role.name",
            },
          },
        ])
        .toArray();

      return NextResponse.json({ slug, members });
    } catch (err) {
      console.error("[GET /api/committees/[slug]/members]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
