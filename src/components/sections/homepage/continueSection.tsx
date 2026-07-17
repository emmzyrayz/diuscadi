"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuPlay,
  LuClipboardCheck,
  LuUserPlus,
  LuChevronRight,
  LuClock,
  LuCircleCheck,
  LuCircleX,
  LuCircleAlert,
  LuCalendar,
  LuBookOpen,
  LuShare2,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useApplications } from "@/context/ApplicationContext";
import { useUser } from "@/context/UserContext";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TaskType =
  | "Membership"
  | "Application"
  | "Registration"
  | "Learning"    // upcoming
  | "Blog"        // upcoming
  | "Social"      // upcoming
  | "Event"
  | string;

export interface ContinueItem {
  type: TaskType;
  title: string;
  status: string;
  link: string;
  action: string;
  // Optional badge to override the default status badge
  badge?: {
    label: string;
    variant: "pending" | "approved" | "rejected" | "suspended" | "info";
  };
  // upcoming = greyed out, not yet clickable
  upcoming?: boolean;
}

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string }
> = {
  Membership: {
    icon: <LuUserPlus className={cn('w-5', 'h-5')} />,
    color: "bg-violet-600",
  },
  Application: {
    icon: <LuClipboardCheck className={cn('w-5', 'h-5')} />,
    color: "bg-purple-600",
  },
  Registration: {
    icon: <LuClipboardCheck className={cn('w-5', 'h-5')} />,
    color: "bg-blue-600",
  },
  Learning: {
    icon: <LuBookOpen className={cn('w-5', 'h-5')} />,
    color: "bg-emerald-600",
  },
  Blog: {
    icon: <LuPlay className={cn('w-5', 'h-5')} />,
    color: "bg-pink-600",
  },
  Social: {
    icon: <LuShare2 className={cn('w-5', 'h-5')} />,
    color: "bg-sky-600",
  },
  Event: {
    icon: <LuCalendar className={cn('w-5', 'h-5')} />,
    color: "bg-orange-500",
  },
};

const BADGE_CONFIG: Record<
  NonNullable<ContinueItem["badge"]>["variant"],
  { icon: React.ReactNode; classes: string }
