"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { ProjectWithRelations } from "@/services/projectService";

interface DeveloperProjectCardProps {
  project: ProjectWithRelations | any;
  citySlug?: string;
}

export default function DeveloperProjectCard({
  project,
  citySlug,
}: DeveloperProjectCardProps) {
  const defaultCitySlug = citySlug || project.city_slug || 'hyderabad';
  const microMarketSlug = project.micro_market?.url_slug || project.micro_market_slug;
  const projectHref = microMarketSlug
    ? `/${defaultCitySlug}/${microMarketSlug}/projects/${project.url_slug}`
    : `/${defaultCitySlug}/projects/${project.url_slug}`;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-lg">
          <Link
            href={projectHref}
            className="hover:underline text-primary"
          >
            {project.project_name}
          </Link>
        </h3>
        {project.micro_market?.micro_market_name && (
          <p className="text-sm text-muted-foreground">
            {project.micro_market.micro_market_name}
          </p>
        )}
        {project.price_range_text && (
          <p className="text-sm font-medium text-primary">{project.price_range_text}</p>
        )}
      </CardContent>
    </Card>
  );
}


