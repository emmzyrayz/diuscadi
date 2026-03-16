// app/api/platform/skills/route.ts
// GET /api/platform/skills — public
// Returns all active skills grouped by category, ordered by displayOrder.

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { seedIfEmpty } from "@/lib/db/seed";
import type { SkillCategory } from "@/lib/models/platformConfig";

export async function GET() {
  try {
    const db = await getDb();
    await seedIfEmpty();

    const skills = await Collections.skills(db)
      .find({ isActive: true })
      .sort({ category: 1, displayOrder: 1 })
      .project({
        _id: 0,
        slug: 1,
        name: 1,
        category: 1,
        displayOrder: 1,
      })
      .toArray();

    // Group by category for the frontend — avoids client-side grouping logic
    const grouped = skills.reduce<
      Record<
        SkillCategory,
        { slug: string; name: string; displayOrder: number }[]
      >
    >(
      (acc, skill) => {
        const cat = skill.category as SkillCategory;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({
          slug: skill.slug as string,
          name: skill.name as string,
          displayOrder: skill.displayOrder as number,
        });
        return acc;
      },
      {} as Record<
        SkillCategory,
        { slug: string; name: string; displayOrder: number }[]
      >,
    );

    return NextResponse.json({
      // Also expose flat list for validation and simple dropdowns
      skills: skills.map((s) => ({
        slug: s.slug,
        name: s.name,
        category: s.category,
      })),
      grouped,
    });
  } catch (err) {
    console.error("[GET /api/platform/skills]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
