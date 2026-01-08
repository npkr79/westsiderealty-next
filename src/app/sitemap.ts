import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const baseUrl = "https://www.westsiderealty.in";

/**
 * Generate sitemap for the site
 * Next.js App Router automatically makes this available at /sitemap.xml
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  try {
    // Fetch all data in parallel
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

    // Static pages
    urls.push(
      { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
      { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
      { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
      { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
      { url: `${baseUrl}/projects`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
      { url: `${baseUrl}/developers`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
      { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
      { url: `${baseUrl}/properties`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
      { url: `${baseUrl}/hyderabad/properties`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
      { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
      { url: `${baseUrl}/sell-property`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
      { url: `${baseUrl}/buying-requirement`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
      { url: `${baseUrl}/hyderabad/landowner-investor-share-flats`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 }
    );

    // Cities and city-specific pages
    citiesResult.data?.forEach((c) => {
      urls.push(
        { url: `${baseUrl}/${c.url_slug}`, lastModified: c.updated_at ? new Date(c.updated_at) : new Date(), changeFrequency: "weekly", priority: 0.9 },
        { url: `${baseUrl}/${c.url_slug}/projects`, lastModified: c.updated_at ? new Date(c.updated_at) : new Date(), changeFrequency: "daily", priority: 0.8 },
        { url: `${baseUrl}/${c.url_slug}/areas`, lastModified: c.updated_at ? new Date(c.updated_at) : new Date(), changeFrequency: "weekly", priority: 0.7 },
        { url: `${baseUrl}/${c.url_slug}/buy`, lastModified: c.updated_at ? new Date(c.updated_at) : new Date(), changeFrequency: "daily", priority: 0.9 },
        { url: `${baseUrl}/${c.url_slug}/micro-markets`, lastModified: c.updated_at ? new Date(c.updated_at) : new Date(), changeFrequency: "weekly", priority: 0.8 },
        { url: `${baseUrl}/${c.url_slug}/developers`, lastModified: c.updated_at ? new Date(c.updated_at) : new Date(), changeFrequency: "weekly", priority: 0.7 }
      );
    });

    // Micro-markets
    microMarketsResult.data?.forEach((mm: any) => {
      const citySlug = mm.cities?.url_slug;
      if (citySlug && mm.url_slug) {
        urls.push({
          url: `${baseUrl}/${citySlug}/${mm.url_slug}`,
          lastModified: mm.updated_at ? new Date(mm.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    });

    // Projects
    if (projectsResult.data) {
      projectsResult.data.forEach((p: any) => {
        const cityData = Array.isArray(p.city) ? p.city[0] : p.city;
        const citySlug = cityData?.url_slug;
        if (p.url_slug && citySlug) {
          urls.push({
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
      urls.push({
        url: `${baseUrl}/landing/${lp.uri}`,
        lastModified: lp.updated_at ? new Date(lp.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
      });
    });

    // Blogs
    blogsResult.data?.forEach((b) => {
      urls.push({
        url: `${baseUrl}/blog/${b.slug}`,
        lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    });

    // Developers
    developersResult.data?.forEach((d) => {
      urls.push({
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
        urls.push({
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
        urls.push({
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
        urls.push({
          url: `${baseUrl}/dubai/buy/${slug}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    });

    return urls;
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return at least the base URL on error
    return [{ url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 }];
  }
}