> = {
  pending: {
    icon: <LuClock className={cn("w-3", "h-3")} />,
    classes: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  approved: {
    icon: <LuCircleCheck className={cn("w-3", "h-3")} />,
    classes: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  rejected: {
    icon: <LuCircleX className={cn("w-3", "h-3")} />,
    classes: "bg-red-50 text-red-700 border border-red-200",
  },
  suspended: {
    icon: <LuCircleAlert className={cn("w-3", "h-3")} />,
    classes: "bg-red-50 text-red-700 border border-red-200",
  },
  info: {
    icon: <LuCircleAlert className={cn("w-3", "h-3")} />,
    classes: "bg-blue-50 text-blue-700 border border-blue-200",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildMembershipTask(
  membershipStatus: string,
  hasPendingMembership: boolean,
  hasRejectedMembership: boolean,
): ContinueItem | null {
  // Already approved — no card needed
  if (membershipStatus === "approved") return null;

  if (membershipStatus === "suspended") {
    return {
      type: "Membership",
      title: "Account Suspended",
      status: "Your account has been suspended. Contact support to resolve.",
      link: "/contact",
      action: "Contact Support",
      badge: { label: "Suspended", variant: "suspended" },
    };
  }

  if (hasPendingMembership) {
    return {
      type: "Membership",
      title: "Membership Application",
      status: "Your application is under review. We'll notify you shortly.",
      link: "/profile/applications",
      action: "View Status",
      badge: { label: "Pending Review", variant: "pending" },
    };
  }

  if (hasRejectedMembership) {
    return {
      type: "Membership",
      title: "Membership Application",
      status: "Your previous application was not approved. You may re-apply.",
      link: "/profile/applications",
      action: "Re-apply",
      badge: { label: "Rejected", variant: "rejected" },
    };
  }

  // Default: not yet applied
  return {
    type: "Membership",
    title: "Apply for Membership",
    status: "Unlock full platform access by applying for DIUSCADI membership.",
    link: "/profile/applications",
    action: "Apply Now",
    badge: { label: "Action Required", variant: "info" },
  };
}

function buildCommitteeTask(
  hasPendingCommittee: boolean,
  hasCommittee: boolean,
): ContinueItem | null {
  if (hasCommittee || hasPendingCommittee === false) return null;

  if (hasPendingCommittee) {
    return {
      type: "Application",
      title: "Committee Application",
      status: "Your committee application is under review.",
      link: "/profile/applications",
      action: "View Status",
      badge: { label: "Pending", variant: "pending" },
    };
  }

  return null;
}

// ── Upcoming placeholder tasks ─────────────────────────────────────────────────
// These appear as locked/greyed cards until the feature ships.
// Remove from this list once the feature is live.
const UPCOMING_TASKS: ContinueItem[] = [
  // Uncomment when blog system is ready:
  // {
  //   type: "Blog",
  //   title: "Write for the DIUSCADI Blog",
  //   status: "Share your knowledge with the community.",
  //   link: "/blog/write",
  //   action: "Start Writing",
  //   upcoming: true,
  // },
  // Uncomment when learning system is ready:
  // {
  //   type: "Learning",
  //   title: "Start Learning Path",
  //   status: "Structured career development modules.",
  //   link: "/learn",
  //   action: "Start Learning",
  //   upcoming: true,
  // },
];

// ── Card ─────────────────────────────────────────────────────────────────────

function ContinueCard({
  item,
  index,
}: {
  item: ContinueItem;
  index: number;
}) {
  const config = TYPE_CONFIG[item.type] ?? {
    icon: <LuPlay className={cn('w-5', 'h-5')} />,
    color: "bg-muted",
  };

  const badgeCfg = item.badge ? BADGE_CONFIG[item.badge.variant] : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "min-w-[300px] lg:min-w-0 bg-background border border-border",
        "rounded-3xl p-6 flex flex-col transition-all duration-300 group",
        item.upcoming
          ? "opacity-50 pointer-events-none"
          : "hover:shadow-lg hover:shadow-slate-200/50",
      )}
    >
      {/* Header row */}
      <div className={cn('flex', 'items-start', 'justify-between', 'mb-4')}>
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            "text-background shadow-lg",
            item.upcoming ? "bg-muted" : config.color,
          )}
        >
          {config.icon}
        </div>

        <div className={cn('flex', 'flex-col', 'items-end', 'gap-1')}>
          <span
            className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              "text-muted-foreground bg-muted px-2 py-1 rounded-md",
            )}
          >
            {item.upcoming ? "Coming Soon" : item.type}
          </span>

          {/* Status badge */}
          {badgeCfg && item.badge && (
            <span
              className={cn(
                "flex items-center gap-1 text-[9px] font-black",
                "uppercase tracking-widest px-2 py-0.5 rounded-full",
                badgeCfg.classes,
              )}
            >
              {badgeCfg.icon}
              {item.badge.label}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={cn('mb-6', 'flex-1')}>
        <h4
          className={cn(
            "text-base font-bold text-foreground leading-tight mb-2",
            !item.upcoming && "group-hover:text-primary transition-colors",
          )}
        >
          {item.title}
        </h4>
        <p className={cn('text-xs', 'font-semibold', 'text-muted-foreground', 'leading-relaxed')}>
          {item.status}
        </p>
      </div>

      {/* Action */}
      <Link
        href={item.upcoming ? "#" : item.link}
        className={cn(
          "flex items-center justify-center gap-2 w-full py-3",
          "rounded-xl font-bold text-sm transition-all active:scale-95",
          item.upcoming
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-foreground text-background hover:bg-primary",
        )}
      >
        {item.upcoming ? "Coming Soon" : item.action}
        <LuChevronRight className={cn('w-4', 'h-4')} />
      </Link>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ContinueSectionProps {
  // Static items passed from the page (event registrations, etc.)
  // These are page-specific and can't be derived from context alone.
  items?: ContinueItem[];
}

export const ContinueSection = ({ items = [] }: ContinueSectionProps) => {
  const { profile } = useUser();
  const { applications, initialized, hasPending, getLatest } =
    useApplications();

  // ── Membership card ───────────────────────────────────────────────────────
  const membershipStatus = profile?.membershipStatus ?? "pending";
  const hasPendingMembership = hasPending("membership");
  const hasRejectedMembership =
    getLatest("membership")?.status === "rejected";

  const membershipTask = buildMembershipTask(
    membershipStatus,
    hasPendingMembership,
    hasRejectedMembership,
  );

  // ── Committee card ────────────────────────────────────────────────────────
  const hasCommittee = !!profile?.committeeMembership;
  const hasPendingCommittee = hasPending("committee");
  const committeeTask = buildCommitteeTask(hasPendingCommittee, hasCommittee);

  // ── Other pending applications (skills, program, etc.) ───────────────────
  const otherAppTasks: ContinueItem[] = initialized
    ? applications
        .filter(
          (a) =>
            a.status === "pending" &&
            a.type !== "membership" &&
            a.type !== "committee",
        )
        .map((a) => ({
          type: "Application",
          title:
            a.type === "skills"
              ? "Skills Verification"
              : a.type === "program"
                ? "Program Application"
                : a.type === "writer"
                  ? "Blog Contributor Application"
                  : a.type === "sponsorship"
                    ? "Sponsorship Application"
                    : "Application",
          status: "Your application is under review.",
          link: "/profile/applications",
          action: "View Status",
          badge: { label: "Pending", variant: "pending" as const },
        }))
    : [];

  // ── Merge all tasks ───────────────────────────────────────────────────────
  // Priority order: membership → committee → other apps → page items → upcoming
  const merged: ContinueItem[] = [
    ...(membershipTask ? [membershipTask] : []),
    ...(committeeTask ? [committeeTask] : []),
    ...otherAppTasks,
    ...items,                    // page-specific items (event registrations, etc.)
    ...UPCOMING_TASKS,           // locked upcoming feature cards
  ].slice(0, 4);                 // cap at 4 cards max

  if (merged.length === 0) return null;

  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'mt-12')}>
      <div className={cn('flex', 'items-center', 'justify-between', 'mb-6')}>
        <h3 className={cn('text-lg', 'font-black', 'text-foreground', 'flex', 'items-center', 'gap-2')}>
          Keep it going
          <span className={cn('w-2', 'h-2', 'rounded-full', 'bg-primary', 'animate-pulse')} />
        </h3>
        <Link
          href="/profile/applications"
          className={cn(
            "text-sm font-bold text-primary hover:underline",
            "flex items-center gap-1 cursor-pointer",
          )}
        >
          View all tasks <LuChevronRight className={cn('w-4', 'h-4')} />
        </Link>
      </div>

      <div
        className={cn(
          "flex overflow-x-auto pb-4 gap-4 no-scrollbar",
          "lg:grid lg:grid-cols-4 lg:overflow-visible",
        )}
      >
        {merged.map((item, index) => (
          <ContinueCard key={`${item.type}-${index}`} item={item} index={index} />
        ))}
      </div>
    </section>
  );
};