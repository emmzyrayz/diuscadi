"use client";
// app/admin/settings/committees/page.tsx

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LuUsers, LuPlus, LuChevronLeft, LuLoader, LuPencil, LuPower } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { usePlatform } from "@/context/PlatformContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Portal";
import { SettingsCreateModal } from "@/components/sections/admin/modals/settingsCreateModal";

export default function CommitteesSettingsPage() {
  const router    = useRouter();
  const { token } = useAuth();
  const { committees, loadingLists, loadCommittees } = usePlatform();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { loadCommittees(); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      className="max-w-[1600px] w-full mt-20 p-5 mx-auto space-y-8"
    >
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/admin/settings")}
            className="p-3 rounded-2xl border border-border hover:border-foreground transition-all cursor-pointer">
            <LuChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center shadow-xl shadow-foreground/20">
            <LuUsers className="w-7 h-7 text-background" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">Committees</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {committees?.length ?? 0} committees
            </p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all shadow-xl cursor-pointer">
          <LuPlus className="w-5 h-5" /> Add Committee
        </button>
      </div>

      {loadingLists ? (
        <div className="flex items-center justify-center py-20"><LuLoader className="w-8 h-8 text-primary animate-spin" /></div>
      ) : (
        <div className="bg-background border-2 border-border rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {["Committee", "Description", "Members", "Actions"].map((h, i) => (
                    <th key={h} className={cn("px-6 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]", i === 3 && "text-right")}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(committees ?? []).map((c, index) => (
                  <motion.tr key={c.slug}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
                    className="group hover:bg-muted/50 transition-all"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-background")} style={{ backgroundColor: c.color }}>
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{c.name}</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{c.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-medium text-muted-foreground line-clamp-1 max-w-[200px]">{c.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-foreground">{c.memberCount}</span>
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
        <SettingsCreateModal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Committee"
          fields={[
            { key: "name",        label: "Name",        type: "text",     required: true },
            { key: "slug",        label: "Slug",        type: "text",     required: true, placeholder: "e.g. socials" },
            { key: "description", label: "Description", type: "textarea", required: true },
            { key: "color",       label: "Color (hex)", type: "text",     required: true, placeholder: "#6366f1" },
            { key: "icon",        label: "Icon name",   type: "text",     required: true, placeholder: "megaphone" },
          ]}
          onConfirm={async (data) => {
            if (!token) return;
            try {
              const res = await fetch("/api/platform/committees", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...data, memberCount: 0, displayOrder: 99 }),
              });
              if (!res.ok) throw new Error("Failed to create committee");
              toast.success("Committee created");
              setShowCreate(false);
              loadCommittees();
            } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
          }}
        />
      </Portal>
    </motion.div>
  );
}