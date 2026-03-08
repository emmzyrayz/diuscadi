// GET  /api/admin/events — admin + webmaster, list all events regardless of status
// POST /api/admin/events — admin + webmaster, create a new event

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

const ALLOWED_ROLES = ["admin", "webmaster"];

// ── GET ───────────────────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (!ALLOWED_ROLES.includes(req.auth.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: "i" };

    const db = await getDb();
    const col = Collections.events(db);
    const total = await col.countDocuments(filter);
    const events = await col
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Attach registration counts
    const eventIds = events.map((e) => e._id!);
    const regCounts = await Collections.eventRegistrations(db)
      .aggregate([
        { $match: { eventId: { $in: eventIds }, status: "registered" } },
        { $group: { _id: "$eventId", count: { $sum: 1 } } },
      ])
      .toArray();
    const countMap = new Map(
      regCounts.map((r) => [r._id.toString(), r.count as number]),
    );

    return NextResponse.json({
      events: events.map((e) => ({
        id: e._id!.toString(),
        title: e.title,
        slug: e.slug,
        status: e.status,
        category: e.category,
        format: e.format,
        eventDate: e.eventDate.toISOString(),
        endDate: e.endDate?.toISOString() ?? null,
        registrationDeadline: e.registrationDeadline.toISOString(),
        capacity: e.capacity,
        registered: countMap.get(e._id!.toString()) ?? 0,
        targetEduStatus: e.targetEduStatus,
        requiredSkills: e.requiredSkills ?? [],
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/events]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// ── POST ──────────────────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (!ALLOWED_ROLES.includes(req.auth.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const {
      title,
      slug,
      overview,
      description,
      shortDescription,
      category,
      format,
      location,
      locationScope,
      image,
      eventDate,
      endDate,
      registrationDeadline,
      capacity,
      targetEduStatus,
      requiredSkills,
      learningOutcomes,
      tags,
      level,
      instructor,
      duration,
      status,
    } = body;

    if (
      !title ||
      !slug ||
      !eventDate ||
      !registrationDeadline ||
      !format ||
      !category
    ) {
      return NextResponse.json(
        {
          error:
            "title, slug, eventDate, registrationDeadline, format, and category are required",
        },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();

    const slugExists = await Collections.events(db).findOne({ slug });
    if (slugExists) {
      return NextResponse.json(
        { error: "An event with this slug already exists" },
        { status: 409 },
      );
    }

    const { insertedId } = await Collections.events(db).insertOne({
      title: title.trim(),
      slug: slug.trim(),
      overview: overview ?? "",
      description: description ?? "",
      shortDescription: shortDescription ?? "",
      category,
      format,
      location: location ?? {},
      locationScope: locationScope ?? "local",
      image: image ?? "",
      eventDate: new Date(eventDate),
      registrationDeadline: new Date(registrationDeadline),
      capacity: typeof capacity === "number" ? capacity : 0,
      targetEduStatus: targetEduStatus ?? "ALL",
      requiredSkills: requiredSkills ?? [],
      learningOutcomes: learningOutcomes ?? [],
      tags: tags ?? [],
      status: status ?? "draft",
      createdBy: new ObjectId(req.auth.vaultId),
      createdAt: now,
      updatedAt: now,
      // Optional fields — only included when provided
      ...(endDate ? { endDate: new Date(endDate) } : {}),
      ...(level ? { level } : {}),
      ...(instructor ? { instructor } : {}),
      ...(duration ? { duration } : {}),
    });

    return NextResponse.json(
      {
        message: "Event created successfully",
        eventId: insertedId.toString(),
        slug: slug.trim(),
        status: status ?? "draft",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/admin/events]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
