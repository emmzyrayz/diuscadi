import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photos and highlights from DIUSCADI events, workshops, and LASCADSS seminars.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://diuscadi.org.ng"}/gallery`,
  },
};

export default function GalleryLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
