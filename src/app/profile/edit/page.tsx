"use client";
import React, { useState, useEffect } from "react";
import { EditProfileHeader } from "@/components/sections/profile/edit/EPHeader";
import { EditProfileSidebar } from "@/components/sections/profile/edit/EPSideBar";
import { ProfilePreviewCard } from "@/components/sections/profile/edit/ProfilePreviewCard";
import { ProfilePhotoSection } from "@/components/sections/profile/edit/ProfilePhoto";
import { BasicInfoSection } from "@/components/sections/profile/edit/BasicInfo";
import { ProfessionalInfoSection } from "@/components/sections/profile/edit/ProInfo";
import { ContactInfoSection } from "@/components/sections/profile/edit/ContactInfo";
import { SocialLinksSection } from "@/components/sections/profile/edit/SocialLink";
import { PreferencesSection } from "@/components/sections/profile/edit/Preferences";
import { SaveChangesSection } from "@/components/sections/profile/edit/SaveChanges";
import { toast, Toaster } from "react-hot-toast"; // For the Success Toast
import { cn } from "../../../lib/utils";
import { useUser } from "@/context/UserContext";

export default function EditProfilePage() {
  const { profile, updateProfile } = useUser();

  // 1. Central State for Live Preview & Tracking
  const [formData, setFormData] = useState({
    firstName: "Alexander",
    lastName: "Chidubem",
    username: "",
    bio: "",
    role: "Senior Fullstack Developer",
    organization: "TechNexus Africa",
    city: "Lagos, Nigeria",
    path: "DEVELOPER",
    image: null as string | null,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(new Date());
  const [activeSection, setActiveSection] = useState("basic");

  // Seed form preview from real profile when available
  useEffect(() => {
    if (!profile) return;

    const fullName = profile.fullName ?? "";
    const [firstName, ...rest] = fullName.split(" ").filter(Boolean);
    const lastName = rest.join(" ");

    const cityParts = [
      profile.location?.city,
      profile.location?.state,
      profile.location?.country,
    ].filter(Boolean);

    setFormData((prev) => ({
      ...prev,
      firstName: firstName || prev.firstName,
      lastName: lastName || prev.lastName,
      username: prev.username, // no username field in backend yet
      bio: profile.profile?.bio ?? prev.bio,
      role: prev.role, // keep design-specific role text for now
      organization: profile.Institution?.name ?? prev.organization,
      city: cityParts.join(", ") || prev.city,
      path: prev.path,
      image: profile.avatar ?? prev.image,
    }));
    setHasChanges(false);
  }, [profile]);

  // 2. Save Function — persists basic profile fields
  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

    const result = await updateProfile({
      fullName: fullName || profile.fullName,
      bio: formData.bio,
    });

    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to update profile");
      return;
    }

    setHasChanges(false);
    setLastSaved(new Date());

    toast.success("Profile Updated Successfully!", {
      style: {
        borderRadius: "20px",
        background: "#0f172a",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "12px",
        letterSpacing: "1px",
      },
    });
  };

  return (
    <main className={cn("min-h-screen w-full", "bg-background")}>
      <Toaster position="bottom-right" />

      {/* Premium Sticky Header */}
      <EditProfileHeader
        isSaving={isSaving}
        hasChanges={hasChanges}
        onSave={handleSave}
      />

      <div
        className={cn(
          "max-w-[1600px]",
          "mx-auto",
          "px-4",
          "sm:px-6",
          "lg:px-8",
          "py-10",
        )}
      >
        <div className={cn("grid", "grid-cols-1", "lg:grid-cols-12", "gap-8")}>
          {/* LEFT: Sidebar Nav (Col 2) */}
          <aside className={cn("hidden", "lg:block", "lg:col-span-2")}>
            <EditProfileSidebar
              activeSection={activeSection}
              completedSections={["photo", "basic", "pro"]}
              onSectionClick={(id) => {
                setActiveSection(id);
                document
                  .getElementById(id)
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            />
          </aside>

          {/* CENTER: Main Form (Col 7) */}
          <div className={cn("lg:col-span-7", "space-y-8")}>
            <div id="photo">
              <ProfilePhotoSection />
            </div>
            <div id="basic">
              <BasicInfoSection
                firstName={formData.firstName}
                lastName={formData.lastName}
                username={formData.username}
                bio={formData.bio}
                onChange={(patch) => {
                  setFormData((prev) => ({ ...prev, ...patch }));
                  setHasChanges(true);
                }}
              />
            </div>
            <div id="pro" onChange={() => setHasChanges(true)}>
              <ProfessionalInfoSection />
            </div>
            <div id="contact" onChange={() => setHasChanges(true)}>
              <ContactInfoSection />
            </div>
            <div id="social" onChange={() => setHasChanges(true)}>
              <SocialLinksSection />
            </div>
            <div id="prefs" onChange={() => setHasChanges(true)}>
              <PreferencesSection />
            </div>

            <SaveChangesSection
              isSaving={isSaving}
              lastSaved={lastSaved}
              hasChanges={hasChanges}
              onSave={handleSave}
              onCancel={() => window.location.reload()}
            />
          </div>

          {/* RIGHT: Live Preview (Col 3) */}
          <aside className={cn("hidden", "xl:block", "lg:col-span-3")}>
            <ProfilePreviewCard data={formData} />
          </aside>
        </div>
      </div>

      {/* MOBILE: Sticky Save Action */}
      <div
        className={cn(
          "lg:hidden",
          "fixed",
          "bottom-6",
          "left-4",
          "right-4",
          "z-50",
        )}
      >
        <button
          onClick={handleSave}
          className={cn(
            "w-full",
            "bg-foreground",
            "text-background",
            "py-5",
            "rounded-[2rem]",
            "font-black",
            "uppercase",
            "tracking-widest",
            "shadow-2xl",
            "flex",
            "items-center",
            "justify-center",
            "gap-3",
          )}
        >
          {isSaving ? "Syncing..." : "Save Profile"}
        </button>
      </div>
    </main>
  );
}
