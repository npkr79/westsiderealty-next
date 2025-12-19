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
  const canonicalUrl = "https://www.westsiderealty.in/hyderabad/shares";

  return buildMetadata({
    title: "Landowner & Investor Share Properties in Hyderabad | RE/MAX Westside Realty",
    description: "Browse exclusive landowner share and investor share properties in Hyderabad. Pre-launch opportunities and investment deals from top developers.",
    canonicalUrl,
  });
}

export default async function HyderabadSharesPage() {
  const supabase = await createClient();
  
  // Fetch share properties (landowner_share OR investor_share = true)
  const { data: shareProperties, error } = await supabase
    .from("hyderabad_properties")
    .select("*")
    .or("landowner_share.eq.true,investor_share.eq.true")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching share properties:", error);
  }

  // Transform to unified format
  const properties = shareProperties?.map((item: any) => ({
    id: item.id,
    title: item.title,
    slug: item.slug || item.seo_slug || item.id,
    seo_slug: item.seo_slug,
    description: item.description || "",
    price: parseFloat(item.price) || 0,
    price_display: item.price_display || item.price?.toString(),
    property_type: item.property_type || "Apartment",
    location: item.location || "",
    area_sqft: item.area_sqft,
    bedrooms: item.bedrooms,
    bathrooms: item.bathrooms,
    main_image_url: item.main_image_url,
    image_gallery: Array.isArray(item.image_gallery) ? item.image_gallery : [],
    is_featured: item.is_featured || false,
    status: item.status || "published",
    created_at: item.created_at,
    updated_at: item.updated_at,
    micro_market: item.micro_market,
    project_name: item.project_name,
    landowner_share: item.landowner_share || false,
    investor_share: item.investor_share || false,
    is_resale: item.is_resale || false,
    bhk_config: item.bhk_config,
    amenities: Array.isArray(item.amenities) ? item.amenities : [],
    possession_status: item.possession_status,
  })) || [];

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Hyderabad", href: "/hyderabad" },
    { label: "Available Deals", href: "/hyderabad/shares" },
  ];

  // JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Hyderabad Landowner & Investor Share Properties",
    description: "Exclusive pre-launch opportunities and investment deals in Hyderabad",
    url: "https://www.westsiderealty.in/hyderabad/shares",
    numberOfItems: properties.length,
  };

  return (
    <>
      <JsonLd jsonLd={jsonLd} />
      <PageHeader
        title="Available Deals - Landowner & Investor Shares"
        subtitle={`${properties.length} exclusive deals available`}
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

