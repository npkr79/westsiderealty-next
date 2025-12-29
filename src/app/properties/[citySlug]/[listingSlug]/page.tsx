import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type PageProps = {
  params: Promise<{ citySlug: string; listingSlug: string }>;
};

// Fetch property data to verify it exists and get the correct slug
async function getProperty(citySlug: string, listingSlug: string) {
  const supabase = await createClient();
  
  // Normalize citySlug
  const normalizedCitySlug = Array.isArray(citySlug) ? citySlug[0] : citySlug;
  
  // Determine table name based on city
  const tableName = normalizedCitySlug === 'hyderabad' 
    ? 'hyderabad_properties'
    : normalizedCitySlug === 'goa'
    ? 'goa_holiday_properties'
    : normalizedCitySlug === 'dubai'
    ? 'dubai_properties'
    : null;

  if (!tableName) return null;

  // Check if it's a UUID format
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(listingSlug);

  // Determine status filter based on city
  const statusFilter = normalizedCitySlug === 'hyderabad' ? 'active' : normalizedCitySlug === 'goa' ? 'Active' : 'published';

  // Select seo_slug and slug fields to get the canonical slug
  let query = supabase.from(tableName).select('seo_slug, slug');

  if (isUUID) {
    query = query.eq('id', listingSlug);
  } else {
    // For Goa properties, only check seo_slug (there's no 'slug' field in goa_holiday_properties table)
    if (normalizedCitySlug === 'goa') {
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
    console.error('[PropertiesRedirectPage] Error fetching property:', error);
    return null;
  }

  // If not found by exact slug match, try fuzzy matching
  if (!data && !isUUID) {
    const slugParts = listingSlug.split('-');
    
    // For Goa, remove "goa" from the end if present
    const partsWithoutCity = normalizedCitySlug === 'goa' && slugParts[slugParts.length - 1] === 'goa'
      ? slugParts.slice(0, -1)
      : slugParts;
    
    // Extract key identifiers: project name (first 2-3 words) and location (last 2-3 words)
    const projectNameKeywords = partsWithoutCity.slice(0, Math.min(3, partsWithoutCity.length)).join(' ');
    const locationKeywords = partsWithoutCity.slice(-3).join(' ');
    
    if (projectNameKeywords.length >= 3) {
      // Try to find by title match with project name
      let titleMatches: any[] = [];
      const { data: matches1, error: err1 } = await supabase
        .from(tableName)
        .select('seo_slug, slug')
        .eq('status', statusFilter)
        .ilike('title', `%${projectNameKeywords}%`)
        .limit(10);
      
      if (!err1 && matches1) {
        titleMatches = matches1;
      }
      
      // If no matches, try with location keywords
      if (titleMatches.length === 0 && locationKeywords.length >= 3) {
        const { data: matches2, error: err2 } = await supabase
          .from(tableName)
          .select('seo_slug, slug')
          .eq('status', statusFilter)
          .or(`title.ilike.%${locationKeywords}%,location.ilike.%${locationKeywords}%,micro_market.ilike.%${locationKeywords}%`)
          .limit(10);
        
        if (!err2 && matches2) {
          titleMatches = matches2;
        }
      }
      
      if (titleMatches.length > 0) {
        // Find best match by comparing slug similarity
        const searchSlugLower = listingSlug.toLowerCase();
        const bestMatch = titleMatches.find((item: any) => {
          const itemSlug = (item.seo_slug || item.slug || '').toLowerCase();
          // Check if slugs have significant overlap
          return itemSlug.includes(searchSlugLower.substring(0, 20)) || 
                 searchSlugLower.includes(itemSlug.substring(0, 20)) ||
                 // Check if key words match
                 projectNameKeywords.split(' ').some(word => 
                   itemSlug.includes(word.toLowerCase()) && word.length >= 3
                 );
        }) || titleMatches[0];
        
        if (bestMatch) {
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
      .eq('location', normalizedCitySlug)
      .maybeSingle();

    if (redirectResult.data?.new_slug) {
      const { data: redirectedData } = await supabase
        .from(tableName)
        .select('seo_slug, slug')
        .eq('seo_slug', redirectResult.data.new_slug)
        .eq('status', statusFilter)
        .maybeSingle();
      
      if (redirectedData) {
        return redirectedData;
      }
    }
    return null;
  }

  return data;
}

// This page handles old Google-indexed URLs with pattern /properties/{city}/{slug}
// It redirects to the canonical URL pattern /{citySlug}/buy/{listingSlug}
export default async function PropertiesRedirectPage({ params }: PageProps) {
  const { citySlug: citySlugParam, listingSlug: listingSlugParam } = await params;
  
  // Normalize params (handle both string and string[] as per memory)
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const listingSlug = Array.isArray(listingSlugParam) ? listingSlugParam[0] : listingSlugParam;

  if (!citySlug || !listingSlug) {
    notFound();
  }

  // Look up the property to get the canonical slug
  const property = await getProperty(citySlug, listingSlug);

  if (!property) {
    // Property not found - return 404
    notFound();
  }

  // Get the canonical slug (prefer seo_slug, fallback to slug)
  const canonicalSlug = property.seo_slug || property.slug || listingSlug;

  // Redirect to the canonical URL
  redirect(`/${citySlug}/buy/${canonicalSlug}`);
}
