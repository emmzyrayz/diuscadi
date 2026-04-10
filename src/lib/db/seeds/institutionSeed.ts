// lib/db/seeds/institutionSeed.ts

import { getDb } from "@/lib/mongodb";
import type { InstitutionDocument } from "@/lib/models/institution";

function generateUsid(abbreviation: string): string {
  const abbr = abbreviation
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `USID-${abbr}-${rand}`;
}

function generatePsid(abbreviation: string, type: string): string {
  const typeCode = type === "Polytechnic" ? "POLY" : "UNI";
  const abbr = abbreviation
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
  return `NG-${typeCode}-${abbr}`;
}

function normaliseName(name: string): string {
  return name.trim();
}

function inferType(name: string): InstitutionDocument["type"] {
  const lower = name.toLowerCase();
  if (lower.includes("polytechnic")) return "Polytechnic";
  if (lower.includes("college")) return "College";
  if (lower.includes("institute")) return "Institute";
  return "University";
}

function inferMembership(name: string): InstitutionDocument["membership"] {
  const lower = name.toLowerCase();
  if (lower.includes("federal") || lower.includes("federal capital"))
    return "public";
  if (lower.includes("state")) return "public";
  return "private";
}

function inferLevel(name: string): InstitutionDocument["level"] | undefined {
  const lower = name.toLowerCase();
  if (lower.includes("federal")) return "federal";
  if (lower.includes("state")) return "state";
  return "private";
}

const CHUNK_SIZE = 100;

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size)
    chunks.push(arr.slice(i, i + size));
  return chunks;
}

type UniversitySource = {
  name: string;
  state: string;
  city: string;
  abbreviation: string;
  website: string;
  type?: string; // present on some entries — preferred over inferred
};

