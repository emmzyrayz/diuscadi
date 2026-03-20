"use client";
// components/ui/Avatar.tsx
//
// Renders a user avatar with automatic Cloudinary initials fallback.
// Never shows a broken image — always resolves to something meaningful.
//
// Usage:
//   <Avatar user={profile} size={48} className="rounded-full" />
//   <Avatar user={profile} size={128} shape="square" />

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl } from "@/utils/cloudinaryFallback";

interface AvatarUser {
  hasAvatar: boolean;
  avatar?: { imageUrl: string } | null;
  fullName: { firstname: string; secondname?: string; lastname: string };
}

interface AvatarProps {
  user: AvatarUser;
  size?: number; // px — used for both width/height and Cloudinary sizing
  shape?: "circle" | "square" | "rounded"; // default: circle
  className?: string;
}

export function Avatar({
  user,
  size = 40,
  shape = "circle",
  className,
}: AvatarProps) {
  const [errored, setErrored] = useState(false);

  // Primary URL — Cloudinary delivery or initials placeholder
  const primaryUrl = resolveAvatarUrl(user, size);

  // If even the Cloudinary URL fails (offline / blank asset missing),
  // fall back to a local SVG so the UI never shows a broken image icon.
  const fallbackUrl = "/images/avatars/default.png";

  const src = errored ? fallbackUrl : primaryUrl;

  const displayName = [
    user.fullName.firstname,
    user.fullName.secondname,
    user.fullName.lastname,
  ]
    .filter(Boolean)
    .join(" ");

  const shapeClass =
    shape === "circle"
      ? "rounded-full"
      : shape === "square"
        ? "rounded-none"
        : "rounded-2xl"; // "rounded"

  return (
    <div
      className={cn("overflow-hidden bg-muted shrink-0", shapeClass, className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={displayName || "User avatar"}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        onError={() => setErrored(true)}
      />
    </div>
  );
}
