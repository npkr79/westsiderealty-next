import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, Waves, Landmark } from "lucide-react";
import { JsonLd, buildMetadata } from "@/components/common/SEO";
import FooterSection from "@/components/home/FooterSection";
import Header from "@/components/layout/Header";

export const metadata: Metadata = buildMetadata({
  title: "Properties - Browse All Real Estate Listings | RE/MAX Westside Realty",
  description:
    "Browse premium real estate properties across Hyderabad, Goa, and Dubai. Find resale homes, investment properties, holiday villas, and luxury apartments.",
  canonicalUrl: "https://www.westsiderealty.in/properties",
  keywords:
    "properties, real estate listings, hyderabad properties, goa properties, dubai properties, buy property, investment properties",
});

const PROPERTIES_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Properties - RE/MAX Westside Realty",
  description: "Browse premium real estate properties across Hyderabad, Goa, and Dubai",
  url: "https://www.westsiderealty.in/properties",
};

const cityOptions = [
  {
    slug: "hyderabad",
    name: "Hyderabad",
    description: "Premium resale apartments, villas, and farmhouses in West Hyderabad",
    icon: Building2,
    href: "/hyderabad/buy",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    slug: "goa",
    name: "Goa",
    description: "Holiday homes, investment villas, and beachside properties",
    icon: Waves,
    href: "/goa/buy",
    color: "bg-green-50 border-green-200 hover:bg-green-100",
    iconColor: "text-green-600",
  },
  {
    slug: "dubai",
    name: "Dubai",
    description: "Global investment properties, luxury apartments, and high-ROI opportunities",
    icon: Landmark,
    href: "/dubai/buy",
    color: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100",
    iconColor: "text-yellow-600",
  },
];

export default function PropertiesPage() {
  return (
    <>
      <JsonLd jsonLd={PROPERTIES_SCHEMA} />
      <div className="min-h-screen bg-white">
        <Header />
        
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-pink-100/50 via-blue-50 to-blue-100/50">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Browse Properties
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Explore premium real estate opportunities across Hyderabad, Goa, and Dubai
            </p>
          </div>
        </section>

        {/* City Selection Cards */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {cityOptions.map((city) => {
                const Icon = city.icon;
                return (
                  <Link key={city.slug} href={city.href}>
                    <Card className={`${city.color} transition-all hover:shadow-lg cursor-pointer h-full`}>
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className={`h-8 w-8 ${city.iconColor}`} />
                          <CardTitle className="text-2xl font-bold text-gray-900">
                            {city.name}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700">{city.description}</p>
                        <div className="mt-4 flex items-center text-blue-700 font-semibold">
                          Browse {city.name} Properties
                          <MapPin className="h-4 w-4 ml-2" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <FooterSection />
      </div>
    </>
  );
}

