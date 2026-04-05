import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import Layout from "@/components/layout/Layout";
import HeaderServer from "@/components/layout/HeaderServer";
import Script from "next/script";
import ClientProviders from "@/components/providers/ClientProviders";
import AdvisorChat from "@/components/advisor/AdvisorChat";

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
      <head>
        {/* Google Fonts — Cormorant Garamond, Outfit, DM Mono */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Outfit:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <ClientProviders>
          <Layout header={<HeaderServer />}>{children}</Layout>
        </ClientProviders>
        <AdvisorChat />
        <GoogleAnalytics gaId="G-GYG41B6D00" />
        <Analytics />
        {/* Meta Pixel — afterInteractive so it never blocks render */}
        <Script
          id="facebook-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init','829970693412352');
              fbq('track','PageView');
            `,
          }}
        />
      </body>
    </html>
  );
}

