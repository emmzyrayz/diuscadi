// GET  /api/applications — auth required, returns current user's own applications
//   Query: ?type=committee|skills &status=pending|approved|rejected
// POST /api/applications — auth required, submit a new application

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { SKILLS, COMMITTEES } from "@/types/domain";

// ── GET ───────────────────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "committee" | "skills"
    const status = searchParams.get("status"); // "pending" | "approved" | "rejected"

    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    const userData = await Collections.userData(db).findOne(
      { vaultId },
      { projection: { _id: 1 } },
    );
    if (!userData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    const filter: Record<string, unknown> = { userId: userData._id };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const applications = await Collections.applications(db)
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      applications: applications.map((a) => ({
        id: a._id!.toString(),
        type: a.type,
        status: a.status,
        requestedCommittee: a.requestedCommittee ?? null,
        requestedSkills: a.requestedSkills ?? null,
        reason: a.reason ?? null,
        reviewNote: a.reviewNote ?? null,
        reviewedAt: a.reviewedAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      total: applications.length,
    });
  } catch (err) {
    console.error("[GET /api/applications]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// ── POST ──────────────────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { type, requestedCommittee, requestedSkills, reason } =
      await req.json();

    if (!type || !["committee", "skills"].includes(type)) {
      return NextResponse.json(
        { error: "type must be 'committee' or 'skills'" },
        { status: 400 },
      );
    }

    if (type === "committee") {
      if (
        !requestedCommittee ||
        !(COMMITTEES as string[]).includes(requestedCommittee)
      ) {
        return NextResponse.json(
          {
            error: `requestedCommittee must be one of: ${COMMITTEES.join(", ")}`,
          },
          { status: 400 },
        );
      }
    }

    if (type === "skills") {
      if (!Array.isArray(requestedSkills) || requestedSkills.length === 0) {
        return NextResponse.json(
          { error: "requestedSkills must be a non-empty array" },
          { status: 400 },
        );
      }
      const invalid = requestedSkills.filter(
        (s: string) => !(SKILLS as string[]).includes(s),
      );
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: `Invalid skills: ${invalid.join(", ")}` },
          { status: 400 },
        );
      }
    }

    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    const userData = await Collections.userData(db).findOne({ vaultId });
    if (!userData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    // Block duplicate pending application of same type
    const existing = await Collections.applications(db).findOne({
      userId: userData._id!,
      type,
      status: "pending",
    });
    if (existing) {
      return NextResponse.json(
        { error: `You already have a pending ${type} application` },
        { status: 409 },
      );
    }

    const now = new Date();
    const doc: Record<string, unknown> = {
      userId: userData._id!,
      vaultId,
      type,
      status: "pending",
      reason: reason ?? null,
      createdAt: now,
      updatedAt: now,
    };
    if (type === "committee") doc.requestedCommittee = requestedCommittee;
    if (type === "skills") doc.requestedSkills = requestedSkills;

    const { insertedId } = await Collections.applications(db).insertOne(
      doc as never,
    );

    return NextResponse.json(
      {
        message: "Application submitted successfully",
        applicationId: insertedId.toString(),
        type,
        status: "pending",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/applications]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
