import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export const metadata: Metadata = {
  title: "Hyderabad Micro-Markets | Westside Realty Intelligence",
  description: "Live price intelligence across 19 micro-markets in Hyderabad's west corridor.",
};

export const revalidate = 3600;

const MARKET_PRIORITY = [
  "gachibowli", "financial-district", "kokapet", "nanakramguda", "kondapur",
  "narsingi", "puppalaguda", "tellapur", "gopanpally", "raidurgam",
  "kollur", "mokila", "neopolis", "serilingampally", "tukkuguda",
  "gandipet", "rajendra-nagar", "budwel", "osman-nagar",
];

const AI_PICKS = [
  {
    slug: "kokapet",
    name: "Kokapet",
    insight: "Early-stage pricing at ₹11.2K/sqft. Fastest appreciation in west corridor.",
    rating: "Strong Buy",
    color: "#22c55e",
  },
  {
    slug: "financial-district",
    name: "Financial District",
    insight: "Premium addresses, institutional demand. Limited ready inventory.",
    rating: "Buy",
    color: "#3b82f6",
  },
  {
    slug: "kollur",
    name: "Kollur",
    insight: "Lowest entry in west corridor. 4.1% appreciation. Infrastructure catching up.",
    rating: "Accumulate",
    color: "#c8a96e",
  },
];

type MicroMarket = {
  micro_market_name: string;
  url_slug: string;
  city_slug: string;
  price_per_sqft_min: number | null;
  price_per_sqft_max: number | null;
  annual_appreciation_min: number | null;
};

function formatPrice(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;
  if (min && max) return `${fmt(min)}–${fmt(max)}/sqft`;
  return `${fmt((min ?? max)!)}/sqft`;
}

export default async function MarketsHubPage() {
  let markets: MicroMarket[] = [];
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("micro_markets")
      .select("micro_market_name, url_slug, city_slug, price_per_sqft_min, price_per_sqft_max, annual_appreciation_min")
      .eq("city_slug", "hyderabad");
    markets = (data as MicroMarket[]) ?? [];
  } catch {
    /* render with empty list */
  }

  markets.sort((a, b) => {
    const ia = MARKET_PRIORITY.indexOf(a.url_slug);
    const ib = MARKET_PRIORITY.indexOf(b.url_slug);
    if (ia === -1 && ib === -1) return a.micro_market_name.localeCompare(b.micro_market_name);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const displayMarkets = markets.length > 0 ? markets : MARKET_PRIORITY.map((slug) => ({
    micro_market_name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    url_slug: slug,
    city_slug: "hyderabad",
    price_per_sqft_min: null,
    price_per_sqft_max: null,
    annual_appreciation_min: null,
  }));

  return (
    <main style={{ background: "#080808", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="pb-16 px-4" style={{ paddingTop: 88, background: "linear-gradient(to bottom, #0d0d0d, #080808)" }}>
        <div className="container mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#c8a96e" }}>
            Hyderabad · West Corridor
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Where to buy in<br />Hyderabad right now
          </h1>
          <p className="text-slate-400 text-lg mb-10 max-w-xl">
            Live price intelligence across {displayMarkets.length} micro-markets
          </p>
          <div className="flex flex-wrap gap-8">
            {[
              { value: "577+", label: "Projects" },
              { value: String(displayMarkets.length), label: "Markets" },
              { value: "₹7.2K–₹14K", label: "/sqft range" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Picks */}
      <section className="px-4 py-12">
        <div className="container mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#c8a96e" }}>
            AI Picks
          </p>
          <h2 className="text-xl font-bold text-white mb-6">Top opportunities right now</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {AI_PICKS.map((pick) => (
              <Link
                key={pick.slug}
                href={`/hyderabad/${pick.slug}`}
                className="rounded-2xl border p-5 transition-all duration-200 hover:scale-[1.01]"
                style={{ borderColor: pick.color + "50", background: pick.color + "0d" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-bold">{pick.name}</span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
                    style={{ background: pick.color + "25", color: pick.color }}
                  >
                    {pick.rating}
                  </span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{pick.insight}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* All Markets Grid */}
      <section className="px-4 py-4 pb-20">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-xl font-bold text-white mb-6">All {displayMarkets.length} Markets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayMarkets.map((m) => {
              const price = formatPrice(m.price_per_sqft_min, m.price_per_sqft_max);
              return (
                <Link
                  key={m.url_slug}
                  href={`/hyderabad/${m.url_slug}`}
                  className="group rounded-2xl border border-white/8 p-5 transition-all duration-200 hover:border-white/20 hover:bg-white/4"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <p className="text-white font-semibold mb-2">{m.micro_market_name}</p>
                  {price && (
                    <p className="text-sm font-bold mb-1" style={{ color: "#c8a96e" }}>{price}</p>
                  )}
                  {m.annual_appreciation_min != null && (
                    <p className="text-xs text-emerald-400">↑{m.annual_appreciation_min}% YoY</p>
                  )}
                  <p className="text-xs text-slate-600 mt-3 group-hover:text-slate-400 transition-colors">
                    View market →
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
