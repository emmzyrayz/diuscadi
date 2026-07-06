// src/lib/services/timeDecayService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Computes the time-decay multiplier for submission task scoring.
//
// MECHANIC SUMMARY (locked spec — do not alter without updating all callers):
//   • Clock starts at task.publishedAt (NOT createdAt). createdAt/createdBy
//     remain pure audit fields and never feed into scoring.
//   • hoursElapsed = assignment.submission.submittedAt − task.publishedAt
//   • The multiplier is computed and snapshotted AT SUBMISSION TIME. A late
//     evaluator review never changes it — it is frozen into the assignment's
//     evaluation record at the moment the bot or admin scores the submission.
//   • Brackets step down by a flat −0.20 per tier: 1.0, 0.8, 0.6, 0.4, 0.2, 0.0
//   • Each bracket's duration is 1.5× the previous bracket's duration,
//     stacked cumulatively — so brackets get progressively wider, cushioning
//     the penalty for late (but not extremely late) submissions.
//   • decayBaseHours (per-task, default 4) is the duration of bracket 1.
//     All subsequent brackets derive from it: bracket N duration =
//     bracket(N-1) duration × 1.5.
//   • Once hoursElapsed exceeds the last bracket's upper bound, multiplier = 0.
//   • ONLY applies to taskType === "submission". All other task types
//     (poll, survey, acknowledgement, learning) ignore this entirely and
//     pay flat task.pointsReward.
//
// Final score formula for a submission task:
//   qualityPoints = (qualityWeight / 100) × task.pointsReward × (evaluationPercentage / 100)
//   timeBonusPoints = (timeWeight / 100) × task.pointsReward × timeMultiplier
//   totalPoints = round(qualityPoints + timeBonusPoints)
//
// qualityWeight + timeWeight must always sum to 100 — validated at task
// creation time in the create route, not re-validated here (this module
// trusts its inputs).
// ─────────────────────────────────────────────────────────────────────────────

const DECAY_STEP = 0.2; // flat multiplier decrement per bracket
const BRACKET_GROWTH = 1.5; // each bracket is 1.5x the duration of the last
const MAX_BRACKETS = 5; // 5 step-downs reaches 0.0 (1.0 → 0.8 → 0.6 → 0.4 → 0.2 → 0)

export interface TimeBracket {
  // Bracket index, 0-based. Bracket 0 = the first (full-multiplier) window.
  index: number;
  // Hours elapsed at which this bracket begins (inclusive).
  startHour: number;
  // Hours elapsed at which this bracket ends (exclusive). Infinity for
  // a conceptual "beyond all brackets" marker — not actually returned.
  endHour: number;
  // The multiplier applied during this bracket.
  multiplier: number;
}

// ── buildBrackets ───────────────────────────────────────────────────────────
// Given a task's decayBaseHours, returns the full ordered list of brackets.
// Pure function — same input always produces the same brackets. Used by both
// the scoring calculation and the admin UI (to preview the decay curve when
// creating a task).

export function buildBrackets(decayBaseHours: number): TimeBracket[] {
  const base = decayBaseHours > 0 ? decayBaseHours : 4; // guard against 0/negative
  const brackets: TimeBracket[] = [];

  let bracketDuration = base;
  let cursor = 0;
  let multiplier = 1.0;

  for (let i = 0; i < MAX_BRACKETS; i++) {
    const startHour = cursor;
    const endHour = cursor + bracketDuration;

    brackets.push({
      index: i,
      startHour,
      endHour,
      multiplier: Math.round(multiplier * 100) / 100, // avoid float drift
    });

    cursor = endHour;
    multiplier -= DECAY_STEP;
    bracketDuration *= BRACKET_GROWTH;
  }

  return brackets;
}

// ── getTimeMultiplier ────────────────────────────────────────────────────────
// Given hoursElapsed and the task's decayBaseHours, returns the multiplier
// that applies. Returns 0 if hoursElapsed falls beyond all brackets.

