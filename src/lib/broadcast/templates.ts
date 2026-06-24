// lib/broadcast/templates.ts
//
// Client-safe template definitions and HTML renderers.
// Produces the inner htmlContent passed to broadcastEmail() in MailTemplate.ts,
// which wraps it in the full DIUSCADI email shell at send time.
// Safe to import from both client (modal) and server (API routes).

import { BroadcastTemplateId } from "@/types/broadcast";

// ── Template picker metadata ───────────────────────────────────────────────────

export interface TemplateDefinition {
  id: BroadcastTemplateId;
  label: string;
  description: string;
  emoji: string;
}

export const BROADCAST_TEMPLATES: TemplateDefinition[] = [
  {
    id: "raw_html",
    label: "Raw HTML",
    description: "Write your own HTML directly",
    emoji: "🖊️",
  },
  {
    id: "urgent_notice",
    label: "Urgent Notice",
    description: "Time-sensitive alert or critical update",
    emoji: "🚨",
  },
  {
    id: "general_announcement",
    label: "Announcement",
    description: "General message with optional bullet list",
    emoji: "📢",
  },
  {
    id: "event_promotion",
    label: "Event Promotion",
    description: "Structured event details — date, location, CTA",
    emoji: "📅",
  },
  {
    id: "community_update",
    label: "Community Update",
    description: "Multi-section community news or feature highlight",
    emoji: "🤝",
  },
  {
    id: "platform_update",
    label: "Platform Update",
    description: "Maintenance window, feature launch, or critical notice",
    emoji: "⚙️",
  },
];

// ── Shared primitives ─────────────────────────────────────────────────────────

const P = "#0f172a"; // primary slate-900
const A = "#facc15"; // accent yellow

function paragraphs(text: string): string {
  return text
    .split(/\n\n+/)
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:13px;color:#475569;line-height:1.8;">` +
        `${p.replace(/\n/g, "<br/>")}` +
        `</p>`,
    )
    .join("");
}

function ctaBtn(label: string, url: string): string {
  return `
    <div style="text-align:center;margin:28px 0 0;">
      <a href="${url}"
         style="display:inline-block;background:${P};color:#ffffff;text-decoration:none;
                font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;
                padding:14px 32px;border-radius:12px;">
        ${label}
      </a>
    </div>`;
}

