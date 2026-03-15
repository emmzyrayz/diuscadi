"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuBriefcase,
  LuGraduationCap,
  LuBuilding2,
  LuBookOpen,
  LuBadgeCheck,
  LuNetwork,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";
import type { UserProfile, Institution } from "@/context/UserContext";
import type { EduStatus } from "@/types/domain";

interface ProfessionalInfoSectionProps {
  eduStatus: EduStatus;
  institution: Institution | undefined;
}

export const ProfessionalInfoSection = ({
  eduStatus,
  institution,
}: ProfessionalInfoSectionProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "glass",
        "rounded-[2.5rem]",
        "p-8",
        "md:p-10",
        "relative",
        "overflow-hidden",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex",
          "flex-col",
          "sm:flex-row",
          "sm:items-center",
          "justify-between",
          "gap-6",
          "mb-10",
        )}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-1"
        >
          <div
            className={cn(
              "flex",
              "items-center",
              "gap-2",
              "text-primary",
              "font-black",
              "text-[10px]",
              "uppercase",
              "tracking-[0.2em]",
            )}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <LuNetwork className={cn("w-3.5", "h-3.5")} />
            </motion.div>
            Career Profile
          </div>
          <h3
            className={cn(
              "text-2xl",
              "font-black",
              "text-foreground",
              "tracking-tight",
            )}
          >
            Professional Context
          </h3>
        </motion.div>

        {/* Status pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.3,
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          className={cn(
            "flex",
            "items-center",
            "gap-2",
            "px-4",
            "py-2",
            "bg-primary/5",
            "border",
            "border-primary/10",
            "rounded-xl",
          )}
        >
          <LuBadgeCheck className={cn("w-4", "h-4", "text-primary")} />
          <span
            className={cn(
              "text-[10px]",
              "font-black",
              "uppercase",
              "tracking-widest",
              "text-primary",
            )}
          >
            {eduStatus}
          </span>
        </motion.div>
      </div>

      {institution ? (
        <div className={cn("grid", "grid-cols-1", "lg:grid-cols-2", "gap-12")}>
          {/* Academic */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-8"
          >
            <h4
              className={cn(
                "text-[10px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-[0.3em]",
                "flex",
                "items-center",
                "gap-2",
              )}
            >
              <span className={cn("w-8", "h-px", "bg-border", "block")} />
              Academic Background
            </h4>
            <div className="space-y-6">
              <ProfessionalItem
                icon={LuGraduationCap}
                label="Institution"
                value={institution.name ?? "—"}
                delay={0.5}
              />
              <ProfessionalItem
                icon={LuBookOpen}
                label="Faculty"
                value={institution.faculty ?? "—"}
                delay={0.6}
              />
              <ProfessionalItem
                icon={LuBookOpen}
                label="Department"
                value={institution.department ?? "—"}
                delay={0.7}
              />
            </div>
          </motion.div>

          {/* Level / type */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-8"
          >
            <h4
              className={cn(
                "text-[10px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-[0.3em]",
                "flex",
                "items-center",
                "gap-2",
              )}
            >
              <span className={cn("w-8", "h-px", "bg-border", "block")} />
              Details
            </h4>
            <div className="space-y-6">
              {institution.Type && (
                <ProfessionalItem
                  icon={LuBuilding2}
                  label="Institution Type"
                  value={institution.Type}
                  delay={0.5}
                />
              )}
              {institution.level && (
                <ProfessionalItem
                  icon={LuBriefcase}
                  label="Level"
                  value={institution.level}
                  delay={0.6}
                />
              )}
              {institution.semester && (
                <ProfessionalItem
                  icon={LuBriefcase}
                  label="Semester"
                  value={institution.semester}
                  delay={0.7}
                />
              )}
            </div>
          </motion.div>
        </div>
      ) : (
        <div className={cn("text-center", "py-8", "space-y-3")}>
          <LuBuilding2
            className={cn("w-10", "h-10", "text-muted-foreground", "mx-auto")}
          />
          <p className={cn("text-sm", "font-bold", "text-muted-foreground")}>
            No institution linked yet.
          </p>
          <p className={cn("text-xs", "text-muted-foreground")}>
            Go to Settings → Account to link your institution.
          </p>
        </div>
      )}

      {/* Mentorship hint */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className={cn(
          "mt-10",
          "p-4",
          "bg-muted",
          "rounded-2xl",
          "border",
          "border-border",
          "flex",
          "items-start",
          "gap-3",
        )}
      >
        <div className={cn("p-2", "bg-background", "rounded-lg")}>
          <LuNetwork className={cn("w-4", "h-4", "text-primary")} />
        </div>
        <p
          className={cn(
            "text-[11px]",
            "font-bold",
            "text-muted-foreground",
            "leading-relaxed",
          )}
        >
          This data is used to match you with industry mentors in the{" "}
          <span
            className={cn(
              "text-foreground",
              "underline",
              "decoration-primary/30",
            )}
          >
            DIUSCADI Incubation Track.
          </span>{" "}
          Keep it updated for better opportunities.
        </p>
      </motion.div>
    </motion.section>
  );
};

interface ProfessionalItemProps {
  icon: IconType;
  label: string;
  value: string;
  delay?: number;
}

const ProfessionalItem = ({
  icon: Icon,
  label,
  value,
  delay = 0,
}: ProfessionalItemProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ x: 4 }}
    className={cn("flex", "items-start", "gap-4", "group")}
  >
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0",
        "border border-border group-hover:border-primary/20 transition-colors",
      )}
    >
      <Icon
        className={cn(
          "w-5",
          "h-5",
          "text-muted-foreground",
          "group-hover:text-primary",
          "transition-colors",
        )}
      />
    </motion.div>
    <div className={cn("space-y-0.5", "flex-1")}>
      <p
        className={cn(
          "text-[9px]",
          "font-black",
          "text-muted-foreground",
          "uppercase",
          "tracking-widest",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "text-sm",
          "font-bold",
          "text-foreground",
          "leading-snug",
        )}
      >
        {value || "Not specified"}
      </p>
    </div>
  </motion.div>
);
