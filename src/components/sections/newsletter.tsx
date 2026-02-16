"use client";
import React, { useState } from "react";
// import { motion } from "framer-motion";
import { Send, BellRing } from "lucide-react";

export const Newsletter = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thanks for subscribing! Check your email soon.");
    setEmail("");
  };

  return (
    <section className="py-24 border-t border-slate-100">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 max-w-6xl mx-auto">
          <div className="lg:w-1/2">
            <div className="flex items-center gap-4 mb-4 text-secondary">
              <div className="p-3 rounded-2xl bg-secondary/10">
                <BellRing className="w-6 h-6" />
              </div>
              <span className="font-bold uppercase tracking-widest text-sm">
                Stay Updated
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Never miss a career <br /> opportunity.
            </h2>
            <p className="text-lg text-slate-600">
              Get notified about future seminars, mentorship programs, and
              career workshops directly in your inbox. No spam, ever.
            </p>
          </div>

          <div className="lg:w-1/2 w-full">
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex flex-col sm:flex-row gap-3 p-2 bg-slate-100 rounded-[2.5rem] border border-slate-200">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent px-6 py-4 outline-none text-slate-900 placeholder:text-slate-400 font-medium"
                />
                <button
                  type="submit"
                  className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-primary transition-all group"
                >
                  Join the Community
                  <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
              <p className="mt-4 text-sm text-slate-400 text-center sm:text-left ml-6">
                Join 2,000+ Nigerian youths already on the list.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
