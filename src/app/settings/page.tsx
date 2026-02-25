"use client";
import React, { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Import UI Sections
import { SettingsHeader } from "@/components/sections/settings/SettingsHeader";
import { AccountSettingsSection } from "@/components/sections/settings/AccountSettings";
import { SecuritySettingsSection } from "@/components/sections/settings/SecuritySettings";
import { NotificationSettingsSection } from "@/components/sections/settings/NotificationSettings";
import { AppearanceSettingsSection } from "@/components/sections/settings/AppearanceSettings";
import { PrivacySettingsSection } from "@/components/sections/settings/PrivacySettings";
import { DangerZoneSection } from "@/components/sections/settings/DangerZone";
import { cn } from "@/lib/utils";

const SETTINGS_TABS = [
  { id: "account", label: "Account" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "appearance", label: "Appearance" },
  { id: "privacy", label: "Privacy" },
  { id: "danger", label: "Danger Zone" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");

  // Mock User Data
  const user = {
    name: "Alexander Chidubem",
    email: "alex.chidubem@example.com",
    avatar: "",
  };

  // Scroll handler for smooth navigation
  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <main className={cn('min-h-screen w-full mt-15', 'bg-[#F8FAFC]', 'pb-20')}>
      <Toaster position="bottom-right" />

      {/* 1. Header Area */}
      <SettingsHeader user={user} />

      <div className={cn('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'mt-10')}>
        <div className={cn('grid', 'grid-cols-1', 'lg:grid-cols-12', 'gap-12')}>
          {/* 2. Desktop Sidebar / Mobile Tabs */}
          <aside className="lg:col-span-3">
            <div className={cn('sticky', 'top-8', 'space-y-8')}>
              {/* Desktop Nav */}
              <nav className={cn('hidden', 'lg:flex', 'flex-col', 'gap-1')}>
                {SETTINGS_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => scrollToSection(tab.id)}
                    className={`flex items-center px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer transition-all ${
                      activeTab === tab.id
                        ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20 translate-x-2"
                        : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              {/* Mobile Tab Scroller */}
              <nav className={cn('lg:hidden', 'flex', 'overflow-x-auto', 'no-scrollbar', 'gap-2', 'pb-4', 'border-b', 'border-slate-100', 'sticky', 'top-0', 'bg-[#F8FAFC]', 'z-20')}>
                {SETTINGS_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => scrollToSection(tab.id)}
                    className={`shrink-0 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-primary text-white"
                        : "bg-white text-slate-400 border border-slate-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              {/* Support Card */}
              <div className={cn('hidden', 'lg:block', 'p-6', 'bg-linear-to-br', 'from-primary/10', 'to-transparent', 'border', 'border-primary/10', 'rounded-[2rem]')}>
                <p className={cn('text-[10px]', 'font-black', 'text-primary', 'uppercase', 'mb-2')}>
                  Technical Support
                </p>
                <p className={cn('text-xs', 'text-slate-500', 'font-medium', 'leading-relaxed')}>
                  Need help with your account settings? Our team is available
                  24/7.
                </p>
                <button className={cn('mt-4', 'text-[10px]', 'font-black', 'uppercase', 'text-slate-900', 'underline', 'underline-offset-4')}>
                  Open a Ticket
                </button>
              </div>
            </div>
          </aside>

          {/* 3. Main Content Area */}
          <div className={cn('lg:col-span-9', 'space-y-12')}>
            <div id="account">
              <AccountSettingsSection />
            </div>
            <div id="security">
              <SecuritySettingsSection />
            </div>
            <div id="notifications">
              <NotificationSettingsSection />
            </div>
            <div id="appearance">
              <AppearanceSettingsSection />
            </div>
            <div id="privacy">
              <PrivacySettingsSection />
            </div>
            <div id="danger">
              <DangerZoneSection />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
