import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { LandingPageConfigDocument } from "@/lib/models/landingPageConfig";
import { UpdateFilter } from "mongodb";

const ALLOWED_ROLES = ["admin", "webmaster"];

export const PATCH = withAuth(
  async (
    req: AuthenticatedRequest,
    context?: {
      params?: Promise<Record<string, string>> | Record<string, string>;
    },
  ) => {
    if (!ALLOWED_ROLES.includes(req.auth.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    try {
      const params =
        context?.params instanceof Promise
          ? await context.params
          : context?.params;
      const slideId = params?.slideId;
      if (!slideId)
        return NextResponse.json({ error: "Missing slideId" }, { status: 400 });

      const { hidden } = (await req.json()) as { hidden: boolean };
      const db = await getDb();

      const update: UpdateFilter<LandingPageConfigDocument> = {
        $set: {
          "data.slides.$.hidden": hidden,
          updatedAt: new Date(),
        } as UpdateFilter<LandingPageConfigDocument>["$set"],
      };

      await Collections.landingPageConfig(db).updateOne(
        { sectionKey: "banner", "data.slides.id": slideId },
        update,
      );

      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error("[PATCH /api/admin/settings/landing/banner]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);

export const DELETE = withAuth(
  async (
    req: AuthenticatedRequest,
    context?: {
      params?: Promise<Record<string, string>> | Record<string, string>;
    },
  ) => {
    if (!ALLOWED_ROLES.includes(req.auth.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    try {
      const params =
        context?.params instanceof Promise
          ? await context.params
          : context?.params;
      const slideId = params?.slideId;
      if (!slideId)
        return NextResponse.json({ error: "Missing slideId" }, { status: 400 });

      const db = await getDb();

      // $pull on a Mixed/nested field requires a cast through UpdateFilter
      const update: UpdateFilter<LandingPageConfigDocument> = {
        $pull: {
          "data.slides": { id: slideId },
        } as UpdateFilter<LandingPageConfigDocument>["$pull"],
      };

      await Collections.landingPageConfig(db).updateOne(
        { sectionKey: "banner" },
        update,
      );

      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error("[DELETE /api/admin/settings/landing/banner]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
