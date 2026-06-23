import { MetadataRoute } from "next";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://diuscadi.org.ng";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${base}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/gallery`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${base}/committee`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/programs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  let eventRoutes: MetadataRoute.Sitemap = [];
  try {
    const db = await getDb();
    const events = await Collections.events(db)
      .find({ status: "published" }, { projection: { slug: 1, updatedAt: 1 } })
      .toArray();

    eventRoutes = events.map((e) => ({
      url: `${base}/event-landing/${e.slug}`,
      lastModified: e.updatedAt ? new Date(e.updatedAt) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));
  } catch {
    // DB unavailable at build time — static routes only
  }

  return [...staticRoutes, ...eventRoutes];
}
