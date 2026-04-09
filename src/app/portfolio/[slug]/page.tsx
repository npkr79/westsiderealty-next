import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { PortfolioDetailClient } from "@/components/portfolio/PortfolioDetailClient";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FocusProjectDetail {
  id: string;
  project_name: string;
  project_slug: string;
  rera_id: string | null;
  project_type: string | null;
  current_status: string | null;
  developer_brand: string | null;
  developer_brand_slug: string | null;
  developer_years_in_business: number | null;
  developer_total_projects: number | null;
  developer_reputation_notes: string | null;
  micro_market: string | null;
  city: string | null;
  city_slug: string | null;
  locality: string | null;
  latitude: number | null;
  longitude: number | null;
  current_price_per_sqft_min: number | null;
  current_price_per_sqft_max: number | null;
  total_units: number | null;
  land_area_acres: number | null;
  possession_date: string | null;
  total_floors_max: number | null;
  primary_differentiator: string | null;
  investment_verdict: string | null;
  verdict_bull_case: string | null;
  verdict_bear_case: string | null;
  verdict_risk_factors: string[] | null;
  sub_zone: string | null;
  target_buyer_segment: string | null;
  developer_reputation_notes: string | null;
  developer_years_in_business: number | null;
  developer_total_projects: number | null;
  pool_details: string | null;
  clubhouse_sqft: number | null;
  special_amenities: string[] | null;
  sports_amenities: string[] | null;
  dist_airport_km: number | null;
  dist_financial_district_km: number | null;
  infra_upcoming: string[] | null;
  hero_image_url: string | null;
  gallery_image_urls: string[] | null;
  official_website: string | null;
  needs_review: boolean;
  review_notes: string | null;
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getProject(slug: string): Promise<FocusProjectDetail | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("advisor_project_intelligence")
    .select("*")
    .eq("project_slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data as FocusProjectDetail;
}

// ─── Static params (pre-render all focus projects) ───────────────────────────

export async function generateStaticParams() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("advisor_project_intelligence")
    .select("project_slug")
    .eq("is_focus_project", true);

  return (data ?? []).map((p: { project_slug: string }) => ({ slug: p.project_slug }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Project Not Found | Westside Realty" };

  const city = project.city ?? "India";
  const title = `${project.project_name} in ${project.micro_market ?? city} | Westside Realty`;
  const description =
    project.primary_differentiator ??
    `${project.project_name} — ${project.project_type ?? "project"} by ${project.developer_brand ?? "a top developer"} in ${project.micro_market ?? city}.`;

  return {
    title,
    description,
    alternates: { canonical: `https://www.westsiderealty.in/portfolio/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://www.westsiderealty.in/portfolio/${slug}`,
      siteName: "RE/MAX Westside Realty",
      images: project.hero_image_url ? [{ url: project.hero_image_url }] : [],
      type: "website",
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  return <PortfolioDetailClient project={project} />;
}
