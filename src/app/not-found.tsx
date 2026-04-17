/* eslint-disable react-hooks/purity */
"use client";
import { useState, useEffect, useMemo } from "react";
import { useNotFound } from "@/context/notFoundContext";
import {
  LuZap,
  LuHouse,
  LuSearch,
  LuArrowLeft,
  LuBookOpen,
} from "react-icons/lu";
import { motion } from "framer-motion";
import clsx from "clsx";

export default function NotFound() {
  const { setIsNotFound } = useNotFound();
  const [glitchActive, setGlitchActive] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsNotFound?.(true);
    return () => setIsNotFound?.(false);
  }, [setIsNotFound]);

  // Glitch interval
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Parallax icon effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 15 - 5.5,
        y: (e.clientY / window.innerHeight) * 15 - 5.5,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const triggerRandomGlitch = () => {
      setGlitchActive(true);
      // Glitch lasts for 150-300ms
      setTimeout(() => setGlitchActive(false), Math.random() * 150 + 900);

      // Schedule next glitch between 2 to 6 seconds
      setTimeout(triggerRandomGlitch, Math.random() * 4000 + 2000);
    };

    const initialTimeout = setTimeout(triggerRandomGlitch, 2000);
    return () => clearTimeout(initialTimeout);
  }, []);

  return (
    <div
      className={clsx(
        "min-h-screen w-full",
        "flex items-center justify-center p-6",
        "relative overflow-hidden font-sans bg-background",
      )}
    >
      {/* Decorative Glass Elements - Matching DIUSCADI style */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-primary/20 blur-[120px] rounded-full" />

      <div
        className={clsx(
          "relative z-10 glass glass-shine p-12 md:p-16 rounded-3xl",
          "text-center max-w-2xl mx-auto border-border shadow-2xl",
        )}
      >
        {/* Animated Icon */}
        <div
          className="mb-8 flex justify-center"
          style={{
            transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
            transition: "transform 0.2s ease-out",
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-50 animate-pulse" />
            <LuBookOpen className="w-20 h-20 text-muted-foreground relative" />
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -right-2"
            >
              <LuZap className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
        </div>

        {/* 404 Text with RGB Glitch Effect */}
        <div className="relative mb-6 flex justify-center">
          <h1
            className={clsx(
              "text-9xl font-black select-none tracking-tighter transition-all duration-75",
              "text-foreground",
              glitchActive && "animate-glitch",
            )}
            /* We use data-content so the pseudo-elements in CSS know what text to copy */
            data-content="404"
          >
            404
            {/* Overlay Scanlines Effect (Only visible during glitch) */}
            {glitchActive && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                <div className="w-full h-[2px] bg-primary animate-[bounce_0.1s_infinite] absolute top-1/4" />
                <div className="w-full h-[1px] bg-white animate-[bounce_0.2s_infinite] absolute top-1/2" />
                <div className="w-full h-[3px] bg-primary/50 animate-[bounce_0.15s_infinite] absolute top-3/4" />
              </div>
            )}
          </h1>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Path Not Found
          </h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            It seems you&apos;ve wandered off the career track. Let&apos;s get
            you back to the main seminar hall.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => (window.location.href = "/")}
            className={clsx(
              "px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl",
              "hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]",
              "transition-all shadow-lg shadow-primary/25 w-full sm:w-auto cursor-pointer",
            )}
          >
            <span className="flex items-center justify-center gap-2 ">
              <LuHouse className="w-5 h-5" /> Back to Home
            </span>
          </button>

          <button
            onClick={() => window.history.back()}
            className={clsx(
              "glass-subtle px-8 py-3 text-foreground font-semibold rounded-xl",
              "hover:bg-accent transition-all w-full sm:w-auto cursor-pointer",
            )}
          >
            <span className="flex items-center justify-center gap-2 ">
              <LuArrowLeft className="w-5 h-5" /> Go Back
            </span>
          </button>
        </div>

        {/* Support Links */}
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-wrap justify-center gap-6 text-sm">
          <a
            href="/register"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Register for 2026
          </a>
          <a
            href="/contact"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <LuSearch className="w-4 h-4" /> Support
          </a>
        </div>
      </div>
    </div>
  );
}
