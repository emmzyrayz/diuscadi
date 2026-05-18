"use client";
// Bulk upload component for gallery items.
// Bypasses crop — uploads raw files directly through the sign → Cloudinary → confirm pipeline.
// Each item has its own upload state, form fields, and retry capability.

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import {
  LuUpload,
  LuX,
  LuCheck,
  LuCircleAlert,
  LuRefreshCw,
  LuLoader,
  LuImagePlus,
  LuLink,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { GalleryCategory } from "@/lib/models/Gallery";

// ── Types ─────────────────────────────────────────────────────────────────────

export type UploadStatus = "queued" | "uploading" | "done" | "error";

export interface BulkItem {
  // Identity
  localId: string;         // random key for React — never sent to server
  file: File;
  previewUrl: string;      // object URL for thumbnail

  // Form fields — editable while uploading
  caption: string;
  category: GalleryCategory;
  eventId: string;         // empty string = no event linked
  eventTitle: string;      // display only — set when admin picks an event
  featured: boolean;
  published: boolean;

  // Upload state
  status: UploadStatus;
  progress: number;        // 0-100 — driven by XHR upload progress
  error: string | null;
  cloudinaryUrl: string | null;  // set on success
}

interface BulkGalleryUploaderProps {
  // Called once per successfully confirmed item
  onItemConfirmed: (item: BulkItem) => void;
  // Called when the admin clicks "Push to Database" — passes all done items
  onBulkSubmit: (items: BulkItem[]) => Promise<void>;
  submitting: boolean;
}

const CATEGORIES: GalleryCategory[] = [
  "event", "meeting", "outing", "conference", "workshop", "celebration",
];

const CATEGORY_LABELS: Record<GalleryCategory, string> = {
  event: "Event",
  meeting: "Meeting",
  outing: "Outing",
  conference: "Conference",
  workshop: "Workshop",
  celebration: "Celebration",
};

// ── Auth helpers ──────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("diuscadi_token");
}

// ── Upload pipeline (sign → XHR to Cloudinary → confirm) ─────────────────────

