// GET /api/platform/skills — public
// Returns the canonical list of valid skill values from domain.ts.
// Used to populate dropdowns on the profile page.

import { NextResponse } from "next/server";
import { SKILLS } from "@/types/domain";

export async function GET() {
  return NextResponse.json({ skills: SKILLS });
}
