"use client";
// app/admin/settings/institutions/page.tsx

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LuBuilding2,
  LuPlus,
  LuChevronLeft,
  LuLoader,
  LuPencil,
  LuPower,
} from "react-icons/lu";
import { useRouter } from "next/navigation";
import { usePlatform } from "@/context/PlatformContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Portal";
import { SettingsCreateModal } from "@/components/sections/admin/modals/settingsCreateModal";
import { SettingsEditModal } from "@/components/sections/admin/modals/settingsEditModal";
import type { Institution } from "@/context/PlatformContext";

export default function InstitutionsSettingsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const {
    institutions,
    loadingInstitutions,
    loadInstitutions,
    createInstitution,
    updateInstitution,
  } = usePlatform();

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Institution | null>(null);

  useEffect(() => {
    loadInstitutions({ all: true });
  }, []);

  const handleToggle = async (inst: Institution) => {
    if (!token) return;
    try {
      await updateInstitution(inst.id, { isActive: !inst.isActive }, token);
      toast.success(
        `${inst.name} ${inst.isActive ? "deactivated" : "activated"}`,
      );
    } catch {
      toast.error("Failed to update institution");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-[1600px] w-full md:mt-20 mt-10 p-5 mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/settings")}
            className="p-3 rounded-2xl border border-border hover:border-foreground transition-all cursor-pointer"
          >
            <LuChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center shadow-xl shadow-foreground/20">
            <LuBuilding2 className="w-7 h-7 text-background" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">
              Institutions
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {institutions.length} institutions registered
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all shadow-xl cursor-pointer"
        >
          <LuPlus className="w-5 h-5" /> Add Institution
        </button>
      </div>

      {/* List */}
      {loadingInstitutions ? (
        <div className="flex items-center justify-center py-20">
          <LuLoader className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="bg-background border-2 border-border rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {["Name", "Type", "State", "Status", "Actions"].map(
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
                {institutions.map((inst, index) => (
                  <motion.tr
                    key={inst.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "group hover:bg-muted/50 transition-all",
                      !inst.isActive && "opacity-50",
                    )}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
                        {inst.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                          inst.type === "University"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-purple-50 text-purple-600",
                        )}
                      >
                        {inst.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {inst.state}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          inst.isActive
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-muted text-muted-foreground border-border",
                        )}
                      >
                        {inst.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditing(inst)}
                          className="p-2 hover:bg-background border border-transparent hover:border-border rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        >
                          <LuPencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggle(inst)}
                          className={cn(
                            "p-2 rounded-lg border transition-all cursor-pointer",
                            inst.isActive
                              ? "text-amber-600 hover:bg-amber-50 border-transparent hover:border-amber-100"
                              : "text-emerald-600 hover:bg-emerald-50 border-transparent hover:border-emerald-100",
                          )}
                        >
                          <LuPower className="w-4 h-4" />
                        </button>
                      </div>
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
          title="Add Institution"
          fields={[
            { key: "name", label: "Name", type: "text", required: true },
            {
              key: "type",
              label: "Type",
              type: "select",
              options: ["University", "Polytechnic"],
              required: true,
            },
            { key: "state", label: "State", type: "text", required: true },
            {
              key: "country",
              label: "Country",
              type: "text",
              required: true,
              defaultValue: "Nigeria",
            },
          ]}
          onConfirm={async (data) => {
            if (!token) return;
            try {
              await createInstitution(data as never, token);
              toast.success("Institution created");
              setShowCreate(false);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed");
            }
          }}
        />
      </Portal>

      <Portal>
        {editing && (
          <SettingsEditModal
            isOpen={!!editing}
            onClose={() => setEditing(null)}
            title="Edit Institution"
            fields={[
              {
                key: "name",
                label: "Name",
                type: "text",
                required: true,
                defaultValue: editing.name,
              },
              {
                key: "type",
                label: "Type",
                type: "select",
                options: ["University", "Polytechnic"],
                required: true,
                defaultValue: editing.type,
              },
              {
                key: "state",
                label: "State",
                type: "text",
                required: true,
                defaultValue: editing.state,
              },
            ]}
            onConfirm={async (data) => {
              if (!token) return;
              try {
                await updateInstitution(editing.id, data as never, token);
                toast.success("Institution updated");
                setEditing(null);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed");
              }
            }}
          />
        )}
      </Portal>
    </motion.div>
  );
}
