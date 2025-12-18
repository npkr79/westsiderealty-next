"use client";

import { useEffect, useState } from "react";
import ProjectCard from "@/components/properties/ProjectCard";
import { projectService, type ProjectInfo } from "@/services/projectService";

interface RelatedProjectsSectionProps {
  currentProjectId: string;
  microMarketId?: string;
  microMarketName?: string;
  developerId?: string;
  citySlug: string;
}

export default function RelatedProjectsSection({
  currentProjectId,
  microMarketId,
  microMarketName,
  developerId,
  citySlug,
}: RelatedProjectsSectionProps) {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch projects by city and filter client-side
        const all = await projectService.getProjectsByCity(citySlug);
        const filtered =
          all?.filter((p: any) => p.id !== currentProjectId).slice(0, 6) || [];
        setProjects(filtered);
      } catch (error) {
        console.error("Error loading related projects:", error);
        setProjects([]);
      }
    };

    load();
  }, [citySlug, currentProjectId]);

  if (!projects.length) return null;

  return (
    <section id="related-projects" className="mt-16 space-y-4">
      <h2 className="text-2xl font-semibold text-foreground">
        Other projects you may like
        {microMarketName ? ` in ${microMarketName}` : ""}
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          // Use city slug from project or fallback to prop
          const projectCitySlug = (project as any).city?.url_slug || citySlug;
          return (
            <ProjectCard 
              key={project.id} 
              project={project as any} 
              citySlug={projectCitySlug} 
            />
          );
        })}
      </div>
    </section>
  );
}


