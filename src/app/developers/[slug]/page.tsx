import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { ProjectsTable } from "./ProjectsTable";
import { FaqAccordion } from "./FaqAccordion";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("developer_brands")
    .select("brand_name")
    .eq("url_slug", slug)
    .maybeSingle();
  const name = (data as any)?.brand_name ?? "Developer";
  return {
    title: `${name} — Projects & Track Record | Westside Realty`,
    description: `RERA-verified project portfolio, delivery history, and buyer insights for ${name} in Hyderabad.`,
  };
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
  const brand = brandRow as any;

  // 2. Projects from brand map
  const { data: mapRows } = await supabase
    .from("developer_project_brand_map")
    .select("project_id, project_name, current_status, proposed_completion_date")
    .eq("brand_id", brand.id);

  const mapData = (mapRows as any[]) ?? [];
  const projectIds = mapData.map((r) => r.project_id).filter(Boolean);

  // 3. rera_projects for url_slug + approved_date
  const reraMap = new Map<string, { url_slug: string | null; approved_date: string | null }>();
  if (projectIds.length) {
    const { data: reraRows } = await supabase
      .from("rera_projects")
      .select("id, url_slug, approved_date")
      .in("id", projectIds.slice(0, 100));
    ((reraRows as any[]) ?? []).forEach((r) =>
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
    ((mmcRows as any[]) ?? []).forEach((r: any) => {
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
    ((mmRows as any[]) ?? []).forEach((r: any) => mmNameMap.set(r.url_slug, r.micro_market_name));
  }

  // 5. PLI (rera_project_id = rera_projects.id = brand_map.project_id)
  const pliMap = new Map<string, any>();
  if (projectIds.length) {
    const { data: pliRows } = await supabase
      .from("project_live_intelligence")
      .select("rera_project_id, developer_price_min, developer_price_max, actual_status, handover_started")
      .in("rera_project_id", projectIds.slice(0, 100));
    ((pliRows as any[]) ?? []).forEach((r: any) => pliMap.set(r.rera_project_id, r));
  }

  // 6. Build projects with computed status
  const projects = mapData.map((row: any) => {
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

  // 7. Detect developer's city via service client (bypasses RLS on rera_promoters)
  const serviceSupabase = createServiceClient();

  const { data: brandEntityRows } = await serviceSupabase
    .from("developer_brand_entities")
    .select("legal_entity_name_normalized")
    .eq("brand_id", brand.id)
    .limit(5);
  const entityNames = ((brandEntityRows as any[]) ?? [])
    .map((e: any) => e.legal_entity_name_normalized)
    .filter(Boolean);

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
        .eq("id", (promoterSample as any).rera_project_id)
        .maybeSingle();
      developerCity = (projectSample as any)?.city_slug ?? "hyderabad";
    }
  }

  // 8. Other developers — same city only
  let otherDevs: any[] = [];
  if (developerCity === "goa") {
    // Sample 50 Goa projects → promoters → entity names → brands
    const { data: goaProjs } = await serviceSupabase
      .from("rera_projects")
      .select("id")
      .eq("city_slug", "goa")
      .limit(50);
    const sampleGoaIds = ((goaProjs as any[]) ?? []).map((r: any) => r.id);
    if (sampleGoaIds.length) {
      const { data: promRows } = await serviceSupabase
        .from("rera_promoters")
        .select("organization_name_normalized")
        .in("rera_project_id", sampleGoaIds)
        .not("promoter_type", "in", '("Individual","Individual Registration Certificate")')
        .not("organization_name_normalized", "is", null);
      const goaOrgNames = [...new Set(((promRows as any[]) ?? []).map((r: any) => r.organization_name_normalized))];
      if (goaOrgNames.length) {
        const { data: entityRows } = await serviceSupabase
          .from("developer_brand_entities")
          .select("brand_id")
          .in("legal_entity_name_normalized", goaOrgNames);
        const goaBrandIds = [...new Set(
          ((entityRows as any[]) ?? []).map((r: any) => r.brand_id).filter((id: any) => id && id !== brand.id)
        )];
        if (goaBrandIds.length) {
          const { data: brandRows } = await serviceSupabase
            .from("developer_brands")
            .select("brand_name, url_slug")
            .in("id", goaBrandIds)
            .neq("url_slug", slug)
            .limit(4);
          otherDevs = ((brandRows as any[]) ?? []).map((b: any) => ({ ...b, total_projects: null }));
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
    otherDevs = (otherDevRows as any[]) ?? [];
  }

  // 8. Similar projects from same markets
  let similarProjects: any[] = [];
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
      similarProjects = ((simRows as any[]) ?? [])
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

  const marketList = [...new Set(projects.map((p) => p.micro_market_name).filter(Boolean))];
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

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main style={{ background: "#080808", minHeight: "100vh" }}>

        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="pb-16 px-4" style={{ paddingTop: 88, background: "linear-gradient(to bottom, #0d0d0d, #080808)" }}>
          <div className="container mx-auto max-w-5xl">
            <Link href={developerCity === "goa" ? "/developers?city=goa" : "/developers"} className="text-xs text-slate-500 hover:text-slate-300 transition-colors mb-6 inline-block">
              ← All Developers
            </Link>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Left */}
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#c8a96e" }}>
                  {developerCity === "goa" ? "Goa" : "Hyderabad"} · Developer Profile
                </p>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">{brand.brand_name}</h1>

                <div className="flex flex-wrap gap-2 mb-8">
                  {brand.institutional_grade ? (
                    <span className="inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase" style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", borderColor: "rgba(34,197,94,0.3)" }}>
                      Established Builder
                    </span>
                  ) : brand.is_premium ? (
                    <span className="inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase" style={{ background: "rgba(200,169,110,0.12)", color: "#c8a96e", borderColor: "rgba(200,169,110,0.3)" }}>
                      Premium Builder
                    </span>
                  ) : developerCity !== "goa" ? (
                    <span className="inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase" style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8", borderColor: "rgba(255,255,255,0.12)" }}>
                      Growing Track Record
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-8">
                  {total > 0 && (
                    <div>
                      <p className="text-2xl font-bold text-white">{total}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">Total Projects</p>
                    </div>
                  )}
                  {activeCount > 0 && (
                    <div>
                      <p className="text-2xl font-bold text-amber-400">{activeCount}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">Active</p>
                    </div>
                  )}
                </div>

                {brand.about_developer && (
                  <p className="mt-6 text-slate-400 text-sm leading-relaxed max-w-lg">
                    {brand.about_developer}
                  </p>
                )}
              </div>

              {/* Right — CTA */}
              <div className="w-full lg:w-72 rounded-2xl border border-white/10 p-6" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p className="text-white font-semibold mb-2">Buying from {brand.brand_name}?</p>
                <p className="text-slate-400 text-sm mb-5">
                  Our advisors have walked every project in this portfolio. Get an honest, data-backed take — free.
                </p>
                <Link
                  href="/contact"
                  className="block text-center rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-[0.1em] transition-all hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #c8a96e, #a8843e)", color: "#0a0a0a", boxShadow: "0 4px 16px rgba(200,169,110,0.25)" }}
                >
                  Get Expert Advice — Free
                </Link>
                <p className="text-slate-600 text-xs text-center mt-3">No obligation · 12+ years in Hyderabad</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Delivery Track Record / Project Pipeline ───────── */}
        {total > 0 && (
          <section className="px-4 py-10 border-t border-white/5">
            <div className="container mx-auto max-w-5xl">
              {developerCity === "goa" ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#c8a96e" }}>Project Pipeline</p>
                  <h2 className="text-xl font-bold text-white mb-6">Active Projects</h2>
                  <div className="rounded-2xl border border-white/8 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="mb-5">
                      <p className="text-3xl font-bold text-amber-400">{activeCount}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">Active projects</p>
                    </div>
                    {(() => {
                      const now = new Date().getFullYear();
                      const buckets: Record<string, number> = {};
                      projects.filter(p => isActive(p.computed_status)).forEach(p => {
                        const yr = p.proposed_completion_date ? new Date(p.proposed_completion_date).getFullYear() : null;
                        if (!yr) return;
                        const key = yr <= now + 1 ? String(yr) : `${now + 2}+`;
                        buckets[key] = (buckets[key] ?? 0) + 1;
                      });
                      const entries = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b));
                      if (!entries.length) return null;
                      return (
                        <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-white/8">
                          {entries.map(([yr, count]) => (
                            <div key={yr}>
                              <p className="text-white font-bold text-xl">{count}</p>
                              <p className="text-xs text-slate-500 mt-0.5">Possession {yr}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#c8a96e" }}>Track Record</p>
                  <h2 className="text-xl font-bold text-white mb-6">Delivery History</h2>
                  <div className="rounded-2xl border border-white/8 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="mb-5">
                      <div className="flex justify-between text-xs text-slate-500 mb-2">
                        <span>0</span>
                        <span>{total} projects total</span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full" style={{ width: `${deliveryRate ?? 0}%`, background: "linear-gradient(90deg, #22c55e, #4ade80)" }} />
                      </div>
                    </div>
                    <div className="flex gap-8">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-emerald-400 font-bold text-xl">{delivered}</p>
                          <p className="text-xs text-slate-500">Delivered</p>
                        </div>
                      </div>
                      {activeCount > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0" />
                          <div>
                            <p className="text-amber-400 font-bold text-xl">{activeCount}</p>
                            <p className="text-xs text-slate-500">Active</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* ── Projects Table (client component for tab interaction) ── */}
        {projects.length > 0 && (
          <section className="px-4 py-10 border-t border-white/5">
            <div className="container mx-auto max-w-5xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#c8a96e" }}>Portfolio</p>
              <h2 className="text-xl font-bold text-white mb-5">Projects by {brand.brand_name}</h2>
              <ProjectsTable projects={projects} citySlug={developerCity} />
            </div>
          </section>
        )}

        {/* ── Markets Active In ──────────────────────────────── */}
        {marketSet.size > 0 && (
          <section className="px-4 py-10 border-t border-white/5">
            <div className="container mx-auto max-w-5xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#c8a96e" }}>Footprint</p>
              <h2 className="text-xl font-bold text-white mb-5">Markets Active In</h2>
              <div className="flex flex-wrap gap-2">
                {Array.from(marketSet.entries()).map(([mSlug, mName]) => (
                  <Link
                    key={mSlug}
                    href={`/${developerCity}/${mSlug}`}
                    className="rounded-full border px-4 py-2 text-sm font-medium transition-all hover:border-white/30 hover:bg-white/8"
                    style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.12)", color: "#cbd5e1" }}
                  >
                    {mName}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQs ──────────────────────────────────────────── */}
        <section className="px-4 py-10 border-t border-white/5">
          <div className="container mx-auto max-w-5xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#c8a96e" }}>Common Questions</p>
            <h2 className="text-xl font-bold text-white mb-6">About {brand.brand_name}</h2>
            <FaqAccordion items={faqItems} />
          </div>
        </section>

        {/* ── Smart Links ───────────────────────────────────── */}
        {(otherDevs.length > 0 || marketSet.size > 0 || similarProjects.length > 0) && (
          <section className="px-4 py-10 border-t border-white/5">
            <div className="container mx-auto max-w-5xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#c8a96e" }}>Explore More</p>
              <h2 className="text-xl font-bold text-white mb-6">Related</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

                {otherDevs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Other Top Developers</p>
                    <div className="space-y-2">
                      {otherDevs.map((d: any) => (
                        <Link key={d.url_slug} href={`/developers/${d.url_slug}`}
                          className="flex items-center justify-between rounded-xl border border-white/8 px-4 py-3 transition-all hover:border-white/20 hover:bg-white/4"
                          style={{ background: "rgba(255,255,255,0.03)" }}>
                          <span className="text-white text-sm font-medium">{d.brand_name}</span>
                          {d.total_projects > 0 && <span className="text-slate-500 text-xs">{d.total_projects} projects</span>}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {marketSet.size > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Markets Active In</p>
                    <div className="space-y-2">
                      {Array.from(marketSet.entries()).slice(0, 4).map(([mSlug, mName]) => (
                        <Link key={mSlug} href={`/${developerCity}/${mSlug}`}
                          className="flex items-center justify-between rounded-xl border border-white/8 px-4 py-3 transition-all hover:border-white/20 hover:bg-white/4"
                          style={{ background: "rgba(255,255,255,0.03)" }}>
                          <span className="text-white text-sm font-medium">{mName}</span>
                          <span className="text-slate-600 text-xs">View market →</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {similarProjects.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Similar Projects Nearby</p>
                    <div className="space-y-2">
                      {similarProjects.map((p: any) => (
                        <Link key={p.url_slug ?? p.project_name}
                          href={p.url_slug ? `/hyderabad/projects/${p.url_slug}` : "/hyderabad/projects"}
                          className="flex items-center justify-between rounded-xl border border-white/8 px-4 py-3 transition-all hover:border-white/20 hover:bg-white/4"
                          style={{ background: "rgba(255,255,255,0.03)" }}>
                          <span className="text-white text-sm font-medium leading-snug">{p.project_name}</span>
                          {p.micro_market && <span className="text-slate-500 text-xs ml-2 flex-shrink-0">{toTitleCase(p.micro_market)}</span>}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ──────────────────────────────────────────── */}
        <section className="px-4 py-16 text-center border-t border-white/5" style={{ background: "linear-gradient(to bottom, #080808, #0d0d0d)" }}>
          <div className="container mx-auto max-w-xl">
            <h2 className="text-2xl font-bold text-white mb-3">Planning to buy from {brand.brand_name}?</h2>
            <p className="text-slate-400 mb-7">
              Talk to a Hyderabad expert first. Our advisors know this portfolio inside out — honest take, no obligation.
            </p>
            <Link
              href="/contact"
              className="inline-block rounded-full px-8 py-3.5 text-sm font-bold uppercase tracking-[0.14em] transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #c8a96e, #a8843e)", color: "#0a0a0a", boxShadow: "0 4px 20px rgba(200,169,110,0.3)" }}
            >
              Get Expert Advice — Free
            </Link>
            <p className="text-slate-600 text-xs mt-4">No obligation · RERA experts · 12+ years in Hyderabad</p>
          </div>
        </section>

      </main>
    </>
  );
}
