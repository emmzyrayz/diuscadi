// data/tickets.ts or assets/data/tickets.ts
export interface Ticket {
  id: string;
  eventName: string;
  eventDate: string;
  location: string;
  type: "Physical" | "Virtual";
  status: "Upcoming" | "Used" | "Cancelled";
  image: string;
}
