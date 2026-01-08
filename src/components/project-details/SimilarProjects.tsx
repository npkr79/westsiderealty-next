"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { projectService, type ProjectWithRelations } from "@/services/projectService";
import ImageWithFallback from "@/components/common/ImageWithFallback";

interface SimilarProjectsProps {
  currentProjectId: string;
  microMarketId?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  citySlug: string;
  microMarketSlug?: string;
}

export default function SimilarProjects({
  currentProjectId,
  microMarketId,
  priceMin,
  priceMax,
  citySlug,
  microMarketSlug,
}: SimilarProjectsProps) {
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSimilar = async () => {
      try {
        let similar: ProjectWithRelations[] = [];

        // First try: Same micro-market
        if (microMarketId) {
          similar = await projectService.getRelatedProjectsByMicroMarketId(String(microMarketId));
        }

        // Filter by price range (±20%)
        if (similar.length > 0 && (priceMin || priceMax)) {
          const minPrice = priceMin ? priceMin * 0.8 : undefined;
          const maxPrice = priceMax ? priceMax * 1.2 : undefined;

          similar = similar.filter((p) => {
            // Try to parse price from price_range_text or price_min/price_max
            const pMin = (p as any).price_min;
            const pMax = (p as any).price_max;

            if (pMin && minPrice && pMin < minPrice) return false;
            if (pMax && maxPrice && pMax > maxPrice) return false;
            return true;
          });
        }

        // Filter out current project and limit to 4-6
        similar = similar
          .filter((p) => p.id && String(p.id) !== String(currentProjectId))
          .slice(0, 6);

        setProjects(similar);
      } catch (error) {
        console.error("[SimilarProjects] Error loading similar projects:", error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadSimilar();
  }, [currentProjectId, microMarketId, priceMin, priceMax, citySlug]);

  if (loading || projects.length === 0) return null;

  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Similar Projects</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {projects.map((project) => {
          if (!project.url_slug) return null;

          const projectCitySlug = project.city?.url_slug || citySlug;
          const href = microMarketSlug && project.micro_market?.url_slug === microMarketSlug
            ? `/${projectCitySlug}/${microMarketSlug}/projects/${project.url_slug}`
            : `/${projectCitySlug}/projects/${project.url_slug}`;

          return (
            <Link
              key={project.id}
              href={href}
              className="block flex-shrink-0 w-[280px]"
            >
              <Card className="overflow-hidden transition-shadow hover:shadow-lg h-full">
                <div className="aspect-video bg-muted relative">
                  <ImageWithFallback
                    src={project.hero_image_url}
                    alt={`${project.project_name} project`}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="space-y-2 p-4">
                  <div className="font-semibold text-foreground line-clamp-2">{project.project_name}</div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {project.micro_market?.micro_market_name}
                      {project.city?.city_name ? `, ${project.city.city_name}` : ""}
                    </span>
                  </div>
                  {project.price_range_text && (
                    <div className="text-sm font-semibold text-primary">{project.price_range_text}</div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
