import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { projectService, ProjectWithRelations } from "@/services/projectService";
import { findBrochureByProjectName } from "@/services/brochureService";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import Layout from "@/components/layout/Layout";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import CityHubBacklink from "@/components/seo/CityHubBacklink";
import ProjectSEO from "@/components/project-details/ProjectSEO";
import ProjectHeroGallery from "@/components/project-details/ProjectHeroGallery";
import ProjectOverviewSection from "@/components/project-details/ProjectOverviewSection";
import ProjectPriceTable from "@/components/project-details/ProjectPriceTable";
import ProjectFloorPlans from "@/components/project-details/ProjectFloorPlans";
import ProjectSpecifications from "@/components/project-details/ProjectSpecifications";
import ProjectAmenities from "@/components/project-details/ProjectAmenities";
import ProjectLocation from "@/components/project-details/ProjectLocation";
import ProjectNearbyPlaces from "@/components/project-details/ProjectNearbyPlaces";
import AboutDeveloperSection from "@/components/project-details/AboutDeveloperSection";
import AboutMicroMarketSection from "@/components/project-details/AboutMicroMarketSection";
import RelatedProjectsSection from "@/components/project-details/RelatedProjectsSection";
import ProjectFAQSection from "@/components/project-details/ProjectFAQSection";
import ProjectInvestmentAnalysis from "@/components/project-details/ProjectInvestmentAnalysis";
import ProjectExpertReview from "@/components/project-details/ProjectExpertReview";
import ProjectRERATimeline from "@/components/project-details/ProjectRERATimeline";
import TrustStrip from "@/components/project-details/TrustStrip";
import LocationHighlightsCard from "@/components/project-details/LocationHighlightsCard";
import BottomLeadFormSection from "@/components/project-details/BottomLeadFormSection";
import { getProjectImageUrls } from "@/lib/project-images";
import ProjectDetailClientActions from "./ProjectDetailClientActions";
import DebugClient from "./DebugClient";

interface PageProps {
  params: Promise<{ citySlug: string | string[]; projectSlug: string | string[] }>;
}

// Generate all project URLs at build time
export async function generateStaticParams() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("url_slug, city:cities(url_slug), micro_market:micro_markets(url_slug)")
    .eq("is_published", true)
    .eq("page_status", "published")
    .limit(1000); // Limit to prevent build timeout

  if (!projects) return [];

  return projects
    .filter((p: any) => p.city?.url_slug && p.url_slug)
    .map((p: any) => ({
      citySlug: p.city.url_slug,
      projectSlug: p.url_slug,
    }));
}

// Generate metadata server-side
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citySlug: citySlugParam, projectSlug: projectSlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const projectSlug = Array.isArray(projectSlugParam) ? projectSlugParam[0] : projectSlugParam;

  if (!citySlug || !projectSlug) {
    return {
      title: "Project Not Found",
    };
  }

  const project = await projectService.getCityLevelProjectBySlug(citySlug, projectSlug);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  const microMarketSlug = project.micro_market?.url_slug;
  const canonicalUrl = microMarketSlug
    ? `https://www.westsiderealty.in/${citySlug}/${microMarketSlug}/projects/${projectSlug}`
    : `https://www.westsiderealty.in/${citySlug}/projects/${projectSlug}`;

  return buildMetadata({
    title:
      project.seo_title ||
      `${project.project_name} | Price, Floor Plans & Details | RE/MAX Westside Realty`,
    description: project.meta_description || `Explore ${project.project_name} - Premium residential project`,
    canonicalUrl,
    imageUrl: project.hero_image_url || undefined,
    type: "website",
  });
}

