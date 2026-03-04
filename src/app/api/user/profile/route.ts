// app/api/user/profile/route.ts
// PATCH /api/user/profile — update the authenticated user's own profile.
// Body: { section: "identity" | "contact" | "institution" | "skills" | "committee" | "bio", data: {} }

import { NextResponse } from "next/server";
import {
  withAuth,
  AuthenticatedRequest as AuthedRequest,
} from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import {
  COMMITTEES,
  SKILLS,
  Committee,
  Skill,
  PhoneNumber,
} from "@/types/domain";

const VALID_SECTIONS = [
  "identity",
  "contact",
  "institution",
  "skills",
  "committee",
  "bio",
] as const;
type Section = (typeof VALID_SECTIONS)[number];

async function handler(req: AuthedRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { section, data } = body as {
      section: Section;
      data: Record<string, unknown>;
    };

    if (!section || !VALID_SECTIONS.includes(section)) {
      return NextResponse.json(
        {
          error: `Invalid section. Must be one of: ${VALID_SECTIONS.join(", ")}`,
        },
        { status: 400 },
      );
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json(
        { error: "data must be an object." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const userId = new ObjectId(req.auth.vaultId);

    const userData = await Collections.userData(db).findOne({
      vaultId: userId,
    });
    if (!userData) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 404 },
      );
    }

    const now = new Date();
    const $set: Record<string, unknown> = { updatedAt: now };
    const errors: string[] = [];

    // ── identity ──────────────────────────────────────────────────────────────
    if (section === "identity") {
      if (data.fullName !== undefined) {
        if (typeof data.fullName !== "string" || !data.fullName.trim()) {
          errors.push("fullName must be a non-empty string.");
        } else {
          $set["fullName"] = data.fullName.trim();
        }
      }
      if (data.avatar !== undefined) {
        $set["avatar"] =
          typeof data.avatar === "string" ? data.avatar.trim() : undefined;
      }
    }

    // ── contact ───────────────────────────────────────────────────────────────
    if (section === "contact") {
      if (data.phone !== undefined) {
        const p = data.phone as Partial<PhoneNumber>;
        if (
          typeof p.countryCode !== "number" ||
          typeof p.phoneNumber !== "number" ||
          p.countryCode < 1 ||
          p.phoneNumber < 1
        ) {
          errors.push(
            "phone must be { countryCode: number, phoneNumber: number }.",
          );
        } else {
          const conflict = await Collections.vault(db).findOne({
            "phone.phoneNumber": p.phoneNumber,
            _id: { $ne: userId },
          });
          if (conflict) {
            errors.push("Phone number already registered to another account.");
          } else {
            const phoneData: PhoneNumber = {
              countryCode: p.countryCode,
              phoneNumber: p.phoneNumber,
            };
            $set["phone"] = phoneData;
            // Mirror to Vault — phone lives in both for auth + display
            await Collections.vault(db).updateOne(
              { _id: userId },
              { $set: { phone: phoneData, updatedAt: now } },
            );
          }
        }
      }
      if (data.schoolEmail !== undefined) {
        if (!data.schoolEmail) {
          $set["schoolEmail"] = null; // clearing allowed
        } else if (
          typeof data.schoolEmail !== "string" ||
          !/\S+@\S+\.\S+/.test(data.schoolEmail)
        ) {
          errors.push("schoolEmail must be a valid email address.");
        } else {
          const lower = data.schoolEmail.toLowerCase().trim();
          const conflict = await Collections.userData(db).findOne({
            schoolEmail: lower,
            vaultId: { $ne: userId },
          });
          if (conflict) {
            errors.push("School email already registered to another account.");
          } else {
            $set["schoolEmail"] = lower;
          }
        }
      }
    }

    // ── institution ───────────────────────────────────────────────────────────
    if (section === "institution") {
      const validTypes = ["University", "Polytechnic"];
      const validSemesters = ["First", "Second"];

      if (data.Type !== undefined) {
        if (!validTypes.includes(data.Type as string)) {
          errors.push(
            `Institution.Type must be one of: ${validTypes.join(", ")}.`,
          );
        } else {
          $set["Institution.Type"] = data.Type;
        }
      }
      for (const f of [
        "name",
        "department",
        "faculty",
        "level",
        "currentStatus",
      ] as const) {
        if (data[f] !== undefined) {
          $set[`Institution.${f}`] =
            typeof data[f] === "string"
              ? (data[f] as string).trim() || undefined
              : undefined;
        }
      }
      if (data.semester !== undefined) {
        if (!validSemesters.includes(data.semester as string)) {
          errors.push(
            `Institution.semester must be one of: ${validSemesters.join(", ")}.`,
          );
        } else {
          $set["Institution.semester"] = data.semester;
        }
      }
      if (data.graduationYear !== undefined) {
        const yr = Number(data.graduationYear);
        if (isNaN(yr) || yr < 1990 || yr > 2100) {
          errors.push(
            "Institution.graduationYear must be a valid year (1990–2100).",
          );
        } else {
          $set["Institution.graduationYear"] = yr;
        }
      }
    }

    // ── skills ────────────────────────────────────────────────────────────────
    if (section === "skills") {
      if (!Array.isArray(data.skills)) {
        errors.push("skills must be an array.");
      } else {
        const invalid = (data.skills as string[]).filter(
          (s) => !SKILLS.includes(s as Skill),
        );
        if (invalid.length) {
          errors.push(
            `Invalid skills: ${invalid.join(", ")}. Valid: ${SKILLS.join(", ")}.`,
          );
        } else {
          $set["skills"] = data.skills;
        }
      }
    }

    // ── committee ─────────────────────────────────────────────────────────────
    if (section === "committee") {
      if (data.committee === null) {
        $set["committee"] = null;
      } else if (!COMMITTEES.includes(data.committee as Committee)) {
        errors.push(`committee must be one of: ${COMMITTEES.join(", ")}.`);
      } else {
        $set["committee"] = data.committee;
      }
    }

    // ── bio ───────────────────────────────────────────────────────────────────
    if (section === "bio") {
      if (typeof data.bio !== "string") {
        errors.push("bio must be a string.");
      } else {
        $set["profile.bio"] = data.bio.trim();
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    // ── Auto-compute profileCompleted ─────────────────────────────────────────
    // Profile is "complete" when: fullName + Institution.name + Institution.department exist
    const mergedName =
      ($set["fullName"] as string | undefined) ?? userData.fullName;
    const mergedInst = {
      ...userData.Institution,
      ...Object.fromEntries(
        Object.entries($set)
          .filter(([k]) => k.startsWith("Institution."))
          .map(([k, v]) => [k.replace("Institution.", ""), v]),
      ),
    };
    $set["profileCompleted"] = !!(
      mergedName &&
      mergedInst.name &&
      mergedInst.department
    );

    await Collections.userData(db).updateOne({ vaultId: userId }, { $set });

    const updated = await Collections.userData(db).findOne(
      { vaultId: userId },
      { projection: { vaultId: 0 } },
    );

    return NextResponse.json({ userData: updated });
  } catch (err) {
    console.error("[PATCH /api/user/profile]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

export const PATCH = withAuth(handler);

// ─── GET /api/user/profile ────────────────────────────────────────────────────
// Returns the full UserData document for the authenticated user.
// Used by UserContext.refreshProfile().

async function getHandler(req: AuthedRequest): Promise<NextResponse> {
  try {
    const db = await getDb();
    const userId = new ObjectId(req.auth.vaultId);

    const userData = await Collections.userData(db).findOne(
      { vaultId: userId },
      { projection: { vaultId: 0 } },
    );

    if (!userData) {
      return NextResponse.json(
        { error: "Profile not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ userData });
  } catch (err) {
    console.error("[GET /api/user/profile]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

export const GET = withAuth(getHandler);