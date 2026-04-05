import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { buildMetadata } from "@/components/common/SEO";
import { DeveloperProfileProjects } from "./DeveloperProfileProjects";
import type { ProfileProject } from "./DeveloperProfileProjects";
import { FaqAccordion } from "./FaqAccordion";

export const revalidate = 3600;

// ─── Design System ────────────────────────────────────────────────────────────

const C = {
  bg: "#FAFAF7",
  bgWarm: "#F5F3EE",
  bgCard: "#FFFFFF",
  bgDark: "#1A1A1F",
  gold: "#B08D57",
  goldLight: "#C9A96E",
  accent: "#2D6A4F",
  text: "#1A1A1F",
  textMuted: "#7A7A7E",
  border: "rgba(0,0,0,0.07)",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toTitleCase(str: string | null): string {
  if (!str) return "";
  return str.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase());
}

type ComputedStatus = "Completed" | "New Launch" | "Near Completion" | "Under Construction" | "Unknown";

function computeStatus(opts: {
  pli_actual_status: string | null;
  handover_started: boolean | null;
  proposed_completion_date: string | null;
  approved_date: string | null;
}): ComputedStatus {
  const ai = (opts.pli_actual_status ?? "").toLowerCase();
  if (ai === "completed" || ai === "handed_over" || ai === "oc_received" || opts.handover_started) return "Completed";
  if (!opts.proposed_completion_date) return "Under Construction";
  const today = new Date();
  const completion = new Date(opts.proposed_completion_date);
  const monthsDiff = (completion.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsDiff < 0) return "Completed";
  const reraAge = opts.approved_date
    ? (today.getTime() - new Date(opts.approved_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
    : null;
  if (reraAge !== null && reraAge <= 8 && monthsDiff > 0) return "New Launch";
  if (monthsDiff <= 12) return "Near Completion";
  return "Under Construction";
}

function isActive(s: ComputedStatus) {
  return s === "New Launch" || s === "Under Construction" || s === "Near Completion";
}

function priceRange(projects: { developer_price_min: number | null; developer_price_max: number | null }[]) {
  const prices = projects.flatMap((p) =>
    [p.developer_price_min, p.developer_price_max].filter((v): v is number => v != null)
  );
  if (!prices.length) return null;
  const f = (n: number) => `₹${(n / 1000).toFixed(1)}K`;
  return `${f(Math.min(...prices))}–${f(Math.max(...prices))}/sqft`;
}

// ─── MetricPill ───────────────────────────────────────────────────────────────

function MetricPill({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <div style={{ textAlign: "center", minWidth: 80 }}>
      <p
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "clamp(28px, 3vw, 40px)",
          fontWeight: 600,
          color: color ?? C.goldLight,
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: "rgba(255,255,255,0.45)",
          marginTop: 6,
          margin: "6px 0 0",
        }}
      >
        {label}
      </p>
    </div>
  );
}

// ─── SectionHeading ───────────────────────────────────────────────────────────

function SectionHeading({
  eyebrow,
  title,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  dark?: boolean;
}) {
  return (
    <div style={{ marginBottom: 36 }}>
      <p
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          color: C.gold,
          marginBottom: 10,
        }}
      >
        {eyebrow}
      </p>
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "clamp(26px, 3vw, 36px)",
          fontWeight: 600,
          color: dark ? "#fff" : C.text,
          margin: 0,
          lineHeight: 1.25,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

// ─── SignalCard ───────────────────────────────────────────────────────────────

function SignalCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        background: C.bgCard,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: "24px 22px",
        flex: "1 1 180px",
      }}
    >
      <p style={{ fontSize: 22, marginBottom: 12, lineHeight: 1 }}>{icon}</p>
      <p
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: C.textMuted,
          marginBottom: 6,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 28,
          fontWeight: 600,
          color: C.gold,
          lineHeight: 1.1,
          marginBottom: sub ? 4 : 0,
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 12,
            color: C.textMuted,
            lineHeight: 1.5,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("developer_brands")
    .select("brand_name, about_developer")
    .eq("url_slug", slug)
    .maybeSingle();
  const name = (data as { brand_name?: string } | null)?.brand_name ?? "Developer";

  return buildMetadata({
    title: `${name} — Projects in Hyderabad | Westside Realty`,
    description: `${name}: RERA-verified project portfolio, delivery track record & buyer insights. Expert reviews by Westside Realty.`,
    canonicalUrl: `https://www.westsiderealty.in/developers/${slug}`,
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DeveloperDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Brand
  const { data: brandRow } = await supabase
    .from("developer_brands")
    .select("id, brand_name, url_slug, is_premium, institutional_grade, asset_focus, about_developer")
    .eq("url_slug", slug)
    .maybeSingle();

  if (!brandRow) notFound();
  const brand = brandRow as {
    id: string;
    brand_name: string;
    url_slug: string;
    is_premium: boolean | null;
    institutional_grade: boolean | null;
    asset_focus: string | null;
    about_developer: string | null;
  };

  // 2. Projects from brand map
  const { data: mapRows } = await supabase
    .from("developer_project_brand_map")
    .select("project_id, project_name, current_status, proposed_completion_date")
    .eq("brand_id", brand.id);

  const mapData = (mapRows as Array<{
    project_id: string;
    project_name: string | null;
    current_status: string | null;
    proposed_completion_date: string | null;
  }>) ?? [];
  const projectIds = mapData.map((r) => r.project_id).filter(Boolean);

  // 3. rera_projects for url_slug + approved_date
  const reraMap = new Map<string, { url_slug: string | null; approved_date: string | null }>();
  if (projectIds.length) {
    const { data: reraRows } = await supabase
      .from("rera_projects")
      .select("id, url_slug, approved_date")
      .in("id", projectIds.slice(0, 100));
    ((reraRows as Array<{ id: string; url_slug: string | null; approved_date: string | null }>) ?? []).forEach((r) =>
      reraMap.set(r.id, { url_slug: r.url_slug ?? null, approved_date: r.approved_date ?? null })
    );
  }

  // 4. Micro-market classification + names
  const mmcMap = new Map<string, string>();
  if (projectIds.length) {
    const { data: mmcRows } = await supabase
      .from("project_micro_market_classification")
      .select("project_id, micro_market_slug")
      .in("project_id", projectIds.slice(0, 100));
    ((mmcRows as Array<{ project_id: string; micro_market_slug: string | null }>) ?? []).forEach((r) => {
      if (r.micro_market_slug) mmcMap.set(r.project_id, r.micro_market_slug);
    });
  }

  const mmNameMap = new Map<string, string>();
  const marketSlugs = [...new Set(mmcMap.values())];
  if (marketSlugs.length) {
    const { data: mmRows } = await supabase
      .from("micro_markets")
      .select("url_slug, micro_market_name")
      .in("url_slug", marketSlugs);
    ((mmRows as Array<{ url_slug: string; micro_market_name: string }>) ?? []).forEach((r) =>
      mmNameMap.set(r.url_slug, r.micro_market_name)
    );
  }

  // 5. PLI
  const pliMap = new Map<string, {
    developer_price_min: number | null;
    developer_price_max: number | null;
    actual_status: string | null;
    handover_started: boolean | null;
  }>();
  if (projectIds.length) {
    const { data: pliRows } = await supabase
      .from("project_live_intelligence")
      .select("rera_project_id, developer_price_min, developer_price_max, actual_status, handover_started")
      .in("rera_project_id", projectIds.slice(0, 100));
    ((pliRows as Array<{
      rera_project_id: string;
      developer_price_min: number | null;
      developer_price_max: number | null;
      actual_status: string | null;
      handover_started: boolean | null;
    }>) ?? []).forEach((r) => pliMap.set(r.rera_project_id, r));
  }

  // 6. Build projects with computed status
  const projects: ProfileProject[] = mapData.map((row) => {
    const pid = row.project_id;
    const marketSlug = mmcMap.get(pid) ?? null;
    const pli = pliMap.get(pid);
    const rera = reraMap.get(pid);
    const status = computeStatus({
      pli_actual_status: pli?.actual_status ?? null,
      handover_started: pli?.handover_started ?? null,
      proposed_completion_date: row.proposed_completion_date ?? null,
      approved_date: rera?.approved_date ?? null,
    });
    return {
      project_id: pid,
      project_name: row.project_name ?? "—",
      url_slug: rera?.url_slug ?? null,
      proposed_completion_date: row.proposed_completion_date ?? null,
      micro_market_name: marketSlug ? toTitleCase(mmNameMap.get(marketSlug) ?? marketSlug) : null,
      market_slug: marketSlug,
      developer_price_min: pli?.developer_price_min ?? null,
      developer_price_max: pli?.developer_price_max ?? null,
      has_ai: !!pli,
      computed_status: status,
    };
  });

  // Sort: active first, then completed, alphabetical within groups
  projects.sort((a, b) => {
    const aa = isActive(a.computed_status) ? 0 : 1;
    const bb = isActive(b.computed_status) ? 0 : 1;
    if (aa !== bb) return aa - bb;
    return a.project_name.localeCompare(b.project_name);
  });

  // 7. Detect developer's city
  const serviceSupabase = createServiceClient();

  const { data: brandEntityRows } = await serviceSupabase
    .from("developer_brand_entities")
    .select("legal_entity_name_normalized")
    .eq("brand_id", brand.id)
    .limit(5);
  const entityNames = ((brandEntityRows as Array<{ legal_entity_name_normalized: string | null }>) ?? [])
    .map((e) => e.legal_entity_name_normalized)
    .filter(Boolean) as string[];

  let developerCity = "hyderabad";
  if (entityNames.length) {
    const { data: promoterSample } = await serviceSupabase
      .from("rera_promoters")
      .select("rera_project_id")
      .in("organization_name_normalized", entityNames)
      .limit(1)
      .maybeSingle();
    if (promoterSample) {
      const { data: projectSample } = await serviceSupabase
        .from("rera_projects")
        .select("city_slug")
        .eq("id", (promoterSample as { rera_project_id: string }).rera_project_id)
        .maybeSingle();
      developerCity = (projectSample as { city_slug?: string } | null)?.city_slug ?? "hyderabad";
    }
  }

  // 8. Other developers — same city only
  let otherDevs: Array<{ brand_name: string; url_slug: string | null; total_projects: number | null }> = [];
  if (developerCity === "goa") {
    const { data: goaProjs } = await serviceSupabase
      .from("rera_projects")
      .select("id")
      .eq("city_slug", "goa")
      .limit(50);
    const sampleGoaIds = ((goaProjs as Array<{ id: string }>) ?? []).map((r) => r.id);
    if (sampleGoaIds.length) {
      const { data: promRows } = await serviceSupabase
        .from("rera_promoters")
        .select("organization_name_normalized")
        .in("rera_project_id", sampleGoaIds)
        .not("promoter_type", "in", '("Individual","Individual Registration Certificate")')
        .not("organization_name_normalized", "is", null);
      const goaOrgNames = [...new Set(((promRows as Array<{ organization_name_normalized: string }>) ?? []).map((r) => r.organization_name_normalized))];
      if (goaOrgNames.length) {
        const { data: entityRows } = await serviceSupabase
          .from("developer_brand_entities")
          .select("brand_id")
          .in("legal_entity_name_normalized", goaOrgNames);
        const goaBrandIds = [...new Set(
          ((entityRows as Array<{ brand_id: string | null }>) ?? [])
            .map((r) => r.brand_id)
            .filter((id): id is string => !!id && id !== brand.id)
        )];
        if (goaBrandIds.length) {
          const { data: brandRows } = await serviceSupabase
            .from("developer_brands")
            .select("brand_name, url_slug")
            .in("id", goaBrandIds)
            .neq("url_slug", slug)
            .limit(4);
          otherDevs = ((brandRows as Array<{ brand_name: string; url_slug: string | null }>) ?? []).map((b) => ({
            ...b,
            total_projects: null,
          }));
        }
      }
    }
  } else {
    const { data: otherDevRows } = await supabase
      .from("v_developer_brand_profile")
      .select("brand_name, url_slug, total_projects")
      .neq("url_slug", slug)
      .order("total_projects", { ascending: false })
      .limit(4);
    otherDevs = (otherDevRows as Array<{ brand_name: string; url_slug: string | null; total_projects: number | null }>) ?? [];
  }

  // 9. Similar projects from same markets
  let similarProjects: Array<{ project_name: string; url_slug: string | null; micro_market: string | null }> = [];
  if (marketSlugs.length) {
    const marketNames = marketSlugs.map((s) => mmNameMap.get(s) ?? "").filter(Boolean);
    if (marketNames.length) {
      const ownSlugs = new Set(projects.map((p) => p.url_slug).filter(Boolean));
      const { data: simRows } = await supabase
        .from("listing_project_detail_enriched_mv")
        .select("project_name, url_slug, micro_market")
        .in("micro_market", marketNames)
        .eq("city_slug", "hyderabad")
        .limit(8);
      similarProjects = ((simRows as Array<{ project_name: string; url_slug: string | null; micro_market: string | null }>) ?? [])
        .filter((r) => r.url_slug && !ownSlugs.has(r.url_slug))
        .slice(0, 4);
    }
  }

  // ─── Derived counts ───────────────────────────────────────────────────────
  const total = projects.length;
  const delivered = projects.filter((p) => p.computed_status === "Completed").length;
  const activeCount = projects.filter((p) => isActive(p.computed_status)).length;
  const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : null;

  const marketSet = new Map<string, string>();
  projects.forEach((p) => {
    if (p.market_slug && p.micro_market_name) marketSet.set(p.market_slug, p.micro_market_name);
  });

  const marketList = [...new Set(projects.map((p) => p.micro_market_name).filter(Boolean))] as string[];
  const priceRangeStr = priceRange(projects);
  const activeProjectNames = projects
    .filter((p) => isActive(p.computed_status))
    .slice(0, 5)
    .map((p) => p.project_name);

  const faqItems = [
    {
      q: `Is ${brand.brand_name} a reliable developer?`,
      a: `${brand.brand_name} has ${total} RERA-registered projects in Hyderabad, of which ${delivered} have been completed — a delivery rate of ${deliveryRate ?? "N/A"}%. ${delivered > 0 ? "Their track record shows successful handovers across multiple projects." : "Active projects are currently under development."} Our advisors recommend verifying possession timelines independently before signing.`,
    },
    {
      q: `What projects does ${brand.brand_name} have in Hyderabad?`,
      a: activeProjectNames.length
        ? `Active projects include: ${activeProjectNames.join(", ")}${projects.filter((p) => isActive(p.computed_status)).length > 5 ? ` and ${projects.filter((p) => isActive(p.computed_status)).length - 5} more` : ""}. See the full portfolio above.`
        : "No active projects found at this time. See the completed projects list above.",
    },
    {
      q: `Which areas does ${brand.brand_name} build in?`,
      a: marketList.length
        ? `${brand.brand_name} has projects in ${marketList.join(", ")} — primarily in the Hyderabad west corridor.`
        : "Market data is being updated. Contact our advisors for the latest information.",
    },
    {
      q: `What is the price range for ${brand.brand_name} projects?`,
      a: priceRangeStr
        ? `Based on available data, ${brand.brand_name} projects are priced around ${priceRangeStr}. Prices vary by project and unit type.`
        : "Price data is updated as projects go live. Contact our advisors for current pricing across all projects.",
    },
    {
      q: `What configurations does ${brand.brand_name} offer?`,
      a: `${brand.brand_name} typically offers 2 BHK, 3 BHK, and 4 BHK configurations across their Hyderabad portfolio. Check individual project pages for specific unit details.`,
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const organizationSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.brand_name,
    url: `https://www.westsiderealty.in/developers/${slug}`,
    ...(brand.about_developer ? { description: brand.about_developer } : {}),
    areaServed: { "@type": "City", name: "Hyderabad" },
  };

  const isGoa = developerCity === "goa";
  const cityLabel = isGoa ? "Goa" : "Hyderabad";

  // Possession buckets for Goa
  const goaBuckets: Record<string, number> = {};
  if (isGoa) {
    const now = new Date().getFullYear();
    projects.filter((p) => isActive(p.computed_status)).forEach((p) => {
      const yr = p.proposed_completion_date ? new Date(p.proposed_completion_date).getFullYear() : null;
      if (!yr) return;
      const key = yr <= now + 1 ? String(yr) : `${now + 2}+`;
      goaBuckets[key] = (goaBuckets[key] ?? 0) + 1;
    });
  }
  const goaBucketEntries = Object.entries(goaBuckets).sort(([a], [b]) => a.localeCompare(b));

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <style>{`
        .dev-profile-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 999px;
          font-family: 'Outfit', sans-serif;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .dev-other-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-radius: 14px;
          background: ${C.bgCard};
          border: 1px solid ${C.border};
          text-decoration: none;
          transition: all 0.16s ease;
        }
        .dev-other-card:hover {
          border-color: rgba(176,141,87,0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        }
        .dev-sim-project-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-radius: 14px;
          background: ${C.bgCard};
          border: 1px solid ${C.border};
          text-decoration: none;
          transition: all 0.16s ease;
        }
        .dev-sim-project-card:hover {
          border-color: rgba(176,141,87,0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        }
      `}</style>

      <main style={{ background: C.bg, fontFamily: "'Outfit', sans-serif", color: C.text }}>

        {/* ── Section 1: Hero (Dark) ─────────────────────────────────────────── */}
        <section
          style={{
            background: C.bgDark,
            paddingTop: 96,
            paddingBottom: 72,
            paddingLeft: 24,
            paddingRight: 24,
          }}
        >
          <div style={{ maxWidth: 960, margin: "0 auto" }}>

            {/* Back link */}
            <Link
              href={isGoa ? "/developers?city=goa" : "/developers"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
                textDecoration: "none",
                marginBottom: 32,
                letterSpacing: "0.06em",
                transition: "color 0.15s",
              }}
            >
              ← All Developers
            </Link>

            {/* Eyebrow */}
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: C.gold,
                marginBottom: 14,
              }}
            >
              {cityLabel} · Developer Profile
            </p>

            {/* H1 */}
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(36px, 6vw, 60px)",
                fontWeight: 600,
                color: "#fff",
                margin: "0 0 20px",
                lineHeight: 1.1,
              }}
            >
              {brand.brand_name}
            </h1>

            {/* Trust Badge */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 44 }}>
              {brand.institutional_grade ? (
                <span
                  className="dev-profile-badge"
                  style={{ background: "rgba(45,106,79,0.15)", color: "#4ADE80", border: "1px solid rgba(45,106,79,0.4)" }}
                >
                  ◉ Established Builder
                </span>
              ) : brand.is_premium ? (
                <span
                  className="dev-profile-badge"
                  style={{ background: "rgba(176,141,87,0.15)", color: C.goldLight, border: "1px solid rgba(176,141,87,0.4)" }}
                >
                  ◈ Premium Builder
                </span>
              ) : !isGoa ? (
                <span
                  className="dev-profile-badge"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  Growing Track Record
                </span>
              ) : null}
            </div>

            {/* MetricPills */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 40,
                paddingTop: 28,
                borderTop: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {total > 0 && (
                <MetricPill value={String(total)} label="Total Projects" />
              )}
              {deliveryRate !== null && !isGoa && (
                <MetricPill value={`${deliveryRate}%`} label="Delivery Rate" color="#4ADE80" />
              )}
              {activeCount > 0 && (
                <MetricPill value={String(activeCount)} label="Active Now" color={C.goldLight} />
              )}
              {marketList.length > 0 && (
                <MetricPill value={String(marketList.length)} label={marketList.length === 1 ? "Market" : "Markets"} />
              )}
            </div>
          </div>
        </section>

        {/* ── Section 2: About + Track Record (Warm) ────────────────────────── */}
        {(brand.about_developer || total > 0 || marketSet.size > 0) && (
          <section
            style={{
              background: C.bgWarm,
              padding: "72px 24px",
            }}
          >
            <div style={{ maxWidth: 960, margin: "0 auto" }}>
              <SectionHeading eyebrow="Developer Intel" title="Track Record" />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 48,
                  alignItems: "start",
                }}
              >
                {/* Left: About */}
                <div>
                  {brand.about_developer && (
                    <p
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 15,
                        color: C.textMuted,
                        lineHeight: 1.75,
                        marginBottom: 28,
                      }}
                    >
                      {brand.about_developer}
                    </p>
                  )}

                  {/* Delivery bar (Hyderabad only) */}
                  {!isGoa && total > 0 && (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                            color: C.textMuted,
                          }}
                        >
                          Delivery Rate
                        </span>
                        <span
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 13,
                            fontWeight: 600,
                            color: C.accent,
                          }}
                        >
                          {deliveryRate ?? 0}% ({delivered}/{total})
                        </span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 999,
                          background: "rgba(0,0,0,0.08)",
                          overflow: "hidden",
                          marginBottom: 20,
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${deliveryRate ?? 0}%`,
                            borderRadius: 999,
                            background: `linear-gradient(90deg, ${C.accent}, #4ADE80)`,
                            transition: "width 0.8s ease",
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", gap: 28 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: C.accent,
                              display: "inline-block",
                              flexShrink: 0,
                            }}
                          />
                          <div>
                            <p
                              style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: 22,
                                fontWeight: 600,
                                color: C.accent,
                                margin: 0,
                              }}
                            >
                              {delivered}
                            </p>
                            <p
                              style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 11,
                                color: C.textMuted,
                                margin: 0,
                              }}
                            >
                              Delivered
                            </p>
                          </div>
                        </div>
                        {activeCount > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background: C.gold,
                                display: "inline-block",
                                flexShrink: 0,
                              }}
                            />
                            <div>
                              <p
                                style={{
                                  fontFamily: "'Cormorant Garamond', serif",
                                  fontSize: 22,
                                  fontWeight: 600,
                                  color: C.gold,
                                  margin: 0,
                                }}
                              >
                                {activeCount}
                              </p>
                              <p
                                style={{
                                  fontFamily: "'Outfit', sans-serif",
                                  fontSize: 11,
                                  color: C.textMuted,
                                  margin: 0,
                                }}
                              >
                                Active
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Goa: possession buckets */}
                  {isGoa && activeCount > 0 && goaBucketEntries.length > 0 && (
                    <div>
                      <p
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                          color: C.textMuted,
                          marginBottom: 16,
                        }}
                      >
                        Possession Timeline
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                        {goaBucketEntries.map(([yr, count]) => (
                          <div key={yr} style={{ textAlign: "center" }}>
                            <p
                              style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: 26,
                                fontWeight: 600,
                                color: C.gold,
                                margin: 0,
                              }}
                            >
                              {count}
                            </p>
                            <p
                              style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 11,
                                color: C.textMuted,
                                margin: "4px 0 0",
                              }}
                            >
                              Possession {yr}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Market footprint */}
                {marketSet.size > 0 && (
                  <div>
                    <p
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.14em",
                        color: C.textMuted,
                        marginBottom: 16,
                      }}
                    >
                      Markets Active In
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {Array.from(marketSet.entries()).map(([mSlug, mName]) => (
                        <Link
                          key={mSlug}
                          href={`/${developerCity}/${mSlug}`}
                          style={{
                            display: "inline-block",
                            padding: "7px 16px",
                            borderRadius: 999,
                            background: C.bgCard,
                            border: `1px solid ${C.border}`,
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 13,
                            fontWeight: 500,
                            color: C.text,
                            textDecoration: "none",
                            transition: "all 0.15s",
                          }}
                        >
                          {mName}
                        </Link>
                      ))}
                    </div>

                    {priceRangeStr && (
                      <div style={{ marginTop: 28 }}>
                        <p
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.14em",
                            color: C.textMuted,
                            marginBottom: 8,
                          }}
                        >
                          Price Range
                        </p>
                        <p
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 18,
                            fontWeight: 600,
                            color: C.gold,
                          }}
                        >
                          {priceRangeStr}
                        </p>
                        <p
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 12,
                            color: C.textMuted,
                            marginTop: 4,
                          }}
                        >
                          Across active projects
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Section 3: Projects Portfolio (Light) ─────────────────────────── */}
        {projects.length > 0 && (
          <section style={{ background: C.bg, padding: "72px 24px" }}>
            <div style={{ maxWidth: 960, margin: "0 auto" }}>
              <SectionHeading
                eyebrow="Portfolio"
                title={`Projects by ${brand.brand_name}`}
              />
              <DeveloperProfileProjects projects={projects} citySlug={developerCity} />
            </div>
          </section>
        )}

        {/* ── Section 4: Developer Intelligence Signals (Warm) ──────────────── */}
        <section style={{ background: C.bgWarm, padding: "72px 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <SectionHeading eyebrow="Why This Developer" title="Key Signals" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
              {deliveryRate !== null && !isGoa && (
                <SignalCard
                  icon="◉"
                  label="Delivery Rate"
                  value={`${deliveryRate}%`}
                  sub={`${delivered} of ${total} projects delivered on RERA record`}
                />
              )}
              {activeCount > 0 && (
                <SignalCard
                  icon="⬡"
                  label="Active Projects"
                  value={String(activeCount)}
                  sub="Currently under construction or near completion"
                />
              )}
              {marketList.length > 0 && (
                <SignalCard
                  icon="◈"
                  label="Markets Footprint"
                  value={String(marketList.length)}
                  sub={
                    marketList.length > 0
                      ? marketList.slice(0, 3).join(", ") + (marketList.length > 3 ? " & more" : "")
                      : undefined
                  }
                />
              )}
            </div>
          </div>
        </section>

        {/* ── Section 5: Advisor CTA (Dark) ─────────────────────────────────── */}
        <section
          style={{
            background: C.bgDark,
            padding: "80px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: C.gold,
                marginBottom: 16,
              }}
            >
              Westside Advisor
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(26px, 3vw, 38px)",
                fontWeight: 600,
                color: "#fff",
                margin: "0 0 16px",
                lineHeight: 1.2,
              }}
            >
              Planning to buy from {brand.brand_name}?
            </h2>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 15,
                color: "rgba(255,255,255,0.5)",
                margin: "0 0 36px",
                lineHeight: 1.65,
              }}
            >
              Our advisors have walked every project in this portfolio. Get an honest,
              data-backed take — free.
            </p>
            <Link
              href="/contact"
              style={{
                display: "inline-block",
                padding: "14px 36px",
                borderRadius: 999,
                background: `linear-gradient(135deg, ${C.goldLight}, #A88040)`,
                color: "#0a0a0a",
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                textDecoration: "none",
                boxShadow: "0 4px 24px rgba(176,141,87,0.3)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
            >
              Get Expert Advice — Free
            </Link>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12,
                color: "rgba(255,255,255,0.2)",
                marginTop: 16,
              }}
            >
              No obligation · RERA experts · 12+ years in {cityLabel}
            </p>
          </div>
        </section>

        {/* ── Section 6: FAQs (Light) ───────────────────────────────────────── */}
        <section style={{ background: C.bg, padding: "72px 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <SectionHeading eyebrow="Common Questions" title={`About ${brand.brand_name}`} />
            <FaqAccordion items={faqItems} theme="light" />
          </div>
        </section>

        {/* ── Section 7: Related Links (Warm) ──────────────────────────────── */}
        {(otherDevs.length > 0 || marketSet.size > 0 || similarProjects.length > 0) && (
          <section style={{ background: C.bgWarm, padding: "72px 24px" }}>
            <div style={{ maxWidth: 960, margin: "0 auto" }}>
              <SectionHeading eyebrow="Explore More" title="Related" />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 36,
                }}
              >
                {otherDevs.length > 0 && (
                  <div>
                    <p
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.14em",
                        color: C.textMuted,
                        marginBottom: 12,
                      }}
                    >
                      Other Top Developers
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {otherDevs.map((d) => (
                        <Link
                          key={d.url_slug ?? d.brand_name}
                          href={d.url_slug ? `/developers/${d.url_slug}` : "/developers"}
                          className="dev-other-card"
                        >
                          <span
                            style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: 14,
                              fontWeight: 500,
                              color: C.text,
                            }}
                          >
                            {d.brand_name}
                          </span>
                          {d.total_projects != null && d.total_projects > 0 && (
                            <span
                              style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: 12,
                                color: C.textMuted,
                              }}
                            >
                              {d.total_projects} projects
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {marketSet.size > 0 && (
                  <div>
                    <p
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.14em",
                        color: C.textMuted,
                        marginBottom: 12,
                      }}
                    >
                      Markets Active In
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {Array.from(marketSet.entries())
                        .slice(0, 4)
                        .map(([mSlug, mName]) => (
                          <Link
                            key={mSlug}
                            href={`/${developerCity}/${mSlug}`}
                            className="dev-other-card"
                          >
                            <span
                              style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 14,
                                fontWeight: 500,
                                color: C.text,
                              }}
                            >
                              {mName}
                            </span>
                            <span
                              style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 12,
                                color: C.textMuted,
                              }}
                            >
                              View market →
                            </span>
                          </Link>
                        ))}
                    </div>
                  </div>
                )}

                {similarProjects.length > 0 && (
                  <div>
                    <p
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.14em",
                        color: C.textMuted,
                        marginBottom: 12,
                      }}
                    >
                      Similar Projects Nearby
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {similarProjects.map((p) => (
                        <Link
                          key={p.url_slug ?? p.project_name}
                          href={
                            p.url_slug
                              ? `/${developerCity}/projects/${p.url_slug}`
                              : `/${developerCity}/projects`
                          }
                          className="dev-sim-project-card"
                        >
                          <span
                            style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: 14,
                              fontWeight: 500,
                              color: C.text,
                              lineHeight: 1.4,
                            }}
                          >
                            {p.project_name}
                          </span>
                          {p.micro_market && (
                            <span
                              style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 11,
                                color: C.textMuted,
                                marginLeft: 8,
                                flexShrink: 0,
                              }}
                            >
                              {toTitleCase(p.micro_market)}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

      </main>
    </>
  );
}
