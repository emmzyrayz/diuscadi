"use client";
import React from "react";
import { motion } from "framer-motion";
import { Users, Target, ShieldCheck } from "lucide-react";
import { cn } from "../../lib/utils";
import Image from "next/image";

const team = [
  {
    name: "Alex Rivera",
    role: "President",
    image: "https://i.pravatar.cc/150?u=alex",
  },
  {
    name: "Sarah Chen",
    role: "Technical Lead",
    image: "https://i.pravatar.cc/150?u=sarah",
  },
  {
    name: "James Wilson",
    role: "Operations",
    image: "https://i.pravatar.cc/150?u=james",
  },
  {
    name: "Maya Patel",
    role: "Communications",
    image: "https://i.pravatar.cc/150?u=maya",
  },
];

export default function AboutPage() {
  return (
    <main className={cn('min-h-screen', 'pt-24', 'pb-12', 'px-6', 'max-w-7xl', 'mx-auto', 'space-y-20')}>
      {/* Hero Section */}
      <section className={cn('text-center', 'space-y-4')}>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('text-4xl', 'md:text-6xl', 'font-black', 'tracking-tight')}
        >
          Building the <span className="text-primary">Future</span> Together
        </motion.h1>
        <p className={cn('text-muted-foreground', 'max-w-2xl', 'mx-auto', 'text-lg')}>
          DIUSCADI is a platform dedicated to fostering innovation,
          collaboration, and professional growth within our community.
        </p>
      </section>

      {/* Mission/Vision Cards */}
      <div className={cn('grid', 'md:grid-cols-3', 'gap-6')}>
        {[
          {
            icon: Target,
            title: "Mission",
            desc: "To provide members with the tools and network needed to excel in tech.",
          },
          {
            icon: ShieldCheck,
            title: "Values",
            desc: "Integrity, excellence, and a commitment to open-source collaboration.",
          },
          {
            icon: Users,
            title: "Community",
            desc: "A diverse group of thinkers and builders working on real-world impact.",
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn('glass', 'p-8', 'rounded-3xl', 'space-y-4')}
          >
            <div className={cn('w-12', 'h-12', 'rounded-2xl', 'bg-primary/10', 'flex', 'items-center', 'justify-center', 'text-primary')}>
              <item.icon size={24} />
            </div>
            <h3 className={cn('text-xl', 'font-bold')}>{item.title}</h3>
            <p className={cn('text-sm', 'text-muted-foreground', 'leading-relaxed')}>
              {item.desc}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Team Section */}
      <section className="space-y-10">
        <div className="text-center">
          <h2 className={cn('text-3xl', 'font-bold')}>Meet the Board</h2>
          <p className="text-muted-foreground">
            The hands behind the DIUSCADI platform.
          </p>
        </div>
        <div className={cn('grid', 'grid-cols-2', 'md:grid-cols-4', 'gap-6')}>
          {team.map((member, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className={cn('glass', 'p-4', 'rounded-3xl', 'text-center', 'space-y-4', 'border-b-4', 'border-b-primary/20')}
            >
              <Image
                width={500}
                height={300}
                src={member.image}
                alt={member.name}
                className={cn('w-24', 'h-24', 'rounded-2xl', 'mx-auto', 'object-cover', 'grayscale', 'hover:grayscale-0', 'transition-all')}
              />
              <div>
                <h4 className={cn('font-bold', 'text-sm')}>{member.name}</h4>
                <p className={cn('text-xs', 'text-primary', 'font-medium')}>
                  {member.role}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
