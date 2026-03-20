"use client";
import React from "react";
import {
  LuMail,
  LuPhone,
  LuGlobe,
  LuMapPin,
  LuLock,
  LuContact,
} from "react-icons/lu";
import { cn } from "../../../../lib/utils";
import { useUser } from "@/context/UserContext";

export const ContactInfoSection = () => {
  const { profile } = useUser();

  const email = profile?.email ?? "";
  const phone = profile?.phone
    ? `+${profile.phone.countryCode} ${profile.phone.phoneNumber}`
    : "";
  const country = profile?.location?.country ?? "";
  const cityState = [profile?.location?.city, profile?.location?.state]
    .filter(Boolean)
    .join(", ");

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
        "transition-all",
        "hover:border-primary/20",
      )}
    >
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
          <LuContact className={cn("w-5", "h-5")} />
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
            Contact Information
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
            Communication & Residency details
          </p>
        </div>
      </div>

      <div
        className={cn(
          "grid",
          "grid-cols-1",
          "md:grid-cols-2",
          "gap-x-8",
          "gap-y-8",
        )}
      >
        {/* Email — read-only, from UserContext */}
        <div className="space-y-2">
          <label
            className={cn(
              "text-[10px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-widest",
              "ml-1",
              "flex",
              "items-center",
              "gap-2",
            )}
          >
            Email Address <LuLock className={cn("w-2.5", "h-2.5")} />
          </label>
          <div className="relative">
            <LuMail
              className={cn(
                "absolute",
                "left-6",
                "top-1/2",
                "-translate-y-1/2",
                "text-muted-foreground",
                "w-4",
                "h-4",
              )}
            />
            <input
              type="email"
              value={email}
              readOnly
              className={cn(
                "w-full",
                "text-muted",
                "border-2",
                "border-border",
                "rounded-2xl",
                "pl-12",
                "pr-6",
                "py-4",
                "text-sm",
                "font-bold",
                "text-muted-foreground",
                "cursor-not-allowed",
              )}
            />
            <div
              className={cn(
                "absolute",
                "right-4",
                "top-1/2",
                "-translate-y-1/2",
                "bg-background",
                "px-2",
                "py-1",
                "rounded-md",
                "text-[8px]",
                "font-black",
                "text-emerald-600",
                "uppercase",
                "border",
                "border-emerald-100",
              )}
            >
              Verified
            </div>
          </div>
        </div>

        {/* Phone — read-only, from UserContext (set at signup) */}
        <div className="space-y-2">
          <label
            className={cn(
              "text-[10px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-widest",
              "ml-1",
              "flex",
              "items-center",
              "gap-2",
            )}
          >
            Phone Number <LuLock className={cn("w-2.5", "h-2.5")} />
          </label>
          <div className="relative">
            <LuPhone
              className={cn(
                "absolute",
                "left-6",
                "top-1/2",
                "-translate-y-1/2",
                "text-muted-foreground",
                "w-4",
                "h-4",
              )}
            />
            <input
              type="tel"
              value={phone}
              readOnly
              placeholder="Not set"
              className={cn(
                "w-full",
                "text-muted",
                "border-2",
                "border-border",
                "rounded-2xl",
                "pl-12",
                "pr-6",
                "py-4",
                "text-sm",
                "font-bold",
                "text-muted-foreground",
                "cursor-not-allowed",
              )}
            />
          </div>
        </div>

        {/* Country — read-only display from UserContext */}
        <div className="space-y-2">
          <label
            className={cn(
              "text-[10px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-widest",
              "ml-1",
            )}
          >
            Country
          </label>
          <div className="relative">
            <LuGlobe
              className={cn(
                "absolute",
                "left-6",
                "top-1/2",
                "-translate-y-1/2",
                "text-muted-foreground",
                "w-4",
                "h-4",
              )}
            />
            <input
              type="text"
              value={country}
              readOnly
              placeholder="Not set"
              className={cn(
                "w-full",
                "text-muted",
                "border-2",
                "border-border",
                "rounded-2xl",
                "pl-12",
                "pr-6",
                "py-4",
                "text-sm",
                "font-bold",
                "text-muted-foreground",
                "cursor-not-allowed",
              )}
            />
          </div>
          <p
            className={cn(
              "text-[9px]",
              "text-muted-foreground",
              "font-bold",
              "ml-1",
            )}
          >
            Update location via Settings → Account
          </p>
        </div>

        {/* City / State — read-only display from UserContext */}
        <div className="space-y-2">
          <label
            className={cn(
              "text-[10px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-widest",
              "ml-1",
            )}
          >
            City / State
          </label>
          <div className="relative">
            <LuMapPin
              className={cn(
                "absolute",
                "left-6",
                "top-1/2",
                "-translate-y-1/2",
                "text-muted-foreground",
                "w-4",
                "h-4",
              )}
            />
            <input
              type="text"
              value={cityState}
              readOnly
              placeholder="Not set"
              className={cn(
                "w-full",
                "text-muted",
                "border-2",
                "border-border",
                "rounded-2xl",
                "pl-12",
                "pr-6",
                "py-4",
                "text-sm",
                "font-bold",
                "text-muted-foreground",
                "cursor-not-allowed",
              )}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
