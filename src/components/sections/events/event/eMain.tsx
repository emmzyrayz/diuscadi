"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuBookOpen,
  LuCircleCheck,
  LuTag,
  LuUsers,
  LuGraduationCap,
  LuWrench,
  LuMapPin,
  LuCalendar,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { EventDetail } from "@/app/events/[slug]/page";

const EDU_LABEL: Record<string, string> = {
  STUDENT: "Students",
  GRADUATE: "Graduates",
  ALL: "Everyone",
};

const FORMAT_LABEL: Record<string, string> = {
  physical: "In-Person",
  virtual: "Virtual",
  hybrid: "Hybrid",
};

const SCOPE_LABEL: Record<string, string> = {
  local: "Local",
  state: "State-wide",
  national: "National",
};

export const EventMainContent = ({ event }: { event: EventDetail }) => {
  return (
    <section
      className={cn(
        "w-full",
        "max-w-7xl",
        "mx-auto",
        "px-4",
        "sm:px-6",
        "lg:px-8",
        "py-16",
      )}
    >
      <div className={cn("grid", "grid-cols-1", "lg:grid-cols-3", "gap-12")}>
        {/*className={cn('lg:col-span-2', 'space-y-12')}──────────────────────────────── */}
        <div className={cn("lg:col-span-2", "space-y-12")}>
          {/* Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className={cn("flex", "items-center", "gap-3")}>
              <div className={cn("p-2", "bg-primary/10", "rounded-xl")}>
                <LuBookOpen className={cn("w-5", "h-5", "text-primary")} />
              </div>
              <h2
                className={cn(
                  "text-2xl",
                  "font-black",
                  "text-foreground",
                  "tracking-tight",
                )}
              >
                About This Event
              </h2>
            </div>
            <div
              className={cn(
                "prose",
                "prose-slate",
                "max-w-none",
                "text-slate-600",
                "leading-relaxed",
              )}
            >
              {(event.description || event.overview)
                .split("\n\n")
                .map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
            </div>
          </motion.div>

          {/* Learning Outcomes */}
          {event.learningOutcomes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-5"
            >
              <div className={cn("flex", "items-center", "gap-3")}>
                <div className={cn("p-2", "bg-emerald-50", "rounded-xl")}>
                  <LuCircleCheck
                    className={cn("w-5", "h-5", "text-emerald-600")}
                  />
                </div>
                <h2
                  className={cn(
                    "text-2xl",
                    "font-black",
                    "text-foreground",
                    "tracking-tight",
                  )}
                >
                  What You&apos;ll Gain
                </h2>
              </div>
              <div
                className={cn("grid", "grid-cols-1", "sm:grid-cols-2", "gap-3")}
              >
                {event.learningOutcomes.map((outcome, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className={cn(
                      "flex",
                      "items-start",
                      "gap-3",
                      "p-4",
                      "bg-emerald-50/50",
                      "border",
                      "border-emerald-100",
                      "rounded-2xl",
                    )}
                  >
                    <LuCircleCheck
                      className={cn(
                        "w-4",
                        "h-4",
                        "text-emerald-600",
                        "shrink-0",
                        "mt-0.5",
                      )}
                    />
                    <span
                      className={cn("text-sm", "font-medium", "text-slate-700")}
                    >
                      {outcome}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tags */}
          {event.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className={cn("flex", "items-center", "gap-3")}>
                <div className={cn("p-2", "text-muted", "rounded-xl")}>
                  <LuTag
                    className={cn("w-5", "h-5", "text-muted-foreground")}
                  />
                </div>
                <h2
                  className={cn(
                    "text-2xl",
                    "font-black",
                    "text-foreground",
                    "tracking-tight",
                  )}
                >
                  Topics Covered
                </h2>
              </div>
              <div className={cn("flex", "flex-wrap", "gap-2")}>
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "px-4",
                      "py-2",
                      "text-muted",
                      "text-slate-700",
                      "rounded-xl",
                      "text-sm",
                      "font-bold",
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Sidebar (1 col) ──────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Event Details Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={cn(
              "bg-muted",
              "border",
              "border-border",
              "rounded-[2rem]",
              "p-6",
              "space-y-5",
            )}
          >
            <h3
              className={cn(
                "text-sm",
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-muted-foreground",
              )}
            >
              Event Details
            </h3>

            <DetailRow
              icon={<LuCalendar />}
              label="Date"
              value={event.eventDate}
            />
            {event.endDate && (
              <DetailRow
                icon={<LuCalendar />}
                label="Ends"
                value={event.endDate}
              />
            )}
            {event.duration && (
              <DetailRow
                icon={<LuCalendar />}
                label="Duration"
                value={event.duration}
              />
            )}

            <DetailRow
              icon={<LuMapPin />}
              label="Location"
              value={
                [
                  event.location.venue,
                  event.location.city,
                  event.location.state,
                ]
                  .filter(Boolean)
                  .join(", ") || FORMAT_LABEL[event.format]
              }
            />

            <DetailRow
              icon={<LuUsers />}
              label="Format"
              value={FORMAT_LABEL[event.format] ?? event.format}
            />
            <DetailRow
              icon={<LuUsers />}
              label="Scope"
              value={SCOPE_LABEL[event.locationScope] ?? event.locationScope}
            />
            <DetailRow
              icon={<LuGraduationCap />}
              label="For"
              value={EDU_LABEL[event.targetEduStatus] ?? event.targetEduStatus}
            />
            {event.instructor && (
              <DetailRow
                icon={<LuGraduationCap />}
                label="Instructor"
                value={event.instructor}
              />
            )}
          </motion.div>

          {/* Required Skills Card */}
          {event.requiredSkills.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={cn(
                "bg-amber-50",
                "border",
                "border-amber-100",
                "rounded-[2rem]",
                "p-6",
                "space-y-4",
              )}
            >
              <div className={cn("flex", "items-center", "gap-2")}>
                <LuWrench className={cn("w-4", "h-4", "text-amber-600")} />
                <h3
                  className={cn(
                    "text-sm",
                    "font-black",
                    "uppercase",
                    "tracking-widest",
                    "text-amber-700",
                  )}
                >
                  Skills Recommended
                </h3>
              </div>
              <div className={cn("flex", "flex-wrap", "gap-2")}>
                {event.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className={cn(
                      "px-3",
                      "py-1.5",
                      "bg-amber-100",
                      "text-amber-800",
                      "rounded-xl",
                      "text-xs",
                      "font-black",
                      "uppercase",
                      "tracking-wide",
                    )}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Registration Deadline */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={cn(
              "bg-red-50",
              "border",
              "border-red-100",
              "rounded-[2rem]",
              "p-6",
            )}
          >
            <h3
              className={cn(
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-red-400",
                "mb-2",
              )}
            >
              Registration Deadline
            </h3>
            <p className={cn("text-sm", "font-black", "text-red-700")}>
              {event.registrationDeadline}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  if (!value) return null;
  return (
    <div className={cn("flex", "items-start", "gap-3")}>
      <div className={cn("mt-0.5", "text-primary", "w-4", "h-4", "shrink-0")}>
        {icon}
      </div>
      <div>
        <span
          className={cn(
            "text-[10px]",
            "font-black",
            "uppercase",
            "tracking-widest",
            "text-muted-foreground",
            "block",
          )}
        >
          {label}
        </span>
        <span className={cn("text-sm", "font-bold", "text-foreground")}>
          {value}
        </span>
      </div>
    </div>
  );
}
