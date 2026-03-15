"use client";
// app/home/profile/page.tsx
//
// Data sources:
//   UserContext    — profile (fullName, email, phone, avatar, location, bio,
//                             Institution, analytics, signupInviteCode,
//                             membershipStatus, createdAt, eduStatus, skills,
//                             committeeMembership, role, preferences)
//   AuthContext    — user.id (used as membership ID seed)
//   TicketContext  — tickets[] (derive ticketsOwned + upcomingEvents counts)
//
// refreshProfile() is called on mount so Institution, bio, and analytics
// are populated (they are omitted from the lightweight /me seed payload).

import React, { useEffect, useState, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { useAuth } from "@/context/AuthContext";
import { useTickets } from "@/context/TicketContext";
import { ImageUploader } from "@/components/ui/ImageUploader";

import { ProfileHeader } from "@/components/sections/profile/ProfileHeader";
import { ProfileSidebar } from "@/components/sections/profile/ProfileSideBar";
import { ProfileInfoSection } from "@/components/sections/profile/profileInfo";
import { ProfessionalInfoSection } from "@/components/sections/profile/ProInfoSection";
import { MembershipInfoSection } from "@/components/sections/profile/MembershipInfo";
import { ActivitySummarySection } from "@/components/sections/profile/ActivitySummary";
import { ProfileCompletionAlert } from "@/components/sections/profile/ProfileCompleteAlert";
import { cn } from "@/lib/utils";

// ── Skeleton ───────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <main className={cn('min-h-screen', 'mt-15', 'pb-20', 'animate-pulse')}>
      <div className={cn('w-full', 'border-b', 'border-border', 'h-40', 'bg-muted/30')} />
      <div className={cn('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'mt-8')}>
        <div className={cn('grid', 'grid-cols-1', 'lg:grid-cols-12', 'gap-8')}>
          <div className={cn('lg:col-span-4', 'xl:col-span-3', 'space-y-6')}>
            <div className={cn('h-80', 'rounded-[2.5rem]', 'bg-muted/50')} />
            <div className={cn('h-36', 'rounded-[2rem]', 'bg-muted/50')} />
            <div className={cn('h-56', 'rounded-[2.5rem]', 'bg-muted/50')} />
          </div>
          <div className={cn('lg:col-span-8', 'xl:col-span-9', 'space-y-6')}>
            <div className={cn('h-72', 'rounded-[2.5rem]', 'bg-muted/50')} />
            <div className={cn('h-56', 'rounded-[2.5rem]', 'bg-muted/50')} />
            <div className={cn('h-40', 'rounded-[2.5rem]', 'bg-muted/50')} />
            <div className={cn('grid', 'grid-cols-3', 'gap-4')}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn('h-36', 'rounded-[2rem]', 'bg-muted/50')} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { profile, isLoading, refreshProfile, updateProfile } = useUser();
  const { tickets, loadTickets } = useTickets();

  // Avatar upload panel visibility
  const [avatarPanelOpen, setAvatarPanelOpen] = useState(false);

  // Load full profile (Institution, bio, analytics) and tickets on mount
  useEffect(() => {
    refreshProfile();
    loadTickets();
  }, [refreshProfile, loadTickets]);

  // ── Save handlers ────────────────────────────────────────────────────────────

  const handleSaveName = useCallback(
    async (fullName: string) => {
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

  // ── Completion calculation ────────────────────────────────────────────────────
  // Fields we track: avatar, phone, bio

  const missingFields: string[] = [];
  if (!profile?.avatar) missingFields.push("Profile Photo");
  if (!profile?.phone) missingFields.push("Phone Number");
  if (!profile?.profile?.bio) missingFields.push("Bio");

  const completionPct = Math.round(((3 - missingFields.length) / 3) * 100);

  // ── Ticket-derived stats ──────────────────────────────────────────────────────
  // "registered" = upcoming (not yet checked in, not cancelled)
  const upcomingCount = tickets.filter((t) => t.status === "registered").length;
  const ownedCount = tickets.filter((t) => t.status !== "cancelled").length;

  const activityStats = {
    ticketsOwned: ownedCount,
    eventsAttended: profile?.analytics.eventsAttended ?? 0,
    upcomingEvents: upcomingCount,
  };

  // ── Guard ────────────────────────────────────────────────────────────────────

  if (isLoading || !profile) return <ProfileSkeleton />;

  return (
    <main className={cn('min-h-screen', 'mt-15', 'pb-20')}>
      {/* Page header */}
      <ProfileHeader
        completionPercentage={completionPct}
        onEditClick={() => setAvatarPanelOpen((v) => !v)}
      />

      <div className={cn('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8')}>
        {/* Incomplete profile alert */}
        <ProfileCompletionAlert
          isVisible={missingFields.length > 0}
          missingFields={missingFields}
          onAction={() => setAvatarPanelOpen(true)}
        />

        {/* Main two-column grid */}
        <div className={cn('grid', 'grid-cols-1', 'lg:grid-cols-12', 'gap-8', 'mt-8')}>
          {/* ── Sidebar ── */}
          <aside className={cn('lg:col-span-4', 'xl:col-span-3')}>
            <ProfileSidebar
              profile={profile}
              onEditAvatar={() => setAvatarPanelOpen(true)}
            />
          </aside>

          {/* ── Content area ── */}
          <div className={cn('lg:col-span-8', 'xl:col-span-9', 'space-y-8')}>
            {/* Avatar upload inline panel */}
            {avatarPanelOpen && (
              <div className={cn('glass', 'rounded-[2.5rem]', 'p-8', 'space-y-6')}>
                <div className={cn('flex', 'items-center', 'justify-between')}>
                  <h3 className={cn('text-lg', 'font-black', 'text-foreground', 'tracking-tight')}>
                    Update Profile Photo
                  </h3>
                  <button
                    onClick={() => setAvatarPanelOpen(false)}
                    className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-muted-foreground', 'hover:text-foreground', 'transition-colors', 'cursor-pointer')}
                  >
                    Close
                  </button>
                </div>
                <div className={cn('flex', 'justify-center')}>
                  <ImageUploader
                    uploadType="avatar"
                    currentUrl={profile.avatar}
                    shape="circle"
                    className="w-32"
                    onSuccess={async (url) => {
                      await updateProfile({ avatar: url });
                      setAvatarPanelOpen(false);
                    }}
                    onRemove={async () => {
                      await updateProfile({ avatar: undefined });
                    }}
                  />
                </div>
              </div>
            )}

            {/* 1. Personal info (name, email, phone, location, bio) */}
            <ProfileInfoSection
              profile={profile}
              onSaveName={handleSaveName}
              onSaveBio={handleSaveBio}
            />

            {/* 2. Academic / professional context */}
            <ProfessionalInfoSection
              eduStatus={profile.eduStatus}
              institution={profile.Institution}
            />

            {/* 3. Membership system data */}
            <MembershipInfoSection profile={profile} />

            {/* 4. Activity stats */}
            <ActivitySummarySection stats={activityStats} />
          </div>
        </div>
      </div>
    </main>
  );
}
