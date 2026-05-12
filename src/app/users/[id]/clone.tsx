"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  MapPin,
  Link as LinkIcon,
  Twitter,
  Github,
  Globe,
  Mail,
  Users,
  Award,
  Briefcase,
  Zap,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { cn } from "../../../lib/utils";

interface MemberProfile {
  id: string;
  fullName: { firstname: string; secondname?: string; lastname?: string };
  avatar: { imageUrl?: string; imageCloudName?: string } | string | null;
  role?: string;
  eduStatus?: string;
  membershipStatus?: string;
  committeeMembership?: { committee?: string; role?: string } | null;
  skills?: string[];
  verifiedSkills?: string[];
  profile?: { bio?: string; headline?: string } | null;
  email?: string;
  phone?: { countryCode?: number; phoneNumber?: number };
  location?: { country?: string; state?: string; city?: string; lga?: string };
  socials?: {
    twitter?: string;
    github?: string;
    portfolio?: string;
    linkedin?: string;
  };
  institution?: {
    name?: string;
    abbreviation?: string;
    faculty?: string;
    department?: string;
    level?: string;
    currentStatus?: string;
  } | null;
  createdAt?: string;
  isPrivate?: boolean;
}

function resolveAvatarUrl(avatar: MemberProfile["avatar"]): string | null {
  if (!avatar) return null;
  if (typeof avatar === "string") return avatar;
  return avatar.imageUrl ?? null;
}

