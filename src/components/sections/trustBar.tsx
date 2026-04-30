"use client";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import { useLandingConfig } from "@/hooks/useLandingConfig";
import unilagLogo from "@/assets/img/logo/unilag.png";
import convenantLogo from "@/assets/img/logo/convenant.jpg";
import googleLogo from "@/assets/img/logo/google-logo-icon-transparent-background_1273375-1570.jpg";
import microsoftLogo from "@/assets/img/logo/microsoft.webp";
import lasuLogo from "@/assets/img/logo/lasu.png";
import type { StaticImageData } from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Partner {
  id: number;
  name: string;
  logo: string | StaticImageData | null;
}

// ─── Static fallback ──────────────────────────────────────────────────────────

const PARTNERS: Partner[] = [
  { id: 1, name: "University of Lagos", logo: unilagLogo },
  { id: 2, name: "Covenant University", logo: convenantLogo },
  { id: 3, name: "Google Africa", logo: googleLogo },
  { id: 4, name: "Microsoft", logo: microsoftLogo },
  { id: 5, name: "Lagos State University", logo: lasuLogo },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const TrustBar = () => {
  const { config } = useLandingConfig();

  const partners: Partner[] = config?.validators?.items?.length
    ? config.validators.items.map((v, idx) => ({
        id: idx + 1,
        name: v.name,
        logo: v.logoUrl || null, // null = show name-only pill
      }))
    : PARTNERS;

  return (
    <section className={cn("w-full", "py-16", "bg-background")}>
      <div className={cn("container", "mx-auto", "px-6")}>
        <p
          className={cn(
            "text-center",
            "text-xs",
            "font-bold",
            "uppercase",
            "tracking-[0.2em]",
            "text-muted-foreground/60",
            "mb-10",
          )}
        >
          Validated by Industry &amp; Academia
        </p>

        <div className={cn("flex", "flex-wrap", "justify-center", "gap-6")}>
          {partners.map((partner, idx) => (
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
                "bg-primary/5 backdrop-blur-sm border border-primary/10",
                "hover:bg-black/80 hover:border-primary/30 transition-all duration-500 cursor-pointer",
              )}
            >
              {/* Background logo — only rendered when a logo src exists */}
              {partner.logo !== null && (
                <div
                  className={cn(
                    "absolute inset-0 z-0",
                    "flex items-center justify-center p-2",
                    "opacity-20 group-hover:opacity-40 transition-opacity duration-500",
                  )}
                >
                  <Image
                    width={500}
                    height={300}
                    src={partner.logo} // string | StaticImageData — never null here
                    alt="" // decorative; text label is the accessible name
                    className={cn(
                      "object-contain w-full h-full",
                      "grayscale brightness-full invert",
                    )}
                  />
                </div>
              )}

              {/* Foreground name label */}
              <span
                className={cn(
                  "relative z-10",
                  "text-sm font-bold text-foreground",
                  "group-hover:text-background transition-colors duration-300",
                  "text-center leading-tight",
                )}
              >
                {partner.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
