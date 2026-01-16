import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { getLocalityStats, generateFilterSlug } from "@/lib/utils/localityStats";
import { parseJsonb, asArray } from "@/lib/parse-jsonb";

const baseUrl = "https://www.westsiderealty.in";

type ProjectSmartLinkRow = {
  property_types?: unknown;
  bhk_config?: string | null;
  configurations?: unknown;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function pluralize(value: string): string {
  if (!value) return value;
  if (value.endsWith("y")) return `${value.slice(0, -1)}ies`;
  if (value.endsWith("s")) return value;
  return `${value}s`;
}

function extractBhkToken(input: string): string | null {
  const normalized = input.toLowerCase();
  const match = normalized.match(/(\d+)\s*\+?\s*bhk/);
  if (!match) return null;
  const count = match[1];
  if (normalized.includes("+") || normalized.includes("plus")) {
    return `${count}-plus-bhk`;
  }
  return `${count}-bhk`;
}

function normalizePropertyTypeForSlug(input: string): string | null {
  const normalized = input.toLowerCase();
  const withoutBhk = normalized.replace(/\d+\s*\+?\s*bhk/gi, "").trim();
  if (withoutBhk.includes("apartment")) return "apartment";
  if (withoutBhk.includes("villa")) return "villa";
  if (withoutBhk.includes("penthouse")) return "penthouse";
  if (withoutBhk.includes("plot")) return "plot";
  if (withoutBhk.includes("gated community")) return "gated community";
  if (withoutBhk.includes("house")) return "house";
  if (withoutBhk.includes("flat")) return "flat";
  return null;
}

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
      const cityData = Array.isArray(mm.cities) ? mm.cities[0] : mm.cities;
      const citySlug = cityData?.url_slug;
      if (!citySlug) {
        console.log(`[sitemap] Skipping ${mm.url_slug} - Missing City Slug. Raw cities:`, mm.cities);
      }
      if (citySlug && mm.url_slug) {
        urls.push({
          url: `${baseUrl}/${citySlug}/${mm.url_slug}`,
          lastModified: mm.updated_at ? new Date(mm.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    });

    // Smart Links (Programmatic SEO) - Generate valid filter URLs for each micro-market
    // Note: This could be heavy with many micro-markets. Consider caching or splitting if > 50,000 URLs
    console.log("[sitemap] Generating Smart Links for micro-markets...");
    const smartLinkUrls: MetadataRoute.Sitemap = [];
    const smartLinkSet = new Set<string>();
    
    if (microMarketsResult.data && microMarketsResult.data.length > 0) {
      // Process micro-markets in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < microMarketsResult.data.length; i += batchSize) {
        const batch = microMarketsResult.data.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (mm: any) => {
            try {
              const cityData = Array.isArray(mm.cities) ? mm.cities[0] : mm.cities;
              const citySlug = cityData?.url_slug;
              if (!citySlug) {
                console.log(`[sitemap] Skipping ${mm.url_slug} - Missing City Slug. Raw cities:`, mm.cities);
              }
              if (!citySlug || !mm.url_slug || !mm.city_id || !mm.id) return;

              // Get locality stats to determine valid filters
              const stats = await getLocalityStats(mm.id, mm.city_id);
              
              // Generate URLs for each valid filter
              // Residential types
              stats.residentialTypes.forEach((type: string) => {
                const filterSlug = generateFilterSlug("residential", type, mm.url_slug);
                smartLinkSet.add(`${baseUrl}/homes/${filterSlug}`);
              });

              // Commercial types
              stats.commercialTypes.forEach((type: string) => {
                const filterSlug = generateFilterSlug("commercial", type, mm.url_slug);
                smartLinkSet.add(`${baseUrl}/homes/${filterSlug}`);
              });

              // Price ranges
              stats.priceRanges.forEach((range: string) => {
                const filterSlug = generateFilterSlug("price", range, mm.url_slug);
                smartLinkSet.add(`${baseUrl}/homes/${filterSlug}`);
              });

              // Status filters
              stats.statuses.forEach((status: string) => {
                const filterSlug = generateFilterSlug("status", status, mm.url_slug);
                smartLinkSet.add(`${baseUrl}/homes/${filterSlug}`);
              });

              // Match SmartLinkGrid logic: combine bhk_config/configurations with property types
              const propertyTypeSet = new Set<string>();
              const bhkSet = new Set<string>();

              const { data: projects } = await supabase
                .from("projects")
                .select("property_types, bhk_config, configurations")
                .eq("micro_market_id", mm.id)
                .eq("city_id", mm.city_id)
                .or("status.ilike.published,status.ilike.%under construction%");

              (projects as ProjectSmartLinkRow[] | null | undefined)?.forEach((project) => {
                const types = parseJsonb(project.property_types, []);
                const typeArray = asArray<string>(types);
                typeArray.forEach((type) => {
                  if (!type) return;
                  const bhkToken = extractBhkToken(type);
                  if (bhkToken) bhkSet.add(bhkToken);
                  const baseType = normalizePropertyTypeForSlug(type);
                  if (baseType) propertyTypeSet.add(baseType);
                });

                if (project.bhk_config) {
                  const bhkToken = extractBhkToken(project.bhk_config);
                  if (bhkToken) bhkSet.add(bhkToken);
                }

                const configs = parseJsonb(project.configurations, []);
                const configArray = asArray<any>(configs);
                configArray.forEach((config) => {
                  if (!config) return;
                  if (typeof config === "string") {
                    const bhkToken = extractBhkToken(config);
                    if (bhkToken) bhkSet.add(bhkToken);
                    return;
                  }
                  const configText =
                    config.bhk_config ||
                    config.bhk ||
                    config.unit_type ||
                    config.configuration ||
                    config.config ||
                    config.bedrooms ||
                    "";
                  if (configText) {
                    const bhkToken = extractBhkToken(String(configText));
                    if (bhkToken) bhkSet.add(bhkToken);
                  }
                });
              });

              // Generate combined BHK + property type URLs
              propertyTypeSet.forEach((type) => {
                const typeSlug = slugify(type);
                const pluralType = pluralize(typeSlug);

                // Generic fallback: /homes/apartments-in-{market}
                const genericSlug = `${pluralType}-in-${slugify(mm.url_slug)}`;
                smartLinkSet.add(`${baseUrl}/homes/${genericSlug}`);

                bhkSet.forEach((bhkToken) => {
                  // Ensure no redundancy like 3-bhk-3-bhk-apartments
                  const safeType = typeSlug.replace(/\d+-\+?-?bhk/gi, "").trim();
                  const safePlural = pluralize(slugify(safeType || typeSlug));
                  const combinedSlug = `${bhkToken}-${safePlural}-in-${slugify(mm.url_slug)}`;
                  smartLinkSet.add(`${baseUrl}/homes/${combinedSlug}`);
                });
              });
            } catch (error) {
              console.error(`[sitemap] Error generating Smart Links for micro-market ${mm.url_slug}:`, error);
            }
          })
        );
      }
    }
    
    smartLinkSet.forEach((url) => {
      smartLinkUrls.push({
        url,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    });

    console.log(`[sitemap] Generated ${smartLinkUrls.length} Smart Link URLs`);
    urls.push(...smartLinkUrls);

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