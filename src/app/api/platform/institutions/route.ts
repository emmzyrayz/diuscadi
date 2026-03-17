// GET  /api/platform/institutions — public, list all active institutions
// POST /api/platform/institutions — webmaster only, create institution

import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";

// ── GET — public ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const state = searchParams.get("state");
    const search = searchParams.get("search");
    const all = searchParams.get("all") === "true";

    const db = await getDb();

    const filter: Record<string, unknown> = {};
    if (!all) filter.isActive = true;
    if (type) filter.type = type;
    if (state) filter.state = state;
    if (search) filter.name = { $regex: search, $options: "i" };

    const institutions = await Collections.institutions(db)
      .find(filter)
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({
      institutions: institutions.map((i) => ({
        id: i._id!.toString(),
        name: i.name,
        abbreviation: i.abbreviation,
        type: i.type,
        state: i.state,
        country: i.country,
        website: i.website ?? null,
        isActive: i.isActive,
        faculties: i.faculties.map((f) => f.toString()),
        gradingSystemConfirmed: i.gradingSystemConfirmed,
        // Media flags — URLs only, not full CloudinaryImage objects
        hasLogo: i.hasLogo,
        logoUrl: i.logo?.imageUrl ?? null,
        hasBanner: i.hasBanner,
        bannerUrl: i.banner?.imageUrl ?? null,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      })),
      total: institutions.length,
    });
  } catch (err) {
    console.error("[GET /api/platform/institutions]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ── POST — webmaster only ─────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (req.auth.role !== "webmaster") {
      return NextResponse.json(
        { error: "Webmaster access required" },
        { status: 403 },
      );
    }

    const { name, abbreviation, type, state, country, website } =
      await req.json();

    if (!name || !abbreviation || !type || !state || !country) {
      return NextResponse.json(
        { error: "name, abbreviation, type, state, and country are required" },
        { status: 400 },
      );
    }
    if (!["University", "Polytechnic"].includes(type)) {
      return NextResponse.json(
        { error: "type must be 'University' or 'Polytechnic'" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();

    // Check for duplicate name (case-insensitive)
    const existingName = await Collections.institutions(db).findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });
    if (existingName) {
      return NextResponse.json(
        { error: "An institution with this name already exists" },
        { status: 409 },
      );
    }

    // Check for duplicate abbreviation (case-insensitive)
    const existingAbbr = await Collections.institutions(db).findOne({
      abbreviation: { $regex: `^${abbreviation.trim()}$`, $options: "i" },
    });
    if (existingAbbr) {
      return NextResponse.json(
        { error: "An institution with this abbreviation already exists" },
        { status: 409 },
      );
    }

    const { insertedId } = await Collections.institutions(db).insertOne({
      name: name.trim(),
      abbreviation: abbreviation.trim().toUpperCase(),
      type,
      state: state.trim(),
      country: country.trim(),
      isActive: true,
      faculties: [],

      // ── Media — not set at creation time ──────────────────────────────────
      // Logo and banner are uploaded separately via POST /api/media/confirm.
      hasLogo: false,
      hasBanner: false,

      // ── Grading system — configured separately by webmaster ───────────────
      // Students cannot submit GPA records until gradingSystemConfirmed = true.
      gradingSystemConfirmed: false,

      // ── Curriculum — populated as students submit and admins approve ───────
      curriculum: [],

      ...(website ? { website: website.trim() } : {}),

      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        message: "Institution created successfully",
        institution: {
          id: insertedId.toString(),
          name: name.trim(),
          abbreviation: abbreviation.trim().toUpperCase(),
          type,
          state: state.trim(),
          country: country.trim(),
          website: website?.trim() ?? null,
          isActive: true,
          faculties: [],
          hasLogo: false,
          hasBanner: false,
          gradingSystemConfirmed: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/platform/institutions]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
