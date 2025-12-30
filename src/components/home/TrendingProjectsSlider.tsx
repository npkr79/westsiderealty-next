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

  useEffect(() => {
    const fetchTrendingProjects = async () => {
      try {
        const supabase = createClient();

        // Query projects WHERE is_trending = true
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select(`
            id,
            project_name,
            price_range_text,
            hero_image_url,
            url_slug,
            micro_markets(micro_market_name),
            cities(city_name, url_slug)
          `)
          .eq("is_trending", true)
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(10);

        if (projectsError) {
          console.error("[TrendingProjectsSlider] Error fetching projects:", projectsError);
        }

        // Query landing_pages WHERE is_trending = true
        const { data: landingData, error: landingError } = await supabase
          .from("landing_pages")
          .select(`
            id,
            title,
            hero_image_url,
            url_slug,
            micro_market,
            price_display
          `)
          .eq("is_trending", true)
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(10);

        if (landingError) {
          console.error("[TrendingProjectsSlider] Error fetching landing pages:", landingError);
        }

        // Transform projects data
        const transformedProjects: TrendingProject[] = (projectsData || []).map((p: any) => {
          const microMarket = Array.isArray(p.micro_markets) 
            ? p.micro_markets[0] 
            : p.micro_markets;
          const city = Array.isArray(p.cities) 
            ? p.cities[0] 
            : p.cities;

          return {
            id: p.id,
            name: p.project_name,
            price_range: p.price_range_text || null,
            location: microMarket?.micro_market_name || null,
            image_url: p.hero_image_url,
            slug: p.url_slug,
            source: "project" as const,
            city_slug: city?.url_slug || "hyderabad",
            city_name: city?.city_name || null,
          };
        });

        // Transform landing pages data
        const transformedLanding: TrendingProject[] = (landingData || []).map((l: any) => ({
          id: l.id,
          name: l.title || l.project_name,
          price_range: l.price_display || null,
          location: l.micro_market || null,
          image_url: l.hero_image_url,
          slug: l.url_slug || l.slug,
          source: "landing" as const,
        }));

        // Combine and sort by created_at descending (already sorted in query)
        const combined = [...transformedProjects, ...transformedLanding].slice(0, 10);

        console.log("[TrendingProjectsSlider] Loaded", combined.length, "trending projects");
        setProjects(combined);
      } catch (error: any) {
        console.error("[TrendingProjectsSlider] Error fetching trending projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingProjects();
  }, []);

  if (loading) {
    return (
      <section className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-400">Loading trending projects...</div>
        </div>
      </section>
    );
  }

  if (projects.length === 0) {
    return null;
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
            <div className="flex -ml-4">
              {projects.map((project) => {
                const projectUrl = project.source === "project"
                  ? `/${project.city_slug}/projects/${project.slug}`
                  : `/landing/${project.slug}`;

                return (
                  <div
                    key={project.id}
                    className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] xl:flex-[0_0_25%] min-w-0 pl-4"
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
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors"
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
    <Link href={url} className="block group">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-full">
        {/* Image - 16:9 aspect ratio */}
        <div className="relative w-full aspect-video bg-gradient-to-br from-blue-400 to-blue-600">
          {project.image_url ? (
            <Image
              src={project.image_url}
              alt={project.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              unoptimized={project.image_url.includes('supabase.co/storage')}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <Home className="w-12 h-12" />
            </div>
          )}
          {/* Trending Badge */}
          <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            🔥 TRENDING
          </div>
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
        </div>
      </div>
    </Link>
  );
}
