// src/lib/services/cloudinaryCleanupService.ts
import { Db, ObjectId } from "mongodb";
import { Collections } from "@/lib/db/collections";
import type { DbAssignment } from "@/lib/db/dbTypes";
import type { WithId } from "mongodb";

export interface EvaluationSnapshot {
  taskTitle: string;
  taskDescription: string;
  committeeSlug: string;
  deliverables: {
    label: string;
    type: string;
    value: string | null;
    wasImage: boolean;
  }[];
  additionalNotes: string;
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  pointsAwarded: number | null;
  evaluatedAt: string;
  evaluatorType: string;
  feedback: string;
  snapshotAt: string;
}

function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i);
    if (match?.[1]) return match[1];
    return null;
  } catch {
    return null;
  }
}

async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/media/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-cleanup-secret": process.env.CLOUDINARY_CLEANUP_SECRET ?? "",
    },
    body: JSON.stringify({ publicId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      `Cloudinary delete failed for ${publicId}: ${data.error ?? res.status}`,
    );
  }
}

export interface CleanupInput {
  db: Db;
  assignment: WithId<DbAssignment>;
  taskTitle: string;
  taskDescription: string;
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  pointsAwarded: number | null;
  evaluatedAt: Date;
  evaluatorType: string;
  feedback: string;
}

export async function runPostEvaluationCleanup(
  input: CleanupInput,
): Promise<void> {
  const {
    db,
    assignment,
    taskTitle,
    taskDescription,
    totalScore,
    maxScore,
    percentageScore,
    pointsAwarded,
    evaluatedAt,
    evaluatorType,
    feedback,
  } = input;

  try {
    const submission = assignment.submission;
    if (!submission?.items?.length) return;

    const now = new Date();
    const snapshotDeliverables: EvaluationSnapshot["deliverables"] = [];
    const publicIdsToDelete: string[] = [];

    for (const item of submission.items) {
      const isImage = item.type === "image_url" || item.type === "file_url";
      if (isImage && item.value) {
        const publicId = extractPublicId(item.value);
        if (publicId) publicIdsToDelete.push(publicId);
        snapshotDeliverables.push({
          label: item.deliverableLabel,
          type: item.type,
          value: null,
          wasImage: true,
        });
      } else {
        snapshotDeliverables.push({
          label: item.deliverableLabel,
          type: item.type,
          value: item.value,
          wasImage: false,
        });
      }
    }

    const snapshot: EvaluationSnapshot = {
      taskTitle,
      taskDescription,
      committeeSlug: assignment.committeeSlug,
      deliverables: snapshotDeliverables,
      additionalNotes: submission.additionalNotes ?? "",
      totalScore,
      maxScore,
      percentageScore,
      pointsAwarded,
      evaluatedAt: evaluatedAt.toISOString(),
      evaluatorType,
      feedback,
      snapshotAt: now.toISOString(),
    };

    // Write snapshot BEFORE deleting — never lose data record
    await Collections.assignments(db).updateOne(
      { _id: assignment._id as ObjectId },
      {
        $set: {
          evaluationSnapshot: snapshot,
          "submission.items": snapshotDeliverables.map((d) => ({
            deliverableLabel: d.label,
            type: d.type,
            value: d.value ?? "[image removed after evaluation]",
          })),
          updatedAt: now,
        },
      },
    );

    if (publicIdsToDelete.length > 0) {
      const results = await Promise.allSettled(
        publicIdsToDelete.map((id) => deleteCloudinaryAsset(id)),
      );
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(
            `[cloudinaryCleanup] Failed to delete ${publicIdsToDelete[i]}:`,
            r.reason,
          );
        }
      });
      const deleted = results.filter((r) => r.status === "fulfilled").length;
      console.log(
        `[cloudinaryCleanup] Assignment ${(assignment._id as ObjectId).toString()}: ${deleted}/${publicIdsToDelete.length} deleted.`,
      );
    }
  } catch (err) {
    console.error(
      `[cloudinaryCleanup] Non-fatal error for assignment ${(assignment._id as ObjectId).toString()}:`,
      err,
    );
  }
}
