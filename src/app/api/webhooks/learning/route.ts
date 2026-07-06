// src/app/api/webhooks/learning/route.ts
// ─── POST /api/webhooks/learning ───────────────────────────────────────────────
// SCAFFOLD ONLY — not yet implemented. This route exists so the eventual
// PandaAcademy / UniArchive integration has a stable URL to point at once
// those platforms are ready, without requiring a route-creation PR at that
// time. Currently returns 501 for every request.
//
// ── TODO when PandaAcademy / UniArchive are ready ──────────────────────────
//
//   1. Define the expected payload shape from each external platform. Likely:
//        {
//          platform: "panda_academy" | "uni_archive",
//          externalCourseId: string,
//          userIdentifier: string,   // email or external user ID — needs a
//                                    // mapping table or matched against
//                                    // userData.email
//          completedAt: string,     // ISO timestamp
//          signature: string,       // HMAC signature for verification
//        }
//
//   2. Verify the webhook signature against task.learningConfig.webhookSecret
//      (per-task secret, looked up by matching externalCourseId across all
//      active learning-type tasks). Reject with 401 on mismatch.
//
//   3. Resolve the target assignment:
//        a. Find the task where learningConfig.externalCourseId matches.
//        b. Resolve userIdentifier → userData._id (likely via email match).
//        c. Find the assignment for that task + user.
//        d. If no assignment exists (task wasn't broadcast to this user, or
//           user wasn't a member when it spawned), decide whether to:
//             - reject the webhook (safest default), or
//             - dynamically create an assignment (requires scope decision —
//               does external completion bypass platform membership gates?)
//
//   4. Apply lateness decay using calculateInstantTaskPoints() from
//      timeDecayService.ts, anchored to task.deadline vs completedAt — same
//      mechanic as poll/survey/acknowledgement. Learning tasks should behave
//      identically to those three for reward purposes once this is built.
//
//   5. Credit points via pointsService.creditTaskPoints() with
//      source: "task_learning".
//
//   6. Idempotency: webhooks can be retried by the sending platform. Guard
//      against double-crediting using the same pattern as creditTaskPoints'
//      existing idempotency check (keyed on assignmentId + source).
//
//   7. Respond 200 quickly — external platforms typically expect fast
//      acknowledgement and will retry on timeout, which risks duplicate
//      processing if step 6's idempotency guard isn't airtight.
//
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Intentionally not parsing the body yet — there is nothing to do with it.
  // Returning 501 (Not Implemented) rather than 404 so monitoring on the
  // external platform side (once configured) gets a clear "this endpoint
  // exists but isn't live yet" signal instead of a generic not-found.
  return NextResponse.json(
    {
      error:
        "Learning platform webhook integration is not yet implemented. " +
        "This endpoint is scaffolded for future use — see TODO comments " +
        "in this route file for the implementation plan.",
    },
    { status: 501 },
  );
}
