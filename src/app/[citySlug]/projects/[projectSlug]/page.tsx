"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { projectService, ProjectWithRelations } from "@/services/projectService";
import { locationPropertyService, HyderabadProperty } from "@/services/locationPropertyService";
import { findBrochureByProjectName } from "@/services/brochureService";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Layout from "@/components/layout/Layout";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import PropertyCard from "@/components/properties/PropertyCard";
import FooterSection from "@/components/home/FooterSection";
import CityHubBacklink from "@/components/seo/CityHubBacklink";
import ProjectSEO from "@/components/project-details/ProjectSEO";
import ProjectHeroGallery from "@/components/project-details/ProjectHeroGallery";
import ProjectStickyNav from "@/components/project-details/ProjectStickyNav";
import ProjectLeadForm from "@/components/project-details/ProjectLeadForm";
import ProjectMobileActions from "@/components/project-details/ProjectMobileActions";
import ProjectOverviewSection from "@/components/project-details/ProjectOverviewSection";
import ProjectPriceTable from "@/components/project-details/ProjectPriceTable";
import ProjectFloorPlans from "@/components/project-details/ProjectFloorPlans";
import ProjectSpecifications from "@/components/project-details/ProjectSpecifications";
import ProjectAmenities from "@/components/project-details/ProjectAmenities";
import ProjectLocation from "@/components/project-details/ProjectLocation";
import ProjectSnapshotCards from "@/components/project-details/ProjectSnapshotCards";
import ProjectNearbyPlaces from "@/components/project-details/ProjectNearbyPlaces";
import AboutDeveloperSection from "@/components/project-details/AboutDeveloperSection";
import AboutMicroMarketSection from "@/components/project-details/AboutMicroMarketSection";
import RelatedProjectsSection from "@/components/project-details/RelatedProjectsSection";
import ProjectFAQSection from "@/components/project-details/ProjectFAQSection";
import ProjectInvestmentAnalysis from "@/components/project-details/ProjectInvestmentAnalysis";
import StickyOfferBanner from "@/components/project-details/StickyOfferBanner";
import ProjectKeyFactsStrip from "@/components/project-details/ProjectKeyFactsStrip";
import ProjectExpertReview from "@/components/project-details/ProjectExpertReview";
import ProjectRERATimeline from "@/components/project-details/ProjectRERATimeline";
import TrustStrip from "@/components/project-details/TrustStrip";
import LocationHighlightsCard from "@/components/project-details/LocationHighlightsCard";
import BottomLeadFormSection from "@/components/project-details/BottomLeadFormSection";
import { getProjectImageUrls } from "@/lib/project-images";