export default async function ProjectDetailPage({ params }: PageProps) {
  // Log on server-side (check your terminal/server logs)
  console.log('[ProjectDetailPage] 🚀 Page component started');
  
  const { citySlug: citySlugParam, projectSlug: projectSlugParam } = await params;
  
  // Normalize params from string | string[] to string
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const projectSlug = Array.isArray(projectSlugParam) ? projectSlugParam[0] : projectSlugParam;

  console.log('[ProjectDetailPage] 📝 Normalized params:', { citySlug, projectSlug });

  if (!citySlug || !projectSlug) {
    console.error('[ProjectDetailPage] ❌ Missing required params');
    notFound();
  }

  // Fetch project data on the server
  let project: ProjectWithRelations | null = null;
  let brochureUrl: string | null = null;

  try {
    console.log(`[ProjectDetailPage] Fetching project: citySlug=${citySlug}, projectSlug=${projectSlug}`);
    project = await projectService.getCityLevelProjectBySlug(citySlug, projectSlug);
    
    if (!project) {
      console.error(`[ProjectDetailPage] Project not found: citySlug=${citySlug}, projectSlug=${projectSlug}`);
      notFound();
    }

    console.log(`[ProjectDetailPage] ✅ Project found: ${project.project_name}`);

    // Fetch brochure (non-blocking)
    try {
      brochureUrl = await findBrochureByProjectName(project.project_name);
    } catch (err) {
      // Ignore brochure errors
      console.warn(`[ProjectDetailPage] Brochure not found for: ${project.project_name}`);
    }
  } catch (error) {
    console.error("[ProjectDetailPage] ❌ Error fetching project:", error);
    console.error("[ProjectDetailPage] Error details:", JSON.stringify(error, null, 2));
    throw error; // Let error boundary catch it
  }

  const microMarketSlug = project.micro_market?.url_slug;
  const landmarks = Array.isArray((project as any).landmarks_json)
    ? (project as any).landmarks_json
    : [];

  // Ensure project has required fields
  if (!project.project_name) {
    console.error("Project missing required field: project_name");
    notFound();
  }

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: project.city?.city_name || citySlug, href: `/${citySlug}` },
    ...(microMarketSlug
      ? [{ name: project.micro_market?.micro_market_name || microMarketSlug, href: `/${citySlug}/${microMarketSlug}` }]
      : []),
    { name: "Projects", href: `/${citySlug}/projects` },
    { name: project.project_name, href: `/${citySlug}/projects/${projectSlug}` },
  ];

  // Real Estate Listing Schema for SEO
  const realEstateSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: project.project_name,
    description: project.meta_description || `Premium residential project in ${project.city?.city_name || citySlug}`,
    image: project.hero_image_url,
    url: `https://www.westsiderealty.in/${citySlug}${microMarketSlug ? `/${microMarketSlug}` : ""}/projects/${projectSlug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: project.city?.city_name || citySlug,
      addressRegion: project.micro_market?.micro_market_name || "",
      addressCountry: "IN",
    },
    ...(project.price_range_text && {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "INR",
        priceRange: project.price_range_text,
      },
    }),
  };

  // Debug: Log image data in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[ProjectDetailPage] Image data:', {
      hero_image_url: project.hero_image_url,
      gallery_images_json: (project as any).gallery_images_json,
      gallery_images: (project as any).gallery_images,
      images: (project as any).images,
      extracted: getProjectImageUrls(project)
    });
  }

  return (
    <Layout>
      <DebugClient citySlug={citySlug} projectSlug={projectSlug} />
      <JsonLd data={realEstateSchema} />
      <Breadcrumbs items={breadcrumbItems} />
      <ProjectSEO project={project} citySlug={citySlug} projectSlug={projectSlug} />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4">
          <BreadcrumbNav items={breadcrumbItems.map(item => ({ label: item.name, href: item.href }))} />
        </div>

        {/* Hero Gallery */}
        <ProjectHeroGallery
          projectName={project.project_name || "Project"}
          images={getProjectImageUrls(project) || []}
        />

        {/* Client Actions Component - handles all interactive elements */}
        <ProjectDetailClientActions
          projectName={project.project_name}
          brochureUrl={brochureUrl || undefined}
          project={project}
          citySlug={citySlug}
        />

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto space-y-12">
            {/* Trust Strip */}
            <TrustStrip />

            {/* Project Overview */}
            <ProjectOverviewSection
              reraId={(project as any).rera_id}
              possessionDate={(project as any).possession_date_text || (project as any).rera_possession_date}
              status={(project as any).completion_status}
              description={(project as any).long_description_html || (project as any).project_overview_seo || project.meta_description}
              highlights={(project as any).project_snapshot_json}
            />

            {/* Price Table */}
            {(project as any).project_snapshot_json && (
              <ProjectPriceTable
                projectSnapshotJson={(project as any).project_snapshot_json}
              />
            )}

            {/* Floor Plans */}
            {(project as any).floor_plan_images && Array.isArray((project as any).floor_plan_images) && (project as any).floor_plan_images.length > 0 && (
              <ProjectFloorPlans
                floorPlanImages={(project as any).floor_plan_images}
              />
            )}

            {/* Specifications */}
            <ProjectSpecifications
              specifications={(project as any).specifications_json}
            />

            {/* Amenities */}
            {(project as any).amenities_json && (
              <ProjectAmenities
                amenities={(project as any).amenities_json}
              />
            )}

            {/* Location */}
            <ProjectLocation
              googleMapsUrl={(project as any).google_maps_url}
              googleMapsEmbedUrl={(project as any).google_maps_embed_url}
              landmarks={landmarks}
              microMarketName={project.micro_market?.micro_market_name}
              cityName={project.city?.city_name}
              latitude={project.latitude}
              longitude={project.longitude}
            />

            {/* Location Highlights */}
            {landmarks.length > 0 && (
              <LocationHighlightsCard
                highlights={landmarks.map((l: any) => l.name || l.title || l).filter(Boolean)}
              />
            )}

            {/* Nearby Places */}
            {landmarks.length > 0 && (
              <ProjectNearbyPlaces landmarks={landmarks} />
            )}

            {/* About Developer */}
            {project.developer && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  About {project.developer.developer_name}
                </h2>
                <AboutDeveloperSection
                  developerName={project.developer.developer_name}
                  citySlug={citySlug}
                  developerSlug={project.developer.url_slug}
                  logoUrl={project.developer.logo_url}
                  tagline={project.developer.tagline}
                  yearsInBusiness={project.developer.years_in_business}
                  totalProjects={project.developer.total_projects}
                  totalSftDelivered={(project.developer as any).total_sft_delivered}
                  description={(project.developer as any).developer_profile_seo || project.developer.meta_description}
                  notableProjects={
                    project.developer.notable_projects_json && 
                    Array.isArray(project.developer.notable_projects_json) && 
                    project.developer.notable_projects_json.length > 0
                      ? project.developer.notable_projects_json
                          .map((p: any) => typeof p === 'string' ? p : p?.project_name)
                          .filter(Boolean)
                          .join(', ')
                      : null
                  }
                />
              </section>
            )}

            {/* About Micro Market */}
            {project.micro_market && citySlug && (
              <section>
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                  Micro-Market Context: {project.micro_market.micro_market_name}
                </h3>
                <AboutMicroMarketSection
                  microMarketName={project.micro_market.micro_market_name}
                  citySlug={citySlug}
                  microMarketSlug={project.micro_market.url_slug}
                  heroHook={project.micro_market.hero_hook}
                  growthStory={project.micro_market.growth_story}
                  pricePerSqftMin={project.micro_market.price_per_sqft_min}
                  pricePerSqftMax={project.micro_market.price_per_sqft_max}
                  appreciationRate={project.micro_market.annual_appreciation_min}
                />
              </section>
            )}

            {/* RERA & Construction Status */}
            <ProjectRERATimeline
              reraId={(project as any).rera_id}
              reraLink={(project as any).rera_link}
              possessionDate={(project as any).possession_date_text || (project as any).rera_possession_date}
              constructionTimeline={(project as any).construction_timeline_json}
            />

            {/* Investment Analysis */}
            {(project as any).investment_analysis_json && (
              <section>
                <ProjectInvestmentAnalysis
                  investmentData={(project as any).investment_analysis_json}
                  projectName={project.project_name}
                />
              </section>
            )}

            {/* FAQs */}
            {(project as any).faqs_json &&
              Array.isArray((project as any).faqs_json) &&
              (project as any).faqs_json.length > 0 && (
                <ProjectFAQSection
                  faqs={(project as any).faqs_json}
                  projectName={project.project_name}
                />
              )}

            {/* Expert Review */}
            {(project as any).expert_review_json && (
              <ProjectExpertReview
                review={(project as any).expert_review_json}
                projectName={project.project_name}
              />
            )}

            {/* Related Projects */}
            {citySlug && project.id && (
              <RelatedProjectsSection
                citySlug={citySlug}
                currentProjectId={String(project.id)}
                microMarketId={project.micro_market_id ? String(project.micro_market_id) : undefined}
                developerId={project.developer_id ? String(project.developer_id) : undefined}
              />
            )}

            {/* Bottom Lead Form */}
            <BottomLeadFormSection
              projectName={project.project_name}
              projectId={project.id}
              developerName={project.developer?.developer_name}
              brochureUrl={brochureUrl || undefined}
            />
          </div>
        </div>

        <CityHubBacklink />
      </div>
    </Layout>
  );
}

// Revalidate every 24 hours
export const revalidate = 86400;
