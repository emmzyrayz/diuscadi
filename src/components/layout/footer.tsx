"use client";

import Link from "next/link";
import { cn } from "../../lib/utils";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
} from "lucide-react";
import Image from "next/image";

import logo from "@/assets/img/logo.webp"

export default function Footer() {
  return (
    <footer className={cn("bg-muted/40", "border-t")}>
      <div className={cn("container", "mx-auto", "px-6", "py-12")}>
        {/* Top Grid */}
        <div
          className={cn(
            "grid",
            "grid-cols-1",
            "md:grid-cols-2",
            "lg:grid-cols-4",
            "gap-10",
          )}
        >
          {/* Logo + Description */}
          <div>
            <div
              className={cn("logo", "flex items-center justify-start gap-3")}
            >
              <Image alt="" src={logo} className={cn("w-7", "h-7")} />
              <h2 className={cn("text-xl", "font-bold", "text-primary")}>
                DIUSCADI
              </h2>
            </div>

            <p
              className={cn(
                "mt-4",
                "text-sm",
                "text-muted-foreground",
                "leading-relaxed",
              )}
            >
              Empowering students and graduates with career guidance,
              mentorship, and real-world opportunities to thrive beyond school.
            </p>

            {/* Socials */}
            <div className={cn("flex", "gap-4", "mt-6")}>
              <Link
                href="#"
                className={cn(
                  "text-muted-foreground",
                  "hover:text-primary",
                  "transition",
                )}
              >
                <Facebook size={18} />
              </Link>

              <Link
                href="#"
                className={cn(
                  "text-muted-foreground",
                  "hover:text-primary",
                  "transition",
                )}
              >
                <Twitter size={18} />
              </Link>

              <Link
                href="#"
                className={cn(
                  "text-muted-foreground",
                  "hover:text-primary",
                  "transition",
                )}
              >
                <Linkedin size={18} />
              </Link>

              <Link
                href="#"
                className={cn(
                  "text-muted-foreground",
                  "hover:text-primary",
                  "transition",
                )}
              >
                <Instagram size={18} />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className={cn("font-semibold", "mb-4")}>Quick Links</h3>

            <div className={cn("space-y-3", "text-sm")}>
              <Link
                href="/"
                className={cn(
                  "block",
                  "text-muted-foreground",
                  "hover:text-primary",
                  "transition",
                )}
              >
                Home
              </Link>

              <Link
                href="/about"
                className={cn(
                  "block",
                  "text-muted-foreground",
                  "hover:text-primary",
                  "transition",
                )}
              >
                About Us
              </Link>

              <Link
                href="/events"
                className={cn(
                  "block",
                  "text-muted-foreground",
                  "hover:text-primary",
                  "transition",
                )}
              >
                Events
              </Link>

              <Link
                href="/register"
                className={cn(
                  "block",
                  "text-muted-foreground",
                  "hover:text-primary",
                  "transition",
                )}
              >
                Register
              </Link>
            </div>
          </div>

          {/* Programs */}
          <div>
            <h3 className={cn("font-semibold", "mb-4")}>Programs</h3>

            <div className={cn("space-y-3", "text-sm")}>
              <p className="text-muted-foreground">Career Seminars</p>

              <p className="text-muted-foreground">Mentorship Programs</p>

              <p className="text-muted-foreground">Graduate Training</p>

              <p className="text-muted-foreground">Skill Development</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className={cn("font-semibold", "mb-4")}>Contact</h3>

            <div className={cn("space-y-4", "text-sm")}>
              <div
                className={cn(
                  "flex",
                  "items-center",
                  "gap-3",
                  "text-muted-foreground",
                )}
              >
                <MapPin size={16} />
                <span>Nigeria</span>
              </div>

              <div
                className={cn(
                  "flex",
                  "items-center",
                  "gap-3",
                  "text-muted-foreground",
                )}
              >
                <Mail size={16} />
                <span>info@diuscadi.org.ng</span>
              </div>

              <div
                className={cn(
                  "flex",
                  "items-center",
                  "gap-3",
                  "text-muted-foreground",
                )}
              >
                <Phone size={16} />
                <span>+234 803 590 6416</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className={cn(
            "border-t",
            "mt-10",
            "pt-6",
            "text-center",
            "text-sm",
            "text-muted-foreground",
          )}
        >
          © {new Date().getFullYear()} DIUSCADI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
