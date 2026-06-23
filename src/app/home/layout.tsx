// src/app/home/layout.tsx
import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function HomeLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
