// GET  /api/platform/institutions — public, list institutions with filters
// POST /api/platform/institutions — webmaster only, create institution

import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import type { InstitutionDocument } from "@/lib/models/institution";

// ── GET — public ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const state = searchParams.get("state");
    const membership = searchParams.get("membership");
    const level = searchParams.get("level");
    const search = searchParams.get("search");
    const all = searchParams.get("all") === "true";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);

    const db = await getDb();

    const filter: Record<string, unknown> = {};
    if (!all) filter.isActive = true;
    if (type) filter.type = type;
    if (state) filter.state = { $regex: state, $options: "i" };
    if (membership) filter.membership = membership;
    if (level) filter.level = level;
    if (search)
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { abbreviation: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ];

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
            isActive: 1,
            faculties: 1,
            membership: 1,
            level: 1,
            usid: 1,
            psid: 1,
            foundingYear: 1,
            hasLogo: 1,
            "logo.imageUrl": 1,
            hasBanner: 1,
            "banner.imageUrl": 1,
            gradingSystemConfirmed: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        })
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      Collections.institutions(db).countDocuments(filter),
    ]);

    return NextResponse.json({
      institutions: institutions.map((i) => ({
        id: i._id!.toString(),
        name: i.name,
        abbreviation: i.abbreviation,
        type: i.type,
        state: i.state,
        city: i.city ?? null,
        country: i.country,
        website: i.website ?? null,
        membership: i.membership ?? null,
        level: i.level ?? null,
        usid: i.usid ?? null,
        psid: i.psid ?? null,
        foundingYear: i.foundingYear ?? null,
        isActive: i.isActive,
        faculties: i.faculties.map((f) => f.toString()),
        hasLogo: i.hasLogo,
        logoUrl: i.logo?.imageUrl ?? null,
        hasBanner: i.hasBanner,
        bannerUrl: i.banner?.imageUrl ?? null,
        gradingSystemConfirmed: i.gradingSystemConfirmed,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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

    const body = await req.json();
    const { name, abbreviation, type, state, country } = body;

    if (!name || !abbreviation || !type || !state || !country) {
      return NextResponse.json(
        { error: "name, abbreviation, type, state, and country are required" },
        { status: 400 },
      );
    }
    if (!["University", "Polytechnic", "College", "Institute"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid institution type" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();
    const abbr = abbreviation.trim().toUpperCase();

    // Duplicate checks
    const [dupeByName, dupeByAbbr] = await Promise.all([
      Collections.institutions(db).findOne({
        name: { $regex: `^${name.trim()}$`, $options: "i" },
      }),
      Collections.institutions(db).findOne({
        abbreviation: { $regex: `^${abbr}$`, $options: "i" },
      }),
    ]);
    if (dupeByName)
      return NextResponse.json(
        { error: "Institution with this name already exists" },
        { status: 409 },
      );
    if (dupeByAbbr)
      return NextResponse.json(
        { error: "Institution with this abbreviation already exists" },
        { status: 409 },
      );

    const doc: InstitutionDocument = {
      name: name.trim(),
      abbreviation: abbr,
      type,
      state: state.trim(),
      city: body.city?.trim() || undefined,
      country: country.trim(),
      isActive: true,
      website: body.website?.trim() || undefined,
      membership: body.membership || undefined,
      level: body.level || undefined,
      foundingYear: body.foundingYear || undefined,
      motto: body.motto?.trim() || undefined,
      chancellor: body.chancellor?.trim() || undefined,
      viceChancellor: body.viceChancellor?.trim() || undefined,
      description: body.description?.trim() || undefined,
      // Generate IDs
      usid: `USID-${abbr.replace(/[^A-Z0-9]/g, "").slice(0, 8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      psid: `NG-${type === "Polytechnic" ? "POLY" : "UNI"}-${abbr.replace(/[^A-Z0-9]/g, "").slice(0, 10)}`,
      hasLogo: false,
      hasBanner: false,
      gradingSystemConfirmed: false,
      faculties: [],
      curriculum: [],
      createdAt: now,
      updatedAt: now,
    };

    const { insertedId } = await Collections.institutions(db).insertOne(doc);

    return NextResponse.json(
      {
        message: "Institution created successfully",
        institution: {
          id: insertedId.toString(),
          name: doc.name,
          abbreviation: doc.abbreviation,
          type: doc.type,
          state: doc.state,
          city: doc.city ?? null,
          country: doc.country,
          website: doc.website ?? null,
          membership: doc.membership ?? null,
          level: doc.level ?? null,
          usid: doc.usid,
          psid: doc.psid,
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
