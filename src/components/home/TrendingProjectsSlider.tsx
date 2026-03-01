"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MapPin, Home, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { createClient } from "@/lib/supabase/client";
import { getProjectPrimaryImage } from "@/lib/project-images";
import { resolveLandingPageHeroImage } from "@/lib/landing-page-images";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import { buildProjectUrl } from "@/lib/routes";

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
        const projectSelect =
          "id, project_name, price_range_text, hero_image_url, url_slug, micro_market_id, city_id, micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name), status, created_at";
        const landingSelect =
          "id, title, hero_image_url, hero_image_supabase_path, uri, location_info, status, created_at";

        // Primary source: explicitly marked trending
        let projectsData: any[] = [];
        const trendingProjects = await supabase
          .from("projects")
          .select(projectSelect)
          .eq("is_trending", true)
          .order("created_at", { ascending: false })
          .limit(10);
        if (!trendingProjects.error && Array.isArray(trendingProjects.data)) {
          projectsData = trendingProjects.data;
        }

        // Fallback source 1: featured/city-visible projects
        if (projectsData.length === 0) {
          const featuredProjects = await supabase
            .from("projects")
            .select(projectSelect)
            .or("show_on_city_page.eq.true,is_featured.eq.true")
            .or("status.ilike.published,status.ilike.%under construction%")
            .order("created_at", { ascending: false })
            .limit(10);
          if (!featuredProjects.error && Array.isArray(featuredProjects.data)) {
            projectsData = featuredProjects.data;
          }
        }

        // Fallback source 2: latest published/active projects
        if (projectsData.length === 0) {
          const latestProjects = await supabase
            .from("projects")
            .select(projectSelect)
            .or("status.ilike.published,status.ilike.%under construction%")
            .order("created_at", { ascending: false })
            .limit(10);
          if (!latestProjects.error && Array.isArray(latestProjects.data)) {
            projectsData = latestProjects.data;
          }
        }

        let landingData: any[] = [];
        const trendingLanding = await supabase
          .from("landing_pages")
          .select(landingSelect)
          .eq("is_trending", true)
          .order("created_at", { ascending: false })
          .limit(10);
        if (!trendingLanding.error && Array.isArray(trendingLanding.data)) {
          landingData = trendingLanding.data;
        }

        if (landingData.length === 0) {
          const publishedLanding = await supabase
            .from("landing_pages")
            .select(landingSelect)
            .eq("status", "published")
            .order("created_at", { ascending: false })
            .limit(10);
          if (!publishedLanding.error && Array.isArray(publishedLanding.data)) {
            landingData = publishedLanding.data;
          }
        }

        // Transform projects data
        const transformedProjects: TrendingProject[] = (projectsData || []).map((p: any) => {
          // Use getProjectPrimaryImage helper for proper image fallback
          const projectImage = getProjectPrimaryImage({
            hero_image_url: p.hero_image_url,
          });
          
          // Extract micro_market_name from relation
          const microMarket = p.micro_market;
          const locationName = Array.isArray(microMarket) 
            ? microMarket[0]?.micro_market_name 
            : microMarket?.micro_market_name;
          
          return {
            id: String(p.id),
            name: p.project_name || "Untitled Project",
            price_range: p.price_range_text || null,
            location: locationName || null,
            image_url: projectImage,
            slug: p.url_slug || String(p.id),
            source: "project" as const,
            city_slug: "hyderabad", // Default, can be enhanced later
            city_name: null,
          };
        });

        // Transform landing pages data
        const transformedLanding: TrendingProject[] = (landingData || []).map((l: any) => {
          // Use uri field (not url_slug which doesn't exist)
          let landingSlug = l.uri || String(l.id);
          
          // Map specific project names to their correct landing page URLs
          const projectName = (l.title || "").toLowerCase();
          if (projectName.includes("godrej regal pavilion")) {
            landingSlug = "godrej-regal-pavilion-rajendra-nagar-hyderabad";
          } else if (projectName.includes("aerocidade")) {
            landingSlug = "aerocidade-studio-apartments-dabolim";
          }
          
          // Resolve hero image URL using helper function
          // Landing pages may have hero_image_url as a storage path (not absolute URL) or
          // need URL construction from hero_image_supabase_path. This helper ensures we
          // always get a valid, accessible image URL for Next.js Image component.
          const resolvedImageUrl = resolveLandingPageHeroImage({
            hero_image_url: l.hero_image_url,
            hero_image_supabase_path: l.hero_image_supabase_path,
          });
          
          return {
            id: String(l.id),
            name: l.title || "Untitled Project",
            price_range: null, // price_display is in landing_page_configurations, not main table
            location: l.location_info || null, // Use location_info instead of micro_market
            image_url: resolvedImageUrl,
            slug: landingSlug,
            source: "landing" as const,
          };
        });

        // Merge and cap count for the carousel.
        const combined = [...transformedProjects, ...transformedLanding].slice(0, 10);
        setProjects(combined);
      } catch (error: any) {
        console.error("[TrendingProjectsSlider] Failed to fetch projects:", error);
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
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            🔥 Trending Projects
          </h2>
          <div className="text-center text-gray-400">Loading trending projects...</div>
        </div>
      </section>
    );
  }

  // Do not render empty-debug UI on production homepage.
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
            <div className="flex gap-4">
              {projects.map((project) => {
                // Special URL mapping for specific projects that should link to landing pages
                const projectName = project.name.toLowerCase();
                let projectUrl: string;
                
                if (projectName.includes("godrej regal pavilion")) {
                  projectUrl = "/landing/godrej-regal-pavilion-rajendra-nagar-hyderabad";
                } else if (projectName.includes("aerocidade")) {
                  projectUrl = "/landing/aerocidade-studio-apartments-dabolim";
                } else if (project.source === "project") {
                  // Guard against undefined city_slug or slug
                  const citySlug = project.city_slug || 'hyderabad';
                  const slug = project.slug;
                  if (!slug) {
                    projectUrl = `/landing/${project.slug}`;
                  } else {
                    projectUrl = buildProjectUrl(citySlug, slug);
                  }
                } else {
                  projectUrl = `/landing/${project.slug}`;
                }

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
  const imageSrc = project?.image_url || null;

  return (
    <Link href={url} className="block group h-full">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
        {/* Image - 16:9 aspect ratio */}
        <div className="relative w-full aspect-video bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0">
          <ImageWithFallback
            src={imageSrc}
            alt={project.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Trending Badge */}
          <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10">
            🔥 TRENDING
          </div>
        </div>

        {/* Content - flex-grow to fill remaining space */}
        <div className="p-4 md:p-5 flex-grow flex flex-col">
          {/* Title - Modern styling */}
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {project.name}
          </h3>

          {/* Location - Show before price */}
          {project.location && (
            <div className="flex items-center gap-1.5 text-gray-500 mb-2">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs md:text-sm line-clamp-1">{project.location}</span>
            </div>
          )}

          {/* Price */}
          <div className="mt-auto">
            {project.price_range ? (
              <p className="text-lg md:text-xl font-bold text-blue-600">
                {project.price_range.includes('₹') ? project.price_range : `₹${project.price_range}`}
                {!project.price_range.includes('+') && !project.price_range.includes('Cr') && !project.price_range.includes('onwards') && ' onwards'}
              </p>
            ) : (
              <p className="text-sm md:text-base font-medium text-gray-500">
                Contact for price
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
