"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuSparkles,
  LuBookOpen,
  LuCalendar,
  LuCirclePlay,
  LuStar,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export interface Recommendation {
  id?: string | number;
  title: string;
  type: string;
  meta: string;
  tag: string;
  href?: string;
}

const TYPE_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  Program: {
    icon: <LuCirclePlay className={cn('w-4', 'h-4')} />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  Event: {
    icon: <LuCalendar className={cn('w-4', 'h-4')} />,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
  },
  Resource: {
    icon: <LuBookOpen className={cn('w-4', 'h-4')} />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
};

const FALLBACK_CONFIG = {
  icon: <LuSparkles className={cn('w-4', 'h-4')} />,
  color: "text-slate-600",
  bg: "bg-muted",
  border: "border-border",
};

interface RecommendedSectionProps {
  recommendations: Recommendation[];
  userInterests: string;
}

export const RecommendedSection = ({
  recommendations,
  userInterests,
}: RecommendedSectionProps) => {
  const router = useRouter();

  // ── Empty state ───────────────────────────────────────────────────────────
  if (recommendations.length === 0) {
    return (
      <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'mt-16')}>
        <div className={cn('flex', 'items-center', 'gap-2', 'mb-8')}>
          <div className={cn('p-2', 'bg-primary/10', 'rounded-lg')}>
            <LuSparkles className={cn('text-primary', 'w-5', 'h-5')} />
          </div>
          <div>
            <h3 className={cn('text-xl', 'font-black', 'text-foreground', 'leading-none')}>
              Recommended for you
            </h3>
            <p className={cn('text-sm', 'text-muted-foreground', 'mt-1')}>
              Based on your interests in {userInterests}
            </p>
          </div>
        </div>
        <div className={cn('flex', 'flex-col', 'items-center', 'justify-center', 'py-16', 'bg-background', 'border', 'border-dashed', 'border-border', 'rounded-[2.5rem]', 'text-center', 'gap-4')}>
          <div className={cn('w-16', 'h-16', 'bg-muted', 'rounded-3xl', 'flex', 'items-center', 'justify-center')}>
            <LuSparkles className={cn('w-8', 'h-8', 'text-slate-300')} />
          </div>
          <div>
            <p className={cn('text-[11px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
              No recommendations yet
            </p>
            <p className={cn('text-xs', 'text-muted-foreground', 'mt-1')}>
              Events matching your skills and status will appear here
            </p>
          </div>
          <button
            onClick={() => router.push("/events")}
            className={cn('px-6', 'py-2.5', 'bg-foreground', 'text-background', 'rounded-2xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'hover:bg-primary', 'transition-all', 'cursor-pointer')}
          >
            Browse All Events
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'mt-16')}>
      <div className={cn('flex', 'items-center', 'gap-2', 'mb-8')}>
        <div className={cn('p-2', 'bg-primary/10', 'rounded-lg')}>
          <LuSparkles className={cn('text-primary', 'w-5', 'h-5')} />
        </div>
        <div>
          <h3 className={cn('text-xl', 'font-black', 'text-foreground', 'leading-none')}>
            Recommended for you
          </h3>
          <p className={cn('text-sm', 'text-muted-foreground', 'mt-1')}>
            Based on your interests in {userInterests}
          </p>
        </div>
      </div>

      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-6')}>
        {recommendations.map((item, index) => {
          const config = TYPE_CONFIG[item.type] ?? FALLBACK_CONFIG;
          return (
            <motion.div
              key={item.id ?? index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className={cn('group', 'relative', 'bg-background', 'border', 'border-border', 'rounded-[2rem]', 'p-2', 'shadow-sm', 'hover:shadow-xl', 'hover:shadow-slate-200/50', 'transition-all', 'duration-300')}
            >
              <div className="p-6">
                <div className={cn('flex', 'justify-between', 'items-start', 'mb-6')}>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      config.bg,
                      config.color,
                      config.border,
                    )}
                  >
                    {item.type}
                  </span>
                  <LuStar className={cn('text-slate-200', 'group-hover:text-primary', 'transition-colors', 'cursor-pointer')} />
                </div>
                <h4 className={cn('text-lg', 'font-bold', 'text-foreground', 'group-hover:text-primary', 'transition-colors', 'mb-2', 'line-clamp-2')}>
                  {item.title}
                </h4>
                <div className={cn('flex', 'items-center', 'gap-2', 'text-muted-foreground', 'text-xs', 'font-medium', 'mb-6')}>
                  {config.icon}
                  {item.meta}
                </div>
                <div className={cn('pt-4', 'border-t', 'border-slate-50', 'flex', 'items-center', 'justify-between')}>
                  <span className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'italic')}>
                    {item.tag}
                  </span>
                  <button
                    onClick={() => item.href && router.push(item.href)}
                    className={cn('p-2', 'bg-muted', 'group-hover:bg-primary', 'group-hover:text-background', 'rounded-full', 'transition-all')}
                  >
                    <LuSparkles className={cn('w-4', 'h-4')} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
