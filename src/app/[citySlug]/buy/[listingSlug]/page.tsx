 "use client";

import { useState, useEffect } from "react";
 import Link from "next/link";
 import { useParams, useRouter, usePathname } from "next/navigation";
 import Head from "next/head";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, Share2 } from "lucide-react";
import { locationPropertyService, type HyderabadProperty, type GoaProperty, type DubaiProperty } from "@/services/locationPropertyService";
import { PropertyImageGallery } from "@/components/property/PropertyImageGallery";
import ContactForm from "@/components/property/ContactForm";
import GoogleMapEmbed from "@/components/common/GoogleMapEmbed";
import LocationDetailsDisplay from "@/components/property-details/LocationDetailsDisplay";
import { projectService } from "@/services/projectService";
import { microMarketService, type MicroMarketInfo } from "@/services/microMarketService";
import PropertyAmenities from "@/components/property-details/PropertyAmenities";
import PropertyHighlights from "@/components/property-details/PropertyHighlights";
import { AboutMicroMarket } from "@/components/property/AboutMicroMarket";
import AboutDeveloper from "@/components/property-details/AboutDeveloper";
import SimilarProperties from "@/components/property-details/SimilarProperties";
import PropertyDescription from "@/components/property-details/PropertyDescription";
import { PropertyFAQs } from "@/components/property/PropertyFAQs";
import { getPropertyFAQs } from "@/services/propertyFAQService";
import { formatPriceWithCr } from "@/lib/priceFormatter";
import CityHubBacklink from "@/components/seo/CityHubBacklink";

