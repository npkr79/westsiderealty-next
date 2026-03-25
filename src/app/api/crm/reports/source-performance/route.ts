import { NextRequest, NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export async function GET(req: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");

  const supabase = createServiceClient();

  let query = supabase
    .from("crm_leads")
    .select("id, status, source_channel, source_type, source_id");
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lt("created_at", dateTo);

  const { data: leads, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch source names
  const { data: sources } = await supabase
    .from("crm_lead_sources")
    .select("id, name");
  const sourceMap = Object.fromEntries(
    (sources ?? []).map((s: { id: string; name: string }) => [s.id, s.name])
  );

  const sourceLabels: Record<string, string> = {
    facebook_lead_ads: "Meta Ads", meta_ads: "Meta Ads", meta: "Meta Ads",
    facebook: "Meta Ads", fb_ads: "Meta Ads",
    website_form: "Website", website: "Website", organic_landing: "Organic",
    google_ads: "Google Ads", referral: "Referral", channel: "Channel Partner",
    manual: "Manual",
  };

  // FIX 4: Normalize Facebook/Meta variations to "Meta Ads"
  function normalizeMeta(name: string): string {
    const lower = name.toLowerCase();
    if (
      lower === "facebook ads" || lower === "facebook" ||
      lower === "fb ads" || lower === "meta" ||
      lower === "meta ads"
    ) return "Meta Ads";
    return name;
  }

  function resolveSource(lead: Record<string, unknown>): string {
    if (lead.source_id && sourceMap[lead.source_id as string]) {
      return normalizeMeta(sourceMap[lead.source_id as string]);
    }
    const raw = (lead.source_channel as string) || (lead.source_type as string) || "";
    const label = sourceLabels[raw] ??
      (raw ? raw.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Unknown");
    return normalizeMeta(label);
  }

  const grouped: Record<string, { total: number; contacted: number; site_visits: number; won: number }> = {};

  for (const lead of leads ?? []) {
    const src = resolveSource(lead as Record<string, unknown>);
    if (!grouped[src]) grouped[src] = { total: 0, contacted: 0, site_visits: 0, won: 0 };
    grouped[src].total++;
    const status = (lead as { status: string | null }).status ?? "new";
    if (!["new", "not_connected"].includes(status)) grouped[src].contacted++;
    if (status === "site_visit") grouped[src].site_visits++;
    if (status === "won" || status === "converted") grouped[src].won++;
  }

  const rows = Object.entries(grouped)
    .map(([source, d]) => ({
      source,
      total: d.total,
      contacted: d.contacted,
      site_visits: d.site_visits,
      won: d.won,
      conversion_rate: d.total > 0 ? parseFloat((d.won / d.total * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return NextResponse.json({ sources: rows });
}
