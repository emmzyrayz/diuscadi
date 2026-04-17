// app/api/admin/applications/[id]/route.ts
// PATCH { action: "approve" | "reject", reviewNote?: string }
// Admin + webmaster only.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import {
  ApplicationDocument,
  ApplicationStatus,
} from "@/lib/models/Application";
import {
  sendApplicationStatusEmail,
  sendMembershipWelcomeEmail,
} from "@/lib/sendEmail";

const ALLOWED_ROLES = ["admin", "webmaster"];
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type Context = {
  params?: Promise<Record<string, string>> | Record<string, string>;
};

// ── Helper: resolve user email + display name from application.userId ─────────
// userData holds the name; vault holds the email. Both are needed for emails.
async function resolveUserContact(
  userId: ObjectId,
  db: Awaited<ReturnType<typeof import("@/lib/mongodb").getDb>>,
): Promise<{ email: string; displayName: string } | null> {
  const userData = await Collections.userData(db).findOne(
    { _id: userId },
    { projection: { fullName: 1, vaultId: 1 } },
  );
  if (!userData) return null;

  const vault = await Collections.vault(db).findOne(
    { _id: userData.vaultId as ObjectId },
    { projection: { email: 1 } },
  );
  if (!vault?.email) return null;

  const fn = userData.fullName as
    | {
        firstname?: string;
        secondname?: string;
        lastname?: string;
      }
    | undefined;
  const displayName = fn
    ? [fn.firstname, fn.lastname].filter(Boolean).join(" ") || "there"
    : "there";

  return { email: vault.email as string, displayName };
}

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

      // ── Friendly display label for each application type ──────────────────
      const TYPE_LABELS: Record<string, string> = {
        membership: "Membership",
        committee: "Committee",
        skills: "Skills",
        sponsorship: "Sponsorship",
        program: "Program Expert",
        writer: "Writer",
      };
      const typeLabel =
        TYPE_LABELS[application.type as string] ??
        String(application.type).charAt(0).toUpperCase() +
          String(application.type).slice(1);

      // ── Fire-and-forget email helper ──────────────────────────────────────
      // Always called AFTER the DB write succeeds so a failed email never
      // rolls back an approval. Errors are logged, never surfaced to admin.
      const fireEmail = (fn: () => Promise<void>) => {
        void fn().catch((err) =>
          console.error(`[applications/${id}] Email send failed:`, err),
        );
      };

      // ── REJECT — same for all types ───────────────────────────────────────
      if (action === "reject") {
        await Collections.applications(db).updateOne(
          { _id: new ObjectId(id) },
          { $set: reviewUpdate },
        );

        fireEmail(async () => {
          const contact = await resolveUserContact(
            application.userId as ObjectId,
            db,
          );
          if (!contact) return;
          await sendApplicationStatusEmail({
            to: contact.email,
            name: contact.displayName,
            applicationType: typeLabel,
            status: "rejected",
            reviewNote: reviewNote ?? undefined,
          });
        });

        return NextResponse.json({ message: "Application rejected" });
      }

      // ── APPROVE — type-specific side effects ──────────────────────────────

      // MEMBERSHIP
      if (application.type === "membership") {
        await Collections.userData(db).updateOne(
          { _id: application.userId },
          { $set: { membershipStatus: "approved", updatedAt: now } },
        );
        await Collections.applications(db).updateOne(
          { _id: new ObjectId(id) },
          { $set: reviewUpdate },
        );

        fireEmail(async () => {
          const contact = await resolveUserContact(
            application.userId as ObjectId,
            db,
          );
          if (!contact) return;
          // 1. Generic approval status email
          await sendApplicationStatusEmail({
            to: contact.email,
            name: contact.displayName,
            applicationType: typeLabel,
            status: "approved",
            reviewNote: reviewNote ?? undefined,
            ctaLabel: "View Your Profile",
            ctaUrl: `${APP_URL}/profile`,
          });
          // 2. Richer membership-specific welcome email
          await sendMembershipWelcomeEmail({
            to: contact.email,
            name: contact.displayName,
            profileUrl: `${APP_URL}/profile`,
            eventsUrl: `${APP_URL}/events`,
          });
        });

        return NextResponse.json({
          message:
            "Membership application approved — user is now an approved member",
        });
      }

      // COMMITTEE
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

        const committeeName =
          (committeeDoc.name as string) ?? requestedCommittee;

        fireEmail(async () => {
          const contact = await resolveUserContact(
            application.userId as ObjectId,
            db,
          );
          if (!contact) return;
          await sendApplicationStatusEmail({
            to: contact.email,
            name: contact.displayName,
            applicationType: `${committeeName} Committee`,
            status: "approved",
            reviewNote: reviewNote ?? undefined,
            ctaLabel: "View Your Profile",
            ctaUrl: `${APP_URL}/profile`,
          });
        });

        return NextResponse.json({
          message: "Committee application approved",
          committee: requestedCommittee,
          role: defaultRole.slug,
        });
      }

      // SKILLS
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

        const skillsList = requestedSkills.join(", ");

        fireEmail(async () => {
          const contact = await resolveUserContact(
            application.userId as ObjectId,
            db,
          );
          if (!contact) return;
          await sendApplicationStatusEmail({
            to: contact.email,
            name: contact.displayName,
            applicationType: typeLabel,
            status: "approved",
            reviewNote: reviewNote
              ? reviewNote
              : `Skills added to your profile: ${skillsList}`,
            ctaLabel: "View Your Profile",
            ctaUrl: `${APP_URL}/profile`,
          });
        });

        return NextResponse.json({
          message: "Skills application approved",
          skills: requestedSkills,
        });
      }

      // SPONSORSHIP — stub
      if (application.type === "sponsorship") {
        await Collections.applications(db).updateOne(
          { _id: new ObjectId(id) },
          { $set: reviewUpdate },
        );
        // TODO: when sponsorship system is built, create a SponsorProfile doc here

        fireEmail(async () => {
          const contact = await resolveUserContact(
            application.userId as ObjectId,
            db,
          );
          if (!contact) return;
          await sendApplicationStatusEmail({
            to: contact.email,
            name: contact.displayName,
            applicationType: typeLabel,
            status: "approved",
            reviewNote:
              reviewNote ??
              "Our team will be in touch shortly with next steps for the sponsorship programme.",
          });
        });

        return NextResponse.json({
          message:
            "Sponsorship application approved — sponsor onboarding coming soon",
        });
      }

      // PROGRAM — stub
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

        fireEmail(async () => {
          const contact = await resolveUserContact(
            application.userId as ObjectId,
            db,
          );
          if (!contact) return;
          await sendApplicationStatusEmail({
            to: contact.email,
            name: contact.displayName,
            applicationType: typeLabel,
            status: "approved",
            reviewNote:
              reviewNote ??
              "Program expert features are coming soon. We'll notify you when they launch.",
          });
        });

        return NextResponse.json({
          message:
            "Program expert application approved — program features coming soon",
        });
      }

      // WRITER — stub
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

        fireEmail(async () => {
          const contact = await resolveUserContact(
            application.userId as ObjectId,
            db,
          );
          if (!contact) return;
          await sendApplicationStatusEmail({
            to: contact.email,
            name: contact.displayName,
            applicationType: typeLabel,
            status: "approved",
            reviewNote:
              reviewNote ??
              "The blog publishing system is coming soon. We'll let you know when your contributor access is active.",
          });
        });

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
