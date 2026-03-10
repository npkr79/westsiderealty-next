import { requireCrmUser } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import SeoHealthClient from "./SeoHealthClient";

export interface HealthResult {
  url: string;
  status_code: number;
  response_time_ms: number;
  checked_at: string;
  is_broken: boolean;
}

export interface SiteHealthReport {
  id: string;
  checked_at: string;
  total_pages: number;
  broken_count: number;
  results: HealthResult[];
}

export default async function SeoHealthPage() {
  await requireCrmUser(["admin"]);

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("site_health_reports")
    .select("*")
    .order("checked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return <SeoHealthClient initialReport={data as SiteHealthReport | null} />;
}
