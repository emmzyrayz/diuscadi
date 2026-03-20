"use client";
// components/sections/profile/edit/ProfilePhoto.tsx
//
// Uses the shared ImageUploader which handles the full Cloudinary pipeline:
// crop → sign → upload → confirm → DB persist.
// On success the confirm route sets hasAvatar=true on UserData.
// We call refreshProfile() to sync context — no updateProfile needed.

import React from "react";
import { LuCamera } from "react-icons/lu";
import { cn } from "../../../../lib/utils";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { useUser } from "@/context/UserContext";
import type { CloudinaryImage } from "@/types/cloudinary";

export const ProfilePhotoSection = () => {
  const { profile, refreshProfile } = useUser();

  const handleSuccess = async (_image: CloudinaryImage) => {
    // confirm route already persisted CloudinaryImage to MongoDB.
    // Refresh context so the preview card and sidebar update immediately.
    await refreshProfile();
  };

  const handleRemove = async () => {
    // remove route already cleared avatar + hasAvatar in MongoDB.
    await refreshProfile();
  };

  return (
    <section className="bg-background border-2 border-border rounded-[2.5rem] p-8 md:p-10 shadow-sm transition-all hover:border-primary/20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-primary border border-border">
          <LuCamera className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-black text-foreground tracking-tight">Profile Identity</h3>
          <p className={cn("text-[10px]", "font-bold", "text-muted-foreground", "uppercase", "tracking-widest", "mt-1")}>
            This photo will appear on your digital event passes
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-10">
        <div className="w-48">
          <ImageUploader
            uploadType="avatar"
            currentUrl={profile?.avatar?.imageUrl     ?? null}
            currentPublicId={profile?.avatar?.imagePublicId ?? null}
            shape="circle"
            aspectHint="400 × 400"
            label="Profile photo"
            cropLabel="Crop your photo"
            onSuccess={handleSuccess}
            onRemove={handleRemove}
          />
        </div>
        <div className="flex-1 space-y-3 text-center md:text-left">
          <h4 className="text-sm font-black text-foreground uppercase">Update Photo</h4>
          <p className={cn("text-xs", "text-muted-foreground", "font-medium", "leading-relaxed", "max-w-xs")}>
            Drag and drop your image or use the upload button. JPG, PNG or WEBP. Max 5 MB.
            Your photo is stored securely on Cloudinary and linked to your identity pass.
          </p>
        </div>
      </div>
    </section>
  );
};