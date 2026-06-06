// src/app/api/admin/assignments/assignment/[id]/request-revision/route.ts
// ─── POST /api/admin/assignments/assignment/[id]/request-revision ───────────────────────
// Requests the assigned member to revise and resubmit.
//
// Valid from: "submitted" | "under_review" | "evaluated"
// Result: status → "revision_requested" + RevisionHistoryEntry appended.
//
// Body: { reason: string } — required, explains what to fix.

import { NextResponse } from "next/server";
import {
  withAuth,
  AuthenticatedRequest,
  resolveParams,
} from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const POST = withAuth(async (req: AuthenticatedRequest, context) => {
  try {
    const { id } = await resolveParams(context);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid assignment ID" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const { vaultId, role } = req.auth;

    // ── 1. Fetch assignment ───────────────────────────────────────────────────

    const assignment = await Collections.assignments(db).findOne({
      _id: new ObjectId(id),
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    // ── 2. Status gate ────────────────────────────────────────────────────────

    const revisableStatuses = new Set([
      "submitted",
      "under_review",
      "evaluated",
    ]);
    if (!revisableStatuses.has(assignment.status)) {
      return NextResponse.json(
        {
          error: `Cannot request revision from status "${assignment.status}"`,
          allowed: [...revisableStatuses],
        },
        { status: 409 },
      );
    }

    // ── 3. Permission check ───────────────────────────────────────────────────

    const isSystemAdmin = role === "admin" || role === "webmaster";

    if (!isSystemAdmin) {
      const userData = await Collections.userData(db).findOne({
        vaultId: new ObjectId(vaultId),
      });

      const isCommitteeStaff =
        userData?.membershipStatus === "approved" &&
        userData?.committeeMembership?.committee === assignment.committeeSlug &&
        ["HEAD", "COORDINATOR"].includes(
          userData?.committeeMembership?.role ?? "",
        );

      if (!isCommitteeStaff) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 },
        );
      }
    }

    // ── 4. Parse + validate body ──────────────────────────────────────────────

    let body: { reason: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    if (!body.reason?.trim()) {
      return NextResponse.json(
        { error: "reason is required — describe what the member should fix" },
        { status: 400 },
      );
    }

    // ── 5. Write ──────────────────────────────────────────────────────────────

    const now = new Date();
    const revisionEntry = {
      requestedAt: now,
      requestedBy: vaultId, // Vault ObjectId of the requester
      reason: body.reason.trim(),
    };

    const updated = await Collections.assignments(db).findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: { status: "revision_requested", updatedAt: now },
        $push: { revisionHistory: revisionEntry },
      },
      { returnDocument: "after" },
    );

    return NextResponse.json({
      message: "Revision requested. Member has been notified to resubmit.",
      assignment: updated,
    });
  } catch (err) {
    console.error(
      "[POST /api/admin/assignments/assignment/[id]/request-revision]",
      err,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
