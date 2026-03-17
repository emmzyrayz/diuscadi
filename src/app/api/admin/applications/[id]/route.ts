// app/api/admin/applications/[id]/route.ts
// Admin + webmaster only.
// Approves or rejects a pending application.
// On committee approval: assigns committeeMembership + increments memberCount.
// On skills approval: merges requested skills into user's skills array.
//
// PATCH { action: "approve" | "reject", reviewNote?: string }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

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
      const id = params.id as string;
      if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid application ID" },
          { status: 400 },
        );
      }

      const { action, reviewNote } = await req.json();
      if (!action || !["approve", "reject"].includes(action)) {
        return NextResponse.json(
          { error: "action must be 'approve' or 'reject'" },
          { status: 400 },
        );
      }

      const db = await getDb();
      const now = new Date();
      const reviewedBy = new ObjectId(req.auth.vaultId);

      const application = await Collections.applications(db).findOne({
        _id: new ObjectId(id),
      });
      if (!application) {
        return NextResponse.json(
          { error: "Application not found" },
          { status: 404 },
        );
      }
      if (application.status !== "pending") {
        return NextResponse.json(
          { error: `Application is already ${application.status}` },
          { status: 409 },
        );
      }

      // ── Reject ──────────────────────────────────────────────────────────────
      if (action === "reject") {
        await Collections.applications(db).updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status: "rejected",
              reviewedBy,
              reviewedAt: now,
              reviewNote: reviewNote ?? null,
              updatedAt: now,
            },
          },
        );
        return NextResponse.json({ message: "Application rejected" });
      }

      // ── Approve ─────────────────────────────────────────────────────────────
      if (application.type === "committee") {
        const requestedCommittee = application.requestedCommittee as string;

        // Validate the requested committee is still active in the DB
        const committeeDoc = await Collections.committees(db).findOne({
          slug: requestedCommittee,
          isActive: true,
        });
        if (!committeeDoc) {
          return NextResponse.json(
            {
              error: `Committee "${requestedCommittee}" no longer exists or is inactive`,
            },
            { status: 409 },
          );
        }

        // Fetch the default role (lowest rank = entry-level role)
        const defaultRole = await Collections.committeeRoles(db).findOne(
          { isActive: true },
          { sort: { rank: 1 } },
        );
        if (!defaultRole) {
          return NextResponse.json(
            {
              error:
                "No active committee roles configured. Seed the platform first.",
            },
            { status: 500 },
          );
        }

        // Assign membership on UserData
        await Collections.userData(db).updateOne(
          { _id: application.userId },
          {
            $set: {
              committeeMembership: {
                committee: requestedCommittee,
                role: defaultRole.slug,
                joinedAt: now,
                assignedBy: reviewedBy,
              },
              updatedAt: now,
            },
          },
        );

        // Increment live member count on the committee document
        await Collections.committees(db).updateOne(
          { slug: requestedCommittee },
          { $inc: { memberCount: 1 } },
        );

        // Mark application approved
        await Collections.applications(db).updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status: "approved",
              reviewedBy,
              reviewedAt: now,
              reviewNote: reviewNote ?? null,
              updatedAt: now,
            },
          },
        );

        return NextResponse.json({
          message: "Committee application approved",
          committee: requestedCommittee,
          role: defaultRole.slug,
        });
      }

      if (application.type === "skills") {
        const requestedSkills = (application.requestedSkills ?? []) as string[];

        // Validate all requested skills are still active
        const validSkills = await Collections.skills(db)
          .find({ isActive: true }, { projection: { slug: 1, _id: 0 } })
          .toArray();
        const validSlugs = validSkills.map((s) => s.slug as string);
        const invalid = requestedSkills.filter((s) => !validSlugs.includes(s));

        if (invalid.length > 0) {
          return NextResponse.json(
            {
              error: `Some requested skills are no longer active: ${invalid.join(", ")}`,
            },
            { status: 409 },
          );
        }

        // Merge into user's skills — $addToSet prevents duplicates
        await Collections.userData(db).updateOne(
          { _id: application.userId },
          {
            $addToSet: { skills: { $each: requestedSkills } },
            $set: { updatedAt: now },
          },
        );

        await Collections.applications(db).updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status: "approved",
              reviewedBy,
              reviewedAt: now,
              reviewNote: reviewNote ?? null,
              updatedAt: now,
            },
          },
        );

        return NextResponse.json({
          message: "Skills application approved",
          skills: requestedSkills,
        });
      }

      return NextResponse.json(
        { error: "Unhandled application type" },
        { status: 400 },
      );
    } catch (err) {
      console.error("[PATCH /api/admin/applications/[id]]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
