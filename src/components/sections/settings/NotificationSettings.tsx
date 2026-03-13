"use client";
import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LuBellRing,
  LuMail,
  LuTicket,
  LuCalendarCheck,
  LuMegaphone,
  LuClock,
  LuLoader,
} from "react-icons/lu";
import { IconType } from "react-icons";
import { useUser } from "@/context/UserContext";
import type {
  NotificationPreferences,
  NotificationFrequency,
} from "@/types/domain";
import { toast } from "react-hot-toast";

interface ToggleProps {
  icon: IconType;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  delay?: number;
}

const TOGGLE_CONFIG: {
  key: keyof Omit<NotificationPreferences, "frequency">;
  icon: IconType;
  title: string;
  desc: string;
}[] = [
  {
    key: "tickets",
    icon: LuTicket,
    title: "Ticket & Booking Updates",
    desc: "Get notified about purchase confirmations and QR codes.",
  },
  {
    key: "reminders",
    icon: LuCalendarCheck,
    title: "Event Reminders",
    desc: "Receive alerts 24h and 1h before your registered events.",
  },
  {
    key: "messages",
    icon: LuMail,
    title: "Direct Messages",
    desc: "Notifications when other DIUSCADI members message you.",
  },
  {
    key: "marketing",
    icon: LuMegaphone,
    title: "Marketing & News",
    desc: "Stay updated on new tracks, sessions, and platform features.",
  },
];

export const NotificationSettingsSection = () => {
  const { profile, updatePreferences } = useUser();
  const prefs = profile?.preferences.notifications;

  // Initialise from prefs at mount — component is keyed in page.tsx so it
  // remounts once profile loads, no useEffect sync needed.
  const [frequency, setFrequency] = useState<NotificationFrequency>(
    prefs?.frequency ?? "instant",
  );
  const [toggles, setToggles] = useState({
    tickets: prefs?.tickets ?? true,
    reminders: prefs?.reminders ?? true,
    messages: prefs?.messages ?? false,
    marketing: prefs?.marketing ?? false,
  });
  const [saving, setSaving] = useState(false);

  const save = useCallback(
    async (patch: Partial<NotificationPreferences>) => {
      setSaving(true);
      const result = await updatePreferences({
        notifications: { ...toggles, frequency, ...patch },
      });
      setSaving(false);
      if (!result.success) toast.error(result.error ?? "Failed to save");
    },
    [updatePreferences, toggles, frequency],
  );

  const handleFrequency = async (v: NotificationFrequency) => {
    setFrequency(v);
    await save({ frequency: v });
  };

  const handleToggle = async (key: keyof typeof toggles, value: boolean) => {
    setToggles((p) => ({ ...p, [key]: value }));
    await save({ [key]: value });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-background",
        "border-2",
        "border-border",
        "rounded-[2.5rem]",
        "p-8",
        "md:p-10",
        "shadow-sm",
      )}
    >
      <div className={cn("flex", "items-center", "justify-between", "mb-10")}>
        <div className={cn("flex", "items-center", "gap-3")}>
          <div
            className={cn(
              "w-10",
              "h-10",
              "rounded-xl",
              "bg-muted",
              "flex",
              "items-center",
              "justify-center",
              "text-primary",
              "border",
              "border-border",
            )}
          >
            <LuBellRing className={cn("w-5", "h-5")} />
          </div>
          <div>
            <h3
              className={cn(
                "text-xl",
                "font-black",
                "text-foreground",
                "tracking-tight",
              )}
            >
              Notification Channels
            </h3>
            <p
              className={cn(
                "text-[10px]",
                "font-bold",
                "text-muted-foreground",
                "uppercase",
                "tracking-widest",
                "mt-1",
              )}
            >
              Choose how and when we reach you
            </p>
          </div>
        </div>
        {saving && (
          <LuLoader
            className={cn("w-4", "h-4", "text-primary", "animate-spin")}
          />
        )}
      </div>

      {/* Frequency control */}
      <div
        className={cn(
          "mb-10",
          "p-6",
          "bg-foreground",
          "rounded-3xl",
          "flex",
          "flex-col",
          "md:flex-row",
          "items-center",
          "justify-between",
          "gap-6",
          "overflow-hidden",
          "relative",
        )}
      >
        <div
          className={cn(
            "absolute",
            "top-0",
            "right-0",
            "w-32",
            "h-32",
            "bg-primary/20",
            "rounded-full",
            "blur-3xl",
            "-mr-16",
            "-mt-16",
          )}
        />
        <div
          className={cn("flex", "items-center", "gap-4", "relative", "z-10")}
        >
          <div
            className={cn(
              "w-10",
              "h-10",
              "bg-background/10",
              "rounded-xl",
              "flex",
              "items-center",
              "justify-center",
              "text-primary",
            )}
          >
            <LuClock className={cn("w-5", "h-5")} />
          </div>
          <div>
            <h4
              className={cn(
                "text-sm",
                "font-black",
                "text-background",
                "uppercase",
                "tracking-tight",
              )}
            >
              Delivery Frequency
            </h4>
            <p
              className={cn(
                "text-[10px]",
                "font-bold",
                "text-muted-foreground",
              )}
            >
              Control the volume of emails
            </p>
          </div>
        </div>
        <select
          value={frequency}
          disabled={saving}
          onChange={(e) =>
            handleFrequency(e.target.value as NotificationFrequency)
          }
          className={cn(
            "relative",
            "z-10",
            "w-full",
            "md:w-48",
            "bg-background/10",
            "border",
            "border-background/10",
            "rounded-xl",
            "px-4",
            "py-3",
            "text-xs",
            "font-black",
            "text-background",
            "uppercase",
            "tracking-widest",
            "outline-none",
            "cursor-pointer",
            "disabled:opacity-50",
          )}
        >
          <option value="instant" className="text-foreground">
            Instant
          </option>
          <option value="daily" className="text-foreground">
            Daily Digest
          </option>
          <option value="weekly" className="text-foreground">
            Weekly Wrap
          </option>
        </select>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        {TOGGLE_CONFIG.map((c, i) => (
          <Toggle
            key={c.key}
            icon={c.icon}
            title={c.title}
            desc={c.desc}
            checked={toggles[c.key]}
            onChange={(v) => handleToggle(c.key, v)}
            delay={0.05 * i}
          />
        ))}
      </div>
    </motion.section>
  );
};

