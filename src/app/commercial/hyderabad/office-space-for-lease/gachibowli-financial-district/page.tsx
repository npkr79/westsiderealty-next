import type { Metadata } from "next";
import { OfficeLeasingCorridorPage } from "../_components/OfficeLeasingCorridorPage";
import { corridorPages } from "../_data/corridorPages";

const page = corridorPages["gachibowli-financial-district"];

export const revalidate = 3600;

export const metadata: Metadata = {
  title: page.title,
  description: page.metaDescription,
  alternates: { canonical: page.canonicalUrl },
  openGraph: {
    title: page.title,
    description: page.metaDescription,
    url: page.canonicalUrl,
    siteName: "RE/MAX Westside Realty",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: page.title,
    description: page.metaDescription,
  },
  robots: { index: true, follow: true },
};

export default function CorridorRoutePage() {
  return <OfficeLeasingCorridorPage page={page} />;
}
