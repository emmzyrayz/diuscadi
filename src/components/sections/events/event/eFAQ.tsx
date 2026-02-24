"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuPlus, LuMinus, LuInfo, LuMail, LuPhone } from "react-icons/lu";
import { cn } from "../../../../lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  customFaqs?: FAQItem[];
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    question: "Is there a certificate of participation?",
    answer:
      "Yes! All registered attendees who complete the full session will receive a digital certificate of participation via their registered email within 7 working days after the event.",
  },
  {
    question: "Do I need to bring a laptop?",
    answer:
      "For workshop-heavy sessions, a laptop is highly recommended. However, for general seminars and networking mixers, a notepad and pen are sufficient.",
  },
  {
    question: "What is the dress code for this event?",
    answer:
      "The standard dress code is Business Casual. We encourage professional attire as there will be significant networking opportunities with industry leaders.",
  },
  {
    question: "Can I register on the day of the event?",
    answer:
      "On-site registration is subject to seat availability. We strongly recommend registering online in advance as our events typically reach full capacity 48 hours before the start time.",
  },
  {
    question: "How can I contact DIUSCADI for partnership?",
    answer:
      "For partnership opportunities, please contact us via email at info@diuscadi.org.ng or reach out to us through our phone number +234 803 590 6416.",
  },
];

export const FAQSection = ({ customFaqs }: FAQSectionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqs = customFaqs || DEFAULT_FAQS;

  return (
    <section id="faqs" className={cn('py-20', 'bg-white')}>
      <div className={cn('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8')}>
        <div className={cn('flex', 'flex-col', 'lg:flex-row', 'gap-12', 'lg:gap-20')}>
          {/* LEFT SIDE: Header & Contact */}
          <div className="lg:w-1/3">
            <div className={cn('lg:sticky', 'lg:top-32')}>
              <div className={cn('inline-flex', 'items-center', 'gap-2', 'px-3', 'py-1', 'rounded-lg', 'bg-primary/10', 'text-primary', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'mb-6')}>
                <LuInfo className={cn('w-3.5', 'h-3.5')} />
                <span>Support Center</span>
              </div>

              <h2 className={cn('text-3xl', 'md:text-5xl', 'font-black', 'text-slate-900', 'mb-6', 'tracking-tighter', 'leading-tight')}>
                Common <span className="text-primary">Questions.</span>
              </h2>

              <p className={cn('text-slate-500', 'font-medium', 'mb-8', 'leading-relaxed')}>
                Everything you need to know about the event logistics and
                participation. Can&apos;t find what you&apos;re looking for?
              </p>

              {/* Contact Card */}
              <div className={cn('p-8', 'bg-slate-50', 'rounded-[2rem]', 'border', 'border-slate-100', 'space-y-6')}>
                <p className={cn('font-black', 'text-slate-900', 'text-sm', 'uppercase', 'tracking-widest')}>
                  Still need help?
                </p>
                <div className="space-y-4">
                  <a
                    href="mailto:info@diuscadi.org.ng"
                    className={cn('flex', 'items-center', 'gap-3', 'text-sm', 'font-bold', 'text-slate-600', 'hover:text-primary', 'transition-colors')}
                  >
                    <div className={cn('w-8', 'h-8', 'rounded-lg', 'bg-white', 'flex', 'items-center', 'justify-center', 'shadow-sm')}>
                      <LuMail className={cn('w-4', 'h-4')} />
                    </div>
                    info@diuscadi.org.ng
                  </a>
                  <a
                    href="tel:+2348035906416"
                    className={cn('flex', 'items-center', 'gap-3', 'text-sm', 'font-bold', 'text-slate-600', 'hover:text-primary', 'transition-colors')}
                  >
                    <div className={cn('w-8', 'h-8', 'rounded-lg', 'bg-white', 'flex', 'items-center', 'justify-center', 'shadow-sm')}>
                      <LuPhone className={cn('w-4', 'h-4')} />
                    </div>
                    +234 803 590 6416
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Accordion */}
          <div className={cn('lg:w-2/3', 'space-y-4')}>
            {faqs.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className={cn(
                    "rounded-[2rem] border-2 transition-all duration-300",
                    isOpen
                      ? "border-primary bg-slate-50"
                      : "border-slate-100 bg-white",
                  )}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className={cn('w-full', 'flex', 'items-center', 'justify-between', 'p-6', 'md:p-8', 'text-left')}
                  >
                    <span
                      className={cn(
                        "text-lg font-black tracking-tight transition-colors",
                        isOpen ? "text-primary" : "text-slate-900",
                      )}
                    >
                      {item.question}
                    </span>
                    <div
                      className={cn(
                        "flex-none ml-4 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        isOpen
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-400",
                      )}
                    >
                      {isOpen ? (
                        <LuMinus className={cn('w-5', 'h-5')} />
                      ) : (
                        <LuPlus className={cn('w-5', 'h-5')} />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className={cn('px-6', 'md:px-8', 'pb-8', 'text-slate-500', 'font-medium', 'leading-relaxed', 'border-t', 'border-slate-200/50', 'pt-6')}>
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
