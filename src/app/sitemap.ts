import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const MAX_URLS_PER_SITEMAP = 50000;

// Generate sitemap IDs to split URLs into chunks
export async function generateSitemaps() {
  const supabase = await createClient();

  try {
    // Count total URLs to determine how many sitemaps we need
    const [
      citiesResult,
      microMarketsResult,
      projectsResult,
      landingPagesResult,
      blogsResult,
      developersResult,
      hyderabadPropertiesResult,
      goaPropertiesResult,
      dubaiPropertiesResult,
    ] = await Promise.all([
      supabase.from("cities").select("id", { count: "exact", head: true }).eq("page_status", "published"),
      supabase.from("micro_markets").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("projects").select("id", { count: "exact", head: true }).not("url_slug", "is", null),
      supabase.from("landing_pages").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("blog_articles").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("developers").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabase.from("hyderabad_properties").select("id", { count: "exact", head: true }).eq("status", "active").not("seo_slug", "is", null),
      supabase.from("goa_holiday_properties").select("id", { count: "exact", head: true }).eq("status", "Active").not("seo_slug", "is", null),
      supabase.from("dubai_properties").select("id", { count: "exact", head: true }).eq("status", "published").not("seo_slug", "is", null),
    ]);

    // Calculate total URLs
    // Static pages: ~10
    // Cities: count * 5 (city page + city/projects, city/areas, city/buy, city/micro-markets, city/developers)
    const citiesCount = citiesResult.count || 0;
    const microMarketsCount = microMarketsResult.count || 0;
    const projectsCount = projectsResult.count || 0;
    const landingPagesCount = landingPagesResult.count || 0;
    const blogsCount = blogsResult.count || 0;
    const developersCount = developersResult.count || 0;
    const hyderabadPropsCount = hyderabadPropertiesResult.count || 0;
    const goaPropsCount = goaPropertiesResult.count || 0;
    const dubaiPropsCount = dubaiPropertiesResult.count || 0;

    const staticPagesCount = 10;
    const cityPagesCount = citiesCount * 5; // Each city has ~5 pages
    const totalUrls = staticPagesCount + cityPagesCount + microMarketsCount + projectsCount + 
                     landingPagesCount + blogsCount + developersCount + 
                     hyderabadPropsCount + goaPropsCount + dubaiPropsCount;

    // Calculate number of sitemaps needed
    const sitemapCount = Math.ceil(totalUrls / MAX_URLS_PER_SITEMAP);

    // If we have less than 50k URLs, return single sitemap (id: 0)
    if (sitemapCount <= 1) {
      return [{ id: '0' }];
    }

    // Otherwise, return array of sitemap IDs
    return Array.from({ length: sitemapCount }, (_, i) => ({ id: String(i) }));
  } catch (error) {
    console.error("Error generating sitemaps:", error);
    // Return single sitemap on error
    return [{ id: '0' }];
  }
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const baseUrl = "https://www.westsiderealty.in";
  const sitemapId = parseInt(id, 10);

  try {
    // Fetch all data
    const [
      citiesResult,
      microMarketsResult,
      projectsResult,
      landingPagesResult,
      blogsResult,
      developersResult,
      hyderabadPropertiesResult,
      goaPropertiesResult,
      dubaiPropertiesResult,
    ] = await Promise.all([
      supabase.from("cities").select("url_slug, updated_at").eq("page_status", "published"),
      supabase
        .from("micro_markets")
        .select("url_slug, updated_at, city_id, cities!inner(url_slug)")
        .eq("status", "published"),
      supabase
        .from("projects")
        .select(
          "url_slug, updated_at, city:cities(url_slug), micro_market:micro_markets(url_slug)"
        )
        .not("url_slug", "is", null),
      supabase
        .from("landing_pages")
        .select("uri, updated_at")
        .eq("status", "published"),
      supabase
        .from("blog_articles")
        .select("slug, updated_at")
        .eq("status", "published"),
      supabase
        .from("developers")
        .select("url_slug, updated_at")
        .eq("is_published", true),
      supabase
        .from("hyderabad_properties")
        .select("seo_slug, slug, updated_at")
        .eq("status", "active")
        .not("seo_slug", "is", null),
      supabase
        .from("goa_holiday_properties")
        .select("seo_slug, slug, updated_at")
        .eq("status", "Active")
        .not("seo_slug", "is", null),
      supabase
        .from("dubai_properties")
        .select("seo_slug, slug, updated_at")
        .eq("status", "published")
        .not("seo_slug", "is", null),
    ]);

    const urls: MetadataRoute.Sitemap = [];

    // Build static and city-based URLs (always in sitemap 0)
    const staticAndCityUrls: MetadataRoute.Sitemap = [];
    
    staticAndCityUrls.push(
      { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
      { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
      { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
      { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
      { url: `${baseUrl}/projects`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
      { url: `${baseUrl}/developers`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
      { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
      { url: `${baseUrl}/properties`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
      { url: `${baseUrl}/hyderabad/properties`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
      { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 }
    );

    // Cities and city-specific pages
    citiesResult.data?.forEach((c) => {
      staticAndCityUrls.push(
        { url: `${baseUrl}/${c.url_slug}`, lastModified: c.updated_at ? new Date(c.updated_at) : new Date(), changeFrequency: "weekly", priority: 0.9 },
        { url: `${baseUrl}/${c.url_slug}/projects`, lastModified: c.updated_at ? new Date(c.updated_at) : new Date(), changeFrequency: "daily", priority: 0.8 },
        { url: `${baseUrl}/${c.url_slug}/areas`, lastModified: c.updated_at ? new Date(c.updated_at) : new Date(), changeFrequency: "weekly", priority: 0.7 },
        { url: `${baseUrl}/${c.url_slug}/buy`, lastModified: c.updated_at ? new Date(c.updated_at) : new Date(), changeFrequency: "daily", priority: 0.9 },
        { url: `${baseUrl}/${c.url_slug}/micro-markets`, lastModified: c.updated_at ? new Date(c.updated_at) : new Date(), changeFrequency: "weekly", priority: 0.8 }
      );
    });

    // Micro-markets
    microMarketsResult.data?.forEach((mm: any) => {
      const citySlug = mm.cities?.url_slug;
      if (citySlug && mm.url_slug) {
        staticAndCityUrls.push({
          url: `${baseUrl}/${citySlug}/${mm.url_slug}`,
          lastModified: mm.updated_at ? new Date(mm.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    });

    // Only add static/city URLs to sitemap 0
    if (sitemapId === 0) {
      urls.push(...staticAndCityUrls);
    }

    // Calculate which chunk of URLs this sitemap should contain
    // Projects, listings, blogs, developers, landing pages are the bulk of URLs
    const allDynamicUrls: MetadataRoute.Sitemap = [];

    // Projects
    if (projectsResult.data) {
      projectsResult.data.forEach((p: any) => {
        const cityData = Array.isArray(p.city) ? p.city[0] : p.city;
        const citySlug = cityData?.url_slug;
        if (p.url_slug && citySlug) {
          allDynamicUrls.push({
            url: `${baseUrl}/${citySlug}/projects/${p.url_slug}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
          });
        }
      });
    }

    // Landing Pages
    landingPagesResult.data?.forEach((lp) => {
      allDynamicUrls.push({
        url: `${baseUrl}/landing/${lp.uri}`,
        lastModified: lp.updated_at ? new Date(lp.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
      });
    });

    // Blogs
    blogsResult.data?.forEach((b) => {
      allDynamicUrls.push({
        url: `${baseUrl}/blog/${b.slug}`,
        lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    });

    // Developers
    developersResult.data?.forEach((d) => {
      allDynamicUrls.push({
        url: `${baseUrl}/developers/${d.url_slug}`,
        lastModified: d.updated_at ? new Date(d.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    });

    // Property Listings - Hyderabad
    hyderabadPropertiesResult.data?.forEach((p) => {
      const slug = p.slug || p.seo_slug;
      if (slug) {
        allDynamicUrls.push({
          url: `${baseUrl}/hyderabad/buy/${slug}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    });

    // Property Listings - Goa
    goaPropertiesResult.data?.forEach((p) => {
      const slug = p.slug || p.seo_slug;
      if (slug) {
        allDynamicUrls.push({
          url: `${baseUrl}/goa/buy/${slug}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    });

    // Property Listings - Dubai
    dubaiPropertiesResult.data?.forEach((p) => {
      const slug = p.slug || p.seo_slug;
      if (slug) {
        allDynamicUrls.push({
          url: `${baseUrl}/dubai/buy/${slug}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    });

    // Split dynamic URLs into chunks
    const staticUrlsCount = staticAndCityUrls.length;
    
    if (sitemapId === 0) {
      // First sitemap: static pages + first chunk of dynamic URLs
      const remainingSlots = MAX_URLS_PER_SITEMAP - staticUrlsCount;
      const chunk = allDynamicUrls.slice(0, Math.max(0, remainingSlots));
      urls.push(...chunk);
    } else {
      // Subsequent sitemaps: only dynamic URLs
      // Calculate how many dynamic URLs were in sitemap 0
      const dynamicUrlsInSitemap0 = Math.max(0, MAX_URLS_PER_SITEMAP - staticUrlsCount);
      
      // For sitemap N (N>0), start after the dynamic URLs that went into sitemap 0
      // Plus all the dynamic URLs in previous sitemaps (N-1) * MAX_URLS_PER_SITEMAP
      const startIndex = dynamicUrlsInSitemap0 + (sitemapId - 1) * MAX_URLS_PER_SITEMAP;
      const endIndex = startIndex + MAX_URLS_PER_SITEMAP;
      const chunk = allDynamicUrls.slice(startIndex, endIndex);
      urls.push(...chunk);
    }

    return urls;
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return at least the base URL
    return sitemapId === 0
      ? [{ url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 }]
      : [];
  }
}