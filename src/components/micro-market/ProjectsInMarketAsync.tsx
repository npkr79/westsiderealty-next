import { Suspense } from "react";
import {
  getProjectSummaryV3,
  getProjectSummaryV2,
  getProjectSummary,
  getTopPicks,
  getExplorerProjectsV3,
} from "@/services/microMarketProjectsService";
import type { MicroMarketProjectSummaryV2, MicroMarketProjectRowV2 } from "@/services/microMarketProjectsService";
import ProjectsInMarket, { ProjectsInMarketSkeleton } from "./ProjectsInMarket";

interface ProjectsInMarketAsyncProps {
  citySlug: string;
  microMarketSlug: string;
  marketName: string;
}

function toSummaryV2(
  v1: { total: number; active: number; completed: number } | null
): MicroMarketProjectSummaryV2 | null {
  if (!v1) return null;
  return {
    total: v1.total,
    active: v1.active,
    under_construction: v1.active,
    early_stage: 0,
    delayed: 0,
  };
}

export default async function ProjectsInMarketAsync({
  citySlug,
  microMarketSlug,
  marketName,
}: ProjectsInMarketAsyncProps) {
  const [summaryV3, summaryV2, summaryV1, topProjects, explorerProjects] =
    await Promise.all([
      getProjectSummaryV3(citySlug, microMarketSlug),
      getProjectSummaryV2(citySlug, microMarketSlug),
      getProjectSummary(citySlug, microMarketSlug),
      getTopPicks(citySlug, microMarketSlug, 8, marketName),
      getExplorerProjectsV3(citySlug, microMarketSlug, 6, 8, marketName),
    ]);

  const summary = summaryV3 ?? summaryV2 ?? toSummaryV2(summaryV1);

  return (
    <ProjectsInMarket
      citySlug={citySlug}
      microMarketSlug={microMarketSlug}
      marketName={marketName}
      summaryV2={summary}
      topProjects={topProjects}
      explorerProjects={explorerProjects}
    />
  );
}

export function ProjectsInMarketWithSkeleton(props: ProjectsInMarketAsyncProps) {
  return (
    <Suspense fallback={<ProjectsInMarketSkeleton />}>
      <ProjectsInMarketAsync {...props} />
    </Suspense>
  );
}
