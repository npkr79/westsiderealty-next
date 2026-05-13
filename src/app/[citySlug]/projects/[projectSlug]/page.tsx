import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { projectService, fetchAdvisorProjectEnrichment } from "@/services/projectService";
import type { AdvisorProjectEnrichment } from "@/services/projectService";
import { projectInsightsService } from "@/services/projectInsightsService";
import { optimizeSupabaseImage, getHeroImageUrl } from "@/utils/imageOptimization";
import { buildProjectAbsoluteUrl, buildProjectUrl } from "@/lib/routes";
import ProjectPageV2 from "@/components/project-details/ProjectPageV2";
import ProjectPageRedesign from "@/components/project-details/ProjectPageRedesign";
import AdvisoryProjectPage from "@/components/project-details/AdvisoryProjectPage";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { JsonLd } from "@/components/common/SEO";
import { generateProjectFaq } from "@/data/seo/project-faqs";
import {
  getAdvisoryProjectBySlug,
  getAllAdvisoryProjectSlugs,
  getAdvisoryProjectsByMarket,
  formatSegment,
  formatStatus,
  formatProjectType,
} from "@/services/advisoryProjectService";


interface PageProps {
  params: Promise<{ citySlug: string | string[]; projectSlug: string | string[] }>;
}

// ISR: pages revalidate every hour. Unknown slugs are rendered on-demand (dynamicParams=true default).
// Only pre-build a small set of high-priority pages at deploy time — everything else renders on first visit.
export const revalidate = 3600;

export async function generateStaticParams() {
  const { createBuildClient } = await import('@/lib/supabase/buildClient');
  const supabase = createBuildClient();

  // Pre-build only top 50 projects — all others render on first visit via ISR
  const { data: projects } = await supabase
    .from("projects")
    .select("url_slug, city:cities(url_slug)")
    .not("url_slug", "is", null)
    .limit(50);

  return (projects ?? [])
    .filter((p: any) => {
      const city = Array.isArray(p.city) ? p.city[0] : p.city;
      return city?.url_slug && p.url_slug;
    })
    .map((p: any) => {
      const city = Array.isArray(p.city) ? p.city[0] : p.city;
      return { citySlug: city.url_slug, projectSlug: p.url_slug };
    });
}

