"use client";
import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  LuMegaphone,
  LuLoader,
  LuPlus,
  LuPencil,
  LuTrash2,
  LuCheck,
  LuX,
  LuChevronLeft,
  LuEye,
  LuEyeOff,
} from "react-icons/lu";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import type {
  AnnouncementType,
  AnnouncementAudience,
} from "@/lib/models/Announcement";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Announcement {
  id: string;
  title: string;
  desc: string;
  type: AnnouncementType;
  audience: AnnouncementAudience;
  targetCommittee: string | null;
  published: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  createdAt: string;
}

const ANNOUNCEMENT_TYPES: AnnouncementType[] = [
  "Update",
  "New",
  "Alert",
  "Event",
  "Deadline",
  "Achievement",
  "Maintenance",
];

const AUDIENCE_OPTIONS: { value: AnnouncementAudience; label: string }[] = [
  { value: "global", label: "Everyone" },
  { value: "students", label: "Students only" },
  { value: "graduates", label: "Graduates only" },
  { value: "members", label: "Approved members only" },
  { value: "committee", label: "Specific committee" },
];

const EMPTY_FORM = {
  title: "",
  desc: "",
  type: "Update" as AnnouncementType,
  audience: "global" as AnnouncementAudience,
  targetCommittee: "",
  published: false,
  expiresAt: "",
  ctaLabel: "",
  ctaHref: "",
};

