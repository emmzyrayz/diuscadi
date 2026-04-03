"use client";
// app/admin/settings/departments/page.tsx

import React, { useState } from "react";
import { motion } from "framer-motion";
import { LuBookOpen, LuPlus, LuChevronLeft, LuPencil } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { usePlatform } from "@/context/PlatformContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Portal";
import { SettingsCreateModal } from "@/components/sections/admin/modals/settingsCreateModal";
import { SettingsEditModal } from "@/components/sections/admin/modals/settingsEditModal";

export default function DepartmentsSettingsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const platform = usePlatform();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(
    null,
  );

  const items = Object.values(platform.departmentMap).flat();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-[1600px] w-full md:mt-20 mt-10 p-5 mx-auto space-y-8"
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
            <LuBookOpen className="w-7 h-7 text-background" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">
              Departments
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {items.length} departments
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all shadow-xl cursor-pointer"
        >
          <LuPlus className="w-5 h-5" /> Add Department
        </button>
      </div>

      <div className="bg-background border-2 border-border rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[400px]">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {["Name", "Status", "Actions"].map((h, i) => (
                  <th
                    key={h}
                    className={cn(
                      "px-6 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]",
                      i === 2 && "text-right",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "group hover:bg-muted/50 transition-all",
                    !item.isActive && "opacity-50",
                  )}
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
                      {item.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        item.isActive
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-muted text-muted-foreground border-border",
                      )}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setEditing(item)}
                      className="p-2 hover:bg-background border border-transparent hover:border-border rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    >
                      <LuPencil className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Portal>
        <SettingsCreateModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          title="Add Department"
          fields={[
            { key: "name", label: "Name", type: "text", required: true },
          ]}
          onConfirm={async (data) => {
            if (!token) return;
            try {
              await platform.createDepartment(data.name as string, token);
              toast.success("Department created");
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
            title="Edit Department"
            fields={[
              {
                key: "name",
                label: "Name",
                type: "text",
                required: true,
                defaultValue: editing.name,
              },
            ]}
            onConfirm={async (data) => {
              if (!token) return;
              try {
                await platform.updateDepartment(
                  editing.id,
                  data as never,
                  token,
                );
                toast.success("Department updated");
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
