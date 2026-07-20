"use client";
// app/admin/settings/committees/page.tsx
//
// Fetches from the ADMIN endpoint (/api/admin/platform?resource=committees),
// not the public one — so inactive committees are visible here and the
// status badge reflects real data instead of being hardcoded.

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LuUsers,
  LuPlus,
  LuChevronLeft,
  LuLoader,
  LuPencil,
  LuPower,
} from "react-icons/lu";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Portal";
import { SettingsCreateModal } from "@/components/sections/admin/modals/settingsCreateModal";
import { SettingsEditModal } from "@/components/sections/admin/modals/settingsEditModal";
import type { CommitteeItem } from "@/context/PlatformContext";

export default function CommitteesSettingsPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [committees, setCommittees] = useState<CommitteeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<CommitteeItem | null>(null);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);

  // ── Fetch full list (active + inactive) from the admin-only endpoint ──────
  const fetchCommittees = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/platform?resource=committees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load committees");
      setCommittees(data.committees ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load committees",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCommittees();
  }, [fetchCommittees]);

  // ── Deactivate / reactivate ────────────────────────────────────────────────
  const handleToggleStatus = async (c: CommitteeItem) => {
    if (!token) return;
    const activating = c.isActive === false;
    const confirmed = window.confirm(
      activating
        ? `Reactivate "${c.name}"? It will become visible again on the public showcase.`
        : `Deactivate "${c.name}"? It will be hidden from the public showcase and new applications. Existing members are not affected.`,
    );
    if (!confirmed) return;

    setTogglingSlug(c.slug);
    try {
      if (activating) {
        const res = await fetch("/api/admin/platform?resource=committees", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ slug: c.slug, isActive: true }),
        });
        if (!res.ok) throw new Error("Failed to reactivate");
        toast.success("Committee reactivated");
      } else {
        const res = await fetch("/api/admin/platform?resource=committees", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ slug: c.slug }),
        });
        if (!res.ok) throw new Error("Failed to deactivate");
        toast.success("Committee deactivated");
      }
      fetchCommittees();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setTogglingSlug(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-[1600px] w-full mt-20 p-5 mx-auto space-y-8"
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
            <LuUsers className="w-7 h-7 text-background" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">
              Committees
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {committees.length} committee{committees.length !== 1 ? "s" : ""}
              {" · "}
              {committees.filter((c) => c.isActive !== false).length} active
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all shadow-xl cursor-pointer"
        >
          <LuPlus className="w-5 h-5" /> Add Committee
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LuLoader className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="bg-background border-2 border-border rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {[
                    "Committee",
                    "Description",
                    "Members",
                    "Status",
                    "Actions",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={cn(
                        "px-6 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]",
                        i === 4 && "text-right",
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {committees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center text-xs font-bold text-muted-foreground"
                    >
                      No committees yet
                    </td>
                  </tr>
                ) : (
                  committees.map((c, index) => {
                    const isActive = c.isActive !== false;
                    return (
                      <motion.tr
                        key={c.slug}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={cn(
                          "group hover:bg-muted/50 transition-all",
                          !isActive && "opacity-60",
                        )}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-background shrink-0"
                              style={{ backgroundColor: c.color }}
                            >
                              {c.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
                                {c.name}
                              </p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                {c.slug}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-[240px]">
                          <p className="text-[11px] font-medium text-muted-foreground line-clamp-2">
                            {c.shortDesc || c.description}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-black text-foreground">
                            {c.memberCount}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                              isActive
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-muted text-muted-foreground border-border",
                            )}
                          >
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditing(c)}
                              className="p-2 hover:bg-background border border-transparent hover:border-border rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                              title="Edit"
                            >
                              <LuPencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(c)}
                              disabled={togglingSlug === c.slug}
                              className={cn(
                                "p-2 hover:bg-background border border-transparent hover:border-border rounded-lg transition-all cursor-pointer disabled:opacity-50",
                                isActive
                                  ? "text-muted-foreground hover:text-rose-600"
                                  : "text-muted-foreground hover:text-emerald-600",
                              )}
                              title={isActive ? "Deactivate" : "Reactivate"}
                            >
                              {togglingSlug === c.slug ? (
                                <LuLoader className="w-4 h-4 animate-spin" />
                              ) : (
                                <LuPower className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      <Portal>
        <SettingsCreateModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          title="Add Committee"
          fields={[
            { key: "name", label: "Name", type: "text", required: true },
            {
              key: "slug",
              label: "Slug",
              type: "text",
              required: true,
              placeholder: "e.g. socials",
            },
            {
              key: "shortDesc",
              label: "Short Description",
              type: "text",
              placeholder:
                "One-liner shown on the public showcase deck (~80 chars)",
            },
            {
              key: "description",
              label: "Full Description",
              type: "textarea",
              required: true,
            },
            {
              key: "color",
              label: "Color (hex)",
              type: "text",
              required: true,
              placeholder: "#6366f1",
            },
            {
              key: "icon",
              label: "Icon name",
              type: "text",
              required: true,
              placeholder: "megaphone",
            },
            {
              key: "whatsappLink",
              label: "WhatsApp Group Link",
              type: "text",
              placeholder:
                "https://chat.whatsapp.com/... (shown only to members)",
            },
            {
              key: "displayOrder",
              label: "Display Order",
              type: "number",
              defaultValue: 99,
              placeholder: "Lower = shown first",
            },
          ]}
          onConfirm={async (data) => {
            if (!token) return;
            try {
              const res = await fetch(
                "/api/admin/platform?resource=committees",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify(data),
                },
              );
              if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error ?? "Failed");
              }
              toast.success("Committee created");
              setShowCreate(false);
              fetchCommittees();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed");
            }
          }}
        />
      </Portal>

      {/* Edit modal */}
      <Portal>
        {editing && (
          <SettingsEditModal
            isOpen={!!editing}
            onClose={() => setEditing(null)}
            title="Edit Committee"
            fields={[
              {
                key: "name",
                label: "Name",
                type: "text",
                required: true,
                defaultValue: editing.name,
              },
              {
                key: "shortDesc",
                label: "Short Description",
                type: "text",
                defaultValue: editing.shortDesc ?? "",
                placeholder:
                  "One-liner shown on the public showcase deck (~80 chars)",
              },
              {
                key: "description",
                label: "Full Description",
                type: "textarea",
                required: true,
                defaultValue: editing.description,
              },
              {
                key: "color",
                label: "Color (hex)",
                type: "text",
                required: true,
                defaultValue: editing.color,
              },
              {
                key: "icon",
                label: "Icon name",
                type: "text",
                required: true,
                defaultValue: editing.icon,
              },
              {
                key: "whatsappLink",
                label: "WhatsApp Group Link",
                type: "text",
                defaultValue: editing.whatsappLink ?? "",
              },
              {
                key: "headName",
                label: "Head Name",
                type: "text",
                defaultValue: editing.headName ?? "",
              },
              {
                key: "displayOrder",
                label: "Display Order",
                type: "number",
                defaultValue: editing.displayOrder,
              },
            ]}
            onConfirm={async (data) => {
              if (!token) return;
              try {
                const res = await fetch(
                  "/api/admin/platform?resource=committees",
                  {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ slug: editing.slug, ...data }),
                  },
                );
                if (!res.ok) throw new Error("Failed to update");
                toast.success("Committee updated");
                setEditing(null);
                fetchCommittees();
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