// ── Auth helpers ──────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("diuscadi_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnnouncementsSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Role guard
  useEffect(() => {
    if (user && !["admin", "webmaster"].includes(user.role)) {
      router.push("/admin");
    }
  }, [user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings/announcements", {
        headers: authHeaders(),
      });
      const data = await res.json();
      setAnnouncements(data.announcements ?? []);
    } catch {
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Form helpers ───────────────────────────────────────────────────────────

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(a: Announcement) {
    setForm({
      title: a.title,
      desc: a.desc,
      type: a.type,
      audience: a.audience,
      targetCommittee: a.targetCommittee ?? "",
      published: a.published,
      expiresAt: a.expiresAt
        ? new Date(a.expiresAt).toISOString().slice(0, 16)
        : "",
      ctaLabel: a.ctaLabel ?? "",
      ctaHref: a.ctaHref ?? "",
    });
    setEditingId(a.id);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.desc.trim()) {
      toast.error("Title and description are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        targetCommittee:
          form.audience === "committee" ? form.targetCommittee : null,
        expiresAt: form.expiresAt || null,
        ctaLabel: form.ctaLabel || null,
        ctaHref: form.ctaHref || null,
      };

      const url = editingId
        ? `/api/admin/settings/announcements/${editingId}`
        : "/api/admin/settings/announcements";

      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      toast.success(
        editingId ? "Announcement updated" : "Announcement created",
      );
      cancelForm();
      load();
    } catch {
      toast.error("Failed to save announcement");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(a: Announcement) {
    try {
      const res = await fetch(`/api/admin/settings/announcements/${a.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ published: !a.published }),
      });
      if (!res.ok) throw new Error();
      setAnnouncements((prev) =>
        prev.map((x) =>
          x.id === a.id ? { ...x, published: !a.published } : x,
        ),
      );
      toast.success(a.published ? "Unpublished" : "Published");
    } catch {
      toast.error("Failed to update");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/settings/announcements/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] mt-20">
        <LuLoader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto mt-20 p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/settings")}
          className="p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
        >
          <LuChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LuMegaphone className="w-6 h-6 text-primary" />
            Announcements
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Publish platform announcements to users. Target by education status,
            membership, or committee.
          </p>
        </div>
        <button
          onClick={openCreate}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground",
            "rounded-xl font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer",
          )}
        >
          <LuPlus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-background border-2 border-primary/20 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-lg">
            {editingId ? "Edit Announcement" : "New Announcement"}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Announcement title…"
                className="w-full mt-1 rounded-xl border px-3 py-2 text-sm bg-background focus:border-primary outline-none transition-colors"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                Description *
              </label>
              <textarea
                rows={3}
                value={form.desc}
                onChange={(e) =>
                  setForm((f) => ({ ...f, desc: e.target.value }))
                }
                placeholder="Announcement body text…"
                className="w-full mt-1 rounded-xl border px-3 py-2 text-sm bg-background focus:border-primary outline-none transition-colors resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as AnnouncementType,
                  }))
                }
                className="w-full mt-1 rounded-xl border px-3 py-2 text-sm bg-background focus:border-primary outline-none"
              >
                {ANNOUNCEMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                Audience
              </label>
              <select
                value={form.audience}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    audience: e.target.value as AnnouncementAudience,
                  }))
                }
                className="w-full mt-1 rounded-xl border px-3 py-2 text-sm bg-background focus:border-primary outline-none"
              >
                {AUDIENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {form.audience === "committee" && (
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                  Committee Slug
                </label>
                <input
                  type="text"
                  value={form.targetCommittee}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, targetCommittee: e.target.value }))
                  }
                  placeholder="e.g. media, socials, logistics"
                  className="w-full mt-1 rounded-xl border px-3 py-2 text-sm bg-background focus:border-primary outline-none"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                Expires At (optional)
              </label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiresAt: e.target.value }))
                }
                className="w-full mt-1 rounded-xl border px-3 py-2 text-sm bg-background focus:border-primary outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-5">
              <label className="text-sm font-bold text-foreground">
                Publish immediately
              </label>
              <button
                onClick={() =>
                  setForm((f) => ({ ...f, published: !f.published }))
                }
                className={cn(
                  "relative w-10 h-5 rounded-full transition-colors cursor-pointer",
                  form.published
                    ? "bg-primary"
                    : "bg-muted border border-border",
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 w-4 h-4 bg-background rounded-full shadow-sm transition-all",
                    form.published ? "left-5" : "left-0.5",
                  )}
                />
              </button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                CTA Button Label (optional)
              </label>
              <input
                type="text"
                value={form.ctaLabel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ctaLabel: e.target.value }))
                }
                placeholder="e.g. Register Now"
                className="w-full mt-1 rounded-xl border px-3 py-2 text-sm bg-background focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                CTA Link (optional)
              </label>
              <input
                type="text"
                value={form.ctaHref}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ctaHref: e.target.value }))
                }
                placeholder="e.g. /events/lascadss-7"
                className="w-full mt-1 rounded-xl border px-3 py-2 text-sm bg-background focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <button
              onClick={cancelForm}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <LuX className="w-4 h-4" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground",
                "rounded-xl text-sm font-bold hover:opacity-90 transition-opacity",
                "disabled:opacity-60 cursor-pointer",
              )}
            >
              {saving ? (
                <LuLoader className="w-4 h-4 animate-spin" />
              ) : (
                <LuCheck className="w-4 h-4" />
              )}
              {saving ? "Saving…" : editingId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {announcements.length === 0 ? (
        <div
          className={cn(
            "flex flex-col items-center justify-center py-20",
            "border border-dashed border-border rounded-2xl text-center gap-3",
          )}
        >
          <LuMegaphone className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-bold text-muted-foreground">
            No announcements yet
          </p>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold cursor-pointer"
          >
            Create your first
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={cn(
                "flex items-start gap-4 p-5 bg-background border-2 rounded-2xl transition-all",
                a.published
                  ? "border-border"
                  : "border-dashed border-border opacity-70",
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-0.5",
                      "rounded-full bg-primary/10 text-primary",
                    )}
                  >
                    {a.type}
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-full">
                    {AUDIENCE_OPTIONS.find((o) => o.value === a.audience)
                      ?.label ?? a.audience}
                    {a.targetCommittee && ` · ${a.targetCommittee}`}
                  </span>
                  {!a.published && (
                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
                      Draft
                    </span>
                  )}
                  {a.expiresAt && new Date(a.expiresAt) < new Date() && (
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">
                      Expired
                    </span>
                  )}
                </div>
                <p className="font-bold text-foreground text-sm truncate">
                  {a.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {a.desc}
                </p>
                <p className="text-[9px] text-muted-foreground mt-1 font-bold uppercase tracking-widest">
                  Created{" "}
                  {new Date(a.createdAt).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {a.expiresAt && (
                    <>
                      {" "}
                      · Expires{" "}
                      {new Date(a.expiresAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => togglePublished(a)}
                  title={a.published ? "Unpublish" : "Publish"}
                  className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  {a.published ? (
                    <LuEyeOff className="w-4 h-4" />
                  ) : (
                    <LuEye className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => openEdit(a)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <LuPencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer text-muted-foreground hover:text-red-600"
                >
                  <LuTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
