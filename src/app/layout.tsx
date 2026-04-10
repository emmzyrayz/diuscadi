import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { baseMetadata } from "@/utils/metadata";
import LayoutWrapper from "@/components/layoutWrapper";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { ProvidersWrapper } from "./providers";
import { RouteGuard } from "@/components/RouteGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = baseMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${inter.className} ${geistMono.variable} min-h-screen w-screen px-5 antialiased`}
      >
        {/*
          ProvidersWrapper composes all providers via the registry:
          AuthProvider → PlatformProvider → UserProvider → EventProvider →
          TicketProvider → AuthenticatedProviders (Application + Admin) →
          HealthProvider → NotFoundProvider

          RouteGuard sits inside all providers so it can read useAuth()
          and useHealthReporter() without prop drilling.
        */}
        <ProvidersWrapper>
          <RouteGuard>
            <LayoutWrapper navbar={<Navbar />} footer={<Footer />}>
                {children}
            </LayoutWrapper>
          </RouteGuard>
        </ProvidersWrapper>
      </body>
    </html>
  );
}
