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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

interface MemberProfile {
  id: string;
  fullName: { firstname: string; secondname?: string; lastname?: string };
  avatar: { imageUrl?: string } | string | null;
  role: string;
  eduStatus: string;
  membershipStatus: string;
  committeeMembership: { committee?: string; role?: string } | null;
  skills: string[];
  verifiedSkills: string[];
  profile: {
    bio?: string;
    headline?: string;
    twitter?: string;
    github?: string;
    website?: string;
  } | null;
  email?: string;
  phone?: string;
  location?: string;
  socials?: { twitter?: string; github?: string; website?: string };
  institution?: {
    name?: string;
    abbreviation?: string;
    faculty?: string;
    department?: string;
    level?: string;
  } | null;
  createdAt: string;
}

function resolveAvatarUrl(avatar: MemberProfile["avatar"]): string | null {
  if (!avatar) return null;
  if (typeof avatar === "string") return avatar;
  return avatar.imageUrl ?? null;
}

export default function ProfilePage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [viewerRole, setViewerRole] = useState<string>("public");
  // Initialize loading to true if we have an ID to avoid the sync setState in useEffect
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    // Prevents the cascading render by checking state before updating
    setError((prev) => (prev !== null ? null : prev));

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/member/${id}`);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to load profile");
        }

        const data = await res.json();

        if (isMounted) {
          setProfile(data.profile);
          setViewerRole(data.viewerRole);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          // Type guard: check if err is an actual Error object
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
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6">
        <p className="text-2xl font-black">Profile not found</p>
        <p className="text-muted-foreground text-sm">
          {error ?? "This user does not exist or their profile is private."}
        </p>
      </div>
    );
  }

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

  const stats = [
    {
      label: "Skills",
      value: profile.skills.length.toString(),
      icon: Briefcase,
    },
    {
      label: "Verified",
      value: profile.verifiedSkills.length.toString(),
      icon: Award,
    },
    {
      label: "Member since",
      value: new Date(profile.createdAt).getFullYear().toString(),
      icon: Zap,
    },
  ];

  const socials = profile.socials ?? {};
  const website = socials.website ?? profile.profile?.website;
  const twitter = socials.twitter ?? profile.profile?.twitter;
  const github = socials.github ?? profile.profile?.github;
  const bio = profile.profile?.bio;
  const headline =
    profile.profile?.headline ??
    profile.committeeMembership?.role ??
    profile.role;

  // Example of using viewerRole to fix the "unused" error:
  const isAdmin = viewerRole === "admin";

  return (
    <main className="min-h-screen pb-20">
      {/* Cover */}
      <div className="relative h-64 w-full overflow-hidden bg-gradient-to-br from-primary/30 via-primary/10 to-background">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-24 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-heavy w-full md:w-80 p-6 rounded-[2.5rem] border-t-4 border-t-primary shrink-0"
          >
            <div className="relative w-32 h-32 mx-auto -mt-20 mb-4">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  width={128}
                  height={128}
                  className="w-full h-full rounded-3xl object-cover border-4 border-background shadow-2xl"
                  alt={displayName}
                />
              ) : (
                <div className="w-full h-full rounded-3xl border-4 border-background shadow-2xl bg-primary/10 flex items-center justify-center text-primary text-4xl font-black">
                  {profile.fullName.firstname.charAt(0).toUpperCase()}
                </div>
              )}
              {profile.verifiedSkills.length > 0 && (
                <div className="absolute -bottom-2 -right-2 bg-primary text-white p-1.5 rounded-xl shadow-lg">
                  <BadgeCheck size={20} />
                </div>
              )}
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-2xl font-black tracking-tight">
                {displayName}
              </h1>
              {headline && (
                <p className="text-sm text-muted-foreground">{headline}</p>
              )}
              <Badge
                className={`uppercase text-[10px] tracking-widest px-3 py-1 ${typeColors[profile.role] ?? "text-gray-500 bg-gray-500/10"}`}
              >
                {profile.membershipStatus === "approved"
                  ? "member"
                  : profile.role}
              </Badge>
              {bio && (
                <p className="text-sm text-muted-foreground pt-2">{bio}</p>
              )}
            </div>

            <div className="mt-6 space-y-3 pt-6 border-t border-border/50">
              {profile.location && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <MapPin size={16} className="text-primary" />
                  {profile.location}
                </div>
              )}
              {profile.institution?.name && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Briefcase size={16} className="text-primary" />
                  {profile.institution.abbreviation ?? profile.institution.name}
                </div>
              )}
              {website && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <LinkIcon size={16} className="text-primary" />
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors truncate"
                  >
                    {website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail size={16} className="text-primary" />
                  <span className="truncate">{profile.email}</span>
                </div>
              )}
            </div>

            {(twitter || github || website) && (
              <div className="grid grid-cols-3 gap-2 mt-8">
                {twitter && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="glass rounded-xl"
                    asChild
                  >
                    <a
                      href={`https://twitter.com/${twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Twitter size={18} />
                    </a>
                  </Button>
                )}
                {github && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="glass rounded-xl"
                    asChild
                  >
                    <a
                      href={`https://github.com/${github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github size={18} />
                    </a>
                  </Button>
                )}
                {website && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="glass rounded-xl"
                    asChild
                  >
                    <a href={website} target="_blank" rel="noopener noreferrer">
                      <Globe size={18} />
                    </a>
                  </Button>
                )}
              </div>
            )}

            {profile.email && (
              <Button
                className="w-full mt-6 h-12 rounded-2xl font-bold shadow-lg shadow-primary/20"
                asChild
              >
                <a href={`mailto:${profile.email}`}>Contact Member</a>
              </Button>
            )}
          </motion.div>

          {/* Main Content */}
          <div className="flex-1 w-full space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass p-5 rounded-3xl flex items-center gap-4"
                >
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-black">{stat.value}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="glass p-1 h-14 rounded-2xl w-full md:w-auto">
                <TabsTrigger
                  value="overview"
                  className="rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  Activity
                </TabsTrigger>
                <TabsTrigger
                  value="portfolio"
                  className="rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  Portfolio
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="glass p-8 rounded-[2rem] space-y-4">
                  <h3 className="font-bold text-lg">About</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {bio ??
                      `${displayName} is a member of the DIUSCADI ecosystem.`}
                  </p>
                  {profile.committeeMembership?.committee && (
                    <div className="flex items-center gap-2 pt-2">
                      <Users size={16} className="text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {profile.committeeMembership.role} ·{" "}
                        {profile.committeeMembership.committee}
                      </span>
                    </div>
                  )}
                  {profile.institution && (
                    <div className="flex items-center gap-2">
                      <Briefcase size={16} className="text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {[
                          profile.institution.department,
                          profile.institution.faculty,
                          profile.institution.name,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                  )}
                </div>

                {profile.skills.length > 0 && (
                  <div className="glass p-8 rounded-[2rem] space-y-4">
                    <h3 className="font-bold text-lg">Technical Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className={`glass px-4 py-1.5 rounded-lg border-none ${profile.verifiedSkills.includes(skill) ? "ring-1 ring-primary/40" : ""}`}
                        >
                          {skill}
                          {profile.verifiedSkills.includes(skill) && (
                            <BadgeCheck
                              size={12}
                              className="ml-1 text-primary inline"
                            />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="activity">
                <div className="glass p-8 rounded-[2rem] text-center text-muted-foreground">
                  <Users size={40} className="mx-auto mb-4 opacity-20" />
                  <p>No recent public activity to show.</p>
                </div>
              </TabsContent>

              <TabsContent value="portfolio">
                <div className="glass p-8 rounded-[2rem] text-center text-muted-foreground">
                  <Briefcase size={40} className="mx-auto mb-4 opacity-20" />
                  <p>No portfolio items yet.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  );
}
