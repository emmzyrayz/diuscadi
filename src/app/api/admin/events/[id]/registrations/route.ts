import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId, Filter } from "mongodb";
import { IGuestEventRegistrationDocument } from "@/lib/models/GuestEventRegistration";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/events/[id]/registrations
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_ROLES = ["admin", "webmaster", "moderator"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

type Context = {
  params?: Promise<Record<string, string>> | Record<string, string>;
};

// Narrow union so TypeScript accepts the literal as a Filter value
type RegistrationStatus = "registered" | "checked-in" | "cancelled";
const VALID_STATUSES: RegistrationStatus[] = [
  "registered",
  "checked-in",
  "cancelled",
];

export const GET = withAuth(
  async (req: AuthenticatedRequest, context?: Context) => {
    try {
      // ── 1. Role guard ──────────────────────────────────────────────────────
      if (!ALLOWED_ROLES.includes(req.auth.role as AllowedRole)) {
        return NextResponse.json(
          { error: "Forbidden: admin access required" },
          { status: 403 },
        );
      }

      // ── 2. Resolve dynamic route param ─────────────────────────────────────
      const params = context?.params
        ? await Promise.resolve(context.params)
        : {};
      const eventId = (params as Record<string, string>).id;

      if (!eventId || !ObjectId.isValid(eventId)) {
        return NextResponse.json(
          { error: "Invalid or missing event ID" },
          { status: 400 },
        );
      }

      // ── 3. Parse query params ───────────────────────────────────────────────
      const { searchParams } = new URL(req.url);
      const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
      const limit = Math.min(
        50,
        Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
      );
      const skip = (page - 1) * limit;
      const statusFilter = searchParams.get("status") ?? "all";
      const typeFilter = searchParams.get("type") ?? "all";

      const db = await getDb();
      const eventObjId = new ObjectId(eventId);

      // ── 4. Build status match clause ────────────────────────────────────────
      // Narrow to the literal union before using in Filters so TS is satisfied.
      const isValidStatus = (s: string): s is RegistrationStatus =>
        VALID_STATUSES.includes(s as RegistrationStatus);

      const statusValue: RegistrationStatus | undefined =
        statusFilter !== "all" && isValidStatus(statusFilter)
          ? statusFilter
          : undefined;

      // ── 5. Account registrations aggregation pipeline ───────────────────────
      const accountPipeline = [
        {
          $match: {
            eventId: eventObjId,
            ...(statusValue
              ? { status: statusValue }
              : { status: { $ne: "cancelled" } }),
          },
        },
        {
          $lookup: {
            from: "userData",
            localField: "userId",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  fullName: 1,
                  email: 1,
                  phone: 1,
                  "Institution.name": 1,
                  "Institution.department": 1,
                  "Institution.faculty": 1,
                  "Institution.level": 1,
                  membershipStatus: 1,
                },
              },
            ],
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmpty: true } },
        {
          $project: {
            _id: 1,
            registrationType: { $literal: "Account" },
            fullName: "$user.fullName",
            email: "$user.email",
            phone: "$user.phone",
            institution: {
              name: "$user.Institution.name",
              department: "$user.Institution.department",
              faculty: "$user.Institution.faculty",
              level: "$user.Institution.level",
            },
            membershipStatus: "$user.membershipStatus",
            inviteCode: 1,
            ticketTypeId: 1,
            status: 1,
            registeredAt: 1,
            checkedInAt: 1,
            referralCodeUsed: 1,
          },
        },
      ];

      // ── 6. Guest registrations aggregation pipeline ─────────────────────────
      const guestPipeline = [
        {
          $match: {
            eventId: eventObjId,
            verifiedAt: { $exists: true, $ne: null },
            ...(statusValue
              ? { status: statusValue }
              : { status: { $ne: "cancelled" } }),
          },
        },
        {
          $project: {
            _id: 1,
            registrationType: { $literal: "Guest" },
            fullName: 1,
            email: 1,
            phone: 1,
            institution: { $literal: null },
            membershipStatus: { $literal: null },
            inviteCode: 1,
            ticketTypeId: 1,
            status: 1,
            registeredAt: 1,
            checkedInAt: 1,
            referralCodeUsed: 1,
            verifiedAt: 1,
          },
        },
      ];

      // ── 7. Execute queries in parallel based on typeFilter ──────────────────
      const fetchAccount = typeFilter === "all" || typeFilter === "Account";
      const fetchGuest = typeFilter === "all" || typeFilter === "Guest";

      // guestEventRegistrations is typed via the raw MongoDB driver so we cast
      // to the document interface directly — no Mongoose model needed here.
      const guestCollection = db.collection<IGuestEventRegistrationDocument>(
        "guestEventRegistrations",
      );

      const [
        accountRegs,
        guestRegs,
        accountTotal,
        guestTotal,
        accountCheckedIn,
        guestCheckedIn,
      ] = await Promise.all([
        fetchAccount
          ? Collections.eventRegistrations(db)
              .aggregate(accountPipeline)
              .toArray()
          : Promise.resolve([]),

        fetchGuest
          ? guestCollection.aggregate(guestPipeline).toArray()
          : Promise.resolve([]),

        fetchAccount
          ? Collections.eventRegistrations(db).countDocuments({
              eventId: eventObjId,
              ...(statusValue
                ? { status: statusValue }
                : { status: { $ne: "cancelled" } }),
            })
          : Promise.resolve(0),

        fetchGuest
          ? guestCollection.countDocuments({
              eventId: eventObjId,
              ...(statusValue
                ? { status: statusValue }
                : { status: { $ne: "cancelled" } }),
            } as Filter<IGuestEventRegistrationDocument>)
          : Promise.resolve(0),

        // Summary counts — unaffected by type/status filters
        Collections.eventRegistrations(db).countDocuments({
          eventId: eventObjId,
          status: "checked-in",
        }),

        guestCollection.countDocuments({
          eventId: eventObjId,
          status: "checked-in",
        } as Filter<IGuestEventRegistrationDocument>),
      ]);

      // ── 8. Merge + sort by registeredAt desc ────────────────────────────────
      const merged = [...accountRegs, ...guestRegs].sort(
        (a, b) =>
          new Date(b.registeredAt).getTime() -
          new Date(a.registeredAt).getTime(),
      );

      // ── 9. In-memory pagination (post-merge) ────────────────────────────────
      const paginated = merged.slice(skip, skip + limit);
      const total = accountTotal + guestTotal;

      // ── 10. Serialize ObjectIds → strings ───────────────────────────────────
      const serialized = paginated.map((reg) => ({
        ...reg,
        _id: reg._id?.toString(),
        ticketTypeId: reg.ticketTypeId?.toString(),
      }));

      return NextResponse.json(
        {
          registrations: serialized,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
          summary: {
            totalRegistrations: total,
            accountBased: accountTotal,
            guests: guestTotal,
            checkedIn: accountCheckedIn + guestCheckedIn,
          },
          filters: {
            status: statusFilter,
            type: typeFilter,
          },
        },
        { status: 200 },
      );
    } catch (err) {
      console.error("[GET /api/admin/events/[id]/registrations]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
