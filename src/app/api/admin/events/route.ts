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

    // Attach registration counts via aggregation — avoids N+1 queries
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

        // ── Media flags + URLs for admin list view ──────────────────────────
        // Flags let the UI show "no logo" / "no banner" badges without having
        // to inspect the full CloudinaryImage object.
        // imageUrl fields are included for quick thumbnail previews in the list.
        hasEventLogo: e.hasEventLogo,
        eventLogoUrl: e.eventLogo?.imageUrl ?? null,
        hasEventBanner: e.hasEventBanner,
        eventBannerUrl: e.eventBanner?.imageUrl ?? null,
        hasEventGallery: e.hasEventGallery,
        galleryCount: e.eventGallery?.length ?? 0,
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
      eventDate,
      endDate,
      registrationDeadline,
      capacity,
      ticketPrice,
      targetEduStatus,
      requiredSkills,
      learningOutcomes,
      tags,
      level,
      instructor,
      duration,
      status,
    } = body;

    // Note: `image` is intentionally NOT accepted here.
    // Event media (logo, banner, gallery) is uploaded separately via the
    // media upload pipeline after the event document is created.
    // Accepting a raw image string at creation time would bypass Cloudinary.

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

    const normalizedCapacity =
      typeof capacity === "number" && Number.isFinite(capacity)
        ? Math.max(0, capacity)
        : 0;
    const normalizedTicketPrice =
      typeof ticketPrice === "number" && Number.isFinite(ticketPrice)
        ? Math.max(0, ticketPrice)
        : 0;

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
      eventDate: new Date(eventDate),
      registrationDeadline: new Date(registrationDeadline),
      capacity: normalizedCapacity,
      targetEduStatus: targetEduStatus ?? "ALL",
      requiredSkills: requiredSkills ?? [],
      learningOutcomes: learningOutcomes ?? [],
      tags: tags ?? [],
      status: status ?? "draft",
      createdBy: new ObjectId(req.auth.vaultId),

      // ── Media — initialised as empty at creation time ─────────────────────
      // Images are attached after creation via PATCH /api/admin/events/[id]/media.
      // Flags default to false; image fields are omitted until an upload succeeds.
      hasEventLogo: false,
      hasEventBanner: false,
      hasEventGallery: false,

      createdAt: now,
      updatedAt: now,

      // Optional fields — only spread when provided
      ...(endDate ? { endDate: new Date(endDate) } : {}),
      ...(level ? { level } : {}),
      ...(instructor ? { instructor } : {}),
      ...(duration ? { duration } : {}),
    });

    // Create default ticket tier so registration can always resolve ticketTypeId.
    await Collections.ticketTypes(db).insertOne({
      eventId: insertedId,
      name: normalizedTicketPrice > 0 ? "General Admission" : "Free Pass",
      price: normalizedTicketPrice,
      currency: "NGN",
      maxQuantity: normalizedCapacity,
      isActive: true,
      createdAt: now,
      updatedAt: now,
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
