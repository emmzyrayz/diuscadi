// app/api/admin/applications/[id]/route.ts
// PATCH { action: "approve" | "reject", reviewNote?: string }
// Admin + webmaster only.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { ApplicationDocument, ApplicationStatus } from "@/lib/models/Application";

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

      const reviewUpdate: Partial<ApplicationDocument> = {
        status: (action === "approve"
          ? "approved"
          : "rejected") as ApplicationStatus,
        reviewedBy,
        reviewedAt: now,
        reviewNote: reviewNote ?? null,
        updatedAt: now,
      };

      // ── Reject — same for all types ──────────────────────────────────────────
      if (action === "reject") {
        await Collections.applications(db).updateOne(
          { _id: new ObjectId(id) },
          { $set: reviewUpdate },
        );
        return NextResponse.json({ message: "Application rejected" });
      }

      // ── Approve — type-specific side effects ─────────────────────────────────

      // MEMBERSHIP — set membershipStatus to "approved" on UserData
      if (application.type === "membership") {
        await Collections.userData(db).updateOne(
          { _id: application.userId },
          { $set: { membershipStatus: "approved", updatedAt: now } },
        );
        await Collections.applications(db).updateOne(
          { _id: new ObjectId(id) },
          { $set: reviewUpdate },
        );
        return NextResponse.json({
          message:
            "Membership application approved — user is now an approved member",
        });
      }

      // COMMITTEE — assign committeeMembership + increment memberCount
      if (application.type === "committee") {
        const requestedCommittee = application.requestedCommittee as string;
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
        await Collections.committees(db).updateOne(
          { slug: requestedCommittee },
          { $inc: { memberCount: 1 } },
        );
        await Collections.applications(db).updateOne(
          { _id: new ObjectId(id) },
          { $set: reviewUpdate },
        );
        return NextResponse.json({
          message: "Committee application approved",
          committee: requestedCommittee,
          role: defaultRole.slug,
        });
      }

      // SKILLS — merge requested skills into user's skills array
      if (application.type === "skills") {
        const requestedSkills = (application.requestedSkills ?? []) as string[];
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
        await Collections.userData(db).updateOne(
          { _id: application.userId },
          {
            $addToSet: { skills: { $each: requestedSkills } },
            $set: { updatedAt: now },
          },
        );
        await Collections.applications(db).updateOne(
          { _id: new ObjectId(id) },
          { $set: reviewUpdate },
        );
        return NextResponse.json({
          message: "Skills application approved",
          skills: requestedSkills,
        });
      }

      // SPONSORSHIP — stub: mark approved, no side effect yet
      if (application.type === "sponsorship") {
        await Collections.applications(db).updateOne(
          { _id: new ObjectId(id) },
          { $set: reviewUpdate },
        );
        // TODO: when sponsorship system is built, create a SponsorProfile doc here
        return NextResponse.json({
          message:
            "Sponsorship application approved — sponsor onboarding coming soon",
        });
      }

      // PROGRAM — stub: mark approved, set flag on userData
      if (application.type === "program") {
        await Collections.userData(db).updateOne(
          { _id: application.userId },
          {
            // TODO: add programExpertise[] to UserData model when program system built
            $set: { updatedAt: now },
          },
        );
        await Collections.applications(db).updateOne(
          { _id: new ObjectId(id) },
          { $set: reviewUpdate },
        );
        return NextResponse.json({
          message:
            "Program expert application approved — program features coming soon",
        });
      }

      // WRITER — stub: mark approved, set flag on userData
      if (application.type === "writer") {
        await Collections.userData(db).updateOne(
          { _id: application.userId },
          {
            // TODO: add isWriter: true to UserData model when blog system built
            $set: { updatedAt: now },
          },
        );
        await Collections.applications(db).updateOne(
          { _id: new ObjectId(id) },
          { $set: reviewUpdate },
        );
        return NextResponse.json({
          message: "Writer application approved — blog system coming soon",
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
