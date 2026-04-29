// GET /api/committees — public, lists all active committees with member count
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";

export async function GET() {
  try {
    const db = await getDb();
    const committees = await Collections.committees(db)
      .find({ isActive: true })
      .sort({ displayOrder: 1 })
      .toArray();
    return NextResponse.json({
      committees: committees.map((c) => ({
        id: c._id!.toString(),
        slug: c.slug,
        name: c.name,
        description: c.description,
        color: c.color,
        icon: c.icon,
        headName: c.headName ?? null,
        memberCount: c.memberCount,
      })),
    });
  } catch (err) {
    console.error("[GET /api/committees]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
