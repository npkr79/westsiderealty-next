import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { DevelopersClient, type Developer } from "./DevelopersClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Developer Intelligence | Westside Realty",
  description:
    "Delivery history and portfolio data for every major developer in Hyderabad and Goa. Know your builder before you sign.",
};

// ─── Server-side data fetch (runs at build / ISR, not in browser) ─────────────

async function getHyderabadData(): Promise<{
  developers: Developer[];
  projectCount: number | null;
  developerCount: number | null;
}> {
  try {
    const supabase = createServiceClient();
    const CHUNK = 100;

    const [{ data: allDevs }, { count: reraCount }, { count: devCount }] = await Promise.all([
      supabase
        .from("v_developer_brand_profile")
        .select("brand_name, url_slug, total_projects, is_premium, institutional_grade")
        .order("total_projects", { ascending: false }),
      supabase
        .from("rera_projects")
        .select("id", { count: "exact", head: true })
        .eq("city_slug", "hyderabad"),
      supabase
        .from("developers")
        .select("id", { count: "exact", head: true }),
    ]);

    const developers = ((allDevs ?? []) as Developer[]);

    // Filter to only Hyderabad developers via promoter→entity→brand chain
    try {
      const { data: hydRows } = await supabase
        .from("rera_projects")
        .select("id")
        .eq("city_slug", "hyderabad")
        .limit(10000);

      const hydIds = ((hydRows ?? []) as { id: string }[]).map((r) => r.id).filter(Boolean);
      const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");

      const allPromoterRows: { organization_name: string | null; organization_name_normalized: string | null }[] = [];
      for (let i = 0; i < hydIds.length; i += CHUNK) {
        const { data: chunk } = await supabase
          .from("rera_promoters")
          .select("organization_name, organization_name_normalized")
          .in("rera_project_id", hydIds.slice(i, i + CHUNK));
        if (chunk) allPromoterRows.push(...(chunk as typeof allPromoterRows));
      }

      const orgNames = [
        ...new Set(
          allPromoterRows
            .map((r) => r.organization_name_normalized ?? (r.organization_name ? norm(r.organization_name) : null))
            .filter((n): n is string => !!n)
        ),
      ];

      const allEntityRows: { brand_id: string | null }[] = [];
      for (let i = 0; i < orgNames.length; i += CHUNK) {
        const { data: chunk } = await supabase
          .from("developer_brand_entities")
          .select("brand_id")
          .in("legal_entity_name_normalized", orgNames.slice(i, i + CHUNK));
        if (chunk) allEntityRows.push(...(chunk as typeof allEntityRows));
      }

      const hydBrandIds = [...new Set(allEntityRows.map((r) => r.brand_id).filter((id): id is string => !!id))];

      const allBrandRows: { url_slug: string | null }[] = [];
      for (let i = 0; i < hydBrandIds.length; i += CHUNK) {
        const { data: chunk } = await supabase
          .from("developer_brands")
          .select("url_slug")
          .in("id", hydBrandIds.slice(i, i + CHUNK));
        if (chunk) allBrandRows.push(...(chunk as typeof allBrandRows));
      }

      const validSlugs = new Set(allBrandRows.map((r) => r.url_slug).filter((s): s is string => !!s));

      return {
        developers: validSlugs.size > 0 ? developers.filter((d) => d.url_slug && validSlugs.has(d.url_slug)) : developers,
        projectCount: reraCount,
        developerCount: devCount,
      };
    } catch {
      return { developers, projectCount: reraCount, developerCount: devCount };
    }
  } catch {
    return { developers: [], projectCount: null, developerCount: null };
  }
}

// ─── Page (server component — data fetched at build / ISR) ───────────────────

export default async function DevelopersPage() {
  const { developers, projectCount, developerCount } = await getHyderabadData();

  return (
    <DevelopersClient
      initialDevelopers={developers}
      projectCount={projectCount}
      developerCount={developerCount}
    />
  );
}
