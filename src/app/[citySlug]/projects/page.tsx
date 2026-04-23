import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import CityProjectsContent, { type ProjectItem, type MicroMarketOption } from "./CityProjectsContent";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ citySlug: string }>;
  searchParams: Promise<{ search?: string; status?: string; microMarket?: string }>;
}

// Map URL status param → completion_status DB values
const STATUS_MAP: Record<string, string[]> = {
  new_launch:         ["new_launch", "pre_launch"],
  under_construction: ["under_construction"],
  near_completion:    ["near_completion"],
  ready_to_move:      ["ready_to_move", "completed", "possession", "possession_started"],
  // legacy aliases
  ready:              ["ready_to_move", "completed", "possession", "possession_started"],
  published:          ["ready_to_move", "completed"],
  "under-construction": ["under_construction"],
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { citySlug } = await params;
  const sp = await searchParams;
  const supabase = createServiceClient();

  const { data: city } = await supabase
    .from("cities")
    .select("city_name, seo_title, meta_description")
    .eq("url_slug", citySlug)
    .maybeSingle();

  if (!city) return { title: "Projects Not Found" };

  const hasFilters = !!(sp.status || sp.search || sp.microMarket);
  const canonicalUrl = `https://www.westsiderealty.in/${citySlug}/projects`;

  return {
    ...buildMetadata({
      title: city.seo_title
        ? `${city.seo_title} | Westside Realty`
        : `All Projects in ${city.city_name} — RERA Verified | Westside Realty`,
      description:
        city.meta_description ||
        `Browse RERA-verified residential & commercial projects in ${city.city_name}. Compare prices, floor plans & expert advisory by Westside Realty.`,
      canonicalUrl,
    }),
    robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export async function generateStaticParams() {
  const { createBuildClient } = await import("@/lib/supabase/buildClient");
  const supabase = createBuildClient();
  // Include all active cities (published + draft) so dynamic city pages render at build time
  // rather than failing with 500 on first on-demand render
  const { data: cities } = await supabase.from("cities").select("url_slug");
  return cities?.map((city) => ({ citySlug: city.url_slug })) ?? [];
}

export default async function CityProjectsPage({ params, searchParams }: PageProps) {
  const { citySlug } = await params;
  const sp = await searchParams;
  const supabase = createServiceClient();

  // City lookup
  const { data: city } = await supabase
    .from("cities")
    .select("id, city_name, url_slug")
    .eq("url_slug", citySlug)
    .maybeSingle();

  if (!city) notFound();

  const activeStatus = sp.status ?? "";
  const activeMicroMarket = sp.microMarket ?? "";
  const searchQuery = sp.search ?? "";

  // Resolve micro market ID if filter active
  let microMarketId: string | null = null;
  if (activeMicroMarket) {
    const { data: mm } = await supabase
      .from("micro_markets")
      .select("id")
      .eq("url_slug", activeMicroMarket)
      .eq("city_id", city.id)
      .maybeSingle();
    microMarketId = mm?.id ?? null;
  }

  // Build project query
  let query = supabase
    .from("projects")
    .select(`
      id,
      project_name,
      url_slug,
      hero_image_url,
      price_range_text,
      completion_status,
      micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
      developer:developers(developer_name)
    `)
    .eq("city_id", city.id)
    .eq("page_status", "published")
    .order("created_at", { ascending: false })
    .limit(120);

  // Apply status filter
  const statusValues = STATUS_MAP[activeStatus];
  if (statusValues?.length) {
    query = query.in("completion_status", statusValues);
  }

  // Apply micro-market filter
  if (microMarketId) {
    query = query.eq("micro_market_id", microMarketId);
  }

  // Apply search filter server-side
  if (searchQuery) {
    query = query.ilike("project_name", `%${searchQuery}%`);
  }

  // Fetch micro-markets for dropdown
  const [{ data: rawProjects }, { data: rawMicroMarkets }] = await Promise.all([
    query,
    supabase
      .from("micro_markets")
      .select("id, micro_market_name, url_slug")
      .eq("city_id", city.id)
      .order("micro_market_name"),
  ]);

  // Normalize projects
  const projects: ProjectItem[] = (rawProjects ?? []).map((p: any) => {
    const mm = Array.isArray(p.micro_market) ? p.micro_market[0] : p.micro_market;
    const dev = Array.isArray(p.developer) ? p.developer[0] : p.developer;
    return {
      id: p.id,
      project_name: p.project_name,
      url_slug: p.url_slug,
      hero_image_url: p.hero_image_url ?? null,
      price_range_text: p.price_range_text ?? null,
      completion_status: p.completion_status ?? null,
      micro_market_name: mm?.micro_market_name ?? null,
      micro_market_slug: mm?.url_slug ?? null,
      developer_name: dev?.developer_name ?? null,
    };
  });

  const microMarkets: MicroMarketOption[] = (rawMicroMarkets ?? []).map((m: any) => ({
    id: m.id,
    micro_market_name: m.micro_market_name,
    url_slug: m.url_slug,
  }));

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${city.city_name} Real Estate Projects`,
    description: `Premium RERA-verified residential projects in ${city.city_name}`,
    url: `https://www.westsiderealty.in/${citySlug}/projects`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: projects.slice(0, 10).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.project_name,
        url: `https://www.westsiderealty.in/${citySlug}/projects/${p.url_slug}`,
      })),
    },
  };

  return (
    <>
      <JsonLd jsonLd={jsonLd} />
      <Suspense>
        <CityProjectsContent
          projects={projects}
          microMarkets={microMarkets}
          citySlug={citySlug}
          cityName={city.city_name}
          activeStatus={activeStatus}
          activeMicroMarket={activeMicroMarket}
          searchQuery={searchQuery}
        />
      </Suspense>
    </>
  );
}
