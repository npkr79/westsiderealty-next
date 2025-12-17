"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { ProjectWithRelations } from "@/services/projectService";
import { getProjectPrimaryImage } from "@/lib/project-images";

interface ProjectCardProps {
  project: ProjectWithRelations | any;
  citySlug: string;
}

export default function ProjectCard({ project, citySlug }: ProjectCardProps) {
  // Build canonical project URL: /citySlug/projects/projectSlug
  if (!project.url_slug) {
    // Return a non-clickable card if required data is missing
    return (
      <Card className="h-full overflow-hidden opacity-50">
        <div className="relative h-40 w-full bg-muted" />
        <CardContent className="p-4 space-y-1.5">
          <h3 className="text-base font-semibold text-foreground line-clamp-2">
            {project.project_name || 'Project'}
          </h3>
          <p className="text-xs text-muted-foreground">Details unavailable</p>
        </CardContent>
      </Card>
    );
  }
  
  const href = `/${citySlug}/projects/${project.url_slug}`;
  
  const image = getProjectPrimaryImage(project);

  return (
    <Link href={href} className="block">
      <Card className="h-full overflow-hidden">
        <div className="relative h-40 w-full">
          <Image
            src={image}
            alt={project.project_name}
            fill
            className="object-cover"
          />
        </div>
        <CardContent className="p-4 space-y-1.5">
          <h3 className="text-base font-semibold text-foreground line-clamp-2">
            {project.project_name}
          </h3>
          {project.micro_market?.micro_market_name && (
            <p className="text-xs text-muted-foreground">
              {project.micro_market.micro_market_name}, {project.city?.city_name || "Hyderabad"}
            </p>
          )}
          {project.price_range_text && (
            <p className="text-sm font-medium text-primary">
              {project.price_range_text}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}


