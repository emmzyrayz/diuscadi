// lib/profileCompletion.ts
// Single source of truth for profile completion calculation.
// Used by both /profile/page.tsx (client) and /lib/homeData.ts (server).
//
// CHECKPOINTS — each worth equal weight.
// Add / remove checkpoints here to update completion everywhere at once.
//
// When you add new profile sections (socials, verification, etc.)
// just add a new entry to CHECKPOINTS and it propagates everywhere.

export interface CompletionInput {
  hasAvatar: boolean;
  phone?: unknown; // truthy = present
  bio?: string; // non-empty = present
  firstname?: string;
  lastname?: string;
  institution?: {
    // UserProfile.Institution
    name?: string;
    department?: string;
    faculty?: string;
  };
  skills?: unknown[]; // length > 0 = present
  socials?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
  };
}

export interface CompletionCheckpoint {
  key: string;
  label: string; // shown in UI hints
  completed: boolean;
  weight: number; // relative weight (default 1)
}

export interface CompletionResult {
  pct: number; // 0-100
  checkpoints: CompletionCheckpoint[];
  missing: string[]; // labels of incomplete checkpoints
  isComplete: boolean; // pct === 100
  nextStep: string | null; // label of first incomplete item
}

// ── Checkpoint definitions ────────────────────────────────────────────────────

function buildCheckpoints(p: CompletionInput): CompletionCheckpoint[] {
  return [
    {
      key: "avatar",
      label: "Profile Photo",
      completed: p.hasAvatar,
      weight: 1,
    },
    {
      key: "name",
      label: "Full Name",
      completed: !!(p.firstname?.trim() && p.lastname?.trim()),
      weight: 1,
    },
    {
      key: "phone",
      label: "Phone Number",
      completed: !!p.phone,
      weight: 1,
    },
    {
      key: "bio",
      label: "Bio",
      completed: !!p.bio?.trim(),
      weight: 1,
    },
    {
      key: "institution",
      label: "Institution & Department",
      completed: !!(p.institution?.name && p.institution?.department),
      weight: 1,
    },
    {
      key: "skills",
      label: "Skills",
      completed: Array.isArray(p.skills) && p.skills.length > 0,
      weight: 1,
    },
    // Lighter weight — nice to have but not critical
    {
      key: "socials",
      label: "Social Links",
      completed: !!(
        p.socials?.linkedin ||
        p.socials?.github ||
        p.socials?.twitter ||
        p.socials?.portfolio
      ),
      weight: 0.5,
    },
  ];
}

// ── Main function ─────────────────────────────────────────────────────────────

export function calculateCompletion(input: CompletionInput): CompletionResult {
  const checkpoints = buildCheckpoints(input);

  const totalWeight = checkpoints.reduce((sum, c) => sum + c.weight, 0);
  const completedWeight = checkpoints
    .filter((c) => c.completed)
    .reduce((sum, c) => sum + c.weight, 0);

  const pct = Math.round((completedWeight / totalWeight) * 100);
  const missing = checkpoints.filter((c) => !c.completed).map((c) => c.label);
  const isComplete = pct >= 100;
  const nextStep = checkpoints.find((c) => !c.completed)?.label ?? null;

  return { pct, checkpoints, missing, isComplete, nextStep };
}

// ── Server-side variant ───────────────────────────────────────────────────────
// Accepts the raw MongoDB userData document shape.
// Used in homeData.ts fetchHomeUser().

export interface RawUserDataForCompletion {
  hasAvatar?: boolean;
  phone?: unknown;
  fullName?: { firstname?: string; lastname?: string } | string;
  profile?: { bio?: string };
  Institution?: { name?: string; department?: string; faculty?: string };
  skills?: unknown[];
  socials?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
  };
}

export function calculateCompletionFromRaw(
  raw: RawUserDataForCompletion,
): CompletionResult {
  const fn = raw.fullName;
  const firstname =
    typeof fn === "object" && fn !== null
      ? (fn as { firstname?: string }).firstname
      : typeof fn === "string"
        ? fn
        : "";
  const lastname =
    typeof fn === "object" && fn !== null
      ? (fn as { lastname?: string }).lastname
      : "";

  return calculateCompletion({
    hasAvatar: raw.hasAvatar ?? false,
    phone: raw.phone,
    bio: raw.profile?.bio,
    firstname,
    lastname,
    institution: raw.Institution,
    skills: raw.skills,
    socials: raw.socials,
  });
}
