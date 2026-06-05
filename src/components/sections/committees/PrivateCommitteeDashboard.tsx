"use client";

import React, { useEffect, useState } from "react";
import {
  LuMessageSquare,
  LuMegaphone,
  LuUserCheck,
  LuExternalLink,
  LuActivity,
  LuListTodo,
} from "react-icons/lu";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { TasksList } from "@/components/sections/tasks/taskList";

// ─── Types ────────────────────────────────────────────────────────────────────
// Unchanged from original — no prop signature changes for backward compatibility

interface ApiCommittee {
  id: string;
  slug: string;
  name: string;
  shortDesc?: string;
  description: string;
  memberCount: number;
  whatsappLink?: string | null;
}

interface PrivateDashboardProps {
  userCommittee: string;
  userCommitteeRole: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrivateCommitteeDashboard({
  userCommittee,
  userCommitteeRole,
}: PrivateDashboardProps) {
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [committeeName, setCommitteeName] = useState<string>("");

  // Unchanged committee metadata fetch from original
  useEffect(() => {
    async function extractProtectedWorkspace() {
      try {
        const res = await fetch(`/api/platform/committees`);
        const data = await res.json();
        if (data.committees && Array.isArray(data.committees)) {
          const match = (data.committees as ApiCommittee[]).find(
            (c) => c.slug === userCommittee,
          );
          if (match) {
            setCommitteeName(match.name);
            setWhatsappLink(match.whatsappLink || null);
          }
        }
      } catch (err) {
        console.error("Dashboard Analytics Pipeline Error:", err);
      }
    }
    extractProtectedWorkspace();
  }, [userCommittee]);

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* ── Title Card — unchanged from original ─────────────────────────── */}
      <div
        className={cn(
          "glass",
          "glass-shine",
          "rounded-3xl",
          "p-5",
          "sm:p-6",
          "md:p-8",
          "flex",
          "flex-col",
          "lg:flex-row",
          "items-start",
          "lg:items-center",
          "justify-between",
          "gap-6",
          "w-full",
        )}
      >
        <div className="w-full min-w-0">
          <div
            className={cn("flex", "flex-wrap", "items-center", "gap-2", "mb-3")}
          >
            <span
              className={cn(
                "glass-subtle",
                "text-primary",
                "text-[9px]",
                "sm:text-[10px]",
                "uppercase",
                "font-mono",
                "font-bold",
                "tracking-widest",
                "px-2.5",
                "py-1",
                "rounded-md",
                "border",
                "border-primary/10",
              )}
            >
              Assigned Node: Operational
            </span>
            <span
              className={cn(
                "bg-foreground/5",
                "text-foreground/80",
                "text-[9px]",
                "sm:text-[10px]",
                "uppercase",
                "font-mono",
                "font-bold",
                "tracking-widest",
                "px-2.5",
                "py-1",
                "rounded-md",
                "truncate",
                "max-w-[200px]",
              )}
            >
              Clearance: {userCommitteeRole}
            </span>
          </div>

          <h1
            className={cn(
              "text-xl",
              "sm:text-2xl",
              "md:text-3xl",
              "font-black",
              "uppercase",
              "tracking-tight",
              "text-foreground",
              "break-words",
            )}
          >
            {committeeName || userCommittee} Headspace
          </h1>
          <p
            className={cn(
              "text-xs",
              "md:text-sm",
              "text-muted-foreground",
              "mt-1.5",
              "max-w-xl",
              "leading-relaxed",
            )}
          >
            You are authenticated inside this system workspace block. Sync live
            operations and project channels through our linked real-time
            instance.
          </p>
        </div>

