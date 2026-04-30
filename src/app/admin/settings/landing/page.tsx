"use client";
// app/admin/settings/landing/page.tsx
//
// Wires up:
//  - useAdminAuth  → hooks/useAdminAuth (built on useAuth from authContext)
//  - useToast      → hooks/useToast     (self-contained, no external dep)
//  - image upload  → signed-upload pipeline matching what ImageUploader uses
//                    (POST /api/media/sign → Cloudinary → no confirm needed
//                     for simple URL — we just store the secure_url from CDN)

import { useState, useEffect, useRef, useCallback } from "react";
import { nanoid } from "nanoid";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/useToast";
import type {
  LandingSectionKey,
  BannerSlide,
  InitiativeConfig,
  ValidatorEntry,
  MissionConfig,
  WorkshopTopic,
  TestimonialsConfig,
  TestimonialEntry,
  SupportEntry,
} from "@/lib/models/landingPageConfig";
import Image from "next/image";

// ─── Tab labels ────────────────────────────────────────────────────────────

const TABS = [
  { key: "banner", label: "🖼️ Banner Slides" },
  { key: "initiative", label: "📸 Initiative Gallery" },
  { key: "validators", label: "✅ Validated By" },
  { key: "mission", label: "👤 Mission / Leader" },
  { key: "workshopTopics", label: "🎓 Workshop Topics" },
  { key: "testimonials", label: "💬 Testimonials" },
  { key: "support", label: "🤝 Supporters" },
] as const;

type TabKey = LandingSectionKey;

// ─── Typed config state ────────────────────────────────────────────────────

interface LandingConfig {
  banner?: { slides: BannerSlide[] };
  initiative?: InitiativeConfig;
  validators?: { items: ValidatorEntry[] };
  mission?: MissionConfig;
  workshopTopics?: { items: WorkshopTopic[] };
  testimonials?: TestimonialsConfig;
  support?: { items: SupportEntry[] };
}

// ─── Cloudinary signed-upload helper ──────────────────────────────────────
//
// Mirrors the pipeline in MediaContext / ImageUploader:
//   1. POST /api/media/sign  → { signature, timestamp, apiKey, cloudName, folder, publicId, eager }
//   2. POST directly to Cloudinary upload endpoint
//   3. Return the secure_url from Cloudinary's response
//
// For the admin landing page we use uploadType = "event-banner" for all images
// (wide format, 10 MB limit). Adjust per-field if needed.

