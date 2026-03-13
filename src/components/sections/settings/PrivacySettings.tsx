"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LuLock,
  LuEye,
  LuEyeOff,
  LuMail,
  LuPhone,
  LuDownload,
  LuInfo,
  LuLoader,
} from "react-icons/lu";
import { IconType } from "react-icons";
import { useUser } from "@/context/UserContext";
import type { PrivacyPreferences } from "@/types/domain";
import { toast } from "react-hot-toast";

interface PrivacyToggleProps {
  icon: IconType;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  delay?: number;
}

export const PrivacySettingsSection = () => {
  const { profile, updatePreferences } = useUser();
  const prefs = profile?.preferences.privacy;

  // Initialise from prefs at mount — component is keyed in page.tsx so it
  // remounts once profile loads, no useEffect sync needed.
  const [values, setValues] = useState<PrivacyPreferences>({
    profilePrivate: prefs?.profilePrivate ?? false,
    showEmail: prefs?.showEmail ?? false,
    showPhone: prefs?.showPhone ?? false,
  });
  const [saving, setSaving] = useState(false);

  const save = async (patch: Partial<PrivacyPreferences>) => {
    const next = { ...values, ...patch };
    const prev = { ...values };
    setValues(next);
    setSaving(true);
    const result = await updatePreferences({ privacy: next });
    setSaving(false);
    if (!result.success) {
      setValues(prev); // roll back
      toast.error(result.error ?? "Failed to save");
    }
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
      {/* Header */}
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
            <LuLock className={cn("w-5", "h-5")} />
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
              Privacy & Visibility
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
              Manage your digital footprint and data access
            </p>
          </div>
        </div>
        {saving && (
          <LuLoader
            className={cn("w-4", "h-4", "text-primary", "animate-spin")}
          />
        )}
      </div>

      {/* Global visibility toggle */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className={cn(
          "mb-10",
          "p-8",
          "rounded-[2rem]",
          "border-2",
          "transition-all",
          "duration-300",
          values.profilePrivate
            ? "bg-foreground border-slate-800"
            : "bg-blue-50/30 border-blue-100",
        )}
      >
        <div
          className={cn(
            "flex",
            "flex-col",
            "md:flex-row",
            "items-start",
            "md:items-center",
            "justify-between",
            "gap-6",
          )}
        >
          <div className={cn("flex", "items-start", "gap-4")}>
            <div
              className={cn(
                "w-12",
                "h-12",
                "rounded-2xl",
                "flex",
                "items-center",
                "justify-center",
                "shrink-0",
                "transition-all",
                "duration-300",
                values.profilePrivate
                  ? "bg-background/10 text-primary"
                  : "bg-background text-primary shadow-sm",
              )}
            >
              <AnimatePresence mode="wait">
                {values.profilePrivate ? (
                  <motion.div
                    key="private"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                  >
                    <LuEyeOff className={cn("w-6", "h-6")} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="public"
                    initial={{ scale: 0, rotate: 180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                  >
                    <LuEye className={cn("w-6", "h-6")} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div>
              <h4
                className={cn(
                  "text-sm",
                  "font-black",
                  "uppercase",
                  "tracking-tight",
                  values.profilePrivate ? "text-background" : "text-foreground",
                )}
              >
                Private Profile Mode
              </h4>
              <p
                className={cn(
                  "text-xs",
                  "font-medium",
                  "mt-1",
                  "leading-relaxed",
                  "max-w-sm",
                  values.profilePrivate
                    ? "text-muted-foreground"
                    : "text-muted-foreground",
                )}
              >
                When enabled, your profile is hidden from the DIUSCADI directory
                and only visible via direct link.
              </p>
            </div>
          </div>
          <button
            disabled={saving}
            onClick={() => save({ profilePrivate: !values.profilePrivate })}
            className={cn(
              "px-8",
              "py-3",
              "rounded-xl",
              "font-black",
              "text-[10px]",
              "uppercase",
              "tracking-widest",
              "transition-all",
              "duration-300",
              "cursor-pointer",
              "disabled:opacity-50",
              values.profilePrivate
                ? "bg-primary text-background shadow-lg shadow-primary/20"
                : "bg-background border border-blue-200 text-blue-600",
            )}
          >
            {values.profilePrivate ? "Go Public" : "Make Private"}
          </button>
        </div>
      </motion.div>

      {/* Granular toggles */}
      <div className="space-y-4">
        <label
          className={cn(
            "text-[10px]",
            "font-black",
            "text-muted-foreground",
            "uppercase",
            "tracking-[0.2em]",
            "ml-1",
          )}
        >
          Data Display Preferences
        </label>

        <PrivacyToggle
          icon={LuMail}
          label="Display Email on Digital ID"
          desc="Allow verified event attendees to see your primary email."
          checked={values.showEmail}
          onChange={(v) => save({ showEmail: v })}
          delay={0.05}
        />
        <PrivacyToggle
          icon={LuPhone}
          label="Display Phone Number"
          desc="Show your contact number for direct networking during sessions."
          checked={values.showPhone}
          onChange={(v) => save({ showPhone: v })}
          delay={0.1}
        />

        {/* Data export */}
        <div
          className={cn(
            "mt-10",
            "pt-8",
            "border-t",
            "border-slate-50",
            "flex",
            "flex-col",
            "md:flex-row",
            "items-center",
            "justify-between",
            "gap-6",
          )}
        >
          <div className={cn("flex", "items-center", "gap-3")}>
            <LuInfo className={cn("w-5", "h-5", "text-slate-300")} />
            <p
              className={cn(
                "text-[11px]",
                "font-medium",
                "text-muted-foreground",
              )}
            >
              You can request a full archive of your DIUSCADI data at any time.
            </p>
          </div>
          <button
            onClick={() =>
              toast("Data export will be emailed to you within 24 hours.", {
                icon: "📦",
              })
            }
            className={cn(
              "flex",
              "items-center",
              "gap-2",
              "px-6",
              "py-3",
              "bg-muted",
              "border",
              "border-border",
              "text-slate-600",
              "rounded-xl",
              "font-black",
              "text-[10px]",
              "uppercase",
              "tracking-widest",
              "hover:bg-foreground",
              "hover:text-background",
              "transition-colors",
              "cursor-pointer",
            )}
          >
            <LuDownload className={cn("w-4", "h-4")} /> Export Data (.JSON)
          </button>
        </div>
      </div>
    </motion.section>
  );
};

const PrivacyToggle = ({
  icon: Icon,
  label,
  desc,
  checked,
  onChange,
  delay = 0,
}: PrivacyToggleProps) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    whileHover={{ scale: 1.01, x: 4 }}
    className={cn(
      "flex",
      "items-center",
      "justify-between",
      "p-6",
      "bg-muted/50",
      "rounded-3xl",
      "border",
      "border-transparent",
      "hover:border-border",
      "transition-all",
    )}
  >
    <div className={cn("flex", "items-start", "gap-4")}>
      <div
        className={cn(
          "w-10",
          "h-10",
          "bg-background",
          "rounded-xl",
          "flex",
          "items-center",
          "justify-center",
          "text-muted-foreground",
          "border",
          "border-border",
        )}
      >
        <Icon className={cn("w-5", "h-5")} />
      </div>
      <div>
        <h4
          className={cn(
            "text-[11px]",
            "font-black",
            "text-foreground",
            "uppercase",
            "tracking-tight",
          )}
        >
          {label}
        </h4>
        <p
          className={cn(
            "text-[10px]",
            "font-medium",
            "text-muted-foreground",
            "mt-0.5",
          )}
        >
          {desc}
        </p>
      </div>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "w-10",
        "h-5",
        "rounded-full",
        "relative",
        "transition-colors",
        "duration-300",
        "outline-none",
        "cursor-pointer",
        "shrink-0",
        checked ? "bg-emerald-500" : "bg-slate-200",
      )}
    >
      <motion.div
        animate={{ x: checked ? 24 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "absolute",
          "top-1",
          "w-3",
          "h-3",
          "bg-background",
          "rounded-full",
          "shadow-sm",
        )}
      />
    </button>
  </motion.div>
);
