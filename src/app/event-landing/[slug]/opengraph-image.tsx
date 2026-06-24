import { ImageResponse } from "next/og";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function OgImage({ params }: Props) {
  const { slug } = await params;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://diuscadi.org.ng";

  // Defaults in case DB fetch fails
  let title = "DIUSCADI Event";
  let date = "";
  let location = "Nigeria";
  let bannerUrl: string | null = null;

  try {
    const db = await getDb();
    const event = await Collections.events(db).findOne(
      { slug, status: "published" },
      {
        projection: {
          title: 1,
          shortDescription: 1,
          eventDate: 1,
          format: 1,
          location: 1,
          eventBanner: 1,
        },
      },
    );

    if (event) {
      title = String(event.title);
      date = new Date(event.eventDate as Date).toLocaleDateString("en-NG", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Africa/Lagos",
      });
      const loc = event.location as Record<string, string> | undefined;
      location =
        event.format === "virtual"
          ? "Virtual / Online"
          : [loc?.venue, loc?.city].filter(Boolean).join(", ") || "Nigeria";
      bannerUrl = event.eventBanner?.imageUrl ?? null;
    }
  } catch {
    // Fall through to defaults
  }

  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        fontFamily: "sans-serif",
        backgroundColor: "#0a0a1a",
        overflow: "hidden",
      }}
    >
      {/* Background banner image if available */}
      {bannerUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bannerUrl}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.25,
          }}
        />
      )}

      {/* Dark gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(10,10,26,0.95) 0%, rgba(10,10,26,0.75) 100%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
          padding: "56px 72px",
        }}
      >
        {/* Top: logo + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${base}/logo-mark.webp`}
            alt="DIUSCADI"
            width={48}
            height={48}
            style={{ borderRadius: 8 }}
          />
          <span
            style={{
              color: "#818cf8",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            DIUSCADI
          </span>
        </div>

        {/* Middle: event title */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#818cf8",
              }}
            />
            <span
              style={{
                color: "#818cf8",
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Event Registration
            </span>
          </div>
          <div
            style={{
              color: "#f1f5f9",
              fontSize: title.length > 60 ? 44 : 54,
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: 900,
            }}
          >
            {title}
          </div>
        </div>

        {/* Bottom: date, location, CTA */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {date && (
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: 22,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                📅 {date}
              </div>
            )}
            <div
              style={{
                color: "#94a3b8",
                fontSize: 22,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              📍 {location}
            </div>
          </div>

          {/* CTA pill */}
          <div
            style={{
              backgroundColor: "#6366f1",
              color: "#ffffff",
              fontSize: 22,
              fontWeight: 800,
              padding: "18px 36px",
              borderRadius: 14,
              letterSpacing: "0.04em",
            }}
          >
            Register Free →
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
