"use client";
// app/admin/settings/roles/page.tsx

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LuShield,
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

export default function RolesSettingsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { committeeRoles, loadingLists, loadCommitteeRoles } = usePlatform();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadCommitteeRoles();
  }, []);

  const sorted = [...(committeeRoles ?? [])].sort((a, b) => b.rank - a.rank);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-[1600px] w-full mt-20 p-5 mx-auto space-y-8"
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
            <LuShield className="w-7 h-7 text-background" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">
              Committee Roles
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {sorted.length} roles — ordered by rank
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all shadow-xl cursor-pointer"
        >
          <LuPlus className="w-5 h-5" /> Add Role
        </button>
      </div>

      {loadingLists ? (
        <div className="flex items-center justify-center py-20">
          <LuLoader className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="bg-background border-2 border-border rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {["Role", "Slug", "Rank", "Description", "Actions"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-6 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]",
                          i === 4 && "text-right",
                        )}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sorted.map((r, index) => (
                  <motion.tr
                    key={r.slug}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group hover:bg-muted/50 transition-all"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
                        {r.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground">
                        {r.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                        <span className="text-[11px] font-black text-foreground">
                          {r.rank}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-medium text-muted-foreground line-clamp-1 max-w-[200px]">
                        {r.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-background border border-transparent hover:border-border rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer">
                        <LuPencil className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Portal>
        <SettingsCreateModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          title="Add Committee Role"
          fields={[
            { key: "name", label: "Name", type: "text", required: true },
            {
              key: "slug",
              label: "Slug",
              type: "text",
              required: true,
              placeholder: "e.g. COORDINATOR",
            },
            { key: "rank", label: "Rank", type: "number", required: true },
            { key: "description", label: "Description", type: "textarea" },
          ]}
          onConfirm={async (data) => {
            if (!token) return;
            try {
              const res = await fetch("/api/platform/committee-roles", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
              });
              if (!res.ok) throw new Error("Failed to create role");
              toast.success("Role created");
              setShowCreate(false);
              loadCommitteeRoles();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed");
            }
          }}
        />
      </Portal>
    </motion.div>
  );
}
