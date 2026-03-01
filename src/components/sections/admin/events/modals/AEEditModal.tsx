"use client";
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
} from "react-icons/lu";
import { cn } from "../../../../../lib/utils";
import { IconType } from "react-icons";

// 1. Types & Interfaces
interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<EventFormData>;
}

interface EventFormData {
  title: string;
  category: string;
  description: string;
  banner: File | null;
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
  speakers: Speaker[];
  sponsors: Sponsor[];
  visibility: "Public" | "Invite-Only";
}

interface Speaker {
  id: string;
  name: string;
  avatar?: string;
}

interface Sponsor {
  id: string;
  logo: string;
  name: string;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

interface StepConfig {
  id: WizardStep;
  label: string;
  icon: IconType;
}

interface InputGroupProps {
  label: string;
  icon: IconType;
  dark?: boolean;
  type?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const STEPS: StepConfig[] = [
  { id: 1, label: "Basic Info", icon: LuInfo },
  { id: 2, label: "Schedule", icon: LuMapPin },
  { id: 3, label: "Capacity", icon: LuUsers },
  { id: 4, label: "Partners", icon: LuMic },
  { id: 5, label: "Review", icon: LuShield },
];

export const AdminEventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || "",
    category: initialData?.category || "Technology",
    description: initialData?.description || "",
    banner: initialData?.banner || null,
    date: initialData?.date || "",
    startTime: initialData?.startTime || "",
    duration: initialData?.duration || 2,
    type: initialData?.type || "Physical",
    venueName: initialData?.venueName || "",
    coordinates: initialData?.coordinates || { lat: "", lng: "" },
    maxCapacity: initialData?.maxCapacity || 100,
    ticketPrice: initialData?.ticketPrice || 0,
    enableWaitlist: initialData?.enableWaitlist || false,
    registrationDeadline: initialData?.registrationDeadline || "",
    speakers: initialData?.speakers || [],
    sponsors: initialData?.sponsors || [],
    visibility: initialData?.visibility || "Public",
  });

  if (!isOpen) return null;

  const nextStep = () =>
    setCurrentStep((prev) => Math.min(prev + 1, 5) as WizardStep);
  const prevStep = () =>
    setCurrentStep((prev) => Math.max(prev - 1, 1) as WizardStep);

  const handleSubmit = () => {
    console.log("Event created:", formData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            "fixed",
            "inset-0",
            "z-100",
            "flex",
            "items-center",
            "justify-center",
            "p-4",
          )}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={cn(
              "absolute",
              "inset-0",
              "bg-slate-900/80",
              "backdrop-blur-md",
            )}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "relative",
              "w-full",
              "max-w-4xl",
              "bg-white",
              "rounded-[3rem]",
              "shadow-2xl",
              "overflow-hidden",
              "flex",
              "flex-col",
              "max-h-[90vh]",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "px-10",
                "py-8",
                "border-b",
                "border-slate-100",
                "flex",
                "items-center",
                "justify-between",
                "bg-white",
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
                    "text-slate-900",
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
                    "text-slate-400",
                    "uppercase",
                    "tracking-widest",
                    "mt-1",
                  )}
                >
                  Step {currentStep} of 5 — {STEPS[currentStep - 1].label}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className={cn(
                  "p-3",
                  "hover:bg-slate-50",
                  "rounded-2xl",
                  "text-slate-400",
                  "transition-colors",
                )}
              >
                <LuX className={cn("w-6", "h-6")} />
              </motion.button>
            </motion.div>

            {/* Step Indicator */}
            <div
              className={cn(
                "px-10",
                "py-6",
                "bg-slate-50/50",
                "flex",
                "items-center",
                "justify-between",
                "border-b",
                "border-slate-100",
              )}
            >
              {STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className={cn("flex", "items-center", "gap-3")}
                  >
                    <motion.div
                      animate={
                        currentStep === step.id
                          ? {
                              scale: [1, 1.1, 1],
                            }
                          : {}
                      }
                      transition={{
                        duration: 0.3,
                      }}
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
                          ? "bg-primary text-slate-900 shadow-lg shadow-primary/20"
                          : "bg-slate-200 text-slate-400",
                      )}
                    >
                      <AnimatePresence mode="wait">
                        {currentStep > step.id ? (
                          <motion.div
                            key="check"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 180 }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 15,
                            }}
                          >
                            <LuCheck className={cn("w-4", "h-4")} />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="number"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            {step.id}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
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
                          ? "text-slate-900"
                          : "text-slate-300",
                      )}
                    >
                      {step.label}
                    </span>
                  </motion.div>
                  {step.id !== 5 && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{
                        scaleX: currentStep > step.id ? 1 : 0.3,
                      }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "h-[2px]",
                        "w-8",
                        "mx-2",
                        "hidden",
                        "lg:block",
                        "origin-left",
                        currentStep > step.id ? "bg-primary" : "bg-slate-100",
                      )}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Form Content (Scrollable) */}
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn(
                "px-10",
                "py-8",
                "border-t",
                "border-slate-100",
                "flex",
                "items-center",
                "justify-between",
                "bg-white",
                "sticky",
                "bottom-0",
                "z-10",
              )}
            >
              <motion.button
                onClick={prevStep}
                disabled={currentStep === 1}
                whileHover={currentStep !== 1 ? { scale: 1.05, x: -2 } : {}}
                whileTap={currentStep !== 1 ? { scale: 0.95 } : {}}
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
                    : "text-slate-400 hover:text-slate-900",
                )}
              >
                <LuChevronLeft className={cn("w-4", "h-4")} /> Previous
              </motion.button>

              <div className={cn("flex", "items-center", "gap-4")}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
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
                </motion.button>
                {currentStep < 5 ? (
                  <motion.button
                    onClick={nextStep}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "flex",
                      "items-center",
                      "gap-2",
                      "px-8",
                      "py-4",
                      "bg-slate-900",
                      "text-white",
                      "rounded-2xl",
                      "text-[11px]",
                      "font-black",
                      "uppercase",
                      "tracking-widest",
                      "hover:bg-primary",
                      "hover:text-slate-900",
                      "transition-colors",
                      "shadow-xl",
                      "shadow-slate-900/10",
                    )}
                  >
                    Continue <LuChevronRight className={cn("w-4", "h-4")} />
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={handleSubmit}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "flex",
                      "items-center",
                      "gap-2",
                      "px-8",
                      "py-4",
                      "bg-primary",
                      "text-slate-900",
                      "rounded-2xl",
                      "text-[11px]",
                      "font-black",
                      "uppercase",
                      "tracking-widest",
                      "transition-all",
                      "shadow-xl",
                      "shadow-primary/20",
                    )}
                  >
                    Deploy Event <LuCheck className={cn("w-4", "h-4")} />
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Step Components with proper props
interface StepProps {
  formData: EventFormData;
  setFormData: React.Dispatch<React.SetStateAction<EventFormData>>;
}

