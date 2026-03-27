"use client";
// app/settings/page.tsx
import React, { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";

import { SettingsHeader } from "@/components/sections/settings/SettingsHeader";
import { AccountSettingsSection } from "@/components/sections/settings/AccountSettings";
import { SecuritySettingsSection } from "@/components/sections/settings/SecuritySettings";
import { NotificationSettingsSection } from "@/components/sections/settings/NotificationSettings";
import { AppearanceSettingsSection } from "@/components/sections/settings/AppearanceSettings";
import { PrivacySettingsSection } from "@/components/sections/settings/PrivacySettings";
import { DangerZoneSection } from "@/components/sections/settings/DangerZone";

const SETTINGS_TABS = [
  { id: "account", label: "Account" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "appearance", label: "Appearance" },
  { id: "privacy", label: "Privacy" },
  { id: "danger", label: "Danger Zone" },
] as const;

export default function SettingsPage() {
  const { profile, refreshProfile } = useUser();
  const [activeTab, setActiveTab] = useState("account");

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <main
      className={cn(
        "min-h-screen",
        "w-full",
        "mt-15",
        "bg-background",
        "pb-20",
      )}
    >
      <Toaster position="bottom-right" />

      {/* Header */}
      <SettingsHeader profile={profile} />

      <div
        className={cn(
          "max-w-7xl",
          "mx-auto",
          "px-4",
          "sm:px-6",
          "lg:px-8",
          "mt-10",
        )}
      >
        <div className={cn("grid", "grid-cols-1", "lg:grid-cols-12", "gap-12")}>
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <div className={cn("sticky", "top-8", "space-y-8")}>
              {/* Desktop nav */}
              <nav className={cn("hidden", "lg:flex", "flex-col", "gap-1")}>
                {SETTINGS_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => scrollToSection(tab.id)}
                    className={cn(
                      "flex items-center px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer transition-all",
                      activeTab === tab.id
                        ? "bg-foreground text-background shadow-xl shadow-foreground/20 translate-x-2"
                        : "text-muted-foreground hover:text-muted",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              {/* Mobile scroller */}
              <nav
                className={cn(
                  "lg:hidden",
                  "flex",
                  "overflow-x-auto",
                  "no-scrollbar",
                  "gap-2",
                  "pb-4",
                  "border-b",
                  "border-border",
                  "sticky",
                  "top-0",
                  "bg-background",
                  "z-20",
                )}
              >
                {SETTINGS_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => scrollToSection(tab.id)}
                    className={cn(
                      "shrink-0 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer",
                      activeTab === tab.id
                        ? "bg-primary text-background"
                        : "bg-background text-muted-foreground border border-border",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              {/* Support card */}
              <div
                className={cn(
                  "hidden",
                  "lg:block",
                  "p-6",
                  "bg-gradient-to-br",
                  "from-primary/10",
                  "to-transparent",
                  "border",
                  "border-primary/10",
                  "rounded-[2rem]",
                )}
              >
                <p
                  className={cn(
                    "text-[10px]",
                    "font-black",
                    "text-primary",
                    "uppercase",
                    "mb-2",
                  )}
                >
                  Technical Support
                </p>
                <p
                  className={cn(
                    "text-xs",
                    "text-muted-foreground",
                    "font-medium",
                    "leading-relaxed",
                  )}
                >
                  Need help with your account settings? Our team is available
                  24/7.
                </p>
                <button
                  className={cn(
                    "mt-4",
                    "text-[10px]",
                    "font-black",
                    "uppercase",
                    "text-foreground",
                    "underline",
                    "underline-offset-4",
                    "cursor-pointer",
                  )}
                >
                  Open a Ticket
                </button>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className={cn("lg:col-span-9", "space-y-12")}>
            <div id="account">
              {" "}
              <AccountSettingsSection profile={profile} />
            </div>
            <div id="security">
              {" "}
              <SecuritySettingsSection />
            </div>
            <div id="notifications">
              <NotificationSettingsSection key={profile ? "loaded" : "init"} />
            </div>
            <div id="appearance">
              {" "}
              <AppearanceSettingsSection key={profile ? "loaded" : "init"} />
            </div>
            <div id="privacy">
              {" "}
              <PrivacySettingsSection key={profile ? "loaded" : "init"} />
            </div>
            <div id="danger">
              {" "}
              <DangerZoneSection />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
