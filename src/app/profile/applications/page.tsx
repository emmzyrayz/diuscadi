"use client";
// app/profile/applications/page.tsx
// User-facing applications page — submit and track committee/skills requests.
// Uses ApplicationContext which already has loadMyApplications + submitApplication.

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useApplications } from "@/context/ApplicationContext";
import { usePlatform } from "@/context/PlatformContext";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import {
  LuArrowLeft,
  LuLoader,
  LuInbox,
  LuShieldCheck,
  LuCode,
  LuCircleCheck,
  LuCircleX,
  LuClock,
  LuPlus,
  LuX,
  LuChevronDown,
  LuInfo,
} from "react-icons/lu";
import type { Application } from "@/context/ApplicationContext";

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> =
  {
    pending: {
      bg: "bg-amber-50 border-amber-100",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    approved: {
      bg: "bg-emerald-50 border-emerald-100",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    rejected: {
      bg: "bg-rose-50 border-rose-100",
      text: "text-rose-700",
      dot: "bg-rose-500",
    },
  };

const STATUS_ICONS = {
  pending: LuClock,
  approved: LuCircleCheck,
  rejected: LuCircleX,
};

export default function ProfileApplicationsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const {
    applications,
    loading,
    submitting,
    // error,
    loadMyApplications,
    submitApplication,
    hasPending,
    // clearError,
  } = useApplications();
  const { committees, skills, loadCommittees, loadSkills } = usePlatform();

  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"committee" | "skills">("committee");
  const [selectedComm, setSelectedComm] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (token) loadMyApplications();
    loadCommittees();
    loadSkills();
  }, [loadCommittees, loadMyApplications, loadSkills, token]);

  const handleSubmit = async () => {
    if (!token) return;
    try {
      if (formType === "committee") {
        if (!selectedComm) {
          toast.error("Select a committee");
          return;
        }
        await submitApplication(
          {
            type: "committee",
            requestedCommittee: selectedComm,
            reason: reason || undefined,
          },
          token,
        );
      } else {
        if (selectedSkills.length === 0) {
          toast.error("Select at least one skill");
          return;
        }
        await submitApplication(
          {
            type: "skills",
            requestedSkills: selectedSkills,
            reason: reason || undefined,
          },
          token,
        );
      }
      toast.success("Application submitted");
      setShowForm(false);
      setSelectedComm("");
      setSelectedSkills([]);
      setReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    }
  };

  const toggleSkill = (slug: string) => {
    setSelectedSkills((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const canApplyCommittee = !hasPending("committee");
  const canApplySkills = !hasPending("skills");

  return (
    <main className={cn('min-h-screen w-full px-5', 'mt-25', 'pb-20')}>
      {/* Header */}
      <div className={cn('border-b rounded-2xl', 'border-border', 'bg-background')}>
        <div className={cn('max-w-4xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-8')}>
          <button
            onClick={() => router.back()}
            className={cn('flex', 'items-center', 'gap-2', 'text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'hover:text-foreground', 'transition-colors', 'cursor-pointer', 'mb-6')}
          >
            <LuArrowLeft className={cn('w-4', 'h-4')} /> Back to Profile
          </button>
          <div className={cn('flex', 'flex-col', 'sm:flex-row', 'sm:items-end', 'justify-between', 'gap-6')}>
            <div className={cn('flex', 'items-center', 'gap-4')}>
              <div className={cn('w-14', 'h-14', 'rounded-2xl', 'bg-foreground', 'flex', 'items-center', 'justify-center', 'shadow-xl', 'shadow-foreground/20')}>
                <LuInbox className={cn('w-7', 'h-7', 'text-background')} />
              </div>
              <div>
                <h1 className={cn('text-3xl', 'font-black', 'text-foreground', 'tracking-tighter', 'uppercase')}>
                  My Applications
                </h1>
                <p className={cn('text-xs', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-1')}>
                  {applications.length} submission
                  {applications.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              disabled={!canApplyCommittee && !canApplySkills}
              className={cn(
                "flex items-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl cursor-pointer",
                canApplyCommittee || canApplySkills
                  ? "bg-foreground text-background hover:bg-primary hover:text-foreground shadow-foreground/10"
                  : "bg-muted text-muted-foreground cursor-not-allowed shadow-none",
              )}
            >
              <LuPlus className={cn('w-4', 'h-4')} /> New Application
            </button>
          </div>
        </div>
      </div>

      <div className={cn('max-w-4xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'mt-8', 'space-y-6')}>
        {/* Pending notice */}
        {(hasPending("committee") || hasPending("skills")) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('flex', 'items-start', 'gap-3', 'p-4', 'bg-amber-50', 'border', 'border-amber-100', 'rounded-2xl')}
          >
            <LuInfo className={cn('w-4', 'h-4', 'text-amber-600', 'shrink-0', 'mt-0.5')} />
            <p className={cn('text-[11px]', 'font-bold', 'text-amber-700', 'uppercase', 'tracking-widest', 'leading-relaxed')}>
              You have a pending application. You cannot submit another of the
              same type until it is reviewed.
            </p>
          </motion.div>
        )}

        {/* Application form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={cn('bg-background', 'border-2', 'border-border', 'rounded-[2.5rem]', 'p-8', 'space-y-6')}>
                {/* Form header */}
                <div className={cn('flex', 'items-center', 'justify-between')}>
                  <h2 className={cn('text-lg', 'font-black', 'text-foreground', 'uppercase', 'tracking-tighter')}>
                    New Application
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className={cn('p-2', 'hover:bg-muted', 'rounded-xl', 'text-muted-foreground', 'hover:text-foreground', 'transition-colors', 'cursor-pointer')}
                  >
                    <LuX className={cn('w-5', 'h-5')} />
                  </button>
                </div>

                {/* Type selector */}
                <div className={cn('grid', 'grid-cols-2', 'gap-3')}>
                  {(["committee", "skills"] as const).map((t) => {
                    const Icon = t === "committee" ? LuShieldCheck : LuCode;
                    const canApply =
                      t === "committee" ? canApplyCommittee : canApplySkills;
                    return (
                      <button
                        key={t}
                        onClick={() => canApply && setFormType(t)}
                        disabled={!canApply}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                          !canApply
                            ? "opacity-40 cursor-not-allowed border-border"
                            : formType === t
                              ? "border-primary bg-primary/5 cursor-pointer"
                              : "border-border hover:border-slate-300 cursor-pointer",
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-5 h-5 shrink-0",
                            formType === t
                              ? "text-primary"
                              : "text-muted-foreground",
                          )}
                        />
                        <div>
                          <p
                            className={cn(
                              "text-[11px] font-black uppercase tracking-wide",
                              formType === t
                                ? "text-primary"
                                : "text-foreground",
                            )}
                          >
                            {t === "committee" ? "Committee" : "Skills"}
                          </p>
                          <p className={cn('text-[9px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-0.5')}>
                            {t === "committee"
                              ? "Join a committee"
                              : "Add skills to profile"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Committee picker */}
                {formType === "committee" && (
                  <div className="space-y-2">
                    <label className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                      Select Committee <span className="text-rose-500">*</span>
                    </label>
                    <div className={cn('grid', 'grid-cols-1', 'sm:grid-cols-2', 'gap-2')}>
                      {(committees ?? []).map((c) => (
                        <button
                          key={c.slug}
                          onClick={() => setSelectedComm(c.slug)}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer",
                            selectedComm === c.slug
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-slate-300",
                          )}
                        >
                          <div
                            className={cn('w-8', 'h-8', 'rounded-xl', 'flex', 'items-center', 'justify-center', 'text-background', 'text-[11px]', 'font-black', 'shrink-0')}
                            style={{ backgroundColor: c.color }}
                          >
                            {c.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p
                              className={cn(
                                "text-[11px] font-black uppercase tracking-wide truncate",
                                selectedComm === c.slug
                                  ? "text-primary"
                                  : "text-foreground",
                              )}
                            >
                              {c.name}
                            </p>
                            <p className={cn('text-[9px]', 'font-bold', 'text-muted-foreground', 'mt-0.5')}>
                              {c.memberCount} members
                            </p>
                          </div>
                          {selectedComm === c.slug && (
                            <LuCircleCheck className={cn('w-4', 'h-4', 'text-primary', 'ml-auto', 'shrink-0')} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills picker */}
                {formType === "skills" && (
                  <div className="space-y-2">
                    <label className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                      Select Skills <span className="text-rose-500">*</span>
                    </label>
                    <div className={cn('flex', 'flex-wrap', 'gap-2')}>
                      {(skills ?? []).map((s) => {
                        const selected = selectedSkills.includes(s.slug);
                        return (
                          <button
                            key={s.slug}
                            onClick={() => toggleSkill(s.slug)}
                            className={cn(
                              "px-3 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                              selected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-slate-300 hover:text-foreground",
                            )}
                          >
                            {s.name}
                          </button>
                        );
                      })}
                    </div>
                    {selectedSkills.length > 0 && (
                      <p className={cn('text-[9px]', 'font-bold', 'text-primary', 'uppercase', 'tracking-widest')}>
                        {selectedSkills.length} skill
                        {selectedSkills.length !== 1 ? "s" : ""} selected
                      </p>
                    )}
                  </div>
                )}

                {/* Reason */}
                <div className="space-y-2">
                  <label className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                    Reason / Motivation (optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Tell us why you're interested…"
                    rows={3}
                    className={cn('w-full', 'bg-muted', 'border', 'border-border', 'rounded-2xl', 'p-4', 'text-sm', 'font-medium', 'outline-none', 'focus:border-primary', 'transition-all', 'resize-none')}
                  />
                </div>

                {/* Submit */}
                <div className={cn('flex', 'gap-3')}>
                  <button
                    onClick={() => setShowForm(false)}
                    className={cn('flex-1', 'py-4', 'rounded-2xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-muted-foreground', 'hover:bg-muted', 'transition-all', 'cursor-pointer')}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={cn('flex-1', 'flex', 'items-center', 'justify-center', 'gap-2', 'py-4', 'rounded-2xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'bg-foreground', 'text-background', 'hover:bg-primary', 'hover:text-foreground', 'transition-all', 'shadow-xl', 'cursor-pointer', 'disabled:opacity-60')}
                  >
                    {submitting ? (
                      <>
                        <LuLoader className={cn('w-4', 'h-4', 'animate-spin')} />{" "}
                        Submitting…
                      </>
                    ) : (
                      <>
                        <LuPlus className={cn('w-4', 'h-4')} /> Submit
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Applications list */}
        {loading ? (
          <div className={cn('flex', 'items-center', 'justify-center', 'py-20')}>
            <LuLoader className={cn('w-8', 'h-8', 'text-primary', 'animate-spin')} />
          </div>
        ) : applications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn('py-20', 'text-center', 'space-y-4')}
          >
            <div className={cn('w-20', 'h-20', 'bg-muted', 'rounded-3xl', 'flex', 'items-center', 'justify-center', 'mx-auto')}>
              <LuInbox className={cn('w-10', 'h-10', 'text-slate-300')} />
            </div>
            <h3 className={cn('text-xl', 'font-black', 'text-foreground', 'uppercase', 'tracking-tighter')}>
              No Applications Yet
            </h3>
            <p className={cn('text-[11px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
              Submit a committee or skills application to get started.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {applications.map((app, index) => (
              <ApplicationCard key={app.id} app={app} index={index} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// ── ApplicationCard ───────────────────────────────────────────────────────────

const ApplicationCard: React.FC<{ app: Application; index: number }> = ({
  app,
  index,
}) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_STYLES[app.status];
  const Icon = STATUS_ICONS[app.status];
  const TypeIcon = app.type === "committee" ? LuShieldCheck : LuCode;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn('bg-background', 'border-2', 'border-border', 'rounded-[2rem]', 'overflow-hidden')}
    >
      {/* Card header */}
      <div className={cn('flex', 'items-center', 'justify-between', 'p-6')}>
        <div className={cn('flex', 'items-center', 'gap-4')}>
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              app.type === "committee" ? "bg-blue-50" : "bg-purple-50",
            )}
          >
            <TypeIcon
              className={cn(
                "w-5 h-5",
                app.type === "committee" ? "text-blue-600" : "text-purple-600",
              )}
            />
          </div>
          <div>
            <p className={cn('text-sm', 'font-black', 'text-foreground', 'uppercase', 'tracking-tight')}>
              {app.type === "committee"
                ? (app.requestedCommittee ?? "Committee")
                : `${app.requestedSkills?.length ?? 0} Skill${(app.requestedSkills?.length ?? 0) !== 1 ? "s" : ""}`}
            </p>
            <p className={cn('text-[9px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-0.5')}>
              {new Date(app.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className={cn('flex', 'items-center', 'gap-3')}>
          <span
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest",
              cfg.bg,
              cfg.text,
            )}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
            {app.status}
          </span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className={cn('p-2', 'hover:bg-muted', 'rounded-xl', 'text-muted-foreground', 'hover:text-foreground', 'transition-colors', 'cursor-pointer')}
          >
            <LuChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={cn('px-6', 'pb-6', 'space-y-4', 'border-t', 'border-border', 'pt-4')}>
              {/* Skills list */}
              {app.type === "skills" && app.requestedSkills && (
                <div className={cn('flex', 'flex-wrap', 'gap-2')}>
                  {app.requestedSkills.map((s) => (
                    <span
                      key={s}
                      className={cn('px-3', 'py-1.5', 'bg-purple-50', 'text-purple-600', 'border', 'border-purple-100', 'rounded-xl', 'text-[9px]', 'font-black', 'uppercase', 'tracking-widest')}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Reason */}
              {app.reason && (
                <div className="space-y-1">
                  <p className={cn('text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                    Your Reason
                  </p>
                  <p className={cn('text-xs', 'font-medium', 'text-foreground', 'leading-relaxed')}>
                    {app.reason}
                  </p>
                </div>
              )}

              {/* Review note */}
              {app.reviewNote && (
                <div className={cn("p-4 rounded-2xl border space-y-1", cfg.bg)}>
                  <p
                    className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      cfg.text,
                    )}
                  >
                    Review Note
                  </p>
                  <p
                    className={cn(
                      "text-xs font-medium leading-relaxed",
                      cfg.text,
                    )}
                  >
                    {app.reviewNote}
                  </p>
                </div>
              )}

              {/* Reviewed at */}
              {app.reviewedAt && (
                <p className={cn('text-[9px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                  Reviewed{" "}
                  {new Date(app.reviewedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}

              {/* Pending notice */}
              {app.status === "pending" && (
                <div className={cn('flex', 'items-center', 'gap-2', 'p-3', 'bg-amber-50', 'border', 'border-amber-100', 'rounded-2xl')}>
                  <LuClock className={cn('w-4', 'h-4', 'text-amber-600', 'shrink-0')} />
                  <p className={cn('text-[10px]', 'font-bold', 'text-amber-700', 'uppercase', 'tracking-widest')}>
                    Under review — you will be notified once a decision is made
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};