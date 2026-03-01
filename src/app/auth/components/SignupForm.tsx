"use client";
import React, { useState } from "react";
import { LuUser, LuMail, LuLock, LuShieldCheck } from "react-icons/lu";
import { AuthInput } from "./AuthInput";
import { motion } from "framer-motion";

type AccountType = "student" | "faculty";

export const SignupForm: React.FC = () => {
  const [accountType, setAccountType] = useState<AccountType>("student");

  return (
    <form className="space-y-5 w-full" onSubmit={(e) => e.preventDefault()}>
      <div className="grid grid-cols-1 gap-4">
        <AuthInput label="Full Name" icon={LuUser} type="text" />
        <AuthInput label="Email" icon={LuMail} type="email" />
        <AuthInput label="Institutional Email" icon={LuMail} type="email" />
        <AuthInput label="Create Password" icon={LuLock} type="password" />
        <AuthInput
          label="Confirm Password"
          icon={LuShieldCheck}
          type="password"
        />
      </div>

      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">
          Select Account Type
        </p>
        <div className="grid grid-cols-2 gap-2 relative">
          {(["student", "graduate"] as AccountType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setAccountType(type)}
              className="relative py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors overflow-hidden"
              style={{ zIndex: 1 }}
            >
              {accountType === type && (
                <motion.span
                  layoutId="account-type-pill"
                  className="absolute inset-0 bg-white border border-slate-900 rounded-lg"
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  style={{ zIndex: -1 }}
                />
              )}
              <span
                className={
                  accountType === type ? "text-slate-900" : "text-slate-400"
                }
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-slate-900 transition-all shadow-xl shadow-slate-900/10"
      >
        Create DIUSCADI Account
      </button>
    </form>
  );
};
