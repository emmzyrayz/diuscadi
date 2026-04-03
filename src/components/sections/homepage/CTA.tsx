"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuUsers,
  LuHeartHandshake,
  LuRocket,
  LuArrowRight,
  LuGift,
  LuShieldCheck,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

// ── TODO list for CTA actions ─────────────────────────────────────────────────
// 1. Refer a Friend   → /profile/referral page (not yet built)
//    - Show user's invite code from UserContext.profile.signupInviteCode
//    - Points credited via referral bonus in platform config
// 2. Verify Profile   → /profile/verification (not yet built)
//    - ID upload + school email verification flow
//    - Unlocks mentor sessions
// 3. Become a Mentor  → /applications?type=mentorship (not yet built)
//    - ApplicationContext needs "mentorship" added to ApplicationType union
//    - Add mentorship fields: expertise, availability, max mentees
// 4. Sponsor a Student → /applications?type=sponsorship (not yet built)
//    - External sponsors only — different flow from member applications
//    - May need a separate public /sponsor page
// 5. Advanced Fellowship → /programs/fellowship (not yet built)
//    - Program application flow, cohort management
// ─────────────────────────────────────────────────────────────────────────────

const ctaCards = [
  {
    title: "Become a Mentor",
    desc: "Share your professional journey and guide the next generation of tech talent.",
    icon: <LuUsers className={cn('w-8', 'h-8')} />,
    cta: "Apply to Lead",
    variant: "orange",
    gridSpan: "md:col-span-2",
    // TODO: route to /profile/applications?type=mentorship when mentorship application is built
    action: "mentorship",
  },
  {
    title: "Sponsor a Student",
    desc: "Help fund a student's participation in our advanced career tracks.",
    icon: <LuHeartHandshake className={cn('w-8', 'h-8')} />,
    cta: "Support Now",
    variant: "blue",
    gridSpan: "md:col-span-1",
    // TODO: route to /sponsor when sponsorship flow is built
    action: "sponsorship",
  },
];

const COMING_SOON_TOAST = (feature: string) =>
  toast(`${feature} is coming soon — stay tuned!`, { icon: "🔨" });

