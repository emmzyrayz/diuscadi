// data/tickets.ts
import { Ticket } from "@/types/ticket";

export const DUMMY_TICKETS: Ticket[] = [
  // Original 10 tickets
  {
    id: "TKT-2026-001",
    eventName: "National Career Strategy Summit",
    eventDate: "April 12, 2026",
    location: "Eko Hotels, Victoria Island, Lagos",
    type: "Physical",
    status: "Upcoming",
    image: "/events/summit-2026.jpg",
  },
  {
    id: "TKT-2026-002",
    eventName: "Full-Stack Web Development Bootcamp",
    eventDate: "March 20-24, 2026",
    location: "University of Lagos, Akoka Campus",
    type: "Physical",
    status: "Upcoming",
    image: "/events/web-dev-bootcamp.jpg",
  },
  {
    id: "TKT-2025-003",
    eventName: "Data Science & Analytics Masterclass",
    eventDate: "December 15-17, 2025",
    location: "Landmark Event Centre, Oniru, Lagos",
    type: "Physical",
    status: "Used",
    image: "/events/data-science.jpg",
  },
  {
    id: "TKT-2025-004",
    eventName: "UI/UX Design Workshop",
    eventDate: "November 28-29, 2025",
    location: "Co-Creation Hub (CcHUB), Yaba, Lagos",
    type: "Physical",
    status: "Used",
    image: "/events/ui-ux-design.jpg",
  },
  {
    id: "TKT-2025-005",
    eventName: "Tech Entrepreneurship Bootcamp",
    eventDate: "October 10-12, 2025",
    location: "Ventures Platform, Abuja",
    type: "Physical",
    status: "Used",
    image: "/events/entrepreneurship.jpg",
  },
  {
    id: "TKT-2026-006",
    eventName: "Cybersecurity Essentials for Beginners",
    eventDate: "May 18-19, 2026",
    location: "Online (Zoom)",
    type: "Virtual",
    status: "Upcoming",
    image: "/events/cybersecurity.jpg",
  },
  {
    id: "TKT-2025-007",
    eventName: "Digital Marketing Mastery",
    eventDate: "September 15-17, 2025",
    location: "UNILAG Innovation Centre, Lagos",
    type: "Physical",
    status: "Used",
    image: "/events/digital-marketing.jpg",
  },
  {
    id: "TKT-2025-008",
    eventName: "AI & Machine Learning Fundamentals",
    eventDate: "August 5-7, 2025",
    location: "Online (Google Meet)",
    type: "Virtual",
    status: "Cancelled",
    image: "/events/ai-ml.jpg",
  },
  {
    id: "TKT-2026-009",
    eventName: "Product Management Workshop",
    eventDate: "June 20-22, 2026",
    location: "Radisson Blu, Ikeja, Lagos",
    type: "Physical",
    status: "Upcoming",
    image: "/events/product-mgmt.jpg",
  },
  {
    id: "TKT-2025-010",
    eventName: "Mobile App Development with React Native",
    eventDate: "July 10-14, 2025",
    location: "Covenant University, Ota",
    type: "Physical",
    status: "Used",
    image: "/events/mobile-dev.jpg",
  },
  // 5 New tickets (added to reach 15 total)
  {
    id: "TKT-2026-011",
    eventName: "AI & Machine Learning Bootcamp",
    eventDate: "July 6-10, 2026",
    location: "Google Space, Ikoyi, Lagos",
    type: "Physical",
    status: "Upcoming",
    image: "/events/ai-ml.jpg",
  },
  {
    id: "TKT-2026-012",
    eventName: "Blockchain & Cryptocurrency Seminar",
    eventDate: "August 22, 2026",
    location: "Transcorp Hilton, Abuja",
    type: "Physical",
    status: "Upcoming",
    image: "/events/blockchain.jpg",
  },
  {
    id: "TKT-2026-013",
    eventName: "Women in Tech Leadership Forum",
    eventDate: "October 17, 2026",
    location: "Microsoft Nigeria, Ikoyi, Lagos",
    type: "Physical",
    status: "Upcoming",
    image: "/events/women-in-tech.jpg",
  },
  {
    id: "TKT-2025-014",
    eventName: "Green Energy & Sustainability Conference",
    eventDate: "November 5-6, 2025",
    location: "International Conference Centre, Abuja",
    type: "Physical",
    status: "Used",
    image: "/events/green-energy.jpg",
  },
  {
    id: "TKT-2025-015",
    eventName: "Freelancing & Remote Work Success",
    eventDate: "September 18-19, 2025",
    location: "Online (Zoom)",
    type: "Virtual",
    status: "Used",
    image: "/events/freelancing.jpg",
  },
];

// Helper functions
export const getTicketsByStatus = (status: Ticket["status"]): Ticket[] => {
  return DUMMY_TICKETS.filter((ticket) => ticket.status === status);
};

export const getTicketById = (id: string): Ticket | undefined => {
  return DUMMY_TICKETS.find((ticket) => ticket.id === id);
};

export const getUpcomingTickets = (): Ticket[] => {
  return DUMMY_TICKETS.filter((ticket) => ticket.status === "Upcoming");
};

export const getUsedTickets = (): Ticket[] => {
  return DUMMY_TICKETS.filter((ticket) => ticket.status === "Used");
};
