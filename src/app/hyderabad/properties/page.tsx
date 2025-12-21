import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import { PageHeader } from "@/components/common/PageHeader";
import PropertyListingClientWrapper from "@/components/properties/PropertyListingClientWrapper";
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
  
  // Fetch properties using UnifiedPropertyService (which handles hyderabad_properties)
  const properties = await UnifiedPropertyService.getProperties('hyderabad');

  // Get property count for display
  const { count } = await supabase
    .from('hyderabad_properties')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Hyderabad", href: "/hyderabad" },
    { label: "Resale Properties", href: "/hyderabad/properties" },
  ];

  const baseUrl = "https://www.westsiderealty.in";

  // Enhanced JSON-LD Schema with itemListElement
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Hyderabad Resale Properties",
    "description": "Premium resale properties in Hyderabad",
    "url": `${baseUrl}/hyderabad/properties`,
    "numberOfItems": count || properties.length,
    "itemListElement": properties.map((prop, index) => {
      // Get full image URL
      let imageUrl = prop.main_image_url || "";
      if (imageUrl && !imageUrl.startsWith("http")) {
        imageUrl = imageUrl.startsWith("/") 
          ? `${baseUrl}${imageUrl}` 
          : `${baseUrl}/${imageUrl}`;
      }
      if (!imageUrl) {
        imageUrl = `${baseUrl}/placeholder.svg`;
      }

      // Get property URL
      const propertySlug = prop.seo_slug || prop.slug || prop.id;
      const propertyUrl = `${baseUrl}/hyderabad/buy/${propertySlug}`;

      // Get description (truncate to 160 chars for schema, strip HTML)
      const description = prop.description 
        ? prop.description.substring(0, 160).replace(/<[^>]*>/g, '').trim()
        : `${prop.title} - ${prop.property_type} in ${prop.location || 'Hyderabad'}`;

      return {
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "RealEstateListing",
          "name": prop.title,
          "url": propertyUrl,
          "image": imageUrl,
          "description": description,
          "offers": {
            "@type": "Offer",
            "price": prop.price || 0,
            "priceCurrency": "INR",
          },
        },
      };
    }),
  };

  return (
    <>
      <JsonLd jsonLd={jsonLd} />
      <PageHeader
        title="Resale Properties in Hyderabad"
        subtitle={`${count || properties.length} properties available`}
        breadcrumbs={breadcrumbItems}
      />
      {/* Wrapper handles Suspense internally and renders properties immediately */}
      <PropertyListingClientWrapper
        citySlug="hyderabad"
        initialProperties={properties}
      />
    </>
  );
}