export function getTimeMultiplier(
  hoursElapsed: number,
  decayBaseHours: number,
): number {
  if (hoursElapsed < 0) return 1.0; // defensive — submission before publish (clock skew)

  const brackets = buildBrackets(decayBaseHours);

  for (const bracket of brackets) {
    if (hoursElapsed >= bracket.startHour && hoursElapsed < bracket.endHour) {
      return bracket.multiplier;
    }
  }

  // Beyond the last bracket's endHour — fully decayed.
  return 0.0;
}

// ── calculateSubmissionPoints ────────────────────────────────────────────────
// The single function called by the evaluation pipeline (bot or manual) to
// compute final points for a submission task. This is the ONLY place this
// formula should be implemented — botEvaluationService.ts and the manual
// evaluate route both call this rather than reimplementing the math.

export interface CalculateSubmissionPointsInput {
  // Task configuration
  pointsReward: number; // total possible points for this task
  qualityWeight: number; // 0-100, % of pointsReward driven by evaluation score
  timeWeight: number; // 0-100, % of pointsReward driven by time decay
  decayBaseHours: number; // duration of bracket 1, in hours
  passThresholdPercent: number; // minimum evaluationPercentage to earn ANY points

  // Submission-specific data
  evaluationPercentage: number; // 0-100, the quality score from Gemini/manual eval
  publishedAt: Date; // task.publishedAt — clock start
  submittedAt: Date; // assignment.submission.submittedAt — clock stop
}

export interface CalculateSubmissionPointsResult {
  passed: boolean; // did evaluationPercentage meet passThresholdPercent?
  qualityPoints: number; // points earned from the quality component
  timeBonusPoints: number; // points earned from the time component
  totalPoints: number; // qualityPoints + timeBonusPoints, rounded
  timeMultiplier: number; // the multiplier that was applied (for audit/display)
  hoursElapsed: number; // raw hours between publish and submission
}

export function calculateSubmissionPoints(
  input: CalculateSubmissionPointsInput,
): CalculateSubmissionPointsResult {
  const {
    pointsReward,
    qualityWeight,
    timeWeight,
    decayBaseHours,
    passThresholdPercent,
    evaluationPercentage,
    publishedAt,
    submittedAt,
  } = input;

  const hoursElapsed =
    (submittedAt.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);

  const passed = evaluationPercentage >= passThresholdPercent;

  // No points at all if the submission didn't meet the quality bar —
  // this applies to BOTH the quality and time components. A fast but
  // low-quality submission earns nothing; quality gate comes first.
  if (!passed) {
    return {
      passed: false,
      qualityPoints: 0,
      timeBonusPoints: 0,
      totalPoints: 0,
      timeMultiplier: 0,
      hoursElapsed: Math.round(hoursElapsed * 100) / 100,
    };
  }

  const timeMultiplier = getTimeMultiplier(hoursElapsed, decayBaseHours);

  const maxQualityPoints = (qualityWeight / 100) * pointsReward;
  const maxTimePoints = (timeWeight / 100) * pointsReward;

  // Quality points scale with the evaluation percentage itself — a 75% score
  // earns 75% of the quality slice, not all-or-nothing.
  const qualityPoints = maxQualityPoints * (evaluationPercentage / 100);
  const timeBonusPoints = maxTimePoints * timeMultiplier;

  const totalPoints = Math.round(qualityPoints + timeBonusPoints);

  return {
    passed: true,
    qualityPoints: Math.round(qualityPoints * 100) / 100,
    timeBonusPoints: Math.round(timeBonusPoints * 100) / 100,
    totalPoints,
    timeMultiplier,
    hoursElapsed: Math.round(hoursElapsed * 100) / 100,
  };
}

// ── calculateInstantTaskPoints ───────────────────────────────────────────────
// Used by poll, survey, and acknowledgement tasks — instant-complete types
// with no quality score, only a flat pointsReward subject to lateness decay.
//
// MECHANIC SUMMARY:
//   • On-time (respondedAt <= task.deadline) → full pointsReward, no decay.
//   • Late but task.acceptResponsesAfterDeadline === false → rejected
//     entirely. This function is not even called in that case — the route
//     layer checks acceptResponsesAfterDeadline BEFORE calling this, since
//     a hard rejection has no points calculation at all.
//   • Late and accepted → hoursPastDeadline is multiplied by
//     latenessStretchFactor (per-task, default 0.5, range 0-1) BEFORE being
//     fed into the same getTimeMultiplier() bracket curve used by
//     submission tasks. A stretch factor of 0.5 means a 24-hour-late
//     response is evaluated as if it were only 12 hours late — gentler
//     decay than the submission-task curve, but still reaches 0 eventually.
//     No floor — deliberately omitted so very late responses can still earn
//     zero, per product decision.
//
// decayBaseHours still controls bracket 1's width, same as submission tasks.
// If a task doesn't set its own decayBaseHours, the global default (4) applies.

