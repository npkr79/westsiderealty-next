import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { projectService } from "@/services/projectService";
import { projectInsightsService } from "@/services/projectInsightsService";
import { optimizeSupabaseImage, getHeroImageUrl } from "@/utils/imageOptimization";
import { buildProjectAbsoluteUrl, buildProjectUrl } from "@/lib/routes";
import ProjectDetailsPageContent from "@/components/project-details/ProjectDetailsPageContent";
import type { ListingIntent } from "@/components/project-details/ProjectIntentSelector";
import { Skeleton } from "@/components/ui/skeleton";

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

    const project = await projectService.getCityLevelProjectBySlug(citySlug, projectSlug);

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
    const resolvedCity = await projectService.findProjectCityBySlug(projectSlug);
    if (resolvedCity && resolvedCity !== citySlug) {
      redirect(buildProjectUrl(resolvedCity, projectSlug));
    }
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-[340px] w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-8">
            <div className="space-y-6">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  let brochureUrl: string | null = null;
  try {
    const { findBrochureByProjectName } = await import('@/services/brochureService');
    brochureUrl = await findBrochureByProjectName(project.project_name);
  } catch {
    brochureUrl = null;
  }

  const context = projectService.buildProjectPageContext(project, citySlug, projectSlug);
  const insights = await projectInsightsService.getProjectInsights(project);
  const cookieStore = await cookies();
  const rawIntent = cookieStore.get("listing_intent")?.value;
  const userIntent: ListingIntent =
    rawIntent === "investment" || rawIntent === "end-use" || rawIntent === "upgrade" || rawIntent === "nri"
      ? rawIntent
      : "end-use";
  return (
    <ProjectDetailsPageContent
      citySlug={citySlug}
      projectSlug={projectSlug}
      project={project}
      insights={insights}
      context={context}
      brochureUrl={brochureUrl}
      userIntent={userIntent}
    />
  );
}

// Revalidate every 60 seconds to allow database changes to reflect quickly
export const revalidate = 60;
