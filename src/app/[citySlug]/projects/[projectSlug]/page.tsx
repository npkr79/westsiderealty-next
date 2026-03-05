import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { projectService } from "@/services/projectService";
import { projectInsightsService } from "@/services/projectInsightsService";
import { optimizeSupabaseImage, getHeroImageUrl } from "@/utils/imageOptimization";
import { buildProjectAbsoluteUrl, buildProjectUrl } from "@/lib/routes";
import ProjectPageV2 from "@/components/project-details/ProjectPageV2";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ citySlug: string | string[]; projectSlug: string | string[] }>;
}

// Generate all project URLs at build time
// Note: This is for static generation. Dynamic routes will still work at runtime even if not listed here.
export async function generateStaticParams() {
  const { createBuildClient } = await import('@/lib/supabase/buildClient');
  const supabase = createBuildClient();
  
  // Get all projects (including unpublished ones) to ensure newly added projects are included
  // The page component will handle filtering/publishing logic
  // Use auto-detected relationship syntax for consistency with getCityLevelProjectBySlug
  const { data: projects } = await supabase
    .from("projects")
    .select("url_slug, city:cities(url_slug), micro_market:micro_markets(url_slug)")
    .limit(2000); // Increased limit to include more projects

  if (!projects) return [];

  return projects
    .filter((p: any) => {
      // Handle city relation - can be object or array
      const city = Array.isArray(p.city) ? p.city[0] : p.city;
      return city?.url_slug && p.url_slug;
    })
    .map((p: any) => {
      // Handle city relation - can be object or array
      const city = Array.isArray(p.city) ? p.city[0] : p.city;
      return {
        citySlug: city.url_slug,
        projectSlug: p.url_slug,
      };
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
      return { title: "Project Not Found" };
    }

    const canonicalUrl = buildProjectAbsoluteUrl(citySlug, projectSlug);
    const cityName = project.city?.city_name || citySlug;
    const seoTitle = project.seo_title || `${project.project_name} ${cityName}: Price, Floor Plans & Reviews | RE/MAX`;
    const seoDescription = project.meta_description || `Explore ${project.project_name} - Premium residential project in ${cityName}`;

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

    return {
      title: seoTitle,
      description: seoDescription,
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

  if (!citySlug || !projectSlug) {
    notFound();
  }

  let project = await projectService.getCityLevelProjectBySlug(citySlug, projectSlug);

  if (!project) {
    // Try the legacy projects table as fallback (slugs that aren't in the enriched MV yet)
    project = await projectService.getOldProjectBySlug(citySlug, projectSlug);
  }

  if (!project) {
    // Check if the project exists under a different city slug and redirect
    const resolvedCity = await projectService.findProjectCityBySlug(projectSlug);
    if (resolvedCity && resolvedCity !== citySlug) {
      redirect(buildProjectUrl(resolvedCity, projectSlug));
    }
    notFound();
  }

  // Fetch developer RERA projects in parallel with other data
  const developerName = project.developer?.developer_name || project.developer_name || (project as any).developer_name || null;
  const projectId = project.id || (project as any).project_id || null;
  const microMarketId = (project as any).micro_market_id || (project.micro_market as any)?.id || null;
  const cityId = (project as any).city_id || (project.city as any)?.id || null;
  const currentMicroMarketSlug = project.micro_market?.url_slug || null;

  const [brochureResult, insightsResult, developerProjectsResult, liveIntelligenceResult, microMarketDetailResult, relatedProjectsResult, nearbyMarketsResult, configDistributionResult, developerBrandSlugResult] = await Promise.allSettled([
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
    // Fetch developer brand (name + slug) via project→brand map
    (async () => {
      if (!projectId) return null;
      try {
        const supabase = createServiceClient();
        const { data } = await supabase
          .from("developer_project_brand_map")
          .select("brand_id, developer_brands(brand_name, url_slug)")
          .eq("project_id", projectId)
          .limit(1)
          .maybeSingle();
        const brand = (data as any)?.developer_brands;
        if (!brand) return null;
        return { brandName: brand.brand_name ?? null, brandSlug: brand.url_slug ?? null };
      } catch {
        return null;
      }
    })(),
  ]);

  const insights = insightsResult.status === "fulfilled" ? insightsResult.value : await projectInsightsService.getProjectInsights(project);
  const developerProjects = developerProjectsResult.status === "fulfilled" ? (developerProjectsResult.value as any[]) : [];
  const liveIntelligence = liveIntelligenceResult.status === "fulfilled" ? liveIntelligenceResult.value : null;
  const microMarketDetail = microMarketDetailResult.status === "fulfilled" ? (microMarketDetailResult.value as any) : null;
  const relatedProjects = relatedProjectsResult.status === "fulfilled" ? (relatedProjectsResult.value as any[]) : [];
  const nearbyMarkets = nearbyMarketsResult.status === "fulfilled" ? (nearbyMarketsResult.value as any[]) : [];
  const configDistribution = configDistributionResult.status === "fulfilled" ? (configDistributionResult.value as any[]) : [];
  const developerBrandResult = developerBrandSlugResult.status === "fulfilled" ? (developerBrandSlugResult.value as { brandName: string | null; brandSlug: string | null } | null) : null;
  const developerBrandSlug = developerBrandResult?.brandSlug ?? null;
  const developerBrandName = developerBrandResult?.brandName ?? null;

  const context = projectService.buildProjectPageContext(project, citySlug, projectSlug);
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
      developerBrandSlug={developerBrandSlug}
      developerBrandName={developerBrandName}
    />
  );
}

// Revalidate every 60 seconds to allow database changes to reflect quickly
export const revalidate = 60;
