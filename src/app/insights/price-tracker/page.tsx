import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export const metadata: Metadata = {
  title: "Hyderabad Price Tracker — Live Rates by Micro-Market | Westside Realty",
  description:
    "Live price-per-sqft rates across 19 Hyderabad micro-markets. RERA-sourced data updated regularly.",
};

export const revalidate = 3600;

const TIER_ORDER = [
  "financial-district", "gachibowli", "kokapet", "nanakramguda",
  "kondapur", "raidurgam", "narsingi", "gopanpally", "puppalaguda",
  "tellapur", "neopolis", "serilingampally", "kollur", "mokila",
  "tukkuguda", "gandipet", "rajendra-nagar", "budwel", "osman-nagar",
];

function tier(slug: string) {
  const idx = TIER_ORDER.indexOf(slug);
  if (idx < 4) return { label: "Premium", color: "#c8a96e" };
  if (idx < 9) return { label: "Mid-Premium", color: "#60a5fa" };
  return { label: "Emerging", color: "#4ade80" };
}

function fmtPrice(n: number | null) {
  if (!n) return "—";
  return `₹${(n / 1000).toFixed(1)}K`;
}

export default async function PriceTrackerPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("micro_markets")
    .select("micro_market_name, url_slug, price_per_sqft_min, price_per_sqft_max, annual_appreciation_min, annual_appreciation_max")
    .eq("city_slug", "hyderabad")
    .order("price_per_sqft_max", { ascending: false });

  const markets = (data ?? []) as any[];

  const updatedDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <main style={{ background: "#080808", minHeight: "100vh" }}>
      <section className="px-4 pb-16" style={{ paddingTop: 88, background: "linear-gradient(to bottom, #0d0d0d, #080808)" }}>
        <div className="container mx-auto max-w-4xl">
          <Link href="/insights" className="text-xs text-slate-500 hover:text-slate-300 transition-colors mb-6 inline-block">
            ← Back to Insights
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#c8a96e" }}>
              Market Intelligence
            </p>
            <span className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase" style={{ background: "rgba(34,197,94,0.15)", color: "#86efac", borderColor: "rgba(34,197,94,0.3)" }}>
              LIVE
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">Price Tracker</h1>
          <p className="text-slate-400 text-lg mb-2 max-w-xl">
            Live price-per-sqft rates across 19 Hyderabad micro-markets, sourced from RERA filings and developer launches.
          </p>
          <p className="text-slate-600 text-xs mb-12">Last updated: {updatedDate}</p>

          {/* Summary tiles */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            {[
              { label: "Lowest entry", value: "₹5.2K/sqft", sub: "Emerging corridors" },
              { label: "Premium belt", value: "₹11K–₹14K", sub: "Financial District & Gachibowli" },
              { label: "Fastest YoY growth", value: "18–22%", sub: "Kokapet & Narsingi" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/8 p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{s.label}</p>
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-600 mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Price table */}
          <div className="rounded-2xl border border-white/8 overflow-hidden mb-12">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 border-b border-white/8"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              <span>Micro-Market</span>
              <span>Price Range</span>
              <span className="hidden sm:block">YoY Growth</span>
              <span>Tier</span>
            </div>
            {markets.map((m) => {
              const t = tier(m.url_slug);
              const min = fmtPrice(m.price_per_sqft_min);
              const max = fmtPrice(m.price_per_sqft_max);
              const price = (min !== "—" && max !== "—") ? `${min}–${max}` : (max !== "—" ? max : "—");
              const yoy = m.annual_appreciation_min
                ? `${m.annual_appreciation_min}${m.annual_appreciation_max ? `–${m.annual_appreciation_max}` : ""}%`
                : "—";
              return (
                <Link
                  key={m.url_slug}
                  href={`/hyderabad/${m.url_slug}`}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 items-center px-5 py-4 border-b border-white/5 transition-colors hover:bg-white/4 last:border-0"
                >
                  <span className="text-white font-medium text-sm">{m.micro_market_name}</span>
                  <span className="font-bold text-sm" style={{ color: "#c8a96e" }}>{price}</span>
                  <span className="hidden sm:block text-emerald-400 text-sm font-medium">{yoy !== "—" ? `↑ ${yoy}` : "—"}</span>
                  <span>
                    <span className="inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                      style={{ background: t.color + "20", color: t.color }}>
                      {t.label}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Context */}
          <div className="space-y-6 mb-12">
            <h2 className="text-2xl font-bold text-white">Reading the Data</h2>

            <div className="rounded-2xl border border-white/8 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
              <h3 className="text-white font-semibold mb-3">What drives these prices?</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Hyderabad's west corridor pricing is primarily driven by proximity to the HITEC City–Financial District–Gachibowli tech employment belt. Projects within 5 km of this belt command a 25–40% premium over comparable projects at the outer ring. Secondary drivers include Metro connectivity (Phase 1 stations added 8–12% to prices along the Miyapur–LB Nagar corridor), school catchment areas (international schools add ₹800–1,200/sqft to nearby projects), and developer brand (established builders command 10–15% over comparable projects from growing builders).
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
              <h3 className="text-white font-semibold mb-3">Why Financial District prices are where they are</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                At ₹12,000–14,000/sqft, Financial District commands Hyderabad's highest residential prices — a function of constrained land supply, proximity to 150,000+ tech jobs, and the concentration of MNC campuses (Google, Meta, Amazon, Apple all have large offices here). The area has absorbed a decade of NRI and HNI investment, making it the most liquid real estate market in the city. Expect 8–12% annual appreciation with limited downside risk.
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
              <h3 className="text-white font-semibold mb-3">The Kokapet value case</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Kokapet is the most discussed micro-market in Hyderabad right now — and for good reason. At ₹10,500–12,500/sqft for new launches, it sits 15–20% below Financial District pricing while sharing the same employment catchment. The Kokapet SEZ (22 million sqft approved), direct ORR access, and new luxury project launches (Prestige, My Home) have driven 18–22% YoY appreciation in 2024–25. Our view: a 3–5 year hold here likely outperforms almost any other Hyderabad micro-market.
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
              <h3 className="text-white font-semibold mb-3">The emerging corridor play</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Kollur, Mokila, and Tellapur sit at ₹5,500–7,500/sqft — roughly half the price of the premium belt. The thesis here is simple: these corridors are the 2018 version of Narsingi (which was ₹4,200/sqft then, now ₹8,500+). Infrastructure investment — ORR extensions, the proposed Metro Phase 2 corridor, and IT park approvals — is the catalyst. Higher risk, significantly higher upside. Not suitable for end-use buyers who need ready possession.
              </p>
            </div>
          </div>

          {/* Methodology note */}
          <div className="rounded-2xl border border-white/8 p-5 mb-10" style={{ background: "rgba(200,169,110,0.04)", borderColor: "rgba(200,169,110,0.15)" }}>
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "#c8a96e" }}>Data Methodology</p>
            <p className="text-slate-500 text-xs leading-relaxed">
              Price ranges are derived from RERA project filings (developer-declared prices), recent transaction data, and our advisors' on-ground checks. Prices represent new-launch / primary market rates and may differ from resale prices. Appreciation figures are trailing 12-month estimates and are not guarantees of future performance.
            </p>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-white/8 p-6 text-center" style={{ background: "rgba(200,169,110,0.05)", borderColor: "rgba(200,169,110,0.2)" }}>
            <p className="text-white font-semibold mb-2">Want a micro-market walkthrough?</p>
            <p className="text-slate-400 text-sm mb-4">Our advisors have visited every project in this table. Get a personalised comparison for your budget and timeline.</p>
            <Link
              href="/contact"
              className="inline-block rounded-full px-6 py-2.5 text-sm font-bold uppercase tracking-[0.1em]"
              style={{ background: "linear-gradient(135deg, #c8a96e, #a8843e)", color: "#0a0a0a" }}
            >
              Talk to an Advisor — Free
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
