"use client";
import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  LuImages, LuLoader, LuChevronLeft, LuPlus, LuTrash2,
  LuEye, LuEyeOff, LuPencil, LuCheck, LuX, LuYoutube,
} from "react-icons/lu";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { BulkGalleryUploader, type BulkItem } from "@/components/ui/BulkGalleryUploader";
import type { GalleryCategory } from "@/lib/models/Gallery";
import { extractYoutubeId } from "@/lib/youtube";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GalleryItem {
  id: string;
  mediaType: "image" | "video";
  imageUrl: string | null;
  imagePublicId: string | null;
  youtubeId: string | null;
  youtubeUrl: string | null;
  category: GalleryCategory;
  caption: string | null;
  eventId: string | null;
  featured: boolean;
  published: boolean;
  order: number;
  createdAt: string;
}

const CATEGORIES: GalleryCategory[] = [
  "event", "meeting", "outing", "conference", "workshop", "celebration",
];

const CATEGORY_LABELS: Record<GalleryCategory, string> = {
  event: "Event", meeting: "Meeting", outing: "Outing",
  conference: "Conference", workshop: "Workshop", celebration: "Celebration",
};

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

type Tab = "upload" | "manage" | "video";

export default function GallerySettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("upload");
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<GalleryCategory | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");

  // Video form
  const [videoUrl, setVideoUrl] = useState("");
  const [videoCategory, setVideoCategory] = useState<GalleryCategory>("event");
  const [videoCaption, setVideoCaption] = useState("");
  const [videoPublished, setVideoPublished] = useState(true);
  const [savingVideo, setSavingVideo] = useState(false);

  useEffect(() => {
    if (user && !["admin", "webmaster"].includes(user.role)) {
      router.push("/admin");
    }
  }, [user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      const res = await fetch(`/api/admin/gallery?${params}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      toast.error("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    if (tab === "manage") load();
  }, [tab, load]);

  // ── Bulk submit handler ────────────────────────────────────────────────────
  // Images are already in MongoDB via confirm route — this is a no-op for images
  // but updates their published/featured flags via PATCH if needed.
  // The BulkGalleryUploader calls confirm which already saves to DB,
  // so here we just reload the manage tab and switch to it.
  const handleBulkSubmit = useCallback(async (doneItems: BulkItem[]) => {
    setSubmitting(true);
    try {
      // Items were already saved to MongoDB during the confirm step.
      // We use this opportunity to apply any pending featured/published overrides
      // that might differ from what was sent in the ownerId metadata.
      // For now — just confirm the count and switch tabs.
      toast.success(`${doneItems.length} photos saved to gallery`);
      setTab("manage");
    } catch {
      toast.error("Failed to finalize upload");
    } finally {
      setSubmitting(false);
    }
  }, []);

  // ── Toggle published ───────────────────────────────────────────────────────
  const togglePublished = useCallback(async (item: GalleryItem) => {
    try {
      await fetch(`/api/admin/gallery/${item.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ published: !item.published }),
      });
      setItems((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, published: !item.published } : i),
      );
    } catch {
      toast.error("Failed to update");
    }
  }, []);

  // ── Toggle featured ────────────────────────────────────────────────────────
  const toggleFeatured = useCallback(async (item: GalleryItem) => {
    try {
      await fetch(`/api/admin/gallery/${item.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ featured: !item.featured }),
      });
      setItems((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, featured: !item.featured } : i),
      );
    } catch {
      toast.error("Failed to update");
    }
  }, []);

  // ── Save caption edit ──────────────────────────────────────────────────────
  const saveCaption = useCallback(async (id: string) => {
    try {
      await fetch(`/api/admin/gallery/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ caption: editCaption }),
      });
      setItems((prev) =>
        prev.map((i) => i.id === id ? { ...i, caption: editCaption } : i),
      );
      setEditingId(null);
      toast.success("Caption updated");
    } catch {
      toast.error("Failed to update caption");
    }
  }, [editCaption]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    try {
      await fetch(`/api/admin/gallery/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }, []);

  // ── Add video ──────────────────────────────────────────────────────────────
  const handleAddVideo = useCallback(async () => {
    if (!videoUrl.trim()) { toast.error("Enter a YouTube URL"); return; }
    const youtubeId = extractYoutubeId(videoUrl);
    if (!youtubeId) { toast.error("Invalid YouTube URL"); return; }

    setSavingVideo(true);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          youtubeUrl: videoUrl,
          youtubeId,
          category: videoCategory,
          caption: videoCaption || null,
          published: videoPublished,
          featured: false,
          order: 0,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Video added");
      setVideoUrl("");
      setVideoCaption("");
      setTab("manage");
    } catch {
      toast.error("Failed to add video");
    } finally {
      setSavingVideo(false);
    }
  }, [videoUrl, videoCategory, videoCaption, videoPublished]);

  const filteredItems = categoryFilter === "all"
    ? items
    : items.filter((i) => i.category === categoryFilter);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('max-w-[95vw] w-full', 'mx-auto', 'mt-20', 'p-6', 'space-y-6')}
    >
      {/* Header */}
      <div className={cn('flex', 'w-full', 'h-full', 'items-center', 'gap-4')}>
        <button
          onClick={() => router.push("/admin/settings")}
          className={cn('p-2', 'rounded-xl', 'hover:bg-muted', 'transition-colors', 'cursor-pointer')}
        >
          <LuChevronLeft className={cn('w-5', 'h-5')} />
        </button>
        <div className="flex-1">
          <h1 className={cn('text-2xl', 'font-bold', 'flex', 'items-center', 'gap-2')}>
            <LuImages className={cn('w-6', 'h-6', 'text-primary')} />
            Gallery Manager
          </h1>
          <p className={cn('text-muted-foreground', 'text-sm', 'mt-1')}>
            Bulk upload photos, add YouTube videos, and manage the public gallery.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={cn('flex w-full justify-start', 'gap-2 md:gap-4', 'border-b', 'border-border', 'pb-3')}>
        {([
          { key: "upload", label: "📸 Upload Photos" },
          { key: "video", label: "🎬 Add Video" },
          { key: "manage", label: "🗂️ Manage Items" },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer",
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Upload tab */}
      {tab === "upload" && (
        <BulkGalleryUploader
          onItemConfirmed={() => {}}
          onBulkSubmit={handleBulkSubmit}
          submitting={submitting}
        />
      )}

      {/* Video tab */}
      {tab === "video" && (
        <div className={cn('max-w-xl', 'space-y-4')}>
          <div className={cn('bg-background', 'border-2', 'border-border', 'rounded-2xl', 'p-6', 'space-y-4')}>
            <h2 className={cn('font-bold', 'text-lg', 'flex', 'items-center', 'gap-2')}>
              <LuYoutube className={cn('w-5', 'h-5', 'text-red-600')} />
              Add YouTube Video
            </h2>

            <div>
              <label className={cn('text-xs', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                YouTube URL *
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className={cn('w-full', 'mt-1', 'rounded-xl', 'border', 'px-3', 'py-2', 'text-sm', 'bg-background', 'focus:border-primary', 'outline-none')}
              />
              {videoUrl && extractYoutubeId(videoUrl) && (
                <div className={cn('mt-2', 'rounded-xl', 'overflow-hidden', 'aspect-video', 'bg-muted')}>
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYoutubeId(videoUrl)}`}
                    className={cn('w-full', 'h-full')}
                    allowFullScreen
                  />
                </div>
              )}
            </div>

            <div>
              <label className={cn('text-xs', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                Category
              </label>
              <select
                value={videoCategory}
                onChange={(e) => setVideoCategory(e.target.value as GalleryCategory)}
                className={cn('w-full', 'mt-1', 'rounded-xl', 'border', 'px-3', 'py-2', 'text-sm', 'bg-background', 'focus:border-primary', 'outline-none')}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={cn('text-xs', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                Caption (optional)
              </label>
              <input
                type="text"
                value={videoCaption}
                onChange={(e) => setVideoCaption(e.target.value)}
                placeholder="Brief description…"
                className={cn('w-full', 'mt-1', 'rounded-xl', 'border', 'px-3', 'py-2', 'text-sm', 'bg-background', 'focus:border-primary', 'outline-none')}
              />
            </div>

            <div className={cn('flex', 'items-center', 'gap-3')}>
              <button
                onClick={() => setVideoPublished(!videoPublished)}
                className={cn(
                  "relative w-10 h-5 rounded-full transition-colors cursor-pointer",
                  videoPublished ? "bg-primary" : "bg-muted border border-border",
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-4 h-4 bg-background rounded-full shadow-sm transition-all",
                  videoPublished ? "left-5" : "left-0.5",
                )} />
              </button>
              <span className={cn('text-sm', 'font-bold', 'text-foreground')}>Published</span>
            </div>

            <button
              onClick={handleAddVideo}
              disabled={savingVideo || !videoUrl.trim()}
              className={cn('w-full', 'py-3', 'bg-primary', 'text-primary-foreground', 'rounded-xl', 'font-bold', 'text-sm', 'hover:opacity-90', 'transition-opacity', 'disabled:opacity-50', 'cursor-pointer', 'flex', 'items-center', 'justify-center', 'gap-2')}
            >
              {savingVideo ? <LuLoader className={cn('w-4', 'h-4', 'animate-spin')} /> : <LuPlus className={cn('w-4', 'h-4')} />}
              {savingVideo ? "Adding…" : "Add Video to Gallery"}
            </button>
          </div>
        </div>
      )}

      {/* Manage tab */}
      {tab === "manage" && (
        <div className="space-y-4">
          {/* Category filter */}
          <div className={cn('flex', 'flex-wrap', 'gap-2')}>
            {(["all", ...CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                  categoryFilter === cat
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className={cn('flex', 'items-center', 'justify-center', 'py-20')}>
              <LuLoader className={cn('w-8', 'h-8', 'text-primary', 'animate-spin')} />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className={cn('flex', 'flex-col', 'items-center', 'justify-center', 'py-20', 'border', 'border-dashed', 'border-border', 'rounded-2xl', 'gap-3')}>
              <LuImages className={cn('w-10', 'h-10', 'text-slate-300')} />
              <p className={cn('text-sm', 'font-bold', 'text-muted-foreground')}>No items yet</p>
            </div>
          ) : (
            <div className={cn('grid', 'grid-cols-2', 'sm:grid-cols-3', 'md:grid-cols-4', 'lg:grid-cols-5', 'gap-3')}>
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "group relative rounded-2xl overflow-hidden border bg-muted",
                    !item.published && "opacity-60",
                  )}
                >
                  {/* Thumbnail */}
                  <div className={cn('aspect-[4/3]', 'relative')}>
                    {item.mediaType === "image" && item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.caption ?? ""}
                        fill
                        className="object-cover"
                      />
                    ) : item.youtubeId ? (
                      <Image
                        src={`https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`}
                        alt={item.caption ?? ""}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className={cn('w-full', 'h-full', 'flex', 'items-center', 'justify-center', 'text-muted-foreground')}>
                        No preview
                      </div>
                    )}

                    {/* Category badge */}
                    <div className={cn('absolute', 'top-1.5', 'left-1.5')}>
                      <span className={cn('text-[8px]', 'font-black', 'uppercase', 'tracking-widest', 'px-1.5', 'py-0.5', 'bg-black/50', 'text-white', 'rounded-full')}>
                        {item.category}
                      </span>
                    </div>

                    {/* Featured star */}
                    {item.featured && (
                      <div className={cn('absolute', 'top-1.5', 'right-1.5', 'w-5', 'h-5', 'bg-amber-500', 'rounded-full', 'flex', 'items-center', 'justify-center')}>
                        <span className={cn('text-white', 'text-[8px]')}>★</span>
                      </div>
                    )}
                  </div>

                  {/* Caption row */}
                  <div className="p-2">
                    {editingId === item.id ? (
                      <div className={cn('flex', 'gap-1')}>
                        <input
                          autoFocus
                          value={editCaption}
                          onChange={(e) => setEditCaption(e.target.value)}
                          className={cn('flex-1', 'text-[10px]', 'bg-background', 'border', 'border-border', 'rounded', 'px-1.5', 'py-1', 'outline-none')}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveCaption(item.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                        <button onClick={() => saveCaption(item.id)}>
                          <LuCheck className={cn('w-3', 'h-3', 'text-emerald-600')} />
                        </button>
                        <button onClick={() => setEditingId(null)}>
                          <LuX className={cn('w-3', 'h-3', 'text-muted-foreground')} />
                        </button>
                      </div>
                    ) : (
                      <p className={cn('text-[10px]', 'text-muted-foreground', 'truncate')}>
                        {item.caption ?? "No caption"}
                      </p>
                    )}
                  </div>

                  {/* Action buttons — visible on hover */}
                  <div className={cn('absolute', 'inset-0', 'bg-black/60', 'opacity-0', 'group-hover:opacity-100', 'transition-opacity', 'flex', 'items-center', 'justify-center', 'gap-2')}>
                    <button
                      onClick={() => togglePublished(item)}
                      title={item.published ? "Unpublish" : "Publish"}
                      className={cn('w-8', 'h-8', 'bg-white/20', 'hover:bg-white/40', 'rounded-xl', 'flex', 'items-center', 'justify-center', 'text-white', 'transition-colors')}
                    >
                      {item.published ? <LuEyeOff className={cn('w-4', 'h-4')} /> : <LuEye className={cn('w-4', 'h-4')} />}
                    </button>
                    <button
                      onClick={() => toggleFeatured(item)}
                      title={item.featured ? "Unfeature" : "Feature"}
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center text-white transition-colors",
                        item.featured ? "bg-amber-500/80 hover:bg-amber-500" : "bg-white/20 hover:bg-white/40",
                      )}
                    >
                      <span className="text-sm">★</span>
                    </button>
                    <button
                      onClick={() => { setEditingId(item.id); setEditCaption(item.caption ?? ""); }}
                      className={cn('w-8', 'h-8', 'bg-white/20', 'hover:bg-white/40', 'rounded-xl', 'flex', 'items-center', 'justify-center', 'text-white', 'transition-colors')}
                    >
                      <LuPencil className={cn('w-4', 'h-4')} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className={cn('w-8', 'h-8', 'bg-red-500/80', 'hover:bg-red-600', 'rounded-xl', 'flex', 'items-center', 'justify-center', 'text-white', 'transition-colors')}
                    >
                      <LuTrash2 className={cn('w-4', 'h-4')} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}