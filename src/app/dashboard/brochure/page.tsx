import { requireCrmUser } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import BrochureGeneratorClient from "@/components/brochure/BrochureGeneratorClient";

export const dynamic = "force-dynamic";

async function getRecentBrochures() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("brochure_links")
    .select("id, token, title, filters, view_count, last_viewed_at, created_at, expires_at, is_active")
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

async function getFocusProjects() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("advisor_project_intelligence")
    .select("project_name, project_slug, project_type, current_status, micro_market, city_slug, current_price_per_sqft_min, current_price_per_sqft_max, price_min_cr, price_max_cr, unit_configs, total_units, hero_image_url, primary_differentiator, is_focus_project")
    .eq("is_focus_project", true)
    .eq("sale_status", "active")
    .order("quality_score", { ascending: false });
  return data ?? [];
}

export default async function BrochurePage() {
  const user = await requireCrmUser(["admin", "sales_head", "team_lead", "agent"]);
  const [recentBrochures, focusProjects] = await Promise.all([
    getRecentBrochures(),
    getFocusProjects(),
  ]);

  return (
    <BrochureGeneratorClient
      user={{ name: user.full_name ?? "Advisor", role: user.role }}
      recentBrochures={recentBrochures}
      focusProjects={focusProjects}
    />
  );
}
