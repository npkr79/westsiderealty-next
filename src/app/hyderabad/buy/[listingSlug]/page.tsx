// Wrapper route for /hyderabad/buy/[listingSlug]
// This is more specific than /hyderabad/[slug]/[category] so it matches first
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
// createClient imported dynamically where needed
import { optimizeSupabaseImage } from '@/utils/imageOptimization';
import PropertyDetailsClient from '@/components/property/PropertyDetailsClient';
// microMarketService imported dynamically to avoid top-level await in server service
import { getPropertyFAQsFromProject } from '@/services/propertyFAQService';

const CITY_SLUG = 'hyderabad';

type PageProps = {
  params: Promise<{ listingSlug: string }>;
};

// Fetch property data server-side
async function getProperty(listingSlug: string) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  
  const tableName = 'hyderabad_properties';
  const statusFilter = 'active';

  // Check if it's a UUID format
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(listingSlug);

  // Select all fields including latitude and longitude for map embedding
  let query = supabase.from(tableName).select('*');

  if (isUUID) {
    query = query.eq('id', listingSlug);
  } else {
    // For Hyderabad, check seo_slug and slug columns
    query = query.or(`seo_slug.eq.${listingSlug},slug.eq.${listingSlug}`);
  }

  // Apply status filter
  query = query.eq('status', statusFilter);

  let { data, error } = await query.maybeSingle();

  if (error) {
    console.error('[PropertyDetailsPage] Error fetching property:', error);
    return null;
  }


  if (!data) {
    // Check redirects table
    const redirectResult = await supabase
      .from('property_slug_redirects')
      .select('new_slug')
      .eq('old_slug', listingSlug)
      .eq('location', CITY_SLUG)
      .maybeSingle();

    if (redirectResult.data?.new_slug) {
      const { data: redirectedData } = await supabase
        .from(tableName)
        .select('*')
        .eq('seo_slug', redirectResult.data.new_slug)
        .eq('status', statusFilter)
        .maybeSingle();
      
      return redirectedData || null;
    }
    return null;
  }

  return data;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { listingSlug } = await params;
  const property = await getProperty(listingSlug);

  if (!property) {
    return {
      title: 'Property Not Found | RE/MAX Westside',
      description: 'The requested property could not be found.',
    };
  }

  const microMarket = property.micro_market || property.location || '';
  const cityName = 'Hyderabad';
  const developer = property.developer_name || '';
  const price = property.price_display || `₹${(property.price / 10000000).toFixed(2)} Cr`;

  const title = `${property.title} in ${microMarket}, ${cityName}${property.bhk_config ? ` | ${property.bhk_config}` : ''}${developer ? ` by ${developer}` : ''} | RE/MAX Westside`;
  const description = `${property.title} - ${property.bhk_config || 'Premium property'} for sale in ${microMarket}, ${cityName}. Price: ${price}. ${property.description?.substring(0, 100) || ''}`.slice(0, 160);

  // Extract amenities and location highlights for keywords
  const amenities = Array.isArray(property.amenities) 
    ? property.amenities.join(', ') 
    : '';
  const locationHighlights = property.nearby_landmarks 
    ? (typeof property.nearby_landmarks === 'string' 
        ? property.nearby_landmarks 
        : Object.keys(property.nearby_landmarks).join(', '))
    : '';

  const keywords = `${property.title}, ${microMarket}, ${cityName}, ${property.bhk_config || ''}, ${developer}, real estate, ${amenities}, ${locationHighlights}`.slice(0, 255);

  const canonicalUrl = `https://www.westsiderealty.in/${CITY_SLUG}/buy/${property.seo_slug || listingSlug}`;
  const rawImageUrl = property.main_image_url || property.image_gallery?.[0] || 'https://www.westsiderealty.in/placeholder.svg';
  const imageUrl = optimizeSupabaseImage(rawImageUrl, {
    width: 1200,
    height: 630,
    quality: 80,
    format: 'webp',
  });

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'RE/MAX Westside Realty',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: property.title }],
      type: 'website',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// Generate static params for Hyderabad properties only
export async function generateStaticParams() {
  const { createBuildClient } = await import('@/lib/supabase/buildClient');
  const supabase = createBuildClient();
  const params: { listingSlug: string }[] = [];

  const { data: properties } = await supabase
    .from('hyderabad_properties')
    .select('seo_slug, slug')
    .eq('status', 'active')
    .not('seo_slug', 'is', null);

  if (properties) {
    properties.forEach((p) => {
      if (p.seo_slug) {
        params.push({ listingSlug: p.seo_slug });
      } else if (p.slug) {
        params.push({ listingSlug: p.slug });
      }
    });
  }

  return params;
}

// Helper functions for JSON-LD
function generatePropertyJsonLd(property: any) {
  const microMarket = property.micro_market || property.location || '';
  const cityName = 'Hyderabad';
  const canonicalUrl = `https://www.westsiderealty.in/${CITY_SLUG}/buy/${property.seo_slug || property.slug}`;
  const imageUrl = property.main_image_url || property.image_gallery?.[0] || 'https://www.westsiderealty.in/placeholder.svg';

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description?.substring(0, 160) || property.title,
    url: canonicalUrl,
    image: Array.isArray(property.image_gallery) 
      ? [imageUrl, ...property.image_gallery].filter(Boolean).slice(0, 5)
      : [imageUrl],
    address: {
      '@type': 'PostalAddress',
      addressLocality: microMarket,
      addressRegion: cityName,
      addressCountry: 'IN',
    },
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      priceValidUntil: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
      url: canonicalUrl,
    },
    ...(property.bedrooms && { numberOfRooms: property.bedrooms }),
    ...(property.bathrooms && { numberOfBathroomsTotal: property.bathrooms }),
    ...(property.area_sqft && { 
      floorSize: { 
        '@type': 'QuantitativeValue', 
        value: property.area_sqft, 
        unitCode: 'FTK' 
      } 
    }),
    ...(Array.isArray(property.amenities) && property.amenities.length > 0 && {
      amenityFeature: property.amenities.map((amenity: string) => ({
        '@type': 'LocationFeatureSpecification',
        name: amenity,
      })),
    }),
  };
}

