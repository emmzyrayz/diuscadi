"use client";
import React from "react";
import { motion } from "framer-motion";
import { Rocket, ArrowRight, CheckCircle2 } from "lucide-react";

export const CTA = () => {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <div className="relative bg-primary rounded-[3rem] overflow-hidden px-8 py-16 md:p-20 shadow-2xl shadow-primary/30">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-64 h-64 bg-black/10 rounded-full blur-2xl" />

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-bold mb-8 backdrop-blur-md"
            >
              <Rocket className="w-4 h-4" />
              <span>Limited to 800 Seats Only</span>
            </motion.div>

            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-[1.1]">
              Secure Your Future at <br /> LASCDSS 2026
            </h2>

            <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
              Don&apos;t wait until you graduate to start your career. Join hundreds
              of students for an unforgettable experience in career development
              and networking.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/register"
                className="w-full sm:w-auto px-10 py-5 bg-white text-primary rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-slate-100 transition-all transform hover:scale-105 active:scale-95 shadow-xl"
              >
                Register Now
                <ArrowRight className="w-6 h-6" />
              </a>
              <a
                href="/sponsor"
                className="w-full sm:w-auto px-10 py-5 bg-primary-dark/20 text-white border-2 border-white/30 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all"
              >
                Become a Sponsor
              </a>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap justify-center gap-6 text-white/80 text-sm font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> 100% Free Entry
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Certified Workshop
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Networking Lunch
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
