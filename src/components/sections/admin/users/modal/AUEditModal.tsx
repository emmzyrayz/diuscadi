"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuUser,
  LuMail,
  LuPhone,
  LuCamera,
  LuShieldCheck,
  LuSave,
  LuUserCheck,
  LuUserPlus,
} from "react-icons/lu";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";

// Define proper TypeScript types
interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  registrationType: "Student" | "Graduate" | "Professional";
  verificationStatus: "Verified" | "Unverified" | "Incomplete";
}

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  type: "Student" | "Graduate" | "Professional";
  isVerified: boolean;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: UserFormData) => void;
  user: UserData | null;
}

interface EditInputProps {
  label: string;
  icon: IconType;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  delay?: number;
}

export const AdminUserEditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  user,
}) => {
  // Local state initialized with current user data
  const [formData, setFormData] = useState<UserFormData>({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    type: user?.registrationType || "Student",
    isVerified: user?.verificationStatus === "Verified",
  });

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            "fixed",
            "inset-0",
            "z-110",
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
              "bg-slate-900/60",
              "backdrop-blur-sm",
            )}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative",
              "w-full",
              "max-w-2xl",
              "bg-white",
              "rounded-[3rem]",
              "shadow-2xl",
              "overflow-hidden",
              "flex",
              "flex-col",
            )}
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "p-8",
                "border-b",
                "border-slate-100",
                "flex",
                "items-center",
                "justify-between",
                "bg-slate-50/50",
              )}
            >
              <div className={cn("flex", "items-center", "gap-4")}>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={cn(
                    "w-10",
                    "h-10",
                    "bg-slate-900",
                    "rounded-xl",
                    "flex",
                    "items-center",
                    "justify-center",
                    "text-primary",
                  )}
                >
                  <LuUserPlus className={cn("w-5", "h-5")} />
                </motion.div>
                <div>
                  <h3
                    className={cn(
                      "text-xl",
                      "font-black",
                      "text-slate-900",
                      "uppercase",
                      "tracking-tighter",
                    )}
                  >
                    Edit Identity
                  </h3>
                  <p
                    className={cn(
                      "text-[10px]",
                      "font-bold",
                      "text-slate-400",
                      "uppercase",
                      "tracking-widest",
                    )}
                  >
                    User Ref: {user?.id}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className={cn(
                  "p-2",
                  "hover:bg-slate-200",
                  "rounded-full",
                  "transition-colors",
                )}
              >
                <LuX className={cn("w-5", "h-5", "text-slate-400")} />
              </motion.button>
            </motion.div>

            <div
              className={cn(
                "p-10",
                "space-y-8",
                "overflow-y-auto",
                "max-h-[70vh]",
              )}
            >
              {/* 1. EditUserAvatarUpload */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className={cn("flex", "justify-center")}
              >
                <div className={cn("relative", "group")}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={cn(
                      "w-24",
                      "h-24",
                      "rounded-[2rem]",
                      "bg-slate-100",
                      "border-2",
                      "border-slate-200",
                      "overflow-hidden",
                    )}
                  >
                    <Image
                      height={300}
                      width={500}
                      src={user?.avatar || "/default-avatar.png"}
                      alt="Profile"
                      className={cn(
                        "w-full",
                        "h-full",
                        "object-cover",
                        "opacity-60",
                        "group-hover:opacity-40",
                        "transition-opacity",
                      )}
                    />
                  </motion.div>
                  <motion.button
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className={cn(
                      "absolute",
                      "inset-0",
                      "flex",
                      "flex-col",
                      "items-center",
                      "justify-center",
                      "transition-opacity",
                    )}
                  >
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <LuCamera
                        className={cn("w-6", "h-6", "text-slate-900")}
                      />
                    </motion.div>
                    <span
                      className={cn(
                        "text-[8px]",
                        "font-black",
                        "uppercase",
                        "mt-1",
                      )}
                    >
                      Change
                    </span>
                  </motion.button>
                </div>
              </motion.div>

              <div
                className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-6")}
              >
                {/* 2. EditUserNameInput */}
                <EditInput
                  label="Full Name"
                  icon={LuUser}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  delay={0.3}
                />

                {/* 3. EditUserEmailInput */}
                <EditInput
                  label="Email Address"
                  icon={LuMail}
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  delay={0.35}
                />

                {/* 4. EditUserPhoneInput */}
                <EditInput
                  label="Phone Number"
                  icon={LuPhone}
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  delay={0.4}
                />

                {/* 5. EditUserTypeSelect */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className={cn("space-y-2")}
                >
                  <label
                    className={cn(
                      "text-[10px]",
                      "font-black",
                      "uppercase",
                      "tracking-[0.2em]",
                      "text-slate-400",
                    )}
                  >
                    Registration Type
                  </label>
                  <div className={cn("relative")}>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as UserFormData["type"],
                        })
                      }
                      className={cn(
                        "w-full",
                        "bg-slate-50",
                        "border",
                        "border-slate-100",
                        "p-4",
                        "rounded-2xl",
                        "text-[11px]",
                        "font-black",
                        "uppercase",
                        "outline-none",
                        "focus:border-primary",
                        "appearance-none",
                        "cursor-pointer",
                        "transition-all",
                      )}
                    >
                      <option value="Student">Student</option>
                      <option value="Graduate">Graduate</option>
                      <option value="Professional">Professional</option>
                    </select>
                    <div
                      className={cn(
                        "absolute",
                        "right-4",
                        "top-1/2",
                        "-translate-y-1/2",
                        "pointer-events-none",
                      )}
                    >
                      <LuUserCheck
                        className={cn("w-4", "h-4", "text-slate-400")}
                      />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* 6. EditVerificationToggle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.01 }}
                className={cn(
                  "p-6",
                  "bg-slate-50",
                  "border",
                  "border-slate-100",
                  "rounded-3xl",
                  "flex",
                  "items-center",
                  "justify-between",
                  "group",
                )}
              >
                <div className={cn("flex", "items-center", "gap-4")}>
                  <motion.div
                    animate={
                      formData.isVerified
                        ? {
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0],
                          }
                        : {}
                    }
                    transition={{
                      duration: 0.5,
                    }}
                    className={cn(
                      "w-10",
                      "h-10",
                      "rounded-xl",
                      "flex",
                      "items-center",
                      "justify-center",
                      "transition-all",
                      "duration-300",
                      formData.isVerified
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-slate-200 text-slate-400",
                    )}
                  >
                    <LuShieldCheck className={cn("w-5", "h-5")} />
                  </motion.div>
                  <div>
                    <p
                      className={cn(
                        "text-[11px]",
                        "font-black",
                        "uppercase",
                        "tracking-widest",
                        "text-slate-900",
                      )}
                    >
                      Manual Verification
                    </p>
                    <p
                      className={cn(
                        "text-[9px]",
                        "font-bold",
                        "text-slate-400",
                        "uppercase",
                        "tracking-tighter",
                      )}
                    >
                      Bypass normal verification flow
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      isVerified: !formData.isVerified,
                    })
                  }
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "w-12",
                    "h-6",
                    "rounded-full",
                    "transition-colors",
                    "relative",
                    "focus:ring-2",
                    "focus:ring-primary/20",
                    "focus:ring-offset-2",
                    "outline-none",
                    formData.isVerified ? "bg-emerald-500" : "bg-slate-300",
                  )}
                >
                  <motion.div
                    animate={{
                      x: formData.isVerified ? 24 : 4,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={cn(
                      "absolute",
                      "top-1",
                      "w-4",
                      "h-4",
                      "bg-white",
                      "rounded-full",
                      "shadow-sm",
                    )}
                  >
                    {/* Indicator dot when verified */}
                    <AnimatePresence>
                      {formData.isVerified && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Ripple effect on toggle */}
                  <AnimatePresence>
                    {formData.isVerified && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0.5 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0 bg-emerald-500 rounded-full"
                      />
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            </div>

            {/* 7. Footer / SaveButton */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className={cn(
                "p-8",
                "bg-slate-50",
                "border-t",
                "border-slate-100",
                "flex",
                "items-center",
                "gap-4",
              )}
            >
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex-1",
                  "px-6",
                  "py-4",
                  "rounded-2xl",
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "text-slate-500",
                  "hover:bg-slate-100",
                  "transition-all",
                )}
              >
                Discard Changes
              </motion.button>
              <motion.button
                onClick={handleSave}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex-3",
                  "px-10",
                  "py-4",
                  "bg-slate-900",
                  "text-white",
                  "rounded-2xl",
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "hover:bg-primary",
                  "hover:text-slate-900",
                  "transition-all",
                  "shadow-xl",
                  "shadow-slate-900/10",
                  "flex",
                  "items-center",
                  "justify-center",
                  "gap-2",
                )}
              >
                <LuSave className={cn("w-4", "h-4")} />
                Update Profile
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* --- Helper Component --- */
const EditInput: React.FC<EditInputProps> = ({
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={cn("space-y-2")}
  >
    <label
      className={cn(
        "text-[10px]",
        "font-black",
        "uppercase",
        "tracking-[0.2em]",
        "text-slate-400",
      )}
    >
      {label}
    </label>
    <div className={cn("relative")}>
      <Icon
        className={cn(
          "absolute",
          "left-4",
          "top-1/2",
          "-translate-y-1/2",
          "w-4",
          "h-4",
          "text-slate-300",
        )}
      />
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={cn(
          "w-full",
          "bg-slate-50",
          "border",
          "border-slate-100",
          "p-4",
          "pl-12",
          "rounded-2xl",
          "text-[11px]",
          "font-bold",
          "text-slate-900",
          "outline-none",
          "focus:border-primary",
          "transition-all",
        )}
      />
    </div>
  </motion.div>
);

// Export types
export type { EditModalProps, UserData, UserFormData, EditInputProps };
