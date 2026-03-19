"use client";
import React, { useState } from "react";
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

// ── Props ──────────────────────────────────────────────────────────────────────

interface ProfileInfoSectionProps {
  profile:    UserProfile;
  // fullName is now a structured object — not a plain string
  onSaveName: (name: { firstname: string; secondname?: string; lastname: string }) => Promise<void>;
  onSaveBio:  (bio: string) => Promise<void>;
}

// ── Section ────────────────────────────────────────────────────────────────────

export const ProfileInfoSection = ({
  profile,
  onSaveName,
  onSaveBio,
}: ProfileInfoSectionProps) => {
  const { user }        = useAuth();
  const isEmailVerified = user?.isEmailVerified ?? false;

  const phone = profile.phone
    ? `+${profile.phone.countryCode} ${profile.phone.phoneNumber}`
    : undefined;

  const location = profile.location
    ? [profile.location.city, profile.location.state, profile.location.country]
        .filter(Boolean)
        .join(", ")
    : undefined;

  // Build display string from structured fullName
  const fullNameDisplay = [
    profile.fullName.firstname,
    profile.fullName.secondname,
    profile.fullName.lastname,
  ]
    .filter(Boolean)
    .join(" ");

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

        {/* Full name — structured editable field */}
        <NameField
          fullName={profile.fullName}
          displayValue={fullNameDisplay}
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

        {/* Phone — read-only */}
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
  icon:        React.ElementType;
  label:       string;
  value:       string;
  isVerified?: boolean;
  delay?:      number;
  className?:  string;
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
            transition={{ delay: delay + 0.2, type: "spring", stiffness: 300, damping: 15 }}
          >
            <LuCircleCheck className="w-3.5 h-3.5 text-emerald-500" title="Verified" />
          </motion.div>
        )}
      </div>
    </div>
  </motion.div>
);

// ── Name field — handles structured fullName object ────────────────────────────
// Separate from EditableInfoField so the generic field stays string-only.

interface NameFieldProps {
  fullName:     { firstname: string; secondname?: string; lastname: string };
  displayValue: string;
  onSave:       (name: { firstname: string; secondname?: string; lastname: string }) => Promise<void>;
  delay?:       number;
}

const NameField = ({ fullName, displayValue, onSave, delay = 0 }: NameFieldProps) => {
  const [editing,   setEditing]   = useState(false);
  const [firstname,  setFirstname]  = useState(fullName.firstname);
  const [secondname, setSecondname] = useState(fullName.secondname ?? "");
  const [lastname,   setLastname]   = useState(fullName.lastname);
  const [saving,    setSaving]    = useState(false);

  // No sync effect needed — parent passes key={profile.updatedAt} which
  // remounts this component after a save, reinitialising state from props.

  const handleSave = async () => {
    if (!firstname.trim() || !lastname.trim()) return;
    setSaving(true);
    await onSave({
      firstname:  firstname.trim(),
      secondname: secondname.trim() || undefined,
      lastname:   lastname.trim(),
    });
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setFirstname(fullName.firstname);
    setSecondname(fullName.secondname ?? "");
    setLastname(fullName.lastname);
    setEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-start gap-4 group/field"
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
        <LuUser className="w-5 h-5 text-muted-foreground group-hover/field:text-primary transition-colors" />
      </motion.div>

      <div className="space-y-1 flex-1 min-w-0">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">
          Legal Full Name
        </p>

        {editing ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                placeholder="First name"
                className={cn(
                  "bg-muted/60 border border-border rounded-xl px-3 py-2",
                  "text-sm text-foreground outline-none focus:border-primary transition-colors",
                )}
              />
              <input
                type="text"
                value={secondname}
                onChange={(e) => setSecondname(e.target.value)}
                placeholder="Middle name (optional)"
                className={cn(
                  "bg-muted/60 border border-border rounded-xl px-3 py-2",
                  "text-sm text-foreground outline-none focus:border-primary transition-colors",
                )}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                placeholder="Last name"
                className={cn(
                  "flex-1 bg-muted/60 border border-border rounded-xl px-3 py-2",
                  "text-sm text-foreground outline-none focus:border-primary transition-colors",
                )}
              />
              <button
                onClick={handleSave}
                disabled={saving || !firstname.trim() || !lastname.trim()}
                className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
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
          </div>
        ) : (
          <div className="group flex items-start gap-2">
            <p className="text-sm font-bold text-foreground flex-1">
              {displayValue || (
                <span className="text-muted-foreground italic">Not set</span>
              )}
            </p>
            <button
              onClick={() => setEditing(true)}
              className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md bg-muted flex items-center justify-center transition-opacity cursor-pointer shrink-0"
              aria-label="Edit full name"
            >
              <LuPencilLine className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── Generic editable field (string values only) ────────────────────────────────

interface EditableInfoFieldProps extends InfoFieldProps {
  onSave:       (value: string) => Promise<void>;
  placeholder?: string;
  multiline?:   boolean;
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
  const [draft,   setDraft]   = useState(value);
  const [saving,  setSaving]  = useState(false);

  // No sync effect needed — parent passes key={profile.updatedAt} to remount on reload.

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft.trim());
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => { setDraft(value); setEditing(false); };

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