const Toggle = ({
  icon: Icon,
  title,
  desc,
  checked,
  onChange,
  delay = 0,
}: ToggleProps) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    whileHover={{ scale: 1.01, x: 4 }}
    className={cn(
      "group",
      "flex",
      "items-center",
      "justify-between",
      "p-6",
      "rounded-[2rem]",
      "border",
      "transition-all",
      checked
        ? "bg-background border-border shadow-sm"
        : "bg-muted border-transparent opacity-70",
    )}
  >
    <div className={cn("flex", "items-start", "gap-4")}>
      <div
        className={cn(
          "w-10",
          "h-10",
          "rounded-xl",
          "flex",
          "items-center",
          "justify-center",
          "shrink-0",
          "transition-all",
          checked
            ? "bg-primary text-background shadow-lg shadow-primary/20"
            : "bg-background text-slate-300 border border-border",
        )}
      >
        <Icon className={cn("w-5", "h-5")} />
      </div>
      <div className="space-y-0.5">
        <h4
          className={cn(
            "text-sm",
            "font-black",
            "uppercase",
            "tracking-tight",
            checked ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {title}
        </h4>
        <p
          className={cn(
            "text-xs",
            "font-medium",
            "text-muted-foreground",
            "max-w-sm",
            "leading-snug",
          )}
        >
          {desc}
        </p>
      </div>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative",
        "w-12",
        "h-6",
        "rounded-full",
        "transition-colors",
        "duration-300",
        "outline-none",
        "cursor-pointer",
        "shrink-0",
        checked ? "bg-emerald-500" : "bg-slate-200",
      )}
    >
      <motion.div
        animate={{ x: checked ? 28 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "absolute",
          "top-1",
          "w-4",
          "h-4",
          "bg-background",
          "rounded-full",
          "shadow-sm",
        )}
      />
    </button>
  </motion.div>
);
