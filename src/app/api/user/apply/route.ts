// app/api/user/apply/route.ts
// POST /api/user/apply — submit a committee or skill application.
// The admin reviews it; approval writes the value to UserData.
// Body: { type: "committee" | "skill", value: string, note?: string }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ApplicationDocument } from "@/lib/models/Application";
import { ObjectId } from "mongodb";
import { COMMITTEES, SKILLS, Committee, Skill } from "@/types/domain";

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const { type, value, note } = (await req.json()) as {
      type: "committee" | "skill";
      value: string;
      note?: string;
    };

    // ── Validate type ─────────────────────────────────────────────────────────
    if (type !== "committee" && type !== "skill") {
      return NextResponse.json(
        { error: 'type must be "committee" or "skill".' },
        { status: 400 },
      );
    }

    // ── Validate value ────────────────────────────────────────────────────────
    if (type === "committee" && !COMMITTEES.includes(value as Committee)) {
      return NextResponse.json(
        {
          error: `Invalid committee. Must be one of: ${COMMITTEES.join(", ")}.`,
        },
        { status: 400 },
      );
    }
    if (type === "skill" && !SKILLS.includes(value as Skill)) {
      return NextResponse.json(
        { error: `Invalid skill. Must be one of: ${SKILLS.join(", ")}.` },
        { status: 400 },
      );
    }

    const db = await getDb();
    const userId = new ObjectId(req.auth.vaultId);

    const userData = await Collections.userData(db).findOne({
      vaultId: userId,
    });
    if (!userData) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 404 },
      );
    }

    // ── Check for existing pending application ────────────────────────────────
    const existing = await Collections.applications(db).findOne({
      userId: userData._id!,
      type,
      value: value as Committee & Skill,
      status: "pending",
    });
    if (existing) {
      return NextResponse.json(
        {
          error: `You already have a pending ${type} application for "${value}".`,
        },
        { status: 409 },
      );
    }

    // ── Create application ────────────────────────────────────────────────────
    const now = new Date();
    const application: ApplicationDocument = {
      userId: userData._id!,
      vaultId: userId,
      type,
      value: value as Committee | Skill,
      currentValue: type === "committee" ? (userData.committee ?? null) : null, // skills are an array — not applicable as single currentValue
      status: "pending",
      note: note?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const result = await Collections.applications(db).insertOne(application);

    return NextResponse.json(
      {
        message: `Your ${type} application for "${value}" has been submitted.`,
        applicationId: result.insertedId,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/user/apply]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

export const POST = withAuth(handler);
