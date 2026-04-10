// GET /api/public/institutions — Read-only Nigerian Institutions API
// Public — no auth required.
// This is the foundation for the future standalone Nigerian Institutions API.
// Returns clean, nested JSON: institution → faculties → departments.
//
// Deliberately separate from /api/platform/institutions (operational data).
// This route only exposes public fields — no internal IDs, no grading data,
// no admin-only fields. Safe to expose externally.
//
// Future: when you launch the standalone API, this route's logic
// becomes the core of the new service — just extract and deploy separately.

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state");
    const type = searchParams.get("type");
    const membership = searchParams.get("membership");
    const level = searchParams.get("level");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20")),
    );
    const nested = searchParams.get("nested") !== "false"; // default true

    const db = await getDb();

    const filter: Record<string, unknown> = { isActive: true };
    if (state) filter.state = { $regex: state, $options: "i" };
    if (type) filter.type = type;
    if (membership) filter.membership = membership;
    if (level) filter.level = level;
    if (search) filter.$text = { $search: search };

    const [institutions, total] = await Promise.all([
      Collections.institutions(db)
        .find(filter, {
          projection: {
            name: 1,
            abbreviation: 1,
            type: 1,
            state: 1,
            city: 1,
            country: 1,
            website: 1,
            membership: 1,
            level: 1,
            usid: 1,
            psid: 1,
            foundingYear: 1,
            motto: 1,
            "logo.imageUrl": 1,
            hasLogo: 1,
            faculties: 1,
          },
        })
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      Collections.institutions(db).countDocuments(filter),
    ]);

    // ── Nested mode: populate faculties + departments ──────────────────────
    let response;

    if (nested && institutions.some((i) => i.faculties.length > 0)) {
      // Collect all faculty IDs across all returned institutions
      const allFacultyIds = institutions.flatMap(
        (i) => i.faculties as ObjectId[],
      );

      const faculties =
        allFacultyIds.length > 0
          ? await Collections.faculties(db)
              .find(
                { _id: { $in: allFacultyIds }, isActive: true },
                { projection: { name: 1, departments: 1 } },
              )
              .toArray()
          : [];

      // Collect all department IDs across all faculties
      const allDeptIds = faculties.flatMap((f) => f.departments as ObjectId[]);
      const departments =
        allDeptIds.length > 0
          ? await Collections.departments(db)
              .find(
                { _id: { $in: allDeptIds }, isActive: true },
                { projection: { name: 1 } },
              )
              .toArray()
          : [];

      // Build lookup maps
      const deptMap = new Map(
        departments.map((d) => [d._id!.toString(), d.name]),
      );
      const facultyMap = new Map(
        faculties.map((f) => [
          f._id!.toString(),
          {
            id: f._id!.toString(),
            name: f.name,
            departments: f.departments.map((dId) => ({
              id: dId.toString(),
              name: deptMap.get(dId.toString()) ?? "Unknown",
            })),
          },
        ]),
      );

      response = institutions.map((i) => ({
        id: i.usid ?? i._id!.toString(), // expose usid as primary ID in public API
        psid: i.psid ?? null,
        name: i.name,
        abbreviation: i.abbreviation,
        type: i.type,
        state: i.state,
        city: i.city ?? null,
        country: i.country,
        website: i.website ?? null,
        membership: i.membership ?? null,
        level: i.level ?? null,
        foundingYear: i.foundingYear ?? null,
        motto: i.motto ?? null,
        logoUrl: i.hasLogo ? (i.logo?.imageUrl ?? null) : null,
        faculties: (i.faculties as ObjectId[]).map(
          (fId) =>
            facultyMap.get(fId.toString()) ?? {
              id: fId.toString(),
              name: "Unknown",
              departments: [],
            },
        ),
      }));
    } else {
      // Flat mode — no join, just institution data
      response = institutions.map((i) => ({
        id: i.usid ?? i._id!.toString(),
        psid: i.psid ?? null,
        name: i.name,
        abbreviation: i.abbreviation,
        type: i.type,
        state: i.state,
        city: i.city ?? null,
        country: i.country,
        website: i.website ?? null,
        membership: i.membership ?? null,
        level: i.level ?? null,
        foundingYear: i.foundingYear ?? null,
        motto: i.motto ?? null,
        logoUrl: i.hasLogo ? (i.logo?.imageUrl ?? null) : null,
      }));
    }

    return NextResponse.json({
      data: response,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
        generatedAt: new Date().toISOString(),
        apiVersion: "1.0",
        note: "This API provides Nigerian higher institution data. For full integration see diuscadi.org.ng",
      },
    });
  } catch (err) {
    console.error("[GET /api/public/institutions]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
