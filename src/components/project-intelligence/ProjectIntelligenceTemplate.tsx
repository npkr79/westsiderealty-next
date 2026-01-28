import { ProjectWithRelations } from "@/services/projectService";
import type { ProjectIntelligenceResult } from "@/services/projectIntelligenceService";
import { getHeroImageUrl } from "@/utils/imageOptimization";
import { parseJsonb, asArray } from "@/lib/parse-jsonb";
import { safeJsonParse } from "@/lib/project-utils";
import ProjectHeroImage from "@/components/project-details/ProjectHeroImage";
import ProjectStickySidebar from "@/components/project-details/ProjectStickySidebar";
import ProjectMobileActions from "@/components/project-details/ProjectMobileActions";
import ProjectLeadForm from "@/components/project-details/ProjectLeadForm";
import ProjectDescription from "@/components/project-details/ProjectDescription";
import ProjectHighlights from "@/components/project-details/ProjectHighlights";
import SimilarProjects from "@/components/project-details/SimilarProjects";
import ProjectFAQs from "@/components/project-details/ProjectFAQs";
import ProjectDNASection from "@/components/project-dna/ProjectDNASection";
import ReraIntelligenceSnapshot from "./ReraIntelligenceSnapshot";
import DeveloperIntelligenceSection from "./DeveloperIntelligenceSection";
import MicroMarketIntelligenceSection from "./MicroMarketIntelligenceSection";
import OfficialReraSection from "./OfficialReraSection";

interface ProjectIntelligenceTemplateProps {
  project: ProjectWithRelations;
  intelligenceData: ProjectIntelligenceResult | null;
}

export default async function ProjectIntelligenceTemplate({
  project,
  intelligenceData,
}: ProjectIntelligenceTemplateProps) {
  let brochureUrl: string | null = null;
  try {
    const { findBrochureByProjectName } = await import("@/services/brochureService");
    brochureUrl = await findBrochureByProjectName(project.project_name);
  } catch (err) {
    console.warn(`[ProjectIntelligenceTemplate] Brochure not found for: ${project.project_name}`);
  }

  const developer = project.developer ?? null;
  const microMarket = project.micro_market ?? null;
  const cityData = Array.isArray(project.city) ? project.city[0] : project.city;
  const citySlug = cityData?.url_slug ?? null;
  const microMarketSlug = microMarket?.url_slug ?? null;

  const addressParts = [
    microMarket?.micro_market_name,
    cityData?.city_name,
  ].filter(Boolean);
  const address = addressParts.join(", ");

  const projectHighlights: any = parseJsonb((project as any).project_highlights, null);
  const faqs = safeJsonParse((project as any).faqs_json, []);

  const galleryImagesJson = asArray<string | { url?: string; image_url?: string; src?: string }>(
    parseJsonb((project as any).gallery_images_json, [])
  );
  const galleryImages: string[] = galleryImagesJson
    .map((item) => {
      if (typeof item === "string") return item;
      return item?.url || item?.image_url || item?.src || "";
    })
    .filter((u) => typeof u === "string" && u.trim() !== "");

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content - Two Column Layout */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-8">
          {/* Left Column - Scrollable Content (65%) */}
          <div className="space-y-8">
            {/* 1. Hero Image + Gallery */}
            <ProjectHeroImage
              heroImageUrl={project.hero_image_url ? getHeroImageUrl(project.hero_image_url) : null}
              galleryImages={
                project.hero_image_url
                  ? [getHeroImageUrl(project.hero_image_url), ...galleryImages]
                  : galleryImages
              }
            />

            {/* 2. Project Description */}
            <ProjectDescription htmlContent={(project as any).long_description_html} />

            {/* 2.5. Project Highlights */}
            {projectHighlights && <ProjectHighlights highlights={projectHighlights} />}

            {/* Intelligence Layer */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Project Intelligence</h2>
              <div className="mt-6 space-y-6">
                <ReraIntelligenceSnapshot intelligenceData={intelligenceData} />
                <ProjectDNASection intelligenceData={intelligenceData} />
              </div>
            </section>

            {/* Post-content */}
            <ProjectFAQs faqs={faqs} projectName={project.project_name} />

            {citySlug && project.id && (
              <SimilarProjects
                currentProjectId={String(project.id)}
                microMarketId={project.micro_market_id}
                priceMin={(project as any).price_min}
                priceMax={(project as any).price_max}
                citySlug={citySlug}
                microMarketSlug={microMarketSlug || undefined}
              />
            )}
          </div>

          {/* Right Column - Sticky Sidebar (35%) - Desktop Only */}
          <div className="hidden lg:block">
            <ProjectStickySidebar
              projectName={project.project_name}
              projectId={project.id}
              address={address}
              bhkConfig={(project as any).bhk_config}
              carpetArea={(project as any).carpet_area}
              possessionDate={(project as any).possession_date || (project as any).possession_date_text}
              propertyType={(project as any).property_type || (project as any).property_types}
              propertyTypes={(project as any).property_types}
              priceMin={(project as any).price_min}
              priceMax={(project as any).price_max}
              priceRangeText={project.price_range_text}
              reraNumber={(project as any).rera_number || (project as any).rera_id}
              developerName={developer?.developer_name}
              developerLogo={developer?.logo_url}
              brochureUrl={brochureUrl || undefined}
            />
          </div>

          {/* Mobile-only: Lead Form at bottom */}
          <div className="lg:hidden mt-8">
            <ProjectLeadForm
              projectName={project.project_name}
              projectId={project.id}
              developerName={developer?.developer_name ?? undefined}
              developerLogo={developer?.logo_url}
              brochureUrl={brochureUrl || undefined}
            />
          </div>
        </div>
      </div>

      {/* Mobile Sticky Actions */}
      <ProjectMobileActions
        projectName={project.project_name}
      />
    </div>
  );
}
