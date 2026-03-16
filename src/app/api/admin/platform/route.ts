// app/api/admin/platform/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Webmaster-only CRUD for platform config collections.
// All three resource types are managed through this single file via
// a `resource` query param to keep the admin surface small.
//
// GET    /api/admin/platform?resource=committees|skills|committeeRoles
//        → full list including inactive items (admin needs to see everything)
//
// POST   /api/admin/platform?resource=...
//        → create a new document { ...fields }
//
// PATCH  /api/admin/platform?resource=...
//        → update by slug { slug, ...fieldsToUpdate }
//
// DELETE /api/admin/platform?resource=...
//        → deactivate (soft-delete) by slug { slug }
//        → hard delete is intentionally not exposed — use MongoDB directly
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import type { SkillCategory } from "@/lib/models/platformConfig";

// At the top of the file
function omitKeys<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((k) => delete result[k]);
  return result;
}

type Resource = "committees" | "skills" | "committeeRoles";
const VALID_RESOURCES: Resource[] = ["committees", "skills", "committeeRoles"];

const VALID_SKILL_CATEGORIES: SkillCategory[] = [
  "Creative",
  "Technical",
  "Business",
  "Communication",
  "Other",
];

// ─── Webmaster guard (shared) ─────────────────────────────────────────────────
async function assertWebmaster(req: AuthenticatedRequest): Promise<boolean> {
  const db = await getDb();
  const vault = await Collections.vault(db).findOne({
    _id: new ObjectId(req.auth.vaultId),
  });
  return vault?.role === "webmaster";
}

function parseResource(req: AuthenticatedRequest): Resource | null {
  const r = new URL(req.url).searchParams.get("resource");
  return VALID_RESOURCES.includes(r as Resource) ? (r as Resource) : null;
}

