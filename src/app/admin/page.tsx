"use client";
import React, { useState } from "react";
import { AdminHeader } from "@/components/sections/admin/adminHeader";
import { AdminSidebar } from "@/components/sections/admin/AdminSidebar";
import { AdminStatsOverview } from "@/components/sections/admin/AdminStatsOverview";
import { AdminQuickActions } from "@/components/sections/admin/AdminQuickActions";
import { AdminRecentActivity } from "@/components/sections/admin/AdminRecentActivity";
import { AdminUpcomingEventsPreview } from "@/components/sections/admin/AUEventsPreview";
import { LuMenu, LuX } from "react-icons/lu";
import { cn } from "../../lib/utils";

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div
      className={cn(
        "min-h-screen w-full mt-20",
        "bg-[#F8FAFC]",
        "flex",
        "overflow-hidden",
      )}
    >
      {/* 1. Admin Sidebar (Desktop: Persistent, Mobile: Overlay) */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:col-span-3
      `}
      >
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className={cn(
            "fixed",
            "inset-0",
            "bg-slate-900/50",
            "backdrop-blur-sm",
            "z-40",
            "lg:hidden",
          )}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 2. Main Body Container */}
      <div
        className={cn(
          "flex-1",
          "flex",
          "flex-col",
          "min-w-0",
          "overflow-y-auto",
        )}
      >
        {/* Mobile Header Toggle */}
        <div
          className={cn(
            "lg:hidden",
            "flex md:rounded-t-2xl",
            "items-center",
            "justify-between",
            "p-4",
            "bg-slate-900",
            "text-white",
          )}
        >
          <span
            className={cn(
              "font-black",
              "uppercase",
              "tracking-widest",
              "text-[10px]",
            )}
          >
            DIUSCADI Admin
          </span>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn("p-2", "bg-white/10", "rounded-lg")}
          >
            {isSidebarOpen ? (
              <LuX className={cn("w-5", "h-5")} />
            ) : (
              <LuMenu className={cn("w-5", "h-5")} />
            )}
          </button>
        </div>

        <AdminHeader />

        {/* 3. Dashboard Content Grid */}
        <main
          className={cn(
            "p-4",
            "md:p-8",
            "lg:p-12",
            "space-y-8",
            "max-w-[1600px]",
            "mx-auto",
            "w-full",
          )}
        >
          {/* Row 1: Stats Overview (Full Width) */}
          <section
            className={cn(
              "animate-in",
              "fade-in",
              "slide-in-from-top-4",
              "duration-500",
            )}
          >
            <AdminStatsOverview />
          </section>

          {/* Row 2: Quick Actions (Full Width) */}
          <section
            className={cn(
              "animate-in",
              "fade-in",
              "slide-in-from-top-4",
              "duration-700",
              "delay-100",
            )}
          >
            <AdminQuickActions />
          </section>

          {/* Row 3: Split Operations Grid */}
          <div
            className={cn(
              "grid",
              "grid-cols-1",
              "lg:grid-cols-12",
              "gap-8",
              "items-start",
            )}
          >
            {/* Recent Activity (col-span-7) */}
            <div
              className={cn(
                "lg:col-span-7",
                "animate-in",
                "fade-in",
                "slide-in-from-left-4",
                "duration-700",
                "delay-200",
              )}
            >
              <AdminRecentActivity />
            </div>

            {/* Upcoming Events Preview (col-span-5) */}
            <div
              className={cn(
                "lg:col-span-5",
                "animate-in",
                "fade-in",
                "slide-in-from-right-4",
                "duration-700",
                "delay-200",
              )}
            >
              <AdminUpcomingEventsPreview />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
