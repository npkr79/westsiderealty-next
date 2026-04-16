import { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { getLocalityStats, generateFilterSlug } from "@/lib/utils/localityStats";
import { parseJsonb, asArray } from "@/lib/parse-jsonb";
import { buildProjectAbsoluteUrl } from "@/lib/routes";
import { getAllAdvisoryProjectSlugs } from "@/services/advisoryProjectService";

const baseUrl = "https://www.westsiderealty.in";

type ProjectSmartLinkRow = {
  property_types?: unknown;
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
  const cleaned = normalized.replace(/luxurys?/gi, "").replace(/\s+/g, " ").trim();
  const withoutBhk = cleaned.replace(/\d+\s*\+?\s*bhk/gi, "").trim();
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
  const supabase = createServiceClient();

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
      reraProjectsResult,
      newsArticlesResult,
    ] = await Promise.all([
      supabase.from("cities").select("url_slug, updated_at").eq("page_status", "published"),
      supabase
        .from("micro_markets")
        .select("id, url_slug, updated_at, city_id, cities!inner(url_slug)")
        .eq("status", "published"),
      supabase
        .from("projects")
        .select(
          "url_slug, updated_at, city:cities(url_slug), micro_market:micro_markets(url_slug)"
        )
        .eq("page_status", "published")
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
      supabase
        .from("rera_projects")
        .select("url_slug, city_slug, updated_at")
        .not("url_slug", "is", null)
        .not("city_slug", "is", null),
      supabase
        .from("generated_articles")
        .select("slug, published_at, updated_at")
        .eq("status", "published")
        .not("slug", "is", null),
    ]);

    const urls: MetadataRoute.Sitemap = [];

    // Static pages — use a fixed date (avoids Googlebot thinking every page changed on every crawl)
    const STATIC_DATE = new Date("2025-01-01");
    urls.push(
      { url: baseUrl, lastModified: STATIC_DATE, changeFrequency: "daily", priority: 1 },
      { url: `${baseUrl}/about`, lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.6 },
      { url: `${baseUrl}/contact`, lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.6 },
      { url: `${baseUrl}/services`, lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.7 },
      { url: `${baseUrl}/projects`, lastModified: STATIC_DATE, changeFrequency: "daily", priority: 0.9 },
      { url: `${baseUrl}/developers`, lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.7 },
      { url: `${baseUrl}/blog`, lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.7 },
      { url: `${baseUrl}/properties`, lastModified: STATIC_DATE, changeFrequency: "daily", priority: 0.9 },
      { url: `${baseUrl}/hyderabad/properties`, lastModified: STATIC_DATE, changeFrequency: "daily", priority: 0.7 },
      { url: `${baseUrl}/privacy-policy`, lastModified: STATIC_DATE, changeFrequency: "yearly", priority: 0.3 },
      { url: `${baseUrl}/sell-property`, lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.8 },
      { url: `${baseUrl}/buying-requirement`, lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.8 },
      { url: `${baseUrl}/hyderabad/landowner-investor-share-flats`, lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.7 },
      { url: `${baseUrl}/commercial-investments`, lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.9 },
      { url: `${baseUrl}/kokapet-gandipet-luxury-villas`, lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.9 },
      { url: `${baseUrl}/apartment-intelligence`, lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.8 },
      { url: `${baseUrl}/villa-intelligence`, lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.8 },
      { url: `${baseUrl}/residential-intelligence`, lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.8 },
      { url: `${baseUrl}/hyderabad/buy`, lastModified: STATIC_DATE, changeFrequency: "daily", priority: 0.8 },
      { url: `${baseUrl}/hyderabad/shares`, lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.7 },
      { url: `${baseUrl}/insights`, lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.7 },
      { url: `${baseUrl}/portfolio`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
      { url: `${baseUrl}/opportunities`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 }
    );

    // Development opportunities (B2B listings) — published rows only
    const { data: opportunitiesData } = await supabase
      .from("development_opportunities")
      .select("slug, updated_at")
      .eq("is_published", true);
    opportunitiesData?.forEach((o: { slug: string; updated_at: string | null }) => {
      urls.push({
        url: `${baseUrl}/opportunities/${o.slug}`,
        lastModified: o.updated_at ? new Date(o.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.85,
      });
    });

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
      const citySlug = Array.isArray(mm.cities) ? mm.cities[0]?.url_slug : mm.cities?.url_slug;
      console.log("Processing Market:", mm.url_slug, "City Slug:", citySlug);
      if (!citySlug) {
        console.warn(`[Sitemap] Skipping market ${mm.url_slug} - No City Slug found.`);
        return;
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

    // Smart Links (Programmatic SEO) - Generate valid filter URLs for top micro-markets only
    // Capped at 30 to avoid O(n) DB calls adding 30-60s to every deploy
    const topMarkets = microMarketsResult.data?.slice(0, 30) || [];
    console.log("[sitemap] Generating Smart Links for micro-markets...");
    console.log(`[sitemap] Micro-markets count (capped): ${topMarkets.length}`);
    const smartLinkUrls: MetadataRoute.Sitemap = [];
    const smartLinkSet = new Set<string>();

    if (topMarkets.length > 0) {
      // Process micro-markets in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < topMarkets.length; i += batchSize) {
        const batch = topMarkets.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (mm: any) => {
            try {
              const citySlug = Array.isArray(mm.cities) ? mm.cities[0]?.url_slug : mm.cities?.url_slug;
              console.log("Processing Market:", mm.url_slug, "City Slug:", citySlug);
              if (!citySlug) {
                console.warn(`[Sitemap] Skipping market ${mm.url_slug} - No City Slug found.`);
                return;
              }
              if (!mm.url_slug || !mm.city_id || !mm.id) return;

              // Get locality stats to determine valid filters
              const stats = await getLocalityStats(mm.id, mm.city_id);
              console.log(
                `[sitemap] Stats for ${mm.url_slug}: residential=${stats.residentialTypes.length}, commercial=${stats.commercialTypes.length}, price=${stats.priceRanges.length}, status=${stats.statuses.length}, totalProjects=${stats.totalProjects}`
              );
              
              // Generate URLs for each valid filter
              // Residential types
              stats.residentialTypes.forEach((type: string) => {
                const filterSlug = generateFilterSlug("residential", type, mm.url_slug);
                smartLinkSet.add(`${baseUrl}/homes/${filterSlug}`);
                console.log(`[Sitemap] Added link: ${filterSlug}`);
              });

              // Commercial types
              stats.commercialTypes.forEach((type: string) => {
                const filterSlug = generateFilterSlug("commercial", type, mm.url_slug);
                smartLinkSet.add(`${baseUrl}/homes/${filterSlug}`);
                console.log(`[Sitemap] Added link: ${filterSlug}`);
              });

              // Price ranges
              stats.priceRanges.forEach((range: string) => {
                const filterSlug = generateFilterSlug("price", range, mm.url_slug);
                smartLinkSet.add(`${baseUrl}/homes/${filterSlug}`);
                console.log(`[Sitemap] Added link: ${filterSlug}`);
              });

              // Status filters
              stats.statuses.forEach((status: string) => {
                const filterSlug = generateFilterSlug("status", status, mm.url_slug);
                smartLinkSet.add(`${baseUrl}/homes/${filterSlug}`);
                console.log(`[Sitemap] Added link: ${filterSlug}`);
              });

              // Match SmartLinkGrid logic: combine bhk_config/configurations with property types
              const propertyTypeSet = new Set<string>();
              const bhkSet = new Set<string>();

              const { data: projects } = await supabase
                .from("projects")
                .select("property_types, configurations")
                .eq("micro_market_id", mm.id)
                .eq("city_id", mm.city_id)
                .or("status.ilike.published,status.ilike.%under construction%");
              console.log(
                `[sitemap] Projects for ${mm.url_slug}: ${projects?.length || 0}`
              );

              (projects as ProjectSmartLinkRow[] | null | undefined)?.forEach((project, idx) => {
                if (idx === 0) {
                  console.log(
                    `[sitemap] Sample project for ${mm.url_slug}: property_types=${JSON.stringify(project.property_types)}, configurations=${JSON.stringify(project.configurations)}`
                  );
                }
                const types = parseJsonb(project.property_types, []);
                const typeArray = asArray<string>(types);
                typeArray.forEach((type) => {
                  if (!type) return;
                  const bhkToken = extractBhkToken(type);
                  if (bhkToken) bhkSet.add(bhkToken);
                  const baseType = normalizePropertyTypeForSlug(type);
                  if (baseType) propertyTypeSet.add(baseType);
                });

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

    // Projects (main listings)
    const listingProjectSet = new Set<string>();
    if (projectsResult.data) {
      projectsResult.data.forEach((p: any) => {
        const cityData = Array.isArray(p.city) ? p.city[0] : p.city;
        const citySlug = cityData?.url_slug;
        if (p.url_slug && citySlug) {
          const key = `${citySlug}/${p.url_slug}`;
          listingProjectSet.add(key);
          urls.push({
            url: buildProjectAbsoluteUrl(citySlug, p.url_slug),
            lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
          });
        }
      });
    }

    // Focus projects from advisor_project_intelligence
    // — Projects WITH listing_url_slug are already in the sitemap via the projects table
    // — Projects WITHOUT listing_url_slug live at /portfolio/[slug]
    const { data: focusProjects } = await supabase
      .from("advisor_project_intelligence")
      .select("project_slug, city_slug, listing_url_slug, updated_at")
      .eq("is_focus_project", true)
      .eq("sale_status", "active");

    (focusProjects ?? []).forEach((fp: any) => {
      if (fp.listing_url_slug) {
        // Already included via the projects table query — bump priority to 0.9 for focus projects
        // (they rank higher because we actively market them)
        const existingIdx = urls.findIndex(
          (u) => u.url.includes(fp.listing_url_slug)
        );
        if (existingIdx >= 0) urls[existingIdx].priority = 0.9;
        return;
      }
      // Portfolio-only project (no dedicated listing page) — highest priority
      urls.push({
        url: `${baseUrl}/portfolio/${fp.project_slug}`,
        lastModified: fp.updated_at ? new Date(fp.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
      });
    });

    // Always include the /portfolio index at high priority
    const portfolioIdx = urls.findIndex((u) => u.url === `${baseUrl}/portfolio`);
    if (portfolioIdx >= 0) {
      urls[portfolioIdx].priority = 0.9;
    }

    // Non-focus advisory projects (not in focus portfolio) — generate city project URLs
    // only if not already covered by the main projects table
    const advisoryProjectSlugs = await getAllAdvisoryProjectSlugs();
    advisoryProjectSlugs.forEach(({ citySlug, projectSlug }) => {
      const key = `${citySlug}/${projectSlug}`;
      if (!listingProjectSet.has(key)) {
        // Check if this is a focus project (already handled above) — skip if so
        const isFocus = (focusProjects ?? []).some(
          (fp: any) => fp.project_slug === projectSlug && fp.city_slug === citySlug
        );
        if (!isFocus) {
          urls.push({
            url: buildProjectAbsoluteUrl(citySlug, projectSlug),
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
    });

    // Landing Pages
    landingPagesResult.data?.forEach((lp) => {
      urls.push({
        url: `${baseUrl}/landing/${lp.uri}`,
        lastModified: lp.updated_at ? new Date(lp.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
      });
    });

    // Blog articles (rendered at /insights/[slug])
    blogsResult.data?.forEach((b) => {
      urls.push({
        url: `${baseUrl}/insights/${b.slug}`,
        lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    });

    // News articles (generated_articles table, rendered at /news-articles/[slug])
    newsArticlesResult.data?.forEach((a) => {
      urls.push({
        url: `${baseUrl}/news-articles/${a.slug}`,
        lastModified: a.updated_at ? new Date(a.updated_at) : a.published_at ? new Date(a.published_at) : new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
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

    // Note: /residential-intelligence/ URLs are excluded from sitemap — blocked in robots.txt
    // to prevent duplicate content competing with canonical /{citySlug}/projects/{slug} URLs.

    return urls;
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return at least the base URL on error
    return [{ url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 }];
  }
}