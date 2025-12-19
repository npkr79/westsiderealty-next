"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const isFeatured = project.is_featured || project.show_on_city_page;
  const developerName = project.developer?.developer_name;
  const description = project.meta_description || project.project_overview_seo || (project as any).description;
  const availableUnits = (project as any).available_units || (project as any).total_units;

  return (
    <Link href={href} className="block">
      <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative h-40 w-full">
          <Image
            src={image}
            alt={project.project_name}
            fill
            className="object-cover"
          />
          {isFeatured && (
            <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
              Featured
            </Badge>
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-foreground line-clamp-2 flex-1">
              {project.project_name}
            </h3>
          </div>
          
          {developerName && (
            <p className="text-xs text-muted-foreground">
              by <span className="font-medium text-foreground">{developerName}</span>
            </p>
          )}
          
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {typeof description === 'string' 
                ? description.replace(/<[^>]*>/g, '').substring(0, 100) + '...'
                : description}
            </p>
          )}
          
          {project.micro_market?.micro_market_name && (
            <p className="text-xs text-muted-foreground">
              {project.micro_market.micro_market_name}, {project.city?.city_name || "Hyderabad"}
            </p>
          )}
          
          <div className="flex items-center justify-between pt-2 border-t border-border">
            {project.price_range_text && (
              <p className="text-sm font-medium text-primary">
                {project.price_range_text}
              </p>
            )}
            {availableUnits && (
              <p className="text-xs text-muted-foreground">
                {availableUnits} Units Available
              </p>
            )}
          </div>
          
          <p className="text-xs text-primary font-medium hover:underline mt-2">
            View Project Details →
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}