export interface CalculateInstantTaskPointsInput {
  pointsReward: number;
  deadline: Date;
  respondedAt: Date;
  acceptResponsesAfterDeadline: boolean;
  latenessStretchFactor?: number; // 0-1, default 0.5
  decayBaseHours?: number; // default 4
}

export interface CalculateInstantTaskPointsResult {
  accepted: boolean;
  pointsEarned: number;
  isLate: boolean;
  hoursPastDeadline: number; // raw, unstretched
  effectiveHoursPastDeadline: number; // after stretch factor applied
  timeMultiplier: number;
  reason?: "deadline_closed";
}

export function calculateInstantTaskPoints(
  input: CalculateInstantTaskPointsInput,
): CalculateInstantTaskPointsResult {
  const {
    pointsReward,
    deadline,
    respondedAt,
    acceptResponsesAfterDeadline,
    latenessStretchFactor = 0.5,
    decayBaseHours = 4,
  } = input;

  const msPastDeadline = respondedAt.getTime() - deadline.getTime();

  // On-time — full reward, no decay calculation needed.
  if (msPastDeadline <= 0) {
    return {
      accepted: true,
      pointsEarned: pointsReward,
      isLate: false,
      hoursPastDeadline: 0,
      effectiveHoursPastDeadline: 0,
      timeMultiplier: 1.0,
    };
  }

  const hoursPastDeadline = msPastDeadline / (1000 * 60 * 60);

  // Late and the task does not accept late responses — hard reject.
  // The route layer should ideally check this before even calling this
  // function (to avoid writing a rejected response at all), but this
  // function also enforces it defensively for any other caller.
  if (!acceptResponsesAfterDeadline) {
    return {
      accepted: false,
      pointsEarned: 0,
      isLate: true,
      hoursPastDeadline: Math.round(hoursPastDeadline * 100) / 100,
      effectiveHoursPastDeadline: 0,
      timeMultiplier: 0,
      reason: "deadline_closed",
    };
  }

  // Late but accepted — apply the stretch factor, then reuse the exact
  // same bracket curve as submission tasks. No floor.
  const clampedStretch = Math.max(0, Math.min(1, latenessStretchFactor));
  const effectiveHoursPastDeadline = hoursPastDeadline * clampedStretch;
  const timeMultiplier = getTimeMultiplier(
    effectiveHoursPastDeadline,
    decayBaseHours,
  );

  const pointsEarned = Math.round(pointsReward * timeMultiplier);

  return {
    accepted: true,
    pointsEarned,
    isLate: true,
    hoursPastDeadline: Math.round(hoursPastDeadline * 100) / 100,
    effectiveHoursPastDeadline:
      Math.round(effectiveHoursPastDeadline * 100) / 100,
    timeMultiplier,
  };
}

// ── validateWeightSplit ──────────────────────────────────────────────────────
// Called by the task creation route to enforce qualityWeight + timeWeight = 100.
// Kept here (not duplicated in the route) so the constraint lives next to the
// formula that depends on it.

export function validateWeightSplit(
  qualityWeight: number,
  timeWeight: number,
): { valid: boolean; error?: string } {
  if (qualityWeight < 0 || qualityWeight > 100) {
    return { valid: false, error: "qualityWeight must be between 0 and 100" };
  }
  if (timeWeight < 0 || timeWeight > 100) {
    return { valid: false, error: "timeWeight must be between 0 and 100" };
  }
  if (qualityWeight + timeWeight !== 100) {
    return {
      valid: false,
      error: `qualityWeight + timeWeight must equal 100 (got ${qualityWeight + timeWeight})`,
    };
  }
  return { valid: true };
}