function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:9px;font-weight:900;
                 color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;vertical-align:top;">
        ${label}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;
                 font-size:12px;font-weight:700;color:${P};vertical-align:top;">
        ${value}
      </td>
    </tr>`;
}

// ── Field interfaces ──────────────────────────────────────────────────────────

export interface UrgentNoticeFields {
  headline: string;
  urgencyLevel: "critical" | "high" | "medium";
  bodyText: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface GeneralAnnouncementFields {
  headline: string;
  bodyText: string;
  bulletPoints?: string[];
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface EventPromotionFields {
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventDescription: string;
  eventUrl: string;
  isFree: boolean;
  ticketPrice?: string;
  registrationDeadline?: string;
  ctaLabel?: string;
}

export interface CommunityUpdateFields {
  headline: string;
  intro: string;
  sections?: { heading: string; body: string }[];
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface PlatformUpdateFields {
  updateType: "maintenance" | "feature" | "critical" | "announcement";
  title: string;
  description: string;
  startTime?: string;
  endTime?: string;
  affectedFeatures?: string[];
  actionRequired?: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
}

// ── Renderers — each returns { htmlContent, subject } ─────────────────────────

export function renderUrgentNotice(f: UrgentNoticeFields): {
  htmlContent: string;
  subject: string;
} {
  const themes = {
    critical: { bg: "#fff1f2", color: "#991b1b", emoji: "🚨" },
    high: { bg: "#fffbeb", color: "#92400e", emoji: "⚠️" },
    medium: { bg: "#eff6ff", color: "#1e40af", emoji: "ℹ️" },
  };
  const t = themes[f.urgencyLevel];

  return {
    htmlContent: `
      <div style="background:${t.bg};border-radius:16px;padding:22px 28px;
                  margin-bottom:24px;text-align:center;">
        <div style="font-size:32px;margin-bottom:8px;">${t.emoji}</div>
        <div style="font-size:14px;font-weight:900;color:${t.color};
                    text-transform:uppercase;letter-spacing:0.05em;">${f.headline}</div>
      </div>
      ${paragraphs(f.bodyText)}
      ${f.ctaLabel && f.ctaUrl ? ctaBtn(f.ctaLabel, f.ctaUrl) : ""}
    `,
    subject:
      f.urgencyLevel === "critical" ? `🚨 ${f.headline}` : `⚠️ ${f.headline}`,
  };
}

export function renderGeneralAnnouncement(f: GeneralAnnouncementFields): {
  htmlContent: string;
  subject: string;
} {
  const bullets =
    f.bulletPoints && f.bulletPoints.length > 0
      ? `<ul style="margin:16px 0 20px;padding-left:20px;">
           ${f.bulletPoints
             .map(
               (b) =>
                 `<li style="font-size:13px;color:#475569;padding:4px 0;line-height:1.7;">${b}</li>`,
             )
             .join("")}
         </ul>`
      : "";

  return {
    htmlContent: `
      <h2 style="margin:0 0 16px;font-size:18px;font-weight:900;color:${P};">${f.headline}</h2>
      ${paragraphs(f.bodyText)}
      ${bullets}
      ${f.ctaLabel && f.ctaUrl ? ctaBtn(f.ctaLabel, f.ctaUrl) : ""}
    `,
    subject: f.headline,
  };
}

export function renderEventPromotion(f: EventPromotionFields): {
  htmlContent: string;
  subject: string;
} {
  const label = f.ctaLabel ?? "Register Now";
  const details: [string, string][] = [
    ["Date & Time", f.eventDate],
    ["Location", f.eventLocation],
    ["Admission", f.isFree ? "Free" : (f.ticketPrice ?? "Paid")],
    ...(f.registrationDeadline
      ? [["Register By", f.registrationDeadline] as [string, string]]
      : []),
  ];

  return {
    htmlContent: `
      <div style="background:#fefce8;border-radius:16px;padding:22px 28px;
                  margin-bottom:24px;text-align:center;">
        <div style="font-size:28px;margin-bottom:8px;">📅</div>
        <div style="font-size:15px;font-weight:900;color:${P};">${f.eventTitle}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">${f.eventDate}</div>
      </div>
      <p style="margin:0 0 14px;font-size:13px;color:#475569;line-height:1.8;">
        ${f.eventDescription}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        ${details.map(([l, v]) => detailRow(l, v)).join("")}
      </table>
      ${ctaBtn(label, f.eventUrl)}
    `,
    subject: `${f.eventTitle} — ${label}`,
  };
}

export function renderCommunityUpdate(f: CommunityUpdateFields): {
  htmlContent: string;
  subject: string;
} {
  const sections =
    f.sections && f.sections.length > 0
      ? f.sections
          .map(
            (s) => `
            <div style="margin:20px 0;padding-top:16px;border-top:1px solid #f1f5f9;">
              <div style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;
                          letter-spacing:0.2em;margin-bottom:6px;">${s.heading}</div>
              <p style="margin:0;font-size:13px;color:#475569;line-height:1.8;">${s.body}</p>
            </div>`,
          )
          .join("")
      : "";

  return {
    htmlContent: `
      <h2 style="margin:0 0 16px;font-size:18px;font-weight:900;color:${P};">${f.headline}</h2>
      <p style="margin:0 0 14px;font-size:13px;color:#475569;line-height:1.8;">${f.intro}</p>
      ${sections}
      ${f.ctaLabel && f.ctaUrl ? ctaBtn(f.ctaLabel, f.ctaUrl) : ""}
    `,
    subject: f.headline,
  };
}

export function renderPlatformUpdate(f: PlatformUpdateFields): {
  htmlContent: string;
  subject: string;
} {
  const meta = {
    maintenance: {
      emoji: "🔧",
      color: "#92400e",
      bg: "#fffbeb",
      badge: "Scheduled Maintenance",
    },
    feature: {
      emoji: "✨",
      color: "#166534",
      bg: "#f0fdf4",
      badge: "New Feature",
    },
    critical: {
      emoji: "🚨",
      color: "#991b1b",
      bg: "#fff1f2",
      badge: "Critical Notice",
    },
    announcement: {
      emoji: "📣",
      color: P,
      bg: "#fefce8",
      badge: "Platform Announcement",
    },
  }[f.updateType];

  const timing =
    f.startTime || f.endTime
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
           ${f.startTime ? detailRow("Starts", f.startTime) : ""}
           ${f.endTime ? detailRow("Ends", f.endTime) : ""}
         </table>`
      : "";

  const features =
    f.affectedFeatures && f.affectedFeatures.length > 0
      ? `<div style="margin:16px 0;background:#f8fafc;border-left:3px solid ${A};
                     border-radius:8px;padding:12px 16px;">
           <div style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;
                       letter-spacing:0.2em;margin-bottom:8px;">Affected Features</div>
           <ul style="margin:0;padding-left:18px;">
             ${f.affectedFeatures
               .map(
                 (feat) =>
                   `<li style="font-size:12px;font-weight:600;color:#475569;padding:2px 0;">${feat}</li>`,
               )
               .join("")}
           </ul>
         </div>`
      : "";

  return {
    htmlContent: `
      <div style="background:${meta.bg};border-radius:16px;padding:22px 28px;
                  margin-bottom:24px;text-align:center;">
        <div style="font-size:28px;margin-bottom:8px;">${meta.emoji}</div>
        <div style="font-size:10px;font-weight:900;color:${meta.color};
                    text-transform:uppercase;letter-spacing:0.1em;">${meta.badge}</div>
        <div style="font-size:15px;font-weight:900;color:${meta.color};margin-top:4px;">
          ${f.title}
        </div>
      </div>
      <p style="margin:0 0 14px;font-size:13px;color:#475569;line-height:1.8;">${f.description}</p>
      ${timing}
      ${features}
      ${
        f.actionRequired
          ? `<div style="margin:16px 0;background:#fff1f2;border-radius:12px;padding:14px 18px;text-align:center;">
             <p style="margin:0;font-size:12px;font-weight:900;color:#991b1b;">
               ⚠ Action required — please read the details above carefully.
             </p>
           </div>`
          : ""
      }
      ${f.ctaLabel && f.ctaUrl ? ctaBtn(f.ctaLabel, f.ctaUrl) : ""}
    `,
    subject: `${meta.badge}: ${f.title}`,
  };
}

