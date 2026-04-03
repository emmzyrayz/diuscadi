"use client";
// app/profile/page.tsx

import React, { useEffect, useState, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { useTickets } from "@/context/TicketContext";
import { ImageUploader } from "@/components/ui/ImageUploader";
import type { CloudinaryImage } from "@/types/cloudinary";

import { ProfileHeader } from "@/components/sections/profile/ProfileHeader";
import { ProfileSidebar } from "@/components/sections/profile/ProfileSideBar";
import { ProfileInfoSection } from "@/components/sections/profile/profileInfo";
import { ProfessionalInfoSection } from "@/components/sections/profile/ProInfoSection";
import { MembershipInfoSection } from "@/components/sections/profile/MembershipInfo";
import { ActivitySummarySection } from "@/components/sections/profile/ActivitySummary";
import { ProfileCompletionAlert } from "@/components/sections/profile/ProfileCompleteAlert";
import { cn } from "@/lib/utils";
import { InviteCodeCard } from "@/components/sections/profile/InviteCodeCard";
import { useRouter } from "next/navigation";

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <main className={cn("min-h-screen", "mt-15", "pb-20", "animate-pulse")}>
      <div
        className={cn(
          "w-full",
          "border-b",
          "border-border",
          "h-40",
          "bg-muted/30",
        )}
      />
      <div
        className={cn(
          "max-w-7xl",
          "mx-auto",
          "px-4",
          "sm:px-6",
          "lg:px-8",
          "mt-8",
        )}
      >
        <div className={cn("grid", "grid-cols-1", "lg:grid-cols-12", "gap-8")}>
          <div className={cn("lg:col-span-4", "xl:col-span-3", "space-y-6")}>
            <div className={cn("h-80", "rounded-[2.5rem]", "bg-muted/50")} />
            <div className={cn("h-36", "rounded-[2rem]", "bg-muted/50")} />
            <div className={cn("h-56", "rounded-[2.5rem]", "bg-muted/50")} />
          </div>
          <div className={cn("lg:col-span-8", "xl:col-span-9", "space-y-6")}>
            <div className={cn("h-72", "rounded-[2.5rem]", "bg-muted/50")} />
            <div className={cn("h-56", "rounded-[2.5rem]", "bg-muted/50")} />
            <div className={cn("h-40", "rounded-[2.5rem]", "bg-muted/50")} />
            <div className={cn("grid", "grid-cols-3", "gap-4")}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn("h-36", "rounded-[2rem]", "bg-muted/50")}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { profile, isLoading, refreshProfile, updateProfile } = useUser();
  const { tickets, loadTickets } = useTickets();

  // Avatar modal — only opened from sidebar camera icon
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  useEffect(() => {
    refreshProfile();
    loadTickets();
  }, [refreshProfile, loadTickets]);

  // ── Save handlers ──────────────────────────────────────────────────────────

  // fullName is now a structured object — not a plain string
  const handleSaveName = useCallback(
    async (fullName: { firstname: string; secondname?: string; lastname: string }) => {
      await updateProfile({ fullName });
    },
    [updateProfile],
  );

  const handleSaveBio = useCallback(
    async (bio: string) => {
      await updateProfile({ bio });
    },
    [updateProfile],
  );

  // ── Avatar handlers ────────────────────────────────────────────────────────
  // The confirm route already persisted the CloudinaryImage to MongoDB.
  // Just refresh the profile to sync context — no updateProfile call needed.

    const handleAvatarSuccess = useCallback(
      async (_image: CloudinaryImage) => {
        await refreshProfile();
        setAvatarModalOpen(false);
      },
      [refreshProfile],
    );

    const handleAvatarRemove = useCallback(async () => {
      await refreshProfile();
    }, [refreshProfile]);

  // ── Completion calculation ─────────────────────────────────────────────────
   const missingFields: string[] = [];
   if (!profile?.hasAvatar) missingFields.push("Profile Photo");
   if (!profile?.phone) missingFields.push("Phone Number");
   if (!profile?.profile?.bio) missingFields.push("Bio");

   const completionPct = Math.round(((3 - missingFields.length) / 3) * 100);

   // ── Ticket-derived stats ───────────────────────────────────────────────────

   const upcomingCount = tickets.filter(
     (t) => t.status === "registered",
   ).length;
   const ownedCount = tickets.filter((t) => t.status !== "cancelled").length;

   const activityStats = {
     ticketsOwned: ownedCount,
     eventsAttended: profile?.analytics.eventsAttended ?? 0,
     upcomingEvents: upcomingCount,
   };

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (isLoading || !profile) return <ProfileSkeleton />;

  return (
    <main className={cn("min-h-screen", "mt-15", "pb-20")}>
      <ProfileHeader
        completionPercentage={completionPct}
        onEditClick={() => router.push("/profile/edit")}
      />

      {/* Avatar modal — only opened from sidebar */}
      {/* <AvatarUploadModal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        currentUrl={profile.avatar?.imageUrl ?? null}
        currentPublicId={profile.avatar?.imagePublicId ?? null}
        onSuccess={handleAvatarSuccess}
        onRemove={handleAvatarRemove}
      /> */}

      <div className={cn("max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8")}>
        <ProfileCompletionAlert
          isVisible={missingFields.length > 0}
          missingFields={missingFields}
          onAction={() => router.push("/profile/edit")}
        />

        <div
          className={cn(
            "grid",
            "grid-cols-1",
            "lg:grid-cols-12",
            "gap-8",
            "mt-8",
          )}
        >
          {/* ── Sidebar ── */}
          <aside className={cn("lg:col-span-4", "xl:col-span-3")}>
            <ProfileSidebar
              profile={profile}
              onEditAvatar={() => setAvatarModalOpen(true)}
            />
          </aside>

          {/* ── Content area ── */}
          <div className={cn("lg:col-span-8", "xl:col-span-9", "space-y-8")}>
            {/* Avatar upload panel */}
            {avatarModalOpen && (
              <div
                className={cn("glass", "rounded-[2.5rem]", "p-8", "space-y-6")}
              >
                <div className={cn("flex", "items-center", "justify-between")}>
                  <h3
                    className={cn(
                      "text-lg",
                      "font-black",
                      "text-foreground",
                      "tracking-tight",
                    )}
                  >
                    Update Profile Photo
                  </h3>
                  <button
                    onClick={() => setAvatarModalOpen(false)}
                    className={cn(
                      "text-[10px]",
                      "font-black",
                      "uppercase",
                      "tracking-widest",
                      "text-muted-foreground",
                      "hover:text-foreground",
                      "transition-colors",
                      "cursor-pointer",
                    )}
                  >
                    Close
                  </button>
                </div>
                <div className={cn("flex w-full h-full", "justify-center")}>
                  <ImageUploader
                    uploadType="avatar"
                    currentUrl={profile.avatar?.imageUrl ?? null}
                    currentPublicId={profile.avatar?.imagePublicId ?? null}
                    shape="circle"
                    className="w-32"
                    onSuccess={handleAvatarSuccess}
                    onRemove={handleAvatarRemove}
                  />
                </div>
              </div>
            )}

            <InviteCodeCard inviteCode={profile.signupInviteCode} />

            <ProfileInfoSection
              key={profile.updatedAt} // ← add this
              profile={profile}
              onSaveName={handleSaveName}
              onSaveBio={handleSaveBio}
            />

            <ProfessionalInfoSection
              eduStatus={profile.eduStatus}
              institution={profile.Institution}
            />

            <MembershipInfoSection profile={profile} />
            <ActivitySummarySection stats={activityStats} />
          </div>
        </div>
      </div>
    </main>
  );
}
