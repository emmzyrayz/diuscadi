"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuPlay,
  LuClipboardCheck,
  LuUserPlus,
  LuChevronRight,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useApplications } from "@/context/ApplicationContext";

// ── TODO list for ApplicationContext ──────────────────────────────────────────
// Add the following application types to ApplicationType union and submit flow:
//   - "mentorship"    → apply for mentor pairing
//   - "sponsorship"   → apply for event/program sponsorship
//   - "learning"      → apply for a learning program cohort
//   - "fellowship"    → apply for advanced fellowship program
// Each new type should have its own form fields and review note display.
// Handle in /api/applications POST route with type-specific validation.
// ─────────────────────────────────────────────────────────────────────────────

export interface ContinueItem {
  type: "Learning" | "Registration" | "Application" | string;
  title: string;
  status: string;
  link: string;
  action: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  Learning: { icon: <LuPlay className={cn('w-5', 'h-5')} />, color: "bg-orange-500" },
  Registration: {
    icon: <LuClipboardCheck className={cn('w-5', 'h-5')} />,
    color: "bg-blue-600",
  },
  Application: {
    icon: <LuUserPlus className={cn('w-5', 'h-5')} />,
    color: "bg-purple-600",
  },
};

interface ContinueSectionProps {
  items: ContinueItem[];
}

export const ContinueSection = ({ items }: ContinueSectionProps) => {
  const { applications, initialized } = useApplications();

  // Build dynamic items from real application data
  // Merges server-passed static items with live pending applications
  const pendingApps = initialized
    ? applications
        .filter((a) => a.status === "pending")
        .map((a) => ({
          type: "Application" as const,
          title:
            a.type === "committee"
              ? `Committee Application: ${a.requestedCommittee ?? "Pending"}`
              : `Skills Application`,
          status: "Pending review",
          // TODO: add mentorship/sponsorship/learning application types here
          link: "/profile/applications",
          action: "View Status",
        }))
    : [];

  // Merge: real pending apps take priority at top, then static items
  // Filter out any static "Application" items if we have real data
  const staticNonApp = items.filter((i) => i.type !== "Application");
  const merged = [...pendingApps, ...staticNonApp].slice(0, 3);

  // If nothing to show at all — empty state
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
          className={cn('text-sm', 'font-bold', 'text-primary', 'hover:underline', 'flex', 'items-center', 'gap-1', 'cursor-pointer')}
        >
          View all tasks <LuChevronRight className={cn('w-4', 'h-4')} />
        </Link>
      </div>

      <div
        className={cn(
          "flex overflow-x-auto pb-4 gap-4 no-scrollbar",
          "lg:grid lg:grid-cols-3 lg:overflow-visible",
        )}
      >
        {merged.map((item, index) => {
          const config = TYPE_CONFIG[item.type] ?? {
            icon: <LuPlay className={cn('w-5', 'h-5')} />,
            color: "bg-muted",
          };
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn('min-w-[300px]', 'lg:min-w-0', 'bg-background', 'border', 'border-border', 'rounded-3xl', 'p-6', 'hover:shadow-lg', 'hover:shadow-slate-200/50', 'transition-all', 'duration-300', 'group')}
            >
              <div className={cn('flex', 'items-start', 'justify-between', 'mb-4')}>
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-background shadow-lg",
                    config.color,
                  )}
                >
                  {config.icon}
                </div>
                <span className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-muted-foreground', 'bg-muted', 'px-2', 'py-1', 'rounded-md')}>
                  {item.type}
                </span>
              </div>
              <div className="mb-6">
                <h4 className={cn('text-base', 'font-bold', 'text-foreground', 'group-hover:text-primary', 'transition-colors', 'leading-tight', 'mb-2')}>
                  {item.title}
                </h4>
                <p className={cn('text-xs', 'font-semibold', 'text-muted-foreground')}>
                  {item.status}
                </p>
              </div>
              <Link
                href={item.link}
                className={cn('flex', 'items-center', 'justify-center', 'gap-2', 'w-full', 'py-3', 'rounded-xl', 'font-bold', 'text-sm', 'bg-foreground', 'text-background', 'hover:bg-primary', 'transition-all', 'active:scale-95')}
              >
                {item.action}
                <LuChevronRight className={cn('w-4', 'h-4')} />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
