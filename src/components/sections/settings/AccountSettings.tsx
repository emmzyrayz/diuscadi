"use client";
import React, { useState } from "react";
import {
  LuUserCog,
  LuMail,
  LuUser,
  LuShieldCheck,
  LuBadgeCheck,
  LuExternalLink,
  LuLoader,
  LuCheck,
} from "react-icons/lu";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import type { UserProfile } from "@/context/UserContext";

interface Props {
  profile: UserProfile | null;
}

const ROLE_LABELS: Record<string, string> = {
  participant: "Community Member",
  moderator: "Event Moderator",
  admin: "Platform Admin",
  webmaster: "Webmaster",
};

export const AccountSettingsSection = ({ profile }: Props) => {
  const { updateProfile } = useUser();

  // Inline edit states
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(profile?.fullName ?? "");
  const [savingName, setSavingName] = useState(false);

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue === profile?.fullName) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    const result = await updateProfile({ fullName: nameValue.trim() });
    setSavingName(false);
    setEditingName(false);
    if (result.success) {
      toast.success("Name updated!");
    } else {
      toast.error(result.error ?? "Update failed");
      setNameValue(profile?.fullName ?? "");
    }
  };

  const roleLabel = ROLE_LABELS[profile?.role ?? "participant"] ?? "Member";
  const isVerified = true; // Email verified on signup; backend enforces it
  const memberStatus = profile?.membershipStatus ?? "pending";

  return (
    <section
      className={cn(
        "bg-background",
        "border-2",
        "border-border",
        "rounded-[2.5rem]",
        "p-8",
        "md:p-10",
        "shadow-sm",
      )}
    >
      {/* Header */}
      <div className={cn("flex", "items-center", "gap-3", "mb-10")}>
        <div
          className={cn(
            "w-10",
            "h-10",
            "rounded-xl",
            "bg-muted",
            "flex",
            "items-center",
            "justify-center",
            "text-primary",
            "border",
            "border-border",
          )}
        >
          <LuUserCog className={cn("w-5", "h-5")} />
        </div>
        <div>
          <h3
            className={cn(
              "text-xl",
              "font-black",
              "text-foreground",
              "tracking-tight",
            )}
          >
            Account Settings
          </h3>
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
            Manage your core credentials and access
          </p>
        </div>
      </div>

      <div className={cn("flex", "flex-col", "gap-6")}>
        {/* Full Name */}
        <div
          className={cn(
            "group",
            "flex",
            "flex-col",
            "md:flex-row",
            "md:items-center",
            "justify-between",
            "p-6",
            "bg-muted",
            "rounded-3xl",
            "gap-4",
            "hover:bg-background",
            "border",
            "border-transparent",
            "hover:border-border",
            "transition-all",
          )}
        >
          <div className={cn("flex", "items-center", "gap-4")}>
            <div
              className={cn(
                "w-10",
                "h-10",
                "bg-background",
                "rounded-xl",
                "flex",
                "items-center",
                "justify-center",
                "text-muted-foreground",
              )}
            >
              <LuUser className={cn("w-5", "h-5")} />
            </div>
            <div>
              <p
                className={cn(
                  "text-[10px]",
                  "font-black",
                  "text-muted-foreground",
                  "uppercase",
                  "tracking-widest",
                )}
              >
                Full Name
              </p>
              {editingName ? (
                <input
                  autoFocus
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  className={cn(
                    "text-sm",
                    "font-bold",
                    "text-foreground",
                    "bg-transparent",
                    "border-b-2",
                    "border-primary",
                    "outline-none",
                    "w-full",
                    "mt-0.5",
                  )}
                />
              ) : (
                <p className={cn("text-sm", "font-bold", "text-slate-700")}>
                  {profile?.fullName ?? "—"}
                </p>
              )}
            </div>
          </div>
          {editingName ? (
            <div className={cn("flex", "gap-2")}>
              <button
                onClick={handleSaveName}
                disabled={savingName}
                className={cn(
                  "flex",
                  "items-center",
                  "gap-1.5",
                  "px-4",
                  "py-3",
                  "bg-foreground",
                  "text-background",
                  "rounded-xl",
                  "font-black",
                  "text-[10px]",
                  "uppercase",
                  "tracking-widest",
                  "hover:bg-primary",
                  "transition-all",
                  "cursor-pointer",
                  "disabled:opacity-50",
                )}
              >
                {savingName ? (
                  <LuLoader className={cn("w-3", "h-3", "animate-spin")} />
                ) : (
                  <LuCheck className={cn("w-3", "h-3")} />
                )}
                Save
              </button>
              <button
                onClick={() => {
                  setEditingName(false);
                  setNameValue(profile?.fullName ?? "");
                }}
                className={cn(
                  "px-4",
                  "py-3",
                  "bg-background",
                  "border",
                  "border-border",
                  "text-muted-foreground",
                  "rounded-xl",
                  "font-black",
                  "text-[10px]",
                  "uppercase",
                  "tracking-widest",
                  "hover:bg-muted",
                  "transition-all",
                  "cursor-pointer",
                )}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditingName(true);
                setNameValue(profile?.fullName ?? "");
              }}
              className={cn(
                "flex",
                "items-center",
                "justify-center",
                "gap-2",
                "px-6",
                "py-3",
                "bg-background",
                "border",
                "border-border",
                "text-foreground",
                "rounded-xl",
                "font-black",
                "text-[10px]",
                "uppercase",
                "tracking-widest",
                "hover:bg-foreground",
                "hover:text-background",
                "transition-all",
                "cursor-pointer",
              )}
            >
              Edit Name
            </button>
          )}
        </div>

        {/* Email */}
        <div
          className={cn(
            "group",
            "flex",
            "flex-col",
            "md:flex-row",
            "md:items-center",
            "justify-between",
            "p-6",
            "bg-muted",
            "rounded-3xl",
            "gap-4",
            "hover:bg-background",
            "border",
            "border-transparent",
            "hover:border-border",
            "transition-all",
          )}
        >
          <div className={cn("flex", "items-center", "gap-4")}>
            <div
              className={cn(
                "w-10",
                "h-10",
                "bg-background",
                "rounded-xl",
                "flex",
                "items-center",
                "justify-center",
                "text-muted-foreground",
              )}
            >
              <LuMail className={cn("w-5", "h-5")} />
            </div>
            <div>
              <p
                className={cn(
                  "text-[10px]",
                  "font-black",
                  "text-muted-foreground",
                  "uppercase",
                  "tracking-widest",
                )}
              >
                Email Address
              </p>
              <div className={cn("flex", "items-center", "gap-2")}>
                <span className={cn("text-sm", "font-bold", "text-slate-700")}>
                  {profile?.email ?? "—"}
                </span>
                {isVerified && (
                  <span
                    className={cn(
                      "flex",
                      "items-center",
                      "gap-1",
                      "px-2",
                      "py-0.5",
                      "bg-emerald-50",
                      "text-emerald-600",
                      "rounded",
                      "text-[9px]",
                      "font-black",
                      "uppercase",
                    )}
                  >
                    <LuShieldCheck className={cn("w-3", "h-3")} /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() =>
              toast("Email changes require re-verification — coming soon.", {
                icon: "ℹ️",
              })
            }
            className={cn(
              "flex",
              "items-center",
              "justify-center",
              "gap-2",
              "px-6",
              "py-3",
              "bg-background",
              "border",
              "border-border",
              "text-foreground",
              "rounded-xl",
              "font-black",
              "text-[10px]",
              "uppercase",
              "tracking-widest",
              "hover:bg-foreground",
              "hover:text-background",
              "transition-all",
              "cursor-pointer",
            )}
          >
            Change Email
          </button>
        </div>

        {/* Account tier */}
        <div
          className={cn(
            "flex",
            "flex-col",
            "md:flex-row",
            "md:items-center",
            "justify-between",
            "p-6",
            "bg-foreground",
            "rounded-3xl",
            "gap-4",
            "shadow-xl",
            "shadow-foreground/10",
          )}
        >
          <div className={cn("flex", "items-center", "gap-4")}>
            <div
              className={cn(
                "w-10",
                "h-10",
                "bg-background/10",
                "rounded-xl",
                "flex",
                "items-center",
                "justify-center",
                "text-primary",
              )}
            >
              <LuBadgeCheck className={cn("w-6", "h-6")} />
            </div>
            <div>
              <p
                className={cn(
                  "text-[10px]",
                  "font-black",
                  "text-primary",
                  "uppercase",
                  "tracking-widest",
                )}
              >
                Account Tier
              </p>
              <p
                className={cn(
                  "text-sm",
                  "font-bold",
                  "text-background",
                  "uppercase",
                  "tracking-tight",
                )}
              >
                {roleLabel} ·{" "}
                <span
                  className={cn(
                    "text-[10px]",
                    memberStatus === "approved"
                      ? "text-emerald-400"
                      : memberStatus === "suspended"
                        ? "text-rose-400"
                        : "text-muted-foreground",
                  )}
                >
                  {memberStatus.charAt(0).toUpperCase() + memberStatus.slice(1)}
                </span>
              </p>
            </div>
          </div>
          <button
            className={cn(
              "flex",
              "items-center",
              "justify-center",
              "gap-2",
              "px-6",
              "py-3",
              "bg-background/10",
              "text-background",
              "rounded-xl",
              "font-black",
              "text-[10px]",
              "uppercase",
              "tracking-widest",
              "hover:bg-background",
              "hover:text-foreground",
              "transition-all",
              "cursor-pointer",
            )}
          >
            View Benefits <LuExternalLink className={cn("w-3", "h-3")} />
          </button>
        </div>
      </div>
    </section>
  );
};