// ─── GET — full list including inactive ──────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (!(await assertWebmaster(req))) {
      return NextResponse.json({ error: "Webmaster only" }, { status: 403 });
    }

    const resource = parseResource(req);
    if (!resource) {
      return NextResponse.json(
        { error: `resource must be one of: ${VALID_RESOURCES.join(", ")}` },
        { status: 400 },
      );
    }

    const db = await getDb();
    const col = db.collection(resource);
    const docs = await col
      .find({})
      .sort({ displayOrder: 1, rank: 1 })
      .toArray();

    return NextResponse.json({ [resource]: docs });
  } catch (err) {
    console.error("[GET /api/admin/platform]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// ─── POST — create ────────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (!(await assertWebmaster(req))) {
      return NextResponse.json({ error: "Webmaster only" }, { status: 403 });
    }

    const resource = parseResource(req);
    if (!resource) {
      return NextResponse.json(
        { error: `resource must be one of: ${VALID_RESOURCES.join(", ")}` },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { slug } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { error: "slug is required and must be a string" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const col = db.collection(resource);
    const now = new Date();

    // Prevent duplicate slugs
    const existing = await col.findOne({ slug: slug.trim().toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: `A ${resource} with slug "${slug}" already exists` },
        { status: 409 },
      );
    }

    // ── Resource-specific field validation ────────────────────────────────────
    if (resource === "committees") {
      const { name, description, color, icon, displayOrder } = body;
      if (!name || !description || !color || !icon) {
        return NextResponse.json(
          {
            error:
              "name, description, color, and icon are required for committees",
          },
          { status: 400 },
        );
      }

      const { insertedId } = await col.insertOne({
        slug: slug.trim().toLowerCase(),
        name: name.trim(),
        description: description.trim(),
        color: color.trim(),
        icon: icon.trim(),
        headName: body.headName?.trim() ?? undefined,
        memberCount: 0,
        isActive: true,
        displayOrder: typeof displayOrder === "number" ? displayOrder : 99,
        createdBy: new ObjectId(req.auth.vaultId),
        createdAt: now,
        updatedAt: now,
      });

      return NextResponse.json(
        { message: "Committee created", id: insertedId.toString() },
        { status: 201 },
      );
    }

    if (resource === "skills") {
      const { name, category, displayOrder } = body;
      if (!name || !category) {
        return NextResponse.json(
          { error: "name and category are required for skills" },
          { status: 400 },
        );
      }
      if (!VALID_SKILL_CATEGORIES.includes(category)) {
        return NextResponse.json(
          {
            error: `category must be one of: ${VALID_SKILL_CATEGORIES.join(", ")}`,
          },
          { status: 400 },
        );
      }

      const { insertedId } = await col.insertOne({
        slug: slug.trim().toLowerCase(),
        name: name.trim(),
        category,
        isActive: true,
        displayOrder: typeof displayOrder === "number" ? displayOrder : 99,
        createdBy: new ObjectId(req.auth.vaultId),
        createdAt: now,
        updatedAt: now,
      });

      return NextResponse.json(
        { message: "Skill created", id: insertedId.toString() },
        { status: 201 },
      );
    }

    if (resource === "committeeRoles") {
      const { name, rank, description, displayOrder } = body;
      if (!name || typeof rank !== "number" || !description) {
        return NextResponse.json(
          {
            error:
              "name, rank (number), and description are required for committeeRoles",
          },
          { status: 400 },
        );
      }

      const { insertedId } = await col.insertOne({
        slug: slug.trim().toUpperCase(),
        name: name.trim(),
        rank,
        description: description.trim(),
        isActive: true,
        displayOrder: typeof displayOrder === "number" ? displayOrder : 99,
        createdBy: new ObjectId(req.auth.vaultId),
        createdAt: now,
        updatedAt: now,
      });

      return NextResponse.json(
        { message: "Committee role created", id: insertedId.toString() },
        { status: 201 },
      );
    }

    return NextResponse.json({ error: "Unhandled resource" }, { status: 400 });
  } catch (err) {
    console.error("[POST /api/admin/platform]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// ─── PATCH — update by slug ───────────────────────────────────────────────────
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (!(await assertWebmaster(req))) {
      return NextResponse.json({ error: "Webmaster only" }, { status: 403 });
    }

    const resource = parseResource(req);
    if (!resource) {
      return NextResponse.json(
        { error: `resource must be one of: ${VALID_RESOURCES.join(", ")}` },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { slug, ...updates } = body;

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection(resource);

    // Strip out fields that must never be overwritten via PATCH
    // In the PATCH handler — replaces the destructure block entirely
    const safeUpdates = omitKeys(updates, [
      "_id",
      "createdBy",
      "createdAt",
      "memberCount",
    ]);

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    // Validate category if being updated on a skill
    if (resource === "skills" && safeUpdates.category) {
      if (!VALID_SKILL_CATEGORIES.includes(safeUpdates.category)) {
        return NextResponse.json(
          {
            error: `category must be one of: ${VALID_SKILL_CATEGORIES.join(", ")}`,
          },
          { status: 400 },
        );
      }
    }

    const result = await col.updateOne(
      { slug },
      { $set: { ...safeUpdates, updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: `No ${resource} found with slug "${slug}"` },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Updated successfully" });
  } catch (err) {
    console.error("[PATCH /api/admin/platform]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// ─── DELETE — soft-delete (deactivate) by slug ────────────────────────────────
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (!(await assertWebmaster(req))) {
      return NextResponse.json({ error: "Webmaster only" }, { status: 403 });
    }

    const resource = parseResource(req);
    if (!resource) {
      return NextResponse.json(
        { error: `resource must be one of: ${VALID_RESOURCES.join(", ")}` },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection(resource);

    const result = await col.updateOne(
      { slug },
      { $set: { isActive: false, updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: `No ${resource} found with slug "${slug}"` },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: `${resource} deactivated` });
  } catch (err) {
    console.error("[DELETE /api/admin/platform]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});