// GET  /api/admin/settings/locations — paginated pending list
// PATCH /api/admin/settings/locations — approve or reject by ID
import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { CustomLocationDocument } from "@/lib/models/CustomLocation";

type LocationStatus = CustomLocationDocument["status"];
type LocationAction = Exclude<LocationStatus, "pending">;

const VALID_STATUSES: LocationStatus[] = ["pending", "verified", "rejected"];
const VALID_ACTIONS: LocationAction[] = ["verified", "rejected"];

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  if (!["admin", "webmaster"].includes(req.auth.role)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }
  const { searchParams } = new URL(req.url);
  const rawStatus = searchParams.get("status") ?? "pending";
  const status: LocationStatus = VALID_STATUSES.includes(
    rawStatus as LocationStatus,
  )
    ? (rawStatus as LocationStatus)
    : "pending";

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;
  const skip = (page - 1) * limit;
  const db = await getDb();
  const [locations, total] = await Promise.all([
    Collections.customLocations(db)
      .find({ status })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    Collections.customLocations(db).countDocuments({ status }),
  ]);
  return NextResponse.json({
    locations: locations.map((l) => ({
      ...l,
      _id: l._id!.toString(),
      submittedBy: l.submittedBy.toString(),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  if (!["admin", "webmaster"].includes(req.auth.role)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }
  const { id, action } = await req.json();
  if (!id || !ObjectId.isValid(id) || !VALID_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: "Invalid id or action" },
      { status: 400 },
    );
  }
  const db = await getDb();
  await Collections.customLocations(db).updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: action as LocationAction,
        reviewedAt: new Date(),
        reviewedBy: new ObjectId(req.auth.vaultId),
      },
    },
  );
  return NextResponse.json({ message: `Location ${action}` });
});
