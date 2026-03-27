import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { JsonLd } from "@/components/common/SEO";

export const metadata: Metadata = {
  title: "Westside Realty — Premium Real Estate in Hyderabad, Goa & Dubai | Expert Advisory",
  description:
    "Hyderabad's trusted real estate advisors. RERA-verified apartments, villas & plots in Kokapet, Gachibowli, Financial District & Goa. Compare prices, floor plans & market intelligence.",
};

export const revalidate = 300;

const MARKET_PRIORITY = [
  "gachibowli", "financial-district", "kokapet", "nanakramguda", "kondapur", "narsingi",
];

async function getTopMarkets() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("micro_markets")
      .select("micro_market_name, url_slug, price_per_sqft_min, price_per_sqft_max, annual_appreciation_min")
      .eq("city_slug", "hyderabad")
      .in("url_slug", MARKET_PRIORITY);
    const rows = (data ?? []) as any[];
    return rows.sort((a, b) => {
      const ia = MARKET_PRIORITY.indexOf(a.url_slug);
      const ib = MARKET_PRIORITY.indexOf(b.url_slug);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  } catch { return []; }
}

async function getTopProjects() {
  try {
    const supabase = createServiceClient();
    // Get priority-1 done project IDs
    const { data: queueRows } = await supabase
      .from("project_intelligence_queue")
      .select("project_id")
      .eq("priority", 1)
      .eq("status", "done")
      .limit(20);
    const ids = (queueRows ?? []).map((r: any) => r.project_id);
    if (!ids.length) {
      const { data } = await supabase
        .from("listing_project_detail_enriched_mv")
        .select("project_name, url_slug, current_status, micro_market")
        .eq("city_slug", "hyderabad")
        .limit(6);
      return data ?? [];
    }
    const { data: reraRows } = await supabase
      .from("rera_projects")
      .select("url_slug")
      .in("id", ids)
      .limit(20);
    const slugs = (reraRows ?? []).map((r: any) => r.url_slug).filter(Boolean);
    if (!slugs.length) return [];
    const { data } = await supabase
      .from("listing_project_detail_enriched_mv")
      .select("project_name, url_slug, current_status, micro_market")
      .eq("city_slug", "hyderabad")
      .in("url_slug", slugs)
      .limit(6);
    return data ?? [];
  } catch { return []; }
}

async function getTopDevelopers() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("developer_brands")
      .select("brand_name, url_slug, track_record, total_projects")
      .limit(20);
    const rows = (data ?? []) as any[];
    function rank(t: string | null) {
      if (!t) return 4;
      const s = t.toLowerCase();
      if (s.includes("establish")) return 1;
      if (s.includes("grow")) return 2;
      if (s.includes("limit")) return 3;
      return 4;
    }
    return rows
      .sort((a, b) => {
        const r = rank(a.track_record) - rank(b.track_record);
        if (r !== 0) return r;
        return (b.total_projects ?? 0) - (a.total_projects ?? 0);
      })
      .slice(0, 6);
  } catch { return []; }
}

function statusLabel(s: string | null) {
  if (!s) return null;
  const l = s.toLowerCase();
  if (l.includes("new") || l.includes("launch")) return { text: "New Launch", color: "#22c55e" };
  if (l.includes("construction") || l.includes("ongoing")) return { text: "Under Construction", color: "#f59e0b" };
  if (l.includes("complet") || l.includes("ready")) return { text: "Ready", color: "#3b82f6" };
  return { text: s, color: "#94a3b8" };
}

function trackLabel(t: string | null) {
  if (!t) return null;
  const l = t.toLowerCase();
  if (l.includes("establish")) return { text: "Established", color: "#22c55e" };
  if (l.includes("grow")) return { text: "Growing", color: "#f59e0b" };
  if (l.includes("limit")) return { text: "Limited", color: "#ef4444" };
  return { text: t, color: "#94a3b8" };
}

function priceLabel(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const f = (n: number) => n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;
  if (min && max) return `${f(min)}–${f(max)}/sqft`;
  return `${f((min ?? max)!)}/sqft`;
}

