// PATCH /api/admin/users/[id]/verified-skills
// Admin/webmaster only. Sets verifiedSkills[] on a user's userData document.
import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

type Context = {
  params?: Promise<Record<string, string>> | Record<string, string>;
};

export const PATCH = withAuth(
  async (req: AuthenticatedRequest, context?: Context) => {
    try {
      if (!["admin", "webmaster"].includes(req.auth.role)) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 },
        );
      }
      const params = context?.params
        ? await Promise.resolve(context.params)
        : {};
      const id = params.id as string;
      if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
      }
      const { verifiedSkills } = await req.json();
      if (!Array.isArray(verifiedSkills)) {
        return NextResponse.json(
          { error: "verifiedSkills must be an array" },
          { status: 400 },
        );
      }
      const db = await getDb();
      // Validate all slugs exist in skills collection
      const validSkills = await Collections.skills(db)
        .find({ isActive: true }, { projection: { slug: 1 } })
        .toArray();
      const validSlugs = new Set(validSkills.map((s) => s.slug as string));
      const invalid = (verifiedSkills as string[]).filter(
        (s) => !validSlugs.has(s),
      );
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: `Invalid skill slugs: ${invalid.join(", ")}` },
          { status: 400 },
        );
      }
      const result = await Collections.userData(db).findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            verifiedSkills: verifiedSkills as string[],
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" },
      );
      if (!result)
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      return NextResponse.json({
        message: "Verified skills updated",
        verifiedSkills,
      });
    } catch (err) {
      console.error("[PATCH /api/admin/users/[id]/verified-skills]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
