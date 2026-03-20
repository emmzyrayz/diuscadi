"use client";
import React from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

// Mock Data Structure - In production, fetch this based on params.id
const profileData = {
  id: "1",
  type: "member", // options: "member" | "partner" | "team"
  name: "Diuscadi Innovator",
  role: "Senior Full Stack Developer",
  avatar: "https://i.pravatar.cc/150?u=diuscadi",
  coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
  bio: "Passionate about building decentralized systems and fostering community growth through open-source contribution.",
  location: "Lagos, NG",
  website: "https://diuscadi.org",
  stats: [
    { label: "Projects", value: "12", icon: Briefcase },
    { label: "Events", value: "45", icon: Zap },
    { label: "Points", value: "2.4k", icon: Award },
  ],
  skills: ["React", "Node.js", "Solidity", "UI/UX"],
  isVerified: true,
};

export default function ProfilePage({ params }: { params: { id: string } }) {
  // Logic to determine badge color based on type
  const typeColors: Record<string, string> = {
    member: "text-emerald-500 bg-emerald-500/10",
    partner: "text-violet-500 bg-violet-500/10",
    team: "text-orange-500 bg-orange-500/10",
  };

  return (
    <main className="min-h-screen pb-20">
      {/* 1. Header / Cover Image */}
      <div className="relative h-64 w-full overflow-hidden">
        <Image
          height={300}
          width={500}
          src={profileData.coverImage}
          className="w-full h-full object-cover blur-[2px] scale-105"
          alt="cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-24 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* 2. Left Sidebar: Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-heavy w-full md:w-80 p-6 rounded-[2.5rem] border-t-4 border-t-primary shrink-0"
          >
            <div className="relative w-32 h-32 mx-auto -mt-20 mb-4">
              <Image
                height={300}
                width={500}
                src={profileData.avatar}
                className="w-full h-full rounded-3xl object-cover border-4 border-background shadow-2xl"
                alt={profileData.name}
              />
              {profileData.isVerified && (
                <div className="absolute -bottom-2 -right-2 bg-primary text-white p-1.5 rounded-xl shadow-lg">
                  <BadgeCheck size={20} />
                </div>
              )}
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-2xl font-black tracking-tight">
                {profileData.name}
              </h1>
              <Badge
                className={`uppercase text-[10px] tracking-widest px-3 py-1 ${typeColors[profileData.type]}`}
              >
                {profileData.type}
              </Badge>
              <p className="text-sm text-muted-foreground pt-2">
                {profileData.bio}
              </p>
            </div>

            <div className="mt-6 space-y-3 pt-6 border-t border-border/50">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin size={16} className="text-primary" />{" "}
                {profileData.location}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <LinkIcon size={16} className="text-primary" />
                <a
                  href={profileData.website}
                  className="hover:text-primary transition-colors"
                >
                  Website
                </a>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-8">
              <Button
                size="icon"
                variant="outline"
                className="glass rounded-xl"
              >
                <Twitter size={18} />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="glass rounded-xl"
              >
                <Github size={18} />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="glass rounded-xl"
              >
                <Mail size={18} />
              </Button>
            </div>

            <Button className="w-full mt-6 h-12 rounded-2xl font-bold shadow-lg shadow-primary/20">
              Contact {profileData.type === "member" ? "Member" : "Entity"}
            </Button>
          </motion.div>

          {/* 3. Main Content: Tabs & Data */}
          <div className="flex-1 w-full space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {profileData.stats.map((stat, i) => (
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

            {/* Content Tabs */}
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
                    {profileData.name} has been an active part of the DIUSCADI
                    ecosystem since 2024. They specialize in{" "}
                    {profileData.skills.join(", ")} and have contributed to
                    various high-impact community projects.
                  </p>
                </div>

                <div className="glass p-8 rounded-[2rem] space-y-4">
                  <h3 className="font-bold text-lg">Technical Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {profileData.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="glass px-4 py-1.5 rounded-lg border-none"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity">
                <div className="glass p-8 rounded-[2rem] text-center text-muted-foreground">
                  <Users size={40} className="mx-auto mb-4 opacity-20" />
                  <p>No recent public activity to show.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  );
}
