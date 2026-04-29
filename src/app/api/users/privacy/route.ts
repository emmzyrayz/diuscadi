// PATCH /api/users/privacy — update privacy preferences
import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { PrivacyPreferences } from "@/types/domain";

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { profileVisibility, fieldPermissions } = body;
    const VALID = ["public", "members", "private"];
    if (profileVisibility && !VALID.includes(profileVisibility)) {
      return NextResponse.json(
        { error: "Invalid profileVisibility value" },
        { status: 400 },
      );
    }
    if (fieldPermissions) {
      const fields = ["phone", "email", "location", "socials", "academic"];
      for (const f of fields) {
        if (fieldPermissions[f] && !VALID.includes(fieldPermissions[f])) {
          return NextResponse.json(
            { error: `Invalid value for ${f}` },
            { status: 400 },
          );
        }
      }
    }
    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);
    const existing = await Collections.userData(db).findOne(
      { vaultId },
      { projection: { preferences: 1 } },
    );
    const currentPrivacy = (existing?.preferences?.privacy ??
      {}) as Partial<PrivacyPreferences>;
    const updatedPrivacy = {
      ...currentPrivacy,
      ...(profileVisibility ? { profileVisibility } : {}),
      fieldPermissions: {
        ...(currentPrivacy.fieldPermissions ?? {}),
        ...(fieldPermissions ?? {}),
      },
    };
    await Collections.userData(db).updateOne(
      { vaultId },
      {
        $set: { "preferences.privacy": updatedPrivacy, updatedAt: new Date() },
      },
    );
    return NextResponse.json({
      message: "Privacy settings updated",
      privacy: updatedPrivacy,
    });
  } catch (err) {
    console.error("[PATCH /api/users/privacy]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});