const BasicInfoStep: React.FC<StepProps> = ({ formData, setFormData }) => (
  <div className={cn("space-y-6")}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-6")}
    >
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
            "flex",
            "items-center",
            "gap-2",
          )}
        >
          Category <span className="text-primary">*</span>
        </label>
        <select
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
          className={cn(
            "w-full",
            "bg-slate-50",
            "border",
            "border-slate-100",
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
          <option>Technology</option>
          <option>Business</option>
          <option>Governance</option>
        </select>
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-2"
    >
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
        className={cn(
          "w-full",
          "bg-slate-50",
          "border",
          "border-slate-100",
          "p-4",
          "rounded-2xl",
          "text-xs",
          "font-medium",
          "h-32",
          "outline-none",
          "focus:border-primary",
          "transition-all",
          "resize-none",
        )}
      />
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "p-10",
        "border-2",
        "border-dashed",
        "border-slate-200",
        "rounded-[2.5rem]",
        "bg-slate-50/50",
        "flex",
        "flex-col",
        "items-center",
        "justify-center",
        "text-center",
        "group",
        "hover:border-primary/50",
        "transition-colors",
        "cursor-pointer",
      )}
    >
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        className={cn(
          "w-12",
          "h-12",
          "bg-white",
          "rounded-xl",
          "flex",
          "items-center",
          "justify-center",
          "shadow-sm",
          "mb-4",
          "transition-transform",
        )}
      >
        <LuImage
          className={cn(
            "w-6",
            "h-6",
            "text-slate-400",
            "group-hover:text-primary",
          )}
        />
      </motion.div>
      <p
        className={cn(
          "text-[10px]",
          "font-black",
          "uppercase",
          "tracking-[0.2em]",
          "text-slate-900",
        )}
      >
        Upload Event Banner
      </p>
      <p
        className={cn(
          "text-[9px]",
          "font-bold",
          "text-slate-400",
          "uppercase",
          "mt-1",
        )}
      >
        PNG, JPG or WebP (Max 5MB)
      </p>
    </motion.div>
  </div>
);

