"use client";
import React from "react";
import { motion } from "framer-motion";
import { IconType } from "react-icons";
import { LuShieldCheck, LuSparkles, LuZap } from "react-icons/lu";

const panelVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export const AuthSidePanel: React.FC = () => {
  return (
    <motion.div
      className="hidden lg:flex flex-1 bg-slate-900 relative overflow-hidden p-20 flex-col justify-between"
      initial="hidden"
      animate="visible"
      variants={panelVariants}
    >
      {/* Background Abstract Pattern */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Brand Identity */}
      <motion.div className="relative z-10" variants={itemVariants}>
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-slate-900 mb-6 shadow-lg shadow-primary/20">
          <LuSparkles className="w-6 h-6" />
        </div>
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-4">
          The Hub for <br /> <span className="text-primary">Innovation.</span>
        </h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
          DIUSCADI Ecosystem v3.0
        </p>
      </motion.div>

      {/* 2. Value Propositions */}
      <motion.div className="relative z-10 space-y-8" variants={itemVariants}>
        <FeatureItem
          icon={LuShieldCheck}
          title="Verified Access"
          desc="Strict identity protocols for campus-wide summits."
        />
        <FeatureItem
          icon={LuZap}
          title="Instant Ticketing"
          desc="QR-based verification for seamless event entry."
        />
      </motion.div>

      {/* 3. Social Proof/Quote */}
      <motion.div
        className="relative z-10 pt-10 border-t border-white/10"
        variants={itemVariants}
      >
        <p className="text-sm italic text-slate-300 font-medium leading-relaxed">
          &quot;The most efficient way to manage academic and professional
          networking on campus.&quot;
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">
            Engineering Faculty Admin
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

const FeatureItem = ({
  icon: Icon,
  title,
  desc,
}: {
  icon: IconType;
  title: string;
  desc: string;
}) => (
  <div className="flex items-start gap-4">
    <div className="mt-1 text-primary shrink-0">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">
        {title}
      </h4>
      <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
        {desc}
      </p>
    </div>
  </div>
);
