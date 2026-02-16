"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "../../lib/utils";
import Image from "next/image";
import logo from "@/assets/img/logo.webp";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Events", href: "/events" },
  { name: "About", href: "/about" },
  { name: "Gallery", href: "/gallery" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className={cn(
        "fixed",
        "top-0",
        "left-0",
        "w-full",
        "z-50",
        "flex",
        "justify-center",
        "px-4",
        "py-4",
      )}
    >
      <div className={cn("w-full", "max-w-7xl")}>
        {/* Glass Container */}
        <div
          className={cn(
            "flex",
            "items-center",
            "justify-between",
            "rounded-2xl",
            "border",
            "border-white/1",
            "bg-white/1",
            "backdrop-blur-xs",
            "shadow-lg",
            "px-6",
            "py-3",
          )}
        >
          {/* Logo */}
          <Link href="/" className={cn("font-bold", "text-lg")}>
            <div
              className={cn("logo", "flex items-center justify-start gap-3")}
            >
              <Image alt="" src={logo} className={cn("w-7", "h-7")} />
              <h2 className={cn("text-xl", "font-bold", "text-primary")}>
                DIUSCADI
              </h2>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav
            className={cn(
              "hidden",
              "md:flex",
              "items-center",
              "gap-8",
              "absolute",
              "left-1/2",
              "-translate-x-1/2",
            )}
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "text-sm",
                  "font-medium",
                  "text-gray-700",
                  "hover:text-black",
                  "transition",
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className={cn("flex", "items-center", "gap-3")}>
            {/* Register Button */}
            <Button className={cn("hidden", "md:flex", "rounded-xl")}>
              Register
            </Button>

            {/* Mobile Menu Button */}
            <button className="md:hidden" onClick={() => setOpen(!open)}>
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {open && (
          <div
            className={cn(
              "md:hidden",
              "mt-3",
              "rounded-2xl",
              "border",
              "border-white/1",
              "bg-white/1",
              "backdrop-blur-xs",
              "shadow-lg",
              "p-4",
              "space-y-4",
            )}
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn("block", "text-sm", "font-medium")}
                onClick={() => setOpen(false)}
              >
                {link.name}
              </Link>
            ))}

            <Button className={cn("w-full", "rounded-xl")}>Register</Button>
          </div>
        )}
      </div>
    </header>
  );
}
