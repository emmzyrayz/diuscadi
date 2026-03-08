// lib/db/seeds/eventSeed.ts
// Seed script — creates sample events + default free TicketType for each.
// Run: npx ts-node --project tsconfig.json lib/db/seeds/eventSeed.ts
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { EventDocument } from "@/lib/models/Events";
import { TicketTypeDocument } from "@/lib/models/ticketType";

const ADMIN_ID = new ObjectId(); // replace with a real admin ObjectId in production

const now = new Date();

const sampleEvents: Omit<EventDocument, "_id">[] = [
  {
    slug: "diuscadi-summit-2026",
    title: "DIUSCADI Annual Summit 2026",
    overview:
      "The flagship annual gathering of the DIUSCADI ecosystem. Connect, learn, and grow.",
    description:
      "The DIUSCADI Annual Summit 2026 is a two-day flagship event bringing together students, graduates, industry professionals, and committee leads from across Nigeria. Expect keynote sessions, hands-on workshops, panel discussions on career development, and dedicated networking time designed to bridge the gap between academia and industry.",
    shortDescription:
      "Nigeria's premier student-professional networking summit — two days of workshops, panels, and connections.",
    learningOutcomes: [
      "Network with industry professionals",
      "Attend workshops on tech and innovation",
      "Learn about leadership and soft skills",
    ],
    category: "Conference",
    tags: ["networking", "innovation", "leadership"],
    level: "Beginner",
    instructor: "DIUSCADI Leadership Team",
    requiredSkills: [],
    targetEduStatus: "ALL",
    locationScope: "national",
    format: "physical",
    location: {
      venue: "Transcorp Hilton Abuja",
      city: "Abuja",
      state: "FCT",
      country: "Nigeria",
      address: "1 Aguiyi Ironsi Street, Maitama",
    },
    eventDate: new Date("2026-06-15T09:00:00Z"),
    endDate: new Date("2026-06-16T18:00:00Z"),
    registrationDeadline: new Date("2026-06-10T23:59:59Z"),
    duration: "2 days",
    capacity: 500,
    image: "/images/events/summit-2026.jpg",
    status: "published",
    createdBy: ADMIN_ID,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "tech-skills-bootcamp-q2-2026",
    title: "Tech Skills Bootcamp Q2 2026",
    overview:
      "An intensive bootcamp covering programming, electronics, and design fundamentals.",
    description:
      "The Tech Skills Bootcamp Q2 2026 is a three-day intensive program run by the Innovation Committee. Participants will work in teams to build real projects using programming, electronics, and design tools. Daily mentorship sessions, live demos, and a final presentation round off the experience with practical, portfolio-ready outcomes.",
    shortDescription:
      "A hands-on three-day bootcamp in tech, electronics, and design — build real projects with committee mentors.",
    learningOutcomes: [
      "Build a working project with real tools",
      "Collaborate with peers in a team environment",
      "Receive mentorship from committee leads",
    ],
    category: "Workshop",
    tags: ["tech", "programming", "design", "electronics"],
    level: "Intermediate",
    instructor: "Innovation Committee",
    requiredSkills: ["programming", "electronics", "design"],
    targetEduStatus: "STUDENT",
    locationScope: "local",
    format: "hybrid",
    location: {
      venue: "DIUSCADI Hub",
      city: "Benin City",
      state: "Edo",
      country: "Nigeria",
    },
    eventDate: new Date("2026-04-20T10:00:00Z"),
    endDate: new Date("2026-04-22T16:00:00Z"),
    registrationDeadline: new Date("2026-04-15T23:59:59Z"),
    duration: "3 days",
    capacity: 80,
    image: "/images/events/bootcamp-q2.jpg",
    status: "published",
    createdBy: ADMIN_ID,
    createdAt: now,
    updatedAt: now,
  },
];

async function seed() {
  const db = await getDb();

  for (const eventData of sampleEvents) {
    // Upsert by slug to make seed idempotent
    const result = await db
      .collection<EventDocument>("events")
      .findOneAndUpdate(
        { slug: eventData.slug },
        { $setOnInsert: eventData },
        { upsert: true, returnDocument: "after" },
      );

    const eventId = result?._id;
    if (!eventId) {
      console.warn(`Skipped (already exists): ${eventData.slug}`);
      continue;
    }

    // Create default free TicketType
    const ticketType: Omit<TicketTypeDocument, "_id"> = {
      eventId,
      name: "Free",
      price: 0,
      currency: "NGN",
      maxQuantity: eventData.capacity,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await db
      .collection<TicketTypeDocument>("ticketTypes")
      .updateOne(
        { eventId, name: "Free" },
        { $setOnInsert: ticketType },
        { upsert: true },
      );

    console.log(`✓ Seeded: ${eventData.title}`);
  }

  console.log("\n✅ Event seed complete.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});