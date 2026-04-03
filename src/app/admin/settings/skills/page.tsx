"use client";
// app/admin/settings/skills/page.tsx

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LuCode,
  LuPlus,
  LuChevronLeft,
  LuLoader,
  LuPencil,
} from "react-icons/lu";
import { useRouter } from "next/navigation";
import { usePlatform } from "@/context/PlatformContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Portal";
import { SettingsCreateModal } from "@/components/sections/admin/modals/settingsCreateModal";

const SKILL_CATEGORIES = [
  "Creative",
  "Technical",
  "Business",
  "Communication",
  "Other",
];

export default function SkillsSettingsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { skills, loadingLists, loadSkills } = usePlatform();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  // Group by category for display
  const grouped = (skills ?? []).reduce<Record<string, typeof skills>>(
    (acc, s) => {
      if (!s) return acc;
      const cat = s.category ?? "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat]!.push(s);
      return acc;
    },
    {},
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-[1600px] w-full mt-10 md:mt-20 p-5 mx-auto space-y-8"
    >
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/settings")}
            className="p-3 rounded-2xl border border-border hover:border-foreground transition-all cursor-pointer"
          >
            <LuChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center shadow-xl shadow-foreground/20">
            <LuCode className="w-7 h-7 text-background" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">
              Skills
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {skills?.length ?? 0} skills in catalogue
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all shadow-xl cursor-pointer"
        >
          <LuPlus className="w-5 h-5" /> Add Skill
        </button>
      </div>

      {loadingLists ? (
        <div className="flex items-center justify-center py-20">
          <LuLoader className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, catSkills]) => (
            <div
              key={category}
              className="bg-background border-2 border-border rounded-[2.5rem] p-6"
            >
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
                {category}
              </p>
              <div className="flex flex-wrap gap-2">
                {(catSkills ?? []).map(
                  (s) =>
                    s && (
                      <span
                        key={s.slug}
                        className="px-3 py-1.5 bg-muted border border-border rounded-xl text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-2"
                      >
                        {s.name}
                        <button className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                          <LuPencil className="w-3 h-3" />
                        </button>
                      </span>
                    ),
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Portal>
        <SettingsCreateModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          title="Add Skill"
          fields={[
            { key: "name", label: "Name", type: "text", required: true },
            {
              key: "slug",
              label: "Slug",
              type: "text",
              required: true,
              placeholder: "e.g. photography",
            },
            {
              key: "category",
              label: "Category",
              type: "select",
              options: SKILL_CATEGORIES,
              required: true,
            },
          ]}
          onConfirm={async (data) => {
            if (!token) return;
            try {
              const res = await fetch("/api/platform/skills", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ...data, displayOrder: 99 }),
              });
              if (!res.ok) throw new Error("Failed to create skill");
              toast.success("Skill created");
              setShowCreate(false);
              loadSkills();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed");
            }
          }}
        />
      </Portal>
    </motion.div>
  );
}
