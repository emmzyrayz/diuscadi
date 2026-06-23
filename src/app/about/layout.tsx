import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "About DIUSCADI",
  description:
    "Learn about the Digitized Initiative for Up-Skilling Career Development and Innovation — empowering Nigerian students and graduates for sustainable career outcomes.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://diuscadi.org.ng"}/about`,
  },
  openGraph: {
    title: "About DIUSCADI — Our Story, Mission & Impact",
    description:
      "Empowering Nigerian students and graduates with future-ready skills.",
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://diuscadi.org.ng"}/about`,
  },
};

export default function AboutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