export const HomeCTAOptional = () => {
  // TODO: const router = useRouter();  When finally built

  return (
    <section className={cn('w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'mt-16', 'mb-20', 'space-y-6')}>
      {/* ── Referral + Verify row ── */}
      <div className={cn('grid', 'grid-cols-1', 'lg:grid-cols-2', 'gap-6')}>
        {/* Refer a Friend */}
        <motion.div
          whileHover={{ x: 5 }}
          onClick={() => COMING_SOON_TOAST("Referral system")}
          // TODO: onClick={() => router.push("/profile/referral") when built
          className={cn('flex', 'items-center', 'justify-between', 'p-6', 'bg-emerald-50', 'border', 'border-emerald-100', 'rounded-[2rem]', 'group', 'cursor-pointer', 'transition-all')}
        >
          <div className={cn('flex', 'items-center', 'gap-4')}>
            <div className={cn('w-12', 'h-12', 'bg-emerald-500', 'rounded-2xl', 'flex', 'items-center', 'justify-center', 'text-background', 'shadow-lg', 'shadow-emerald-200')}>
              <LuGift className={cn('w-6', 'h-6')} />
            </div>
            <div>
              <h4 className={cn('font-black', 'text-foreground')}>Refer a Friend</h4>
              <p className={cn('text-xs', 'font-bold', 'text-emerald-700')}>
                Get 200 Career Points for every invite
              </p>
            </div>
          </div>
          <LuArrowRight className={cn('w-5', 'h-5', 'text-emerald-400', 'group-hover:translate-x-1', 'transition-transform')} />
        </motion.div>

        {/* Verify Profile */}
        <motion.div
          whileHover={{ x: 5 }}
          onClick={() => COMING_SOON_TOAST("Profile verification")}
          // TODO: onClick={() => router.push("/profile/verification") when built
          className={cn('flex', 'items-center', 'justify-between', 'p-6', 'bg-purple-50', 'border', 'border-purple-100', 'rounded-[2rem]', 'group', 'cursor-pointer', 'transition-all')}
        >
          <div className={cn('flex', 'items-center', 'gap-4')}>
            <div className={cn('w-12', 'h-12', 'bg-purple-600', 'rounded-2xl', 'flex', 'items-center', 'justify-center', 'text-background', 'shadow-lg', 'shadow-purple-200')}>
              <LuShieldCheck className={cn('w-6', 'h-6')} />
            </div>
            <div>
              <h4 className={cn('font-black', 'text-foreground')}>Verify Profile</h4>
              <p className={cn('text-xs', 'font-bold', 'text-purple-700')}>
                Unlock Exclusive Mentor sessions
              </p>
            </div>
          </div>
          <LuArrowRight className={cn('w-5', 'h-5', 'text-purple-400', 'group-hover:translate-x-1', 'transition-transform')} />
        </motion.div>
      </div>

      {/* ── Mentor / Sponsor cards ── */}
      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-6')}>
        {ctaCards.map((card, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -8 }}
            className={cn(
              "relative overflow-hidden rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between min-h-[280px]",
              card.gridSpan,
              card.variant === "orange" &&
                "bg-gradient-to-br from-orange-500 to-primary text-background",
              card.variant === "blue" &&
                "bg-gradient-to-br from-blue-600 to-indigo-700 text-background",
            )}
          >
            <div className={cn('absolute', 'top-0', 'right-0', '-mr-16', '-mt-16', 'w-64', 'h-64', 'bg-background/10', 'rounded-full', 'blur-3xl')} />
            <div className={cn('relative', 'z-10')}>
              <div className={cn('mb-6', 'inline-flex', 'p-3', 'bg-background/20', 'backdrop-blur-md', 'rounded-2xl')}>
                {card.icon}
              </div>
              <h3 className={cn('text-2xl', 'md:text-3xl', 'font-black', 'mb-3', 'leading-tight')}>
                {card.title}
              </h3>
              <p className={cn('text-background/80', 'font-medium', 'max-w-md')}>
                {card.desc}
              </p>
            </div>
            <div className={cn('relative', 'z-10', 'mt-8')}>
              <button
                onClick={() => COMING_SOON_TOAST(card.title)}
                // TODO: replace with router.push to actual application page when built
                className={cn('group', 'flex', 'items-center', 'gap-2', 'px-6', 'py-3', 'rounded-xl', 'font-black', 'text-sm', 'bg-background', 'text-foreground', 'hover:text-muted', 'transition-all', 'duration-300', 'cursor-pointer')}
              >
                {card.cta}
                <LuArrowRight className={cn('w-4', 'h-4', 'group-hover:translate-x-1', 'transition-transform')} />
              </button>
            </div>
          </motion.div>
        ))}

        {/* Fellowship banner */}
        <motion.div
          whileHover={{ y: -8 }}
          className={cn('md:col-span-3', 'bg-slate-950', 'rounded-[2.5rem]', 'p-8', 'md:p-10', 'flex', 'flex-col', 'md:flex-row', 'items-center', 'justify-between', 'gap-6', 'border', 'border-slate-800')}
        >
          <div className={cn('flex', 'items-center', 'gap-6')}>
            <div className={cn('hidden', 'md:flex', 'w-16', 'h-16', 'bg-primary', 'rounded-3xl', 'items-center', 'justify-center', 'text-background', 'shrink-0')}>
              <LuRocket className={cn('w-8', 'h-8')} />
            </div>
            <div className={cn('text-center', 'md:text-left')}>
              <h3 className={cn('text-2xl', 'font-black', 'text-background', 'mb-2')}>
                Advanced Fellowship
              </h3>
              <p className={cn('text-muted-foreground', 'max-w-md')}>
                Ready for more? Join our 6-month intensive leadership and
                technical program.
              </p>
            </div>
          </div>
          <button
            onClick={() => COMING_SOON_TOAST("Advanced Fellowship program")}
            // TODO: replace with router.push("/programs/fellowship") when built
            className={cn('w-full', 'md:w-auto', 'px-8', 'py-4', 'bg-primary', 'text-background', 'font-black', 'rounded-2xl', 'hover:bg-orange-600', 'transition-all', 'duration-300', 'cursor-pointer')}
          >
            Explore Programs
          </button>
        </motion.div>
      </div>
    </section>
  );
};
