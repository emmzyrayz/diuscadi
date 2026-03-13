"use client";
import React, { useState, useRef } from "react";
import {
  LuCamera,
  LuTrash2,
  LuCloudUpload,
  LuImage,
  LuCheck,
} from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export const ProfilePhotoSection = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <section className="bg-background border-2 border-border rounded-[2.5rem] p-8 md:p-10 shadow-sm transition-all hover:border-primary/20">
      {/* 1. Section Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-primary border border-border">
          <LuCamera className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-black text-foreground tracking-tight">
            Profile Identity
          </h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            This photo will appear on your digital event passes
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-10">
        {/* 2. Avatar Preview with Drag & Drop Wrapper */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
          }}
          className={`relative group w-48 h-48 rounded-[3rem] transition-all duration-500 overflow-hidden border-4 ${
            isDragging ? "border-primary scale-105" : "border-slate-50"
          }`}
        >
          {image ? (
            <>
              <Image
                height={300}
                width={500}
                src={image}
                alt="Profile"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                <button
                  onClick={() => setImage(null)}
                  className="p-3 bg-background/20 hover:bg-rose-500 text-background rounded-2xl transition-all"
                >
                  <LuTrash2 className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-muted flex flex-col items-center justify-center text-slate-300 gap-2 border-2 border-dashed border-border">
              <LuImage className="w-10 h-10" />
              <span className="text-[9px] font-black uppercase tracking-widest">
                No Image
              </span>
            </div>
          )}

          {/* Status Badge */}
          {image && (
            <div className="absolute bottom-4 right-4 bg-emerald-500 text-background p-1.5 rounded-xl shadow-lg border-2 border-background">
              <LuCheck className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* 3. Upload Controls */}
        <div className="flex-1 space-y-5">
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-sm font-black text-foreground uppercase">
              Update Photo
            </h4>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-xs">
              Drag and drop your image or use the button below. JPG, PNG or
              WEBP. Max 5MB.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-lg shadow-foreground/10"
            >
              <LuCloudUpload className="w-4 h-4" />
              Upload Image
            </button>

            {image && (
              <button
                onClick={() => setImage(null)}
                className="px-6 py-3 bg-background border border-border text-muted-foreground rounded-xl font-black text-[10px] uppercase tracking-widest hover:text-rose-600 hover:border-rose-100 transition-all"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
