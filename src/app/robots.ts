import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://diuscadi.org.ng";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/contact",
          "/gallery",
          "/committee",
          "/programs",
          "/event-landing/",
        ],
        disallow: [
          "/admin/",
          "/home",
          "/profile/",
          "/settings/",
          "/tickets/",
          "/auth/",
          "/api/",
          "/unauthorized",
          "/verify/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