const ScheduleStep: React.FC<StepProps> = ({ formData, setFormData }) => (
  <div className={cn("space-y-8")}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn("grid", "grid-cols-1", "md:grid-cols-3", "gap-6")}
    >
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
        placeholder="2"
        type="number"
        icon={LuTimer}
        value={formData.duration}
        onChange={(e) =>
          setFormData({ ...formData, duration: Number(e.target.value) })
        }
      />
    </motion.div>

    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          "flex",
          "items-center",
          "gap-4",
          "p-2",
          "bg-slate-100",
          "rounded-2xl",
          "w-fit",
        )}
      >
        {(["Physical", "Virtual", "Hybrid"] as const).map((type) => (
          <motion.button
            key={type}
            onClick={() => setFormData({ ...formData, type })}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400",
            )}
          >
            {type}
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={cn(
          "grid",
          "grid-cols-1",
          "md:grid-cols-2",
          "gap-6",
          "p-8",
          "bg-slate-900",
          "rounded-[2.5rem]",
          "text-white",
          "overflow-hidden",
          "relative",
        )}
      >
        <div className={cn("space-y-4", "relative", "z-10")}>
          <InputGroup
            label="Venue Name"
            placeholder="e.g. Eko Convention Center"
            icon={LuMapPin}
            dark
            value={formData.venueName}
            onChange={(e) =>
              setFormData({ ...formData, venueName: e.target.value })
            }
          />
          <div className={cn("grid", "grid-cols-2", "gap-4")}>
            <input
              placeholder="Lat: 6.5244"
              value={formData.coordinates.lat}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  coordinates: { ...formData.coordinates, lat: e.target.value },
                })
              }
              className={cn(
                "bg-white/5",
                "border",
                "border-white/10",
                "p-4",
                "rounded-xl",
                "text-xs",
                "font-mono",
                "text-primary",
                "outline-none",
              )}
            />
            <input
              placeholder="Lng: 3.3792"
              value={formData.coordinates.lng}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  coordinates: { ...formData.coordinates, lng: e.target.value },
                })
              }
              className={cn(
                "bg-white/5",
                "border",
                "border-white/10",
                "p-4",
                "rounded-xl",
                "text-xs",
                "font-mono",
                "text-primary",
                "outline-none",
              )}
            />
          </div>
        </div>
        <div
          className={cn(
            "h-full",
            "min-h-[150px]",
            "bg-slate-800",
            "rounded-2xl",
            "flex",
            "items-center",
            "justify-center",
            "border",
            "border-white/5",
          )}
        >
          <p
            className={cn(
              "text-[8px]",
              "font-black",
              "uppercase",
              "tracking-[0.3em]",
              "text-slate-500",
              "text-center",
              "px-6",
            )}
          >
            Interactive 3D Preview Generated via Coordinates
          </p>
        </div>
      </motion.div>
    </div>
  </div>
);

const CapacityStep: React.FC<StepProps> = ({ formData, setFormData }) => (
  <div className={cn("space-y-8")}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-8")}
    >
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
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "p-8",
        "border-2",
        "border-slate-100",
        "rounded-[2.5rem]",
        "flex",
        "items-center",
        "justify-between",
        "group",
      )}
    >
      <div className="space-y-1">
        <h4
          className={cn(
            "text-[11px]",
            "font-black",
            "uppercase",
            "tracking-widest",
            "text-slate-900",
          )}
        >
          Enable Waitlist
        </h4>
        <p
          className={cn(
            "text-[9px]",
            "font-bold",
            "text-slate-400",
            "uppercase",
          )}
        >
          Allow users to join queue once capacity is reached
        </p>
      </div>
      <motion.button
        onClick={() =>
          setFormData({
            ...formData,
            enableWaitlist: !formData.enableWaitlist,
          })
        }
        whileTap={{ scale: 0.95 }}
        className={cn(
          "w-14",
          "h-8",
          "rounded-full",
          "p-1",
          "cursor-pointer",
          "transition-colors",
          formData.enableWaitlist ? "bg-primary" : "bg-slate-100",
        )}
      >
        <motion.div
          animate={{
            x: formData.enableWaitlist ? 24 : 0,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn("w-6", "h-6", "bg-white", "rounded-full", "shadow-md")}
        />
      </motion.button>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <InputGroup
        label="Registration Deadline"
        type="datetime-local"
        icon={LuClock}
        value={formData.registrationDeadline}
        onChange={(e) =>
          setFormData({
            ...formData,
            registrationDeadline: e.target.value,
          })
        }
      />
    </motion.div>
  </div>
);