// ── Unified entry point ────────────────────────────────────────────────────────
// Called from BroadcastModal with the loose tf state object.
// communityUpdateSections is passed separately because it's a dedicated state array.

export function renderTemplateFromFields(
  templateId: BroadcastTemplateId,
  fields: Record<string, unknown>,
  communityUpdateSections?: { heading: string; body: string }[],
): { htmlContent: string; subject: string } {
  switch (templateId) {
    case "raw_html":
      return { htmlContent: String(fields.htmlContent ?? ""), subject: "" };

    case "urgent_notice":
      return renderUrgentNotice({
        headline: String(fields.headline ?? ""),
        urgencyLevel:
          (fields.urgencyLevel as "critical" | "high" | "medium") ?? "high",
        bodyText: String(fields.bodyText ?? ""),
        ctaLabel: fields.ctaLabel ? String(fields.ctaLabel) : undefined,
        ctaUrl: fields.ctaUrl ? String(fields.ctaUrl) : undefined,
      });

    case "general_announcement":
      return renderGeneralAnnouncement({
        headline: String(fields.headline ?? ""),
        bodyText: String(fields.bodyText ?? ""),
        // bulletPointsRaw: one item per line in a textarea
        bulletPoints: fields.bulletPointsRaw
          ? String(fields.bulletPointsRaw)
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        ctaLabel: fields.ctaLabel ? String(fields.ctaLabel) : undefined,
        ctaUrl: fields.ctaUrl ? String(fields.ctaUrl) : undefined,
      });

    case "event_promotion":
      return renderEventPromotion({
        eventTitle: String(fields.eventTitle ?? ""),
        eventDate: String(fields.eventDate ?? ""),
        eventLocation: String(fields.eventLocation ?? ""),
        eventDescription: String(fields.eventDescription ?? ""),
        eventUrl: String(fields.eventUrl ?? ""),
        isFree: fields.isFree === "true" || fields.isFree === true,
        ticketPrice: fields.ticketPrice
          ? String(fields.ticketPrice)
          : undefined,
        registrationDeadline: fields.registrationDeadline
          ? String(fields.registrationDeadline)
          : undefined,
        ctaLabel: fields.ctaLabel ? String(fields.ctaLabel) : undefined,
      });

    case "community_update":
      return renderCommunityUpdate({
        headline: String(fields.headline ?? ""),
        intro: String(fields.intro ?? ""),
        sections: communityUpdateSections?.filter(
          (s) => s.heading.trim() || s.body.trim(),
        ),
        ctaLabel: fields.ctaLabel ? String(fields.ctaLabel) : undefined,
        ctaUrl: fields.ctaUrl ? String(fields.ctaUrl) : undefined,
      });

    case "platform_update":
      return renderPlatformUpdate({
        updateType:
          (fields.updateType as
            | "maintenance"
            | "feature"
            | "critical"
            | "announcement") ?? "announcement",
        title: String(fields.title ?? ""),
        description: String(fields.description ?? ""),
        startTime: fields.startTime ? String(fields.startTime) : undefined,
        endTime: fields.endTime ? String(fields.endTime) : undefined,
        // affectedFeaturesRaw: one feature per line
        affectedFeatures: fields.affectedFeaturesRaw
          ? String(fields.affectedFeaturesRaw)
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        actionRequired:
          fields.actionRequired === "true" || fields.actionRequired === true,
        ctaLabel: fields.ctaLabel ? String(fields.ctaLabel) : undefined,
        ctaUrl: fields.ctaUrl ? String(fields.ctaUrl) : undefined,
      });

    default:
      return { htmlContent: "", subject: "" };
  }
}
