"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuMegaphone, LuInfo, LuSparkles, LuArrowRight } from "react-icons/lu";
import { cn } from "@/lib/utils";

export interface Announcement {
  id: string | number;
  type: "Update" | "New" | "Alert";
  title: string;
  desc: string;
}

const TYPE_CONFIG: Record<
  string,
  {
    icon: React.ReactNode;
    color: string;
    lightColor: string;
    borderColor: string;
    textColor: string;
  }
> = {
  Update: {
    icon: <LuMegaphone className="w-5 h-5" />,
    color: "bg-blue-600",
    lightColor: "bg-blue-50",
    borderColor: "border-blue-100",
    textColor: "text-blue-600",
  },
  New: {
    icon: <LuSparkles className="w-5 h-5" />,
    color: "bg-orange-600",
    lightColor: "bg-orange-50",
    borderColor: "border-orange-100",
    textColor: "text-orange-600",
  },
  Alert: {
    icon: <LuInfo className="w-5 h-5" />,
    color: "bg-foreground",
    lightColor: "bg-muted",
    borderColor: "border-border",
    textColor: "text-foreground",
  },
};

interface AnnouncementsProps {
  announcements: Announcement[];
}

export const Announcements = ({ announcements }: AnnouncementsProps) => {
  // announcements are static stubs from getStaticAnnouncements() in homeData.ts.
  // TODO: replace with real blog/announcement data when blog system is built.
  //   - GET /api/blog/posts?limit=3&tag=announcement (not yet built)
  //   - Filter by user's committee/interest tags for personalised content
  //   - Add "Mark as read" tracking per user

  const newCount = announcements.length;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
      <div className="flex items-center gap-3 mb-8">
        <h3 className="text-xl font-black text-foreground uppercase tracking-tighter">
          Community Updates
        </h3>
        {newCount > 0 && (
          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-md animate-pulse">
            {newCount} NEW
          </span>
        )}
        {/* Demo badge — remove when real blog system is wired */}
        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black rounded-md uppercase tracking-widest">
          Sample Data
        </span>
      </div>

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-background border border-dashed border-border rounded-[2.5rem] text-center gap-4">
          <LuMegaphone className="w-10 h-10 text-slate-300" />
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
            No announcements yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {announcements.map((item, index) => {
            const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.Alert;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "group p-6 rounded-[2rem] border bg-background flex flex-col h-full transition-all duration-300",
                  "hover:shadow-xl hover:shadow-slate-200/40",
                  config.borderColor,
                )}
              >
                <div className="flex items-start justify-between mb-6">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-background shadow-lg shadow-current/20",
                      config.color,
                    )}
                  >
                    {config.icon}
                  </div>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      config.lightColor,
                      config.textColor,
                    )}
                  >
                    {item.type}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-foreground mb-2 leading-tight group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <button className="mt-6 flex items-center gap-2 text-sm font-bold text-foreground group-hover:text-primary transition-all">
                  {/* TODO: route to /blog/[slug] when blog system is ready */}
                  Read More
                  <LuArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
};
