"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LuUser,
  LuMail,
  LuPhone,
  LuMapPin,
  LuPencilLine,
  LuCircleCheck,
  LuCheck,
  LuX,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/context/UserContext";
import { useAuth } from "@/context/AuthContext";

interface ProfileInfoSectionProps {
  profile: UserProfile;
  onSaveName: (name: string) => Promise<void>;
  onSaveBio: (bio: string) => Promise<void>;
}

export const ProfileInfoSection = ({
  profile,
  onSaveName,
  onSaveBio,
}: ProfileInfoSectionProps) => {
  const { user } = useAuth();
  const isEmailVerified = user?.isEmailVerified ?? false;

  const phone = profile.phone
    ? `+${profile.phone.countryCode} ${profile.phone.phoneNumber}`
    : undefined;

  const location = profile.location
    ? [profile.location.city, profile.location.state, profile.location.country]
        .filter(Boolean)
        .join(", ")
    : undefined;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group"
    >
      {/* Decorative corner */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={cn(
          "absolute top-0 right-0 w-32 h-32 bg-muted rounded-bl-[5rem]",
          "-mr-10 -mt-10 transition-transform group-hover:-translate-x-2 group-hover:translate-y-2 duration-500",
        )}
      />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
            <LuUser className="w-3.5 h-3.5" />
            Identity
          </div>
          <h3 className="text-2xl font-black text-foreground tracking-tight">
            Personal Information
          </h3>
        </motion.div>
      </div>

      {/* Fields grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
        {/* Full name — editable */}
        <EditableInfoField
          icon={LuUser}
          label="Legal Full Name"
          value={profile.fullName}
          isVerified={isEmailVerified}
          onSave={onSaveName}
          delay={0.4}
        />

        {/* Email — read-only */}
        <InfoField
          icon={LuMail}
          label="Primary Email"
          value={profile.email}
          isVerified={isEmailVerified}
          delay={0.5}
        />

        {/* Phone — read-only (set at signup) */}
        <InfoField
          icon={LuPhone}
          label="Contact Number"
          value={phone ?? "Not set"}
          delay={0.6}
        />

        {/* Location — read-only */}
        <InfoField
          icon={LuMapPin}
          label="Current Location"
          value={location ?? "Not set"}
          delay={0.7}
        />

        {/* Bio — full width, editable */}
        <EditableInfoField
          icon={LuPencilLine}
          label="Biography"
          value={profile.profile?.bio ?? ""}
          placeholder="Tell us about yourself…"
          multiline
          onSave={onSaveBio}
          delay={0.8}
          className="md:col-span-2"
        />
      </div>
    </motion.section>
  );
};

// ── Read-only field ────────────────────────────────────────────────────────────

interface InfoFieldProps {
  icon: React.ElementType;
  label: string;
  value: string;
  isVerified?: boolean;
  delay?: number;
  className?: string;
}

const InfoField = ({
  icon: Icon,
  label,
  value,
  isVerified,
  delay = 0,
  className,
}: InfoFieldProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ x: 4 }}
    className={cn("flex items-start gap-4 group/field", className)}
  >
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "w-12 h-12 rounded-2xl bg-muted border border-border",
        "flex items-center justify-center shrink-0",
        "group-hover/field:border-primary/30 transition-colors",
      )}
    >
      <Icon className="w-5 h-5 text-muted-foreground group-hover/field:text-primary transition-colors" />
    </motion.div>
    <div className="space-y-1 flex-1">
      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <p className="text-sm font-bold text-foreground">{value}</p>
        {isVerified && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: delay + 0.2,
              type: "spring",
              stiffness: 300,
              damping: 15,
            }}
          >
            <LuCircleCheck
              className="w-3.5 h-3.5 text-emerald-500"
              title="Verified"
            />
          </motion.div>
        )}
      </div>
    </div>
  </motion.div>
);

// ── Editable field ─────────────────────────────────────────────────────────────

interface EditableInfoFieldProps extends InfoFieldProps {
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
}

const EditableInfoField = ({
  icon: Icon,
  label,
  value,
  onSave,
  placeholder,
  multiline = false,
  delay = 0,
  className,
}: EditableInfoFieldProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  // Keep draft in sync when profile reloads
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft.trim());
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn("flex items-start gap-4 group/field", className)}
    >
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "w-12 h-12 rounded-2xl bg-muted border border-border",
          "flex items-center justify-center shrink-0",
          "group-hover/field:border-primary/30 transition-colors",
        )}
      >
        <Icon className="w-5 h-5 text-muted-foreground group-hover/field:text-primary transition-colors" />
      </motion.div>

      <div className="space-y-1 flex-1 min-w-0">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">
          {label}
        </p>

        {editing ? (
          <div className="flex items-start gap-2">
            {multiline ? (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                placeholder={placeholder}
                className={cn(
                  "flex-1 bg-muted/60 border border-border rounded-xl px-3 py-2",
                  "text-sm text-foreground resize-none outline-none focus:border-primary transition-colors",
                )}
              />
            ) : (
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={placeholder}
                className={cn(
                  "flex-1 bg-muted/60 border border-border rounded-xl px-3 py-2",
                  "text-sm text-foreground outline-none focus:border-primary transition-colors",
                )}
              />
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
            >
              <LuCheck className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCancel}
              className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-border transition-colors cursor-pointer"
            >
              <LuX className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="group flex items-start gap-2">
            <p className="text-sm font-bold text-foreground flex-1">
              {value || (
                <span className="text-muted-foreground italic">
                  {placeholder ?? "Not set"}
                </span>
              )}
            </p>
            <button
              onClick={() => setEditing(true)}
              className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md bg-muted flex items-center justify-center transition-opacity cursor-pointer shrink-0"
              aria-label={`Edit ${label}`}
            >
              <LuPencilLine className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