async function uploadItem(
  item: BulkItem,
  onProgress: (pct: number) => void,
): Promise<string> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const uploadType = `gallery-${item.category}` as import("@/types/cloudinary").ImageTag;

  // Step 1: get signed params
  // ownerId encodes the item metadata as JSON — confirm route parses it
  const meta = JSON.stringify({
    caption: item.caption,
    eventId: item.eventId || undefined,
    featured: item.featured,
    published: item.published,
    order: 0,
  });

  const signRes = await fetch("/api/media/sign", {
    method: "POST",
    headers,
    body: JSON.stringify({ uploadType, ownerId: meta }),
  });

  if (!signRes.ok) {
    const data = await signRes.json();
    throw new Error(data.error ?? "Failed to get upload params");
  }

  const params = await signRes.json();

  // Step 2: XHR upload to Cloudinary with progress tracking
  const cloudinaryResponse = await new Promise<Record<string, unknown>>(
    (resolve, reject) => {
      const form = new FormData();
      form.append("file", item.file, item.file.name);
      form.append("api_key", params.apiKey);
      form.append("timestamp", String(params.timestamp));
      form.append("signature", params.signature);
      form.append("folder", params.folder);
      form.append("public_id", params.publicId);
      if (params.eager) form.append("eager", params.eager);

      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`,
      );

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 90)); // 90% = upload done, 10% for confirm
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 400 || data.error) {
            reject(new Error(data.error?.message ?? `Upload failed (${xhr.status})`));
          } else {
            // Inject timestamp if Cloudinary didn't echo it back
            if (!data.timestamp) data.timestamp = params.timestamp;
            resolve(data);
          }
        } catch {
          reject(new Error("Invalid Cloudinary response"));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(form);
    },
  );

  // Step 3: confirm — persists to MongoDB
  onProgress(95);

  const confirmRes = await fetch("/api/media/confirm", {
    method: "POST",
    headers,
    body: JSON.stringify({
      uploadType,
      ownerId: meta,
      asset_id: cloudinaryResponse.asset_id,
      public_id: cloudinaryResponse.public_id,
      secure_url: cloudinaryResponse.secure_url,
      signature: cloudinaryResponse.signature,
      timestamp: cloudinaryResponse.timestamp,
      format: cloudinaryResponse.format,
      bytes: cloudinaryResponse.bytes,
      width: cloudinaryResponse.width,
      height: cloudinaryResponse.height,
      created_at: cloudinaryResponse.created_at,
      etag: cloudinaryResponse.etag,
    }),
  });

  if (!confirmRes.ok) {
    const data = await confirmRes.json();
    throw new Error(data.error ?? "Failed to confirm upload");
  }

  onProgress(100);
  return cloudinaryResponse.secure_url as string;
}

// ── Event search dropdown ─────────────────────────────────────────────────────

interface EventOption {
  id: string;
  title: string;
  eventDate: string;
}

function EventSearchDropdown({
  value,
  valueTitle,
  onChange,
}: {
  value: string;
  valueTitle: string;
  onChange: (id: string, title: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EventOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const token = getToken();
        const res = await fetch(
          `/api/admin/gallery/events/search?q=${encodeURIComponent(q)}&limit=10`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );
        const data = await res.json();
        setResults(data.events ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    search(q);
  };

  const handleFocus = () => {
    setOpen(true);
    if (!results.length) search("");
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5">
        <LuLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={open ? query : valueTitle}
          onChange={handleInput}
          onFocus={handleFocus}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Link to event (optional)…"
          className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
        />
        {value && (
          <button
            onClick={() => { onChange("", ""); setQuery(""); }}
            className="text-muted-foreground hover:text-foreground"
          >
            <LuX className="w-3 h-3" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <LuLoader className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-4">
              No events found
            </p>
          ) : (
            results.map((e) => (
              <button
                key={e.id}
                onMouseDown={() => {
                  onChange(e.id, e.title);
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
              >
                <p className="text-xs font-bold text-foreground truncate">{e.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(e.eventDate).toLocaleDateString("en-NG", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Item card ─────────────────────────────────────────────────────────────────

function ItemCard({
  item,
  globalCategory,
  onUpdate,
  onRetry,
  onRemove,
}: {
  item: BulkItem;
  globalCategory: GalleryCategory | "";
  onUpdate: (localId: string, patch: Partial<BulkItem>) => void;
  onRetry: (localId: string) => void;
  onRemove: (localId: string) => void;
}) {
  return (
    <div
      className={cn(
        "bg-background border rounded-2xl overflow-hidden transition-all",
        item.status === "error" && "border-red-300",
        item.status === "done" && "border-emerald-200",
        item.status === "uploading" && "border-primary/30",
        item.status === "queued" && "border-border",
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-muted">
        <Image
          src={item.previewUrl}
          alt={item.caption || "Gallery item"}
          fill
          className="object-cover"
        />

        {/* Status overlay */}
        {item.status === "uploading" && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
            <LuLoader className="w-6 h-6 text-white animate-spin" />
            <div className="w-3/4 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <span className="text-white text-[10px] font-black">
              {item.progress}%
            </span>
          </div>
        )}

        {item.status === "done" && (
          <div className="absolute top-2 right-2 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <LuCheck className="w-4 h-4 text-white" />
          </div>
        )}

        {item.status === "error" && (
          <div className="absolute inset-0 bg-red-900/50 flex flex-col items-center justify-center gap-2">
            <LuCircleAlert className="w-6 h-6 text-white" />
            <p className="text-white text-[10px] font-black text-center px-2">
              {item.error ?? "Upload failed"}
            </p>
            <button
              onClick={() => onRetry(item.localId)}
              className="flex items-center gap-1 text-[10px] font-black text-white bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors"
            >
              <LuRefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* Remove button — only when queued */}
        {item.status === "queued" && (
          <button
            onClick={() => onRemove(item.localId)}
            className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
          >
            <LuX className="w-3.5 h-3.5 text-white" />
          </button>
        )}
      </div>

      {/* Form fields */}
      <div className="p-3 space-y-2">
        {/* Caption */}
        <input
          type="text"
          value={item.caption}
          onChange={(e) => onUpdate(item.localId, { caption: e.target.value })}
          placeholder="Caption (optional)"
          className="w-full text-xs bg-muted border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary transition-colors"
        />

        {/* Category */}
        <select
          value={item.category}
          onChange={(e) =>
            onUpdate(item.localId, {
              category: e.target.value as GalleryCategory,
            })
          }
          className="w-full text-xs bg-muted border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary transition-colors"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>

        {/* Event link */}
        <div className="bg-muted border border-border rounded-lg px-2.5 py-1.5">
          <EventSearchDropdown
            value={item.eventId}
            valueTitle={item.eventTitle}
            onChange={(id, title) =>
              onUpdate(item.localId, { eventId: id, eventTitle: title })
            }
          />
        </div>

        {/* Featured + Published toggles */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <button
              onClick={() =>
                onUpdate(item.localId, { featured: !item.featured })
              }
              className={cn(
                "relative w-8 h-4 rounded-full transition-colors",
                item.featured
                  ? "bg-amber-500"
                  : "bg-muted border border-border",
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-3 h-3 bg-background rounded-full shadow-sm transition-all",
                  item.featured ? "left-4" : "left-0.5",
                )}
              />
            </button>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Featured
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <button
              onClick={() =>
                onUpdate(item.localId, { published: !item.published })
              }
              className={cn(
                "relative w-8 h-4 rounded-full transition-colors",
                item.published ? "bg-primary" : "bg-muted border border-border",
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-3 h-3 bg-background rounded-full shadow-sm transition-all",
                  item.published ? "left-4" : "left-0.5",
                )}
              />
            </button>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Published
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BulkGalleryUploader({
  onItemConfirmed,
  onBulkSubmit,
  submitting,
}: BulkGalleryUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [items, setItems] = useState<BulkItem[]>([]);

  // ── Global settings ────────────────────────────────────────────────────────
  const [globalCategory, setGlobalCategory] = useState<GalleryCategory | "">(
    "",
  );

  // Apply global category to all queued items instantly
  const applyGlobalCategory = (cat: GalleryCategory) => {
    setGlobalCategory(cat);
    setItems((prev) =>
      prev.map((item) =>
        item.status === "queued" || item.status === "error"
          ? { ...item, category: cat }
          : item,
      ),
    );
    };
    

     // ── Upload queue ───────────────────────────────────────────────────────────

  const uploadSingle = useCallback(
    async (item: BulkItem) => {
      setItems((prev) =>
        prev.map((i) =>
          i.localId === item.localId
            ? { ...i, status: "uploading", progress: 0, error: null }
            : i,
        ),
      );

      try {
        const url = await uploadItem(item, (pct) => {
          setItems((prev) =>
            prev.map((i) =>
              i.localId === item.localId ? { ...i, progress: pct } : i,
            ),
          );
        });

        setItems((prev) =>
          prev.map((i) =>
            i.localId === item.localId
              ? { ...i, status: "done", progress: 100, cloudinaryUrl: url }
              : i,
          ),
        );

        onItemConfirmed({ ...item, status: "done", cloudinaryUrl: url });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setItems((prev) =>
          prev.map((i) =>
            i.localId === item.localId
              ? { ...i, status: "error", error: msg }
              : i,
          ),
        );
      }
    },
    [onItemConfirmed],
    );
    
  // Upload in batches of 3 concurrent
  const uploadBatch = useCallback(
    async (newItems: BulkItem[]) => {
      const CONCURRENCY = 3;
      for (let i = 0; i < newItems.length; i += CONCURRENCY) {
        const batch = newItems.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map(uploadSingle));
      }
    },
    [uploadSingle],
  );

  // ── File selection ─────────────────────────────────────────────────────────

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!arr.length) return;

      const newItems: BulkItem[] = arr.map((file) => ({
        localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        caption: "",
        category: (globalCategory || "event") as GalleryCategory,
        eventId: "",
        eventTitle: "",
        featured: false,
        published: true,
        status: "queued",
        progress: 0,
        error: null,
        cloudinaryUrl: null,
      }));

      setItems((prev) => [...prev, ...newItems]);

      // Start uploading immediately in parallel — up to 3 concurrent
      uploadBatch(newItems);
    },
    [globalCategory, uploadBatch],
  );


  const handleRetry = useCallback(
    (localId: string) => {
      const item = items.find((i) => i.localId === localId);
      if (item) uploadSingle(item);
    },
    [items, uploadSingle],
  );

  const handleRemove = useCallback((localId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.localId === localId);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.localId !== localId);
    });
  }, []);

  const handleUpdate = useCallback(
    (localId: string, patch: Partial<BulkItem>) => {
      setItems((prev) =>
        prev.map((i) => (i.localId === localId ? { ...i, ...patch } : i)),
      );
    },
    [],
  );

  // ── Drag and drop ──────────────────────────────────────────────────────────

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  // ── Stats ──────────────────────────────────────────────────────────────────

  const doneCount = items.filter((i) => i.status === "done").length;
  const errorCount = items.filter((i) => i.status === "error").length;
  const uploadingCount = items.filter((i) => i.status === "uploading").length;
  const allDone = items.length > 0 && doneCount === items.length;

  return (
    <div className="space-y-6">
      {/* Global settings bar */}
      {items.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 border border-border rounded-2xl">
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
              Apply category to all queued items
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => applyGlobalCategory(cat)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                    globalCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-background border border-border text-muted-foreground hover:border-primary/50",
                  )}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Upload stats */}
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              {doneCount} done
            </span>
            {uploadingCount > 0 && (
              <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                <LuLoader className="w-3 h-3 animate-spin" />
                {uploadingCount} uploading
              </span>
            )}
            {errorCount > 0 && (
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                {errorCount} failed
              </span>
            )}
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "w-full rounded-2xl border-2 border-dashed transition-all",
          "flex flex-col items-center justify-center gap-3 py-10 px-4 cursor-pointer select-none",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
        )}
      >
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
          <LuImagePlus className="w-7 h-7" />
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-foreground uppercase tracking-widest">
            Drop photos here
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Or click to browse — select multiple files at once
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            JPG, PNG, WebP · Max 15 MB each
          </p>
        </div>
        {items.length > 0 && (
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">
            + Add more photos
          </p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => e.target.files && addFiles(e.target.files)}
        className="sr-only"
      />

      {/* Item grid */}
      {items.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <ItemCard
                key={item.localId}
                item={item}
                globalCategory={globalCategory}
                onUpdate={handleUpdate}
                onRetry={handleRetry}
                onRemove={handleRemove}
              />
            ))}
          </div>

          {/* Bulk submit */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <p className="text-sm font-bold text-foreground">
                {allDone
                  ? `${doneCount} photos ready to publish`
                  : uploadingCount > 0
                    ? `Uploading ${uploadingCount} of ${items.length}…`
                    : `${doneCount}/${items.length} uploads complete`}
              </p>
              {errorCount > 0 && (
                <p className="text-xs text-red-600 font-bold mt-0.5">
                  {errorCount} item{errorCount > 1 ? "s" : ""} failed — retry
                  before submitting
                </p>
              )}
            </div>

            <button
              onClick={() =>
                onBulkSubmit(items.filter((i) => i.status === "done"))
              }
              disabled={!allDone || errorCount > 0 || submitting}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm",
                "transition-all cursor-pointer",
                allDone && errorCount === 0
                  ? "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20"
                  : "bg-muted text-muted-foreground cursor-not-allowed",
              )}
            >
              {submitting ? (
                <LuLoader className="w-4 h-4 animate-spin" />
              ) : (
                <LuUpload className="w-4 h-4" />
              )}
              {submitting ? "Saving…" : `Push ${doneCount} to Database`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}