export default async function HomePage() {
  const [markets, projects, devs] = await Promise.all([
    getTopMarkets(),
    getTopProjects(),
    getTopDevelopers(),
  ]);

  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "Westside Realty",
    url: "https://www.westsiderealty.in",
    logo: "https://www.westsiderealty.in/logo.png",
    description: "Premium real estate advisory in West Hyderabad specialising in apartments, villas and commercial investments",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      addressCountry: "IN",
    },
    areaServed: ["Gachibowli", "Kokapet", "Kondapur", "Gandipet", "HITEC City"],
    telephone: "+91-XXXXXXXXXX",
    sameAs: [
      "https://www.facebook.com/westsiderealty",
      "https://www.instagram.com/westsiderealty",
    ],
  };

  return (
    <main style={{ background: "#080808", minHeight: "100vh" }}>
      <JsonLd jsonLd={businessSchema} />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        className="pb-20 px-4 text-center"
        style={{ paddingTop: 88, background: "linear-gradient(to bottom, #0e0e0e 0%, #080808 100%)" }}
      >
        <div className="container mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] mb-5" style={{ color: "#c8a96e" }}>
            Hyderabad Real Estate Intelligence
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold text-white leading-[1.08] mb-6">
            Know where to buy<br />
            <span style={{ color: "#c8a96e" }}>before everyone else.</span>
          </h1>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            RERA-verified data · AI market signals · Expert advice across
            19 micro-markets in Hyderabad.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/hyderabad/micro-markets"
              className="rounded-full px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #c8a96e, #a8843e)", color: "#0a0a0a", boxShadow: "0 4px 20px rgba(200,169,110,0.3)" }}
            >
              Explore Markets
            </Link>
            <Link
              href="/hyderabad/projects"
              className="rounded-full px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] border border-white/15 text-white hover:bg-white/8 transition-all hover:-translate-y-0.5"
            >
              Find Projects
            </Link>
          </div>
          <div className="mt-14 flex flex-wrap justify-center gap-10">
            {[
              { value: "577+", label: "RERA Projects" },
              { value: "19", label: "Micro-Markets" },
              { value: "₹7.2K–₹14K", label: "Price Range /sqft" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top Markets ──────────────────────────────────────── */}
      <section className="px-4 py-16">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#c8a96e" }}>Live Prices</p>
              <h2 className="text-2xl font-bold text-white">Top Markets Right Now</h2>
            </div>
            <Link href="/hyderabad/micro-markets" className="text-xs text-slate-400 hover:text-white transition-colors">
              View all 19 →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(markets.length > 0 ? markets : MARKET_PRIORITY.map((s) => ({ url_slug: s, micro_market_name: s.replace(/-/g, " "), price_per_sqft_min: null, price_per_sqft_max: null, annual_appreciation_min: null }))).map((m: any) => {
              const price = priceLabel(m.price_per_sqft_min, m.price_per_sqft_max);
              return (
                <Link
                  key={m.url_slug}
                  href={`/hyderabad/${m.url_slug}`}
                  className="group rounded-2xl border border-white/8 p-5 transition-all duration-200 hover:border-white/20 hover:bg-white/4"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <p className="text-white font-semibold mb-2 capitalize">{m.micro_market_name}</p>
                  {price && <p className="text-sm font-bold mb-1" style={{ color: "#c8a96e" }}>{price}</p>}
                  {m.annual_appreciation_min != null && (
                    <p className="text-xs text-emerald-400">↑{m.annual_appreciation_min}% YoY</p>
                  )}
                  <p className="text-xs text-slate-600 mt-3 group-hover:text-slate-400 transition-colors">View market →</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Featured Projects ────────────────────────────────── */}
      {projects.length > 0 && (
        <section className="px-4 py-12 border-t border-white/5">
          <div className="container mx-auto max-w-5xl">
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#c8a96e" }}>AI Enriched</p>
                <h2 className="text-2xl font-bold text-white">Featured Projects</h2>
              </div>
              <Link href="/hyderabad/projects" className="text-xs text-slate-400 hover:text-white transition-colors">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p: any) => {
                const st = statusLabel(p.current_status);
                return (
                  <Link
                    key={p.url_slug}
                    href={`/hyderabad/projects/${p.url_slug}`}
                    className="group rounded-2xl border border-white/8 p-5 transition-all duration-200 hover:border-white/20 hover:bg-white/4"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <p className="text-white font-semibold mb-2 leading-snug">{p.project_name}</p>
                    {p.micro_market && <p className="text-slate-500 text-xs mb-3">{p.micro_market}</p>}
                    {st && (
                      <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: st.color + "20", color: st.color }}>
                        {st.text}
                      </span>
                    )}
                    <p className="text-xs text-slate-600 mt-3 group-hover:text-slate-400 transition-colors">View project →</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Top Developers ───────────────────────────────────── */}
      {devs.length > 0 && (
        <section className="px-4 py-12 border-t border-white/5">
          <div className="container mx-auto max-w-5xl">
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#c8a96e" }}>Track Records</p>
                <h2 className="text-2xl font-bold text-white">Top Developers</h2>
              </div>
              <Link href="/developers" className="text-xs text-slate-400 hover:text-white transition-colors">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {devs.map((d: any) => {
                const tl = trackLabel(d.track_record);
                return (
                  <Link
                    key={d.brand_name}
                    href={d.url_slug ? `/developers/${d.url_slug}` : "/developers"}
                    className="group rounded-xl border border-white/8 p-4 text-center transition-all hover:border-white/20 hover:bg-white/4"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <p className="text-white text-xs font-semibold leading-snug mb-2">{d.brand_name}</p>
                    {tl && <span className="inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase" style={{ background: tl.color + "20", color: tl.color }}>{tl.text}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="px-4 py-20 text-center border-t border-white/5" style={{ background: "linear-gradient(to bottom, #080808, #0d0d0d)" }}>
        <div className="container mx-auto max-w-xl">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to make a smarter decision?</h2>
          <p className="text-slate-400 mb-8">
            Our advisors have walked every corridor in Hyderabad. Get an honest, data-backed assessment — no obligation.
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
  );
}
