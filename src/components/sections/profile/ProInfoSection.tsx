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
import { IconType } from "react-icons";

interface ProfessionalInfoProps {
  data: {
    status: "Student" | "Graduate" | "Professional";
    institution: string;
    fieldOfStudy: string;
    company: string;
    jobTitle: string;
  };
}

interface ProfessionalItemProps {
  icon: IconType;
  label: string;
  value: string;
  delay?: number;
}

export const ProfessionalInfoSection = ({ data }: ProfessionalInfoProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm relative overflow-hidden"
    >
      {/* 1. Header with Ecosystem Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <LuNetwork className="w-3.5 h-3.5" />
            </motion.div>
            Career Profile
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            Professional Context
          </h3>
        </motion.div>

        {/* Dynamic Status Pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.3,
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-xl"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <LuBadgeCheck className="w-4 h-4 text-primary" />
          </motion.div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">
            Currently: {data.status}
          </span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* --- ACADEMIC BLOCK --- */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-8"
        >
          <motion.h4
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            transition={{ delay: 0.5 }}
            className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-2"
          >
            <motion.span
              initial={{ width: 0 }}
              animate={{ width: "2rem" }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="h-px bg-slate-100"
            />
            Academic Background
          </motion.h4>

          <div className="space-y-6">
            <ProfessionalItem
              icon={LuGraduationCap}
              label="Institution"
              value={data.institution}
              delay={0.7}
            />
            <ProfessionalItem
              icon={LuBookOpen}
              label="Field of Study"
              value={data.fieldOfStudy}
              delay={0.8}
            />
          </div>
        </motion.div>

        {/* --- CORPORATE BLOCK --- */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-8"
        >
          <motion.h4
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            transition={{ delay: 0.5 }}
            className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-2"
          >
            <motion.span
              initial={{ width: 0 }}
              animate={{ width: "2rem" }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="h-px bg-slate-100"
            />
            Current Occupation
          </motion.h4>

          <div className="space-y-6">
            <ProfessionalItem
              icon={LuBuilding2}
              label="Organization / Company"
              value={data.company}
              delay={0.7}
            />
            <ProfessionalItem
              icon={LuBriefcase}
              label="Official Job Title"
              value={data.jobTitle}
              delay={0.8}
            />
          </div>
        </motion.div>
      </div>

      {/* Logic-Driven Hint for Mentorship */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        whileHover={{ scale: 1.01 }}
        className="mt-10 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3"
      >
        <motion.div
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.6 }}
          className="p-2 bg-white rounded-lg shadow-xs"
        >
          <LuNetwork className="w-4 h-4 text-primary" />
        </motion.div>
        <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
          This data is used to match you with industry mentors in the{" "}
          <span className="text-slate-900 underline decoration-primary/30">
            DIUSCADI Incubation Track.
          </span>{" "}
          Keep it updated for better opportunities.
        </p>
      </motion.div>
    </motion.section>
  );
};

/* Internal Helper Component */
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
    className="flex items-start gap-4 group"
  >
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:border-primary/20 transition-colors"
    >
      <Icon className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
    </motion.div>
    <div className="space-y-0.5 flex-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
        {label}
      </p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.1 }}
        className="text-sm font-bold text-slate-700 leading-snug"
      >
        {value || "Not specified"}
      </motion.p>
    </div>
  </motion.div>
);

// Export types for reuse
export type { ProfessionalInfoProps, ProfessionalItemProps };
