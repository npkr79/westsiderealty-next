"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, Share2 } from "lucide-react";
import { PropertyImageGallery } from "@/components/property/PropertyImageGallery";
import ContactForm from "@/components/property/ContactForm";
import GoogleMapEmbed from "@/components/common/GoogleMapEmbed";
import LocationDetailsDisplay from "@/components/property-details/LocationDetailsDisplay";
import PropertyAmenities from "@/components/property-details/PropertyAmenities";
import PropertyHighlights from "@/components/property-details/PropertyHighlights";
import { AboutMicroMarket } from "@/components/property/AboutMicroMarket";
import AboutDeveloper from "@/components/property-details/AboutDeveloper";
import SimilarProperties from "@/components/property-details/SimilarProperties";
import PropertyDescription from "@/components/property-details/PropertyDescription";
import { PropertyFAQs } from "@/components/property/PropertyFAQs";
import { formatPriceWithCr } from "@/lib/priceFormatter";
import CityHubBacklink from "@/components/seo/CityHubBacklink";
import type { MicroMarketInfo } from "@/services/microMarketService";

interface PropertyDetailsClientProps {
  property: any;
  citySlug: string;
  microMarketData?: MicroMarketInfo | null;
  faqs?: any[];
}

export default function PropertyDetailsClient({ 
  property, 
  citySlug,
  microMarketData,
  faqs = []
}: PropertyDetailsClientProps) {
  if (!property) return null;

  const images = Array.isArray(property.image_gallery) 
    ? property.image_gallery.filter(Boolean)
    : [];
  // Combine main image with gallery if not already included
  const allImages = property.main_image_url && !images.includes(property.main_image_url)
    ? [property.main_image_url, ...images]
    : images.length > 0 
    ? images 
    : property.main_image_url 
    ? [property.main_image_url]
    : [];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: property.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back Button */}
      <div className="mb-6">
        <Link href={`/${citySlug}/properties`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Properties</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <PropertyImageGallery
            images={allImages}
            title={property.title}
          />
          
          {/* Property Title & Price */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {property.micro_market || property.location || citySlug}
                  </span>
                </div>
                <p className="text-2xl font-semibold text-remax-red">
                  {property.price_display || `₹${formatPriceWithCr(property.price)}`}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Property Highlights */}
          <PropertyHighlights
            bhk_config={property.bhk_config}
            area_sqft={property.area_sqft}
            facing={property.facing}
            possession_status={property.possession_status}
            furnished_status={property.furnished_status}
            floor_number={property.floor_number}
            micro_market={property.micro_market}
          />
          
          {/* Description */}
          <PropertyDescription 
            title={property?.title || 'Property Details'}
            description={property?.description || ''} 
            projectName={property?.project_name}
          />
          
          {/* Amenities */}
          <PropertyAmenities amenities={property?.amenities} />
          
          {/* Location */}
          <LocationDetailsDisplay 
            nearby_landmarks={property?.nearby_landmarks} 
          />
          
          {/* About Micro-Market */}
          {microMarketData && (
            <AboutMicroMarket
              microMarketName={microMarketData.micro_market_name || microMarketData.h1_title || 'Micro-Market'}
              microMarketSlug={microMarketData.url_slug}
              citySlug={citySlug}
              description={microMarketData.growth_story || microMarketData.connectivity_details || microMarketData.infrastructure_details}
              pricePerSqftMin={microMarketData.price_per_sqft_min}
              pricePerSqftMax={microMarketData.price_per_sqft_max}
              appreciationRate={microMarketData.annual_appreciation_min}
            />
          )}

          {/* About Developer */}
          {property.developer_name && (
            <AboutDeveloper 
              developerName={property.developer_name}
              developerSlug={property.developer_slug}
              description={property.developer_description}
              yearsInBusiness={property.developer_years_in_business}
              totalProjects={property.developer_total_projects}
              totalSftDelivered={property.developer_total_sft_delivered}
              logoUrl={property.developer_logo_url}
            />
          )}

          {/* FAQs */}
          {faqs.length > 0 && (
            <PropertyFAQs faqs={faqs} propertyName={property.title} />
          )}
          
          {/* Map - Only show if location data exists */}
          {(property.latitude && property.longitude) || property.google_maps_url ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-4">Location</h3>
              <GoogleMapEmbed 
                lat={property.latitude}
                lng={property.longitude}
                url={property.google_maps_url}
                title={property.title}
                mapType="satellite"
              />
            </div>
          ) : null}
        </div>
        
        {/* Right Column */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <ContactForm 
              propertyId={property.id} 
              agentId={property.agent_id || 'default-agent-id'}
            />
          </div>
        </div>
      </div>

      {/* Similar Properties */}
      <div className="container mx-auto px-4 py-8 mt-8">
        <SimilarProperties
          currentPropertyId={property.id}
          citySlug={citySlug}
          microMarket={property.micro_market}
          bedrooms={property.bedrooms}
          price={property.price}
        />
      </div>

      <CityHubBacklink />
    </div>
  );
}

