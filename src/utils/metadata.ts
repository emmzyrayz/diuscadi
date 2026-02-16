import { Metadata } from "next";

interface PageParams {
  page?: string;
}

// Constants updated from diuscadi.org.ng
const WEB_URL = "https://diuscadi.org.ng";
const IMAGE_URL = `${WEB_URL}/assets/og-banner.png`;
const DESCRIPTION =
  "DIUSCADI (Dr. Ikechukwu Umeh's Student Career Development Initiative) is a non-profit initiative dedicated to preparing final year students and fresh graduates for life after school through practical workshops and mentorship.";

export const baseMetadata: Metadata = {
  title: "DIUSCADI — Equipping Graduates for the Marketplace",
  description: DESCRIPTION,

  openGraph: {
    title: "DIUSCADI — Career Development & Mentorship Platform",
    description: DESCRIPTION,
    url: WEB_URL,
    siteName: "DIUSCADI",
    images: [
      {
        url: IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "DIUSCADI - Life After School Career Development Seminar",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "DIUSCADI — Life After School Career Development Seminar",
    description: DESCRIPTION,
    images: [IMAGE_URL],
    site: "@diuscadi",
    creator: "@diuscadi",
  },

  keywords: [
    "DIUSCADI",
    "LASCDSS",
    "Life After School Seminar",
    "Career Development Nigeria",
    "Student Mentorship UNIZIK",
    "Graduate Employability",
    "Skill Acquisition Workshops",
    "Entrepreneurship Training",
    "Dr. Ikechukwu Umeh",
    "Nigeria Youth Empowerment",
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
    google: "your-google-site-verification-code", // Replace with actual code if available
  },
};

export function generateMetadata({ params }: { params: PageParams }): Metadata {
  const pageSpecificMetadata: Record<string, Partial<Metadata>> = {
    about: {
      title: "About Us | DIUSCADI",
      description:
        "Learn about DIUSCADI's mission to bridge the gap between academia and professionalism for Nigerian students.",
      openGraph: {
        title: "About DIUSCADI - Our Mission & Vision",
        description:
          "Empowering final year students with practical skills for the real-world job market.",
      },
    },
    register: {
      title: "Register for LASCDSS | DIUSCADI",
      description:
        "Secure your spot for the next Life After School Career Development Seminar. 100% free for students and graduates.",
      openGraph: {
        title: "Register for LASCDSS - Join the Next Cohort",
        description:
          "Transform your academic knowledge into entrepreneurial success. Register today.",
      },
    },
    speakers: {
      title: "Our Speakers | DIUSCADI",
      description:
        "Meet the industry experts, audacious thinkers, and mentors facilitating our practical career workshops.",
      openGraph: {
        title: "DIUSCADI Speakers & Facilitators",
        description:
          "Learn from the best minds in ICT, Digital Marketing, Fashion, and Business.",
      },
    },
    schedule: {
      title: "Event Schedule | DIUSCADI",
      description:
        "View the timeline for our upcoming seminars, including keynote speeches, breakout sessions, and networking.",
      openGraph: {
        title: "LASCDSS Event Schedule",
        description:
          "10% Actionable Talks, 90% Practical Workshops. Check the full event timeline.",
      },
    },
    contact: {
      title: "Contact & Sponsorship | DIUSCADI",
      description:
        "Get in touch with DIUSCADI for inquiries, partnership opportunities, or to sponsor the next career summit.",
      openGraph: {
        title: "Contact DIUSCADI - Support Career Development",
        description:
          "Partner with us to empower the next generation of Nigerian graduates.",
      },
    },
    faqs: {
      title: "Frequently Asked Questions | DIUSCADI",
      description:
        "Find answers to common questions about LASCDSS registration, location, and participation.",
    },
  };

  const pageName = params.page?.toLowerCase();

  // Merge base metadata with page-specific overrides
  const pageMetadata: Metadata =
    pageName && pageSpecificMetadata[pageName]
      ? {
          ...baseMetadata,
          ...pageSpecificMetadata[pageName],
          openGraph: {
            ...baseMetadata.openGraph,
            ...pageSpecificMetadata[pageName].openGraph,
          },
          twitter: {
            ...baseMetadata.twitter,
            ...pageSpecificMetadata[pageName].twitter,
          },
        }
      : baseMetadata;

  return pageMetadata;
}

export const metadata = baseMetadata;
