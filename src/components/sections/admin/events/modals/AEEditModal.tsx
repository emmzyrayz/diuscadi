"use client";
// modals/AEEditModal.tsx
// Handles BOTH creating a new event (no initialData / no eventId) and
// editing an existing one (initialData + eventId supplied by the parent).

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuChevronRight,
  LuChevronLeft,
  LuCheck,
  LuImage,
  LuMapPin,
  LuUsers,
  LuMic,
  LuShield,
  LuInfo,
  LuEye,
  LuCircleCheck,
  LuClock,
  LuTicket,
  LuTimer,
  LuCalendar,
  LuLoader,
  LuPencil,
  LuRefreshCcw,
  LuTriangleAlert,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  eventId?: string;
  initialData?: Partial<EventFormData>;
}

interface EventFormData {
  title: string;
  category: string;
  description: string;
  date: string;
  startTime: string;
  duration: number;
  type: "Physical" | "Virtual" | "Hybrid";
  venueName: string;
  coordinates: { lat: string; lng: string };
  maxCapacity: number;
  ticketPrice: number;
  enableWaitlist: boolean;
  registrationDeadline: string;
  visibility: "Public" | "Invite-Only";
  bannerBlob: Blob | null;
  bannerPreviewUrl: string | null;
  /** Passed from the page — preserves original DB status so PublishStep
   *  can show the republish callout when editing a cancelled event. */
  _originalStatus?: string;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

interface StepConfig {
  id: WizardStep;
  label: string;
  icon: IconType;
}

interface StepProps {
  formData: EventFormData;
  setFormData: React.Dispatch<React.SetStateAction<EventFormData>>;
  ownerId?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS: StepConfig[] = [
  { id: 1, label: "Basic Info", icon: LuInfo },
  { id: 2, label: "Schedule", icon: LuMapPin },
  { id: 3, label: "Capacity", icon: LuUsers },
  { id: 4, label: "Partners", icon: LuMic },
  { id: 5, label: "Review", icon: LuShield },
];

const DEFAULT_FORM: EventFormData = {
  title: "",
  category: "Technology",
  description: "",
  date: "",
  startTime: "",
  duration: 2,
  type: "Physical",
  venueName: "",
  coordinates: { lat: "", lng: "" },
  maxCapacity: 100,
  ticketPrice: 0,
  enableWaitlist: false,
  registrationDeadline: "",
  visibility: "Public",
  bannerBlob: null,
  bannerPreviewUrl: null,
  _originalStatus: undefined,
};

// ── Timezone helpers ──────────────────────────────────────────────────────────

function localDatetimeToIso(value: string): string {
  if (!value) return "";
  return new Date(`${value}:00+01:00`).toISOString();
}

function isoToLocalDatetime(iso: string): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export const AdminEventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  eventId,
  initialData,
}) => {
  const { token } = useAuth();
  const { createEvent } = useAdmin();

  const isEditing = Boolean(eventId);
  const isRepublishing = isEditing && initialData?._originalStatus === "cancelled";

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    ...DEFAULT_FORM,
    ...initialData,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...DEFAULT_FORM, ...(initialData ?? {}) });
      setCurrentStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, eventId]);

  if (!isOpen) return null;

  const nextStep = () => setCurrentStep((p) => Math.min(p + 1, 5) as WizardStep);
  const prevStep = () => setCurrentStep((p) => Math.max(p - 1, 1) as WizardStep);

  // ── Create ───────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!token) return;
    if (!formData.title.trim() || !formData.date || !formData.registrationDeadline) {
      toast.error("Title, date and registration deadline are required");
      return;
    }
    setSubmitting(true);
    try {
      const eventDateIso = formData.startTime
        ? localDatetimeToIso(`${formData.date}T${formData.startTime}`)
        : new Date(`${formData.date}T00:00:00+01:00`).toISOString();

      const slug = formData.title
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      await createEvent(
        {
          title: formData.title.trim(),
          slug,
          overview: formData.description,
          category: formData.category,
          format: formData.type.toLowerCase() as "physical" | "virtual" | "hybrid",
          eventDate: eventDateIso,
          registrationDeadline: localDatetimeToIso(formData.registrationDeadline),
          capacity: formData.maxCapacity,
          ticketPrice: formData.ticketPrice,
          locationScope: formData.type === "Virtual" ? "online" : "local",
          location: formData.venueName ? { venue: formData.venueName } : undefined,
          status: formData.visibility === "Public" ? "published" : "draft",
        },
        token,
      );

      if (formData.bannerBlob) await uploadBanner(formData.bannerBlob, slug, token);

      toast.success("Event created successfully!");
      handleClose();
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Update (edit + republish) ────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!token || !eventId) return;
    if (!formData.title.trim() || !formData.date || !formData.registrationDeadline) {
      toast.error("Title, date and registration deadline are required");
      return;
    }
    setSubmitting(true);
    try {
      const eventDateIso = formData.startTime
        ? localDatetimeToIso(`${formData.date}T${formData.startTime}`)
        : new Date(`${formData.date}T00:00:00+01:00`).toISOString();

      const slug = formData.title
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          slug,
          description: formData.description,
          category: formData.category,
          format: formData.type.toLowerCase(),
          eventDate: eventDateIso,
          registrationDeadline: localDatetimeToIso(formData.registrationDeadline),
          capacity: formData.maxCapacity,
          location: formData.venueName ? { venue: formData.venueName } : undefined,
          // Visibility → status mapping:
          // "Public" always → "published" (this is also what republishes a cancelled event)
          // "Invite-Only" → "draft"
          status: formData.visibility === "Public" ? "published" : "draft",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update event");
      }

      if (formData.bannerBlob) await uploadBanner(formData.bannerBlob, slug, token);

      toast.success(
        isRepublishing ? "Event republished successfully!" : "Event updated successfully!",
      );
      handleClose();
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = isEditing ? handleUpdate : handleCreate;

  const handleClose = () => {
    setFormData(DEFAULT_FORM);
    setCurrentStep(1);
    onClose();
  };

  // ── Submit button label ──────────────────────────────────────────────────
  const submitLabel = () => {
    if (submitting) {
      if (isRepublishing) return "Republishing…";
      if (isEditing) return "Saving…";
      return "Creating…";
    }
    if (isRepublishing) return "Republish Event";
    if (isEditing) return "Save Changes";
    return "Deploy Event";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={cn("fixed", "inset-0", "z-[100]", "flex", "items-center", "justify-center", "p-4")}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className={cn("absolute", "inset-0", "bg-foreground/80", "backdrop-blur-md")}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative", "w-full", "max-w-4xl", "bg-background", "rounded-[3rem]",
              "shadow-2xl", "overflow-hidden", "flex", "flex-col", "max-h-[90vh]",
            )}
          >
            {/* Header */}
            <div
              className={cn(
                "px-10", "py-8", "border-b", "border-border", "flex",
                "items-center", "justify-between", "bg-background", "sticky", "top-0", "z-10",
              )}
            >
              <div>
                <h2
                  className={cn(
                    "text-2xl", "font-black", "text-foreground",
                    "tracking-tighter", "uppercase", "flex", "items-center", "gap-3",
                  )}
                >
                  {isRepublishing && (
                    <span className={cn("inline-flex", "items-center", "justify-center", "w-8", "h-8", "rounded-xl", "bg-emerald-500/10", "text-emerald-600")}>
                      <LuRefreshCcw className={cn('w-4', 'h-4')} />
                    </span>
                  )}
                  {!isRepublishing && isEditing && (
                    <span className={cn("inline-flex", "items-center", "justify-center", "w-8", "h-8", "rounded-xl", "bg-primary/10", "text-primary")}>
                      <LuPencil className={cn('w-4', 'h-4')} />
                    </span>
                  )}
                  {currentStep === 5
                    ? isRepublishing ? "Republish Event" : isEditing ? "Save Changes" : "Finalize Event"
                    : isRepublishing ? "Republish Event" : isEditing ? "Edit Event" : "Create New Event"}
                </h2>
                <p className={cn("text-[10px]", "font-bold", "text-muted-foreground", "uppercase", "tracking-widest", "mt-1")}>
                  Step {currentStep} of 5 — {STEPS[currentStep - 1].label}
                  {isRepublishing && (
                    <span className={cn('ml-2', 'text-emerald-600')}>· Republishing cancelled event</span>
                  )}
                  {isEditing && !isRepublishing && (
                    <span className={cn('ml-2', 'text-primary')}>· Editing existing event</span>
                  )}
                </p>
              </div>
              <button
                onClick={handleClose}
                className={cn("p-3", "hover:bg-muted", "rounded-2xl", "text-muted-foreground", "transition-colors")}
              >
                <LuX className={cn('w-6', 'h-6')} />
              </button>
            </div>

            {/* Step indicator */}
            <div className={cn("px-10", "py-6", "bg-muted/50", "flex", "items-center", "justify-between", "border-b", "border-border")}>
              {STEPS.map((step) => (
                <React.Fragment key={step.id}>
                  <div className={cn("flex", "items-center", "gap-3")}>
                    <div
                      className={cn(
                        "w-8", "h-8", "rounded-lg", "flex", "items-center",
                        "justify-center", "text-[10px]", "font-black", "transition-all", "duration-300",
                        currentStep >= step.id
                          ? "bg-primary text-foreground shadow-lg shadow-primary/20"
                          : "bg-slate-200 text-muted-foreground",
                      )}
                    >
                      {currentStep > step.id ? <LuCheck className={cn('w-4', 'h-4')} /> : step.id}
                    </div>
                    <span
                      className={cn(
                        "text-[9px]", "font-black", "uppercase", "tracking-widest",
                        "hidden", "md:block", "transition-colors",
                        currentStep >= step.id ? "text-foreground" : "text-slate-300",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {step.id !== 5 && (
                    <div
                      className={cn(
                        "h-[2px]", "w-8", "mx-2", "hidden", "lg:block",
                        currentStep > step.id ? "bg-primary" : "bg-muted",
                      )}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Content */}
            <div className={cn("flex-1", "overflow-y-auto", "p-10")}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === 1 && (
                    <BasicInfoStep
                      formData={formData}
                      setFormData={setFormData}
                      ownerId={
                        formData.title.trim()
                          ? formData.title.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
                          : undefined
                      }
                    />
                  )}
                  {currentStep === 2 && <ScheduleStep formData={formData} setFormData={setFormData} />}
                  {currentStep === 3 && <CapacityStep formData={formData} setFormData={setFormData} />}
                  {currentStep === 4 && <PartnersStep formData={formData} setFormData={setFormData} />}
                  {currentStep === 5 && (
                    <PublishStep
                      formData={formData}
                      setFormData={setFormData}
                      isEditing={isEditing}
                      isRepublishing={isRepublishing}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div
              className={cn(
                "px-10", "py-8", "border-t", "border-border", "flex",
                "items-center", "justify-between", "bg-background", "sticky", "bottom-0", "z-10",
              )}
            >
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={cn(
                  "flex", "items-center", "gap-2", "px-6", "py-3", "rounded-xl",
                  "text-[10px]", "font-black", "uppercase", "tracking-widest", "transition-all",
                  currentStep === 1
                    ? "opacity-0 pointer-events-none"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LuChevronLeft className={cn('w-4', 'h-4')} /> Previous
              </button>

              <div className={cn("flex", "items-center", "gap-4")}>
                <button
                  onClick={handleClose}
                  className={cn("text-[10px]", "font-black", "uppercase", "tracking-widest", "text-rose-500", "px-6")}
                >
                  Cancel
                </button>
                {currentStep < 5 ? (
                  <button
                    onClick={nextStep}
                    className={cn(
                      "flex", "items-center", "gap-2", "px-8", "py-4",
                      "bg-foreground", "text-background", "rounded-2xl",
                      "text-[11px]", "font-black", "uppercase", "tracking-widest",
                      "hover:bg-primary", "hover:text-foreground", "transition-colors",
                      "shadow-xl", "shadow-foreground/10",
                    )}
                  >
                    Continue <LuChevronRight className={cn('w-4', 'h-4')} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={cn(
                      "flex", "items-center", "gap-2", "px-8", "py-4", "rounded-2xl",
                      "text-[11px]", "font-black", "uppercase", "tracking-widest",
                      "transition-all", "shadow-xl", "disabled:opacity-60",
                      isRepublishing
                        ? "bg-emerald-500 text-white shadow-emerald-500/20"
                        : "bg-primary text-foreground shadow-primary/20",
                    )}
                  >
                    {submitting ? (
                      <LuLoader className={cn('w-4', 'h-4', 'animate-spin')} />
                    ) : isRepublishing ? (
                      <LuRefreshCcw className={cn('w-4', 'h-4')} />
                    ) : (
                      <LuCheck className={cn('w-4', 'h-4')} />
                    )}
                    {submitLabel()}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ── Banner upload helper ───────────────────────────────────────────────────────

async function uploadBanner(blob: Blob, slug: string, token: string) {
  try {
    const res = await fetch("/api/media/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ uploadType: "event-banner", ownerId: slug }),
    });
    if (!res.ok) return;
    const params = await res.json();
    const form = new FormData();
    form.append("file", blob, `banner_${Date.now()}.webp`);
    form.append("api_key", params.apiKey);
    form.append("timestamp", String(params.timestamp));
    form.append("signature", params.signature);
    form.append("folder", params.folder);
    form.append("public_id", params.publicId);
    if (params.eager) form.append("eager", params.eager);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`,
      { method: "POST", body: form },
    );
    if (!uploadRes.ok) return;
    const uploadData = await uploadRes.json();

    await fetch("/api/media/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        uploadType: "event-banner",
        ownerId: slug,
        asset_id: uploadData.asset_id,
        public_id: uploadData.public_id,
        secure_url: uploadData.secure_url,
        signature: uploadData.signature,
        timestamp: uploadData.timestamp ?? params.timestamp,
        format: uploadData.format,
        bytes: uploadData.bytes,
        width: uploadData.width,
        height: uploadData.height,
        created_at: uploadData.created_at,
        etag: uploadData.etag ?? "",
      }),
    });
  } catch {
    console.warn("[AEEditModal] Banner upload failed");
    toast.error("Banner upload failed — you can update it from the event edit page.");
  }
}

// ── Shared sub-components ─────────────────────────────────────────────────────

interface InputGroupProps {
  label: string;
  icon: IconType;
  dark?: boolean;
  type?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputGroup: React.FC<InputGroupProps> = ({
  label,
  icon: Icon,
  dark = false,
  type = "text",
  placeholder,
  value,
  onChange,
}) => (
  <div className="space-y-2">
    <label className={cn("text-[10px]", "font-black", "uppercase", "tracking-widest", "text-slate-400")}>
      {label}
    </label>
    <div className="relative">
      <Icon
        className={cn(
          "absolute", "left-4", "top-1/2", "-translate-y-1/2", "w-4", "h-4",
          dark ? "text-muted-foreground" : "text-slate-400",
        )}
      />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cn(
          "w-full", "p-4", "pl-12", "rounded-2xl", "text-xs", "font-bold",
          "outline-none", "border", "transition-all",
          dark
            ? "bg-background/5 border-background/10 text-background focus:border-primary/50"
            : "bg-muted border-border text-foreground focus:border-primary",
        )}
      />
    </div>
  </div>
);

// ── Step 1: Basic Info ────────────────────────────────────────────────────────

const BasicInfoStep: React.FC<StepProps> = ({ formData, setFormData }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleBannerFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, bannerBlob: file, bannerPreviewUrl: url }));
  };

  return (
    <div className={cn("space-y-6")}>
      <div className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-6")}>
        <InputGroup
          label="Event Title"
          placeholder="e.g. DIUSCADI Annual Summit"
          icon={LuInfo}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
        <div className="space-y-2">
          <label className={cn("text-[10px]", "font-black", "uppercase", "tracking-widest", "text-slate-400")}>
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className={cn(
              "w-full", "bg-muted", "border", "border-border", "p-4", "rounded-2xl",
              "text-xs", "font-bold", "outline-none", "focus:border-primary",
              "transition-all", "appearance-none",
            )}
          >
            {["Technology", "Business", "Governance", "Career", "Networking"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className={cn("text-[10px]", "font-black", "uppercase", "tracking-widest", "text-slate-400")}>
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="What is this event about?"
          rows={3}
          className={cn(
            "w-full", "bg-muted", "border", "border-border", "p-4", "rounded-2xl",
            "text-xs", "font-medium", "outline-none", "focus:border-primary",
            "transition-all", "resize-none",
          )}
        />
      </div>

      <div className="space-y-2">
        <label className={cn("text-[10px]", "font-black", "uppercase", "tracking-widest", "text-slate-400")}>
          Event Banner
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleBannerFile(file);
            e.target.value = "";
          }}
        />
        {formData.bannerPreviewUrl ? (
          <div className={cn('relative', 'group', 'rounded-[2rem]', 'overflow-hidden', 'aspect-[1200/630]', 'bg-muted')}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={formData.bannerPreviewUrl} alt="Banner preview" className={cn('w-full', 'h-full', 'object-cover')} />
            <div className={cn('absolute', 'inset-0', 'bg-black/40', 'opacity-0', 'group-hover:opacity-100', 'transition-opacity', 'flex', 'items-center', 'justify-center', 'gap-3')}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn('px-4', 'py-2', 'bg-background', 'text-foreground', 'rounded-xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'cursor-pointer')}
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, bannerBlob: null, bannerPreviewUrl: null }))}
                className={cn('px-4', 'py-2', 'bg-destructive', 'text-white', 'rounded-xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'cursor-pointer')}
              >
                Remove
              </button>
            </div>
            <div className={cn('absolute', 'bottom-3', 'right-3', 'bg-emerald-500', 'text-white', 'text-[9px]', 'font-black', 'uppercase', 'tracking-widest', 'px-2', 'py-1', 'rounded-lg')}>
              Ready to upload
            </div>
          </div>
        ) : (
          <div
            onClick={() => formData.title.trim() && fileInputRef.current?.click()}
            className={cn(
              "p-10 border-2 border-dashed border-border rounded-[2rem] bg-muted/50",
              "flex flex-col items-center justify-center text-center gap-2 transition-colors",
              formData.title.trim()
                ? "cursor-pointer hover:border-primary/50 hover:bg-primary/5"
                : "opacity-50 cursor-not-allowed",
            )}
          >
            <LuImage className={cn('w-8', 'h-8', 'text-muted-foreground')} />
            <p className={cn("text-[10px]", "font-black", "uppercase", "tracking-[0.2em]", "text-foreground")}>
              {formData.title.trim() ? "Upload Event Banner" : "Enter a title first"}
            </p>
            <p className={cn("text-[9px]", "font-bold", "text-muted-foreground", "uppercase", "mt-1")}>
              PNG, JPG or WebP · Max 10MB · 1200 × 630 recommended
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Step 2: Schedule ──────────────────────────────────────────────────────────

const ScheduleStep: React.FC<StepProps> = ({ formData, setFormData }) => (
  <div className={cn("space-y-8")}>
    <div className={cn("grid", "grid-cols-1", "md:grid-cols-3", "gap-6")}>
      <InputGroup
        label="Date"
        type="date"
        icon={LuCalendar}
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
      />
      <InputGroup
        label="Start Time (WAT)"
        type="time"
        icon={LuClock}
        value={formData.startTime}
        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
      />
      <InputGroup
        label="Duration (Hrs)"
        type="number"
        icon={LuTimer}
        value={formData.duration}
        onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
      />
    </div>
    <div className={cn("flex", "items-center", "gap-4", "p-2", "text-muted", "rounded-2xl", "w-fit")}>
      {(["Physical", "Virtual", "Hybrid"] as const).map((type) => (
        <button
          key={type}
          onClick={() => setFormData({ ...formData, type })}
          className={cn(
            "px-6", "py-2", "rounded-xl", "text-[10px]", "font-black", "uppercase", "tracking-widest", "transition-all",
            formData.type === type ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          {type}
        </button>
      ))}
    </div>
    <InputGroup
      label="Venue Name"
      placeholder="e.g. Eko Convention Center"
      icon={LuMapPin}
      value={formData.venueName}
      onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
    />
  </div>
);

// ── Step 3: Capacity ──────────────────────────────────────────────────────────

const CapacityStep: React.FC<StepProps> = ({ formData, setFormData }) => (
  <div className={cn("space-y-8")}>
    <div className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-8")}>
      <InputGroup
        label="Max Capacity"
        type="number"
        placeholder="500"
        icon={LuUsers}
        value={formData.maxCapacity}
        onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
      />
      <InputGroup
        label="Ticket Price (₦)"
        type="number"
        placeholder="0.00"
        icon={LuTicket}
        value={formData.ticketPrice}
        onChange={(e) => setFormData({ ...formData, ticketPrice: Number(e.target.value) })}
      />
    </div>
    <div className={cn("p-8", "border-2", "border-border", "rounded-[2.5rem]", "flex", "items-center", "justify-between")}>
      <div>
        <h4 className={cn("text-[11px]", "font-black", "uppercase", "tracking-widest", "text-foreground")}>
          Enable Waitlist
        </h4>
        <p className={cn("text-[9px]", "font-bold", "text-muted-foreground", "uppercase")}>
          Allow queue once capacity is reached
        </p>
      </div>
      <button
        onClick={() => setFormData({ ...formData, enableWaitlist: !formData.enableWaitlist })}
        className={cn(
          "w-14", "h-8", "rounded-full", "p-1", "cursor-pointer", "transition-colors",
          formData.enableWaitlist ? "bg-primary" : "bg-muted",
        )}
      >
        <motion.div
          animate={{ x: formData.enableWaitlist ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn("w-6", "h-6", "bg-background", "rounded-full", "shadow-md")}
        />
      </button>
    </div>

    <div className="space-y-2">
      <label className={cn("text-[10px]", "font-black", "uppercase", "tracking-widest", "text-slate-400")}>
        Registration Deadline{" "}
        <span className={cn('text-primary', 'normal-case', 'font-bold', 'tracking-normal')}>(WAT — UTC+1)</span>
      </label>
      <div className="relative">
        <LuClock className={cn('absolute', 'left-4', 'top-1/2', '-translate-y-1/2', 'w-4', 'h-4', 'text-slate-400')} />
        <input
          type="datetime-local"
          value={formData.registrationDeadline}
          onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
          className={cn(
            "w-full", "p-4", "pl-12", "rounded-2xl", "text-xs", "font-bold",
            "outline-none", "border", "transition-all",
            "bg-muted border-border text-foreground focus:border-primary",
          )}
        />
      </div>
      <p className={cn('text-[9px]', 'text-muted-foreground', 'font-bold', 'uppercase', 'tracking-widest')}>
        Saved as West Africa Time. Registrations close automatically at this time.
      </p>
    </div>
  </div>
);

// ── Step 4: Partners ──────────────────────────────────────────────────────────

const PartnersStep: React.FC<StepProps> = () => (
  <div className={cn("space-y-8")}>
    <div className={cn("flex", "items-center", "justify-between")}>
      <h4 className={cn("text-[10px]", "font-black", "uppercase", "tracking-[0.2em]", "text-slate-400")}>
        Featured Speakers
      </h4>
      <button className={cn("text-[9px]", "font-black", "text-primary", "uppercase", "bg-primary/10", "px-3", "py-1.5", "rounded-lg")}>
        + Add Speaker
      </button>
    </div>
    <p className={cn("text-xs", "font-bold", "text-muted-foreground")}>
      Speaker management coming soon — add via event edit after creation.
    </p>
  </div>
);

// ── Step 5: Review / Publish ──────────────────────────────────────────────────

const PublishStep: React.FC<StepProps & { isEditing?: boolean; isRepublishing?: boolean }> = ({
  formData,
  setFormData,
  isEditing,
  isRepublishing,
}) => (
  <div className={cn("space-y-8")}>

    {/* Republish callout — only shown when editing a cancelled event */}
    {isRepublishing && (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex", "items-start", "gap-4", "p-5", "rounded-2xl",
          "bg-emerald-50", "border", "border-emerald-200",
        )}
      >
        <div className={cn('flex-shrink-0', 'mt-0.5')}>
          <LuRefreshCcw className={cn('w-5', 'h-5', 'text-emerald-600')} />
        </div>
        <div>
          <p className={cn("text-[11px]", "font-black", "uppercase", "tracking-widest", "text-emerald-700")}>
            Republishing a cancelled event
          </p>
          <p className={cn("text-[10px]", "font-medium", "text-emerald-600", "mt-1", "leading-relaxed")}>
            This event was previously cancelled. Selecting <strong>Public</strong> and saving will
            make it live again immediately. Select <strong>Invite-Only</strong> to save as a
            draft instead.
          </p>
        </div>
      </motion.div>
    )}

    {/* Draft callout — only shown when a non-cancelled event is being saved as Invite-Only */}
    {isEditing && !isRepublishing && formData.visibility === "Invite-Only" && (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex", "items-start", "gap-4", "p-5", "rounded-2xl",
          "bg-amber-50", "border", "border-amber-200",
        )}
      >
        <div className={cn('flex-shrink-0', 'mt-0.5')}>
          <LuTriangleAlert className={cn('w-5', 'h-5', 'text-amber-600')} />
        </div>
        <div>
          <p className={cn("text-[11px]", "font-black", "uppercase", "tracking-widest", "text-amber-700")}>
            Saving as draft
          </p>
          <p className={cn("text-[10px]", "font-medium", "text-amber-600", "mt-1", "leading-relaxed")}>
            This event will be hidden from the public listing. You can republish it at any
            time by editing and switching to <strong>Public</strong>.
          </p>
        </div>
      </motion.div>
    )}

    <div
      className={cn(
        "p-8", "rounded-[2.5rem]", "border", "text-center",
        isRepublishing
          ? "bg-emerald-50/50 border-emerald-200"
          : "bg-primary/10 border-primary/20",
      )}
    >
      <div
        className={cn(
          "w-16", "h-16", "rounded-2xl", "flex", "items-center", "justify-center",
          "mx-auto", "mb-6", "shadow-xl",
          isRepublishing
            ? "bg-emerald-500 shadow-emerald-500/20"
            : "bg-primary shadow-primary/20",
        )}
      >
        {isRepublishing ? (
          <LuRefreshCcw className={cn('w-8', 'h-8', 'text-white')} />
        ) : isEditing ? (
          <LuPencil className={cn('w-8', 'h-8', 'text-foreground')} />
        ) : (
          <LuCircleCheck className={cn('w-8', 'h-8', 'text-foreground')} />
        )}
      </div>
      <h3 className={cn("text-xl", "font-black", "text-foreground", "uppercase", "tracking-tighter")}>
        {isRepublishing ? "Ready to Republish" : isEditing ? "Ready to Save" : "Ready for Deployment"}
      </h3>
      <p className={cn("text-[10px]", "font-bold", "text-muted-foreground", "uppercase", "mt-2", "tracking-widest", "max-w-[300px]", "mx-auto", "leading-relaxed")}>
        {isRepublishing
          ? "Review your changes. This event will go live again once you republish."
          : isEditing
            ? "Review your changes below. Once saved, the event listing will update immediately."
            : "Review your configurations. Once published, notifications will be sent to subscribed members."}
      </p>
    </div>

    {/* Quick summary */}
    <div className={cn('grid', 'grid-cols-2', 'gap-3', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest')}>
      {[
        { label: "Title", value: formData.title || "—" },
        { label: "Date", value: formData.date || "—" },
        { label: "Type", value: formData.type },
        { label: "Capacity", value: String(formData.maxCapacity) },
        { label: "Deadline", value: formData.registrationDeadline ? formData.registrationDeadline.replace("T", " ") : "—" },
        { label: "Ticket", value: formData.ticketPrice === 0 ? "Free" : `₦${formData.ticketPrice}` },
      ].map(({ label, value }) => (
        <div key={label} className={cn('p-4', 'rounded-2xl', 'bg-muted', 'border', 'border-border')}>
          <p className={cn('text-muted-foreground', 'text-[9px]', 'mb-1')}>{label}</p>
          <p className={cn('text-foreground', 'truncate')}>{value}</p>
        </div>
      ))}
    </div>

    <div className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-4")}>
      {(["Public", "Invite-Only"] as const).map((visibility) => (
        <button
          key={visibility}
          onClick={() => setFormData({ ...formData, visibility })}
          className={cn(
            "p-6", "rounded-2xl", "border-2", "flex", "items-center", "justify-between", "transition-all",
            formData.visibility === visibility
              ? "bg-muted border-foreground"
              : "bg-background border-border opacity-50",
          )}
        >
          <div className="text-left">
            <span
              className={cn(
                "font-black", "uppercase", "tracking-widest", "text-sm", "block",
                formData.visibility === visibility ? "text-foreground" : "text-slate-400",
              )}
            >
              {visibility}
            </span>
            <span className={cn("text-[9px]", "font-bold", "text-muted-foreground", "uppercase", "tracking-widest", "mt-0.5", "block")}>
              {visibility === "Public"
                ? isRepublishing ? "Make live again" : "Visible to everyone"
                : "Save as hidden draft"}
            </span>
          </div>
          {visibility === "Public" ? (
            <LuEye className={cn('w-4', 'h-4', 'text-muted-foreground')} />
          ) : (
            <LuShield className={cn('w-4', 'h-4', 'text-muted-foreground')} />
          )}
        </button>
      ))}
    </div>
  </div>
);

export type { EventModalProps, EventFormData };