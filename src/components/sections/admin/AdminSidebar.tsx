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
  LuMailOpen,
  LuClipboardList,
  LuHeartPulse,
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
    id: "invites",
    label: "Invite Codes",
    icon: LuMailOpen,
    path: "/admin/invites",
  },
  {
    id: "applications",
    label: "Applications",
    icon: LuClipboardList,
    path: "/admin/applications",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: LuChartBar,
    path: "/admin/analytics",
  },
  { id: "health", label: "Health", icon: LuHeartPulse, path: "/admin/health" },
  {
    id: "settings",
    label: "Console Config",
    icon: LuSettings,
    path: "/admin/settings",
  },
];

export const AdminSidebar = () => {
  const pathname = usePathname();

  // Active check — /admin/events matches /admin/events/* but not /admin alone
  const isActive = (path: string) =>
    path === "/admin" ? pathname === "/admin" : pathname.startsWith(path);

  return (
    <aside
      className={cn(
        "w-72",
        "min-h-screen",
        "bg-foreground",
        "border-r",
        "border-background/5",
        "flex",
        "flex-col",
        "sticky",
        "top-0",
        "z-[99]",
        "lg:rounded-2xl",
      )}
    >
      {/* Brand */}
      <div className={cn("p-8", "pb-10")}>
        <div
          className={cn(
            "flex",
            "w-full",
            "h-auto",
            "items-center",
            "justify-center",
            "gap-3",
          )}
        >
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
                "text-background",
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
                "text-muted-foreground",
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

      {/* Nav */}
      <nav className={cn("flex-1", "px-4", "space-y-2")}>
        <p
          className={cn(
            "px-4",
            "text-[9px]",
            "font-black",
            "text-muted-foreground",
            "uppercase",
            "tracking-widest",
            "mb-4",
          )}
        >
          Management Hub
        </p>

        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.path}
              className={cn(
                "flex",
                "items-center",
                "gap-4",
                "px-4",
                "py-3.5",
                "rounded-2xl",
                "transition-all",
                "group",
                active
                  ? "bg-primary text-foreground shadow-xl shadow-primary/10"
                  : "text-muted-foreground hover:text-background hover:bg-background/5",
              )}
            >
              <Icon
                className={cn(
                  "w-5",
                  "h-5",
                  "transition-transform",
                  "group-hover:scale-110",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
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

      {/* Footer */}
      <div className={cn("p-6", "mt-auto")}>
        <div
          className={cn(
            "bg-background/5",
            "rounded-3xl",
            "p-4",
            "border",
            "border-background/5",
          )}
        >
          <p
            className={cn(
              "text-[10px]",
              "font-bold",
              "text-muted-foreground",
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
              "text-background",
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
