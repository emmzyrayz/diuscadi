"use client";
import React, { useState } from "react";
import { ProfileHeader } from "@/components/sections/profile/ProfileHeader";
import { ProfileSidebar } from "@/components/sections/profile/ProfileSideBar";
import { ProfileInfoSection } from "@/components/sections/profile/profileInfo";
import { ProfessionalInfoSection } from "@/components/sections/profile/ProInfoSection";
import { MembershipInfoSection } from "@/components/sections/profile/MembershipInfo";
import { ActivitySummarySection } from "@/components/sections/profile/ActivitySummary";
import { ProfileCompletionAlert } from "@/components/sections/profile/ProfileCompleteAlert";

export default function ProfilePage() {
  // Mock State: In production, fetch this from your Auth/Database provider
  const [user, setUser] = useState({
    name: "Alexander Chidubem",
    email: "a.chidubem@example.com",
    phone: "", // Empty to trigger alert
    location: "Lagos, Nigeria",
    avatar: undefined, // Changed from null to undefined
    inviteCode: "A7K92Q",
    membershipStatus: "Premium",
    isVerified: true,
    professional: {
      status: "Graduate" as const,
      institution: "University of Lagos",
      fieldOfStudy: "Computer Science",
      company: "TechNexus Africa",
      jobTitle: "Solutions Architect",
    },
    membership: {
      memberSince: "Jan 2024",
      membershipId: "DIU-8829-X",
      verificationStatus: "Verified" as const,
      totalEventsAttended: 12,
    },
    activity: {
      ticketsOwned: 5,
      eventsAttended: 12,
      upcomingEvents: 2,
    },
  });

  // Logic for Profile Completion Alert
  const missingFields = [];
  if (!user.avatar) missingFields.push("Profile Photo");
  if (!user.phone) missingFields.push("Phone Number");
  const completionPercentage = user.avatar && user.phone ? 100 : 75;

  return (
    <main className="min-h-screen mt-15 bg-slate-50/50 pb-20">
      {/* 1. Header Section */}
      <ProfileHeader completionPercentage={completionPercentage} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 2. Critical Alert (Conditional) */}
        <ProfileCompletionAlert
          isVisible={completionPercentage < 100}
          missingFields={missingFields}
          onAction={() => console.log("Navigate to Edit Tab")}
        />

        {/* 3. Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* SIDEBAR (30% on Desktop) */}
          <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
            <ProfileSidebar user={user} />
          </aside>

          {/* CONTENT AREA (70% on Desktop) */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-8">
            <ProfileInfoSection
              user={{
                name: user.name,
                email: user.email,
                phone: user.phone,
                location: user.location,
                isVerified: user.isVerified,
              }}
              onEdit={() => {}}
            />

            <ProfessionalInfoSection data={user.professional} />

            <MembershipInfoSection data={user.membership} />

            <ActivitySummarySection stats={user.activity} />
          </div>
        </div>
      </div>
    </main>
  );
}