function generateFaqJsonLd(faqs: any[]) {
  if (!Array.isArray(faqs) || faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.slice(0, 10).map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

function generateBreadcrumbJsonLd(property: any) {
  const microMarket = property.micro_market || property.location || '';
  const cityName = 'Hyderabad';

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.westsiderealty.in' },
      { '@type': 'ListItem', position: 2, name: cityName, item: `https://www.westsiderealty.in/${CITY_SLUG}` },
      { '@type': 'ListItem', position: 3, name: microMarket, item: `https://www.westsiderealty.in/${CITY_SLUG}/properties` },
      { '@type': 'ListItem', position: 4, name: property.title, item: `https://www.westsiderealty.in/${CITY_SLUG}/buy/${property.seo_slug || property.slug}` },
    ],
  };
}

// Fetch developer slug from developers table if missing
async function fetchDeveloperSlug(developerName: string | null | undefined): Promise<string | undefined> {
  if (!developerName) return undefined;
  
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data } = await supabase
      .from('developers')
      .select('url_slug')
      .eq('developer_name', developerName)
      .maybeSingle();
    
    return data?.url_slug || undefined;
  } catch (error) {
    console.error('[PropertyDetailsPage] Error fetching developer slug:', error);
    return undefined;
  }
}

// Server Component - renders SEO content in HTML
export default async function PropertyDetailsPage({ params }: PageProps) {
  const { listingSlug } = await params;
  const property = await getProperty(listingSlug);

  if (!property) {
    notFound();
  }

  // Fetch developer_slug if missing but developer_name exists
  if (property.developer_name && !property.developer_slug) {
    const developerSlug = await fetchDeveloperSlug(property.developer_name);
    if (developerSlug) {
      property.developer_slug = developerSlug;
    }
  }

  // Fetch micro market data if available
  let microMarketData = null;
  if (property.micro_market) {
    const { microMarketService } = await import('@/services/client/microMarketService');
    microMarketData = await microMarketService.getMicroMarketByName(property.micro_market);
  }

  // Fetch FAQs
  let faqs: any[] = [];
  if (property.project_name) {
    faqs = await getPropertyFAQsFromProject(property.project_name);
  }

  // Prepare structured data for JSON-LD
  const jsonLd = generatePropertyJsonLd(property);
  const faqJsonLd = generateFaqJsonLd(faqs);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(property);

  return (
    <>
      {/* JSON-LD Structured Data - Rendered server-side in HTML */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* SEO-friendly content rendered server-side */}
      <article itemScope itemType="https://schema.org/RealEstateListing">
        <h1 itemProp="name" className="sr-only">
          {property.title} in {property.micro_market || property.location || CITY_SLUG}
        </h1>
        <meta itemProp="description" content={property.description?.substring(0, 160) || property.title} />

        {/* Hidden SEO content that Google can crawl */}
        <div className="sr-only">
          <h2>Property Details</h2>
          <p>{property.description}</p>

          {property.bhk_config && <p>Configuration: {property.bhk_config}</p>}
          {property.area_sqft && <p>Area: {property.area_sqft} sq.ft</p>}
          {property.price && <p>Price: {property.price_display || `₹${(property.price / 10000000).toFixed(2)} Cr`}</p>}

          {Array.isArray(property.amenities) && property.amenities.length > 0 && (
            <>
              <h2>Amenities at {property.title}</h2>
              <ul>
                {property.amenities.map((amenity: string, i: number) => (
                  <li key={i}>{amenity}</li>
                ))}
              </ul>
            </>
          )}

          {property.nearby_landmarks && (
            <>
              <h2>Location Advantages</h2>
              <ul>
                {typeof property.nearby_landmarks === 'string' ? (
                  <li>{property.nearby_landmarks}</li>
                ) : Array.isArray(property.nearby_landmarks) ? (
                  property.nearby_landmarks.map((item: any, i: number) => (
                    <li key={i}>
                      {typeof item === 'string' 
                        ? item 
                        : item.name || item.landmark_name || `${item.type || ''} ${item.distance || ''}`.trim()}
                    </li>
                  ))
                ) : typeof property.nearby_landmarks === 'object' ? (
                  Object.entries(property.nearby_landmarks).map(([key, value]: [string, any], i: number) => (
                    <li key={i}>
                      {key}: {typeof value === 'string' ? value : typeof value === 'object' && value !== null 
                        ? (value.name || value.distance || JSON.stringify(value))
                        : String(value)}
                    </li>
                  ))
                ) : null}
              </ul>
            </>
          )}

          {faqs.length > 0 && (
            <>
              <h2>Frequently Asked Questions</h2>
              {faqs.map((faq: any, i: number) => (
                <div key={i}>
                  <h3>{faq.question}</h3>
                  <p>{faq.answer}</p>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Client component for interactive UI */}
        <PropertyDetailsClient 
          property={property} 
          citySlug={CITY_SLUG}
          microMarketData={microMarketData}
          faqs={faqs}
        />
      </article>
    </>
  );
}

// Revalidate every 24 hours (ISR)
export const revalidate = 86400;
