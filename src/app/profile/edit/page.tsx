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

export default function EditProfilePage() {
  // 1. Central State for Live Preview & Tracking
  const [formData, setFormData] = useState({
    firstName: "Alexander",
    lastName: "Chidubem",
    role: "Senior Fullstack Developer",
    organization: "TechNexus Africa",
    city: "Lagos, Nigeria",
    path: "DEVELOPER",
    image: null,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(new Date());
  const [activeSection, setActiveSection] = useState("basic");

  // 2. Mock Save Function
  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API Call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSaving(false);
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
    <main className={cn('min-h-screen w-full', 'bg-[#F8FAFC]')}>
      <Toaster position="bottom-right" />

      {/* Premium Sticky Header */}
      <EditProfileHeader
        isSaving={isSaving}
        hasChanges={hasChanges}
        onSave={handleSave}
      />

      <div className={cn('max-w-[1600px]', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-10')}>
        <div className={cn('grid', 'grid-cols-1', 'lg:grid-cols-12', 'gap-8')}>
          {/* LEFT: Sidebar Nav (Col 2) */}
          <aside className={cn('hidden', 'lg:block', 'lg:col-span-2')}>
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
          <div className={cn('lg:col-span-7', 'space-y-8')}>
            <div id="photo">
              <ProfilePhotoSection />
            </div>
            <div id="basic" onChange={() => setHasChanges(true)}>
              <BasicInfoSection />
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
          <aside className={cn('hidden', 'xl:block', 'lg:col-span-3')}>
            <ProfilePreviewCard data={formData} />
          </aside>
        </div>
      </div>

      {/* MOBILE: Sticky Save Action */}
      <div className={cn('lg:hidden', 'fixed', 'bottom-6', 'left-4', 'right-4', 'z-50')}>
        <button
          onClick={handleSave}
          className={cn('w-full', 'bg-slate-900', 'text-white', 'py-5', 'rounded-[2rem]', 'font-black', 'uppercase', 'tracking-widest', 'shadow-2xl', 'flex', 'items-center', 'justify-center', 'gap-3')}
        >
          {isSaving ? "Syncing..." : "Save Profile"}
        </button>
      </div>
    </main>
  );
}
