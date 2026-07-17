"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";
import { canAccessAdminPanel, getConsoleLinkAccess } from "@/lib/roles";
import { AdminHeader } from "@/components/sections/admin/adminHeader";
import { AdminSidebar } from "@/components/sections/admin/AdminSidebar";
import { AdminStatsOverview } from "@/components/sections/admin/AdminStatsOverview";
import { AdminQuickActions } from "@/components/sections/admin/AdminQuickActions";
import { AdminRecentActivity } from "@/components/sections/admin/AdminRecentActivity";
import { AdminUpcomingEventsPreview } from "@/components/sections/admin/AUEventsPreview";
import { BroadcastModal } from "@/components/sections/admin/broadcast/BroadcastModal";
import { LuMenu, LuX, LuLoader, LuMegaphone, LuEye } from "react-icons/lu";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const role = user?.role ?? null;
  const { profile } = useUser();
  const router = useRouter();
  const {
    analytics,
    loadingAnalytics,
    loadAnalytics,
    loadAdminEvents,
    adminEvents,
  } = useAdmin();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  // Defense-in-depth: the server-side layout gate runs once at navigation.
  // This catches a role change mid-session (stale cache, token refresh
  // downgrading access, tampered client state) without needing a reload.
  useEffect(() => {
    if (!role) return;
    if (!canAccessAdminPanel(role)) {
      router.replace("/home");
    }
  }, [role, router]);

  const access = role ? getConsoleLinkAccess(role) : "none";
  const isReadOnly = access === "readonly";

  useEffect(() => {
    if (!token) return;
    loadAnalytics(token);
    loadAdminEvents({ status: "published", page: 1 }, token);
  }, [token, loadAnalytics, loadAdminEvents]);

  // Don't flash admin content if the reactive check above is about to redirect.
  if (role && !canAccessAdminPanel(role)) {
    return (
      <div
        className={cn("flex", "items-center", "justify-center", "min-h-screen")}
      >
        <LuLoader
          className={cn("w-8", "h-8", "text-primary", "animate-spin")}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen w-full mt-20",
        "bg-background",
        "flex",
        "overflow-hidden",
      )}
    >
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:col-span-2`}
      >
        <AdminSidebar />
      </div>
      {isSidebarOpen && (
        <div
          className={cn(
            "fixed",
            "inset-0",
            "bg-foreground/50",
            "backdrop-blur-sm",
            "z-40",
            "lg:hidden",
          )}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={cn(
          "flex-1",
          "flex",
          "flex-col",
          "min-w-0",
          "overflow-y-auto",
        )}
      >
        {/* Mobile header toggle */}
        <div
          className={cn(
            "lg:hidden",
            "flex md:rounded-t-2xl",
            "items-center",
            "justify-between",
            "p-4",
            "bg-foreground",
            "text-background",
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
            className={cn("p-2", "bg-background/10", "rounded-lg")}
          >
            {isSidebarOpen ? (
              <LuX className={cn("w-5", "h-5")} />
            ) : (
              <LuMenu className={cn("w-5", "h-5")} />
            )}
          </button>
        </div>

        <AdminHeader profile={profile} />

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
          {loadingAnalytics && !analytics ? (
            <div
              className={cn("flex", "items-center", "justify-center", "py-20")}
            >
              <LuLoader
                className={cn("w-8", "h-8", "text-primary", "animate-spin")}
              />
            </div>
          ) : (
            <>
              {/* Read-only banner — shown to moderators only */}
              {isReadOnly && (
                <div
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-3",
                    "p-4",
                    "bg-violet-500/5",
                    "border",
                    "border-violet-500/20",
                    "rounded-2xl",
                  )}
                >
                  <LuEye className="w-5 h-5 text-violet-500 shrink-0" />
                  <p className="text-[11px] text-violet-600 font-bold">
                    Moderator access — read-only dashboard. Ticket scanning is
                    available under Tickets.
                  </p>
                </div>
              )}

              {/* Broadcast Button — mutating action, hidden for read-only (mod) access */}
              {!isReadOnly && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowBroadcastModal(true)}
                    className={cn(
                      "flex",
                      "items-center",
                      "gap-2",
                      "px-6",
                      "py-2",
                      "bg-primary",
                      "text-background",
                      "rounded-lg",
                      "font-bold",
                      "hover:opacity-90",
                      "transition",
                    )}
                  >
                    <LuMegaphone className="w-4 h-4" />
                    Send Broadcast
                  </button>
                </div>
              )}

              <AdminStatsOverview analytics={analytics} />
              <AdminQuickActions />
              <div
                className={cn(
                  "grid",
                  "grid-cols-1",
                  "lg:grid-cols-12",
                  "gap-8",
                  "items-start",
                )}
              >
                <div className={cn("lg:col-span-7")}>
                  <AdminRecentActivity
                    recentSignups={analytics?.recentSignups ?? []}
                  />
                </div>
                <div className={cn("lg:col-span-5")}>
                  <AdminUpcomingEventsPreview events={adminEvents} />
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Broadcast Modal — mounted only when accessible; guarded here too in
          case isReadOnly flips mid-session while the modal is open */}
      {!isReadOnly && (
        <BroadcastModal
          open={showBroadcastModal}
          onClose={() => setShowBroadcastModal(false)}
          onSuccess={() => {
            if (token) loadAnalytics(token);
          }}
          token={token ?? undefined}
        />
      )}
    </div>
  );
}
