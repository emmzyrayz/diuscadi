import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Committees",
  description:
    "Meet the DIUSCADI committees driving innovation, career development, and digital literacy across Nigeria.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://diuscadi.org.ng"}/committee`,
  },
};

export default function CommitteeLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
