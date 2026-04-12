import type { Metadata } from "next";
import HomepageRedesign from "@/components/homepage/HomepageRedesign";
import { JsonLd } from "@/components/common/SEO";

export const metadata: Metadata = {
  title: "Westside Realty — Premium Real Estate in Hyderabad, Goa & Dubai | Expert Advisory",
  description:
    "Hyderabad's trusted real estate advisors. RERA-verified apartments, villas & plots in Kokapet, Gachibowli, Financial District & Goa. Compare prices, floor plans & market intelligence.",
  alternates: {
    canonical: "https://www.westsiderealty.in/",
  },
};

export const revalidate = 300;

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "RE/MAX Westside Realty",
  url: "https://www.westsiderealty.in",
  logo: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo-banner-1200x630.jpg",
  sameAs: [
    "https://www.facebook.com/westsiderealty",
    "https://www.instagram.com/westsiderealty",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    areaServed: ["IN"],
    availableLanguage: ["English", "Telugu", "Hindi"],
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "RE/MAX Westside Realty",
  image: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo-banner-1200x630.jpg",
  url: "https://www.westsiderealty.in",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Financial District",
    addressLocality: "Hyderabad",
    addressRegion: "Telangana",
    postalCode: "500032",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 17.4146,
    longitude: 78.3456,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "09:00",
    closes: "19:00",
  },
  priceRange: "₹₹₹",
  areaServed: ["Hyderabad", "Goa", "Dubai"],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "47",
    bestRating: "5",
    worstRating: "1",
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd jsonLd={[organizationSchema, localBusinessSchema]} />
      <HomepageRedesign />
    </>
  );
}
