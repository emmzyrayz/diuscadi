import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import type { BannerSlide } from "@/lib/models/landingPageConfig";


export async function GET(req: NextRequest) {
  if (
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const now = new Date();

    const doc = await Collections.landingPageConfig(db).findOne({
      sectionKey: "banner",
    });
    if (!doc) return NextResponse.json({ flagged: 0 });

    const slides = (doc.data as { slides: BannerSlide[] }).slides;
    let flagged = 0;

    const updated = slides.map((s) => {
      if (!s.hidden && s.expiresAt && new Date(s.expiresAt) <= now) {
        flagged++;
        return { ...s, hidden: true };
      }
      return s;
    });

    if (flagged > 0) {
      await Collections.landingPageConfig(db).updateOne(
        { sectionKey: "banner" },
        { $set: { "data.slides": updated, updatedAt: now } },
      );
    }

    return NextResponse.json({ flagged });
  } catch (err) {
    console.error("[cron/landing-banner]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
