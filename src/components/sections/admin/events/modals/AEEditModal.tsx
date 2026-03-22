"use client";
// modals/AEEditModal.tsx
// The 5-step event creation wizard.
// On submit calls AdminContext.createEvent() which hits POST /api/admin/events.
// The banner upload uses ImageUploader → Cloudinary pipeline (TODO: wire step 1 upload).

import React, { useState } from "react";
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
  LuPlus,
  LuClock,
  LuTicket,
  LuTimer,
  LuCalendar,
  LuLoader,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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
}

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
};

export const AdminEventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const { token } = useAuth();
  const { createEvent } = useAdmin();

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    ...DEFAULT_FORM,
    ...initialData,
  });

  if (!isOpen) return null;

  const nextStep = () =>
    setCurrentStep((p) => Math.min(p + 1, 5) as WizardStep);
  const prevStep = () =>
    setCurrentStep((p) => Math.max(p - 1, 1) as WizardStep);

  const handleSubmit = async () => {
    if (!token) return;
    if (
      !formData.title.trim() ||
      !formData.date ||
      !formData.registrationDeadline
    ) {
      toast.error("Title, date and registration deadline are required");
      return;
    }

    setSubmitting(true);
    try {
      // Build ISO datetime from date + startTime
      const eventDateIso = formData.startTime
        ? new Date(`${formData.date}T${formData.startTime}`).toISOString()
        : new Date(formData.date).toISOString();

      await createEvent(
        {
          title: formData.title.trim(),
          slug: formData.title
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, ""),
          overview: formData.description,
          category: formData.category,
          format: formData.type.toLowerCase() as
            | "physical"
            | "virtual"
            | "hybrid",
          eventDate: eventDateIso,
          registrationDeadline: new Date(
            formData.registrationDeadline,
          ).toISOString(),
          capacity: formData.maxCapacity,
          locationScope: formData.type === "Virtual" ? "online" : "local",
          location: formData.venueName
            ? { venue: formData.venueName }
            : undefined,
          status: formData.visibility === "Public" ? "published" : "draft",
        },
        token,
      );

      toast.success("Event created successfully!");
      setFormData(DEFAULT_FORM);
      setCurrentStep(1);
      onSuccess?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create event",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(DEFAULT_FORM);
    setCurrentStep(1);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            "fixed",
            "inset-0",
            "z-[100]",
            "flex",
            "items-center",
            "justify-center",
            "p-4",
          )}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className={cn(
              "absolute",
              "inset-0",
              "bg-foreground/80",
              "backdrop-blur-md",
            )}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative",
              "w-full",
              "max-w-4xl",
              "bg-background",
              "rounded-[3rem]",
              "shadow-2xl",
              "overflow-hidden",
              "flex",
              "flex-col",
              "max-h-[90vh]",
            )}
          >
            {/* Header */}
            <div
              className={cn(
                "px-10",
                "py-8",
                "border-b",
                "border-border",
                "flex",
                "items-center",
                "justify-between",
                "bg-background",
                "sticky",
                "top-0",
                "z-10",
              )}
            >
              <div>
                <h2
                  className={cn(
                    "text-2xl",
                    "font-black",
                    "text-foreground",
                    "tracking-tighter",
                    "uppercase",
                  )}
                >
                  {currentStep === 5 ? "Finalize Event" : "Create New Event"}
                </h2>
                <p
                  className={cn(
                    "text-[10px]",
                    "font-bold",
                    "text-muted-foreground",
                    "uppercase",
                    "tracking-widest",
                    "mt-1",
                  )}
                >
                  Step {currentStep} of 5 — {STEPS[currentStep - 1].label}
                </p>
              </div>
              <button
                onClick={handleClose}
                className={cn(
                  "p-3",
                  "hover:bg-muted",
                  "rounded-2xl",
                  "text-muted-foreground",
                  "transition-colors",
                )}
              >
                <LuX className={cn("w-6", "h-6")} />
              </button>
            </div>

            {/* Step indicator */}
            <div
              className={cn(
                "px-10",
                "py-6",
                "bg-muted/50",
                "flex",
                "items-center",
                "justify-between",
                "border-b",
                "border-border",
              )}
            >
              {STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className={cn("flex", "items-center", "gap-3")}>
                    <div
                      className={cn(
                        "w-8",
                        "h-8",
                        "rounded-lg",
                        "flex",
                        "items-center",
                        "justify-center",
                        "text-[10px]",
                        "font-black",
                        "transition-all",
                        "duration-300",
                        currentStep >= step.id
                          ? "bg-primary text-foreground shadow-lg shadow-primary/20"
                          : "bg-slate-200 text-muted-foreground",
                      )}
                    >
                      {currentStep > step.id ? (
                        <LuCheck className={cn("w-4", "h-4")} />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[9px]",
                        "font-black",
                        "uppercase",
                        "tracking-widest",
                        "hidden",
                        "md:block",
                        "transition-colors",
                        currentStep >= step.id
                          ? "text-foreground"
                          : "text-slate-300",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {step.id !== 5 && (
                    <div
                      className={cn(
                        "h-[2px]",
                        "w-8",
                        "mx-2",
                        "hidden",
                        "lg:block",
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
                    />
                  )}
                  {currentStep === 2 && (
                    <ScheduleStep
                      formData={formData}
                      setFormData={setFormData}
                    />
                  )}
                  {currentStep === 3 && (
                    <CapacityStep
                      formData={formData}
                      setFormData={setFormData}
                    />
                  )}
                  {currentStep === 4 && (
                    <PartnersStep
                      formData={formData}
                      setFormData={setFormData}
                    />
                  )}
                  {currentStep === 5 && (
                    <PublishStep
                      formData={formData}
                      setFormData={setFormData}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div
              className={cn(
                "px-10",
                "py-8",
                "border-t",
                "border-border",
                "flex",
                "items-center",
                "justify-between",
                "bg-background",
                "sticky",
                "bottom-0",
                "z-10",
              )}
            >
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={cn(
                  "flex",
                  "items-center",
                  "gap-2",
                  "px-6",
                  "py-3",
                  "rounded-xl",
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "transition-all",
                  currentStep === 1
                    ? "opacity-0 pointer-events-none"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LuChevronLeft className={cn("w-4", "h-4")} /> Previous
              </button>

              <div className={cn("flex", "items-center", "gap-4")}>
                <button
                  onClick={handleClose}
                  className={cn(
                    "text-[10px]",
                    "font-black",
                    "uppercase",
                    "tracking-widest",
                    "text-rose-500",
                    "px-6",
                  )}
                >
                  Cancel
                </button>
                {currentStep < 5 ? (
                  <button
                    onClick={nextStep}
                    className={cn(
                      "flex",
                      "items-center",
                      "gap-2",
                      "px-8",
                      "py-4",
                      "bg-foreground",
                      "text-background",
                      "rounded-2xl",
                      "text-[11px]",
                      "font-black",
                      "uppercase",
                      "tracking-widest",
                      "hover:bg-primary",
                      "hover:text-foreground",
                      "transition-colors",
                      "shadow-xl",
                      "shadow-foreground/10",
                    )}
                  >
                    Continue <LuChevronRight className={cn("w-4", "h-4")} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={cn(
                      "flex",
                      "items-center",
                      "gap-2",
                      "px-8",
                      "py-4",
                      "bg-primary",
                      "text-foreground",
                      "rounded-2xl",
                      "text-[11px]",
                      "font-black",
                      "uppercase",
                      "tracking-widest",
                      "transition-all",
                      "shadow-xl",
                      "shadow-primary/20",
                      "disabled:opacity-60",
                    )}
                  >
                    {submitting ? (
                      <LuLoader className={cn("w-4", "h-4", "animate-spin")} />
                    ) : (
                      <LuCheck className={cn("w-4", "h-4")} />
                    )}
                    {submitting ? "Creating…" : "Deploy Event"}
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

// ── Step components (unchanged UI, just typed properly) ───────────────────────

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
    <label
      className={cn(
        "text-[10px]",
        "font-black",
        "uppercase",
        "tracking-widest",
        dark ? "text-slate-400" : "text-slate-400",
      )}
    >
      {label}
    </label>
    <div className="relative">
      <Icon
        className={cn(
          "absolute",
          "left-4",
          "top-1/2",
          "-translate-y-1/2",
          "w-4",
          "h-4",
          dark ? "text-muted-foreground" : "text-slate-400",
        )}
      />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cn(
          "w-full",
          "p-4",
          "pl-12",
          "rounded-2xl",
          "text-xs",
          "font-bold",
          "outline-none",
          "border",
          "transition-all",
          dark
            ? "bg-background/5 border-background/10 text-background focus:border-primary/50"
            : "bg-muted border-border text-foreground focus:border-primary",
        )}
      />
    </div>
  </div>
);

const BasicInfoStep: React.FC<StepProps> = ({ formData, setFormData }) => (
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
        <label
          className={cn(
            "text-[10px]",
            "font-black",
            "uppercase",
            "tracking-widest",
            "text-slate-400",
          )}
        >
          Category
        </label>
        <select
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
          className={cn(
            "w-full",
            "bg-muted",
            "border",
            "border-border",
            "p-4",
            "rounded-2xl",
            "text-xs",
            "font-bold",
            "outline-none",
            "focus:border-primary",
            "transition-all",
            "appearance-none",
          )}
        >
          {["Technology", "Business", "Governance", "Career", "Networking"].map(
            (c) => (
              <option key={c}>{c}</option>
            ),
          )}
        </select>
      </div>
    </div>
    <div className="space-y-2">
      <label
        className={cn(
          "text-[10px]",
          "font-black",
          "uppercase",
          "tracking-widest",
          "text-slate-400",
        )}
      >
        Description
      </label>
      <textarea
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        placeholder="What is this event about?"
        rows={3}
        className={cn(
          "w-full",
          "bg-muted",
          "border",
          "border-border",
          "p-4",
          "rounded-2xl",
          "text-xs",
          "font-medium",
          "outline-none",
          "focus:border-primary",
          "transition-all",
          "resize-none",
        )}
      />
    </div>
    {/* Banner upload — TODO: wire to ImageUploader when event image upload is implemented */}
    <div
      className={cn(
        "p-10",
        "border-2",
        "border-dashed",
        "border-border",
        "rounded-[2.5rem]",
        "bg-muted/50",
        "flex",
        "flex-col",
        "items-center",
        "justify-center",
        "text-center",
        "cursor-pointer",
        "hover:border-primary/50",
        "transition-colors",
      )}
    >
      <LuImage className={cn("w-8", "h-8", "text-muted-foreground", "mb-3")} />
      <p
        className={cn(
          "text-[10px]",
          "font-black",
          "uppercase",
          "tracking-[0.2em]",
          "text-foreground",
        )}
      >
        Upload Event Banner
      </p>
      <p
        className={cn(
          "text-[9px]",
          "font-bold",
          "text-muted-foreground",
          "uppercase",
          "mt-1",
        )}
      >
        PNG, JPG or WebP · Max 5MB
      </p>
      <p className={cn("text-[9px]", "font-bold", "text-amber-600", "mt-2")}>
        TODO: wire to Cloudinary ImageUploader
      </p>
    </div>
  </div>
);

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
        label="Start Time"
        type="time"
        icon={LuClock}
        value={formData.startTime}
        onChange={(e) =>
          setFormData({ ...formData, startTime: e.target.value })
        }
      />
      <InputGroup
        label="Duration (Hrs)"
        type="number"
        icon={LuTimer}
        value={formData.duration}
        onChange={(e) =>
          setFormData({ ...formData, duration: Number(e.target.value) })
        }
      />
    </div>
    <div
      className={cn(
        "flex",
        "items-center",
        "gap-4",
        "p-2",
        "text-muted",
        "rounded-2xl",
        "w-fit",
      )}
    >
      {(["Physical", "Virtual", "Hybrid"] as const).map((type) => (
        <button
          key={type}
          onClick={() => setFormData({ ...formData, type })}
          className={cn(
            "px-6",
            "py-2",
            "rounded-xl",
            "text-[10px]",
            "font-black",
            "uppercase",
            "tracking-widest",
            "transition-all",
            formData.type === type
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
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

const CapacityStep: React.FC<StepProps> = ({ formData, setFormData }) => (
  <div className={cn("space-y-8")}>
    <div className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-8")}>
      <InputGroup
        label="Max Capacity"
        type="number"
        placeholder="500"
        icon={LuUsers}
        value={formData.maxCapacity}
        onChange={(e) =>
          setFormData({ ...formData, maxCapacity: Number(e.target.value) })
        }
      />
      <InputGroup
        label="Ticket Price (₦)"
        type="number"
        placeholder="0.00"
        icon={LuTicket}
        value={formData.ticketPrice}
        onChange={(e) =>
          setFormData({ ...formData, ticketPrice: Number(e.target.value) })
        }
      />
    </div>
    <div
      className={cn(
        "p-8",
        "border-2",
        "border-border",
        "rounded-[2.5rem]",
        "flex",
        "items-center",
        "justify-between",
      )}
    >
      <div>
        <h4
          className={cn(
            "text-[11px]",
            "font-black",
            "uppercase",
            "tracking-widest",
            "text-foreground",
          )}
        >
          Enable Waitlist
        </h4>
        <p
          className={cn(
            "text-[9px]",
            "font-bold",
            "text-muted-foreground",
            "uppercase",
          )}
        >
          Allow queue once capacity is reached
        </p>
      </div>
      <button
        onClick={() =>
          setFormData({ ...formData, enableWaitlist: !formData.enableWaitlist })
        }
        className={cn(
          "w-14",
          "h-8",
          "rounded-full",
          "p-1",
          "cursor-pointer",
          "transition-colors",
          formData.enableWaitlist ? "bg-primary" : "bg-muted",
        )}
      >
        <motion.div
          animate={{ x: formData.enableWaitlist ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "w-6",
            "h-6",
            "bg-background",
            "rounded-full",
            "shadow-md",
          )}
        />
      </button>
    </div>
    <InputGroup
      label="Registration Deadline"
      type="datetime-local"
      icon={LuClock}
      value={formData.registrationDeadline}
      onChange={(e) =>
        setFormData({ ...formData, registrationDeadline: e.target.value })
      }
    />
  </div>
);

const PartnersStep: React.FC<StepProps> = () => (
  <div className={cn("space-y-8")}>
    <div className={cn("flex", "items-center", "justify-between")}>
      <h4
        className={cn(
          "text-[10px]",
          "font-black",
          "uppercase",
          "tracking-[0.2em]",
          "text-slate-400",
        )}
      >
        Featured Speakers
      </h4>
      <button
        className={cn(
          "text-[9px]",
          "font-black",
          "text-primary",
          "uppercase",
          "bg-primary/10",
          "px-3",
          "py-1.5",
          "rounded-lg",
        )}
      >
        + Add Speaker
      </button>
    </div>
    <p className={cn("text-xs", "font-bold", "text-muted-foreground")}>
      Speaker management coming soon — add via event edit after creation.
    </p>
  </div>
);

const PublishStep: React.FC<StepProps> = ({ formData, setFormData }) => (
  <div className={cn("space-y-8")}>
    <div
      className={cn(
        "bg-primary/10",
        "p-8",
        "rounded-[2.5rem]",
        "border",
        "border-primary/20",
        "text-center",
      )}
    >
      <div
        className={cn(
          "w-16",
          "h-16",
          "bg-primary",
          "rounded-2xl",
          "flex",
          "items-center",
          "justify-center",
          "mx-auto",
          "mb-6",
          "shadow-xl",
          "shadow-primary/20",
        )}
      >
        <LuCircleCheck className={cn("w-8", "h-8", "text-foreground")} />
      </div>
      <h3
        className={cn(
          "text-xl",
          "font-black",
          "text-foreground",
          "uppercase",
          "tracking-tighter",
        )}
      >
        Ready for Deployment
      </h3>
      <p
        className={cn(
          "text-[10px]",
          "font-bold",
          "text-muted-foreground",
          "uppercase",
          "mt-2",
          "tracking-widest",
          "max-w-[300px]",
          "mx-auto",
          "leading-relaxed",
        )}
      >
        Review your configurations. Once published, notifications will be sent
        to subscribed members.
      </p>
    </div>
    <div className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-4")}>
      {(["Public", "Invite-Only"] as const).map((visibility) => (
        <button
          key={visibility}
          onClick={() => setFormData({ ...formData, visibility })}
          className={cn(
            "p-6",
            "rounded-2xl",
            "border-2",
            "flex",
            "items-center",
            "justify-between",
            "transition-all",
            formData.visibility === visibility
              ? "bg-muted border-foreground"
              : "bg-background border-border opacity-50",
          )}
        >
          <span
            className={cn(
              "font-black",
              "uppercase",
              "tracking-widest",
              "text-sm",
              formData.visibility === visibility
                ? "text-foreground"
                : "text-slate-400",
            )}
          >
            {visibility}
          </span>
          {visibility === "Public" ? (
            <LuEye className={cn("w-4", "h-4", "text-muted-foreground")} />
          ) : (
            <LuShield className={cn("w-4", "h-4", "text-muted-foreground")} />
          )}
        </button>
      ))}
    </div>
  </div>
);

export type { EventModalProps, EventFormData };
