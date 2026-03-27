"use client";
import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Users,
  Target,
  ShieldCheck,
  Milestone,
  Globe2,
  BookOpen,
  Award,
  TrendingUp,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

/* ─── Data ─────────────────────────────────────────────────────────────────── */

const team = [
  {
    name: "Dr. Adaora Nwosu",
    role: "Executive Director",
    image: "https://i.pravatar.cc/150?u=adaora",
    bio: "Former UNDP policy analyst with 14 years shaping digital-governance frameworks across West Africa.",
  },
  {
    name: "Emeka Okafor",
    role: "Head of Research",
    image: "https://i.pravatar.cc/150?u=emeka",
    bio: "PhD in Information Systems (UCL). Published researcher in AI ethics and inclusive technology design.",
  },
  {
    name: "Chisom Eze",
    role: "Director of Programmes",
    image: "https://i.pravatar.cc/150?u=chisom",
    bio: "15 years delivering youth-capacity programmes across Nigeria, Ghana, and Senegal.",
  },
  {
    name: "Ngozi Abiodun",
    role: "Communications Lead",
    image: "https://i.pravatar.cc/150?u=ngozi",
    bio: "Award-winning science communicator and former BBC Africa technology correspondent.",
  },
  {
    name: "Tunde Adeleke",
    role: "Chief Technology Officer",
    image: "https://i.pravatar.cc/150?u=tunde",
    bio: "Full-stack engineer and open-source maintainer. Leads DIUSCADI's digital infrastructure and tooling.",
  },
  {
    name: "Amaka Obi",
    role: "Partnerships Manager",
    image: "https://i.pravatar.cc/150?u=amaka",
    bio: "Broker of strategic alliances with universities, NGOs, and government bodies across 12 countries.",
  },
];

const milestones = [
  {
    year: "2016",
    title: "Founded in Abuja",
    desc: "DIUSCADI was established by a cohort of 22 digital practitioners committed to open-access research and civic technology.",
  },
  {
    year: "2018",
    title: "First Policy Brief",
    desc: "Our landmark report on broadband inclusion influenced Nigeria's National Digital Economy Policy and Strategy.",
  },
  {
    year: "2020",
    title: "Regional Expansion",
    desc: "Chapters launched in Accra, Lagos, and Nairobi, growing membership to over 1,400 professionals.",
  },
  {
    year: "2022",
    title: "DIUSCADI Platform Launch",
    desc: "We shipped our open-source collaboration platform, enabling members to co-author research and manage projects.",
  },
  {
    year: "2024",
    title: "UN Recognition",
    desc: "Named a UN ECOSOC-affiliated civil society organisation, strengthening our voice in global digital governance.",
  },
];

const values = [
  {
    icon: Target,
    title: "Mission",
    desc: "Advance equitable digital development by connecting practitioners, amplifying evidence-based policy, and building open tools for civic good.",
  },
  {
    icon: Lightbulb,
    title: "Vision",
    desc: "A continent where every community has the digital literacy, infrastructure, and agency to shape its own technological future.",
  },
  {
    icon: ShieldCheck,
    title: "Integrity",
    desc: "Our research is independent and peer-reviewed. We publish all findings openly, accepting no funding that restricts publication.",
  },
  {
    icon: Globe2,
    title: "Inclusion",
    desc: "Programmes designed around the most marginalised voices — rural, low-income, and differently-abled communities come first.",
  },
  {
    icon: Users,
    title: "Community",
    desc: "Over 3,200 members across 19 countries, united by shared standards of professional practice and mutual accountability.",
  },
  {
    icon: BookOpen,
    title: "Learning",
    desc: "Continuous education through fellowships, masterclasses, and a peer-reviewed digital journal published quarterly.",
  },
];

