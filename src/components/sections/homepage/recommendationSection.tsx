"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  LuSparkles,
  LuBookOpen,
  LuCalendar,
  LuCirclePlay,
  LuStar,
  LuNewspaper,
  LuGraduationCap,
  LuBriefcase,
  LuLock,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

// ── Types ─────────────────────────────────────────────────────────────────────

export type RecommendationType =
  | "Event"
  | "Program"    // upcoming
  | "Resource"
  | "Learning"   // upcoming
  | "Blog"       // upcoming
  | "Career"     // upcoming
  | string;

export interface Recommendation {
  id?: string | number;
  title: string;
  type: RecommendationType;
  meta: string;
  tag: string;
  href?: string;
  // upcoming = locked card, feature not yet live
  upcoming?: boolean;
}

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  {
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
    label: string;
  }
> = {
  Event: {
    icon: <LuCalendar className="w-4 h-4" />,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
    label: "Event",
  },
  Program: {
    icon: <LuCirclePlay className="w-4 h-4" />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    label: "Program",
  },
  Resource: {
    icon: <LuBookOpen className="w-4 h-4" />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    label: "Resource",
  },
  Learning: {
    icon: <LuGraduationCap className="w-4 h-4" />,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    label: "Learning",
  },
  Blog: {
    icon: <LuNewspaper className="w-4 h-4" />,
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-100",
    label: "Blog",
  },
  Career: {
    icon: <LuBriefcase className="w-4 h-4" />,
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-100",
    label: "Career",
  },
};

const FALLBACK_CONFIG = {
  icon: <LuSparkles className="w-4 h-4" />,
  color: "text-slate-600",
  bg: "bg-muted",
  border: "border-border",
  label: "General",
};

// ── Upcoming placeholder slots ────────────────────────────────────────────────
// Shown as locked cards when no real recommendations exist for that type.
// Remove a slot from this list once the feature is live and real data flows in.
const UPCOMING_SLOTS: Recommendation[] = [
  {
    id: "upcoming-learning",
    type: "Learning",
    title: "Personalised Learning Paths",
    meta: "Structured modules tailored to your skills",
    tag: "Coming Soon",
    upcoming: true,
  },
  {
    id: "upcoming-blog",
    type: "Blog",
    title: "Articles Curated for You",
    meta: "Industry insights from DIUSCADI writers",
    tag: "Coming Soon",
    upcoming: true,
  },
  {
    id: "upcoming-career",
    type: "Career",
    title: "Career Programme Matching",
    meta: "Expert-led programmes matched to your profile",
    tag: "Coming Soon",
    upcoming: true,
  },
];

// ── Section header (shared between empty and populated states) ────────────────

function SectionHeader({ interests }: { interests: string }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      <div className="p-2 bg-primary/10 rounded-lg">
        <LuSparkles className="text-primary w-5 h-5" />
      </div>
      <div>
        <h3 className="text-xl font-black text-foreground leading-none">
          Recommended for you
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {interests
            ? `Based on your interests in ${interests}`
            : "Tailored to your profile and skills"}
        </p>
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function RecommendationCard({
  item,
  index,
  onNavigate,
}: {
  item: Recommendation;
  index: number;
  onNavigate: (href: string) => void;
}) {
  const config = TYPE_CONFIG[item.type] ?? FALLBACK_CONFIG;

  if (item.upcoming) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.08 }}
        className={cn(
          "relative bg-background border border-dashed border-border",
          "rounded-[2rem] p-2 opacity-60",
        )}
      >
        <div className="p-6">
          {/* Lock badge */}
          <div className="flex justify-between items-start mb-6">
            <span
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                config.bg,
                config.color,
                config.border,
              )}
            >
              {config.label}
            </span>
            <div className="p-1.5 bg-muted rounded-full">
              <LuLock className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>

          <h4 className="text-lg font-bold text-muted-foreground mb-2">
            {item.title}
          </h4>

          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-6">
            {config.icon}
            {item.meta}
          </div>

          <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
            <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">
              Coming Soon
            </span>
            <div className="p-2 bg-muted rounded-full cursor-not-allowed">
              <LuLock className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -5 }}
      className={cn(
        "group relative bg-background border border-border",
        "rounded-[2rem] p-2 shadow-sm",
        "hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300",
      )}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <span
            className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
              config.bg,
              config.color,
              config.border,
            )}
          >
            {config.label}
          </span>
          <LuStar
            className={cn(
              "text-slate-200 group-hover:text-primary",
              "transition-colors cursor-pointer",
            )}
          />
        </div>

        <h4
          className={cn(
            "text-lg font-bold text-foreground group-hover:text-primary",
            "transition-colors mb-2 line-clamp-2",
          )}
        >
          {item.title}
        </h4>

        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-6">
          {config.icon}
          {item.meta}
        </div>

        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase italic">
            {item.tag}
          </span>
          <button
            onClick={() => item.href && onNavigate(item.href)}
            className={cn(
              "p-2 bg-muted rounded-full transition-all",
              "group-hover:bg-primary group-hover:text-background",
            )}
          >
            <LuSparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface RecommendedSectionProps {
  // Page-provided recommendations (events matched to user skills/status).
  // When this is empty, upcoming slot placeholders fill the grid instead.
  recommendations: Recommendation[];
}

export const RecommendedSection = ({
  recommendations,
}: RecommendedSectionProps) => {
  const router = useRouter();
  const { profile } = useUser();

  // Derive user interests label from context directly
  const userInterests = useMemo(() => {
    if (!profile) return "";
    const skills = profile.skills ?? [];
    if (skills.length === 0) return "";
    // Show first 2 skills joined nicely: "Design & Programming"
    return skills
      .slice(0, 2)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" & ");
  }, [profile]);

  // Separate live recommendations from any upcoming ones passed in
  const liveRecs = recommendations.filter((r) => !r.upcoming);

  // When no live recommendations exist, show upcoming placeholder slots
  // so the section is never a blank empty state
  const displayItems: Recommendation[] =
    liveRecs.length > 0
      ? recommendations          // show what the page passed (may include upcoming from page too)
      : UPCOMING_SLOTS;          // fallback to locked placeholder cards

  // Never render the section if there's truly nothing to show
  // (this shouldn't happen since UPCOMING_SLOTS always has items,
  //  but guard anyway for safety)
  if (displayItems.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
      <SectionHeader interests={userInterests} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayItems.map((item, index) => (
          <RecommendationCard
            key={item.id ?? index}
            item={item}
            index={index}
            onNavigate={(href) => router.push(href)}
          />
        ))}
      </div>
    </section>
  );
};