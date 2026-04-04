import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { InsightsAdvisorCTA } from "../InsightsAdvisorCTA";

export const metadata: Metadata = {
  title: "Hyderabad Price Tracker — Live Rates by Micro-Market | Westside Realty",
  description:
    "Live price-per-sqft rates across 19 Hyderabad micro-markets. RERA-sourced data updated regularly.",
};

export const revalidate = 3600;

const C = {
  bg: "#FAFAF7",
  bgCard: "#FFFFFF",
  bgWarm: "#F5F3EE",
  bgDark: "#1A1A1F",
  gold: "#B08D57",
  goldLight: "#C9A96E",
  text: "#1A1A1F",
  textMuted: "#7A7A7E",
  border: "rgba(0,0,0,0.07)",
} as const;

const TIER_ORDER = [
  "financial-district", "gachibowli", "kokapet", "nanakramguda",
  "kondapur", "raidurgam", "narsingi", "gopanpally", "puppalaguda",
  "tellapur", "neopolis", "serilingampally", "kollur", "mokila",
  "tukkuguda", "gandipet", "rajendra-nagar", "budwel", "osman-nagar",
];

function tier(slug: string) {
  const idx = TIER_ORDER.indexOf(slug);
  if (idx < 4) return { label: "Premium", color: C.gold };
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

  const markets = (data ?? []) as Array<{
    micro_market_name: string;
    url_slug: string;
    price_per_sqft_min: number | null;
    price_per_sqft_max: number | null;
    annual_appreciation_min: number | null;
    annual_appreciation_max: number | null;
  }>;

  const updatedDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <>
      <style>{`
        .pt-table-row:hover { background: #F5F3EE !important; }
        .pt-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 768px) {
          .pt-summary-grid { grid-template-columns: 1fr !important; }
          .pt-table-head span:nth-child(3), .pt-table-row span:nth-child(3) { display: none !important; }
        }
      `}</style>

      {/* Hero */}
      <section style={{ background: C.bgDark, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 65% 60% at 65% 40%, rgba(176,141,87,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "100px 24px 64px", position: "relative" }}>
          <Link href="/insights" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none", display: "inline-block", marginBottom: 24 }}>
            ← Back to Research
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: C.gold }}>Research Report</span>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 9, fontWeight: 700, textTransform: "uppercase", background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 20, padding: "3px 10px" }}>LIVE</span>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(36px,5vw,56px)", fontWeight: 600, color: "#fff", lineHeight: 1.15, margin: "0 0 16px" }}>Price Tracker</h1>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, maxWidth: 580, margin: "0 0 8px" }}>
            Live price-per-sqft rates across 19 Hyderabad micro-markets, sourced from RERA filings and developer launches.
          </p>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>Last updated: {updatedDate}</p>
        </div>
      </section>

      {/* Executive Summary */}
      <section style={{ background: C.bg, padding: "48px 24px 0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ background: C.bgCard, borderLeft: `4px solid ${C.gold}`, padding: "24px 28px", borderRadius: "0 12px 12px 0" }}>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: C.gold, margin: "0 0 12px" }}>Executive Summary</p>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, color: C.text, lineHeight: 1.7, margin: 0 }}>
              Hyderabad&apos;s west corridor currently ranges from ₹5.2K/sqft in emerging areas to ₹14K+ in the premium Financial District belt. Kokapet and Narsingi are leading YoY appreciation at 18–22%, while the premium core (Financial District, Gachibowli) sustains 8–12% compounding with very low vacancy risk.
            </p>
          </div>
        </div>
      </section>

      {/* Body */}
      <section style={{ background: C.bg, padding: "40px 24px 80px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          {/* Summary tiles */}
          <div className="pt-summary-grid" style={{ marginBottom: 40 }}>
            {[
              { label: "Lowest entry", value: "₹5.2K/sqft", sub: "Emerging corridors" },
              { label: "Premium belt", value: "₹11K–₹14K", sub: "Financial District & Gachibowli" },
              { label: "Fastest YoY growth", value: "18–22%", sub: "Kokapet & Narsingi" },
            ].map((s) => (
              <div key={s.label} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: C.textMuted, margin: "0 0 8px" }}>{s.label}</p>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 600, color: C.gold, margin: "0 0 4px", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, margin: 0 }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Price table */}
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 48 }}>
            <div className="pt-table-head" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 8, padding: "12px 20px", background: C.bgWarm, borderBottom: `1px solid ${C.border}` }}>
              {["Micro-Market", "Price Range", "YoY Growth", "Tier"].map((h) => (
                <span key={h} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: C.textMuted }}>{h}</span>
              ))}
            </div>
            {markets.map((m, i) => {
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
                  className="pt-table-row"
                  style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 8, alignItems: "center", padding: "14px 20px", borderBottom: i < markets.length - 1 ? `1px solid ${C.border}` : "none", textDecoration: "none", transition: "background 0.15s" }}
                >
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 500, color: C.text }}>{m.micro_market_name}</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: C.gold }}>{price}</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 500, color: "#4ade80" }}>{yoy !== "—" ? `↑ ${yoy}` : "—"}</span>
                  <span style={{ background: t.color + "18", color: t.color, fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", borderRadius: 20, padding: "3px 10px", display: "inline-block", width: "fit-content" }}>{t.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Context */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 48 }}>
            {[
              { title: "What drives these prices?", body: "Hyderabad's west corridor pricing is primarily driven by proximity to the HITEC City–Financial District–Gachibowli tech employment belt. Projects within 5 km of this belt command a 25–40% premium over comparable projects at the outer ring. Secondary drivers include Metro connectivity, school catchment areas, and developer brand (established builders command 10–15% premium)." },
              { title: "Why Financial District prices are where they are", body: "At ₹12,000–14,000/sqft, Financial District commands Hyderabad's highest residential prices — a function of constrained land supply, proximity to 150,000+ tech jobs, and the concentration of MNC campuses (Google, Meta, Amazon, Apple). The area has absorbed a decade of NRI and HNI investment, making it the most liquid real estate market in the city." },
              { title: "The Kokapet value case", body: "Kokapet was the story of 2025 and the narrative is still running. At ₹10,500–12,500/sqft for new launches, it sits 15–20% below Financial District pricing while sharing the same employment catchment. The Kokapet SEZ approval (22 million sqft) has driven 18–22% YoY appreciation in 2024–25." },
              { title: "The emerging corridor play", body: "Kollur, Mokila, and Tellapur sit at ₹5,500–7,500/sqft — roughly half the price of the premium belt. The thesis: these corridors are the 2018 version of Narsingi (which was ₹4,200/sqft then, now ₹8,500+). Infrastructure investment is the catalyst. Higher risk, significantly higher upside." },
            ].map((s) => (
              <div key={s.title} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 600, color: C.text, margin: "0 0 10px" }}>{s.title}</h3>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, color: C.textMuted, lineHeight: 1.75, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>

          {/* Methodology */}
          <div style={{ background: "rgba(176,141,87,0.05)", border: `1px solid rgba(176,141,87,0.2)`, borderRadius: 16, padding: 24 }}>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: C.gold, margin: "0 0 10px" }}>Data Methodology</p>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted, lineHeight: 1.75, margin: 0 }}>
              Price ranges are derived from RERA project filings, recent transaction data, and our advisors&apos; on-ground checks. Prices represent new-launch / primary market rates and may differ from resale prices. Appreciation figures are trailing 12-month estimates and are not guarantees of future performance.
            </p>
          </div>
        </div>
      </section>

      <InsightsAdvisorCTA />
    </>
  );
}
