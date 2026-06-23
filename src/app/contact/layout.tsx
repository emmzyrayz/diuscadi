import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the DIUSCADI team for enquiries, sponsorship, or partnership opportunities.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://diuscadi.org.ng"}/contact`,
  },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
