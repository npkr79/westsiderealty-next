import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import { PageHeader } from "@/components/common/PageHeader";
import PropertyListingClient from "@/components/properties/PropertyListingClient";
import { UnifiedPropertyService } from "@/services/unifiedPropertyService";

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = "https://www.westsiderealty.in/hyderabad/properties";

  return buildMetadata({
    title: "Hyderabad Resale Properties - Premium Homes & Apartments | RE/MAX Westside Realty",
    description: "Browse 163+ resale properties in Hyderabad. Premium apartments, villas, and homes in Kokapet, Neopolis, Financial District, Gachibowli & more.",
    canonicalUrl,
  });
}

export default async function HyderabadPropertiesPage() {
  const supabase = await createClient();
  
  // Get property count
  const { count } = await supabase
    .from('hyderabad_properties')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Fetch properties using UnifiedPropertyService (which handles hyderabad_properties)
  const properties = await UnifiedPropertyService.getProperties('hyderabad');

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Hyderabad", href: "/hyderabad" },
    { label: "Resale Properties", href: "/hyderabad/properties" },
  ];

  // JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Hyderabad Resale Properties",
    "description": "Premium resale properties in Hyderabad",
    "url": "https://www.westsiderealty.in/hyderabad/properties",
    "numberOfItems": count || properties.length,
  };

  return (
    <>
      <JsonLd jsonLd={jsonLd} />
      <PageHeader
        title="Resale Properties in Hyderabad"
        subtitle={`${count || properties.length} properties available`}
        breadcrumbs={breadcrumbItems}
      />
      <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading properties...</div>}>
        <PropertyListingClient
          citySlug="hyderabad"
          initialProperties={properties}
        />
      </Suspense>
    </>
  );
}

