import { Metadata } from "next";
import { JsonLd, buildMetadata } from "@/components/common/SEO";
import ServicesPage from "@/components/pages/ServicesPage";

const SERVICE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Real Estate Advisory",
  provider: {
    "@type": "RealEstateAgent",
    name: "RE/MAX Westside Realty",
    url: "https://www.westsiderealty.in",
  },
  areaServed: [
    {
      "@type": "City",
      name: "Hyderabad",
      address: { "@type": "PostalAddress", addressRegion: "Telangana", addressCountry: "IN" },
    },
    {
      "@type": "City",
      name: "Goa",
      address: { "@type": "PostalAddress", addressRegion: "Goa", addressCountry: "IN" },
    },
    { "@type": "City", name: "Dubai", address: { "@type": "PostalAddress", addressCountry: "IN" } },
  ],
  offers: [
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Resale Properties - West Hyderabad",
        description:
          "Premium apartments & villas in Kokapet, Narsingi, Financial District, Gachibowli & Gandipet",
      },
    },
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Investment & Holiday Homes - Goa",
        description: "Curated villas, serviced apartments & investment properties",
      },
    },
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Global Investment Properties - Dubai",
        description: "Rental-assured projects, pre-launch offers & off-plan investments",
      },
    },
  ],
};

export const metadata: Metadata = buildMetadata({
  title: "Our Services | RE/MAX Westside Realty",
  description:
    "Explore our expert real estate services: Hyderabad premium resale, Goa investment & holiday properties, and Dubai global investments with RE/MAX Westside Realty.",
  canonicalUrl: "https://www.westsiderealty.in/services",
  imageUrl:
    "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets//remax-favicon.png",
  type: "website",
  siteName: "RE/MAX Westside Realty",
  keywords:
    "hyderabad property services, goa holiday villas, dubai investment specialist, resale flats, global real estate agent",
});

export default function Page() {
  return (
    <>
      <JsonLd jsonLd={SERVICE_SCHEMA} />
      <ServicesPage />
    </>
  );
}


