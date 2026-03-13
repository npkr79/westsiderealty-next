import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

const CHUNK = 100;
const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Step 1: All Goa rera_project IDs + count
    const { data: goaRows, count: goaCount } = await supabase
      .from("rera_projects")
      .select("id", { count: "exact" })
      .eq("city_slug", "goa");

    const goaIds = ((goaRows ?? []) as { id: string }[]).map((r) => r.id).filter(Boolean);
    if (!goaIds.length) {
      return NextResponse.json({ developers: [], projectCount: 0 });
    }

    // Step 2: rera_promoters for those projects (chunked)
    const allPromoterRows: { rera_project_id: string; organization_name: string | null; organization_name_normalized: string | null }[] = [];
    for (let i = 0; i < goaIds.length; i += CHUNK) {
      const { data: chunk } = await supabase
        .from("rera_promoters")
        .select("rera_project_id, organization_name, organization_name_normalized")
        .in("rera_project_id", goaIds.slice(i, i + CHUNK));
      if (chunk) allPromoterRows.push(...(chunk as typeof allPromoterRows));
    }

    // Build orgName → [projectIds] map
    const orgToProjects = new Map<string, string[]>();
    for (const row of allPromoterRows) {
      const name = row.organization_name_normalized ?? (row.organization_name ? norm(row.organization_name) : null);
      if (!name) continue;
      if (!orgToProjects.has(name)) orgToProjects.set(name, []);
      orgToProjects.get(name)!.push(row.rera_project_id);
    }
    const orgNames = [...orgToProjects.keys()];
    if (!orgNames.length) {
      return NextResponse.json({ developers: [], projectCount: goaCount ?? 0 });
    }

    // Step 3: developer_brand_entities matching those org names (chunked)
    const allEntityRows: { brand_id: string | null; legal_entity_name_normalized: string | null }[] = [];
    for (let i = 0; i < orgNames.length; i += CHUNK) {
      const { data: chunk } = await supabase
        .from("developer_brand_entities")
        .select("brand_id, legal_entity_name_normalized")
        .in("legal_entity_name_normalized", orgNames.slice(i, i + CHUNK));
      if (chunk) allEntityRows.push(...(chunk as typeof allEntityRows));
    }
    if (!allEntityRows.length) {
      return NextResponse.json({ developers: [], projectCount: goaCount ?? 0 });
    }

    // Count distinct goa projects per brand
    const brandToProjects = new Map<string, Set<string>>();
    for (const entity of allEntityRows) {
      if (!entity.brand_id || !entity.legal_entity_name_normalized) continue;
      const projectIds = orgToProjects.get(entity.legal_entity_name_normalized) ?? [];
      if (!brandToProjects.has(entity.brand_id)) brandToProjects.set(entity.brand_id, new Set());
      for (const pid of projectIds) brandToProjects.get(entity.brand_id)!.add(pid);
    }
    const countByBrand: Record<string, number> = {};
    for (const [brandId, projectSet] of brandToProjects.entries()) {
      countByBrand[brandId] = projectSet.size;
    }

    const brandIds = Object.keys(countByBrand);
    if (!brandIds.length) {
      return NextResponse.json({ developers: [], projectCount: goaCount ?? 0 });
    }

    // Step 4: developer_brands for name + slug (chunked)
    const allBrandRows: { id: string; brand_name: string; url_slug: string | null; institutional_grade: boolean | null }[] = [];
    for (let i = 0; i < brandIds.length; i += CHUNK) {
      const { data: chunk } = await supabase
        .from("developer_brands")
        .select("id, brand_name, url_slug, institutional_grade")
        .in("id", brandIds.slice(i, i + CHUNK));
      if (chunk) allBrandRows.push(...(chunk as typeof allBrandRows));
    }

    const developers = allBrandRows
      .filter((b) => b.brand_name)
      .map((b) => ({
        brand_name: b.brand_name,
        url_slug: b.url_slug ?? null,
        total_projects: countByBrand[b.id] ?? 0,
        is_premium: null,
        institutional_grade: b.institutional_grade ?? null,
      }))
      .sort((a, b) => b.total_projects - a.total_projects);

    return NextResponse.json({ developers, projectCount: goaCount ?? 0 });
  } catch (err) {
    console.error("[/api/developers/goa]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