        {whatsappLink && (
          <motion.a
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex",
              "items-center",
              "justify-center",
              "gap-2.5",
              "bg-[#25D366]",
              "hover:bg-[#20ba5a]",
              "text-white",
              "font-bold",
              "uppercase",
              "tracking-wider",
              "text-xs",
              "px-6",
              "py-4",
              "rounded-xl",
              "transition-all",
              "duration-300",
              "shadow-xl",
              "shadow-emerald-950/10",
              "w-full",
              "lg:w-auto",
              "shrink-0",
              "select-none",
            )}
          >
            <LuMessageSquare className="w-4 h-4" />
            Join Team WhatsApp Group
            <LuExternalLink className="w-3.5 h-3.5" />
          </motion.a>
        )}
      </div>

      {/* ── Content Grid ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          "grid",
          "grid-cols-1",
          "lg:grid-cols-12",
          "gap-6",
          "w-full",
        )}
      >
        {/* ── Left: Tabbed content (8 cols) ──────────────────────────────── */}
        <div
          className={cn(
            "col-span-12",
            "lg:col-span-8",
            "glass",
            "rounded-2xl",
            "p-5",
            "sm:p-6",
            "w-full",
            "min-w-0",
          )}
        >
          <Tabs defaultValue="tasks" className="w-full">
            {/* Tab nav */}
            <TabsList
              className={cn(
                "flex",
                "items-center",
                "justify-start",
                "gap-1",
                "w-auto",
                "bg-transparent",
                "p-0",
                "mb-5",
                "pb-3",
                "border-b",
                "border-border",
                "h-auto",
              )}
            >
              <TabsTrigger
                value="tasks"
                className={cn(
                  "text-[10px]",
                  "font-mono",
                  "font-bold",
                  "uppercase",
                  "tracking-wider",
                  "px-3",
                  "py-1.5",
                  "rounded-md",
                  "flex",
                  "items-center",
                  "gap-1.5",
                  "transition-all",
                  "duration-150",
                  "data-[state=active]:bg-primary",
                  "data-[state=active]:text-primary-foreground",
                  "data-[state=active]:shadow-none",
                  "data-[state=inactive]:bg-transparent",
                  "data-[state=inactive]:text-muted-foreground",
                  "data-[state=inactive]:hover:bg-foreground/5",
                )}
              >
                <LuListTodo className="w-3.5 h-3.5" />
                Tasks
              </TabsTrigger>

              <TabsTrigger
                value="broadcasts"
                className={cn(
                  "text-[10px]",
                  "font-mono",
                  "font-bold",
                  "uppercase",
                  "tracking-wider",
                  "px-3",
                  "py-1.5",
                  "rounded-md",
                  "flex",
                  "items-center",
                  "gap-1.5",
                  "transition-all",
                  "duration-150",
                  "data-[state=active]:bg-primary",
                  "data-[state=active]:text-primary-foreground",
                  "data-[state=active]:shadow-none",
                  "data-[state=inactive]:bg-transparent",
                  "data-[state=inactive]:text-muted-foreground",
                  "data-[state=inactive]:hover:bg-foreground/5",
                )}
              >
                <LuMegaphone className="w-3.5 h-3.5" />
                Broadcasts
              </TabsTrigger>
            </TabsList>

            {/* Tasks tab */}
            <TabsContent
              value="tasks"
              className="mt-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <TasksList />
            </TabsContent>

            {/* Broadcasts tab — original announcements content preserved */}
            <TabsContent
              value="broadcasts"
              className="mt-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <div className="space-y-4 w-full">
                <div
                  className={cn(
                    "border-l-2",
                    "border-primary/40",
                    "pl-4",
                    "py-0.5",
                    "w-full",
                    "min-w-0",
                  )}
                >
                  <h4 className="text-sm font-bold text-foreground break-words">
                    Structural Setup Completed
                  </h4>
                  <p
                    className={cn(
                      "text-xs",
                      "text-muted-foreground",
                      "mt-1",
                      "leading-relaxed",
                      "break-words",
                    )}
                  >
                    Your account is linked to this operational unit. Please join
                    the central communications channel above to map out upcoming
                    milestone deadlines.
                  </p>
                  <span
                    className={cn(
                      "text-[9px]",
                      "font-mono",
                      "text-muted-foreground/50",
                      "mt-2",
                      "block",
                    )}
                  >
                    SYSTEM DISPATCH • CORE ENGINE
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Right: Module status (4 cols) — unchanged from original ────── */}
        <div
          className={cn(
            "col-span-12",
            "lg:col-span-4",
            "glass",
            "rounded-2xl",
            "p-5",
            "sm:p-6",
            "flex",
            "flex-col",
            "justify-between",
            "gap-6",
            "w-full",
            "min-w-0",
          )}
        >
          <div className="w-full">
            <h3
              className={cn(
                "font-bold",
                "uppercase",
                "tracking-wider",
                "text-xs",
                "text-muted-foreground",
                "flex",
                "items-center",
                "gap-2",
                "mb-4",
                "border-b",
                "border-border",
                "pb-3",
              )}
            >
              <LuUserCheck className="w-4 h-4 text-primary" />
              Module Status
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed break-words">
              Task alignment tools, asset boards, and member rosters are
              currently routing communication dependencies entirely through the
              designated primary external channel.
            </p>
          </div>

          <div
            className={cn(
              "pt-4",
              "border-t",
              "border-border",
              "flex",
              "items-center",
              "justify-between",
              "text-[10px]",
              "font-mono",
              "text-muted-foreground/60",
              "w-full",
            )}
          >
            <span className="flex items-center gap-1.5">
              <LuActivity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              Channel Sync Active
            </span>
            <span>V2.1-TASK</span>
          </div>
        </div>
      </div>
    </div>
  );
}
