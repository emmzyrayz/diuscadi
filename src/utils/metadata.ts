import { Metadata } from "next";

// ── Real organisation constants ───────────────────────────────────────────────
const WEB_URL = "https://diuscadi.org.ng";
const IMAGE_URL = `${WEB_URL}/assets/og-banner.jpg`;

const SITE_NAME = "DIUSCADI";
const FULL_NAME = "Digitized Initiative for Up-Skilling Career Development and Innovation";
const TAGLINE = "Shaping the Young for Future Career Success";

const DESCRIPTION =
  "DIUSCADI (Digitized Initiative for Up-Skilling Career Development and Innovation) is a non-profit programme domiciled at Nnamdi Azikiwe University, Awka, dedicated to empowering Nigerian students and young graduates with career-ready skills, mentorship, and real-world opportunities through the Life After School Career Development Seminar Series (LASCADSS) and other initiatives.";

// ── Base metadata ─────────────────────────────────────────────────────────────

export const baseMetadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://diuscadi.org.ng",
  ),
  title: {
    default: `${SITE_NAME} — ${TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [
    {
      name: "Prof. Ikechukwu Innocent Umeh, FNCS, FIPMD",
      url: WEB_URL,
    },
  ],
  creator: FULL_NAME,
  publisher: FULL_NAME,

  openGraph: {
    title: `${SITE_NAME} — ${TAGLINE}`,
    description: DESCRIPTION,
    url: WEB_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "DIUSCADI — Life After School Career Development Seminar Series",
      },
    ],
    locale: "en_NG",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${TAGLINE}`,
    description: DESCRIPTION,
    images: [IMAGE_URL],
    // Update with real Twitter handle when confirmed
    site: "@diuscadi",
    creator: "@diuscadi",
  },

  keywords: [
    "DIUSCADI",
    "LASCADSS",
    "Life After School Career Development Seminar Series",
    "Life After School Seminar",
    "Career Development Nigeria",
    "Student Empowerment UNIZIK",
    "Student Mentorship UNIZIK",
    "Youth Empowerment Nigeria",
    "Graduate Employability",
    "Skill Acquisition Nigeria",
    "Skill Acquisition Workshops Awka",
    "Entrepreneurship Training Anambra",
    "Prof. Ikechukwu Umeh",
    "Prof. Chief Ikechukwu Umeh",
    "Nnamdi Azikiwe University Career",
    "Nigeria Youth Development",
    "Nigeria Youth Empowerment",
    "Digital Skills Training",
    "Internship Placement Nigeria",
    "Career Mentorship Nigeria",
    "Final Year Students Career",
    "ICT Training Anambra",
  ],

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: WEB_URL,
    languages: {
      "en-NG": WEB_URL,
    },
  },

  verification: {
    google: "YwjThc-TlKyfdY2mVBJv8LNt6HPt206UIJKxjr_E4vU", // Replace with actual code
  },
};

// ── Per-page metadata generator ───────────────────────────────────────────────

interface PageParams {
  page?: string;
}

export function generateMetadata({ params }: { params: PageParams }): Metadata {
  const pageSpecificMetadata: Record<string, Partial<Metadata>> = {
    about: {
      title: "About DIUSCADI",
      description:
        "Learn about DIUSCADI's mission to bridge the gap between academic learning and real-world success for Nigerian students and graduates. Founded by Prof. Ikechukwu Umeh at UNIZIK Awka.",
      openGraph: {
        title: "About DIUSCADI — Our Story, Mission & Impact",
        description:
          "Since 2020, DIUSCADI has empowered over 5,000 students through the Life After School Career Development Seminar Series (LASCADSS).",
      },
    },
    contact: {
      title: "Contact DIUSCADI",
      description:
        "Get in touch with DIUSCADI. Contact us for enquiries, partnership opportunities, sponsorships, or to learn more about LASCADSS.",
      openGraph: {
        title: "Contact DIUSCADI — Partner With Us",
        description:
          "Reach the DIUSCADI team at info@diuscadi.org.ng or +234-8035906416. Located at UNIZIK, Awka, Anambra State.",
      },
    },
    events: {
      title: "Events — LASCADSS & More",
      description:
        "Browse DIUSCADI events including the annual Life After School Career Development Seminar Series (LASCADSS). Registration is free for eligible students.",
      openGraph: {
        title: "DIUSCADI Events — LASCADSS & Career Workshops",
        description:
          "Free career development events for Nigerian students and graduates. Register now.",
      },
    },
    home: {
      title: "Dashboard",
      description:
        "Your DIUSCADI member dashboard — access events, manage your profile, and track your career development journey.",
    },
  };

  const pageName = params.page?.toLowerCase();

  if (pageName && pageSpecificMetadata[pageName]) {
    return {
      ...baseMetadata,
      ...pageSpecificMetadata[pageName],
      openGraph: {
        ...baseMetadata.openGraph,
        ...(pageSpecificMetadata[pageName].openGraph ?? {}),
      },
      twitter: {
        ...baseMetadata.twitter,
        ...(pageSpecificMetadata[pageName].twitter ?? {}),
      },
    };
  }

  return baseMetadata;
}

export const metadata = baseMetadata;