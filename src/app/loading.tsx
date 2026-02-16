"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

export default function Loading() {
    const [show, setShow] = useState(true);

    useEffect(() => {
      const timer = setTimeout(() => {
        setShow(false);
      }, 5000); // 5 Seconds
      return () => clearTimeout(timer);
    }, []);

    if (!show) return null;
    
  return (
    <div className={clsx('fixed', 'inset-0', 'z-9999', 'flex', 'flex-col', 'items-center', 'justify-center', 'bg-white')}>
      {/* Animated Logo Placeholder */}
      <div className={clsx('relative', 'flex', 'items-center', 'justify-center')}>
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
          className={clsx('absolute', 'w-24', 'h-24', 'bg-primary', 'rounded-full')}
        />

        {/* Inner Spinning Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
          className={clsx('w-16', 'h-16', 'border-4', 'border-slate-100', 'border-t-primary', 'rounded-full')}
        />
      </div>

      {/* Branded Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx('mt-8', 'text-center')}
      >
        <h2 className={clsx('text-xl', 'font-black', 'text-slate-900', 'tracking-tighter', 'uppercase')}>
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
