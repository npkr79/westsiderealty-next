"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, MapPin, TrendingUp } from "lucide-react";

interface TrendingProjectsProps {
  projects: any[];
}

export default function TrendingProjects({ projects }: TrendingProjectsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (projects.length === 0) return null;

  return (
    <section className="py-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900">
              TOP TRENDING RIGHT NOW
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {projects.map((project, index) => {
            const citySlug = project.city?.url_slug || "hyderabad";
            const microMarketSlug = project.micro_market?.url_slug;
            const projectUrl = microMarketSlug
              ? `/${citySlug}/${microMarketSlug}/projects/${project.url_slug}`
              : `/${citySlug}/projects/${project.url_slug}`;

            return (
              <div
                key={project.id}
                className="flex-shrink-0 w-[85vw] sm:w-[400px] snap-start animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Link href={projectUrl}>
                  <div className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                    {/* Image */}
                    <div className="relative w-full h-48 bg-gradient-to-br from-blue-400 to-blue-600">
                      {project.hero_image_url ? (
                        <Image
                          src={project.hero_image_url}
                          alt={project.project_name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 85vw, 400px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                          {project.project_name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        🔥 TRENDING
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                        {project.project_name}
                      </h3>
                      {project.micro_market && (
                        <div className="flex items-center gap-1 text-gray-600 mb-3">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">
                            {project.micro_market.micro_market_name}
                          </span>
                        </div>
                      )}
                      {project.price_range_text && (
                        <p className="text-2xl font-bold text-blue-600 mb-3">
                          {project.price_range_text}
                        </p>
                      )}
                      {project.listing_count && (
                        <p className="text-sm text-gray-600">
                          View {project.listing_count} units available
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
