"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuMenu,
  LuX,
  LuArrowLeft,
  LuLayoutDashboard,
  LuUser,
  LuTicket,
  LuCalendar,
  LuLogOut,
  LuChevronDown,
  LuShieldCheck,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import logo from "@/assets/img/logo.webp";

// ── Nav link definitions per role ────────────────────────────────────────────

const PUBLIC_LINKS = [
  { name: "Home", href: "/" },
  { name: "Events", href: "/events" },
  { name: "About", href: "/about" },
  { name: "Gallery", href: "/gallery" },
  { name: "Contact", href: "/contact" },
];

const MEMBER_LINKS = [
  { name: "Home", href: "/home" },
  { name: "Events", href: "/events" },
  { name: "Tickets", href: "/tickets" },
  { name: "Profile", href: "/profile" },
];

const MODERATOR_LINKS = [
  ...MEMBER_LINKS,
  { name: "Applications", href: "/admin/applications" },
];

const ADMIN_LINKS = [
  { name: "Dashboard", href: "/admin" },
  { name: "Events", href: "/admin/events" },
  { name: "Users", href: "/admin/users" },
  { name: "Tickets", href: "/admin/tickets" },
  { name: "Invites", href: "/admin/invites" },
  { name: "Analytics", href: "/admin/analytics" },
  { name: "Settings", href: "/admin/settings" },
];

const WEBMASTER_LINKS = [
  ...ADMIN_LINKS,
  { name: "Health", href: "/admin/health" },
];

function getNavLinks(role: string | null, isAuthenticated: boolean) {
  if (!isAuthenticated) return PUBLIC_LINKS;
  switch (role) {
    case "webmaster":
      return WEBMASTER_LINKS;
    case "admin":
      return ADMIN_LINKS;
    case "moderator":
      return MODERATOR_LINKS;
    default:
      return MEMBER_LINKS;
  }
}

// ── Pages where back button should NOT appear ─────────────────────────────────
const ROOT_PAGES = ["/", "/home", "/events", "/admin"];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const role = user?.role ?? null;

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // const prevPathname = useRef(pathname);

  // Scroll detection for glass effect intensification
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  // useEffect(() => {
  //   if (prevPathname.current !== pathname) {
  //     prevPathname.current = pathname;
  //     setOpen(false);
  //     setUserMenuOpen(false);
  //   }
  // }, [pathname]);

  const navLinks = getNavLinks(role, isAuthenticated);
  const showBack = isAuthenticated && !ROOT_PAGES.includes(pathname ?? "");
  const isAdminArea = pathname?.startsWith("/admin");

  // Hide navbar on verify page (it has its own back button)
  if (pathname?.startsWith("/verify/ticket")) return null;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 w-full z-50 flex justify-center px-4 py-4 transition-all duration-300",
      )}
    >
      <div className="w-full max-w-7xl">
        {/* ── Glass container ── */}
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl border px-6 py-3 transition-all duration-300",
            scrolled
              ? "bg-background/95 border-border shadow-lg backdrop-blur-md"
              : "bg-background/60 border-background/10 backdrop-blur-sm shadow-md",
          )}
        >
          {/* Left — back button or logo */}
          <div className="flex items-center gap-3">
            {showBack ? (
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors cursor-pointer"
              >
                <LuArrowLeft className="w-4 h-4" />
                <span className="hidden sm:block">Back</span>
              </button>
            ) : (
              <Link href={isAuthenticated ? "/home" : "/"}>
                <div className="flex items-center gap-3">
                  <Image alt="DIUSCADI" src={logo} className="w-7 h-7" />
                  <h2 className="text-xl font-bold text-primary hidden sm:block">
                    DIUSCADI
                  </h2>
                </div>
              </Link>
            )}
          </div>

          {/* Center — desktop nav links */}
          <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            {navLinks.slice(0, 5).map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" &&
                  link.href !== "/home" &&
                  pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive
                      ? "text-primary font-black"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right — auth actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Admin shortcut — only on member area */}
                {(role === "admin" ||
                  role === "webmaster" ||
                  role === "moderator") &&
                  !isAdminArea && (
                    <Link
                      href="/admin"
                      className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all cursor-pointer"
                    >
                      <LuShieldCheck className="w-3.5 h-3.5" />
                      Console
                    </Link>
                  )}

                {/* Member shortcut — only on admin area */}
                {isAdminArea && (
                  <Link
                    href="/home"
                    className="hidden md:flex items-center gap-1.5 px-3 py-2 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-foreground transition-all cursor-pointer text-muted-foreground"
                  >
                    Main Site
                  </Link>
                )}

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border hover:border-foreground transition-all cursor-pointer"
                  >
                    <LuUser className="w-4 h-4 text-muted-foreground" />
                    <LuChevronDown
                      className={cn(
                        "w-3 h-3 text-muted-foreground transition-transform",
                        userMenuOpen && "rotate-180",
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-10"
                          onClick={() => setUserMenuOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                          }}
                          className="absolute right-0 top-12 w-48 bg-background border border-border rounded-2xl shadow-2xl z-20 p-2"
                        >
                          <UserMenuItem
                            icon={LuUser}
                            label="Profile"
                            href="/profile"
                            onClick={() => setUserMenuOpen(false)}
                          />
                          <UserMenuItem
                            icon={LuTicket}
                            label="My Tickets"
                            href="/tickets"
                            onClick={() => setUserMenuOpen(false)}
                          />
                          <UserMenuItem
                            icon={LuCalendar}
                            label="Events"
                            href="/events"
                            onClick={() => setUserMenuOpen(false)}
                          />
                          {(role === "admin" ||
                            role === "webmaster" ||
                            role === "moderator") && (
                            <UserMenuItem
                              icon={LuLayoutDashboard}
                              label="Admin Console"
                              href="/admin"
                              onClick={() => setUserMenuOpen(false)}
                            />
                          )}
                          <div className="h-px bg-muted my-1" />
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              logout();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                          >
                            <LuLogOut className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-tight">
                              Sign Out
                            </span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile menu toggle */}
                <button
                  className="md:hidden p-2"
                  onClick={() => setOpen(!open)}
                >
                  {open ? <LuX size={22} /> : <LuMenu size={22} />}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="hidden md:flex items-center px-5 py-2.5 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all"
                >
                  Register
                </Link>
                <button
                  className="md:hidden p-2"
                  onClick={() => setOpen(!open)}
                >
                  {open ? <LuX size={22} /> : <LuMenu size={22} />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Mobile menu ── */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={cn(
                "md:hidden mt-3 rounded-2xl border border-border",
                "bg-background/95 backdrop-blur-md shadow-lg p-4 space-y-1",
              )}
            >
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" &&
                    link.href !== "/home" &&
                    pathname?.startsWith(link.href));
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}

              {!isAuthenticated && (
                <>
                  <div className="h-px bg-muted my-2" />
                  <Link
                    href="/auth"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center w-full py-3 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all"
                  >
                    Register / Sign In
                  </Link>
                </>
              )}

              {isAuthenticated && (
                <>
                  <div className="h-px bg-muted my-2" />
                  <button
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LuLogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

// ── User menu item ─────────────────────────────────────────────────────────────
const UserMenuItem: React.FC<{
  icon: React.ElementType;
  label: string;
  href: string;
  onClick?: () => void;
}> = ({ icon: Icon, label, href, onClick }) => (
  <Link
    href={href}
    onClick={onClick}
    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors cursor-pointer text-slate-600"
  >
    <Icon className="w-4 h-4" />
    <span className="text-[10px] font-black uppercase tracking-tight">
      {label}
    </span>
  </Link>
);
