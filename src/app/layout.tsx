import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { baseMetadata } from "@/utils/metadata";
import LayoutWrapper from "@/components/layoutWrapper";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { ProvidersWrapper } from "./providers";
import { RouteGuard } from "@/components/RouteGuard";
import GuestMergeMount from "@/components/guest/GuestMergeMount";

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
        className={`${geistSans.variable} ${inter.className} ${geistMono.variable} min-h-screen w-screen px-2 antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "DIUSCADI",
              alternateName:
                "Digitized Initiative for Up-Skilling Career Development and Innovation",
              url: "https://diuscadi.org.ng",
              logo: "https://diuscadi.org.ng/assets/img/logo/logo-mark.webp",
              sameAs: [
                "https://twitter.com/diuscadi",
                "https://instagram.com/diuscadi",
                "https://linkedin.com/company/diuscadi",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                email: "info@diuscadi.org.ng",
                contactType: "customer service",
                areaServed: "NG",
                availableLanguage: "English",
              },
            }),
          }}
        />
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
          <GuestMergeMount />
        </ProvidersWrapper>
      </body>
    </html>
  );
}
