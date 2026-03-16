// app/api/platform/committee-roles/route.ts
// GET /api/platform/committee-roles — public
// Returns all active committee roles ordered by rank (lowest to highest authority).

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { seedIfEmpty } from "@/lib/db/seed";

export async function GET() {
  try {
    const db = await getDb();
    await seedIfEmpty();

    const roles = await Collections.committeeRoles(db)
      .find({ isActive: true })
      .sort({ rank: 1 })
      .project({
        _id: 0,
        slug: 1,
        name: 1,
        rank: 1,
        description: 1,
      })
      .toArray();

    return NextResponse.json({ roles });
  } catch (err) {
    console.error("[GET /api/platform/committee-roles]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
