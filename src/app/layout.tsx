import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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

const BASE_URL = "https://www.westsiderealty.in";

const DEFAULT_OG_IMAGE =
  "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo-banner-1200x630.jpg";

export const metadata: Metadata = {
  title: "RE/MAX Westside Realty | Premium Real Estate in Hyderabad, Goa & Dubai",
  description:
    "Expert real estate advisory for premium properties in Hyderabad, Goa holiday homes, and Dubai investments. RE/MAX Westside Realty.",
  metadataBase: new URL(BASE_URL),
  
  // Favicon configuration – strictly using /favicon.png from public/favicon.png
  // Path /favicon.png maps to public/favicon.png in Next.js
  icons: {
    icon: {
      url: "/favicon.png",
      type: "image/png",
    },
    shortcut: {
      url: "/favicon.png",
      type: "image/png",
    },
    apple: "/apple-touch-icon.png",
  },
  
  // Web App Manifest
  manifest: '/site.webmanifest',
  
  // Google Site Verification
  verification: {
    google: 'GNYcJkMYT85NyAgCUMb5XnmaLqtOzN-rF4UiPEH3ZiA',
  },
  
  // Additional meta tags
  other: {
    'msapplication-TileColor': '#1a365d',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#1a365d',
  },
  
  openGraph: {
    title: "RE/MAX Westside Realty | Premium Real Estate in Hyderabad, Goa & Dubai",
    description:
      "Expert real estate advisory for premium properties in Hyderabad, Goa holiday homes, and Dubai investments. RE/MAX Westside Realty.",
    url: BASE_URL,
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
        <Script 
          src="https://www.googletagmanager.com/gtag/js?id=G-GYG41B6D00" 
          strategy="afterInteractive" 
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GYG41B6D00', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </body>
    </html>
  );
}

