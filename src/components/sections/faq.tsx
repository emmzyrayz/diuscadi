"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle, Mail, Phone } from "lucide-react";

const FAQ_DATA = [
  {
    question: "How many participants can register?",
    answer:
      "There’s a limit of 800 registrants to attend on a first come first serve basis. We recommend registering early to secure your spot!",
  },
  {
    question: "How can I contact DIUSCADI for inquiries or partnership?",
    answer:
      "For inquiries or partnership opportunities, please contact us via email at info@diuscadi.org.ng or reach out to us through our phone number +234 803 590 6416.",
  },
  {
    question: "Are there any fees associated with attending?",
    answer:
      "No, there are no fees associated with attending the Life After School Career Development Seminar Series. It is entirely free for students and recent graduates.",
  },
  {
    question: "How can I support DIUSCADI as a sponsor or volunteer?",
    answer:
      "To support DIUSCADI, please visit our sponsorship page or reach out to us directly at +234 803 590 6416 to discuss how you can contribute.",
  },
  {
    question: "How can I stay updated on upcoming events?",
    answer:
      "To stay updated on upcoming seminars and workshops, follow our social media platforms and subscribe to our email newsletter for regular updates.",
  },
  {
    question: "How can I participate in the LASCDSS workshops?",
    answer:
      "Participation is strictly physical/in-person. However, we will provide a video recap of key moments on our YouTube channel for those who cannot attend.",
  },
  {
    question: "Where is the location for this event?",
    answer:
      "The event holds at the ASUU Multipurpose Hall, Nnamdi Azikiwe University Awka. You can find the location easily on Google Maps.",
  },
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faqs" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Left Side: Header */}
          <div className="lg:w-1/3">
            <div className="lg:sticky lg:top-32">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-bold mb-6">
                <HelpCircle className="w-4 h-4" />
                <span>Support Center</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Everything you need to know about the seminar. Can&apos;t find the
                answer you&apos;re looking for? Reach out to our team.
              </p>

              {/* Quick Contact Card */}
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="font-bold text-slate-900 mb-4">
                  Still have questions?
                </p>
                <div className="space-y-3">
                  <a
                    href="mailto:info@diuscadi.org.ng"
                    className="flex items-center gap-3 text-sm text-slate-600 hover:text-primary transition-colors"
                  >
                    <Mail className="w-4 h-4" /> info@diuscadi.org.ng
                  </a>
                  <a
                    href="tel:+2348035906416"
                    className="flex items-center gap-3 text-sm text-slate-600 hover:text-primary transition-colors"
                  >
                    <Phone className="w-4 h-4" /> +234 803 590 6416
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Accordion */}
          <div className="lg:w-2/3 space-y-4">
            {FAQ_DATA.map((item, index) => (
              <div
                key={index}
                className={`border-2 rounded-[2rem] transition-all duration-300 ${
                  openIndex === index
                    ? "border-primary bg-slate-50"
                    : "border-slate-100 bg-white"
                }`}
              >
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  className="w-full flex items-center justify-between p-6 md:p-8 text-left"
                >
                  <span
                    className={`text-lg md:text-xl font-bold transition-colors ${
                      openIndex === index ? "text-primary" : "text-slate-900"
                    }`}
                  >
                    {item.question}
                  </span>
                  <div
                    className={`flex-none ml-4 p-2 rounded-full transition-transform duration-300 ${
                      openIndex === index
                        ? "bg-primary text-white rotate-180"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {openIndex === index ? (
                      <Minus className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 md:px-8 pb-8 text-slate-600 leading-relaxed text-lg border-t border-slate-100 pt-4 mt-2">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
