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
import { getProjectImageUrls } from "@/lib/project-images";
import { safeJsonParse } from "@/lib/project-utils";
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
  const { citySlug: citySlugParam, projectSlug: projectSlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  let projectSlug = Array.isArray(projectSlugParam) ? projectSlugParam[0] : projectSlugParam;

  if (!citySlug || !projectSlug) {
    return {
      title: "Project Not Found",
    };
  }

  // Handle spelling correction: sumachura -> sumadhura
  if (projectSlug === 'sumachura-the-olympus') {
    projectSlug = 'sumadhura-the-olympus';
  }

  // Handle spelling correction: sumachura -> sumadhura
  // If old slug is used, redirect to new one
  if (projectSlug === 'sumachura-the-olympus') {
    const { redirect } = await import('next/navigation');
    redirect(`/${citySlug}/projects/sumadhura-the-olympus`);
  }

  let project = await projectService.getCityLevelProjectBySlug(citySlug, projectSlug);

  // If not found, try stripping location suffixes (handle legacy slugs)
  if (!project) {
    // Try common location suffix patterns: -mokila-hyderabad, -hyderabad, etc.
    const slugWithoutSuffix = projectSlug
      .replace(/-mokila-hyderabad$/i, '')
      .replace(/-kokapet-hyderabad$/i, '')
      .replace(/-gachibowli-hyderabad$/i, '')
      .replace(/-hyderabad$/i, '')
      .replace(/-mokila$/i, '')
      .replace(/-kokapet$/i, '')
      .replace(/-gachibowli$/i, '');
    
    if (slugWithoutSuffix && slugWithoutSuffix !== projectSlug) {
      project = await projectService.getCityLevelProjectBySlug(citySlug, slugWithoutSuffix);
      if (project) {
        // Redirect to canonical URL (without location suffix)
        const { redirect } = await import('next/navigation');
        redirect(`/${citySlug}/projects/${slugWithoutSuffix}`);
      }
    }
  }

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  const microMarketSlug = project.micro_market?.url_slug;
  // Use corrected slug for canonical URL
  const correctedSlug = projectSlug === 'sumachura-the-olympus' ? 'sumadhura-the-olympus' : projectSlug;
  const canonicalUrl = microMarketSlug
    ? `https://www.westsiderealty.in/${citySlug}/${microMarketSlug}/projects/${correctedSlug}`
    : `https://www.westsiderealty.in/${citySlug}/projects/${correctedSlug}`;

  // Standardized title format: "{Project Name} {Location}: Price, Floor Plans & Reviews | RE/MAX"
  const cityName = project.city?.city_name || citySlug;
  // Fix project name spelling
  const correctedProjectName = project.project_name?.replace(/sumachura/gi, 'sumadhura') || project.project_name;
  const seoTitle = (project.seo_title?.replace(/sumachura/gi, 'sumadhura')) || `${correctedProjectName} ${cityName}: Price, Floor Plans & Reviews | RE/MAX`;
  const seoDescription = (project.meta_description?.replace(/sumachura/gi, 'sumadhura')) || `Explore ${correctedProjectName} - Premium residential project in ${cityName}`;
  
  // Optimize OG image
  const rawOgImage = project.hero_image_url || "https://www.westsiderealty.in/placeholder.svg";
  const optimizedOgImage = optimizeSupabaseImage(rawOgImage, {
    width: 1200,
    height: 630,
    quality: 80,
    format: "webp",
  });

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      siteName: "RE/MAX Westside Realty",
      type: "website",
      locale: "en_IN",
      images: [
        {
          url: optimizedOgImage,
          width: 1200,
          height: 630,
          alt: correctedProjectName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: [optimizedOgImage],
    },
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  // Log on server-side (check your terminal/server logs)
  console.log('[ProjectDetailPage] 🚀 Page component started');
  
  const { citySlug: citySlugParam, projectSlug: projectSlugParam } = await params;
  
  // Normalize params from string | string[] to string
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  let projectSlug = Array.isArray(projectSlugParam) ? projectSlugParam[0] : projectSlugParam;

  // Handle spelling correction: sumachura -> sumadhura
  // Redirect old URL to new one
  if (projectSlug === 'sumachura-the-olympus') {
    const { redirect } = await import('next/navigation');
    redirect(`/${citySlug}/projects/sumadhura-the-olympus`);
  }

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

  // Fix project name spelling if it contains the incorrect spelling
  // This must be defined early as it's used throughout the component
  const correctedProjectName = project.project_name?.replace(/sumachura/gi, 'sumadhura') || project.project_name;

  // Derive SEO helpers for schema (mirror generateMetadata logic)
  const cityName = project.city?.city_name || citySlug;
  // Use corrected slug for canonical URL if old slug was used
  const finalProjectSlug = projectSlug === 'sumachura-the-olympus' ? 'sumadhura-the-olympus' : projectSlug;
  const canonicalUrl = microMarketSlug
    ? `https://www.westsiderealty.in/${citySlug}/${microMarketSlug}/projects/${finalProjectSlug}`
    : `https://www.westsiderealty.in/${citySlug}/projects/${finalProjectSlug}`;
  const seoTitle =
    project.seo_title?.replace(/sumachura/gi, 'sumadhura') ||
    `${correctedProjectName} ${cityName}: Price, Floor Plans & Reviews | RE/MAX`;
  const seoDescription =
    project.meta_description?.replace(/sumachura/gi, 'sumadhura') ||
    `Explore ${correctedProjectName} - Premium residential project in ${cityName}`;

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: project.city?.city_name || citySlug, href: `/${citySlug}` },
    ...(microMarketSlug
      ? [{ name: project.micro_market?.micro_market_name || microMarketSlug, href: `/${citySlug}/${microMarketSlug}` }]
      : []),
    { name: "Projects", href: `/${citySlug}/projects` },
    { name: correctedProjectName, href: `/${citySlug}/projects/${finalProjectSlug}` },
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
  // correctedProjectName is already defined above
  const primaryEntity: Record<string, any> = {
    "@type": "RealEstateListing",
    name: correctedProjectName,
    description: seoDescription,
    image: project.hero_image_url || undefined,
    url: canonicalUrl,
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
      ...(microMarketSlug
        ? [{ name: project.micro_market?.micro_market_name || microMarketSlug, item: `https://www.westsiderealty.in/${citySlug}/${microMarketSlug}` }]
        : []),
      { name: "Projects", item: `https://www.westsiderealty.in/${citySlug}/projects` },
      { name: correctedProjectName, item: canonicalUrl },
    ],
  });

  // Parse JSON fields safely (JSONB fields from Supabase are already parsed, but handle string cases)
  // Only parse if it's a string, otherwise use as-is
  const parseJsonbField = <T,>(value: any, fallback: T): T => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') {
      return safeJsonParse(value, fallback);
    }
    return value as T;
  };

  const technicalSpecs = parseJsonbField((project as any).project_snapshot_json, []);
  const amenities = parseJsonbField((project as any).amenities_json, []);
  const specifications = parseJsonbField((project as any).specifications_json, null);
  const floorPlans = parseJsonbField((project as any).floor_plan_images, []);
  const locationAdvantages = parseJsonbField((project as any).location_advantages_json, null);
  const investmentAnalysis = parseJsonbField((project as any).investment_analysis_json, {});
  const projectHighlights = parseJsonbField((project as any).project_highlights, null);
  const faqs = faqsRaw; // Reuse the already parsed FAQs
  const galleryImages = getProjectImageUrls(project);

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
    project.micro_market?.micro_market_name,
    project.city?.city_name,
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
              {/* 1. Hero Image */}
              <ProjectHeroImage
                heroImageUrl={project.hero_image_url ? getHeroImageUrl(project.hero_image_url) : null}
                galleryImages={galleryImages}
              />

              {/* Mobile-only: Key Details shown after hero */}
              <div className="lg:hidden">
                <ProjectStickyCard
                  projectName={correctedProjectName}
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
                  developerName={project.developer?.developer_name}
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
              {specifications && (Array.isArray(specifications) ? specifications.length > 0 : Object.keys(specifications).length > 0) && (
                <SpecificationsCard specifications={specifications} />
              )}

              {/* 6. Floor Plans Gallery */}
              <FloorPlansGallery floorPlanImages={floorPlans} />

              {/* 7. Google Map Embed */}
              <GoogleMapEmbed embedUrl={(project as any).google_maps_embed_url} />

              {/* 8. Location Advantages */}
              <LocationAdvantages
                locationAdvantages={locationAdvantages}
                locationHighlights={(project as any).location_highlights}
              />

              {/* 9. Why Invest Section */}
              <WhyInvestSection investmentAnalysis={investmentAnalysis} projectName={correctedProjectName} />

              {/* 10. Westside Realty Verdict */}
              <WestsideVerdictSection review={(project as any).westside_realty_review} />

              {/* 11. FAQs Accordion */}
              <ProjectFAQs faqs={faqs} projectName={correctedProjectName} />

              {/* 12. Similar Properties */}
              {citySlug && project.id && (
                <SimilarProjects
                  currentProjectId={String(project.id)}
                  microMarketId={project.micro_market_id}
                  priceMin={(project as any).price_min}
                  priceMax={(project as any).price_max}
                  citySlug={citySlug}
                  microMarketSlug={project.micro_market?.url_slug}
                />
              )}

              {/* About Developer */}
              {project.developer && (
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
            </div>

            {/* Right Column - Sticky Sidebar (35%) - Desktop Only */}
            <div className="hidden lg:block">
              <ProjectStickySidebar
                projectName={correctedProjectName}
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
                developerName={project.developer?.developer_name}
                developerLogo={project.developer?.logo_url}
                brochureUrl={brochureUrl || undefined}
              />
            </div>

            {/* Mobile-only: Lead Form at bottom */}
            <div className="lg:hidden mt-8">
              <ProjectLeadForm
                projectName={correctedProjectName}
                projectId={project.id}
                developerName={project.developer?.developer_name ?? undefined}
                developerLogo={project.developer?.logo_url}
                brochureUrl={brochureUrl || undefined}
              />
            </div>
          </div>
        </div>

        <CityHubBacklink />

        {/* Mobile Sticky Actions */}
        <ProjectMobileActions
          projectName={correctedProjectName}
          whatsappNumber="919866085831"
          phoneNumber="919866085831"
        />
      </div>
    </>
  );
}

// Revalidate every 24 hours
export const revalidate = 86400;
