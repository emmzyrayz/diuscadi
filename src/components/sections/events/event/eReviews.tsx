"use client";
// components/sections/events/event/eReviews.tsx
// Displayed on /events/[slug] after the event ends.
// Shows aggregate star rating, review form (checked-in members only,
// within 30-day window), and the list of visible reviews.

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuStar,
  LuLoader,
  LuMessageSquare,
  LuEyeOff,
  LuUser,
  LuShieldCheck,
  LuCircleCheck,
  LuInfo,
  LuChevronDown,
  LuChevronUp,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReviewAuthor {
  name: string;
  avatar: string | null;
}

interface Review {
  id: string;
  rating: number;
  body: string | null;
  isAnonymous: boolean;
  createdAt: string;
  author: ReviewAuthor | null;
  isOwn: boolean;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  distribution: Record<string, number>;
}

interface ReviewWindow {
  isOpen: boolean;
  hasEnded: boolean;
  opensAt: string;
  closesAt: string;
}

interface MyReview {
  rating: number;
  body: string | null;
  isAnonymous: boolean;
  createdAt: string;
}

interface ReviewsData {
  reviews: Review[];
  stats: ReviewStats;
  window: ReviewWindow;
  myReview: MyReview | null;
  canReview: boolean;
}

interface Props {
  eventSlug: string;
  eventId: string;
  // Raw ISO dates passed from the server page for window calculation display
  endDateIso: string | null;
  eventDateIso: string;
  // Whether current user is an approved member — passed from server
  // so we can show the right gate message without an extra fetch
  isMember: boolean;
}

// ── Star display component ────────────────────────────────────────────────────

