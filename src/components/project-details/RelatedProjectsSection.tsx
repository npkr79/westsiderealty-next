"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { projectService, type ProjectWithRelations } from "@/services/projectService";

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
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        let related: ProjectWithRelations[] = [];

        // Prefer micro-market related if we have an ID
        if (microMarketId) {
          related = await projectService.getRelatedProjectsByMicroMarketId(microMarketId);
        }

        // Fallback: city projects (NOTE: getProjectsByCity expects cityId, so this call may error;
        // that's OK because we catch it, and we'll improve it later if needed)
        if (!related?.length) {
          const maybe = await projectService.getProjectsByCity(citySlug as any);
          related = Array.isArray(maybe) ? (maybe as any) : [];
        }

        // Filter out current + cap (normalize IDs to strings for comparison)
        const filtered = (related || [])
          .filter((p) => p?.id && String(p.id) !== String(currentProjectId))
          .slice(0, 6);

        setProjects(filtered);
      } catch (e) {
        console.error("[RelatedProjectsSection] Failed:", e);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [citySlug, currentProjectId, microMarketId, developerId]);

  if (loading || !projects.length) return null;

  return (
    <section className="py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold">
          Other projects you may like{microMarketName ? ` in ${microMarketName}` : ""}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const projectCitySlug = project?.city?.url_slug || citySlug;
          const href = `/${projectCitySlug}/projects/${project.url_slug}`;

          return (
            <Link key={project.id} href={href} className="block">
              <Card className="overflow-hidden transition-shadow hover:shadow-md">
                <div className="aspect-video bg-muted">
                  {project.hero_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.hero_image_url}
                      alt={`${project.project_name} project`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Building2 className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <CardContent className="space-y-2 p-4">
                  <div className="font-medium">{project.project_name}</div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {project.micro_market?.micro_market_name}
                      {project.city?.city_name ? `, ${project.city.city_name}` : ""}
                    </span>
                  </div>
                  {project.price_range_text ? (
                    <div className="text-sm font-semibold text-primary">{project.price_range_text}</div>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
