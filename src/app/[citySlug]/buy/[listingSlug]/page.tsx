import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { optimizeSupabaseImage } from '@/utils/imageOptimization';
import PropertyDetailsClient from '@/components/property/PropertyDetailsClient';
import { microMarketService } from '@/services/microMarketService';
import { getPropertyFAQsFromProject } from '@/services/propertyFAQService';

type PageProps = {
  params: Promise<{ citySlug: string; listingSlug: string }>;
};

// Fetch property data server-side
async function getProperty(citySlug: string, listingSlug: string) {
  const supabase = await createClient();
  
  // Determine table name based on city
  const tableName = citySlug === 'hyderabad' 
    ? 'hyderabad_properties'
    : citySlug === 'goa'
    ? 'goa_holiday_properties'
    : citySlug === 'dubai'
    ? 'dubai_properties'
    : null;

  if (!tableName) return null;

  // Check if it's a UUID format
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(listingSlug);

  // Determine status filter based on city
  const statusFilter = citySlug === 'hyderabad' ? 'active' : citySlug === 'goa' ? 'Active' : 'published';

  // Select all fields including latitude and longitude for map embedding
  let query = supabase.from(tableName).select('*');

  if (isUUID) {
    query = query.eq('id', listingSlug);
  } else {
    // For Goa properties, only check seo_slug (there's no 'slug' field in goa_holiday_properties table)
    if (citySlug === 'goa') {
      query = query.eq('seo_slug', listingSlug);
    } else {
      // For other cities, check both seo_slug and slug
      query = query.or(`seo_slug.eq.${listingSlug},slug.eq.${listingSlug}`);
    }
  }

  // Apply status filter
  query = query.eq('status', statusFilter);

  let { data, error } = await query.maybeSingle();

  if (error) {
    console.error('[PropertyDetailsPage] Error fetching property:', error);
    return null;
  }

  // If not found by exact slug match, try fuzzy matching for Goa properties
  // This handles cases where the URL slug is auto-generated from title and doesn't match the database seo_slug
  if (!data && !isUUID && citySlug === 'goa') {
    // The long slug format is usually: project-name-description-location
    // Extract key identifiers: project name (first 2-3 words) and location (last 2-3 words before "goa")
    const slugParts = listingSlug.split('-');
    
    // Remove "goa" from the end if present
    const partsWithoutGoa = slugParts[slugParts.length - 1] === 'goa' 
      ? slugParts.slice(0, -1) 
      : slugParts;
    
    // Try multiple strategies:
    // 1. Extract project name (first 2-3 words)
    const projectNameKeywords = partsWithoutGoa.slice(0, Math.min(3, partsWithoutGoa.length)).join(' ');
    
    // 2. Extract location (last 2-3 words before "goa")
    const locationKeywords = partsWithoutGoa.slice(-3).join(' ');
    
    // Try to find by title match
    if (projectNameKeywords.length >= 3) {
      // First try with project name
      let titleMatches: any[] = [];
      const { data: matches1, error: err1 } = await supabase
        .from(tableName)
        .select('*')
        .eq('status', statusFilter)
        .ilike('title', `%${projectNameKeywords}%`)
        .limit(20);
      
      if (!err1 && matches1) {
        titleMatches = matches1;
      }
      
      // If no matches, try with location
      if (titleMatches.length === 0 && locationKeywords.length >= 3) {
        const { data: matches2, error: err2 } = await supabase
          .from(tableName)
          .select('*')
          .eq('status', statusFilter)
          .ilike('title', `%${locationKeywords}%`)
          .limit(20);
        
        if (!err2 && matches2) {
          titleMatches = matches2;
        }
      }
      
      if (titleMatches.length > 0) {
        // Find the best match by comparing title similarity
        // The URL slug is likely generated from the full title, so try to match it
        const titleFromSlug = slugParts
          .filter(part => part !== 'goa' && part !== 'north' && part !== 'south' && part !== 'by')
          .slice(0, 6) // First 6 words should cover project name
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
        
        // Find the best match - prefer exact title match or close match
        const bestMatch = titleMatches.find((item: any) => {
          const itemTitleLower = (item.title || '').toLowerCase();
          const slugTitleLower = titleFromSlug.toLowerCase();
          // Check if title matches the slug-derived title
          return itemTitleLower.includes(slugTitleLower) || 
                 slugTitleLower.includes(itemTitleLower.split(' ').slice(0, 3).join(' ')) ||
                 itemTitleLower.includes(projectNameKeywords.toLowerCase());
        }) || titleMatches.find((item: any) => {
          // Fallback: check if any key words match
          const itemTitleLower = (item.title || '').toLowerCase();
          return itemTitleLower.includes(projectNameKeywords.toLowerCase());
        }) || titleMatches[0];
        
        if (bestMatch) {
          console.log(`[PropertyDetailsPage] Found Goa property by title match: "${bestMatch.title}" (seo_slug: ${bestMatch.seo_slug || 'NULL'})`);
          data = bestMatch;
        }
      }
    }
  }

  if (!data) {
    // Check redirects table
    const redirectResult = await supabase
      .from('property_slug_redirects')
      .select('new_slug')
      .eq('old_slug', listingSlug)
      .eq('location', citySlug)
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
  const { citySlug, listingSlug } = await params;
  const property = await getProperty(citySlug, listingSlug);

  if (!property) {
    return {
      title: 'Property Not Found | RE/MAX Westside',
      description: 'The requested property could not be found.',
    };
  }

  const microMarket = citySlug === 'goa' 
    ? (property.location_area || property.district || property.location || 'Goa')
    : (property.micro_market || property.location || '');
  const cityName = citySlug === 'hyderabad' ? 'Hyderabad' : citySlug === 'goa' ? 'Goa' : 'Dubai';
  const developer = property.developer_name || '';
  const price = property.price_display || `₹${(property.price / 10000000).toFixed(2)} Cr`;

  // Build comprehensive title and description - optimized for Goa
  const title = citySlug === 'goa'
    ? `${property.title}${property.bhk_config ? ` | ${property.bhk_config}` : ''} in ${microMarket}, ${cityName}${developer ? ` by ${developer}` : ''} | RE/MAX Westside`
    : `${property.title} in ${microMarket}, ${cityName}${property.bhk_config ? ` | ${property.bhk_config}` : ''}${developer ? ` by ${developer}` : ''} | RE/MAX Westside`;
  const description = citySlug === 'goa'
    ? `${property.title} - ${property.bhk_config || 'Premium holiday property'} for sale in ${microMarket}, ${cityName}. Price: ${price}. ${property.description?.substring(0, 80) || 'Invest in Goa real estate with high rental yields and beach proximity.'}`.slice(0, 160)
    : `${property.title} - ${property.bhk_config || 'Premium property'} for sale in ${microMarket}, ${cityName}. Price: ${price}. ${property.description?.substring(0, 100) || ''}`.slice(0, 160);

  // Extract amenities and location highlights for keywords
  const amenities = Array.isArray(property.amenities) 
    ? property.amenities.join(', ') 
    : '';
  // For Goa, check nearby_places as well
  const locationHighlights = citySlug === 'goa'
    ? (Array.isArray(property.nearby_places) 
        ? property.nearby_places.map((p: any) => typeof p === 'string' ? p : (p.name || p.place_name || '')).join(', ')
        : property.nearby_landmarks 
        ? (typeof property.nearby_landmarks === 'string' 
            ? property.nearby_landmarks 
            : Object.keys(property.nearby_landmarks).join(', '))
        : '')
    : (property.nearby_landmarks 
        ? (typeof property.nearby_landmarks === 'string' 
            ? property.nearby_landmarks 
            : Object.keys(property.nearby_landmarks).join(', '))
        : '');

  const keywords = citySlug === 'goa'
    ? `${property.title}, ${microMarket}, ${cityName}, ${property.bhk_config || ''}, ${developer}, Goa real estate, holiday home, beach property, rental yield, investment property, ${amenities}, ${locationHighlights}`.slice(0, 255)
    : `${property.title}, ${microMarket}, ${cityName}, ${property.bhk_config || ''}, ${developer}, real estate, ${amenities}, ${locationHighlights}`.slice(0, 255);

  const canonicalUrl = `https://www.westsiderealty.in/${citySlug}/buy/${property.seo_slug || listingSlug}`;
  // For Goa properties, check multiple image fields
  const rawImageUrl = citySlug === 'goa'
    ? (property.hero_image_url || property.main_image_url || (Array.isArray(property.images) && property.images[0]) || (Array.isArray(property.image_gallery) && property.image_gallery[0]) || 'https://www.westsiderealty.in/placeholder.svg')
    : (property.main_image_url || property.image_gallery?.[0] || 'https://www.westsiderealty.in/placeholder.svg');
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

// Generate static params for all properties (optional - for SSG)
export async function generateStaticParams() {
  const supabase = await createClient();
  const params: { citySlug: string; listingSlug: string }[] = [];

  // Fetch from all city tables
  const cities = ['hyderabad', 'goa', 'dubai'];
  
  for (const city of cities) {
    const tableName = city === 'hyderabad' 
      ? 'hyderabad_properties'
      : city === 'goa'
      ? 'goa_holiday_properties'
      : 'dubai_properties';

    const statusFilter = city === 'hyderabad' ? 'active' : city === 'goa' ? 'Active' : 'published';

    const { data: properties } = await supabase
      .from(tableName)
      .select('seo_slug, slug')
      .eq('status', statusFilter)
      .not('seo_slug', 'is', null);

    if (properties) {
      properties.forEach((p) => {
        if (p.seo_slug) {
          params.push({ citySlug: city, listingSlug: p.seo_slug });
        } else if (p.slug) {
          params.push({ citySlug: city, listingSlug: p.slug });
        }
      });
    }
  }

  return params;
}

// Helper functions for JSON-LD
function generatePropertyJsonLd(property: any, citySlug: string) {
  const microMarket = citySlug === 'goa' 
    ? (property.location_area || property.district || property.location || '')
    : (property.micro_market || property.location || '');
  const cityName = citySlug === 'hyderabad' ? 'Hyderabad' : citySlug === 'goa' ? 'Goa' : 'Dubai';
  const canonicalUrl = `https://www.westsiderealty.in/${citySlug}/buy/${property.seo_slug || property.slug}`;
  // For Goa properties, check multiple image fields
  const imageUrl = citySlug === 'goa'
    ? (property.hero_image_url || property.main_image_url || (Array.isArray(property.images) && property.images[0]) || (Array.isArray(property.image_gallery) && property.image_gallery[0]) || 'https://www.westsiderealty.in/placeholder.svg')
    : (property.main_image_url || property.image_gallery?.[0] || 'https://www.westsiderealty.in/placeholder.svg');

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description?.substring(0, 160) || property.title,
    url: canonicalUrl,
    image: citySlug === 'goa'
      ? (Array.isArray(property.images) 
          ? [imageUrl, ...property.images].filter(Boolean).slice(0, 5)
          : Array.isArray(property.image_gallery)
          ? [imageUrl, ...property.image_gallery].filter(Boolean).slice(0, 5)
          : [imageUrl])
      : (Array.isArray(property.image_gallery) 
          ? [imageUrl, ...property.image_gallery].filter(Boolean).slice(0, 5)
          : [imageUrl]),
    address: {
      '@type': 'PostalAddress',
      addressLocality: microMarket,
      addressRegion: cityName,
      addressCountry: citySlug === 'dubai' ? 'AE' : 'IN',
    },
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: citySlug === 'dubai' ? 'AED' : 'INR',
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

function generateBreadcrumbJsonLd(property: any, citySlug: string) {
  const microMarket = citySlug === 'goa' 
    ? (property.location_area || property.district || property.location || 'Goa')
    : (property.micro_market || property.location || '');
  const cityName = citySlug === 'hyderabad' ? 'Hyderabad' : citySlug === 'goa' ? 'Goa' : 'Dubai';

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.westsiderealty.in' },
      { '@type': 'ListItem', position: 2, name: cityName, item: `https://www.westsiderealty.in/${citySlug}` },
      { '@type': 'ListItem', position: 3, name: citySlug === 'goa' ? 'Properties' : microMarket, item: `https://www.westsiderealty.in/${citySlug}${citySlug === 'goa' ? '/buy' : '/properties'}` },
      { '@type': 'ListItem', position: 4, name: property.title, item: `https://www.westsiderealty.in/${citySlug}/buy/${property.seo_slug || property.slug}` },
    ],
  };
}

// Server Component - renders SEO content in HTML
export default async function PropertyDetailsPage({ params }: PageProps) {
  const { citySlug, listingSlug } = await params;
  const property = await getProperty(citySlug, listingSlug);

  if (!property) {
    notFound();
  }

  // Fetch micro market data if available
  let microMarketData = null;
  if (property.micro_market) {
    microMarketData = await microMarketService.getMicroMarketByName(property.micro_market);
  }

  // Fetch FAQs - for Goa properties, use dedicated FAQ service
  let faqs: any[] = [];
  if (citySlug === 'goa') {
    const { getGoaPropertyFAQs } = await import('@/services/goaPropertyFAQService');
    faqs = await getGoaPropertyFAQs(property.id, property);
  } else if (property.project_name) {
    faqs = await getPropertyFAQsFromProject(property.project_name);
  }

  // Prepare structured data for JSON-LD
  const jsonLd = generatePropertyJsonLd(property, citySlug);
  const faqJsonLd = generateFaqJsonLd(faqs);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(property, citySlug);

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
          {property.title} in {citySlug === 'goa' 
            ? (property.location_area || property.district || property.location || 'Goa')
            : (property.micro_market || property.location || citySlug)}
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
          citySlug={citySlug}
          microMarketData={microMarketData}
          faqs={faqs}
        />
      </article>
    </>
  );
}
