// POST /api/admin/institutions/bulk
// Webmaster only. Bulk import institutions from JSON array.
// Reuses the same seed logic — batched, idempotent, error-tolerant.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import type { InstitutionDocument } from "@/lib/models/institution";

const CHUNK_SIZE = 100;

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size)
    chunks.push(arr.slice(i, i + size));
  return chunks;
}

function generateUsid(abbr: string): string {
  const a = abbr
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  return `USID-${a}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function generatePsid(abbr: string, type: string): string {
  const code = type === "Polytechnic" ? "POLY" : "UNI";
  const a = abbr
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
  return `NG-${code}-${a}`;
}

function inferType(name: string): InstitutionDocument["type"] {
  const l = name.toLowerCase();
  if (l.includes("polytechnic")) return "Polytechnic";
  if (l.includes("college")) return "College";
  if (l.includes("institute")) return "Institute";
  return "University";
}

function inferMembership(name: string): InstitutionDocument["membership"] {
  const l = name.toLowerCase();
  if (l.includes("federal") || l.includes("state")) return "public";
  return "private";
}

function inferLevel(name: string): InstitutionDocument["level"] | undefined {
  const l = name.toLowerCase();
  if (l.includes("federal")) return "federal";
  if (l.includes("state")) return "state";
  return "private";
}

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (req.auth.role !== "webmaster") {
      return NextResponse.json(
        { error: "Webmaster access required" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const input: unknown[] = body.institutions ?? body.universities ?? body;

    if (!Array.isArray(input) || input.length === 0) {
      return NextResponse.json(
        { error: "Provide an array of institutions" },
        { status: 400 },
      );
    }
    if (input.length > 1000) {
      return NextResponse.json(
        { error: "Max 1000 institutions per request" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const col = Collections.institutions(db);
    const now = new Date();

    // De-duplicate against existing abbreviations
    const existingAbbrs = new Set(
      (await col.find({}, { projection: { abbreviation: 1 } }).toArray()).map(
        (d) => d.abbreviation.toUpperCase(),
      ),
    );

    const docs: InstitutionDocument[] = [];
    const validationErrors: string[] = [];

    for (const item of input) {
      const i = item as Record<string, unknown>;
      const name = String(i.name ?? "").trim();
      const abbreviation = String(i.abbreviation ?? "")
        .trim()
        .toUpperCase();
      const country = String(i.country ?? "Nigeria").trim();
      const state = String(i.state ?? "").trim();

      if (!name || !abbreviation || !state) {
        validationErrors.push(
          `Skipped — missing required fields: ${JSON.stringify({ name, abbreviation, state })}`,
        );
        continue;
      }
      if (existingAbbrs.has(abbreviation)) continue; // skip silently — already exists

      const type = (i.type as string) || inferType(name);

      docs.push({
        name,
        abbreviation,
        type: type as InstitutionDocument["type"],
        state,
        city: i.city ? String(i.city).trim() : undefined,
        country,
        isActive: true,
        website: i.website ? String(i.website).trim() : undefined,
        membership:
          (i.membership as InstitutionDocument["membership"]) ??
          inferMembership(name),
        level: (i.level as InstitutionDocument["level"]) ?? inferLevel(name),
        foundingYear: i.foundingYear ? Number(i.foundingYear) : undefined,
        motto: i.motto ? String(i.motto).trim() : undefined,
        chancellor: i.chancellor ? String(i.chancellor).trim() : undefined,
        viceChancellor: i.viceChancellor
          ? String(i.viceChancellor).trim()
          : undefined,
        usid: generateUsid(abbreviation),
        psid: generatePsid(abbreviation, type),
        hasLogo: false,
        hasBanner: false,
        gradingSystemConfirmed: false,
        faculties: [],
        curriculum: [],
        seededAt: now,
        seedSource: "admin-bulk-import",
        createdAt: now,
        updatedAt: now,
      });
    }

    if (docs.length === 0) {
      return NextResponse.json({
        inserted: 0,
        skipped: input.length,
        errors: validationErrors.length,
        validationErrors,
      });
    }

    // Batch insert
    const batches = chunk(docs, CHUNK_SIZE);
    let totalInserted = 0;
    let totalErrors = validationErrors.length;
    const batchErrors: string[] = [...validationErrors];

    for (const batch of batches) {
      try {
        const result = await col.insertMany(batch, { ordered: false });
        totalInserted += result.insertedCount;
      } catch (err: unknown) {
        const bwe = err as {
          insertedCount?: number;
          writeErrors?: { errmsg?: string }[];
        };
        totalInserted += bwe.insertedCount ?? 0;
        totalErrors += bwe.writeErrors?.length ?? 1;
        bwe.writeErrors?.forEach((e) =>
          batchErrors.push(e.errmsg ?? "Unknown error"),
        );
      }
    }

    const skipped = input.length - docs.length; // already existed

    return NextResponse.json({
      inserted: totalInserted,
      skipped,
      errors: totalErrors - validationErrors.length, // DB errors only
      validationErrors: validationErrors.slice(0, 20), // cap at 20 for response size
    });
  } catch (err) {
    console.error("[POST /api/admin/institutions/bulk]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
