"use client";
import React from "react";
import { cn } from "@/lib/utils";
import {
  LuCamera,
  LuUser,
  LuBriefcase,
  LuContact,
  LuShare2,
  LuSettings,
  LuCircleCheck,
  LuCircle,
} from "react-icons/lu";

// Define the nav items with completion logic
const navItems = [
  { id: "photo", label: "Profile Photo", icon: LuCamera, required: true },
  { id: "basic", label: "Basic Info", icon: LuUser, required: true },
  { id: "pro", label: "Professional Info", icon: LuBriefcase, required: true },
  { id: "contact", label: "Contact Info", icon: LuContact, required: true },
  { id: "social", label: "Social Links", icon: LuShare2, required: false },
  { id: "prefs", label: "Preferences", icon: LuSettings, required: false },
];

interface EditProfileSidebarProps {
  activeSection: string;
  completedSections: string[]; // e.g., ["photo", "basic"]
  onSectionClick: (id: string) => void;
}

export const EditProfileSidebar = ({
  activeSection,
  completedSections,
  onSectionClick,
}: EditProfileSidebarProps) => {
  return (
    <div className="flex flex-col gap-8">
      {/* 1. Sidebar Title */}
      <div className="px-4">
        <h2 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">
          Profile Settings
        </h2>
        <p className="text-[10px] font-bold text-muted-foreground mt-1">
          Manage your digital footprint
        </p>
      </div>

      {/* 2. Sidebar Navigation */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const isComplete = completedSections.includes(item.id);

          return (
            <button
              key={item.id}
              onClick={() => onSectionClick(item.id)}
              className={cn(
                "group flex items-center justify-between w-full p-4 rounded-2xl transition-all duration-300",
                isActive
                  ? "bg-background shadow-xl shadow-slate-200/60 border border-border ring-1 ring-slate-100/50"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="flex items-center gap-4">
                {/* Icon Container */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                    isActive
                      ? "bg-foreground text-background shadow-lg shadow-foreground/20"
                      : "text-muted text-muted-foreground group-hover:bg-slate-200",
                  )}
                >
                  <item.icon className="w-4.5 h-4.5" />
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-[11px] font-black uppercase tracking-widest",
                    isActive ? "text-foreground" : "text-inherit",
                  )}
                >
                  {item.label}
                </span>
              </div>

              {/* Status Indicator (Elite UX Touch) */}
              <div className="flex items-center">
                {isComplete ? (
                  <LuCircleCheck className="w-4 h-4 text-emerald-500" />
                ) : item.required ? (
                  <LuCircle className="w-4 h-4 text-slate-200" />
                ) : null}
              </div>
            </button>
          );
        })}
      </nav>

      {/* 3. Help Card (Optional Sidebar Footer) */}
      <div className="mt-4 p-5 bg-linear-to-br from-foreground to-slate-800 rounded-[2rem] text-background">
        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">
          Need Help?
        </p>
        <p className="text-[11px] font-medium text-slate-300 leading-relaxed mb-4">
          Changes take effect across the entire DIUSCADI network.
        </p>
        <button className="text-[10px] font-black uppercase tracking-widest text-background underline decoration-blue-500/50 underline-offset-4">
          Contact Support
        </button>
      </div>
    </div>
  );
};
