import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, CheckCircle2, Building2 } from "lucide-react";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import ProgressBar from "./ProgressBar";
import { buildProjectUrl } from "@/lib/routes";
import type {
  MicroMarketProjectSummaryV2,
  MicroMarketProjectRowV2,
} from "@/services/microMarketProjectsService";

interface ProjectsInMarketProps {
  citySlug: string;
  microMarketSlug: string;
  marketName: string;
  summaryV2: MicroMarketProjectSummaryV2 | null;
  topProjects: MicroMarketProjectRowV2[];
  marketMaturity?: string | null;
}

function cleanDeveloperName(name: string): string {
  return name
    .replace(/\b(PRIVATE LIMITED|PVT\.? LTD\.?|LIMITED|LLP|INC\.?|LLC|CONSTRUCTIONS?|BUILDERS?|DEVELOPERS?|INFRA|INFRASTRUCTURE|ESTATES?|PROPERTIES|REALTY|PROJECTS?)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function FeaturedProjectCard({
  project,
  citySlug,
}: {
  project: MicroMarketProjectRowV2;
  citySlug: string;
}) {
  if (!project.url_slug) return null;
  const href = buildProjectUrl(citySlug, project.url_slug);
  const imageUrl = project.hero_image_url || project.main_image_url || null;
  const nearCompletion = project.near_completion ?? false;
  const strongDeveloper = project.strong_developer ?? false;

  return (
    <Link href={href} className="block">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
        <div className="aspect-video bg-muted relative">
          <ImageWithFallback
            src={imageUrl}
            alt={`${project.project_name} project`}
            fill
            className="object-cover"
          />
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {nearCompletion && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600/90 px-2 py-0.5 text-xs font-medium text-white">
                <CheckCircle2 className="h-3 w-3" />
                Near completion
              </span>
            )}
            {strongDeveloper && (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-foreground">
                <Building2 className="h-3 w-3" />
                Strong developer
              </span>
            )}
          </div>
        </div>
        <CardContent className="space-y-1.5 p-4">
          <div className="font-semibold text-foreground line-clamp-2">{project.project_name}</div>
          {project.developer_name && (
            <div className="text-xs text-muted-foreground">
              {cleanDeveloperName(project.developer_name)}
            </div>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="line-clamp-1">
              {project.micro_market_name || project.micro_market || ""}
            </span>
          </div>
          {project.price_range_text && (
            <div className="text-sm font-semibold text-primary">{project.price_range_text}</div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function SnapshotBlock({
  summary,
  marketMaturity,
}: {
  summary: MicroMarketProjectSummaryV2 | null;
  marketMaturity?: string | null;
}) {
  const total = summary?.total ?? 0;
  const active = summary?.active ?? 0;
  const underConstruction = summary?.under_construction ?? 0;
  const earlyStage = summary?.early_stage ?? 0;
  const delayed = summary?.delayed ?? 0;

  const isEstablishedOrPeak = marketMaturity === "Established" || marketMaturity === "Peak";
  const isGrowing = marketMaturity === "Growing";

  const baseMetrics = [
    { label: "Total", value: total, max: Math.max(total, 1), note: null },
    { label: "Active", value: active, max: Math.max(total, 1), note: null },
    { label: "Under construction", value: underConstruction, max: Math.max(total, 1), note: null },
    { label: "Early stage", value: earlyStage, max: Math.max(total, 1), note: null },
  ];

  // Established/Peak: hide Delayed — RERA date math is unreliable for mature markets
  // Growing: show Delayed with caveat note
  // Emerging/null: show Delayed as-is
  const metrics = isEstablishedOrPeak
    ? baseMetrics
    : [
        ...baseMetrics,
        {
          label: "Delayed",
          value: delayed,
          max: Math.max(total, 1),
          note: isGrowing ? "Based on RERA validity dates — may not reflect actual status" : null,
        },
      ];

  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${isEstablishedOrPeak ? "lg:grid-cols-4" : "lg:grid-cols-5"}`}>
      {metrics.map((m) => (
        <div key={m.label} className="rounded-lg border border-border bg-card p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">{m.label}</span>
            <span className="text-xl font-semibold text-foreground">{m.value}</span>
          </div>
          <ProgressBar value={m.value} max={m.max} showValue={false} />
          {m.note && (
            <p className="text-xs text-muted-foreground mt-2 italic">{m.note}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function FeaturedProjectsBlock({
  projects,
  citySlug,
  marketName,
}: {
  projects: MicroMarketProjectRowV2[];
  citySlug: string;
  marketName: string;
}) {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Featured Projects in {marketName}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Top ranked projects by developer track record and RERA compliance.
        </p>
      </div>
      {projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {projects.map((project) => (
            <FeaturedProjectCard
              key={project.project_id ?? project.id}
              project={project}
              citySlug={citySlug}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No picks available yet.</p>
      )}
    </div>
  );
}

function ProjectsInMarketSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div>
        <Skeleton className="mb-6 h-6 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="aspect-video rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProjectsInMarket({
  citySlug,
  microMarketSlug: _microMarketSlug,
  marketName,
  summaryV2,
  topProjects,
  marketMaturity,
}: ProjectsInMarketProps) {
  return (
    <section className="mt-14">
      <h2 className="mb-8 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        Projects in {marketName}
      </h2>

      <div className="space-y-10">
        <SnapshotBlock summary={summaryV2} marketMaturity={marketMaturity} />
        <FeaturedProjectsBlock projects={topProjects} citySlug={citySlug} marketName={marketName} />
      </div>
    </section>
  );
}

export { ProjectsInMarketSkeleton };
