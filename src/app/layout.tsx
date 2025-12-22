import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Layout from "@/components/layout/Layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_OG_IMAGE =
  "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo-banner-1200x630.jpg";

export const metadata: Metadata = {
  title: "RE/MAX Westside Realty | Premium Real Estate in Hyderabad, Goa & Dubai",
  description: "Expert real estate advisory for premium properties in Hyderabad, Goa holiday homes, and Dubai investments. RE/MAX Westside Realty.",
  openGraph: {
    title: "RE/MAX Westside Realty | Premium Real Estate in Hyderabad, Goa & Dubai",
    description:
      "Expert real estate advisory for premium properties in Hyderabad, Goa holiday homes, and Dubai investments. RE/MAX Westside Realty.",
    url: "https://www.westsiderealty.in",
    siteName: "RE/MAX Westside Realty",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "RE/MAX Westside Realty",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "RE/MAX Westside Realty | Premium Real Estate in Hyderabad, Goa & Dubai",
    description:
      "Expert real estate advisory for premium properties in Hyderabad, Goa holiday homes, and Dubai investments. RE/MAX Westside Realty.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
