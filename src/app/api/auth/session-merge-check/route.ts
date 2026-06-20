import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import {
  normalizeEmail,
  getLinkedRegistrations,
  getLinkedEventSummaries,
  detectNameConflicts,
  claimGuestProfileForMigration,
  linkGuestTicketsToUserAccount,
} from "@/lib/guestProfile";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/session-merge-check
//
// Called once per session (gated via sessions.guestMergeCheckedAt — a DB
// field, not a JWT claim, so no token re-issuance is needed). Evaluates
// whether the logged-in account has unmigrated guest registrations under
// its email, and either:
//   - silently auto-migrates (no conflicts, 48hr elapsed since first seen)
//   - returns a popup payload for GuestMergePopup to render
//   - returns null if nothing to do, or already evaluated this session
//
// POST /api/auth/session-merge-check
// Body: { action: "snooze" } | { action: "migrate_now", resolvedFirstName?, resolvedLastName? }
// Manual actions triggered from the popup UI.
// ─────────────────────────────────────────────────────────────────────────────

const AUTO_MIGRATE_HOURS = 48;
const SNOOZE_HOURS = 24;

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const db = await getDb();
  const vaultId = new ObjectId(req.auth.vaultId);
  const sessionId = new ObjectId(req.auth.sessionId);

  const session = await Collections.sessions(db).findOne({ _id: sessionId });
  if (session?.guestMergeCheckedAt) {
    return NextResponse.json({ guestMerge: null });
  }

  const markChecked = () =>
    Collections.sessions(db).updateOne(
      { _id: sessionId },
      { $set: { guestMergeCheckedAt: new Date() } },
    );

  const userData = await Collections.userData(db).findOne(
    { vaultId },
    { projection: { _id: 1, email: 1 } },
  );
  if (!userData) {
    await markChecked();
    return NextResponse.json({ guestMerge: null });
  }

  const emailLower = normalizeEmail(userData.email);
  const userDataId = userData._id as ObjectId;
  const profile = await Collections.guestProfiles(db).findOne({
    email: emailLower,
  });

  if (!profile || profile.migratedToUserId) {
    await markChecked();
    return NextResponse.json({ guestMerge: null });
  }

  const now = new Date();

  // Lazy-bind matchedUserId — covers the "account created AFTER guest
  // registration" orphan case that registration-time matching could never
  // have caught, since the account didn't exist yet at that point.
  if (!profile.matchedUserId) {
    await Collections.guestProfiles(db).updateOne(
      { _id: profile._id },
      { $set: { matchedUserId: userDataId, updatedAt: now } },
    );
    await Collections.guestEventRegistrations(db).updateMany(
      {
        guestProfileId: profile._id,
        matchedUserId: { $exists: false },
        status: { $ne: "cancelled" },
      },
      { $set: { matchedUserId: userDataId, updatedAt: now } },
    );
  }

  let firstShownAt = profile.firstShownAt;
  if (!firstShownAt) {
    firstShownAt = now;
    await Collections.guestProfiles(db).updateOne(
      { _id: profile._id },
      { $set: { firstShownAt, mergeStatus: "pending", updatedAt: now } },
    );
  }

  const linkedRegistrations = await getLinkedRegistrations(
    db,
    profile._id as ObjectId,
  );
  if (linkedRegistrations.length === 0) {
    await markChecked();
    return NextResponse.json({ guestMerge: null });
  }

  const conflicts = detectNameConflicts(linkedRegistrations);
  const hoursSinceFirstShown =
    (now.getTime() - firstShownAt.getTime()) / 3_600_000;
  const eligibleForAutoMigrate =
    conflicts.length === 0 && hoursSinceFirstShown >= AUTO_MIGRATE_HOURS;

  // ── Silent auto-migrate ───────────────────────────────────────────────────
  if (eligibleForAutoMigrate) {
    const claimed = await claimGuestProfileForMigration(
      db,
      profile._id as ObjectId,
    );
    if (claimed) {
      const { migratedCount } = await linkGuestTicketsToUserAccount(
        db,
        profile._id as ObjectId,
        userDataId,
      );
      await markChecked();
      return NextResponse.json({
        guestMerge: { autoMigrated: true, ticketsMigrated: migratedCount },
      });
    }
    // Lost the claim race to a concurrent tab/device — already handled there.
    await markChecked();
    return NextResponse.json({ guestMerge: null });
  }

  // ── Not yet eligible — decide whether to surface the popup this session ──
  const suppressedBySnooze =
    !!profile.snoozedUntil && profile.snoozedUntil > now;
  await markChecked();

  if (suppressedBySnooze) {
    return NextResponse.json({ guestMerge: null });
  }

  const events = await getLinkedEventSummaries(db, profile._id as ObjectId);

  return NextResponse.json({
    guestMerge: {
      autoMigrated: false,
      events,
      conflicts,
      hoursUntilAutoMigrate:
        conflicts.length === 0
          ? Math.max(0, AUTO_MIGRATE_HOURS - hoursSinceFirstShown)
          : null,
    },
  });
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const db = await getDb();
  const vaultId = new ObjectId(req.auth.vaultId);
  const body = await req.json();
  const { action, resolvedFirstName, resolvedLastName } = body as {
    action?: "snooze" | "migrate_now";
    resolvedFirstName?: string;
    resolvedLastName?: string;
  };

  const userData = await Collections.userData(db).findOne(
    { vaultId },
    { projection: { _id: 1, email: 1 } },
  );
  if (!userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const emailLower = normalizeEmail(userData.email);
  const profile = await Collections.guestProfiles(db).findOne({
    email: emailLower,
  });

  if (!profile || profile.migratedToUserId) {
    return NextResponse.json(
      {
        error: "Nothing to migrate.",
        alreadyMigrated: !!profile?.migratedToUserId,
      },
      { status: 409 },
    );
  }

  const now = new Date();

  if (action === "snooze") {
    await Collections.guestProfiles(db).updateOne(
      { _id: profile._id },
      {
        $set: {
          mergeStatus: "snoozed",
          snoozedUntil: new Date(now.getTime() + SNOOZE_HOURS * 3_600_000),
          updatedAt: now,
        },
      },
    );
    return NextResponse.json({ ok: true });
  }

  if (action === "migrate_now") {
    const linkedRegistrations = await getLinkedRegistrations(
      db,
      profile._id as ObjectId,
    );
    const conflicts = detectNameConflicts(linkedRegistrations);

    if (conflicts.length > 0) {
      if (!resolvedFirstName?.trim() || !resolvedLastName?.trim()) {
        return NextResponse.json({ conflicts }, { status: 409 });
      }
      await Collections.guestProfiles(db).updateOne(
        { _id: profile._id },
        {
          $set: {
            "fullName.firstname": resolvedFirstName.trim(),
            "fullName.lastname": resolvedLastName.trim(),
            updatedAt: now,
          },
        },
      );
    }

    const claimed = await claimGuestProfileForMigration(
      db,
      profile._id as ObjectId,
    );
    if (!claimed) {
      return NextResponse.json(
        { error: "Migration is already in progress." },
        { status: 409 },
      );
    }

    const { migratedCount } = await linkGuestTicketsToUserAccount(
      db,
      profile._id as ObjectId,
      userData._id as ObjectId,
    );

    return NextResponse.json({ ok: true, ticketsMigrated: migratedCount });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
});
