"use client";
import React, { useState } from "react";
// import { motion } from "framer-motion";
import { Send, BellRing, CheckCircle2 } from "lucide-react";

export const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (done) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to subscribe");
      setDone(true);
      setEmail("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-24 border-t border-border">
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
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
              Never miss a career <br /> opportunity.
            </h2>
            <p className="text-lg text-slate-600">
              Get notified about future seminars, mentorship programs, and
              career workshops directly in your inbox. No spam, ever.
            </p>
          </div>

          <div className="lg:w-1/2 w-full">
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex flex-col sm:flex-row gap-3 p-2 text-muted rounded-[2.5rem] border border-border">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent px-6 py-4 outline-none text-foreground placeholder:text-muted-foreground font-medium"
                />
                <button
                  type="submit"
                  className="bg-foreground text-background px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-primary transition-all group"
                  disabled={submitting}
                >
                  {submitting
                    ? "Joining..."
                    : done
                      ? "You're in! ✓"
                      : "Join the Community"}
                  <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground text-center sm:text-left ml-6">
                Join 2,000+ Nigerian youths already on the list.
              </p>
            </form>
               {error && (
       <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
     )}
     {done && (
       <p className="mt-2 text-sm text-green-600 font-medium flex items-center justify-center gap-1">
         <CheckCircle2 className="w-4 h-4" /> Check your inbox for a welcome email.
       </p>
     )}
          </div>
        </div>
      </div>
    </section>
  );
};
