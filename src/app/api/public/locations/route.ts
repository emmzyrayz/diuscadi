// GET /api/public/locations?state=X&type=city
// Merges static nigeriaLocations data with verified customLocations from DB.
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { NIGERIA_STATES, NIGERIA_CITIES } from "@/assets/data/nigeriaLocations";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "state"; // "state" | "city"
    const state = searchParams.get("state") ?? "";

    const db = await getDb();

    if (type === "state") {
      // Merge static states + verified custom states
      const customStates = await Collections.customLocations(db)
        .find({ type: "state", status: "verified" })
        .toArray();
      const merged = [
        ...new Set([...NIGERIA_STATES, ...customStates.map((s) => s.name)]),
      ].sort();
      return NextResponse.json({ states: merged });
    }

    if (type === "city" && state) {
      const staticCities = NIGERIA_CITIES[state] ?? [];
      const customCities = await Collections.customLocations(db)
        .find({ type: "city", parentState: state, status: "verified" })
        .toArray();
      const merged = [
        ...new Set([...staticCities, ...customCities.map((c) => c.name)]),
      ].sort();
      return NextResponse.json({ cities: merged });
    }

    return NextResponse.json({ states: NIGERIA_STATES, cities: [] });
  } catch (err) {
    console.error("[GET /api/public/locations]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
