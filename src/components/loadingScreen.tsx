"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LuZap, LuGraduationCap } from "react-icons/lu";
import clsx from "clsx";

interface LoadingScreenProps {
  isLoading: boolean;
  onLoadingComplete?: () => void;
}

export function LoadingScreen({
  isLoading,
  onLoadingComplete,
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!isLoading) return;

    // Faster progress simulation to reach 100% within ~4.5s
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 40);

    // Start fade out slightly before the 5s mark
    const fadeTimer = setTimeout(() => setFadeOut(true), 4700);

    const completeTimer = setTimeout(() => {
      if (onLoadingComplete) onLoadingComplete();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [isLoading, onLoadingComplete]);

  if (!isLoading && fadeOut) return null;

  return (
    <div
      className={clsx(
        "fixed inset-0 z-100 bg-slate-950 flex items-center justify-center transition-opacity duration-500",
        fadeOut && "opacity-0 pointer-events-none",
      )}
    >
      {/* Subtle DIUSCADI Grid Background */}
      <div className={clsx('absolute', 'inset-0', 'opacity-20')}>
        <div
          className={clsx('absolute', 'inset-0')}
          style={{
            backgroundImage:
              "linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className={clsx('relative', 'z-10', 'text-center', 'max-w-md', 'px-8', 'w-full')}>
        {/* Animated Icon Section */}
        <div className={clsx('mb-8', 'flex', 'justify-center', 'relative')}>
          <div className={clsx('absolute', 'inset-0', 'blur-3xl', 'opacity-20', 'bg-orange-500', 'rounded-full', 'animate-pulse')} />
          <div className="relative">
            <LuGraduationCap className={clsx('w-20', 'h-20', 'text-white', 'animate-bounce')} />
            <LuZap className={clsx('w-8', 'h-8', 'text-orange-500', 'absolute', '-top-2', '-right-2', 'animate-pulse')} />
          </div>
        </div>

        {/* Branded Text */}
        <h1 className={clsx('text-3xl', 'font-black', 'text-white', 'mb-2', 'tracking-[0.2em]', 'uppercase')}>
          DIUSCADI
        </h1>
        <p className={clsx('text-slate-400', 'text-xs', 'font-bold', 'tracking-widest', 'mb-10', 'uppercase')}>
          Building the Future of Nigerian Youth
        </p>

        {/* Progress System */}
        <div className={clsx('relative', 'w-full', 'h-1.5', 'bg-slate-800', 'rounded-full', 'overflow-hidden')}>
          <div
            className={clsx('absolute', 'inset-y-0', 'left-0', 'bg-orange-500', 'transition-all', 'duration-300', 'ease-out', 'shadow-[0_0_15px_rgba(249,115,22,0.6)]')}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className={clsx('mt-4', 'flex', 'justify-between', 'items-center', 'text-[10px]', 'font-mono', 'font-bold', 'tracking-tighter')}>
          <span className={clsx('text-slate-500', 'uppercase')}>System Initializing</span>
          <span className="text-orange-500">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Aesthetic Border Accents */}
      <div className={clsx('absolute', 'top-10', 'left-10', 'w-12', 'h-12', 'border-t-2', 'border-l-2', 'border-slate-800')} />
      <div className={clsx('absolute', 'bottom-10', 'right-10', 'w-12', 'h-12', 'border-b-2', 'border-r-2', 'border-slate-800')} />
    </div>
  );
}

export default function Loadingg() {
    const [show, setShow] = useState(true);

    useEffect(() => {
      const timer = setTimeout(() => {
        setShow(false);
      }, 5000); // 5 Seconds
      return () => clearTimeout(timer);
    }, []);

    if (!show) return null;
    
  return (
    <div
      className={clsx(
        "fixed",
        "inset-0",
        "z-9999",
        "flex",
        "flex-col",
        "items-center",
        "justify-center",
        "bg-white",
      )}
    >
      {/* Animated Logo Placeholder */}
      <div
        className={clsx("relative", "flex", "items-center", "justify-center")}
      >
        {/* Outer Pulsing Ring */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={clsx(
            "absolute",
            "w-24",
            "h-24",
            "bg-primary",
            "rounded-full",
          )}
        />

        {/* Inner Spinning Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
          className={clsx(
            "w-16",
            "h-16",
            "border-4",
            "border-slate-100",
            "border-t-primary",
            "rounded-full",
          )}
        />
      </div>

      {/* Branded Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx("mt-8", "text-center")}
      >
        <h2
          className={clsx(
            "text-xl",
            "font-black",
            "text-slate-900",
            "tracking-tighter",
            "uppercase",
          )}
        >
          DIUSCADI
        </h2>
        <div className={clsx("mt-2", "flex", "gap-1", "justify-center")}>
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [0.5, 1, 1.5, 1, 0.5],
                backgroundColor: [
                  "oklch(0.208 0.042 265.755)",
                  "#f97316",
                  "#0f172a",
                  "#f97316",
                  "oklch(0.208 0.042 265.755)",
                ],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
              className={clsx("w-1.5", "h-1.5", "rounded-full")}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}