"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  Settings,
  ChevronDown,
  Award,
  Briefcase,
  Zap,
  Star,
} from "lucide-react";
import Image from "next/image";
import { cn } from "../../../lib/utils";

interface DropdownItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
}

export const HomeHeader = () => {
  const [isOpen, setIsOpen] = useState(false);

  const user = {
    name: "Nnamdi",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nnamdi",
    status: "Final Year Student",
    skill: "Web Dev",
    Interest: "Tech",
    Projects_participated: "6",
    points: 450,
  };

  return (
    <header
      className={cn(
        "w-full",
        "bg-white",
        "border-b",
        "border-slate-100",
        "sticky",
        "top-0",
        "z-50",
      )}
    >
      <div
        className={cn(
          "max-w-7xl",
          "mx-auto",
          "px-4",
          "sm:px-6",
          "lg:px-8",
          "py-3",
        )}
      >
        <div className={cn("flex", "items-center", "justify-between", "gap-4")}>
          {/* LEFT: Greeting (Keep it minimal) */}
          <div className={cn("flex", "items-center", "gap-3", "min-w-0")}>
            <div className={cn("relative", "shrink-0")}>
              <div
                className={cn(
                  "w-10",
                  "h-10",
                  "md:w-12",
                  "md:h-12",
                  "rounded-xl",
                  "overflow-hidden",
                  "border",
                  "border-slate-200",
                )}
              >
                <Image
                  width={48}
                  height={48}
                  src={user.avatar}
                  alt={user.name}
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div
                className={cn(
                  "absolute",
                  "-bottom-0.5",
                  "-right-0.5",
                  "w-3",
                  "h-3",
                  "bg-green-500",
                  "border-2",
                  "border-white",
                  "rounded-full",
                )}
              />
            </div>
            <div className="truncate">
              <h1
                className={cn(
                  "text-base",
                  "md:text-lg",
                  "font-bold",
                  "text-slate-900",
                  "truncate",
                )}
              >
                Hi, {user.name} 👋
              </h1>
              <p
                className={cn(
                  "text-xs",
                  "text-slate-500",
                  "hidden",
                  "md:block",
                )}
              >
                Ready for your next step?
              </p>
            </div>
          </div>

          {/* MIDDLE: Search Bar (Hidden on Mobile, visible on Tab/Desktop) */}
          <div
            className={cn("hidden", "sm:flex", "flex-1", "max-w-md", "mx-4")}
          >
            <div
              className={cn(
                "flex",
                "items-center",
                "bg-slate-50",
                "border",
                "border-slate-200",
                "rounded-lg",
                "px-3",
                "py-1.5",
                "w-full",
                "focus-within:ring-2",
                "focus-within:ring-primary/10",
                "transition-all",
              )}
            >
              <Search className={cn("w-4", "h-4", "text-slate-400")} />
              <input
                type="text"
                placeholder="Search workshops..."
                className={cn(
                  "bg-transparent",
                  "border-none",
                  "outline-none",
                  "text-sm",
                  "ml-2",
                  "w-full",
                  "text-slate-600",
                  "placeholder:text-slate-400",
                )}
              />
            </div>
          </div>

          {/* RIGHT: Actions */}
          <div className={cn("flex", "items-center", "gap-2", "md:gap-3")}>
            {/* Search Toggle (Mobile Only) */}
            <button className={cn("sm:hidden", "p-2", "text-slate-600")}>
              <Search className={cn("w-5", "h-5")} />
            </button>

            {/* Notifications */}
            <button
              className={cn(
                "relative",
                "p-2",
                "hover:bg-slate-50",
                "rounded-lg",
                "transition-colors",
                "group",
              )}
            >
              <Bell
                className={cn(
                  "w-5",
                  "h-5",
                  "text-slate-600",
                  "group-hover:text-primary",
                )}
              />
              <span
                className={cn(
                  "absolute",
                  "top-2",
                  "right-2",
                  "w-2",
                  "h-2",
                  "bg-primary",
                  "rounded-full",
                  "border-2",
                  "border-white",
                )}
              />
            </button>

            {/* User Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                  "flex items-center gap-1 md:gap-2 pl-2 border-l border-slate-200 ml-1 transition-all",
                  isOpen ? "text-primary" : "text-slate-400",
                )}
              >
                <Settings
                  className={cn(
                    "w-5 h-5 transition-transform duration-500",
                    isOpen && "rotate-180",
                  )}
                />
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>

              {/* DROPDOWN MENU */}
              <AnimatePresence>
                {isOpen && (
                  <>
                    {/* Backdrop for closing */}
                    <div
                      className={cn("fixed", "inset-0", "z-[-1]")}
                      onClick={() => setIsOpen(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={cn(
                        "absolute",
                        "right-0",
                        "mt-3",
                        "w-72",
                        "bg-white",
                        "border",
                        "border-slate-100",
                        "shadow-xl",
                        "rounded-2xl",
                        "overflow-hidden",
                        "p-2",
                      )}
                    >
                      {/* Points Card */}
                      <div
                        className={cn(
                          "bg-orange-50",
                          "p-4",
                          "rounded-xl",
                          "mb-2",
                          "flex",
                          "items-center",
                          "justify-between",
                        )}
                      >
                        <div className={cn("flex", "items-center", "gap-2")}>
                          <div
                            className={cn(
                              "w-8",
                              "h-8",
                              "bg-primary",
                              "rounded-full",
                              "flex",
                              "items-center",
                              "justify-center",
                              "text-white",
                              "text-xs",
                              "font-bold",
                              "shadow-lg",
                              "shadow-primary/20",
                            )}
                          >
                            P
                          </div>
                          <span
                            className={cn(
                              "text-sm",
                              "font-bold",
                              "text-orange-900",
                            )}
                          >
                            Career Points
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-lg",
                            "font-black",
                            "text-primary",
                          )}
                        >
                          {user.points}
                        </span>
                      </div>

                      {/* User Stats/Metadata Section */}
                      <div
                        className={cn(
                          "space-y-1",
                          "py-2",
                          "border-t",
                          "border-slate-50",
                        )}
                      >
                        <p
                          className={cn(
                            "px-3",
                            "text-[10px]",
                            "font-bold",
                            "text-slate-400",
                            "uppercase",
                            "tracking-widest",
                            "mb-2",
                          )}
                        >
                          My Journey
                        </p>

                        <DropdownItem
                          icon={<Award className={cn("w-4", "h-4")} />}
                          label="Status"
                          value={user.status}
                          color="text-blue-600"
                          bg="bg-blue-50"
                        />
                        <DropdownItem
                          icon={<Zap className={cn("w-4", "h-4")} />}
                          label="Core Skill"
                          value={user.skill}
                          color="text-amber-600"
                          bg="bg-amber-50"
                        />
                        <DropdownItem
                          icon={<Star className={cn("w-4", "h-4")} />}
                          label="Interest"
                          value={user.Interest}
                          color="text-purple-600"
                          bg="bg-purple-50"
                        />
                        <DropdownItem
                          icon={<Briefcase className={cn("w-4", "h-4")} />}
                          label="Projects"
                          value={`${user.Projects_participated} Completed`}
                          color="text-green-600"
                          bg="bg-green-50"
                        />
                      </div>

                      <div
                        className={cn(
                          "mt-2",
                          "pt-2",
                          "border-t",
                          "border-slate-100",
                        )}
                      >
                        <button
                          className={cn(
                            "w-full",
                            "flex",
                            "items-center",
                            "gap-2",
                            "px-3",
                            "py-2",
                            "text-sm",
                            "text-slate-600",
                            "hover:bg-slate-50",
                            "rounded-lg",
                            "transition-colors",
                          )}
                        >
                          <Settings className={cn("w-4", "h-4")} /> Account
                          Settings
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};



// Helper component for clean layout
const DropdownItem = ({ icon, label, value, color, bg }: DropdownItemProps) => (
  <div
    className={cn(
      "flex",
      "items-center",
      "justify-between",
      "px-3",
      "py-2",
      "rounded-lg",
      "hover:bg-slate-50",
      "transition-colors",
    )}
  >
    <div className={cn("flex", "items-center", "gap-3")}>
      <div className={cn("p-1.5 rounded-md", bg, color)}>{icon}</div>
      <span className={cn("text-xs", "font-medium", "text-slate-500")}>
        {label}
      </span>
    </div>
    <span className={cn("text-xs font-bold", color)}>{value}</span>
  </div>
);
