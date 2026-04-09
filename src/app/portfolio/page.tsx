import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { PortfolioClient, type FocusProject } from "@/components/portfolio/PortfolioClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Active Portfolio | Projects We Market | Westside Realty",
  description:
    "Developer partnerships and live inventory across Hyderabad and Goa. Every project here has a dedicated advisor, floor plan access, and direct developer pricing.",
  alternates: { canonical: "https://www.westsiderealty.in/portfolio" },
  keywords: "westside realty portfolio, active projects hyderabad goa, goa villa investments, luxury apartments hyderabad",
  openGraph: {
    title: "Active Portfolio | Westside Realty",
    description: "Projects we actively market — developer partnerships, live inventory, dedicated advisors.",
    url: "https://www.westsiderealty.in/portfolio",
    siteName: "RE/MAX Westside Realty",
    type: "website",
  },
};

async function getFocusProjects(): Promise<FocusProject[]> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("advisor_project_intelligence")
      .select(
        "id, project_name, project_slug, project_type, current_status, developer_brand, micro_market, micro_market_slug, city, city_slug, current_price_per_sqft_min, current_price_per_sqft_max, total_units, primary_differentiator, investment_verdict, quality_score, needs_review, hero_image_url"
      )
      .eq("is_focus_project", true)
      .eq("sale_status", "active")
      .order("quality_score", { ascending: false });

    if (error) {
      console.error("[Portfolio] Supabase error:", error);
      return [];
    }

    return (data ?? []) as FocusProject[];
  } catch (err) {
    console.error("[Portfolio] Unexpected error:", err);
    return [];
  }
}

export default async function PortfolioPage() {
  const projects = await getFocusProjects();

  return <PortfolioClient projects={projects} />;
}
