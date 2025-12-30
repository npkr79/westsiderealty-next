"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";

interface FeaturedProjectsProps {
  projects: any[];
}

export default function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  const [filter, setFilter] = useState<"All" | "Luxury" | "Investment">("All");

  if (projects.length === 0) return null;

  const filteredProjects =
    filter === "All"
      ? projects
      : projects.filter((p) => {
          // Simple filter logic - can be enhanced based on actual data
          if (filter === "Luxury") {
            return p.price_range_text?.includes("Cr") || p.price_range_text?.includes("Crore");
          }
          return true;
        });

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              FEATURED PROJECTS
            </h2>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-8 overflow-x-auto scrollbar-hide pb-2">
          {(["All", "Luxury", "Investment"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                filter === f
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => {
            const citySlug = project.city?.url_slug || "hyderabad";
            const microMarketSlug = project.micro_market?.url_slug;
            const projectUrl = microMarketSlug
              ? `/${citySlug}/${microMarketSlug}/projects/${project.url_slug}`
              : `/${citySlug}/projects/${project.url_slug}`;

            return (
              <div
                key={project.id}
                className="animate-fade-in-up hover:-translate-y-1 transition-transform duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Link href={projectUrl}>
                  <div className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
                    {/* Image */}
                    <div className="relative w-full h-56 bg-gradient-to-br from-blue-400 to-blue-600">
                      {project.hero_image_url ? (
                        <Image
                          src={project.hero_image_url}
                          alt={project.project_name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                          {project.project_name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        FEATURED
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                        {project.project_name}
                      </h3>
                      {project.developer && (
                        <p className="text-sm text-gray-600 mb-2">
                          by {project.developer.developer_name}
                        </p>
                      )}
                      {project.micro_market && (
                        <div className="flex items-center gap-1 text-gray-600 mb-3">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">
                            {project.micro_market.micro_market_name}
                          </span>
                        </div>
                      )}
                      {project.price_range_text && (
                        <p className="text-2xl font-bold text-blue-600 mb-2">
                          {project.price_range_text}
                        </p>
                      )}
                      {project.rera_link && (
                        <p className="text-xs text-gray-500 mt-auto">
                          RERA: {project.rera_link}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