type PropertyType = HyderabadProperty | GoaProperty | DubaiProperty;
type LocationType = 'hyderabad' | 'goa' | 'dubai';

 const PropertyDetailsPage = () => {
   const params = useParams<{ listingSlug?: string | string[]; citySlug?: string | string[] }>();
   const listingSlugParam = params.listingSlug;
   const citySlugParam = params.citySlug;
   const slug = Array.isArray(listingSlugParam) ? listingSlugParam[0] : listingSlugParam;
   const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
   const router = useRouter();
   const pathname = usePathname();
  const [property, setProperty] = useState<PropertyType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectDescription, setProjectDescription] = useState<string | null>(null);
  const [microMarketData, setMicroMarketData] = useState<MicroMarketInfo | null>(null);
  const [faqs, setFaqs] = useState<any[]>([]);

   // Extract location from pathname (/hyderabad/buy/slug, /goa/buy/slug, /dubai/buy/slug)
   const location = pathname.split('/')[1] as LocationType;

  useEffect(() => {
    if (slug && location) {
      fetchPropertyDetails();
    }
  }, [slug, location]);

  const fetchPropertyDetails = async () => {
    if (!slug || !location) {
      console.error('[PropertyDetailsPage] Cannot fetch: missing slug or location', { slug, location });
      setIsLoading(false);
      return;
    }

    console.log('=== FETCHING PROPERTY DETAILS ===');
    console.log('[PropertyDetailsPage] Location:', location);
    console.log('[PropertyDetailsPage] Slug:', slug);
    setIsLoading(true);
    try {
      let data: PropertyType | null = null;

      switch (location) {
        case 'hyderabad':
          console.log('[PropertyDetailsPage] Fetching Hyderabad property with slug:', slug);
          data = await locationPropertyService.getHyderabadPropertyById(slug);
          console.log('[PropertyDetailsPage] Hyderabad property result:', data ? 'Found' : 'Not found', data?.id);
          break;
        case 'goa':
          console.log('[PropertyDetailsPage] Fetching Goa property with slug:', slug);
          data = await locationPropertyService.getGoaPropertyById(slug);
          console.log('[PropertyDetailsPage] Goa property result:', data ? 'Found' : 'Not found');
          break;
        case 'dubai':
          console.log('[PropertyDetailsPage] Fetching Dubai property with slug:', slug);
          data = await locationPropertyService.getDubaiPropertyById(slug);
          console.log('[PropertyDetailsPage] Dubai property result:', data ? 'Found' : 'Not found');
          break;
        default:
          console.error('[PropertyDetailsPage] Unknown location:', location);
      }

      if (!data) {
        console.warn('[PropertyDetailsPage] Property not found for slug:', slug, 'location:', location);
      } else {
        console.log('[PropertyDetailsPage] Property found:', data.id, data.title);
      }

      setProperty(data);
      
      // Fetch project description if available
      if (data && 'project_name' in data && data.project_name) {
        const projDesc = await projectService.getProjectDescription(data.project_name);
        setProjectDescription(projDesc);
      }
      
      // Fetch micro market data if available
      if (data && 'micro_market' in data && data.micro_market) {
        const mmData = await microMarketService.getMicroMarketByName(data.micro_market);
        setMicroMarketData(mmData);
      }

      // Fetch FAQs
      if (data && data.id) {
        const propertyFAQs = await getPropertyFAQs(data.id, location);
        setFaqs(propertyFAQs);
      }
      
       // 301 Redirect: If property has seo_slug and current URL uses old slug, redirect
       if (data && 'seo_slug' in data && data.seo_slug && data.seo_slug !== slug) {
         console.log('Redirecting to:', `/${location}/buy/${data.seo_slug}`);
         router.replace(`/${location}/buy/${data.seo_slug}`);
       }
    } catch (error) {
      console.error('Error fetching property details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to ensure absolute image URLs for OG tags
  const getAbsoluteImageUrl = (imageUrl: string | null | undefined): string => {
    if (!imageUrl) return 'https://www.westsiderealty.in/placeholder.svg';
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/')) return `https://www.westsiderealty.in${imageUrl}`;
    return `https://www.westsiderealty.in/${imageUrl}`;
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-remax-red"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Property not found</h2>
        <Link href="/properties">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
        </Link>
      </div>
    );
  }

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
  const canonicalUrl = `https://www.westsiderealty.in/${location}/buy/${(property as any).seo_slug || slug}`;
  const ogImage = getAbsoluteImageUrl(allImages[0] || property.main_image_url);

  // Generate structured data (JSON-LD) with enhanced SEO fields
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": property.title,
    "description": (property as any).meta_description || property.description?.substring(0, 160) || property.description,
    "url": canonicalUrl,
    "image": [ogImage, ...images.map(img => getAbsoluteImageUrl(img))].filter(Boolean),
    "offers": {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": location === 'dubai' ? "AED" : "INR",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
      "url": canonicalUrl
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": 'location' in property ? property.location : 'community' in property ? property.community : location,
      "addressRegion": location === 'hyderabad' ? 'Telangana' : location === 'goa' ? 'Goa' : 'Dubai',
      "addressCountry": location === 'dubai' ? 'AE' : 'IN'
    },
    ...(property.bedrooms && { "numberOfRooms": property.bedrooms }),
    ...(property.bathrooms && { "numberOfBathroomsTotal": property.bathrooms }),
    ...(property.area_sqft && { "floorSize": { "@type": "QuantitativeValue", "value": property.area_sqft, "unitCode": "SQM" } }),
    ...(property.amenities && property.amenities.length > 0 && { "amenityFeature": property.amenities.map((amenity: string) => ({ "@type": "LocationFeatureSpecification", "name": amenity })) })
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Is this property RERA approved?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, this property is RERA (Real Estate Regulatory Authority) approved. All necessary approvals and clearances are in place, ensuring complete legal compliance and buyer protection.`
        }
      },
      {
        "@type": "Question",
        name: `Are home loans available for this property?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, this property is pre-approved by major banks including SBI, HDFC, ICICI, Axis Bank, and others. Our team can assist you with home loan processing and documentation.`
        }
      },
      {
        "@type": "Question",
        name: `What is the price of ${('bhk_config' in property ? property.bhk_config : '') || `${property.bedrooms} BHK`} apartments in ${('location' in property ? property.location : '') || ('region' in property ? property.region : '') || ('community' in property ? property.community : location)}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${('bhk_config' in property ? property.bhk_config : '') || `${property.bedrooms} BHK`} apartments in ${('location' in property ? property.location : '') || ('region' in property ? property.region : '') || ('community' in property ? property.community : location)} typically range in price. This property is priced at ${property.price_display}, offering excellent value considering its location, amenities, and specifications.`
        }
      },
      {
        "@type": "Question",
        name: `Can NRIs buy this property?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, NRIs (Non-Resident Indians) and OCIs (Overseas Citizens of India) can purchase this property. We provide complete assistance with NRI documentation, FEMA compliance, and repatriation processes.`
        }
      }
    ]
  };

  return (
    <>
      <Head>
        <title>{(property as any).seo_title || property.title}</title>
        <meta name="description" content={(property as any).meta_description || property.description?.substring(0, 160)} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={(property as any).seo_title || property.title} />
        <meta property="og:description" content={(property as any).meta_description || property.description?.substring(0, 160)} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/properties">
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
                        {('micro_market' in property && property.micro_market) 
                          ? property.micro_market
                          : ('location' in property ? property.location : '') || 
                            ('region' in property ? property.region : '') || 
                            ('community' in property ? property.community : location)}
                      </span>
                    </div>
                    <p className="text-2xl font-semibold text-remax-red">
                      {property.price_display || `₹${formatPriceWithCr(property.price)}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: property.title,
                          text: property.description,
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Property Highlights */}
              <PropertyHighlights
                bhk_config={'bhk_config' in property ? property.bhk_config : undefined}
                area_sqft={'area_sqft' in property ? property.area_sqft : undefined}
                facing={'facing' in property ? property.facing : undefined}
                possession_status={'possession_status' in property ? property.possession_status : undefined}
                furnished_status={'furnished_status' in property ? property.furnished_status : undefined}
                floor_number={'floor_number' in property ? property.floor_number : undefined}
                micro_market={'micro_market' in property ? property.micro_market : undefined}
              />
              
              {/* Description */}
              <PropertyDescription 
                title={property?.title || 'Property Details'}
                description={property?.description || ''} 
                projectName={'project_name' in property ? property.project_name : undefined}
              />
              
              {/* Amenities */}
              <PropertyAmenities amenities={property?.amenities} />
              
              {/* Location (Fixed) */}
              <LocationDetailsDisplay 
                nearby_landmarks={'nearby_landmarks' in (property || {}) ? (property as any).nearby_landmarks : undefined} 
              />
              
              {/* About Micro-Market */}
              {microMarketData && (
                <AboutMicroMarket
                  microMarketName={microMarketData.micro_market_name || microMarketData.h1_title || 'Micro-Market'}
                  microMarketSlug={microMarketData.url_slug}
                  citySlug={citySlug || location}
                  description={microMarketData.growth_story || microMarketData.connectivity_details || microMarketData.infrastructure_details}
                  pricePerSqftMin={microMarketData.price_per_sqft_min}
                  pricePerSqftMax={microMarketData.price_per_sqft_max}
                  appreciationRate={microMarketData.annual_appreciation_min}
                />
              )}

              {/* About Developer */}
              {'developer_name' in property && property.developer_name && (
                <AboutDeveloper 
                  developerName={property.developer_name}
                  developerSlug={(property as any).developer_slug}
                  description={(property as any).developer_description}
                  yearsInBusiness={(property as any).developer_years_in_business}
                  totalProjects={(property as any).developer_total_projects}
                  totalSftDelivered={(property as any).developer_total_sft_delivered}
                  logoUrl={(property as any).developer_logo_url}
                />
              )}

              {/* FAQs */}
              {faqs.length > 0 && (
                <PropertyFAQs faqs={faqs} propertyName={property.title} />
              )}
              
              {/* Map - Only show if location data exists */}
              {(('latitude' in property && typeof property.latitude === 'number' && 'longitude' in property && typeof property.longitude === 'number') || 
                ('google_maps_url' in property && property.google_maps_url)) && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-xl font-semibold mb-4">Location</h3>
                  <GoogleMapEmbed 
                    lat={'latitude' in property && typeof property.latitude === 'number' ? property.latitude : undefined}
                    lng={'longitude' in property && typeof property.longitude === 'number' ? property.longitude : undefined}
                    url={'google_maps_url' in property ? property.google_maps_url : undefined}
                    title={property.title}
                    mapType="satellite"
                  />
                </div>
              )}
            </div>
            
            {/* Right Column */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <ContactForm 
                  propertyId={property.id} 
                  agentId={'agent_id' in property ? property.agent_id || 'default-agent-id' : 'default-agent-id'}
                />
              </div>
            </div>
          </div>

          {/* Similar Properties */}
          <div className="container mx-auto px-4 py-8 mt-8">
            <SimilarProperties
              currentPropertyId={property.id}
              citySlug={citySlug || location}
              microMarket={'micro_market' in property ? property.micro_market : undefined}
              bedrooms={'bedrooms' in property ? property.bedrooms : undefined}
              price={'price' in property ? property.price : undefined}
            />
          </div>

          <CityHubBacklink />
        </div>
    </>
  );
};

export default PropertyDetailsPage;
