import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import CityHubBacklink from "@/components/seo/CityHubBacklink";
import SmartLinkGrid from "@/components/shared/SmartLinkGrid";
import { JsonLd } from "@/components/common/SEO";
import ProjectMobileActions from "@/components/project-details/ProjectMobileActions";
import {
  ComparisonInsights,
  DensityInsights,
  DeveloperTrust,
  LeadCapture,
  LocationInsights,
  ProjectDNA,
  ProjectHero,
  RERAData,
  RiskFactors,
  WhoShouldConsiderThisProject,
} from "@/components/project-details/modules";
import ProjectLeadForm from "@/components/project-details/ProjectLeadForm";
import ProjectIntentSelector, { type ListingIntent } from "@/components/project-details/ProjectIntentSelector";
import ProjectAdvisoryTracker from "@/components/project-details/ProjectAdvisoryTracker";
import ProjectLifestyleExperience from "@/components/project-details/ProjectLifestyleExperience";
import type { ProjectPageContext, ProjectWithRelations } from "@/services/projectService";
import type { ProjectInsights } from "@/services/projectInsightsService";
import DebugClient from "@/app/[citySlug]/projects/[projectSlug]/DebugClient";

interface ProjectDetailsPageContentProps {
  citySlug: string;
  projectSlug: string;
  project: ProjectWithRelations;
  insights: ProjectInsights;
  context: ProjectPageContext;
  brochureUrl: string | null;
  userIntent: ListingIntent;
}

export default function ProjectDetailsPageContent({
  citySlug,
  projectSlug,
  project,
  insights,
  context,
  brochureUrl,
  userIntent,
}: ProjectDetailsPageContentProps) {
  const developer = project.developer ?? null;
  const microMarket = project.micro_market ?? null;
  const cityData = project.city ?? null;
  const advisorySectionOrder: Record<ListingIntent, Array<"location" | "density" | "comparison" | "risk">> = {
    investment: ["comparison", "risk", "density", "location"],
    "end-use": ["location", "density", "comparison", "risk"],
    upgrade: ["density", "comparison", "location", "risk"],
    nri: ["risk", "comparison", "location", "density"],
  };
  const sectionById: Record<"location" | "density" | "comparison" | "risk", React.ReactNode> = {
    location: <LocationInsights project={project} locationAdvantages={context.locationAdvantages} insights={insights} />,
    density: (
      <div data-advisory-section="density">
        <DensityInsights project={project} investmentAnalysis={context.investmentAnalysis} insights={insights} />
      </div>
    ),
    comparison: (
      <div data-advisory-section="comparison">
        <ComparisonInsights project={project} citySlug={citySlug} insights={insights} intent={userIntent} />
      </div>
    ),
    risk: (
      <div data-advisory-section="risk">
        <RiskFactors project={project} insights={insights} />
      </div>
    ),
  };

  return (
    <>
      <DebugClient citySlug={citySlug} projectSlug={projectSlug} />
      <JsonLd jsonLd={context.unifiedSchema} />
      <div className="min-h-screen bg-background">
        <ProjectAdvisoryTracker
          projectId={String(project.id)}
          microMarket={project.micro_market?.micro_market_name || undefined}
          intent={userIntent}
        />
        <div className="container mx-auto px-4 py-4">
          <BreadcrumbNav
            items={context.breadcrumbItems.map((item) => ({
              label: item.name,
              href: item.href,
            }))}
          />
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-8">
            <div className="space-y-8">
              <ProjectHero
                project={project}
                address={context.address}
                galleryImages={context.galleryImages}
                insights={insights}
                intent={userIntent}
              />
              <section
                id="advisor-concierge-desk"
                className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 shadow-[0_20px_45px_-20px_rgba(15,23,42,0.75)] sm:p-6"
              >
                <div className="max-w-3xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Concierge Advisory Desk</p>
                  <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Get Advisor-Led Shortlisting Support</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Connect with a premium advisory team for focused shortlisting and next-step guidance.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1.5 font-medium text-emerald-100">
                      Senior corridor specialists
                    </span>
                    <span className="rounded-full border border-blue-300/30 bg-blue-400/10 px-3 py-1.5 font-medium text-blue-100">
                      Institutional advisory framework
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <ProjectIntentSelector initialIntent={userIntent} variant="compact-dark" />
                </div>
                <div className="mt-4">
                  <ProjectLeadForm
                    projectName={project.project_name}
                    projectId={project.id}
                    developerName={project.developer?.developer_name ?? undefined}
                    developerLogo={project.developer?.logo_url}
                    brochureUrl={brochureUrl || undefined}
                    leadPersona={userIntent === "investment" || userIntent === "nri" ? "investor" : "end-user"}
                    triggerContext="sidebar-sticky"
                    initialIntent={userIntent}
                    compactMode
                  />
                </div>
              </section>
              <details className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                  Lifestyle (collapsed)
                </summary>
                <div className="mt-4">
                  <ProjectLifestyleExperience insights={insights} intent={userIntent} />
                </div>
              </details>
              <details className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                  Narrative (collapsed)
                </summary>
                <div className="mt-4 space-y-8">
                  <div data-advisory-section="buyer-fit">
                    <WhoShouldConsiderThisProject insights={insights} />
                  </div>
                  {advisorySectionOrder[userIntent].map((sectionId) => (
                    <div key={sectionId}>{sectionById[sectionId]}</div>
                  ))}
                </div>
              </details>
              <ProjectDNA
                project={project}
                insights={insights}
                technicalSpecs={context.technicalSpecs}
                amenities={context.amenities}
                specifications={context.specifications}
                floorPlansRaw={context.floorPlansRaw}
                projectHighlights={context.projectHighlights}
              />
              <RERAData project={project} faqs={context.faqs} />
              <DeveloperTrust project={project} citySlug={citySlug} />
            </div>

            <LeadCapture project={project} address={context.address} brochureUrl={brochureUrl} />
          </div>
        </div>

        {(microMarket || developer) && citySlug && project.city_id && (
          <SmartLinkGrid
            microMarketId={project.micro_market_id || undefined}
            cityId={project.city_id}
            microMarketName={microMarket?.micro_market_name || undefined}
            microMarketSlug={microMarket?.url_slug || undefined}
            citySlug={citySlug}
            cityName={cityData?.city_name || citySlug}
            developerId={project.developer_id || undefined}
            developerName={developer?.developer_name || undefined}
            developerSlug={developer?.url_slug || undefined}
            mode={
              project.micro_market_id && project.developer_id
                ? "microMarketDeveloper"
                : project.micro_market_id
                  ? "microMarket"
                  : "developer"
            }
          />
        )}

        <CityHubBacklink />
        <ProjectMobileActions projectName={project.project_name} />
      </div>
    </>
  );
}
