"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Home, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
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
  city_name?: string;
}

export default function TrendingProjectsSlider() {
  const [projects, setProjects] = useState<TrendingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: "start",
    slidesToScroll: 1,
  });

  // Auto-scroll functionality with pause on hover
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!emblaApi || isPaused) return;

    const autoplay = () => {
      if (!isPaused) {
        emblaApi.scrollNext();
      }
    };

    const interval = setInterval(autoplay, 4000); // Auto-scroll every 4 seconds

    return () => clearInterval(interval);
  }, [emblaApi, isPaused]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Reinitialize carousel when projects change
  useEffect(() => {
    if (emblaApi && projects.length > 0) {
      emblaApi.reInit();
    }
  }, [emblaApi, projects.length]);

  useEffect(() => {
    const fetchTrendingProjects = async () => {
      try {
        const supabase = createClient();

        console.log("[TrendingProjectsSlider] Starting to fetch trending projects...");

        // Query projects WHERE is_trending = true
        // Simplified query without relations first to avoid errors
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("id, project_name, price_range_text, hero_image_url, url_slug, micro_market_id, city_id")
          .eq("is_trending", true)
          .order("created_at", { ascending: false })
          .limit(10);

        console.log("[TrendingProjectsSlider] Projects query result:", {
          data: projectsData,
          error: projectsError,
          count: projectsData?.length || 0
        });

        if (projectsError) {
          console.error("[TrendingProjectsSlider] Error fetching projects:", projectsError);
        }

        // Query landing_pages WHERE is_trending = true
        // Try both uri and url_slug fields
        const { data: landingData, error: landingError } = await supabase
          .from("landing_pages")
          .select("id, title, hero_image_url, uri, url_slug, micro_market, price_display")
          .eq("is_trending", true)
          .order("created_at", { ascending: false })
          .limit(10);

        console.log("[TrendingProjectsSlider] Landing pages query result:", {
          data: landingData,
          error: landingError,
          count: landingData?.length || 0
        });

        if (landingError) {
          console.error("[TrendingProjectsSlider] Error fetching landing pages:", landingError);
        }

        // Transform projects data
        const transformedProjects: TrendingProject[] = (projectsData || []).map((p: any) => {
          return {
            id: String(p.id),
            name: p.project_name || "Untitled Project",
            price_range: p.price_range_text || null,
            location: null, // Will be fetched separately if needed
            image_url: p.hero_image_url,
            slug: p.url_slug || String(p.id),
            source: "project" as const,
            city_slug: "hyderabad", // Default, can be enhanced later
            city_name: null,
          };
        });

        // Transform landing pages data
        const transformedLanding: TrendingProject[] = (landingData || []).map((l: any) => {
          // Special handling for specific landing pages with custom URLs
          let landingSlug = l.uri || l.url_slug || String(l.id);
          
          // Map specific project names to their correct landing page URLs
          const projectName = (l.title || "").toLowerCase();
          if (projectName.includes("godrej regal pavilion")) {
            landingSlug = "godrej-regal-pavilion-rajendra-nagar-hyderabad";
          } else if (projectName.includes("aerocidade")) {
            landingSlug = "aerocidade-studio-apartments-dabolim";
          }
          
          return {
            id: String(l.id),
            name: l.title || "Untitled Project",
            price_range: l.price_display || null,
            location: l.micro_market || null,
            image_url: l.hero_image_url,
            slug: landingSlug,
            source: "landing" as const,
          };
        });

        // Combine and sort by created_at descending (already sorted in query)
        const combined = [...transformedProjects, ...transformedLanding].slice(0, 10);

        console.log("[TrendingProjectsSlider] Final combined result:", {
          projectsCount: transformedProjects.length,
          landingCount: transformedLanding.length,
          totalCount: combined.length,
          combined: combined.map(p => ({ id: p.id, name: p.name, slug: p.slug }))
        });

        if (combined.length > 0) {
          setProjects(combined);
          console.log("[TrendingProjectsSlider] ✅ Projects set successfully:", combined.length);
        } else {
          console.warn("[TrendingProjectsSlider] ⚠️ No projects to display!");
        }
      } catch (error: any) {
        console.error("[TrendingProjectsSlider] CRITICAL ERROR fetching trending projects:", error);
        console.error("[TrendingProjectsSlider] Error stack:", error?.stack);
      } finally {
        setLoading(false);
        console.log("[TrendingProjectsSlider] Loading complete");
      }
    };

    fetchTrendingProjects();
  }, []);

  if (loading) {
    return (
      <section className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            🔥 Trending Projects
          </h2>
          <div className="text-center text-gray-400">Loading trending projects...</div>
        </div>
      </section>
    );
  }

  // Always show section, even if empty (for debugging)
  if (projects.length === 0) {
    return (
      <section className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            🔥 Trending Projects
          </h2>
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-2">No trending projects found.</p>
            <p className="text-gray-400 text-sm">
              Please mark projects with <code className="bg-gray-100 px-2 py-1 rounded">is_trending = true</code> in the database.
            </p>
            <p className="text-gray-400 text-xs mt-4">
              Check browser console for detailed query results.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      className="py-12 px-4 bg-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            🔥 Trending Projects
          </h2>
        </div>

        {/* Embla Carousel */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {projects.map((project) => {
                const projectUrl = project.source === "project"
                  ? `/${project.city_slug}/projects/${project.slug}`
                  : `/landing/${project.slug}`;

                return (
                  <div
                    key={project.id}
                    className="flex-[0_0_100%] sm:flex-[0_0_calc(50%-0.5rem)] lg:flex-[0_0_calc(33.333%-1rem)] min-w-0"
                  >
                    <TrendingCard project={project} url={projectUrl} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Arrows */}
          {projects.length > 1 && (
            <>
              <button
                onClick={scrollPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors -translate-x-4"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors translate-x-4"
                aria-label="Next slide"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function TrendingCard({ project, url }: { project: TrendingProject; url: string }) {
  return (
    <Link href={url} className="block group h-full">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
        {/* Image - 16:9 aspect ratio */}
        <div className="relative w-full aspect-video bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0">
          {project.image_url ? (
            <Image
              src={project.image_url}
              alt={project.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized={project.image_url.includes('supabase.co/storage')}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <Home className="w-12 h-12" />
            </div>
          )}
          {/* Trending Badge */}
          <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10">
            🔥 TRENDING
          </div>
        </div>

        {/* Content - flex-grow to fill remaining space */}
        <div className="p-5 flex-grow flex flex-col">
          {/* Title */}
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 line-clamp-2 min-h-[3.5rem]">
            {project.name}
          </h3>

          {/* Price */}
          <div className="mb-3">
            {project.price_range ? (
              <p className="text-xl md:text-2xl font-bold text-blue-600">
                {project.price_range.includes('₹') ? project.price_range : `₹${project.price_range}`}
                {!project.price_range.includes('+') && !project.price_range.includes('Cr') && ' Cr+'}
              </p>
            ) : (
              <p className="text-lg md:text-xl font-semibold text-gray-600">
                Contact for price
              </p>
            )}
          </div>

          {/* Location - push to bottom */}
          <div className="mt-auto">
            {project.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm md:text-base line-clamp-1">{project.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
