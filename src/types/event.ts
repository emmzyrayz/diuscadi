// types/event.ts (create this file for reusable types)
export interface Event {
  id: string;
  title: string;
  overview: string;
  learningOutcomes: string[];
  date: string;
  time: string;
  location: string;
  type: "In-Person" | "Hybrid" | "Virtual";
  price: string;
  slotsRemaining: number;
  totalCapacity: number;
  category: string;
  duration?: string;
  instructor?: string;
  level?: "Beginner" | "Intermediate" | "Advanced";
  tags?: string[];
  image?: string;
  enrolled?: number;
  status?: "Upcoming" | "Completed" | "Cancelled" | "Draft";
}