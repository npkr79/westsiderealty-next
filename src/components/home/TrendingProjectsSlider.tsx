"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface TrendingProject {
  id: string;
  name: string;
  price_range: string | null;
  location: string | null;
  image_url: string | null;
  slug: string;
  source: "project" | "landing";
  city_slug?: string;
  micro_market_slug?: string;
  available_units?: number;
}

export default function TrendingProjectsSlider() {
  const [projects, setProjects] = useState<TrendingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTrendingProjects = async () => {
      try {
        const supabase = createClient();

        // Query projects WHERE is_trending = true
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("id, project_name, price_range_text, hero_image_url, url_slug, micro_markets(micro_market_name)")
          .eq("is_trending", true)
          .limit(10);

        if (projectsError) {
          console.error("[TrendingProjectsSlider] Error fetching projects:", projectsError);
        }

        // Query landing_pages WHERE is_trending = true
        const { data: landingData, error: landingError } = await supabase
          .from("landing_pages")
          .select("id, title, hero_image_url, url_slug, micro_market")
          .eq("is_trending", true)
          .limit(10);

        if (landingError) {
          console.error("[TrendingProjectsSlider] Error fetching landing pages:", landingError);
        }

        // Transform projects data
        const transformedProjects: TrendingProject[] = (projectsData || []).map((p: any) => {
          // Handle micro_markets relation (can be array or object)
          const microMarket = Array.isArray(p.micro_markets) 
            ? p.micro_markets[0] 
            : p.micro_markets;

          return {
            id: p.id,
            name: p.project_name,
            price_range: p.price_range_text || null,
            location: microMarket?.micro_market_name || null,
            image_url: p.hero_image_url,
            slug: p.url_slug,
            source: "project" as const,
            city_slug: "hyderabad", // Default to hyderabad
            available_units: 12, // Default fallback
          };
        });

        // Transform landing pages data
        const transformedLanding: TrendingProject[] = (landingData || []).map((l: any) => ({
          id: l.id,
          name: l.title,
          price_range: null, // landing_pages doesn't have price_range
          location: l.micro_market || null,
          image_url: l.hero_image_url,
          slug: l.url_slug,
          source: "landing" as const,
        }));

        // Combine and randomly select 3 if more than 3
        const allTrending = [...transformedProjects, ...transformedLanding];
        const random3 = allTrending
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);

        console.log("[TrendingProjectsSlider] Found:", {
          projects: transformedProjects.length,
          landing: transformedLanding.length,
          total: allTrending.length,
          selected: random3.length,
        });

        setProjects(random3);
        
        if (random3.length === 0) {
          setError("No trending projects found. Please mark projects as trending in the database.");
        }
      } catch (error: any) {
        console.error("[TrendingProjectsSlider] Error fetching trending projects:", error);
        setError(error?.message || "Failed to load trending projects");
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingProjects();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const cardWidth = 320; // Approximate card width + gap
      const scrollAmount = cardWidth;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (loading) {
    return (
      <section className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-400">Loading trending projects...</div>
        </div>
      </section>
    );
  }

  if (error) {
    console.error("[TrendingProjectsSlider] Error state:", error);
  }

  if (projects.length === 0) {
    // Don't show section if no projects found
    return null;
  }

  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h2 className="text-center text-3xl md:text-4xl font-bold text-gray-900 mb-8">
          🔥 TRENDING PROJECTS
        </h2>

        {/* Desktop: 3 cards per row, Mobile: 1 card carousel */}
        <div className="relative">
          {/* Mobile: Carousel with scroll buttons */}
          <div className="md:hidden relative">
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
              style={{
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {projects.map((project, index) => {
                // Link: /hyderabad/{url_slug} for both projects and landing pages
                const projectUrl = `/hyderabad/${project.slug}`;

                return (
                  <div
                    key={project.id}
                    className="flex-shrink-0 w-[85vw] snap-start"
                  >
                    <TrendingCard project={project} url={projectUrl} />
                  </div>
                );
              })}
            </div>
            {/* Mobile scroll buttons */}
            {projects.length > 1 && (
              <>
                <button
                  onClick={() => scroll("left")}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-lg hover:bg-gray-50"
                  aria-label="Scroll left"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => scroll("right")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-lg hover:bg-gray-50"
                  aria-label="Scroll right"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Desktop: 3 cards grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {projects.map((project) => {
              // Link: /hyderabad/{url_slug} for both projects and landing pages
              const projectUrl = `/hyderabad/${project.slug}`;

              return (
                <TrendingCard key={project.id} project={project} url={projectUrl} />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrendingCard({ project, url }: { project: TrendingProject; url: string }) {
  return (
    <Link href={url} className="block group">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        {/* Image - 16:9 aspect ratio */}
        <div className="relative w-full aspect-video bg-gradient-to-br from-blue-400 to-blue-600">
          {project.image_url ? (
            <Image
              src={project.image_url}
              alt={project.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 85vw, (max-width: 1024px) 33vw, 400px"
              unoptimized={project.image_url.includes('supabase.co/storage')}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <Home className="w-12 h-12" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Title */}
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 line-clamp-2">
            {project.name}
          </h3>

          {/* Price */}
          {project.price_range ? (
            <p className="text-2xl md:text-3xl font-bold text-blue-600 mb-3">
              {project.price_range.includes('₹') ? project.price_range : `₹${project.price_range}`}
              {!project.price_range.includes('+') && !project.price_range.includes('Cr') && ' Cr+'}
            </p>
          ) : (
            <p className="text-lg md:text-xl font-semibold text-gray-600 mb-3">
              Contact for price
            </p>
          )}

          {/* Location */}
          {project.location && (
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm md:text-base">{project.location}</span>
            </div>
          )}

          {/* CTA Button */}
          <Button
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold"
            size="sm"
          >
            View {project.available_units || 12}+ units
          </Button>
        </div>
      </div>
    </Link>
  );
}
