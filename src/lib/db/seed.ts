// lib/db/seed.ts
// ─────────────────────────────────────────────────────────────────────────────
// Seeds platform config collections with initial data derived from the
// former domain.ts hardcoded values.
//
// Safe to run multiple times — uses upsert on slug so existing documents
// are updated, not duplicated.
//
// Run once after deploy:
//   pnpm dotenv -e .env.local -- tsx lib/db/seed.ts
// ─────────────────────────────────────────────────────────────────────────────

import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type {
  CommitteeDocument,
  SkillDocument,
  CommitteeRoleDocument,
} from "@/lib/models/platformConfig";

// ─── Use a sentinel ObjectId for seeded-by field ──────────────────────────────
// Represents "system seed" — not a real vault document.
const SYSTEM_ID = new ObjectId("000000000000000000000001");
const now = new Date();

// ─────────────────────────────────────────────────────────────────────────────
// § 1 — Committees
// ─────────────────────────────────────────────────────────────────────────────

const SEED_COMMITTEES: Omit<CommitteeDocument, "_id">[] = [
  {
    slug: "socials",
    name: "Socials",
    description:
      "Plans and executes social events, hangouts, and community bonding activities.",
    color: "rose",
    icon: "users",
    memberCount: 0,
    isActive: true,
    displayOrder: 1,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "media",
    name: "Media & Content",
    description:
      "Manages photography, videography, social media presence, and content creation.",
    color: "violet",
    icon: "camera",
    memberCount: 0,
    isActive: true,
    displayOrder: 2,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "logistics",
    name: "Logistics",
    description:
      "Coordinates event logistics, venue management, and operational planning.",
    color: "amber",
    icon: "truck",
    memberCount: 0,
    isActive: true,
    displayOrder: 3,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "innovation",
    name: "Innovation",
    description:
      "Drives technical projects, hackathons, and engineering initiatives.",
    color: "emerald",
    icon: "lightbulb",
    memberCount: 0,
    isActive: true,
    displayOrder: 4,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "mentorship",
    name: "Mentorship",
    description:
      "Connects students with mentors and organises career development programmes.",
    color: "sky",
    icon: "graduation-cap",
    memberCount: 0,
    isActive: true,
    displayOrder: 5,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "protocol",
    name: "Protocol",
    description:
      "Manages official communications, documentation, and organisational governance.",
    color: "slate",
    icon: "shield",
    memberCount: 0,
    isActive: true,
    displayOrder: 6,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// § 2 — Skills (grouped by category)
// ─────────────────────────────────────────────────────────────────────────────

const SEED_SKILLS: Omit<SkillDocument, "_id">[] = [
  // ── Creative ───────────────────────────────────────────────────────────────
  {
    slug: "photography",
    name: "Photography",
    category: "Creative",
    isActive: true,
    displayOrder: 1,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "design",
    name: "Design",
    category: "Creative",
    isActive: true,
    displayOrder: 2,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "fashion",
    name: "Fashion",
    category: "Creative",
    isActive: true,
    displayOrder: 3,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "videography",
    name: "Videography",
    category: "Creative",
    isActive: true,
    displayOrder: 4,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },

  // ── Technical ──────────────────────────────────────────────────────────────
  {
    slug: "programming",
    name: "Programming",
    category: "Technical",
    isActive: true,
    displayOrder: 1,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "electronics",
    name: "Electronics",
    category: "Technical",
    isActive: true,
    displayOrder: 2,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "tech",
    name: "Tech & IT",
    category: "Technical",
    isActive: true,
    displayOrder: 3,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "data-analysis",
    name: "Data Analysis",
    category: "Technical",
    isActive: true,
    displayOrder: 4,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },

  // ── Business ───────────────────────────────────────────────────────────────
  {
    slug: "project-management",
    name: "Project Management",
    category: "Business",
    isActive: true,
    displayOrder: 1,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "marketing",
    name: "Marketing",
    category: "Business",
    isActive: true,
    displayOrder: 2,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "finance",
    name: "Finance",
    category: "Business",
    isActive: true,
    displayOrder: 3,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },

  // ── Communication ──────────────────────────────────────────────────────────
  {
    slug: "public-speaking",
    name: "Public Speaking",
    category: "Communication",
    isActive: true,
    displayOrder: 1,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "writing",
    name: "Writing & Copywriting",
    category: "Communication",
    isActive: true,
    displayOrder: 2,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// § 3 — Committee Roles
// ─────────────────────────────────────────────────────────────────────────────

const SEED_COMMITTEE_ROLES: Omit<CommitteeRoleDocument, "_id">[] = [
  {
    slug: "MEMBER",
    name: "Member",
    rank: 1,
    description:
      "Standard committee member. Participates in activities and tasks.",
    isActive: true,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "COORDINATOR",
    name: "Coordinator",
    rank: 2,
    description: "Coordinates sub-teams and activities within the committee.",
    isActive: true,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "HEAD",
    name: "Head",
    rank: 3,
    description:
      "Leads the committee. Responsible for all committee operations and reporting.",
    isActive: true,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "ADMIN",
    name: "Admin",
    rank: 4,
    description:
      "Administrative oversight. Can manage committee membership and roles.",
    isActive: true,
    createdBy: SYSTEM_ID,
    createdAt: now,
    updatedAt: now,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// § 4 — Seed runner
// ─────────────────────────────────────────────────────────────────────────────

export async function seedPlatformConfig(): Promise<void> {
  const db = await getDb();

  // ── Committees ─────────────────────────────────────────────────────────────
  const committeeOps = SEED_COMMITTEES.map((doc) => ({
    updateOne: {
      filter: { slug: doc.slug },
      update: {
        $setOnInsert: { createdBy: doc.createdBy, createdAt: doc.createdAt },
        $set: {
          name: doc.name,
          description: doc.description,
          color: doc.color,
          icon: doc.icon,
          isActive: doc.isActive,
          displayOrder: doc.displayOrder,
          updatedAt: now,
        },
        // memberCount is never overwritten by seed — preserves live count
        $setOnInsert2: { memberCount: 0 },
      },
      upsert: true,
    },
  }));

  // $setOnInsert2 isn't valid — use two-stage approach for memberCount
  for (const doc of SEED_COMMITTEES) {
    await db.collection("committees").updateOne(
      { slug: doc.slug },
      {
        $setOnInsert: {
          memberCount: 0,
          createdBy: doc.createdBy,
          createdAt: doc.createdAt,
        },
        $set: {
          name: doc.name,
          description: doc.description,
          color: doc.color,
          icon: doc.icon,
          isActive: doc.isActive,
          displayOrder: doc.displayOrder,
          updatedAt: now,
        },
      },
      { upsert: true },
    );
  }
  console.log(`✓ committees (${SEED_COMMITTEES.length} upserted)`);

  // ── Skills ─────────────────────────────────────────────────────────────────
  for (const doc of SEED_SKILLS) {
    await db.collection("skills").updateOne(
      { slug: doc.slug },
      {
        $setOnInsert: {
          createdBy: doc.createdBy,
          createdAt: doc.createdAt,
        },
        $set: {
          name: doc.name,
          category: doc.category,
          isActive: doc.isActive,
          displayOrder: doc.displayOrder,
          updatedAt: now,
        },
      },
      { upsert: true },
    );
  }
  console.log(`✓ skills (${SEED_SKILLS.length} upserted)`);

  // ── Committee roles ────────────────────────────────────────────────────────
  for (const doc of SEED_COMMITTEE_ROLES) {
    await db.collection("committeeRoles").updateOne(
      { slug: doc.slug },
      {
        $setOnInsert: {
          createdBy: doc.createdBy,
          createdAt: doc.createdAt,
        },
        $set: {
          name: doc.name,
          rank: doc.rank,
          description: doc.description,
          isActive: doc.isActive,
          updatedAt: now,
        },
      },
      { upsert: true },
    );
  }
  console.log(`✓ committeeRoles (${SEED_COMMITTEE_ROLES.length} upserted)`);

  console.log("\n✅ Platform config seeded.");
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-seed guard — runs seed only if all three collections are empty.
// Called from your app startup or a one-time script.
// ─────────────────────────────────────────────────────────────────────────────

export async function seedIfEmpty(): Promise<void> {
  const db = await getDb();

  const [committeeCount, skillCount, roleCount] = await Promise.all([
    db.collection("committees").countDocuments(),
    db.collection("skills").countDocuments(),
    db.collection("committeeRoles").countDocuments(),
  ]);

  if (committeeCount === 0 || skillCount === 0 || roleCount === 0) {
    console.log("[seed] Platform config collections empty — seeding...");
    await seedPlatformConfig();
  }
}

// ─── CLI entry point ──────────────────────────────────────────────────────────
if (require.main === module) {
  seedPlatformConfig()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
