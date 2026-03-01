import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ArrowRight, CheckCircle2, Building2 } from "lucide-react";
import { buildProjectUrl, buildMicroMarketProjectsUrl } from "@/lib/routes";
import type { MicroMarketProjectRowV2 } from "@/services/microMarketProjectsService";

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

interface MicroMarketTopPicksProps {
  projects: MicroMarketProjectRowV2[];
  citySlug: string;
  microMarketSlug: string;
}

function TopPickCard({
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
              {project.developer_name}
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

export default function MicroMarketTopPicks({
  projects,
  citySlug,
  microMarketSlug,
}: MicroMarketTopPicksProps) {
  if (projects.length === 0) return null;

  const allProjectsUrl = buildMicroMarketProjectsUrl(citySlug, microMarketSlug);

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          Top Picks
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Institutional-grade projects with execution visibility and strong developer credibility.
        </p>
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1" />
        <StageChips />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-4">
        {projects.map((project) => (
          <TopPickCard
            key={project.project_id ?? project.id}
            project={project}
            citySlug={citySlug}
          />
        ))}
      </div>
      <div className="mt-4">
        <Link
          href={allProjectsUrl}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          View all projects
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
