// GET /api/platform/committees — public
// Returns the canonical list of valid committee values from domain.ts.
// Used to populate dropdowns on the profile page.

import { NextResponse } from "next/server";
import { COMMITTEES } from "@/types/domain";

export async function GET() {
  return NextResponse.json({ committees: COMMITTEES });
}
