 "use client";

import { useEffect, useState } from "react";
 import { useParams } from "next/navigation";
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

export default function ProjectDetailPage() {
  const params = useParams();
  const citySlugParam = params.citySlug;
  const microMarketSlugParam = params.microMarketSlug;
  const projectSlugParam = params.projectSlug;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const microMarketSlug = Array.isArray(microMarketSlugParam) ? microMarketSlugParam[0] : microMarketSlugParam;
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

  useEffect(() => {
    const fetchData = async () => {
      // citySlug and projectSlug are guaranteed to be strings at this point due to early return
      
      setLoading(true);
      try {
        let projectData: ProjectWithRelations | null = null;

        if (microMarketSlug) {
          projectData = await projectService.getProjectBySlug(
            citySlug,
            microMarketSlug,
            projectSlug
          );
        } else {
          projectData = await projectService.getCityLevelProjectBySlug(
            citySlug,
            projectSlug
          );
        }
        
        if (projectData) {
          setProject(projectData);
          
          // Search for brochure in storage bucket
          const foundBrochureUrl = await findBrochureByProjectName(projectData.project_name);
          setBrochureUrl(foundBrochureUrl);
          
          // Fetch live listings for this project
          setLoadingListings(true);
          const allProperties = await locationPropertyService.getHyderabadProperties();
          const projectListings = allProperties.filter(
            prop => prop.project_name?.toLowerCase() === projectData.project_name.toLowerCase() &&
                   prop.status === 'active'
          );
          setListings(projectListings);
          setLoadingListings(false);
        }
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [citySlug, microMarketSlug, projectSlug]);

  const handleWhatsApp = () => {
    const message = `Hi, I'm interested in ${project?.project_name || 'this project'}. ${window.location.href}`;
    window.open(`https://wa.me/919618704005?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleOpenLeadForm = () => {
    setIsLeadFormOpen(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-[500px] w-full mb-8" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          </div>
        </div>
      </Layout>
    );
  }

  // Parse gallery images
  const galleryImages = (() => {
    const heroImage = (project as any).hero_image_url;
    let images: string[] = [];

    // Get gallery images
    const galleryJson = (project as any).gallery_images_json;
    if (Array.isArray(galleryJson)) {
      images = galleryJson;
    } else if (galleryJson && typeof galleryJson === 'object' && galleryJson.images) {
      images = galleryJson.images;
    }

    // Prepend Hero Image if it exists
    if (heroImage) {
      // Filter out hero image if it's already in the gallery to avoid duplicates
      const otherImages = images.filter(img => img !== heroImage);
      return [heroImage, ...otherImages];
    }

    return images;
  })();

  // Parse landmarks for nearby places
  const parseLandmarks = (locationAdvantages: any) => {
    if (!locationAdvantages) return [];
    if (Array.isArray(locationAdvantages)) return locationAdvantages;
    if (typeof locationAdvantages === 'object' && locationAdvantages.landmarks) {
      return locationAdvantages.landmarks;
    }
    return [];
  };

  const landmarks = parseLandmarks((project as any).location_advantages_json);

  // Check if project is sold out or completed for CTA handling
  const isSoldOut = ((project as any).status?.toLowerCase().includes('sold') || 
                    (project as any).completion_status?.toLowerCase().includes('sold'));
  const isCompleted = ((project as any).status?.toLowerCase().includes('completed') || 
                      (project as any).completion_status?.toLowerCase().includes('completed'));

  return (
    <Layout>
      <ProjectSEO
        project={project}
        citySlug={citySlug}
        microMarketSlug={microMarketSlug}
        projectSlug={projectSlug}
      />

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-4">
        <BreadcrumbNav useAutoBreadcrumbs />
      </div>

      {/* Hero Gallery with LCP Optimization */}
      <ProjectHeroGallery
        images={galleryImages}
        projectName={project.project_name}
        status={(project as any).completion_status}
        reraId={(project as any).rera_id}
      />

      {/* Trust Strip - SEO trust signals */}
      <TrustStrip
        reraId={(project as any).rera_id}
        developerName={project.developer?.developer_name}
        developerYears={project.developer?.years_in_business}
        landArea={(project as any).total_land_area}
        keyFeature={(project as any).project_highlights?.[0]}
        possession={(project as any).possession_date_text}
      />

      {/* Key Facts Strip - Fixed below hero */}
      <ProjectKeyFactsStrip
        priceDisplay={(project as any).price_display_string || (project as any).price_range_text}
        reraId={(project as any).rera_id}
        reraLink={(project as any).rera_link}
        status={(project as any).completion_status}
        onEnquire={handleOpenLeadForm}
      />

      {/* Sticky Navigation */}
      <ProjectStickyNav
        projectName={project.project_name}
        onWhatsApp={handleWhatsApp}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 max-w-7xl mx-auto items-start">
          {/* Left Column - Main Content */}
          <div className="space-y-16">
            {/* Sold Out Banner */}
            {isSoldOut && (
              <Alert className="bg-amber-50 border-amber-300">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>This project is sold out.</strong> The content below is maintained for informational purposes. 
                  <button 
                    onClick={() => document.getElementById('related-projects')?.scrollIntoView({ behavior: 'smooth' })}
                    className="ml-1 text-primary underline underline-offset-2"
                  >
                    View similar projects
                  </button>
                </AlertDescription>
              </Alert>
            )}

            {/* Project Header with H1 from database */}
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span>{project.micro_market?.micro_market_name}</span>
                <span>•</span>
                <span>{project.city?.city_name}</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
                {(project as any).h1_title || project.project_name}
              </h1>
              {project.developer?.developer_name && (
                <p className="text-lg text-muted-foreground">
                  by {project.developer.developer_name}
                </p>
              )}
            </div>

            {/* Project Snapshot Cards */}
            <ProjectSnapshotCards
              totalLandArea={(project as any).total_land_area}
              totalTowers={(project as any).total_towers}
              totalFloors={(project as any).total_floors}
              totalUnits={(project as any).total_units}
              bhkConfig={(project as any).property_types ? 
                Array.isArray((project as any).property_types) 
                  ? (project as any).property_types.join(', ')
                  : (project as any).property_types
                : null
              }
              sizeRange={(project as any).unit_mix_summary || (project as any).unit_size_range}
            />

            {/* Overview Section */}
            <section id="overview">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Overview</h2>
              <ProjectOverviewSection
                reraId={(project as any).rera_id}
                possessionDate={(project as any).rera_possession_date}
                status={(project as any).completion_status}
                description={(project as any).long_description_html || (project as any).project_overview_seo || project.meta_description}
                highlights={(project as any).project_snapshot_json}
              />
              
              {/* Westside Realty Expert Review - E-E-A-T Signal */}
              <ProjectExpertReview 
                review={(project as any).westside_realty_review}
                projectName={project.project_name}
              />
            </section>

            {/* Price & Configuration Section */}
            <section id="price">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Price & Unit Mix</h2>
              <ProjectPriceTable
                projectSnapshotJson={(project as any).project_snapshot_json}
              />
              {/* Enhanced CTA for lead capture */}
              {!isSoldOut && (
                <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">Want exact pricing & current offers?</p>
                    <p className="text-sm text-muted-foreground">Get personalized quotes from our team</p>
                  </div>
                  <button
                    onClick={handleOpenLeadForm}
                    className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
                  >
                    Request Exact Price
                  </button>
                </div>
              )}
            </section>

            {/* Floor Plans Section */}
            {((project as any).floor_plan_images || galleryImages.length > 0) && (
              <section id="floor-plans">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Master Plan & Floor Plans</h2>
                <ProjectFloorPlans
                  floorPlanImages={(project as any).floor_plan_images}
                />
              </section>
            )}

            {/* Technical Specifications Section */}
            <ProjectSpecifications specifications={(project as any).specifications_json} />

            {/* Amenities Section */}
            {(project as any).amenities_json && (
              <section id="amenities">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Amenities & Lifestyle</h2>
                <ProjectAmenities amenities={(project as any).amenities_json} />
              </section>
            )}

            {/* Nearby Places Section - Primary Location Section */}
            {landmarks.length > 0 && (
              <section id="location">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Key Distances</h2>
                <ProjectNearbyPlaces landmarks={landmarks} />
              </section>
            )}

            {/* Fallback Location Section - Only show if no landmarks */}
            {landmarks.length === 0 && (
              <section id="location">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Location Advantages</h2>
                <LocationHighlightsCard 
                  highlights={(project as any).location_highlights} 
                />
                <ProjectLocation
                  googleMapsUrl={(project as any).google_maps_url}
                  googleMapsEmbedUrl={(project as any).google_maps_embed_url}
                  landmarks={[]}
                  microMarketName={project.micro_market?.micro_market_name}
                  cityName={project.city?.city_name}
                  latitude={project.latitude}
                  longitude={project.longitude}
                />
              </section>
            )}

            {/* Google Map - Show separately when landmarks exist */}
            {landmarks.length > 0 && (
              <ProjectLocation
                googleMapsUrl={(project as any).google_maps_url}
                googleMapsEmbedUrl={(project as any).google_maps_embed_url}
                landmarks={[]}
                microMarketName={project.micro_market?.micro_market_name}
                cityName={project.city?.city_name}
                latitude={project.latitude}
                longitude={project.longitude}
              />
            )}

            {/* About Developer with enhanced anchor text */}
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

            {/* About Micro Market with enhanced anchor text */}
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

            {/* RERA & Construction Status Section */}
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
            {(project as any).faqs_json && Array.isArray((project as any).faqs_json) && (
              <section id="faq">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
                <ProjectFAQSection 
                  faqs={(project as any).faqs_json}
                  projectName={project.project_name}
                />
              </section>
            )}
          </div>

          {/* Right Column - Lead Form (Desktop Only) */}
          <aside className="hidden lg:block sticky top-24 h-fit">
            <ProjectLeadForm
              projectName={project.project_name}
              projectId={project.id}
              developerName={project.developer?.developer_name}
              developerLogo={project.developer?.logo_url}
              brochureUrl={brochureUrl}
            />
          </aside>
        </div>

        {/* Available Units Section */}
        {listings.length > 0 && (
          <section className="mt-16 pt-16 border-t">
            <h2 className="text-3xl font-bold mb-8 text-center">Available Units</h2>
            {loadingListings ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {listings.map((listing) => (
                  <PropertyCard key={listing.id} property={listing} location="hyderabad" />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Related Projects Section */}
        <RelatedProjectsSection
          currentProjectId={project.id}
          microMarketId={project.micro_market_id || ''}
          microMarketName={project.micro_market?.micro_market_name}
          developerId={project.developer_id}
          citySlug={citySlug}
        />

        {/* Bottom Lead Form Section - Third Placement */}
        <BottomLeadFormSection
          projectName={project.project_name}
          projectId={project.id}
          developerName={project.developer?.developer_name}
          brochureUrl={brochureUrl}
        />
      </div>

      {/* Mobile Fixed Bottom Actions */}
      <ProjectMobileActions
        onWhatsApp={handleWhatsApp}
        onEnquire={() => setIsLeadFormOpen(true)}
      />

      {/* Sticky Offer Banner - Only show if project has special offers */}
      {(project as any).special_offers && (
        <StickyOfferBanner 
          offerData={(project as any).special_offers} 
          onClaim={() => setIsLeadFormOpen(true)} 
        />
      )}

      {/* Lead Form Modal */}
      <Dialog open={isLeadFormOpen} onOpenChange={setIsLeadFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unlock EOI Offers & Brochure</DialogTitle>
            <DialogDescription>
              Fill in your details to receive exclusive offers and brochure
            </DialogDescription>
          </DialogHeader>
          <ProjectLeadForm
            projectName={project.project_name}
            projectId={project.id}
            developerName={project.developer?.developer_name}
            developerLogo={project.developer?.logo_url}
            brochureUrl={brochureUrl}
            inModal={true}
          />
        </DialogContent>
      </Dialog>

      <CityHubBacklink />
    </Layout>
  );
}