export default function ProjectDetailPage() {
  const params = useParams();
  const citySlugParam = params.citySlug;
  const projectSlugParam = params.projectSlug;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const projectSlug = Array.isArray(projectSlugParam) ? projectSlugParam[0] : projectSlugParam;
  
  // Early return if required params are missing
  if (!citySlug || !projectSlug) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Invalid URL</h1>
            <p className="text-muted-foreground">Required parameters are missing.</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  const [project, setProject] = useState<ProjectWithRelations | null>(null);
  const [listings, setListings] = useState<HyderabadProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [brochureUrl, setBrochureUrl] = useState<string | null>(null);

  const handleWhatsApp = () => {
    if (typeof window !== 'undefined') {
      const message = `Hi, I'm interested in ${project?.project_name || 'this project'}. ${window.location.href}`;
      window.open(`https://wa.me/919866085831?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Try to get project by city-level slug (no micro-market required)
        let projectData: ProjectWithRelations | null = null;
        
        // First try city-level lookup
        projectData = await projectService.getCityLevelProjectBySlug(
          citySlug,
          projectSlug
        );
        
        // If not found, try to find by project slug across all micro-markets in the city
        if (!projectData) {
          // This will be handled by the service - it should find the project regardless of micro-market
          console.warn(`[ProjectDetailPage] Project ${projectSlug} not found at city level, trying alternative lookup`);
        }
        
        if (projectData) {
          setProject(projectData);
          
          // Search for brochure in storage bucket
          const foundBrochureUrl = await findBrochureByProjectName(projectData.project_name);
          setBrochureUrl(foundBrochureUrl);
          
          // Fetch listings if this is Hyderabad
          if (citySlug === "hyderabad") {
            setLoadingListings(true);
            try {
              // Fetch all Hyderabad properties and filter by project name
              const allProperties = await locationPropertyService.getHyderabadProperties();
              const projectListings = allProperties.filter(
                prop => prop.project_name?.toLowerCase() === projectData.project_name.toLowerCase() &&
                       prop.status === 'active'
              );
              setListings(projectListings);
            } catch (error) {
              console.error("Error fetching listings:", error);
              setListings([]);
            } finally {
              setLoadingListings(false);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [citySlug, projectSlug]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-96 w-full mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Alert className="max-w-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <h2 className="text-xl font-bold mb-2">Project not found</h2>
                <p className="text-muted-foreground">
                  The project you're looking for doesn't exist or has been removed.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </Layout>
    );
  }

  const microMarketSlug = project.micro_market?.url_slug;
  const landmarks = Array.isArray((project as any).landmarks_json)
    ? (project as any).landmarks_json
    : [];

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: project.city?.city_name || citySlug, href: `/${citySlug}` },
    ...(microMarketSlug
      ? [{ label: project.micro_market?.micro_market_name || microMarketSlug, href: `/${citySlug}/${microMarketSlug}` }]
      : []),
    { label: "Projects", href: `/${citySlug}/projects` },
    { label: project.project_name },
  ];

  return (
    <Layout>
      <ProjectSEO project={project} citySlug={citySlug} projectSlug={projectSlug} />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4">
          <BreadcrumbNav items={breadcrumbItems} />
        </div>

        {/* Hero Gallery */}
        <ProjectHeroGallery
          projectName={project.project_name}
          images={getProjectImageUrls(project)}
        />

        {/* Sticky Navigation */}
        <ProjectStickyNav projectName={project.project_name} onWhatsApp={handleWhatsApp} />

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto space-y-12">
            {/* Key Facts Strip */}
            <ProjectKeyFactsStrip
              priceDisplay={(project as any).price_display_string || project.price_range_text}
              reraId={(project as any).rera_id}
              reraLink={(project as any).rera_link}
              status={(project as any).completion_status}
              onEnquire={() => setIsLeadFormOpen(true)}
            />

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
            {citySlug && (
              <RelatedProjectsSection
                citySlug={citySlug}
                currentProjectId={project.id}
                microMarketId={project.micro_market_id ? String(project.micro_market_id) : undefined}
                developerId={project.developer_id ? String(project.developer_id) : undefined}
              />
            )}

            {/* Property Listings (Hyderabad only) */}
            {citySlug === "hyderabad" && listings.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Available Properties in {project.project_name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((listing) => (
                    <PropertyCard 
                      key={listing.id} 
                      property={{
                        ...listing,
                        slug: listing.slug || listing.seo_slug || listing.id,
                        title: listing.title,
                        location: listing.location || listing.micro_market || '',
                        price: listing.price,
                        price_display: listing.price_display,
                        main_image_url: listing.main_image_url,
                        image_gallery: listing.image_gallery || [],
                        bedrooms: listing.bedrooms,
                        area_sqft: listing.area_sqft,
                      } as any} 
                      location={citySlug as any}
                    />
                  ))}
                </div>
              </section>
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

        {/* Sticky Offer Banner */}
        {(project as any).special_offers && (
          <StickyOfferBanner
            offerData={(project as any).special_offers}
            onClaim={() => setIsLeadFormOpen(true)}
          />
        )}

        {/* Mobile Actions */}
        <ProjectMobileActions
          onWhatsApp={handleWhatsApp}
          onEnquire={() => setIsLeadFormOpen(true)}
        />

        {/* Lead Form Dialog */}
        <Dialog open={isLeadFormOpen} onOpenChange={setIsLeadFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Get More Information</DialogTitle>
              <DialogDescription>
                Fill out the form below to receive detailed information about {project.project_name}.
              </DialogDescription>
            </DialogHeader>
            <ProjectLeadForm
              projectName={project.project_name}
              projectId={project.id}
              developerName={project.developer?.developer_name}
              brochureUrl={brochureUrl || undefined}
            />
          </DialogContent>
        </Dialog>

        <CityHubBacklink />
        <FooterSection />
      </div>
    </Layout>
  );
}

