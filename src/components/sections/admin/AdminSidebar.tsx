"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LuLayoutDashboard,
  LuCalendar,
  LuUsers,
  LuTicket,
  LuChartBar,
  LuSettings,
  LuCircleArrowLeft,
  LuGlobe,
} from "react-icons/lu";
import { cn } from "../../../lib/utils";

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Overview",
    icon: LuLayoutDashboard,
    path: "/admin",
  },
  { id: "events", label: "Events", icon: LuCalendar, path: "/admin/events" },
  { id: "users", label: "User Base", icon: LuUsers, path: "/admin/users" },
  { id: "tickets", label: "Tickets", icon: LuTicket, path: "/admin/tickets" },
  {
    id: "analytics",
    label: "Analytics",
    icon: LuChartBar,
    path: "/admin/analytics",
  },
  {
    id: "settings",
    label: "Console Config",
    icon: LuSettings,
    path: "/admin/settings",
  },
];

export const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "w-72",
        "min-h-screen",
        "bg-slate-900",
        "border-r",
        "border-white/5",
        "flex",
        "flex-col",
        "sticky",
        "top-0 z-99 lg:rounded-2xl",
      )}
    >
      {/* 1. Admin Brand Area */}
      <div className={cn("p-8", "pb-10")}>
        <div className={cn("flex w-full h-auto", "items-center justify-center", "gap-3")}>
          <div
            className={cn(
              "w-10",
              "h-10",
              "bg-primary",
              "rounded-xl",
              "flex",
              "items-center",
              "justify-center",
              "shadow-lg",
              "shadow-primary/20",
            )}
          >
            <LuGlobe className={cn("text-slate-200", "w-6", "h-6")} />
          </div>
          <div>
            <span
              className={cn(
                "block",
                "text-sm",
                "font-black",
                "text-white",
                "tracking-tighter",
                "leading-none",
              )}
            >
              DIUSCADI
            </span>
            <span
              className={cn(
                "text-[10px]",
                "font-bold",
                "text-slate-500",
                "uppercase",
                "tracking-[0.2em]",
                "mt-1",
              )}
            >
              Console v2.0
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation */}
      <nav className={cn("flex-1", "px-4", "space-y-2 z-60")}>
        <p
          className={cn(
            "px-4",
            "text-[9px]",
            "font-black",
            "text-slate-500",
            "uppercase",
            "tracking-widest",
            "mb-4",
          )}
        >
          Management Hub
        </p>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.path}
              className={`
                flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group
                ${
                  isActive
                    ? "bg-primary text-slate-900 shadow-xl shadow-primary/10"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }
              `}
            >
              <Icon
                className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? "text-slate-900" : "text-slate-500"}`}
              />
              <span
                className={cn(
                  "text-[11px]",
                  "font-black",
                  "uppercase",
                  "tracking-wider",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* 3. Sidebar Footer */}
      <div className={cn("p-6", "mt-auto")}>
        <div
          className={cn(
            "bg-white/5",
            "rounded-3xl",
            "p-4",
            "border",
            "border-white/5",
          )}
        >
          <p
            className={cn(
              "text-[10px]",
              "font-bold",
              "text-slate-400",
              "leading-relaxed",
              "mb-4",
            )}
          >
            Finished Managing? Return to the public interface.
          </p>
          <Link
            href="/"
            className={cn(
              "flex",
              "items-center",
              "justify-center",
              "gap-2",
              "w-full",
              "py-3",
              "bg-slate-800",
              "hover:bg-slate-700",
              "text-white",
              "rounded-xl",
              "text-[10px]",
              "font-black",
              "uppercase",
              "tracking-widest",
              "transition-all",
              "group",
            )}
          >
            <LuCircleArrowLeft
              className={cn(
                "w-4",
                "h-4",
                "text-primary",
                "group-hover:-translate-x-1",
                "transition-transform",
              )}
            />
            Main Site
          </Link>
        </div>
      </div>
    </aside>
  );
};
