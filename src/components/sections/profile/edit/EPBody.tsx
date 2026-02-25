"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LuUser,
  LuBriefcase,
  LuContact,
  LuShare2,
  LuSettings,
  LuCamera,
} from "react-icons/lu";

// 1. Define the Navigation Items
const navItems = [
  { id: "photo", label: "Profile Photo", icon: LuCamera },
  { id: "basic", label: "Basic Info", icon: LuUser },
  { id: "pro", label: "Professional", icon: LuBriefcase },
  { id: "contact", label: "Contact Info", icon: LuContact },
  { id: "social", label: "Social Links", icon: LuShare2 },
  { id: "prefs", label: "Preferences", icon: LuSettings },
];

export const EditProfileBody = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [activeTab, setActiveTab] = useState("basic");

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* --- SIDEBAR NAVIGATION (Desktop: 3 Cols / Mobile: Top Tabs) --- */}
        <aside className="lg:col-span-3">
          {/* Mobile Tab Scroller */}
          <div className="lg:hidden flex overflow-x-auto pb-4 gap-2 no-scrollbar border-b border-slate-100">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={cn(
                  "flex-none flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === item.id
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-white text-slate-500 border border-slate-100",
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop Vertical Menu */}
          <nav className="hidden lg:block sticky top-32 space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 px-4">
              Sections
            </p>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group",
                  activeTab === item.id
                    ? "bg-white text-primary shadow-xl shadow-slate-200/50 border border-slate-100"
                    : "text-slate-400 hover:text-slate-900 hover:bg-slate-50",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    activeTab === item.id
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-400 group-hover:bg-slate-200",
                  )}
                >
                  <item.icon className="w-4 h-4" />
                </div>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* --- MAIN FORM CONTENT (9 Cols) --- */}
        <div className="lg:col-span-9 space-y-12 pb-32">{children}</div>
      </div>
    </div>
  );
};


// component USAGE
{/* <EditProfileHeader ... />
<EditProfileBody>
  <div id="photo"><ProfilePhotoSection /></div>
  <div id="basic"><BasicInfoSection /></div>
</EditProfileBody> */}