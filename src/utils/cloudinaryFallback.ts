// lib/utils/cloudinaryFallback.ts
// ─────────────────────────────────────────────────────────────────────────────
// Fallback image URL generators using Cloudinary's transformation API.
// When a user has no avatar, or an event has no banner, we generate a
// branded placeholder using Cloudinary — no external service needed.
//
// All functions are pure — no DB or API calls.
// ─────────────────────────────────────────────────────────────────────────────

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

// ─── Colour palette for initials avatars ─────────────────────────────────────
// Rotated by the sum of char codes in the name so the same name always
// gets the same colour — deterministic, no DB field needed.

const AVATAR_COLORS = [
  "1e293b", // slate-800
  "166534", // green-800
  "1e3a5f", // blue-900
  "4c1d95", // violet-900
  "7c2d12", // orange-900
  "831843", // pink-900
  "134e4a", // teal-900
  "312e81", // indigo-900
];

function pickColor(seed: string): string {
  const sum = seed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function getInitials(name: {
  firstname: string;
  secondname?: string;
  lastname: string;
}): string {
  const first = name.firstname?.[0]?.toUpperCase() ?? "";
  const last = name.lastname?.[0]?.toUpperCase() ?? "";
  return first + last || "?";
}

// ─── Avatar fallback ──────────────────────────────────────────────────────────

/**
 * Returns a Cloudinary URL that renders a coloured circle with the user's
 * initials. Used when `hasAvatar` is false.
 *
 * Requires a 1×1 transparent base image uploaded to your Cloudinary account
 * at public_id: "diuscadi/assets/blank" (any tiny image works as the canvas).
 *
 * @example
 * buildInitialsAvatarUrl({ firstname: "Emmanuel", lastname: "Chidi" })
 * // → "https://res.cloudinary.com/.../w_400,h_400,c_fill,b_rgb:1e293b/..."
 */
export function buildInitialsAvatarUrl(
  name: { firstname: string; secondname?: string; lastname: string },
  size = 400,
): string {
  if (!CLOUD_NAME) return "/images/avatars/default.png";

  const initials = getInitials(name);
  const color = pickColor(name.firstname + name.lastname);
  const fontSize = Math.round(size * 0.38);

  // Cloudinary transformation chain:
  // 1. Resize blank canvas to target size, fill with brand colour
  // 2. Overlay white initials text centered
  const transform = [
    `w_${size},h_${size},c_fill,b_rgb:${color}`,
    `l_text:Arial_${fontSize}_bold:${encodeURIComponent(initials)},co_rgb:ffffff,g_center`,
    "f_webp,q_auto",
  ].join("/");

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transform}/diuscadi/assets/blank`;
}

/**
 * Resolves the best avatar URL for a user.
 * Returns the Cloudinary delivery URL if they have an avatar,
 * otherwise returns a generated initials placeholder.
 */
export function resolveAvatarUrl(
  user: {
    hasAvatar: boolean;
    avatar?: { imageUrl: string } | null;
    fullName: { firstname: string; secondname?: string; lastname: string };
  },
  size = 400,
): string {
  if (user.hasAvatar && user.avatar?.imageUrl) {
    return user.avatar.imageUrl;
  }
  return buildInitialsAvatarUrl(user.fullName, size);
}

// ─── Event image fallback ─────────────────────────────────────────────────────

/**
 * Resolves the best image URL for an event.
 * Priority: banner → logo → Cloudinary branded placeholder → local fallback.
 */
export function resolveEventImageUrl(event: {
  hasEventBanner?: boolean;
  eventBanner?: { imageUrl: string } | null;
  hasEventLogo?: boolean;
  eventLogo?: { imageUrl: string } | null;
  title?: string;
}): string {
  if (event.hasEventBanner && event.eventBanner?.imageUrl) {
    return event.eventBanner.imageUrl;
  }
  if (event.hasEventLogo && event.eventLogo?.imageUrl) {
    return event.eventLogo.imageUrl;
  }

  // Cloudinary text-on-gradient placeholder for events with no images yet
  if (CLOUD_NAME && event.title) {
    const label = encodeURIComponent(event.title.slice(0, 24));
    const transform = [
      "w_1200,h_630,c_fill,b_rgb:0f172a",
      `l_text:Arial_48_bold:${label},co_rgb:facc15,g_center`,
      "f_webp,q_auto",
    ].join("/");
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transform}/diuscadi/assets/blank`;
  }

  return "/images/events/default.jpg";
}

// ─── Institution logo fallback ────────────────────────────────────────────────

/**
 * Resolves the best logo URL for an institution.
 * Falls back to a Cloudinary abbreviation-based placeholder.
 */
export function resolveInstitutionLogoUrl(institution: {
  hasLogo?: boolean;
  logo?: { imageUrl: string } | null;
  abbreviation?: string;
  name?: string;
}): string {
  if (institution.hasLogo && institution.logo?.imageUrl) {
    return institution.logo.imageUrl;
  }

  if (CLOUD_NAME) {
    const label = encodeURIComponent(
      (institution.abbreviation ?? institution.name ?? "?").slice(0, 6),
    );
    const transform = [
      "w_400,h_400,c_fill,b_rgb:1e3a5f",
      `l_text:Arial_80_bold:${label},co_rgb:ffffff,g_center`,
      "f_webp,q_auto",
    ].join("/");
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transform}/diuscadi/assets/blank`;
  }

  return "/images/institutions/default.png";
}
