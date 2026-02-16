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
import clsx from "clsx";

export default function NotFound() {
  const { setIsNotFound } = useNotFound();
  const [glitchActive, setGlitchActive] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsNotFound?.(true);
    return () => setIsNotFound?.(false);
  }, [setIsNotFound]);

  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 3,
      })),
    [],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 15 - 7.5,
        y: (e.clientY / window.innerHeight) * 15 - 7.5,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative font-sans">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            transform: `perspective(500px) rotateX(60deg) translateY(-20%)`,
          }}
        />
      </div>

      {/* Floating particles */}
      {particles.map((particle, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-orange-500 rounded-full animate-pulse"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Animated Icon */}
        <div
          className="mb-8 flex justify-center"
          style={{
            transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
            transition: "transform 0.2s ease-out",
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500/20 blur-3xl opacity-50 animate-pulse" />
            <LuBookOpen className="w-20 h-20 text-slate-500 relative animate-bounce" />
            <LuZap className="w-8 h-8 text-orange-500 absolute -top-2 -right-2 animate-ping" />
          </div>
        </div>

        {/* 404 Text with glitch effect */}
        <div className="relative mb-6">
          <h1
            className={clsx(
              "text-9xl font-black text-white select-none",
              glitchActive && "animate-pulse",
            )}
            style={{
              textShadow: glitchActive
                ? "3px 3px #f97316, -3px -3px #38bdf8"
                : "none",
            }}
          >
            404
          </h1>
        </div>

        {/* Description */}
        <div className="space-y-4 mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Path Not Found
          </h2>
          <p className="text-lg text-slate-400 max-w-md mx-auto">
            It seems you&apos;ve wandered off the career track. Let&apos;s get you back to
            the main seminar hall.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => (window.location.href = "/")}
            className="group relative px-8 py-4 bg-orange-600 text-white font-bold rounded-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] w-full sm:w-auto"
          >
            <span className="relative flex items-center justify-center gap-2">
              <LuHouse className="w-5 h-5" /> Back to Home
            </span>
          </button>

          <button
            onClick={() => window.history.back()}
            className="group px-8 py-4 bg-transparent border-2 border-slate-700 text-slate-300 font-bold rounded-2xl transition-all hover:bg-slate-800 hover:border-slate-500 w-full sm:w-auto"
          >
            <span className="flex items-center justify-center gap-2">
              <LuArrowLeft className="w-5 h-5" /> Go Back
            </span>
          </button>
        </div>

        {/* Footer links */}
        <div className="mt-12 flex justify-center gap-8 text-sm">
          <a
            href="/register"
            className="text-slate-500 hover:text-orange-500 transition-colors flex items-center gap-2 group"
          >
            Register for 2026
          </a>
          <a
            href="/contact"
            className="text-slate-500 hover:text-orange-500 transition-colors flex items-center gap-2 group"
          >
            <LuSearch className="w-4 h-4" /> Support
          </a>
        </div>
      </div>

      {/* Branded Corner Accents */}
      <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-orange-500/30 rounded-tl-3xl m-8" />
      <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-slate-800 rounded-br-3xl m-8" />
    </div>
  );
}
