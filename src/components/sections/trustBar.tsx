'use client'
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import unilagLogo from "@/assets/img/logo/unilag.png"
import convenantLogo from "@/assets/img/logo/convenant.jpg"
import googleLogo from "@/assets/img/logo/google-logo-icon-transparent-background_1273375-1570.jpg"
import microsoftLogo from "@/assets/img/logo/microsoft.webp"
import lasuLogo from "@/assets/img/logo/lasu.png"

const PARTNERS = [
  { id: 1, name: "University of Lagos", logo: unilagLogo},
  { id: 2, name: "Covenant University", logo: convenantLogo },
  { id: 3, name: "Google Africa", logo: googleLogo },
  { id: 4, name: "Microsoft", logo: microsoftLogo },
  { id: 5, name: "Lagos State University", logo: lasuLogo },
];

export const TrustBar = () => {
  return (
    <section className={cn('w-full', 'py-16', 'bg-background')}>
      <div className={cn('container', 'mx-auto', 'px-6')}>
        <p className={cn('text-center', 'text-xs', 'font-bold', 'uppercase', 'tracking-[0.2em]', 'text-muted-foreground/60', 'mb-10')}>
          Validated by Industry & Academia
        </p>

        <div className={cn('flex', 'flex-wrap', 'justify-center', 'gap-6')}>
          {PARTNERS.map((partner, idx) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "group relative overflow-hidden",
                "min-w-[180px] h-16 px-6 rounded-xl",
                "flex items-center justify-center",
                // Glass Effect
                "bg-primary/5 backdrop-blur-sm border border-primary/10",
                // Hover: Match your banner logic (Darken + Readability)
                "hover:bg-black/80 hover:border-primary/30 transition-all duration-500 cursor-pointer",
              )}
            >
              {/* THE BACKGROUND IMAGE (The Logo) */}
              <div className={cn('absolute', 'inset-0', 'z-0', 'flex', 'items-center', 'justify-center', 'p-2', 'opacity-20', 'group-hover:opacity-40', 'transition-opacity', 'duration-500')}>
                <Image
                  src={partner.logo}
                  alt="" // Decorative since text is present
                  className={cn('object-contain w-full h-full', 'grayscale', 'brightness-full', 'invert')}
                />
              </div>

              {/* THE FOREGROUND SPAN */}
              <span className={cn('relative', 'z-10', 'text-sm', 'font-bold', 'text-foreground', 'group-hover:text-white', 'transition-colors', 'duration-300', 'text-center', 'leading-tight')}>
                {partner.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