// Generate metadata server-side
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { citySlug: citySlugParam, projectSlug: projectSlugParam } = await params;
    const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
    const projectSlug = Array.isArray(projectSlugParam) ? projectSlugParam[0] : projectSlugParam;

    if (!citySlug || !projectSlug) {
      return { title: "Project Not Found" };
    }

    let project = await projectService.getCityLevelProjectBySlug(citySlug, projectSlug);
    if (!project) {
      project = await projectService.getOldProjectBySlug(citySlug, projectSlug);
    }

    if (!project) {
      // Fallback: check advisory table (e.g. Goa projects)
      const advisory = await getAdvisoryProjectBySlug(citySlug, projectSlug);
      if (advisory) {
        const canonicalUrl = buildProjectAbsoluteUrl(citySlug, projectSlug);
        const cityName = advisory.city
          ? advisory.city.charAt(0).toUpperCase() + advisory.city.slice(1)
          : citySlug;
        const market = advisory.micro_market || "";
        const priceStr =
          advisory.current_price_per_sqft_min
            ? ` From ₹${Number(advisory.current_price_per_sqft_min).toLocaleString("en-IN")}/sqft`
            : "";
        const typeLabel = formatProjectType(advisory.project_type);
        const segmentLabel = formatSegment(advisory.project_segment);
        const statusLabel = formatStatus(advisory.current_status);

        // Title: project name + location + price signal (max 60 chars)
        const titleBase = `${advisory.project_name}${market ? ", " + market : ""}`;
        const titleWithPrice = priceStr ? `${titleBase} |${priceStr}` : `${titleBase} | Price & Reviews`;
        const seoTitle = titleWithPrice.length <= 60 ? titleWithPrice : titleBase.length <= 60 ? titleBase : titleBase.substring(0, 57) + "...";

        // Description: specifics + CTA (max 155 chars)
        const devStr = advisory.developer_brand ? ` by ${advisory.developer_brand}` : "";
        const typeStr = [segmentLabel, typeLabel].filter(Boolean).join(" ");
        const seoDescription = `${advisory.project_name}${devStr} — ${typeStr || "project"} in ${market || cityName}.${priceStr ? priceStr + "." : ""} RERA verified. Get floor plans, reviews & expert advice today.`.substring(0, 155);

        return {
          title: seoTitle,
          description: seoDescription,
          keywords: [
            advisory.project_name,
            market && `${advisory.project_name} ${market}`,
            market && `${market} real estate`,
            advisory.developer_brand && `${advisory.developer_brand} Goa`,
            `RERA verified projects ${market || cityName}`,
            `buy ${typeLabel || "property"} ${market || cityName}`,
            `Goa real estate investment`,
          ]
            .filter(Boolean)
            .join(", "),
          alternates: { canonical: canonicalUrl },
          openGraph: {
            title: seoTitle,
            description: seoDescription,
            url: canonicalUrl,
            siteName: "RE/MAX Westside Realty",
            type: "website",
            locale: "en_IN",
          },
          twitter: {
            card: "summary_large_image",
            title: seoTitle,
            description: seoDescription,
          },
        };
      }
      return { title: "Project Not Found" };
    }

    const canonicalUrl = buildProjectAbsoluteUrl(citySlug, projectSlug);
    const cityName = project.city?.city_name || citySlug;

    // Helper: normalise ALL-CAPS RERA project names to title case
    const formatName = (name: string) =>
      name
        .replace(/\b\w+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
        .replace(/\b(Bhk|Rk|Ii|Iii|Iv)\b/gi, (m) => m.toUpperCase());

    const cleanName = formatName(project.project_name || "Project");
    const microMarket = project.micro_market?.micro_market_name || "";

    // Build a compact price string if available (fields exist at runtime but aren't in the interface)
    const minPrice = (project as any).min_price as number | null | undefined;
    const maxPrice = (project as any).max_price as number | null | undefined;
    let priceStr = "";
    if (minPrice && minPrice > 0) {
      const formatCr = (v: number) => {
        const cr = v / 10_000_000;
        return cr >= 1 ? `₹${cr.toFixed(cr % 1 === 0 ? 0 : 1)} Cr` : `₹${(v / 100_000).toFixed(0)} L`;
      };
      priceStr =
        maxPrice && maxPrice > minPrice
          ? `${formatCr(minPrice)}–${formatCr(maxPrice)}`
          : `From ${formatCr(minPrice)}`;
    }

    // Gather additional signals for richer metadata
    const totalUnits = (project as any).total_units as number | null | undefined;
    const currentStatus = (project as any).current_status as string | null | undefined;
    const configDisplay = (project as any).configuration_display as string | null | undefined;
    const reraId = (project as any).rera_id as string | null | undefined;

    // --- SEO Title (max 60 chars) ---
    // Pattern: "ProjectName, Location | ₹Price" or "ProjectName, Location | Status"
    // This mirrors how users search: "rajapushpa atria kokapet", "aparna cyberscape", "krinss villas"
    const buildTitle = (): string => {
      const locationStr = microMarket || cityName;
      const nameLocation = `${cleanName}, ${locationStr}`;

      // Priority 1: Name + Location + Price (most click-worthy)
      if (priceStr) {
        const candidate = `${nameLocation} | ${priceStr}`;
        if (candidate.length <= 60) return candidate;
        // Try without location
        const shorter = `${cleanName} | ${priceStr}`;
        if (shorter.length <= 60) return shorter;
      }

      // Priority 2: Name + Location + Config (e.g., "2, 3 BHK")
      if (configDisplay) {
        const candidate = `${cleanName}, ${locationStr} | ${configDisplay}`;
        if (candidate.length <= 60) return candidate;
      }

      // Priority 3: Name + Location + "Price & Reviews"
      const withCTA = `${nameLocation} | Price & Reviews`;
      if (withCTA.length <= 60) return withCTA;

      // Priority 4: Name + Location only
      if (nameLocation.length <= 60) return nameLocation;

      // Fallback
      return cleanName.substring(0, 60);
    };

    const seoTitle = project.seo_title || buildTitle();

    // --- SEO Description (max 155 chars) ---
    // Pattern mirrors real queries: project name + location + developer + price + RERA + CTA
    const buildDescription = (): string => {
      const locationStr = microMarket || cityName;
      const devStr = project.developer_name ? ` by ${project.developer_name}` : "";
      const pricePhrase = priceStr ? ` Price: ${priceStr}.` : "";
      const reraPhrase = reraId ? " RERA verified." : "";
      const configPhrase = configDisplay ? ` ${configDisplay} units.` : "";

      // Build description with most important signals first
      const candidate = `${cleanName}${devStr} in ${locationStr}.${pricePhrase}${configPhrase}${reraPhrase} Get floor plans, reviews & expert advice.`;

      if (candidate.length <= 155) return candidate;

      // Shorter variant without config
      const shorter = `${cleanName}${devStr} in ${locationStr}.${pricePhrase}${reraPhrase} Get floor plans, pricing & expert advice today.`;
      if (shorter.length <= 155) return shorter;

      // Minimal variant
      const minimal = `${cleanName} in ${locationStr}.${pricePhrase} RERA verified. Get pricing, reviews & book a site visit today.`;
      return minimal.substring(0, 155);
    };

    const seoDescription = project.meta_description || buildDescription();

    // Safe image URL - use getHeroImageUrl which handles relative paths
    let optimizedOgImage = "https://www.westsiderealty.in/placeholder.svg";
    try {
      if (project.hero_image_url) {
        const heroUrl = getHeroImageUrl(project.hero_image_url) || "https://www.westsiderealty.in/placeholder.svg";
        optimizedOgImage = optimizeSupabaseImage(heroUrl, {
          width: 1200,
          height: 630,
          quality: 80,
          format: "webp",
        });
      }
    } catch (imgErr) {
      console.warn("[generateMetadata] Image optimization failed:", imgErr);
    }

    const keywords = [
      cleanName,
      microMarket && `${cleanName} ${microMarket}`,
      microMarket && `${cleanName} ${microMarket} price`,
      microMarket && `${microMarket} apartments`,
      cityName && `${cleanName} ${cityName}`,
      project.developer_name && `${project.developer_name} projects`,
      configDisplay && `${configDisplay} in ${microMarket || cityName}`,
      `${cleanName} reviews`,
      `${cleanName} floor plan`,
      `RERA verified projects ${microMarket || cityName}`,
    ].filter(Boolean).join(", ");

    return {
      title: seoTitle,
      description: seoDescription,
      keywords,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        url: canonicalUrl,
        siteName: "RE/MAX Westside Realty",
        type: "website",
        locale: "en_IN",
        images: [{ url: optimizedOgImage, width: 1200, height: 630, alt: project.project_name }],
      },
      twitter: {
        card: "summary_large_image",
        title: seoTitle,
        description: seoDescription,
        images: [optimizedOgImage],
      },
    };
  } catch (err) {
    console.error("[generateMetadata] Fatal error:", err);
    return { title: "Project Details" };
  }
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { citySlug: citySlugParam, projectSlug: projectSlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const projectSlug = Array.isArray(projectSlugParam) ? projectSlugParam[0] : projectSlugParam;

  // New design is now the default for all project pages
  const useNewProjectDesign = true;

  if (!citySlug || !projectSlug) {
    notFound();
  }

  let project = await projectService.getCityLevelProjectBySlug(citySlug, projectSlug);

  if (!project) {
    // Try the legacy projects table as fallback (slugs that aren't in the enriched MV yet)
    project = await projectService.getOldProjectBySlug(citySlug, projectSlug);
  }

  // Unpublished projects (page_status = 'draft') should return 404
  if (project && (project as any).page_status === 'draft') {
    notFound();
  }

  if (!project) {
    // Check if the project exists under a different city slug and redirect
    const resolvedCity = await projectService.findProjectCityBySlug(projectSlug);
    if (resolvedCity && resolvedCity !== citySlug) {
      redirect(buildProjectUrl(resolvedCity, projectSlug));
    }

    // Fallback: render advisory project page (e.g. Goa projects in advisor_project_intelligence)
    const advisoryProject = await getAdvisoryProjectBySlug(citySlug, projectSlug);
    if (advisoryProject) {
      const relatedProjects = advisoryProject.micro_market_slug
        ? await getAdvisoryProjectsByMarket(citySlug, advisoryProject.micro_market_slug, projectSlug)
        : [];
      return (
        <AdvisoryProjectPage
          project={advisoryProject}
          relatedProjects={relatedProjects}
          citySlug={citySlug}
          projectSlug={projectSlug}
        />
      );
    }

    // Fall back to the city's projects index rather than a bare 404
    redirect(`/${citySlug}/projects`);
  }

  // Fetch developer RERA projects in parallel with other data
  const developerName = project.developer?.developer_name || project.developer_name || (project as any).developer_name || null;
  const projectId = project.id || (project as any).project_id || null;
  const microMarketId = (project as any).micro_market_id || (project.micro_market as any)?.id || null;
  const cityId = (project as any).city_id || (project.city as any)?.id || null;
  const currentMicroMarketSlug = project.micro_market?.url_slug || null;

  const [brochureResult, insightsResult, developerProjectsResult, liveIntelligenceResult, microMarketDetailResult, relatedProjectsResult, nearbyMarketsResult, configDistributionResult, otherProjectsInMarketResult, developerBrandSlugResult, advisorEnrichmentResult] = await Promise.allSettled([
    (async () => {
      try {
        const { findBrochureByProjectName } = await import('@/services/brochureService');
        return await findBrochureByProjectName(project.project_name);
      } catch {
        return null;
      }
    })(),
    projectInsightsService.getProjectInsights(project),
    (async () => {
      if (!developerName) return [];
      try {
        const supabase = createServiceClient();
        const { data } = await supabase
          .from("rera_projects")
          .select("project_name, rera_id, current_status, proposed_completion_date, url_slug, city_slug")
          .ilike("developer_name", developerName)
          .order("proposed_completion_date", { ascending: false })
          .limit(5);
        return data ?? [];
      } catch {
        return [];
      }
    })(),
    (async () => {
      try {
        const supabase = createServiceClient();
        const reraId = (project as any).rera_id as string | null;

        // Try by rera_project_id first (rows from the web-search enrichment pipeline)
        if (reraId) {
          const { data: reraRow } = await supabase
            .from("rera_projects")
            .select("id")
            .eq("rera_id", reraId)
            .maybeSingle();
          if (reraRow?.id) {
            const { data } = await supabase
              .from("project_live_intelligence")
              .select("*")
              .eq("rera_project_id", reraRow.id)
              .maybeSingle();
            if (data) return data;
          }
        }

        // Fallback: try by project_id (rows from older static enrichment)
        if (projectId) {
          const { data } = await supabase
            .from("project_live_intelligence")
            .select("*")
            .eq("project_id", projectId)
            .maybeSingle();
          if (data) return data;
        }

        return null;
      } catch {
        return null;
      }
    })(),
    // Fetch micro market detail (schools, hospitals)
    (async () => {
      if (!microMarketId) return null;
      try {
        const supabase = createServiceClient();
        const { data } = await supabase
          .from("micro_markets")
          .select("top_schools, top_hospitals")
          .eq("id", microMarketId)
          .maybeSingle();
        return data ?? null;
      } catch {
        return null;
      }
    })(),
    // Fetch related projects in same micro market
    (async () => {
      if (!microMarketId) return [];
      try {
        const supabase = createServiceClient();
        const { data } = await supabase
          .from("projects")
          .select("project_name, url_slug, city:cities(url_slug), configuration_display, total_units, current_status, price_range_text")
          .eq("micro_market_id", microMarketId)
          .neq("id", projectId ?? "")
          .order("total_units", { ascending: false })
          .limit(3);
        return data ?? [];
      } catch {
        return [];
      }
    })(),
    // Fetch nearby micro markets in same city
    (async () => {
      if (!cityId) return [];
      try {
        const supabase = createServiceClient();
        const { data } = await supabase
          .from("micro_markets")
          .select("micro_market_name, url_slug")
          .eq("city_id", cityId)
          .neq("url_slug", currentMicroMarketSlug ?? "")
          .limit(5);
        return data ?? [];
      } catch {
        return [];
      }
    })(),
    // Fetch unit configuration distribution — view's project_id = rera_projects.id
    (async () => {
      const reraId = (project as any).rera_id as string | null;
      if (!reraId) return [];
      try {
        const supabase = createServiceClient();
        const { data: reraRow } = await supabase
          .from("rera_projects")
          .select("id")
          .eq("rera_id", reraId)
          .maybeSingle();
        if (!reraRow?.id) return [];
        const { data } = await supabase
          .from("project_configuration_distribution_v2")
          .select("unit_category, total_units, config_percent")
          .eq("project_id", reraRow.id)
          .order("config_percent", { ascending: false });
        return data ?? [];
      } catch {
        return [];
      }
    })(),
    // Fetch other projects in same micro-market from enriched MV
    (async () => {
      // micro_market on the project object is the enriched object; get the name string
      const mmName = (project.micro_market as any)?.micro_market_name as string | null ?? null;
      if (!mmName) return [];
      try {
        const supabase = createServiceClient();
        const { data } = await supabase
          .from("listing_project_detail_enriched_mv")
          .select("project_name, url_slug, developer_name, total_units, proposed_completion_date, city_slug")
          .eq("micro_market", mmName)
          .neq("url_slug", projectSlug)
          .limit(3);
        return data ?? [];
      } catch {
        return [];
      }
    })(),
    // Fetch developer brand (name + slug).
    // Strategy 1: rera_id → rera_projects.id → developer_project_brand_map → developer_brands
    // Strategy 2: fuzzy match developer_name against developer_brands.brand_name
    (async () => {
      try {
        const supabase = createServiceClient();
        const reraId = (project as any).rera_id as string | null;

        // Strategy 1: via rera_projects
        if (reraId) {
          const { data: reraRow } = await supabase
            .from("rera_projects")
            .select("id")
            .eq("rera_id", reraId)
            .maybeSingle();
          if (reraRow?.id) {
            const { data } = await supabase
              .from("developer_project_brand_map")
              .select("brand_id, developer_brands(brand_name, url_slug)")
              .eq("project_id", reraRow.id)
              .limit(1)
              .maybeSingle();
            const brand = (data as any)?.developer_brands;
            if (brand?.url_slug) return { brandName: brand.brand_name ?? null, brandSlug: brand.url_slug };
          }
        }

        // Strategy 2: fuzzy match developer_name against brand_name
        const devName = developerName;
        if (!devName) return null;
        const { data: allBrands } = await supabase
          .from("developer_brands")
          .select("brand_name, url_slug");
        if (allBrands?.length) {
          const brands = allBrands as Array<{ brand_name: string; url_slug: string | null }>;
          const devLower = devName.toLowerCase();
          const words = devLower.split(/[\s-]+/);
          const twoWordPrefix = words.slice(0, 2).join(" ");
          let found = brands.find((b) => b.url_slug && b.brand_name.toLowerCase().startsWith(twoWordPrefix));
          if (!found && words[0].length >= 5) {
            found = brands.find((b) => b.url_slug && b.brand_name.toLowerCase().startsWith(words[0]));
          }
          if (found?.url_slug) return { brandName: found.brand_name, brandSlug: found.url_slug };
        }
        return null;
      } catch {
        return null;
      }
    })(),
    // Fetch advisor project enrichment (new intelligence tables)
    fetchAdvisorProjectEnrichment(projectSlug, currentMicroMarketSlug ?? undefined),
  ]);

  const insights = insightsResult.status === "fulfilled"
    ? insightsResult.value
    : await projectInsightsService.getProjectInsights(project);
  const developerProjects = developerProjectsResult.status === "fulfilled" ? (developerProjectsResult.value as any[]) : [];
  const liveIntelligence = liveIntelligenceResult.status === "fulfilled" ? liveIntelligenceResult.value : null;
  const microMarketDetail = microMarketDetailResult.status === "fulfilled" ? (microMarketDetailResult.value as any) : null;
  const relatedProjects = relatedProjectsResult.status === "fulfilled" ? (relatedProjectsResult.value as any[]) : [];
  const nearbyMarkets = nearbyMarketsResult.status === "fulfilled" ? (nearbyMarketsResult.value as any[]) : [];
  const configDistribution = configDistributionResult.status === "fulfilled" ? (configDistributionResult.value as any[]) : [];
  const otherProjectsInMarket = otherProjectsInMarketResult.status === "fulfilled" ? (otherProjectsInMarketResult.value as any[]) : [];
  const developerBrandResult = developerBrandSlugResult.status === "fulfilled" ? (developerBrandSlugResult.value as { brandName: string | null; brandSlug: string | null } | null) : null;
  const developerBrandSlug = developerBrandResult?.brandSlug ?? null;
  const developerBrandName = developerBrandResult?.brandName ?? null;
  const advisorEnrichment: AdvisorProjectEnrichment = advisorEnrichmentResult.status === "fulfilled"
    ? (advisorEnrichmentResult.value as AdvisorProjectEnrichment)
    : { project: null, configurations: [], market: null, reraUnits: [], reraBuildings: [] };

  const context = projectService.buildProjectPageContext(project, citySlug, projectSlug);

  // Build lead context for form attribution
  const isGoaCity = citySlug === "goa";
  const leadContext = {
    city: citySlug,
    projectName: project.project_name ?? "",
    projectSlug,
    propertyType: "residential" as string,
    sourceType: isGoaCity ? "goa_property" : "website_project",
    microMarket: (project.micro_market as any)?.micro_market_name ?? "",
    landingPage: `/${citySlug}/projects/${projectSlug}`,
  };

  const faqSchema = generateProjectFaq({
    name: project.project_name ?? "",
    price_min: (project as any).price_min ?? (project as any).min_price ?? null,
    price_max: (project as any).price_max ?? (project as any).max_price ?? null,
    rera_id: (project as any).rera_id ?? null,
    developer_name: project.developer?.developer_name ?? (project as any).developer_name ?? null,
    micro_market_name: project.micro_market?.micro_market_name ?? (project as any).micro_market_name ?? null,
    city_slug: citySlug,
    current_status: (project as any).current_status ?? null,
    min_area: (project as any).min_area ?? null,
    max_area: (project as any).max_area ?? null,
    amenities_json: (project as any).amenities_json ?? null,
  });

  if (useNewProjectDesign) {
    return (
      <>
        <JsonLd jsonLd={[faqSchema]} />
        <ProjectPageRedesign
          citySlug={citySlug}
          projectSlug={projectSlug}
          project={project}
          insights={insights}
          context={context}
          developerProjects={developerProjects}
          liveIntelligence={liveIntelligence}
          microMarketDetail={microMarketDetail}
          relatedProjects={relatedProjects}
          nearbyMarkets={nearbyMarkets}
          configDistribution={configDistribution}
          otherProjectsInMarket={otherProjectsInMarket}
          developerBrandSlug={developerBrandSlug}
          developerBrandName={developerBrandName}
          leadContext={leadContext}
          advisorData={advisorEnrichment}
        />
      </>
    );
  }

  return (
    <ProjectPageV2
      citySlug={citySlug}
      projectSlug={projectSlug}
      project={project}
      insights={insights}
      context={context}
      developerProjects={developerProjects}
      liveIntelligence={liveIntelligence}
      microMarketDetail={microMarketDetail}
      relatedProjects={relatedProjects}
      nearbyMarkets={nearbyMarkets}
      configDistribution={configDistribution}
      otherProjectsInMarket={otherProjectsInMarket}
      developerBrandSlug={developerBrandSlug}
      developerBrandName={developerBrandName}
      leadContext={leadContext}
      advisorData={advisorEnrichment}
    />
  );
}

            