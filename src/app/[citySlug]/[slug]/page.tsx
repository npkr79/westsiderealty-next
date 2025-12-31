import { permanentRedirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type PageProps = {
  params: Promise<{ citySlug: string; slug: string }>;
};

/**
 * Catch-all route for old Google-indexed property URLs
 * Handles URLs like: /hyderabad/4bhk-apartment-dsr-the-classe-kokapet
 * Redirects to canonical: /hyderabad/buy/dsr-the-classe-4bhk-kokapet-2
 */
export default async function OldPropertyRedirectPage({ params }: PageProps) {
  const { citySlug: citySlugParam, slug: slugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  if (!citySlug || !slug) {
    notFound();
  }

  const supabase = await createClient();

  // FIRST: Check if it's a micro-market page (to avoid conflicts with micro-market route)
  // Micro-market routes are more specific, so we should not handle them here
  const { data: microMarket, error: microMarketError } = await supabase
    .from('micro_market_pages')
    .select('url_slug, city:cities(url_slug)')
    .eq('url_slug', slug)
    .maybeSingle();

  if (microMarketError) {
    console.error(`[OldPropertyRedirect] Error checking micro-market:`, microMarketError);
  }

  if (microMarket) {
    const citySlugFromMM = Array.isArray(microMarket.city) 
      ? microMarket.city[0]?.url_slug 
      : microMarket.city?.url_slug;
    
    // If micro-market exists and city matches, this should be handled by micro-market route
    // Return 404 so Next.js can try the micro-market route (though it may have already matched this one)
    if (citySlugFromMM === citySlug) {
      console.log(`[OldPropertyRedirect] ${citySlug}/${slug} is a micro-market, should be handled by micro-market route`);
      notFound();
    }
  }

  // Determine table name based on city
  const tableName = citySlug === 'hyderabad' 
    ? 'hyderabad_properties'
    : citySlug === 'goa'
    ? 'goa_holiday_properties'
    : citySlug === 'dubai'
    ? 'dubai_properties'
    : null;

  if (!tableName) {
    // Not a known city and not a micro-market
    notFound();
  }

  // Determine status filter based on city
  const statusFilter = citySlug === 'hyderabad' ? 'active' : citySlug === 'goa' ? 'Active' : 'published';

  // Check if it's a UUID format
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

  let property = null;

  if (isUUID) {
    // Query by ID
    const { data, error } = await supabase
      .from(tableName)
      .select('slug, seo_slug')
      .eq('id', slug)
      .eq('status', statusFilter)
      .maybeSingle();

    if (error) {
      console.error(`[OldPropertyRedirect] Error fetching property by ID:`, error);
    } else if (data) {
      property = data;
    }
  } else {
    // Query by seo_slug or slug
    if (citySlug === 'goa') {
      // Goa properties only have seo_slug
      const { data, error } = await supabase
        .from(tableName)
        .select('slug, seo_slug')
        .eq('seo_slug', slug)
        .eq('status', statusFilter)
        .maybeSingle();

      if (error) {
        console.error(`[OldPropertyRedirect] Error fetching Goa property:`, error);
      } else if (data) {
        property = data;
      }
    } else {
      // Hyderabad and Dubai: check both seo_slug and slug
      const { data, error } = await supabase
        .from(tableName)
        .select('slug, seo_slug')
        .or(`seo_slug.eq.${slug},slug.eq.${slug}`)
        .eq('status', statusFilter)
        .maybeSingle();

      if (error) {
        console.error(`[OldPropertyRedirect] Error fetching property:`, error);
      } else if (data) {
        property = data;
      }
    }
  }

  // If property found, redirect to canonical URL
  if (property) {
    const canonicalSlug = property.slug || property.seo_slug;
    if (canonicalSlug) {
      console.log(`[OldPropertyRedirect] Redirecting ${citySlug}/${slug} → ${citySlug}/buy/${canonicalSlug}`);
      permanentRedirect(`/${citySlug}/buy/${canonicalSlug}`);
    }
  }

  // Check property_slug_redirects table
  const { data: redirectEntry, error: redirectError } = await supabase
    .from('property_slug_redirects')
    .select('new_slug, location')
    .eq('old_slug', slug)
    .eq('location', citySlug)
    .maybeSingle();

  if (redirectError) {
    console.error(`[OldPropertyRedirect] Error checking redirects table:`, redirectError);
  }

  if (redirectEntry?.new_slug) {
    console.log(`[OldPropertyRedirect] Found redirect entry: ${citySlug}/${slug} → ${redirectEntry.location}/buy/${redirectEntry.new_slug}`);
    permanentRedirect(`/${redirectEntry.location}/buy/${redirectEntry.new_slug}`);
  }

  // Not found - return 404
  console.log(`[OldPropertyRedirect] No match found for ${citySlug}/${slug}`);
  notFound();
}
