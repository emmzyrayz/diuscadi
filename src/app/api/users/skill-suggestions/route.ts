// app/api/users/skill-suggestions/route.ts
// POST — submit a custom skill for admin review.
// Inserts into a `skillSuggestions` collection (separate from the skills list)
// so the admin review queue stays clean.
// Body: { name: string }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

async function postHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Skill name is required" },
        { status: 400 },
      );
    }

    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 60) {
      return NextResponse.json(
        { error: "Skill name must be between 2 and 60 characters" },
        { status: 400 },
      );
    }

    // Generate a slug from the name
    const slug = trimmed
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    // Reject duplicates — check both the live skills list and pending suggestions
    const [existingSkill, existingSuggestion] = await Promise.all([
      db.collection("skills").findOne({
        $or: [{ slug }, { name: { $regex: new RegExp(`^${trimmed}$`, "i") } }],
        isActive: true,
      }),
      db.collection("skillSuggestions").findOne({
        $or: [{ slug }, { name: { $regex: new RegExp(`^${trimmed}$`, "i") } }],
        status: "pending",
      }),
    ]);

    if (existingSkill) {
      return NextResponse.json(
        { error: "This skill already exists — search for it above" },
        { status: 409 },
      );
    }

    if (existingSuggestion) {
      return NextResponse.json(
        {
          error: "This skill has already been suggested and is pending review",
        },
        { status: 409 },
      );
    }

    await db.collection("skillSuggestions").insertOne({
      slug,
      name: trimmed,
      suggestedBy: vaultId,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { message: "Skill suggestion submitted for admin review" },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/users/skill-suggestions]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const POST = withAuth(postHandler);
