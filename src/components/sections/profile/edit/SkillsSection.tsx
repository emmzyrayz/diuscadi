"use client";
// components/sections/profile/edit/SkillsSection.tsx
// Lets users select skills from the admin-seeded list, remove skills,
// and suggest new ones for admin review.
// Save is intentionally explicit (a button) — not auto-save on every change —
// because users may add several skills before committing.

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LuTags,
  LuSearch,
  LuPlus,
  LuX,
  LuLoader,
  LuSparkles,
  LuCircleCheck,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import { toast } from "react-hot-toast";
import type { Skill } from "@/types/domain";

interface SkillOption {
  slug: string;
  name: string;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("diuscadi_token");
}

export const SkillsSection = () => {
  const { profile, updateSkills } = useUser();

  // Local copy of selected slugs — syncs from profile on mount and after save
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(
    profile?.skills ?? [],
  );

  // Keep in sync if profile refreshes from another save action
  useEffect(() => {
    setSelectedSlugs(profile?.skills ?? []);
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.skills?.join(",")]);

  const [availableSkills, setAvailableSkills] = useState<SkillOption[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Custom skill suggestion
  const [customSkill, setCustomSkill] = useState("");
  const [submittingCustom, setSubmittingCustom] = useState(false);

  // Fetch the platform skill list once on mount
  useEffect(() => {
    setLoadingSkills(true);
    fetch("/api/platform/skills")
      .then((r) => r.json())
      .then((d) => setAvailableSkills(d.skills ?? []))
      .catch(() => {})
      .finally(() => setLoadingSkills(false));
  }, []);

  // Skills matching search that haven't been selected yet
  const addableSkills = useMemo(() => {
    const q = search.toLowerCase().trim();
    return availableSkills.filter(
      (s) =>
        !selectedSlugs.includes(s.slug) &&
        (!q || s.name.toLowerCase().includes(q) || s.slug.includes(q)),
    );
  }, [availableSkills, selectedSlugs, search]);

  const getSkillName = (slug: string) =>
    availableSkills.find((s) => s.slug === slug)?.name ?? slug;

  const addSkill = (slug: string) => {
    if (selectedSlugs.includes(slug)) return;
    setSelectedSlugs((prev) => [...prev, slug]);
    setSearch("");
    setDirty(true);
  };

  const removeSkill = (slug: string) => {
    setSelectedSlugs((prev) => prev.filter((s) => s !== slug));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!dirty) return;
    setSaving(true);
    const result = await updateSkills(selectedSlugs as Skill[]);
    setSaving(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to save skills");
      return;
    }
    toast.success("Skills saved");
    setDirty(false);
  };

  const handleSuggestSkill = async () => {
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    setSubmittingCustom(true);
    try {
      const res = await fetch("/api/users/skill-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      toast.success("Suggestion submitted — pending admin review");
      setCustomSkill("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmittingCustom(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ borderColor: "rgba(251, 146, 60, 0.2)" }}
      className={cn(
        "bg-background",
        "border-2",
        "border-border",
        "rounded-[2.5rem]",
        "p-8",
        "md:p-10",
        "shadow-sm",
        "transition-all",
      )}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className={cn("flex", "items-center", "gap-3", "mb-10")}
      >
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
          <LuTags className={cn("w-5", "h-5")} />
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
            Skills & Expertise
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
            Add skills to your DIUSCADI profile
          </p>
        </div>
      </motion.div>

      {/* ── Selected skills ───────────────────────────────────────────── */}
      <div className="mb-8">
        <p
          className={cn(
            "text-[10px]",
            "font-black",
            "text-muted-foreground",
            "uppercase",
            "tracking-widest",
            "ml-1",
            "mb-3",
          )}
        >
          Your skills{selectedSlugs.length > 0 && ` (${selectedSlugs.length})`}
        </p>

        {selectedSlugs.length === 0 ? (
          <p
            className={cn(
              "text-xs",
              "font-bold",
              "text-muted-foreground",
              "py-2",
              "ml-1",
            )}
          >
            No skills added yet — search below to add some.
          </p>
        ) : (
          <div className={cn("flex", "flex-wrap", "gap-2")}>
            {selectedSlugs.map((slug, i) => (
              <motion.div
                key={slug}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className={cn(
                  "flex",
                  "items-center",
                  "gap-2",
                  "px-4",
                  "py-2",
                  "bg-primary/10",
                  "border-2",
                  "border-primary/20",
                  "rounded-xl",
                )}
              >
                <LuCircleCheck
                  className={cn("w-3", "h-3", "text-primary", "shrink-0")}
                />
                <span
                  className={cn(
                    "text-[10px]",
                    "font-black",
                    "text-primary",
                    "uppercase",
                    "tracking-widest",
                  )}
                >
                  {getSkillName(slug)}
                </span>
                <button
                  onClick={() => removeSkill(slug)}
                  className={cn(
                    "text-primary/60",
                    "hover:text-rose-500",
                    "transition-colors",
                    "ml-1",
                  )}
                  title={`Remove ${getSkillName(slug)}`}
                >
                  <LuX className={cn("w-3", "h-3")} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Search + add from list ────────────────────────────────────── */}
      <div className={cn("mb-8", "space-y-3")}>
        <p
          className={cn(
            "text-[10px]",
            "font-black",
            "text-muted-foreground",
            "uppercase",
            "tracking-widest",
            "ml-1",
          )}
        >
          Add from list
        </p>
        <div className="relative">
          <LuSearch
            className={cn(
              "absolute",
              "left-5",
              "top-1/2",
              "-translate-y-1/2",
              "text-muted-foreground",
              "w-4",
              "h-4",
              "pointer-events-none",
            )}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search available skills…"
            className={cn(
              "w-full",
              "bg-muted",
              "border-2",
              "border-border",
              "rounded-2xl",
              "pl-12",
              "pr-6",
              "py-4",
              "text-sm",
              "font-bold",
              "outline-none",
              "focus:border-primary/40",
              "focus:bg-background",
              "transition-all",
            )}
          />
        </div>

        {loadingSkills ? (
          <div
            className={cn(
              "flex",
              "items-center",
              "gap-2",
              "text-xs",
              "font-bold",
              "text-muted-foreground",
              "py-3",
            )}
          >
            <LuLoader className={cn("w-4", "h-4", "animate-spin")} />
            Loading skills…
          </div>
        ) : addableSkills.length > 0 ? (
          <div
            className={cn(
              "flex",
              "flex-wrap",
              "gap-2",
              "max-h-44",
              "overflow-y-auto",
              "py-1",
            )}
          >
            {addableSkills.map((skill) => (
              <button
                key={skill.slug}
                onClick={() => addSkill(skill.slug)}
                className={cn(
                  "flex",
                  "items-center",
                  "gap-1.5",
                  "px-4",
                  "py-2",
                  "bg-muted",
                  "border-2",
                  "border-border",
                  "rounded-xl",
                  "hover:border-primary/40",
                  "hover:bg-primary/5",
                  "transition-all",
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "text-foreground",
                  "cursor-pointer",
                )}
              >
                <LuPlus className={cn("w-3", "h-3")} />
                {skill.name}
              </button>
            ))}
          </div>
        ) : !loadingSkills && availableSkills.length > 0 ? (
          <p
            className={cn(
              "text-xs",
              "font-bold",
              "text-muted-foreground",
              "py-2",
              "ml-1",
            )}
          >
            {search.trim()
              ? "No matching skills — suggest yours below."
              : "All available skills are already on your profile."}
          </p>
        ) : null}
      </div>

      {/* ── Suggest a custom skill ────────────────────────────────────── */}
      <div className={cn("border-t", "border-border", "pt-8", "space-y-3")}>
        <p
          className={cn(
            "text-[10px]",
            "font-black",
            "text-muted-foreground",
            "uppercase",
            "tracking-widest",
            "ml-1",
          )}
        >
          Suggest a new skill
        </p>
        <p
          className={cn(
            "text-[10px]",
            "font-bold",
            "text-muted-foreground",
            "ml-1",
          )}
        >
          Can&apos;t find your skill above? Submit it for admin review — once
          approved it&apos;ll be added to the list.
        </p>
        <div className={cn("flex", "gap-3")}>
          <div className={cn("relative", "flex-1")}>
            <LuSparkles
              className={cn(
                "absolute",
                "left-5",
                "top-1/2",
                "-translate-y-1/2",
                "text-muted-foreground",
                "w-4",
                "h-4",
                "pointer-events-none",
              )}
            />
            <input
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSuggestSkill()}
              placeholder="e.g. Motion Design, Robotics…"
              className={cn(
                "w-full",
                "bg-muted",
                "border-2",
                "border-border",
                "rounded-2xl",
                "pl-12",
                "pr-6",
                "py-4",
                "text-sm",
                "font-bold",
                "outline-none",
                "focus:border-primary/40",
                "focus:bg-background",
                "transition-all",
              )}
            />
          </div>
          <button
            onClick={handleSuggestSkill}
            disabled={!customSkill.trim() || submittingCustom}
            className={cn(
              "px-6",
              "py-4",
              "border-2",
              "border-border",
              "rounded-2xl",
              "text-[10px]",
              "font-black",
              "uppercase",
              "tracking-widest",
              "hover:border-foreground",
              "transition-all",
              "disabled:opacity-50",
              "cursor-pointer",
              "disabled:cursor-not-allowed",
              "shrink-0",
            )}
          >
            {submittingCustom ? (
              <LuLoader className={cn("w-4", "h-4", "animate-spin")} />
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>

      {/* ── Save button ───────────────────────────────────────────────── */}
      {dirty && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("mt-8", "flex", "justify-end")}
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "px-8",
              "py-3",
              "bg-foreground",
              "text-background",
              "rounded-2xl",
              "text-[10px]",
              "font-black",
              "uppercase",
              "tracking-widest",
              "hover:bg-primary",
              "hover:text-foreground",
              "transition-all",
              "disabled:opacity-60",
              "cursor-pointer",
            )}
          >
            {saving ? "Saving…" : "Save Skills"}
          </button>
        </motion.div>
      )}
    </motion.section>
  );
};
