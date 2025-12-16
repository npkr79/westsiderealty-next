import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { UnifiedPropertyService } from "@/services/unifiedPropertyService";
import { CITY_CONFIGS, type CitySlug } from "@/types/unifiedProperty";
import PropertyListingClient from "@/components/properties/PropertyListingClient";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import FooterSection from "@/components/home/FooterSection";
import { JsonLd } from "@/components/common/SEO";
import { buildMetadata } from "@/components/common/SEO";

interface PageProps {
  params: Promise<{ citySlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citySlug } = await params;
  const config = CITY_CONFIGS[citySlug as CitySlug];

  if (!config) {
    return {
      title: "Properties Not Found",
    };
  }

  const properties = await UnifiedPropertyService.getProperties(citySlug as CitySlug);
  const canonicalUrl = `https://www.westsiderealty.in/${citySlug}/buy`;

  const titles = {
    hyderabad: "Hyderabad Properties - Resale Homes, Apartments & Villas | RE/MAX Westside Realty",
    goa: "Goa Properties - Holiday Homes, Villas & Investment Properties | RE/MAX Westside Realty",
    dubai: "Dubai Properties - Investment Apartments, Villas & Studios | RE/MAX Westside Realty",
  };

  const descriptions = {
    hyderabad: "Find premium resale properties in Hyderabad. Browse apartments, villas, farmhouses & plots in Gachibowli, Kondapur, Madhapur & other prime locations.",
    goa: "Discover luxury holiday homes and investment properties in Goa. Beachside villas, rental-ready apartments in North & South Goa.",
    dubai: "Explore premium investment properties in Dubai. High-ROI apartments, luxury villas, and studio units in prime UAE locations.",
  };

  const keywords = {
    hyderabad: "hyderabad properties, resale properties hyderabad, apartments hyderabad, villas hyderabad, gachibowli properties, kondapur real estate, madhapur homes",
    goa: "goa properties, holiday homes goa, investment properties goa, goa villas, north goa properties, south goa real estate, beach properties",
    dubai: "dubai properties, investment properties dubai, dubai apartments, dubai villas, uae real estate, dubai studios, emirates properties",
  };

  return buildMetadata({
    title: titles[citySlug as CitySlug],
    description: descriptions[citySlug as CitySlug],
    canonicalUrl,
    keywords: keywords[citySlug as CitySlug],
    type: "website",
  });
}

export default async function BuyPage({ params }: PageProps) {
  const { citySlug } = await params;
  const config = CITY_CONFIGS[citySlug as CitySlug];

  // Return 404 for unknown cities
  if (!config) {
    notFound();
  }

  // Fetch properties
  const properties = await UnifiedPropertyService.getProperties(citySlug as CitySlug);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Properties", href: "/properties" },
    { label: `${config.displayName} Properties` },
  ];

  // JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${config.displayName} Properties`,
    "description": `Properties in ${config.displayName}`,
    "url": `https://www.westsiderealty.in/${citySlug}/buy`,
    "numberOfItems": properties.length,
  };

  return (
    <>
      <JsonLd jsonLd={jsonLd} />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <BreadcrumbNav items={breadcrumbItems} />
        </div>
        <PropertyListingClient
          citySlug={citySlug as CitySlug}
          initialProperties={properties}
        />
        <FooterSection />
      </div>
    </>
  );
}
