import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { projectService, ProjectWithRelations } from "@/services/projectService";
import { findBrochureByProjectName } from "@/services/brochureService";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import { generateUnifiedSchema } from "@/lib/seo-utils";
import { optimizeSupabaseImage, getHeroImageUrl } from "@/utils/imageOptimization";
import CityHubBacklink from "@/components/seo/CityHubBacklink";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import { safeJsonParse } from "@/lib/project-utils";
import { parseJsonb, asArray } from "@/lib/parse-jsonb";
import ProjectHeroImage from "@/components/project-details/ProjectHeroImage";
import ProjectDescription from "@/components/project-details/ProjectDescription";
import TechnicalSpecsCard from "@/components/project-details/TechnicalSpecsCard";
import AmenitiesCard from "@/components/project-details/AmenitiesCard";
import SpecificationsCard from "@/components/project-details/SpecificationsCard";
import FloorPlansGallery from "@/components/project-details/FloorPlansGallery";
import GoogleMapEmbed from "@/components/project-details/GoogleMapEmbed";
import LocationAdvantages from "@/components/project-details/LocationAdvantages";
import WhyInvestSection from "@/components/project-details/WhyInvestSection";
import WestsideVerdictSection from "@/components/project-details/WestsideVerdictSection";
import ProjectFAQs from "@/components/project-details/ProjectFAQs";
import SimilarProjects from "@/components/project-details/SimilarProjects";
import ProjectStickySidebar from "@/components/project-details/ProjectStickySidebar";
import ProjectMobileActions from "@/components/project-details/ProjectMobileActions";
import ProjectStickyCard from "@/components/project-details/ProjectStickyCard";
import ProjectLeadForm from "@/components/project-details/ProjectLeadForm";
import AboutDeveloperSection from "@/components/project-details/AboutDeveloperSection";
import AboutMicroMarketSection from "@/components/project-details/AboutMicroMarketSection";
import ProjectHighlights from "@/components/project-details/ProjectHighlights";
import DebugClient from "./DebugClient";

interface PageProps {
  params: Promise<{ citySlug: string | string[]; projectSlug: string | string[] }>;
}