// ── Private profile wall ──────────────────────────────────────────────────────
function PrivateProfileWall({ profile }: { profile: MemberProfile }) {
  const avatarUrl = resolveAvatarUrl(profile.avatar);
  const displayName = [
    profile.fullName.firstname,
    profile.fullName.secondname,
    profile.fullName.lastname,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={cn('min-h-screen', 'pb-20')}>
      <div className={cn('relative', 'h-64', 'w-full', 'overflow-hidden', 'bg-gradient-to-br', 'from-primary/20', 'via-primary/5', 'to-background')}>
        <div className={cn('absolute', 'inset-0', 'bg-gradient-to-t', 'from-background', 'via-background/20', 'to-transparent')} />
      </div>

      <div className={cn('max-w-2xl', 'mx-auto', 'px-6', '-mt-24', 'relative', 'z-10', 'flex', 'flex-col', 'items-center', 'text-center')}>
        {/* Avatar */}
        <div className={cn('relative', 'w-32', 'h-32', 'mb-6')}>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              width={128}
              height={128}
              className={cn('w-full', 'h-full', 'rounded-3xl', 'object-cover', 'border-4', 'border-background', 'shadow-2xl')}
              alt={displayName}
            />
          ) : (
            <div className={cn('w-full', 'h-full', 'rounded-3xl', 'border-4', 'border-background', 'shadow-2xl', 'bg-primary/10', 'flex', 'items-center', 'justify-center', 'text-primary', 'text-4xl', 'font-black')}>
              {profile.fullName.firstname.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Lock overlay */}
          <div className={cn('absolute', '-bottom-2', '-right-2', 'bg-muted', 'border', 'border-border', 'text-muted-foreground', 'p-1.5', 'rounded-xl', 'shadow-lg')}>
            <Lock size={18} />
          </div>
        </div>

        <h1 className={cn('text-2xl', 'font-black', 'tracking-tight')}>{displayName}</h1>

        <div className={cn('mt-6', 'glass', 'p-8', 'rounded-[2rem]', 'space-y-3', 'w-full')}>
          <div className={cn('w-12', 'h-12', 'rounded-2xl', 'bg-muted', 'flex', 'items-center', 'justify-center', 'mx-auto')}>
            <Lock size={22} className="text-muted-foreground" />
          </div>
          <p className={cn('font-black', 'text-foreground')}>This profile is private</p>
          <p className={cn('text-sm', 'text-muted-foreground', 'leading-relaxed', 'max-w-sm', 'mx-auto')}>
            This user has set their account to private. Only people with a
            direct link shared by the user can view their full profile.
          </p>
        </div>
      </div>
    </main>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [viewerRole, setViewerRole] = useState<string>("public");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    // Fix: Use functional updates to prevent cascading render warnings
    // Only update state if it isn't already at the target value
    setLoading((prev) => (prev ? prev : true));
    setError((prev) => (prev === null ? prev : null));

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/member/${id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load profile");
        }

        if (isMounted) {
          setProfile(data.profile);
          setViewerRole(data.viewerRole);
          setIsPrivate(data.isPrivate ?? false);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          // TypeScript Guard: safely handle 'unknown' error type
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("An unexpected error occurred");
          }
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [id, setViewerRole]);

  if (loading) {
    return (
      <div className={cn('min-h-screen', 'flex', 'items-center', 'justify-center')}>
        <Loader2 className={cn('w-8', 'h-8', 'animate-spin', 'text-primary')} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={cn('min-h-screen', 'flex', 'flex-col', 'items-center', 'justify-center', 'gap-3', 'text-center', 'px-6')}>
        <p className={cn('text-2xl', 'font-black')}>Profile not found</p>
        <p className={cn('text-muted-foreground', 'text-sm')}>
          {error ?? "This user does not exist or their profile is private."}
        </p>
      </div>
    );
  }

  // Show private wall for non-admins/non-owners
  if (isPrivate) return <PrivateProfileWall profile={profile} />;

  // ── Full profile ──────────────────────────────────────────────────────────
  const avatarUrl = resolveAvatarUrl(profile.avatar);
  const displayName = [
    profile.fullName.firstname,
    profile.fullName.secondname,
    profile.fullName.lastname,
  ]
    .filter(Boolean)
    .join(" ");

  const typeColors: Record<string, string> = {
    participant: "text-emerald-500 bg-emerald-500/10",
    webmaster: "text-violet-500 bg-violet-500/10",
    admin: "text-orange-500 bg-orange-500/10",
    moderator: "text-blue-500 bg-blue-500/10",
  };

  const skills = profile.skills ?? [];
  const verifiedSkills = profile.verifiedSkills ?? [];

  const stats = [
    { label: "Skills", value: skills.length.toString(), icon: Briefcase },
    { label: "Verified", value: verifiedSkills.length.toString(), icon: Award },
    {
      label: "Member since",
      value: profile.createdAt
        ? new Date(profile.createdAt).getFullYear().toString()
        : "—",
      icon: Zap,
    },
  ];

  const twitter = profile.socials?.twitter;
  const github = profile.socials?.github;
  const website = profile.socials?.portfolio;
  const bio = profile.profile?.bio;
  const headline =
    profile.profile?.headline ??
    profile.committeeMembership?.role ??
    profile.role;

  // Format location
  const locationParts = [
    profile.location?.city,
    profile.location?.state,
    profile.location?.country,
  ].filter(Boolean);
  const locationStr = locationParts.join(", ");

  // Format phone
  const phoneStr = profile.phone?.phoneNumber
    ? `+${profile.phone.countryCode ?? ""} ${profile.phone.phoneNumber}`
    : null;

  // Inside your ProfilePage component return statement
  return (
    <main className={cn('min-h-screen', 'pt-32', 'pb-20', 'px-4', 'sm:px-6', 'relative', 'overflow-hidden')}>
      {/* Ambient background decoration */}
      <div className={cn('absolute', 'top-0', 'left-1/2', '-translate-x-1/2', 'w-full', 'max-w-4xl', 'h-96', 'bg-primary/10', 'blur-[120px]', '-z-10', 'rounded-full')} />

      <div className={cn('max-w-5xl', 'mx-auto', 'space-y-8')}>
        {/* ── Header Section ── */}
        <div className={cn('grid', 'grid-cols-1', 'lg:grid-cols-3', 'gap-8')}>
          {/* Profile Identity Card */}
          <div className={cn('lg:col-span-1', 'glass-heavy', 'glass-shine', 'rounded-[2.5rem]', 'p-8', 'flex', 'flex-col', 'items-center', 'text-center')}>
            <div className={cn('relative', 'group', 'mb-6')}>
              <div className={cn('absolute', 'inset-0', 'bg-primary/20', 'blur-2xl', 'rounded-full', 'scale-0', 'group-hover:scale-100', 'transition-transform', 'duration-500')} />
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  width={160}
                  height={160}
                  className={cn('w-40', 'h-40', 'rounded-[2.5rem]', 'object-cover', 'border-2', 'border-border/50', 'relative', 'z-10')}
                  alt={displayName}
                />
              ) : (
                <div className={cn('w-40', 'h-40', 'rounded-[2.5rem]', 'bg-primary/10', 'flex', 'items-center', 'justify-center', 'text-primary', 'text-5xl', 'font-black', 'relative', 'z-10')}>
                  {profile.fullName.firstname.charAt(0).toUpperCase()}
                </div>
              )}
              <Badge className={cn('absolute', '-bottom-2', 'left-1/2', '-translate-x-1/2', 'px-4', 'py-1.5', 'rounded-xl', 'bg-primary', 'text-primary-foreground', 'shadow-xl', 'border-none', 'font-bold', 'z-20')}>
                {profile.role || "Member"}
              </Badge>
            </div>

            <h1 className={cn('text-3xl', 'font-black', 'tracking-tight', 'mt-4')}>
              {displayName}
            </h1>
            <p className={cn('text-muted-foreground', 'font-medium', 'mt-1')}>
              {profile.profile?.headline || "DIUSCADI Community Member"}
            </p>

            <div className={cn('flex', 'gap-3', 'mt-6')}>
              {profile.socials?.github && (
                <a
                  href={profile.socials.github}
                  className={cn('p-3', 'glass', 'rounded-2xl', 'text-muted-foreground', 'hover:text-primary', 'transition-colors')}
                >
                  <Github size={20} />
                </a>
              )}
              {profile.socials?.twitter && (
                <a
                  href={profile.socials.twitter}
                  className={cn('p-3', 'glass', 'rounded-2xl', 'text-muted-foreground', 'hover:text-primary', 'transition-colors')}
                >
                  <Twitter size={20} />
                </a>
              )}
              <a
                href={`mailto:${profile.email}`}
                className={cn('p-3', 'glass', 'rounded-2xl', 'text-muted-foreground', 'hover:text-primary', 'transition-colors')}
              >
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* About & Stats Section */}
          <div className={cn('lg:col-span-2', 'space-y-6')}>
            <div className={cn('glass', 'rounded-[2.5rem]', 'p-8', 'h-full', 'flex', 'flex-col')}>
              <div className={cn('flex', 'items-center', 'gap-3', 'mb-6')}>
                <div className={cn('w-10', 'h-10', 'rounded-xl', 'bg-primary/10', 'flex', 'items-center', 'justify-center', 'text-primary')}>
                  <Zap size={20} />
                </div>
                <h2 className={cn('text-xl', 'font-black', 'uppercase', 'tracking-tight')}>
                  Biography
                </h2>
              </div>

              <p className={cn('text-muted-foreground', 'leading-relaxed', 'flex-grow')}>
                {profile.profile?.bio ||
                  "This user hasn't added a bio yet. They are a valued member of the DIUSCADI community focused on career development and innovation."}
              </p>

              <div className={cn('grid', 'grid-cols-2', 'sm:grid-cols-4', 'gap-4', 'mt-8', 'pt-8', 'border-t', 'border-border/30')}>
                {[
                  {
                    icon: MapPin,
                    label: "Location",
                    val: profile.location?.city || "Global",
                  },
                  {
                    icon: Briefcase,
                    label: "Committee",
                    val: profile.committeeMembership?.committee || "General",
                  },
                  {
                    icon: Award,
                    label: "Status",
                    val: profile.membershipStatus || "Active",
                  },
                  {
                    icon: Users,
                    label: "Joined",
                    val: new Date(profile.createdAt!).getFullYear(),
                  },
                ].map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <div className={cn('flex', 'items-center', 'gap-1.5', 'text-muted-foreground')}>
                      <stat.icon size={12} />
                      <span className={cn('text-[10px]', 'font-bold', 'uppercase', 'tracking-widest')}>
                        {stat.label}
                      </span>
                    </div>
                    <p className={cn('font-bold', 'text-sm', 'truncate')}>{stat.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs Section ── */}
        <Tabs defaultValue="skills" className="w-full">
          <TabsList className={cn('bg-transparent', 'gap-4', 'p-0', 'h-auto')}>
            {["skills", "activity", "portfolio"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className={cn('glass', 'data-[state=active]:bg-primary', 'data-[state=active]:text-primary-foreground', 'px-8', 'py-3', 'rounded-2xl', 'font-bold', 'transition-all')}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="skills" className="mt-6">
            <div className={cn('glass', 'p-8', 'rounded-[2.5rem]')}>
              <div className={cn('flex', 'flex-wrap', 'gap-3')}>
                {profile.skills?.map((skill) => (
                  <Badge
                    key={skill}
                    className={cn('glass', 'px-5', 'py-2.5', 'rounded-xl', 'border-none', 'font-medium', 'hover:bg-primary/5', 'transition-colors')}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
          {/* ... remaining tabs ... */}

          <TabsContent value="activity">
                          <div className={cn('glass', 'p-8', 'rounded-[2rem]', 'text-center', 'text-muted-foreground')}>
                            <Users size={40} className={cn('mx-auto', 'mb-4', 'opacity-20')} />
                            <p>No recent public activity to show.</p>
                          </div>
                        </TabsContent>
          
                        <TabsContent value="portfolio">
                          <div className={cn('glass', 'p-8', 'rounded-[2rem]', 'text-center', 'text-muted-foreground')}>
                            <Briefcase size={40} className={cn('mx-auto', 'mb-4', 'opacity-20')} />
                            <p>No portfolio items yet.</p>
                          </div>
                        </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