async function uploadImageToCloudinary(
  file: File,
  uploadType = "event-banner",
): Promise<string> {
  // Step 1 — get signed params from our server
  const signRes = await fetch("/api/media/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadType, ownerId: "landing" }),
  });
  if (!signRes.ok) throw new Error("Failed to get upload signature");

  const { signature, timestamp, apiKey, cloudName, folder, publicId, eager } =
    await signRes.json();

  // Step 2 — upload directly to Cloudinary
  const form = new FormData();
  form.append("file", file);
  form.append("signature", signature);
  form.append("timestamp", String(timestamp));
  form.append("api_key", apiKey);
  form.append("folder", folder);
  form.append("public_id", publicId);
  form.append("eager", eager);

  const cdnRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form },
  );
  if (!cdnRes.ok) throw new Error("Cloudinary upload failed");

  const cdnData = await cdnRes.json();
  // Use the eager transformed URL when available, else the raw secure_url
  const eagerUrl: string | undefined = cdnData.eager?.[0]?.secure_url;
  return eagerUrl ?? cdnData.secure_url;
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function LandingSettingsPage() {
  useAdminAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("banner");
  const [config, setConfig] = useState<LandingConfig>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings/landing")
      .then((r) => r.json())
      .then(
        ({
          sections,
        }: {
          sections: Array<{ sectionKey: LandingSectionKey; data: unknown }>;
        }) => {
          const byKey: LandingConfig = {};
          for (const s of sections) {
            (byKey as Record<string, unknown>)[s.sectionKey] = s.data;
          }
          setConfig(byKey);
        },
      )
      .catch(() =>
        toast({ title: "Failed to load config", variant: "destructive" }),
      )
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function save(sectionKey: LandingSectionKey, data: unknown) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionKey, data }),
      });
      if (!res.ok) throw new Error();
      toast({
        title: "Saved",
        description: `${sectionKey} updated.`,
        variant: "success",
      });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function hideSlide(slideId: string, hidden: boolean) {
    await fetch(`/api/admin/settings/landing/banner/${slideId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden }),
    });
    setConfig((prev) => ({
      ...prev,
      banner: {
        slides:
          prev.banner?.slides?.map((s) =>
            s.id === slideId ? { ...s, hidden } : s,
          ) ?? [],
      },
    }));
  }

  async function deleteSlide(slideId: string) {
    await fetch(`/api/admin/settings/landing/banner/${slideId}`, {
      method: "DELETE",
    });
    setConfig((prev) => ({
      ...prev,
      banner: {
        slides: prev.banner?.slides?.filter((s) => s.id !== slideId) ?? [],
      },
    }));
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading landing page config…
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Landing Page Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage every dynamic section of the public landing page. Changes save
          to the database and reflect live within 60 seconds.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "banner" && (
        <BannerTab
          slides={config.banner?.slides ?? []}
          onChange={(slides) =>
            setConfig((p) => ({ ...p, banner: { slides } }))
          }
          onSave={() => save("banner", config.banner ?? { slides: [] })}
          onHide={hideSlide}
          onDelete={deleteSlide}
          saving={saving}
        />
      )}

      {activeTab === "initiative" && (
        <InitiativeTab
          data={config.initiative}
          onChange={(d) => setConfig((p) => ({ ...p, initiative: d }))}
          onSave={() => save("initiative", config.initiative)}
          saving={saving}
        />
      )}

      {activeTab === "validators" && (
        <ValidatorsTab
          items={config.validators?.items ?? []}
          onChange={(items) =>
            setConfig((p) => ({ ...p, validators: { items } }))
          }
          onSave={() => save("validators", config.validators ?? { items: [] })}
          saving={saving}
        />
      )}

      {activeTab === "mission" && (
        <MissionTab
          data={config.mission}
          onChange={(d) => setConfig((p) => ({ ...p, mission: d }))}
          onSave={() => save("mission", config.mission)}
          saving={saving}
        />
      )}

      {activeTab === "workshopTopics" && (
        <WorkshopTopicsTab
          items={config.workshopTopics?.items ?? []}
          onChange={(items) =>
            setConfig((p) => ({ ...p, workshopTopics: { items } }))
          }
          onSave={() =>
            save("workshopTopics", config.workshopTopics ?? { items: [] })
          }
          saving={saving}
        />
      )}

      {activeTab === "testimonials" && (
        <TestimonialsTab
          data={config.testimonials}
          onChange={(d) => setConfig((p) => ({ ...p, testimonials: d }))}
          onSave={() => save("testimonials", config.testimonials)}
          saving={saving}
        />
      )}

      {activeTab === "support" && (
        <SupportTab
          items={config.support?.items ?? []}
          onChange={(items) => setConfig((p) => ({ ...p, support: { items } }))}
          onSave={() => save("support", config.support ?? { items: [] })}
          saving={saving}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SaveBar({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end pt-4 border-t">
      <button
        onClick={onSave}
        disabled={saving}
        className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

// ── Image upload button — uses the same signed-upload pipeline as ImageUploader
function ImageUploadButton({
  label,
  uploadType = "event-banner",
  onUploaded,
}: {
  label: string;
  uploadType?: string;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  return (
    <label
      className={`inline-flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded border text-sm hover:bg-muted ${uploading ? "opacity-50 pointer-events-none" : ""}`}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        disabled={uploading}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setUploading(true);
          try {
            const url = await uploadImageToCloudinary(file, uploadType);
            onUploaded(url);
          } catch {
            toast({
              title: "Upload failed",
              description: "Could not upload image.",
              variant: "destructive",
            });
          } finally {
            setUploading(false);
          }
          e.target.value = "";
        }}
      />
      {uploading ? "⏳ Uploading…" : `📁 ${label}`}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Banner tab
// ─────────────────────────────────────────────────────────────────────────────

function BannerTab({
  slides,
  onChange,
  onSave,
  onHide,
  onDelete,
  saving,
}: {
  slides: BannerSlide[];
  onChange: (slides: BannerSlide[]) => void;
  onSave: () => void;
  onHide: (id: string, hidden: boolean) => void;
  onDelete: (id: string) => void;
  saving: boolean;
}) {
  function addSlide() {
    const newSlide: BannerSlide = {
      id: nanoid(),
      type: "custom",
      imageUrl: "",
      title: "",
      subtitle: "",
      ctaLabel: "",
      ctaHref: "",
      hidden: false,
      order: slides.length,
    };
    onChange([...slides, newSlide]);
  }

  function updateSlide(id: string, patch: Partial<BannerSlide>) {
    onChange(slides.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Slides rotate on the landing page hero banner. Hidden slides are saved
          but not shown publicly.
        </p>
        <button
          onClick={addSlide}
          className="px-3 py-1.5 rounded-md border text-sm hover:bg-muted"
        >
          + Add Slide
        </button>
      </div>

      <div className="space-y-4">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`border rounded-lg p-4 space-y-3 ${slide.hidden ? "opacity-50" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">
                Slide {i + 1} — {slide.type}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onHide(slide.id, !slide.hidden)}
                  className="text-xs px-2 py-1 rounded border hover:bg-muted"
                >
                  {slide.hidden ? "Show" : "Hide"}
                </button>
                <button
                  onClick={() => onDelete(slide.id)}
                  className="text-xs px-2 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Type</label>
                <select
                  value={slide.type}
                  onChange={(e) =>
                    updateSlide(slide.id, {
                      type: e.target.value as BannerSlide["type"],
                    })
                  }
                  className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
                >
                  <option value="custom">Custom / Ad</option>
                  <option value="event">Event</option>
                  <option value="blog">Blog Post</option>
                  <option value="ad">Ad</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Expires at (optional)
                </label>
                <input
                  type="datetime-local"
                  value={
                    slide.expiresAt
                      ? new Date(slide.expiresAt).toISOString().slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    updateSlide(slide.id, {
                      expiresAt: e.target.value
                        ? new Date(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Title</label>
              <input
                type="text"
                value={slide.title}
                onChange={(e) =>
                  updateSlide(slide.id, { title: e.target.value })
                }
                placeholder="LASCADSS 7.0 — Coming 2026"
                className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Subtitle</label>
              <input
                type="text"
                value={slide.subtitle ?? ""}
                onChange={(e) =>
                  updateSlide(slide.id, { subtitle: e.target.value })
                }
                className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">
                  CTA Label
                </label>
                <input
                  type="text"
                  value={slide.ctaLabel ?? ""}
                  onChange={(e) =>
                    updateSlide(slide.id, { ctaLabel: e.target.value })
                  }
                  placeholder="Register Now"
                  className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  CTA Link
                </label>
                <input
                  type="text"
                  value={slide.ctaHref ?? ""}
                  onChange={(e) =>
                    updateSlide(slide.id, { ctaHref: e.target.value })
                  }
                  placeholder="/events"
                  className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {slide.imageUrl && (
                        <Image
                            width={500}
                            height={300}
                  src={slide.imageUrl}
                  alt=""
                  className="h-16 w-28 object-cover rounded border"
                />
              )}
              <ImageUploadButton
                label="Upload Banner Image"
                uploadType="event-banner"
                onUploaded={(url) => updateSlide(slide.id, { imageUrl: url })}
              />
            </div>
          </div>
        ))}
      </div>

      <SaveBar onSave={onSave} saving={saving} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Initiative tab
// ─────────────────────────────────────────────────────────────────────────────

function InitiativeTab({
  data,
  onChange,
  onSave,
  saving,
}: {
  data: InitiativeConfig | undefined;
  onChange: (d: InitiativeConfig) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const d: InitiativeConfig = data ?? {
    sectionTitle: "",
    yearLabel: "",
    photos: [],
  };

  function addPhoto(url: string) {
    onChange({
      ...d,
      photos: [
        ...(d.photos ?? []),
        { id: nanoid(), imageUrl: url, order: d.photos?.length ?? 0 },
      ],
    });
  }

  function removePhoto(id: string) {
    onChange({ ...d, photos: d.photos.filter((p) => p.id !== id) });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground">Section Title</label>
          <input
            type="text"
            value={d.sectionTitle}
            onChange={(e) => onChange({ ...d, sectionTitle: e.target.value })}
            placeholder="LASCADSS Class of 2026"
            className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Year Label</label>
          <input
            type="text"
            value={d.yearLabel}
            onChange={(e) => onChange({ ...d, yearLabel: e.target.value })}
            placeholder="2026"
            className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Photos (fade carousel)</label>
          <ImageUploadButton
            label="Add Photo"
            uploadType="event-gallery"
            onUploaded={addPhoto}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {d.photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <Image
                      width={500}
                      height={300}
                src={photo.imageUrl}
                alt={photo.alt ?? ""}
                className="h-24 w-full object-cover rounded border"
              />
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs hidden group-hover:flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <SaveBar onSave={onSave} saving={saving} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Validators tab
// ─────────────────────────────────────────────────────────────────────────────

function ValidatorsTab({
  items,
  onChange,
  onSave,
  saving,
}: {
  items: ValidatorEntry[];
  onChange: (items: ValidatorEntry[]) => void;
  onSave: () => void;
  saving: boolean;
}) {
  function add() {
    const entry: ValidatorEntry = {
      id: nanoid(),
      name: "",
      logoUrl: "",
      category: "industry",
      order: items.length,
    };
    onChange([...items, entry]);
  }
  function update(id: string, patch: Partial<ValidatorEntry>) {
    onChange(items.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }
  function remove(id: string) {
    onChange(items.filter((v) => v.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={add}
          className="px-3 py-1.5 rounded-md border text-sm hover:bg-muted"
        >
          + Add Validator
        </button>
      </div>

      <div className="space-y-3">
        {items.map((v) => (
          <div
            key={v.id}
            className="border rounded-lg p-3 flex items-center gap-3"
          >
            {v.logoUrl && (
              <Image
                width={500}
                height={300}
                src={v.logoUrl}
                alt=""
                className="h-10 w-10 object-contain rounded border"
              />
            )}
            <ImageUploadButton
              label="Logo"
              uploadType="inst-logo"
              onUploaded={(url) => update(v.id, { logoUrl: url })}
            />
            <input
              type="text"
              value={v.name}
              onChange={(e) => update(v.id, { name: e.target.value })}
              placeholder="Organisation name"
              className="flex-1 rounded border px-2 py-1.5 text-sm bg-background"
            />
            <select
              value={v.category}
              onChange={(e) =>
                update(v.id, {
                  category: e.target.value as ValidatorEntry["category"],
                })
              }
              className="rounded border px-2 py-1.5 text-sm bg-background"
            >
              <option value="industry">Industry</option>
              <option value="academia">Academia</option>
            </select>
            <button
              onClick={() => remove(v.id)}
              className="text-red-500 text-sm px-2"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <SaveBar onSave={onSave} saving={saving} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mission tab
// ─────────────────────────────────────────────────────────────────────────────

function MissionTab({
  data,
  onChange,
  onSave,
  saving,
}: {
  data: MissionConfig | undefined;
  onChange: (d: MissionConfig) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const d: MissionConfig = data ?? {
    photoUrl: "",
    name: "",
    title: "",
    writeup: "",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        {d.photoUrl && (
          <Image
            width={500}
            height={300}
            src={d.photoUrl}
            alt=""
            className="h-24 w-20 object-cover rounded-lg border"
          />
        )}
        <ImageUploadButton
          label="Upload Leader Photo"
          uploadType="avatar"
          onUploaded={(url) => onChange({ ...d, photoUrl: url })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground">Name</label>
          <input
            type="text"
            value={d.name}
            onChange={(e) => onChange({ ...d, name: e.target.value })}
            placeholder="Ikechukwu Innocent Umeh"
            className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Title / Role</label>
          <input
            type="text"
            value={d.title}
            onChange={(e) => onChange({ ...d, title: e.target.value })}
            placeholder="Founder & Convener, DIUSCADI"
            className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Writeup / Quote</label>
        <textarea
          rows={5}
          value={d.writeup}
          onChange={(e) => onChange({ ...d, writeup: e.target.value })}
          className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
        />
      </div>

      <SaveBar onSave={onSave} saving={saving} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Workshop Topics tab
// ─────────────────────────────────────────────────────────────────────────────

function WorkshopTopicsTab({
  items,
  onChange,
  onSave,
  saving,
}: {
  items: WorkshopTopic[];
  onChange: (items: WorkshopTopic[]) => void;
  onSave: () => void;
  saving: boolean;
}) {
  function add() {
    const entry: WorkshopTopic = {
      id: nanoid(),
      topic: "",
      expertName: "",
      expertTitle: "",
      icon: "🎓",
      order: items.length,
    };
    onChange([...items, entry]);
  }
  function update(id: string, patch: Partial<WorkshopTopic>) {
    onChange(items.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }
  function remove(id: string) {
    onChange(items.filter((w) => w.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={add}
          className="px-3 py-1.5 rounded-md border text-sm hover:bg-muted"
        >
          + Add Topic
        </button>
      </div>

      <div className="space-y-3">
        {items.map((w) => (
          <div key={w.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={w.icon ?? ""}
                onChange={(e) => update(w.id, { icon: e.target.value })}
                placeholder="🎓"
                className="w-12 rounded border px-2 py-1.5 text-sm bg-background text-center"
              />
              <input
                type="text"
                value={w.topic}
                onChange={(e) => update(w.id, { topic: e.target.value })}
                placeholder="Topic title"
                className="flex-1 rounded border px-2 py-1.5 text-sm bg-background"
              />
              <button
                onClick={() => remove(w.id)}
                className="text-red-500 px-2"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={w.expertName}
                onChange={(e) => update(w.id, { expertName: e.target.value })}
                placeholder="Expert name"
                className="rounded border px-2 py-1.5 text-sm bg-background"
              />
              <input
                type="text"
                value={w.expertTitle ?? ""}
                onChange={(e) => update(w.id, { expertTitle: e.target.value })}
                placeholder="Expert title / org"
                className="rounded border px-2 py-1.5 text-sm bg-background"
              />
            </div>
          </div>
        ))}
      </div>

      <SaveBar onSave={onSave} saving={saving} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Testimonials tab
// ─────────────────────────────────────────────────────────────────────────────

function TestimonialsTab({
  data,
  onChange,
  onSave,
  saving,
}: {
  data: TestimonialsConfig | undefined;
  onChange: (d: TestimonialsConfig) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const d: TestimonialsConfig = data ?? {
    videoUrl: "",
    videoType: "youtube",
    items: [],
  };

  function addTestimonial() {
    const entry: TestimonialEntry = {
      id: nanoid(),
      name: "",
      role: "",
      quote: "",
      order: d.items.length,
    };
    onChange({ ...d, items: [...d.items, entry] });
  }
  function updateItem(id: string, patch: Partial<TestimonialEntry>) {
    onChange({
      ...d,
      items: d.items.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  }
  function removeItem(id: string) {
    onChange({ ...d, items: d.items.filter((t) => t.id !== id) });
  }

  return (
    <div className="space-y-6">
      {/* Video */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-sm">Section Video</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Video Type</label>
            <select
              value={d.videoType}
              onChange={(e) =>
                onChange({
                  ...d,
                  videoType: e.target.value as TestimonialsConfig["videoType"],
                })
              }
              className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
            >
              <option value="youtube">YouTube Embed URL</option>
              <option value="cloudinary">Cloudinary Video URL</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Video URL</label>
            <input
              type="text"
              value={d.videoUrl}
              onChange={(e) => onChange({ ...d, videoUrl: e.target.value })}
              placeholder="https://www.youtube.com/embed/..."
              className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
            />
          </div>
        </div>
      </div>

      {/* Testimonials list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-sm">Testimonials</h3>
          <button
            onClick={addTestimonial}
            className="px-3 py-1.5 rounded-md border text-sm hover:bg-muted"
          >
            + Add
          </button>
        </div>
        <div className="space-y-3">
          {d.items.map((t) => (
            <div key={t.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={t.name}
                  onChange={(e) => updateItem(t.id, { name: e.target.value })}
                  placeholder="Name"
                  className="flex-1 rounded border px-2 py-1.5 text-sm bg-background"
                />
                <input
                  type="text"
                  value={t.role ?? ""}
                  onChange={(e) => updateItem(t.id, { role: e.target.value })}
                  placeholder="Role"
                  className="flex-1 rounded border px-2 py-1.5 text-sm bg-background"
                />
                <button
                  onClick={() => removeItem(t.id)}
                  className="text-red-500 px-2"
                >
                  ×
                </button>
              </div>
              <textarea
                rows={2}
                value={t.quote}
                onChange={(e) => updateItem(t.id, { quote: e.target.value })}
                placeholder="Their testimonial..."
                className="w-full rounded border px-2 py-1.5 text-sm bg-background"
              />
              <ImageUploadButton
                label="Photo (optional)"
                uploadType="avatar"
                onUploaded={(url) => updateItem(t.id, { photoUrl: url })}
              />
            </div>
          ))}
        </div>
      </div>

      <SaveBar onSave={onSave} saving={saving} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Support / Sponsors tab
// ─────────────────────────────────────────────────────────────────────────────

function SupportTab({
  items,
  onChange,
  onSave,
  saving,
}: {
  items: SupportEntry[];
  onChange: (items: SupportEntry[]) => void;
  onSave: () => void;
  saving: boolean;
}) {
  function add() {
    const entry: SupportEntry = {
      id: nanoid(),
      name: "",
      logoUrl: "",
      tier: "partner",
      order: items.length,
    };
    onChange([...items, entry]);
  }
  function update(id: string, patch: Partial<SupportEntry>) {
    onChange(items.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function remove(id: string) {
    onChange(items.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select which supporters appear on the landing page. Scope sponsors to a
        specific upcoming event using the linked event ID field.
      </p>
      <div className="flex justify-end">
        <button
          onClick={add}
          className="px-3 py-1.5 rounded-md border text-sm hover:bg-muted"
        >
          + Add Supporter
        </button>
      </div>

      <div className="space-y-3">
        {items.map((s) => (
          <div key={s.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-3">
              {s.logoUrl && (
                <Image
                  width={500}
                  height={300}
                  src={s.logoUrl}
                  alt=""
                  className="h-10 w-10 object-contain rounded border"
                />
              )}
              <ImageUploadButton
                label="Logo"
                uploadType="inst-logo"
                onUploaded={(url) => update(s.id, { logoUrl: url })}
              />
              <input
                type="text"
                value={s.name}
                onChange={(e) => update(s.id, { name: e.target.value })}
                placeholder="Organisation name"
                className="flex-1 rounded border px-2 py-1.5 text-sm bg-background"
              />
              <select
                value={s.tier}
                onChange={(e) =>
                  update(s.id, { tier: e.target.value as SupportEntry["tier"] })
                }
                className="rounded border px-2 py-1.5 text-sm bg-background"
              >
                <option value="headline">Headline</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="partner">Partner</option>
              </select>
              <button
                onClick={() => remove(s.id)}
                className="text-red-500 px-2"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">
                  Website URL (optional)
                </label>
                <input
                  type="text"
                  value={s.websiteUrl ?? ""}
                  onChange={(e) => update(s.id, { websiteUrl: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Linked Event ID (optional)
                </label>
                <input
                  type="text"
                  value={s.linkedEventId ?? ""}
                  onChange={(e) =>
                    update(s.id, { linkedEventId: e.target.value })
                  }
                  placeholder="event-slug"
                  className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <SaveBar onSave={onSave} saving={saving} />
    </div>
  );
}
