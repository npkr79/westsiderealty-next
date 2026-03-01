import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ArrowRight, CheckCircle2, Building2 } from "lucide-react";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import ProgressBar from "./ProgressBar";
import { buildProjectUrl, buildMicroMarketProjectsUrl } from "@/lib/routes";
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
  explorerProjects: MicroMarketProjectRowV2[];
}

function ProjectCardCompact({
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
    <Link href={href} className="block min-w-[280px] flex-shrink-0 md:min-w-0 md:w-full">
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
        <CardContent className="space-y-2 p-4">
          <div className="font-semibold text-foreground line-clamp-2">{project.project_name}</div>
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

function SnapshotBlock({ summary }: { summary: MicroMarketProjectSummaryV2 | null }) {
  const total = summary?.total ?? 0;
  const active = summary?.active ?? 0;
  const underConstruction = summary?.under_construction ?? 0;
  const earlyStage = summary?.early_stage ?? 0;
  const delayed = summary?.delayed ?? 0;

  const metrics = [
    { label: "Total", value: total, max: Math.max(total, 1) },
    { label: "Active", value: active, max: Math.max(total, 1) },
    { label: "Under construction", value: underConstruction, max: Math.max(total, 1) },
    { label: "Early stage", value: earlyStage, max: Math.max(total, 1) },
    { label: "Delayed", value: delayed, max: Math.max(total, 1) },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">{m.label}</span>
              <span className="text-xl font-semibold text-foreground">{m.value}</span>
            </div>
            <ProgressBar value={m.value} max={m.max} showValue={false} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StageChips() {
  const stages = [
    { label: "Early", slug: "early" },
    { label: "Under Construction", slug: "under_construction" },
    { label: "Completion", slug: "completion" },
    { label: "Delayed", slug: "delayed" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {stages.map((s) => (
        <span
          key={s.slug}
          className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground"
        >
          {s.label}
        </span>
      ))}
    </div>
  );
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

const STAGE_LABELS: Record<string, string> = {
  early: "Early",
  under_construction: "Under construction",
  completion: "Completion",
  delayed: "Delayed",
};

function formatStage(stage?: string | null): string {
  if (!stage) return "";
  return STAGE_LABELS[stage] || stage.replace(/_/g, " ");
}

function InstitutionalCard({
  project,
  citySlug,
}: {
  project: MicroMarketProjectRowV2;
  citySlug: string;
}) {
  if (!project.url_slug) return null;
  const href = buildProjectUrl(citySlug, project.url_slug);
  const nearCompletion = project.near_completion ?? false;
  const strongDeveloper = project.strong_developer ?? false;
  const stage = project.stage ? formatStage(project.stage) : null;

  return (
    <Link href={href} className="block min-w-[280px] flex-shrink-0 md:min-w-0 md:w-full">
      <Card className="h-full border border-border bg-card transition-colors hover:bg-muted/30">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="font-bold text-lg text-foreground line-clamp-2">
            {project.project_name}
          </div>
          {project.developer_name && (
            <div className="text-sm text-muted-foreground">
              {cleanDeveloperName(project.developer_name)}
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="line-clamp-1">
              {project.micro_market_name || project.micro_market || ""}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {stage && (
              <span className="rounded border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {stage}
              </span>
            )}
            {nearCompletion && (
              <span className="inline-flex items-center gap-1 rounded border border-emerald-600/50 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Near completion
              </span>
            )}
            {strongDeveloper && (
              <span className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
                <Building2 className="h-3 w-3" />
                Strong developer
              </span>
            )}
          </div>
          <div className="mt-auto pt-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              View Project
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function InstitutionalPicksBlock({
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
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-foreground">Featured Projects in {marketName}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Institutional-grade projects with execution visibility and strong developer credibility.
        </p>
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1" />
        <StageChips />
      </div>
      {projects.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-4">
          {projects.map((project) => (
            <InstitutionalCard
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

function ExplorerBlock({
  projects,
  citySlug,
  microMarketSlug,
}: {
  projects: MicroMarketProjectRowV2[];
  citySlug: string;
  microMarketSlug: string;
}) {
  if (projects.length === 0) return null;

  const fullMarketUrl = buildMicroMarketProjectsUrl(citySlug, microMarketSlug);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-foreground">Explorer</h3>
        <StageChips />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCardCompact
            key={project.project_id ?? project.id}
            project={project}
            citySlug={citySlug}
          />
        ))}
      </div>
      <div className="mt-6">
        <Link
          href={fullMarketUrl}
          className="inline-flex items-center gap-2 rounded-lg border border-primary bg-transparent px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
        >
          View full market
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
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
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-[280px] flex-shrink-0 rounded-xl" />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-video rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-10 w-40 rounded-lg" />
      </div>
    </div>
  );
}

export default function ProjectsInMarket({
  citySlug,
  microMarketSlug,
  marketName,
  summaryV2,
  topProjects,
  explorerProjects,
}: ProjectsInMarketProps) {
  return (
    <section className="mt-14">
      <h2 className="mb-8 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        Projects in {marketName}
      </h2>

      <div className="space-y-10">
        <SnapshotBlock summary={summaryV2} />
        <InstitutionalPicksBlock projects={topProjects} citySlug={citySlug} marketName={marketName} />
        <ExplorerBlock
          projects={explorerProjects}
          citySlug={citySlug}
          microMarketSlug={microMarketSlug}
        />
      </div>
    </section>
  );
}

export { ProjectsInMarketSkeleton };