// Generate all project URLs at build time
// Note: This is for static generation. Dynamic routes will still work at runtime even if not listed here.
export async function generateStaticParams() {
  const supabase = await createClient();
  
  // Get all projects (including unpublished ones) to ensure newly added projects are included
  // The page component will handle filtering/publishing logic
  const { data: projects } = await supabase
    .from("projects")
    .select("url_slug, city:cities(url_slug), micro_market:micro_markets(url_slug)")
    .limit(2000); // Increased limit to include more projects

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

    const canonicalUrl = `https://www.westsiderealty.in/${citySlug}/projects/${projectSlug}`;
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
  
  // Normalize params from string | string[] to string
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const projectSlug = Array.isArray(projectSlugParam) ? projectSlugParam[0] : projectSlugParam;

  if (!citySlug || !projectSlug) {
    notFound();
  }

  // Fetch project data on the server
  const project = await projectService.getCityLevelProjectBySlug(citySlug, projectSlug);
  
  if (!project) {
    notFound();
  }

  // Fetch brochure (non-blocking)
  let brochureUrl: string | null = null;
  try {
    brochureUrl = await findBrochureByProjectName(project.project_name);
  } catch (err) {
    // Ignore brochure errors
    console.warn(`[ProjectDetailPage] Brochure not found for: ${project.project_name}`);
  }

  // Safe relation access guards
  const developer = project.developer ?? null;
  const microMarket = project.micro_market ?? null;
  const cityData = project.city ?? null;

  const cityName = cityData?.city_name || citySlug;
  const microMarketSlug = microMarket?.url_slug ?? null;
  const landmarks = Array.isArray((project as any).landmarks_json)
    ? (project as any).landmarks_json
    : [];

  // Ensure project has required fields
  if (!project.project_name) {
    console.error("Project missing required field: project_name");
    notFound();
  }

  // Derive SEO helpers for schema (mirror generateMetadata logic)
  const canonicalUrl = `https://www.westsiderealty.in/${citySlug}/projects/${projectSlug}`;
  const seoTitle =
    project.seo_title ||
    `${project.project_name} ${cityName}: Price, Floor Plans & Reviews | RE/MAX`;
  const seoDescription =
    project.meta_description ||
    `Explore ${project.project_name} - Premium residential project in ${cityName}`;

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: cityName, href: `/${citySlug}` },
    ...(microMarketSlug && microMarket
      ? [{ name: microMarket.micro_market_name || microMarketSlug, href: `/${citySlug}/${microMarketSlug}` }]
      : []),
    { name: "Projects", href: `/${citySlug}/projects` },
    { name: project.project_name, href: `/${citySlug}/projects/${projectSlug}` },
  ];

  // Extract FAQs for schema generation (parse early)
  const faqsRaw = safeJsonParse((project as any).faqs_json, []);
  const faqItems: { question: string; answer: string }[] = [];
  if (faqsRaw && Array.isArray(faqsRaw)) {
    faqsRaw.forEach((faq: any) => {
      const question = faq.question || faq.q || faq.title || '';
      const answer = faq.answer || faq.a || faq.description || faq.content || '';
      if (question && answer) {
        faqItems.push({
          question,
          answer: typeof answer === 'string' 
            ? answer.replace(/<[^>]*>/g, '') // Strip HTML tags for schema
            : String(answer),
        });
      }
    });
  }

  // Build primary entity (RealEstateListing)
  const primaryEntity: Record<string, any> = {
    "@type": "RealEstateListing",
    name: project.project_name,
    description: seoDescription,
    image: project.hero_image_url || undefined,
    url: canonicalUrl,
      address: {
        "@type": "PostalAddress",
        addressLocality: cityName,
        addressRegion: microMarket?.micro_market_name || "",
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

  // Generate unified schema
  const unifiedSchema = generateUnifiedSchema({
    pageUrl: canonicalUrl,
    title: seoTitle,
    description: seoDescription,
    heroImageUrl: project.hero_image_url || undefined,
    primaryEntityType: "RealEstateListing",
    primaryEntity,
    faqItems,
    breadcrumbs: [
      { name: "Home", item: "https://www.westsiderealty.in" },
      { name: cityName, item: `https://www.westsiderealty.in/${citySlug}` },
      ...(microMarketSlug && microMarket
        ? [{ name: microMarket.micro_market_name || microMarketSlug, item: `https://www.westsiderealty.in/${citySlug}/${microMarketSlug}` }]
        : []),
      { name: "Projects", item: `https://www.westsiderealty.in/${citySlug}/projects` },
      { name: project.project_name, item: canonicalUrl },
    ],
  });

  // Parse JSONB fields safely using helpers (handles both arrays/objects and stringified JSON)
  const technicalSpecs = parseJsonb((project as any).project_snapshot_json, []);
  const amenities = parseJsonb((project as any).amenities_json, []);
  const specifications: any = parseJsonb((project as any).specifications_json, null);
  const floorPlansRaw = asArray<any>(parseJsonb((project as any).floor_plan_images, []));
  
  // Debug: Log floor plans to help troubleshoot
  if (floorPlansRaw && floorPlansRaw.length > 0) {
    console.log(`[Project Page] Floor plans found for ${project.project_name}:`, {
      count: floorPlansRaw.length,
      firstItem: floorPlansRaw[0],
      rawType: typeof (project as any).floor_plan_images,
    });
  }
  
  const locationAdvantages: any = parseJsonb((project as any).location_advantages_json, null);
  const investmentAnalysis = parseJsonb((project as any).investment_analysis_json, {});
  const projectHighlights: any = parseJsonb((project as any).project_highlights, null);
  const faqs = faqsRaw; // Reuse the already parsed FAQs

  // Gallery images: prefer explicit gallery_images_json, fall back to other image helpers if needed
  const galleryImagesJson = asArray<string | { url?: string; image_url?: string; src?: string }>(
    parseJsonb((project as any).gallery_images_json, [])
  );

  const galleryImagesFromJsonb: string[] = galleryImagesJson
    .map((item) => {
      if (typeof item === "string") return item;
      return item?.url || item?.image_url || item?.src || "";
    })
    .filter((u) => typeof u === "string" && u.trim() !== "");

  const galleryImages = galleryImagesFromJsonb;

  // Debug: Log image data in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[ProjectDetailPage] Image data:', {
      hero_image_url: project.hero_image_url,
      gallery_images_json: (project as any).gallery_images_json,
      gallery_images: (project as any).gallery_images,
      images: (project as any).images,
      extracted: galleryImages
    });
  }

  // Build address string
  const addressParts = [
    microMarket?.micro_market_name,
    cityName,
  ].filter(Boolean);
  const address = addressParts.join(", ");

  return (
    <>
      <DebugClient citySlug={citySlug} projectSlug={projectSlug} />
      <JsonLd jsonLd={unifiedSchema} />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4">
          <BreadcrumbNav
            items={breadcrumbItems.map((item) => ({
              label: item.name,
              href: item.href,
            }))}
          />
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-8">
            {/* Left Column - Scrollable Content (65%) */}
            <div className="space-y-8">
              {/* 1. Hero Image + Gallery */}
              <ProjectHeroImage
                heroImageUrl={project.hero_image_url ? getHeroImageUrl(project.hero_image_url) : null}
                // Combine hero + gallery for slider (hero first)
                galleryImages={
                  project.hero_image_url
                    ? [getHeroImageUrl(project.hero_image_url), ...galleryImages]
                    : galleryImages
                }
              />

              {/* Mobile-only: Key Details shown after hero */}
              <div className="lg:hidden">
                <ProjectStickyCard
                  projectName={project.project_name}
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
                />
              </div>

              {/* 2. Project Description */}
              <ProjectDescription
                htmlContent={(project as any).long_description_html}
              />

              {/* 2.5. Project Highlights */}
              {projectHighlights && (
                <ProjectHighlights highlights={projectHighlights} />
              )}

              {/* 3. Technical Specs Card */}
              <TechnicalSpecsCard projectSnapshot={technicalSpecs} />

              {/* 4. Amenities Card */}
              <AmenitiesCard amenities={amenities} />

              {/* 5. Specifications Card */}
              {specifications &&
                ((Array.isArray(specifications) && specifications.length > 0) ||
                  (typeof specifications === "object" &&
                    specifications !== null &&
                    Object.keys(specifications).length > 0)) && (
                  <SpecificationsCard specifications={specifications} />
                )}

              {/* 6. Floor Plans Gallery */}
              {floorPlansRaw && floorPlansRaw.length > 0 && (
                <FloorPlansGallery floorPlanImages={floorPlansRaw} />
              )}

              {/* 7. Google Map Embed */}
              <GoogleMapEmbed embedUrl={(project as any).google_maps_embed_url} />

              {/* 8. Location Advantages */}
              <LocationAdvantages
                locationAdvantages={locationAdvantages}
                locationHighlights={(project as any).location_highlights}
              />

              {/* 9. Why Invest Section */}
              <WhyInvestSection investmentAnalysis={investmentAnalysis} projectName={project.project_name} />

              {/* 10. Westside Realty Verdict */}
              <WestsideVerdictSection review={(project as any).westside_realty_review} />

              {/* 11. FAQs Accordion */}
              <ProjectFAQs faqs={faqs} projectName={project.project_name} />

              {/* 12. Similar Properties */}
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

              {/* About Developer - only render if developer exists */}
              {developer && (
                <AboutDeveloperSection
                  developerName={developer.developer_name}
                  citySlug={citySlug}
                  developerSlug={developer.url_slug}
                  logoUrl={developer.logo_url}
                  tagline={developer.tagline}
                  yearsInBusiness={developer.years_in_business}
                  totalProjects={developer.total_projects}
                  totalSftDelivered={(developer as any).total_sft_delivered}
                  description={(developer as any).developer_profile_seo || developer.meta_description}
                  notableProjects={
                    developer.notable_projects_json && 
                    Array.isArray(developer.notable_projects_json) && 
                    developer.notable_projects_json.length > 0
                      ? developer.notable_projects_json
                          .map((p: any) => typeof p === 'string' ? p : p?.project_name)
                          .filter(Boolean)
                          .join(', ')
                      : null
                  }
                />
              )}

              {/* About Micro Market - only render if microMarket exists */}
              {microMarket && citySlug && (
                <section>
                  <h3 className="text-xl font-bold text-slate-900 mb-6">
                    Micro-Market Context: {microMarket.micro_market_name}
                  </h3>
                  <AboutMicroMarketSection
                    microMarketName={microMarket.micro_market_name}
                    citySlug={citySlug}
                    microMarketSlug={microMarket.url_slug}
                    heroHook={microMarket.hero_hook}
                    growthStory={microMarket.growth_story}
                    pricePerSqftMin={microMarket.price_per_sqft_min}
                    pricePerSqftMax={microMarket.price_per_sqft_max}
                    appreciationRate={microMarket.annual_appreciation_min}
                  />
                </section>
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

        <CityHubBacklink />

        {/* Mobile Sticky Actions */}
        <ProjectMobileActions
          projectName={project.project_name}
          whatsappNumber="919866085831"
          phoneNumber="919866085831"
        />
      </div>
    </>
  );
}

// Revalidate every 60 seconds to allow database changes to reflect quickly
export const revalidate = 60;