export async function seedInstitutions(universities: UniversitySource[]) {
  const db = await getDb();
  const col = db.collection<InstitutionDocument>("institutions");
  const now = new Date();

  console.log(
    `\n📚 Starting institution seed — ${universities.length} raw entries`,
  );

  // ── Step 1: Build all documents ────────────────────────────────────────────
  const docs: InstitutionDocument[] = universities.map((u) => {
    const abbr = u.abbreviation.toUpperCase();

    // Use explicit type from source if present, otherwise infer from name
    const type: InstitutionDocument["type"] =
      u.type === "Polytechnic" || u.type === "College" || u.type === "Institute"
        ? u.type
        : inferType(u.name);

    return {
      name: normaliseName(u.name),
      abbreviation: abbr,
      type,
      state: u.state.trim(),
      city: u.city?.trim() || undefined,
      country: "Nigeria",
      isActive: true,
      usid: generateUsid(abbr),
      psid: generatePsid(abbr, type),
      membership: inferMembership(u.name),
      level: inferLevel(u.name),
      website: u.website?.trim() || undefined,
      gradingSystemConfirmed: false,
      faculties: [],
      curriculum: [],
      hasLogo: false,
      hasBanner: false,
      seededAt: now,
      seedSource: "ng-universities-v1",
      createdAt: now,
      updatedAt: now,
    };
  });

  // ── Step 2: Deduplicate source array by abbreviation ───────────────────────
  // Strategy: typed entry beats untyped entry.
  // If both have/lack type, the later entry wins (richer data tends to come last).
  const seenAbbrs = new Map<string, InstitutionDocument>();

  for (const doc of docs) {
    const key = doc.abbreviation.toUpperCase();
    const existing = seenAbbrs.get(key);

    if (!existing) {
      // First time seeing this abbreviation — always add
      seenAbbrs.set(key, doc);
    } else {
      // Already seen — only replace if current entry has an explicit type
      // from the source data (not inferred). We detect this by checking
      // whether the original source entry had a type field.
      const sourceEntry = universities.find(
        (u) => u.abbreviation.toUpperCase() === key,
      );
      const hasExplicitType = sourceEntry?.type !== undefined;

      if (hasExplicitType) {
        // Typed entry wins — merge: keep usid/psid from first, update type + name
        seenAbbrs.set(key, {
          ...existing,
          type: doc.type,
          name: doc.name,
          website: doc.website ?? existing.website,
          city: doc.city ?? existing.city,
          state: doc.state || existing.state,
        });
      }
      // else: existing entry is kept as-is
    }
  }

  const uniqueDocs = Array.from(seenAbbrs.values());
  console.log(
    `📋 ${docs.length} source entries → ${uniqueDocs.length} unique after dedup`,
  );

  // ── Step 3: Filter out already-seeded institutions ─────────────────────────
  const existingAbbrs = new Set(
    (await col.find({}, { projection: { abbreviation: 1 } }).toArray()).map(
      (d) => d.abbreviation.toUpperCase(),
    ),
  );

  const toInsert = uniqueDocs.filter((d) => !existingAbbrs.has(d.abbreviation));
  const skipped = uniqueDocs.length - toInsert.length;

  if (skipped > 0)
    console.log(`⚠️  Skipping ${skipped} already-existing institutions`);
  if (toInsert.length === 0) {
    console.log("✅ Nothing to insert — all institutions already exist.");
    return {
      inserted: 0,
      skipped,
      duplicatesRemoved: docs.length - uniqueDocs.length,
    };
  }

  // ── Step 4: Batch insert ───────────────────────────────────────────────────
  const batches = chunk(toInsert, CHUNK_SIZE);
  let totalInserted = 0;
  let totalErrors = 0;

  for (let i = 0; i < batches.length; i++) {
    try {
      const result = await col.insertMany(batches[i], { ordered: false });
      totalInserted += result.insertedCount;
      console.log(
        `  Batch ${i + 1}/${batches.length}: inserted ${result.insertedCount}`,
      );
    } catch (err: unknown) {
      const bwe = err as {
        insertedCount?: number;
        writeErrors?: { errmsg?: string }[];
      };
      totalInserted += bwe.insertedCount ?? 0;
      totalErrors += bwe.writeErrors?.length ?? 1;
      console.error(`  Batch ${i + 1}/${batches.length}: errors:`);
      (bwe.writeErrors ?? []).forEach((e) => console.error("    →", e.errmsg));
    }
  }

  // ── Step 5: Create indexes ─────────────────────────────────────────────────
  await col.createIndexes([
    {
      key: { abbreviation: 1 },
      unique: true,
      sparse: true,
      name: "institutions_abbreviation",
    },
    { key: { usid: 1 }, unique: true, sparse: true, name: "institutions_usid" },
    { key: { psid: 1 }, unique: true, sparse: true, name: "institutions_psid" },
    {
      key: { name: "text", abbreviation: "text" },
      name: "institutions_text_search",
    },
    { key: { state: 1 }, name: "institutions_state" },
    { key: { type: 1 }, name: "institutions_type" },
    { key: { membership: 1 }, name: "institutions_membership" },
    { key: { level: 1 }, name: "institutions_level" },
    { key: { isActive: 1 }, name: "institutions_active" },
    {
      key: { gradingSystemConfirmed: 1 },
      name: "institutions_gradingConfirmed",
    },
  ]);

  console.log(`\n✅ Seed complete`);
  console.log(`   Inserted:          ${totalInserted}`);
  console.log(`   Skipped (existing):${skipped}`);
  console.log(`   Duplicates removed:${docs.length - uniqueDocs.length}`);
  console.log(`   DB errors:         ${totalErrors}\n`);

  return {
    inserted: totalInserted,
    skipped,
    duplicatesRemoved: docs.length - uniqueDocs.length,
    errors: totalErrors,
  };
}

export async function seedCampusIndexes() {
  const db = await getDb();
  await db.collection("campuses").createIndexes([
    { key: { institutionId: 1 }, name: "campuses_institutionId" },
    { key: { institutionId: 1, type: 1 }, name: "campuses_inst_type" },
    { key: { isActive: 1 }, name: "campuses_active" },
  ]);
  console.log("✓ campuses indexes");
}

// ── CLI entry point ───────────────────────────────────────────────────────────

if (require.main === module) {
  import("@/assets/data/schoolData").then(async (mod) => {
    const universities = mod.default?.universities ?? [];
    if (universities.length === 0) {
      console.error(
        "❌ No universities found in schoolData — check export format",
      );
      process.exit(1);
    }
    try {
      await seedInstitutions(universities);
      await seedCampusIndexes();
      process.exit(0);
    } catch (err) {
      console.error("❌ Seed failed:", err);
      process.exit(1);
    }
  });
}