const stats = [
  { value: "3,200+", label: "Members" },
  { value: "19", label: "Countries" },
  { value: "48", label: "Published Reports" },
  { value: "12", label: "Partner Universities" },
];

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80 mb-3">
      <span className="w-6 h-px bg-primary/60 rounded-full" />
      {children}
      <span className="w-6 h-px bg-primary/60 rounded-full" />
    </span>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-32">
      {/* ── Hero ── */}
      <section className="relative text-center space-y-6 max-w-4xl mx-auto">
        {/* decorative ring */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full border border-primary/10 blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionLabel>About DIUSCADI</SectionLabel>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mt-2">
            Advancing <span className="text-primary">Digital Equity</span>{" "}
            Across Africa
          </h1>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.6 }}
          className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl mx-auto"
        >
          DIUSCADI is an independent, non-governmental research and
          capacity-building organisation. Since 2016 we have worked at the
          intersection of digital policy, civic technology, and professional
          development to ensure Africa&apos;s digital transformation leaves no one
          behind.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-4 pt-2"
        >
          <a
            href="#mission"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Our Mission <ArrowRight size={16} />
          </a>
          <a
            href="#team"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass font-semibold text-sm hover:bg-muted transition-colors"
          >
            Meet the Team
          </a>
        </motion.div>
      </section>

      {/* ── Stats Bar ── */}
      <FadeIn>
        <div className="glass rounded-3xl px-6 py-8 grid grid-cols-2 md:grid-cols-4 divide-x divide-border/60">
          {stats.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center px-4 gap-1"
            >
              <span className="text-3xl md:text-4xl font-black text-primary">
                {s.value}
              </span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* ── About / Origin Story ── */}
      <section className="grid md:grid-cols-2 gap-12 items-center">
        <FadeIn className="space-y-5">
          <SectionLabel>Our Story</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            Born from a simple conviction: access to technology is a right, not
            a privilege.
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            In 2016, a small group of information-systems researchers, software
            engineers, and public-policy advocates gathered in Abuja with a
            shared frustration — African voices were largely absent from the
            global conversations defining how digital infrastructure would be
            built and governed. DIUSCADI was their answer.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We began as a reading group of 22. Within two years, our first
            policy brief on rural broadband reached Nigeria&apos;s Ministry of
            Communications. Within five, we had chapters in three countries.
            Today, we are a recognised civil-society organisation influencing
            policy from Geneva to Lagos.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Our independence is non-negotiable. We accept no funding that
            constrains our research conclusions, and every report we publish is
            freely available under Creative Commons. The knowledge we generate
            belongs to the communities it is meant to serve.
          </p>
        </FadeIn>

        {/* stacked glass cards for visual interest */}
        <FadeIn delay={0.15} className="relative h-96 hidden md:block">
          <div className="glass rounded-3xl absolute inset-0 rotate-3 opacity-40" />
          <div className="glass rounded-3xl absolute inset-0 -rotate-2 opacity-60" />
          <div className="glass glass-shine rounded-3xl absolute inset-0 flex flex-col justify-end p-8 space-y-3">
            <Award size={36} className="text-primary" />
            <p className="text-xl font-bold leading-snug">
              &quot;Technology must empower communities, not merely reach them.&quot;
            </p>
            <p className="text-sm text-muted-foreground">
              — DIUSCADI Founding Charter, 2016
            </p>
          </div>
        </FadeIn>
      </section>

      {/* ── Mission / Vision / Values ── */}
      <section id="mission" className="space-y-10">
        <FadeIn className="text-center space-y-2">
          <SectionLabel>What We Stand For</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-bold">
            Mission, Vision & Values
          </h2>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {values.map((item, i) => (
            <FadeIn key={i} delay={i * 0.07}>
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="glass glass-shine rounded-3xl p-7 h-full space-y-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <item.icon size={22} />
                </div>
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── History Timeline ── */}
      <section className="space-y-10">
        <FadeIn className="text-center space-y-2">
          <SectionLabel>Our Journey</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-bold">A Decade of Impact</h2>
        </FadeIn>

        <div className="relative space-y-0">
          {/* vertical line */}
          <div className="absolute left-[calc(50%-1px)] top-0 bottom-0 w-px bg-border hidden md:block" />

          {milestones.map((m, i) => {
            const isLeft = i % 2 === 0;
            return (
              <FadeIn
                key={i}
                delay={i * 0.08}
                className="md:grid md:grid-cols-2 md:gap-10 relative mb-10 last:mb-0"
              >
                {/* left slot */}
                <div
                  className={cn(
                    "",
                    isLeft ? "md:pr-8 md:text-right" : "md:col-start-2 md:pl-8",
                  )}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="glass rounded-3xl p-6 space-y-2 inline-block w-full"
                  >
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">
                      {m.year}
                    </span>
                    <h4 className="text-lg font-bold">{m.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {m.desc}
                    </p>
                  </motion.div>
                </div>

                {/* centre dot — desktop */}
                <div className="absolute left-1/2 top-6 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background hidden md:block z-10" />

                {/* empty opposite slot */}
                {isLeft && <div className="hidden md:block" />}
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* ── Team ── */}
      <section id="team" className="space-y-10">
        <FadeIn className="text-center space-y-2">
          <SectionLabel>Leadership</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-bold">Meet the Team</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            A multidisciplinary team of researchers, engineers, communicators,
            and policy professionals united by a shared purpose.
          </p>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {team.map((member, i) => (
            <FadeIn key={i} delay={i * 0.07}>
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 280, damping: 20 }}
                className="glass glass-shine rounded-3xl p-6 flex gap-5 items-start border-b-4 border-b-primary/20"
              >
                <Image
                  width={80}
                  height={80}
                  src={member.image}
                  alt={member.name}
                  className="w-16 h-16 rounded-2xl object-cover grayscale hover:grayscale-0 transition-all flex-shrink-0"
                />
                <div className="space-y-1.5">
                  <h4 className="font-bold text-sm leading-tight">
                    {member.name}
                  </h4>
                  <p className="text-xs text-primary font-semibold">
                    {member.role}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Partners / Affiliations ── */}
      <section className="space-y-8">
        <FadeIn className="text-center space-y-2">
          <SectionLabel>Affiliations</SectionLabel>
          <h2 className="text-3xl font-bold">
            Trusted by Leading Institutions
          </h2>
        </FadeIn>
        <FadeIn>
          <div className="glass rounded-3xl p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 items-center text-center">
              {[
                "United Nations ECOSOC",
                "African Union Commission",
                "World Bank Group",
                "Mozilla Foundation",
                "Internet Society",
                "GSMA",
                "Open Government Partnership",
                "Carnegie Endowment",
              ].map((partner, i) => (
                <div
                  key={i}
                  className="glass-subtle rounded-2xl px-4 py-4 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {partner}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── CTA ── */}
      <FadeIn>
        <div className="glass glass-shine rounded-3xl p-10 md:p-14 text-center space-y-5 relative overflow-hidden">
          {/* decorative blob */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl"
          />
          <TrendingUp size={36} className="text-primary mx-auto" />
          <h3 className="text-3xl md:text-4xl font-black">
            Ready to make an impact?
          </h3>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            Join over 3,200 practitioners shaping Africa&apos;s digital future.
            Membership is open to researchers, technologists, policymakers, and
            anyone committed to equitable digital development.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <a
              href="/auth"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Become a Member <ArrowRight size={16} />
            </a>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl glass font-semibold text-sm hover:bg-muted transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </FadeIn>
    </main>
  );
}
