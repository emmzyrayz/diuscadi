"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { LuChevronRight, LuUsers, LuSparkles, LuLayers } from "react-icons/lu";

interface CommitteeListItem {
  id: string;
  slug: string;
  name: string;
  shortDesc?: string;
  description: string;
  memberCount: number;
}

export default function PublicShowcaseView() {
  const router = useRouter();
  const [committees, setCommittees] = useState<CommitteeListItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPublicEcosystem() {
      try {
        const res = await fetch("/api/platform/committees");
        const data = await res.json();
        if (data.committees && data.committees.length > 0) {
          setCommittees(data.committees);
          setSelectedSlug(data.committees[0].slug);
        }
      } catch (err) {
        console.error("Layout Hydration Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPublicEcosystem();
  }, []);

  const currentSelection = committees.find((c) => c.slug === selectedSlug);

  if (loading) {
    return (
      <div className={cn('w-full', 'text-center', 'py-24', 'font-mono', 'text-xs', 'uppercase', 'tracking-widest', 'text-muted-foreground')}>
        Loading Functional Units...
      </div>
    );
  }

  return (
    <div className={cn('grid', 'grid-cols-1', 'lg:grid-cols-12', 'gap-6', 'items-start')}>
      {/* Structural Banner Announcement */}
      <div className={cn('col-span-12', 'glass', 'glass-shine', 'p-6', 'md:p-8', 'rounded-3xl')}>
        <div className={cn('flex', 'items-center', 'gap-3')}>
          <div className={cn('p-2.5', 'rounded-xl', 'bg-primary/10', 'text-primary')}>
            <LuSparkles className={cn('w-5', 'h-5')} />
          </div>
          <div>
            <h1 className={cn('text-2xl', 'md:text-3xl', 'font-black', 'uppercase', 'tracking-tight', 'text-foreground')}>
              DIUSCADI Operational Wings
            </h1>
            <p className={cn('text-xs', 'md:text-sm', 'text-muted-foreground', 'mt-0.5')}>
              Select an active core committee from the register deck below to
              review operational assignments and profiles.
            </p>
          </div>
        </div>
      </div>

      {/* LEFT BLOCK: The Selector Deck (4 Columns) */}
      <div className={cn('lg:col-span-4', 'space-y-3')}>
        <span className={cn('text-[10px]', 'font-mono', 'uppercase', 'tracking-widest', 'text-muted-foreground', 'px-1', 'block', 'mb-1')}>
          Available Functional Track Modules
        </span>
        <div className="space-y-2.5">
          {committees.map((committee) => {
            const isSelected = committee.slug === selectedSlug;
            return (
              <button
                key={committee.id}
                onClick={() => setSelectedSlug(committee.slug)}
                className={cn(
                  "w-full text-left p-4.5 rounded-2xl transition-all duration-300 flex items-center justify-between group",
                  isSelected
                    ? "glass border-primary/40 bg-primary/[0.03] shadow-md translate-x-1"
                    : "glass-subtle hover:border-muted-foreground/30 border-transparent",
                )}
              >
                <div className="pr-4">
                  <h3
                    className={cn(
                      "font-bold tracking-tight text-sm md:text-base transition-colors duration-200",
                      isSelected ? "text-primary" : "text-foreground",
                    )}
                  >
                    {committee.name}
                  </h3>
                  <p className={cn('text-xs', 'text-muted-foreground', 'line-clamp-1', 'mt-0.5')}>
                    {committee.shortDesc || "No summary provided"}
                  </p>
                </div>
                <LuChevronRight
                  className={cn(
                    "w-4 h-4 text-muted-foreground/60 transition-all duration-300 group-hover:translate-x-1 shrink-0",
                    isSelected && "text-primary transform translate-x-0.5",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT BLOCK: The Glass Inspector Display (8 Columns) */}
      <div className={cn('lg:col-span-8', 'h-full')}>
        <AnimatePresence mode="wait">
          {currentSelection ? (
            <motion.div
              key={currentSelection.slug}
              initial={{ opacity: 0, scale: 0.99, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.99, y: -8 }}
              transition={{ duration: 0.2 }}
              className={cn('glass', 'glass-shine', 'rounded-3xl', 'p-6', 'md:p-8', 'flex', 'flex-col', 'justify-between', 'min-h-[400px]')}
            >
              <div>
                <div className={cn('flex', 'flex-col', 'sm:flex-row', 'sm:items-center', 'justify-between', 'gap-4', 'border-b', 'border-border', 'pb-5', 'mb-6')}>
                  <div className={cn('flex', 'items-center', 'gap-3')}>
                    <div className={cn('p-2.5', 'rounded-xl', 'bg-foreground/5', 'text-foreground')}>
                      <LuLayers className={cn('w-5', 'h-5')} />
                    </div>
                    <h2 className={cn('text-xl', 'md:text-2xl', 'font-black', 'uppercase', 'tracking-tight', 'text-foreground')}>
                      {currentSelection.name}
                    </h2>
                  </div>
                  <div className={cn('glass-subtle', 'px-3', 'py-1.5', 'rounded-full', 'text-[11px]', 'font-mono', 'uppercase', 'tracking-wider', 'flex', 'items-center', 'gap-1.5', 'text-primary', 'self-start', 'sm:self-auto')}>
                    <LuUsers className={cn('w-3.5', 'h-3.5')} />{" "}
                    {currentSelection.memberCount} Active Seats
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className={cn('text-[10px]', 'font-mono', 'uppercase', 'tracking-widest', 'text-muted-foreground')}>
                    Core Mandate & Functional Requirements
                  </h4>
                  <p className={cn('text-muted-foreground', 'text-sm', 'leading-relaxed', 'whitespace-pre-line', 'max-w-3xl')}>
                    {currentSelection.description}
                  </p>
                </div>
              </div>

              {/* Secure App Link Routing Interceptor */}
              <div className={cn('mt-12', 'pt-6', 'border-t', 'border-border', 'flex', 'flex-col', 'sm:flex-row', 'sm:items-center', 'sm:justify-between', 'gap-4')}>
                <span className={cn('text-xs', 'text-muted-foreground', 'max-w-sm')}>
                  Ready to declare alignment with this operational group? Review
                  carefully before submission.
                </span>
                <button
                  onClick={() =>
                    router.push(`/apply?committee=${currentSelection.slug}`)
                  }
                  className={cn('bg-primary', 'hover:bg-primary/90', 'text-primary-foreground', 'font-bold', 'uppercase', 'tracking-wider', 'text-xs', 'px-6', 'py-3.5', 'rounded-xl', 'transition-all', 'duration-300', 'shadow-md', 'shadow-primary/10', 'select-none')}
                >
                  Initiate Track Entry Placement
                </button>
              </div>
            </motion.div>
          ) : (
            <div className={cn('glass', 'rounded-3xl', 'p-12', 'text-center', 'text-muted-foreground/60', 'text-xs', 'font-mono', 'uppercase', 'tracking-wider', 'flex', 'items-center', 'justify-center', 'min-h-[400px]')}>
              Select structural unit code from tracking tree to parse metadata
              view
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
