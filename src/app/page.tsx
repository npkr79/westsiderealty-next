import { Metadata } from "next";
import { JsonLd, buildMetadata } from "@/components/common/SEO";
import IndexPageWithSearch from "@/components/pages/IndexPageWithSearch";
import { getHeroBannerOffersServer } from "@/services/heroBannerService";

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "RE/MAX Westside Realty",
  description:
    "Premier real estate advisory for Hyderabad, Goa & Dubai. Expert guidance for resale properties, investment opportunities & holiday homes.",
  url: "https://www.westsiderealty.in",
  logo: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo.jpg",
  image: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo.jpg",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Hyderabad",
    addressRegion: "Telangana",
    addressCountry: "IN",
  },
  areaServed: [
    { "@type": "City", name: "Hyderabad" },
    { "@type": "City", name: "Goa" },
    { "@type": "City", name: "Dubai" },
  ],
  sameAs: [
    "https://www.facebook.com/remaxwestsiderealty",
    "https://www.instagram.com/remaxwestsiderealty",
  ],
};

export const metadata: Metadata = buildMetadata({
  title: "RE/MAX Westside Realty - Hyderabad, Goa, Dubai | Premium Real Estate Agents",
  description:
    "Find premium resale properties in Hyderabad, investment & holiday homes in Goa, and global real estate in Dubai. RE/MAX Westside Realty: Your local & global property expert.",
  canonicalUrl: "https://www.westsiderealty.in/",
  imageUrl:
    "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets//remax-favicon.png",
  type: "website",
  siteName: "RE/MAX Westside Realty",
  keywords:
    "hyderabad resale property, goa holiday homes, dubai real estate, buy property hyderabad, investment property india",
});

// Revalidate every 60 seconds to allow database changes (like new banners) to show quickly
export const revalidate = 60;

export default async function Home() {
  // Fetch hero banner offers server-side
  const heroBannerOffers = await getHeroBannerOffersServer();

  return (
    <>
      <JsonLd jsonLd={ORGANIZATION_SCHEMA} />
      <IndexPageWithSearch heroBannerOffers={heroBannerOffers} />
    </>
  );
}