const StarDisplay: React.FC<{
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (r: number) => void;
}> = ({ rating, size = "md", interactive = false, onRate }) => {
  const [hovered, setHovered] = useState(0);
  const sizes = { sm: "w-3.5 h-3.5", md: "w-5 h-5", lg: "w-8 h-8" };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (interactive ? hovered || rating : rating);
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onRate?.(star)}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(0)}
            className={cn(
              "transition-transform",
              interactive && "hover:scale-110 cursor-pointer",
              !interactive && "cursor-default pointer-events-none",
            )}
          >
            <LuStar
              className={cn(
                sizes[size],
                "transition-colors",
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-slate-300",
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

// ── Distribution bar ──────────────────────────────────────────────────────────

const DistBar: React.FC<{ star: number; count: number; total: number }> = ({
  star,
  count,
  total,
}) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "text-[10px]",
          "font-black",
          "text-muted-foreground",
          "w-4",
          "text-right",
        )}
      >
        {star}
      </span>
      <LuStar className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: (5 - star) * 0.08 }}
          className="h-full bg-amber-400 rounded-full"
        />
      </div>
      <span
        className={cn(
          "text-[9px]",
          "font-bold",
          "text-muted-foreground",
          "w-5",
          "text-right",
        )}
      >
        {count}
      </span>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const EventReviewsSection: React.FC<Props> = ({
  eventSlug,
  isMember,
}) => {
  const { token } = useAuth();

  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formRating, setFormRating] = useState(0);
  const [formBody, setFormBody] = useState("");
  const [formAnonymous, setFormAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

   const docWindow = data?.window;
   const stats = data?.stats;
   const reviews = data?.reviews ?? [];
   const myReview = data?.myReview ?? null;

  // ── Fetch reviews ───────────────────────────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    if (!isMember) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Use the context token instead of localStorage
      const res = await fetch(`/api/events/${eventSlug}/reviews`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 403) {
        // Not a member — show gate
        setLoading(false);
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load reviews");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [eventSlug, isMember, token]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // ── Submit review ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (formRating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    setSubmitting(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("diuscadi_token")
          : null;
      const res = await fetch(`/api/events/${eventSlug}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          rating: formRating,
          body: formBody.trim() || undefined,
          isAnonymous: formAnonymous,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to submit review");
      toast.success("Review submitted!");
      setShowForm(false);
      setFormRating(0);
      setFormBody("");
      setFormAnonymous(false);
      // Refetch to show the new review
      await fetchReviews();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit review",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Early returns ────────────────────────────────────────────────────────────

  // Not a member — gate
  if (!isMember) {
    return (
      <section
        className={cn(
          "w-full",
          "max-w-7xl",
          "mx-auto",
          "px-4",
          "sm:px-6",
          "lg:px-8",
          "py-16",
        )}
      >
        <SectionHeader />
        <div
          className={cn(
            "flex",
            "items-center",
            "gap-4",
            "p-6",
            "bg-muted",
            "rounded-3xl",
            "border",
            "border-border",
          )}
        >
          <LuShieldCheck className="w-6 h-6 text-muted-foreground shrink-0" />
          <div>
            <p className={cn("text-sm", "font-black", "text-foreground")}>
              Members Only
            </p>
            <p
              className={cn(
                "text-[11px]",
                "font-bold",
                "text-muted-foreground",
                "mt-0.5",
              )}
            >
              Become a DIUSCADI member to read and write event reviews.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section
        className={cn(
          "w-full",
          "max-w-7xl",
          "mx-auto",
          "px-4",
          "sm:px-6",
          "lg:px-8",
          "py-16",
        )}
      >
        <SectionHeader />
        <div className="flex items-center justify-center py-12">
          <LuLoader className="w-6 h-6 text-primary animate-spin" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        className={cn(
          "w-full",
          "max-w-7xl",
          "mx-auto",
          "px-4",
          "sm:px-6",
          "lg:px-8",
          "py-16",
        )}
      >
        <SectionHeader />
        <div
          className={cn(
            "flex",
            "items-center",
            "gap-3",
            "p-4",
            "bg-rose-50",
            "border",
            "border-rose-100",
            "rounded-2xl",
          )}
        >
          <LuInfo className="w-4 h-4 text-rose-600 shrink-0" />
          <p className="text-[11px] font-bold text-rose-700">{error}</p>
        </div>
      </section>
    );
  }

 

  // Event hasn't ended yet — show "reviews open after event"
  if (docWindow && !docWindow.hasEnded) {
    return (
      <section
        className={cn(
          "w-full",
          "max-w-7xl",
          "mx-auto",
          "px-4",
          "sm:px-6",
          "lg:px-8",
          "py-16",
        )}
      >
        <SectionHeader />
        <div
          className={cn(
            "flex",
            "items-center",
            "gap-4",
            "p-6",
            "bg-muted",
            "rounded-3xl",
            "border",
            "border-border",
          )}
        >
          <LuMessageSquare className="w-6 h-6 text-muted-foreground shrink-0" />
          <div>
            <p className={cn("text-sm", "font-black", "text-foreground")}>
              Reviews Open After the Event
            </p>
            <p
              className={cn(
                "text-[11px]",
                "font-bold",
                "text-muted-foreground",
                "mt-0.5",
              )}
            >
              Come back after the event ends to share your experience.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "w-full",
        "max-w-7xl",
        "mx-auto",
        "px-4",
        "sm:px-6",
        "lg:px-8",
        "py-16",
      )}
    >
      <SectionHeader count={stats?.totalReviews} />

      <div className={cn("grid", "grid-cols-1", "lg:grid-cols-3", "gap-10")}>
        {/* ── Left: aggregate + form ────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Aggregate card */}
          {stats && stats.totalReviews > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={cn(
                "p-6",
                "bg-muted",
                "rounded-3xl",
                "border",
                "border-border",
                "space-y-5",
              )}
            >
              <div className="flex items-end gap-3">
                <span
                  className={cn(
                    "text-5xl",
                    "font-black",
                    "text-foreground",
                    "leading-none",
                  )}
                >
                  {stats.averageRating.toFixed(1)}
                </span>
                <div className="pb-1 space-y-1">
                  <StarDisplay
                    rating={Math.round(stats.averageRating)}
                    size="md"
                  />
                  <p
                    className={cn(
                      "text-[10px]",
                      "font-bold",
                      "text-muted-foreground",
                      "uppercase",
                      "tracking-widest",
                    )}
                  >
                    {stats.totalReviews} review
                    {stats.totalReviews !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => (
                  <DistBar
                    key={star}
                    star={star}
                    count={stats.distribution[String(star)] ?? 0}
                    total={stats.totalReviews}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Already reviewed */}
          {myReview && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={cn(
                "p-5",
                "bg-emerald-50",
                "border",
                "border-emerald-100",
                "rounded-3xl",
                "space-y-3",
              )}
            >
              <div className="flex items-center gap-2">
                <LuCircleCheck className="w-4 h-4 text-emerald-600" />
                <p
                  className={cn(
                    "text-[11px]",
                    "font-black",
                    "text-emerald-700",
                    "uppercase",
                    "tracking-widest",
                  )}
                >
                  Your Review
                </p>
              </div>
              <StarDisplay rating={myReview.rating} size="sm" />
              {myReview.body && (
                <p
                  className={cn(
                    "text-[11px]",
                    "font-bold",
                    "text-emerald-800",
                    "leading-relaxed",
                  )}
                >
                  {myReview.body}
                </p>
              )}
              <p
                className={cn(
                  "text-[9px]",
                  "font-bold",
                  "text-emerald-600",
                  "uppercase",
                  "tracking-widest",
                )}
              >
                {myReview.isAnonymous
                  ? "Posted anonymously"
                  : "Posted with your name"}{" "}
                ·{" "}
                {new Date(myReview.createdAt).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </motion.div>
          )}

          {/* Review form — only if docWindow is open and not yet reviewed */}
          {docWindow?.isOpen && !myReview && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {data?.canReview ? (
                /* The User IS checked in - Show the normal form wrapper */
                <div
                  className={cn(
                    "border",
                    "border-border",
                    "rounded-3xl",
                    "overflow-hidden",
                  )}
                >
                  <button
                    onClick={() => setShowForm((s) => !s)}
                    className={cn(
                      "w-full",
                      "flex",
                      "items-center",
                      "justify-between",
                      "p-5",
                      "bg-muted",
                      "hover:bg-muted/80",
                      "transition-colors",
                      "cursor-pointer",
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm",
                        "font-black",
                        "text-foreground",
                        "uppercase",
                        "tracking-tight",
                      )}
                    >
                      Write a Review
                    </span>
                    {showForm ? (
                      <LuChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <LuChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showForm && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 space-y-5 bg-background">
                          {/* Star picker */}
                          <div className="space-y-2">
                            <label
                              className={cn(
                                "text-[10px]",
                                "font-black",
                                "uppercase",
                                "tracking-widest",
                                "text-muted-foreground",
                              )}
                            >
                              Your Rating *
                            </label>
                            <StarDisplay
                              rating={formRating}
                              size="lg"
                              interactive
                              onRate={setFormRating}
                            />
                            {formRating > 0 && (
                              <p
                                className={cn(
                                  "text-[10px]",
                                  "font-bold",
                                  "text-muted-foreground",
                                )}
                              >
                                {
                                  [
                                    "",
                                    "Poor",
                                    "Fair",
                                    "Good",
                                    "Very Good",
                                    "Excellent",
                                  ][formRating]
                                }
                              </p>
                            )}
                          </div>

                          {/* Body */}
                          <div className="space-y-2">
                            <label
                              className={cn(
                                "text-[10px]",
                                "font-black",
                                "uppercase",
                                "tracking-widest",
                                "text-muted-foreground",
                              )}
                            >
                              Your Review (Optional)
                            </label>
                            <textarea
                              value={formBody}
                              onChange={(e) =>
                                setFormBody(e.target.value.slice(0, 500))
                              }
                              placeholder="Share what you learned, what stood out, or what could be improved..."
                              rows={4}
                              className={cn(
                                "w-full",
                                "bg-muted",
                                "border",
                                "border-border",
                                "p-3",
                                "rounded-2xl",
                                "text-xs",
                                "font-medium",
                                "outline-none",
                                "focus:border-primary",
                                "transition-all",
                                "resize-none",
                              )}
                            />
                            <p
                              className={cn(
                                "text-[9px]",
                                "font-bold",
                                "text-muted-foreground",
                                "text-right",
                              )}
                            >
                              {formBody.length}/500
                            </p>
                          </div>

                          {/* Anonymous toggle */}
                          <div
                            className={cn(
                              "flex",
                              "items-center",
                              "justify-between",
                              "p-4",
                              "bg-muted",
                              "rounded-2xl",
                            )}
                          >
                            <div>
                              <p
                                className={cn(
                                  "text-[11px]",
                                  "font-black",
                                  "text-foreground",
                                )}
                              >
                                Post Anonymously
                              </p>
                              <p
                                className={cn(
                                  "text-[9px]",
                                  "font-bold",
                                  "text-muted-foreground",
                                )}
                              >
                                Your name will be hidden from other members
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormAnonymous((s) => !s)}
                              className={cn(
                                "w-11",
                                "h-6",
                                "rounded-full",
                                "p-0.5",
                                "transition-colors",
                                "cursor-pointer",
                                "shrink-0",
                                formAnonymous ? "bg-primary" : "bg-slate-300",
                              )}
                            >
                              <motion.div
                                animate={{ x: formAnonymous ? 20 : 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 30,
                                }}
                                className="w-5 h-5 bg-white rounded-full shadow-sm"
                              />
                            </button>
                          </div>

                          {/* Submit */}
                          <button
                            onClick={handleSubmit}
                            disabled={submitting || formRating === 0}
                            className={cn(
                              "w-full",
                              "py-3",
                              "bg-foreground",
                              "text-background",
                              "rounded-2xl",
                              "text-[11px]",
                              "font-black",
                              "uppercase",
                              "tracking-widest",
                              "hover:bg-primary",
                              "hover:text-foreground",
                              "transition-colors",
                              "disabled:opacity-50",
                              "disabled:cursor-not-allowed",
                              "flex",
                              "items-center",
                              "justify-center",
                              "gap-2",
                            )}
                          >
                            {submitting && (
                              <LuLoader className="w-3.5 h-3.5 animate-spin" />
                            )}
                            {submitting ? "Submitting…" : "Submit Review"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* The User IS NOT checked in - Show the locked warning */
                <div
                  className={cn(
                    "p-5",
                    "bg-amber-50",
                    "border",
                    "border-amber-100",
                    "rounded-3xl",
                    "flex",
                    "gap-3",
                  )}
                >
                  <LuInfo className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p
                      className={cn(
                        "text-[11px]",
                        "font-black",
                        "text-amber-700",
                        "uppercase",
                        "tracking-widest",
                      )}
                    >
                      Check-in Required
                    </p>
                    <p
                      className={cn(
                        "text-xs",
                        "font-bold",
                        "text-amber-800/80",
                        "mt-1",
                        "leading-relaxed",
                      )}
                    >
                      You must be checked in to this event to unlock comments
                      and reviews. If you attended but missed the check-in,
                      please contact an admin.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* docWindow closed notice */}
          {docWindow &&
            docWindow.hasEnded &&
            !docWindow.isOpen &&
            !myReview && (
              <div
                className={cn(
                  "flex",
                  "items-center",
                  "gap-3",
                  "p-4",
                  "bg-muted",
                  "rounded-2xl",
                  "border",
                  "border-border",
                )}
              >
                <LuEyeOff className="w-4 h-4 text-muted-foreground shrink-0" />
                <p
                  className={cn(
                    "text-[11px]",
                    "font-bold",
                    "text-muted-foreground",
                  )}
                >
                  The 30-day review window has closed.
                </p>
              </div>
            )}
        </div>

        {/* ── Right: reviews list ───────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {reviews.length === 0 ? (
            <div
              className={cn(
                "flex",
                "flex-col",
                "items-center",
                "justify-center",
                "py-16",
                "text-center",
                "gap-3",
              )}
            >
              <LuMessageSquare className="w-10 h-10 text-slate-200" />
              <p
                className={cn(
                  "text-sm",
                  "font-black",
                  "text-muted-foreground",
                  "uppercase",
                  "tracking-widest",
                )}
              >
                No reviews yet
              </p>
              {docWindow?.isOpen && !myReview && (
                <p
                  className={cn(
                    "text-[11px]",
                    "font-bold",
                    "text-muted-foreground",
                  )}
                >
                  Be the first to share your experience.
                </p>
              )}
            </div>
          ) : (
            reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "p-6",
                  "rounded-3xl",
                  "border",
                  "border-border",
                  "space-y-3",
                  review.isOwn
                    ? "bg-primary/5 border-primary/20"
                    : "bg-background",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar or anonymous circle */}
                    <div
                      className={cn(
                        "w-9",
                        "h-9",
                        "rounded-full",
                        "flex",
                        "items-center",
                        "justify-center",
                        "bg-muted",
                        "border",
                        "border-border",
                        "shrink-0",
                        "overflow-hidden",
                        "text-muted-foreground",
                        "font-black",
                        "text-sm",
                      )}
                    >
                      {review.isAnonymous || !review.author ? (
                        <LuUser className="w-4 h-4" />
                      ) : review.author.avatar ? (
                        <Image
                          width={500}
                          height={300}
                          src={review.author.avatar}
                          alt={review.author.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>
                          {review.author.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-sm",
                          "font-black",
                          "text-foreground",
                        )}
                      >
                        {review.isAnonymous || !review.author
                          ? "Anonymous Member"
                          : review.author.name}
                        {review.isOwn && (
                          <span
                            className={cn(
                              "ml-2",
                              "text-[8px]",
                              "font-black",
                              "text-primary",
                              "uppercase",
                              "tracking-widest",
                              "bg-primary/10",
                              "px-1.5",
                              "py-0.5",
                              "rounded",
                            )}
                          >
                            You
                          </span>
                        )}
                      </p>
                      <p
                        className={cn(
                          "text-[9px]",
                          "font-bold",
                          "text-muted-foreground",
                          "uppercase",
                          "tracking-widest",
                        )}
                      >
                        {new Date(review.createdAt).toLocaleDateString(
                          "en-NG",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                  <StarDisplay rating={review.rating} size="sm" />
                </div>
                {review.body && (
                  <p
                    className={cn(
                      "text-sm",
                      "font-medium",
                      "text-slate-600",
                      "leading-relaxed",
                    )}
                  >
                    {review.body}
                  </p>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

// ── Section header ────────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ count?: number }> = ({ count }) => (
  <div className={cn("flex", "items-center", "gap-3", "mb-8")}>
    <div className={cn("p-2", "bg-amber-50", "rounded-xl")}>
      <LuStar className={cn("w-5", "h-5", "text-amber-500")} />
    </div>
    <h2
      className={cn(
        "text-2xl",
        "font-black",
        "text-foreground",
        "tracking-tight",
      )}
    >
      Reviews & Ratings
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "ml-3",
            "text-base",
            "font-bold",
            "text-muted-foreground",
          )}
        >
          ({count})
        </span>
      )}
    </h2>
  </div>
);