const PartnersStep: React.FC<StepProps> = ({ formData, setFormData }) => (
  <div className={cn("space-y-8")}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
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
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
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
        </motion.button>
      </div>
      <div className={cn("grid", "grid-cols-2", "gap-4")}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          className={cn(
            "p-4",
            "bg-slate-50",
            "border",
            "border-slate-100",
            "rounded-2xl",
            "flex",
            "items-center",
            "gap-3",
          )}
        >
          <div className={cn("w-10", "h-10", "bg-slate-200", "rounded-full")} />
          <span className={cn("text-[10px]", "font-black", "uppercase")}>
            Dr. Adeyemi Tobi
          </span>
        </motion.div>
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={cn("space-y-4", "pt-4", "border-t", "border-slate-50")}
    >
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
          Sponsors / Partners
        </h4>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
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
          + Add Partner
        </motion.button>
      </div>
      <div className={cn("flex", "gap-4")}>
        <motion.div
          whileHover={{ scale: 1.05, rotate: 5 }}
          className={cn(
            "w-16",
            "h-16",
            "bg-slate-50",
            "border-2",
            "border-dashed",
            "border-slate-200",
            "rounded-2xl",
            "flex",
            "items-center",
            "justify-center",
            "cursor-pointer",
          )}
        >
          <LuPlus className={cn("w-4", "h-4", "text-slate-300")} />
        </motion.div>
      </div>
    </motion.div>
  </div>
);

const PublishStep: React.FC<StepProps> = ({ formData, setFormData }) => (
  <div className={cn("space-y-8")}>
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "bg-primary/10",
        "p-8",
        "rounded-[2.5rem]",
        "border",
        "border-primary/20",
        "text-center",
      )}
    >
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
        }}
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
        <LuCircleCheck className={cn("w-8", "h-8", "text-slate-900")} />
      </motion.div>
      <h3
        className={cn(
          "text-xl",
          "font-black",
          "text-slate-900",
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
          "text-slate-500",
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
    </motion.div>

    <div className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-4")}>
      {(["Public", "Invite-Only"] as const).map((visibility, index) => (
        <motion.button
          key={visibility}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + index * 0.1 }}
          onClick={() => setFormData({ ...formData, visibility })}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "p-6",
            "rounded-2xl",
            "border-2",
            "flex",
            "items-center",
            "justify-between",
            "transition-all",
            formData.visibility === visibility
              ? "bg-slate-50 border-slate-900"
              : "bg-white border-slate-100 opacity-50",
          )}
        >
          <span
            className={cn(
              "text-[10px]",
              "font-black",
              "uppercase",
              "tracking-widest",
              formData.visibility === visibility
                ? "text-slate-900"
                : "text-slate-400",
            )}
          >
            {visibility}
          </span>
          {visibility === "Public" ? (
            <LuEye
              className={cn(
                "w-4",
                "h-4",
                formData.visibility === visibility
                  ? "text-slate-900"
                  : "text-slate-400",
              )}
            />
          ) : (
            <LuShield
              className={cn(
                "w-4",
                "h-4",
                formData.visibility === visibility
                  ? "text-slate-900"
                  : "text-slate-400",
              )}
            />
          )}
        </motion.button>
      ))}
    </div>
  </div>
);

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
          dark ? "text-slate-500" : "text-slate-400",
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
            ? "bg-white/5 border-white/10 text-white focus:border-primary/50"
            : "bg-slate-50 border-slate-100 text-slate-900 focus:border-primary",
        )}
      />
    </div>
  </div>
);

// Export types
export type {
  EventModalProps,
  EventFormData,
  Speaker,
  Sponsor,
  WizardStep,
  StepConfig,
  InputGroupProps,
  StepProps,
};
