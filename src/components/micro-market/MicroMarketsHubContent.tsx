"use client";

import { useState } from "react";
import Link from "next/link";
import type { MicroMarketCacheRow } from "@/services/microMarketViewModel";

// ─── Design System ─────────────────────────────────────────────────────────────
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

type TabKey = "all" | "high-growth" | "luxury" | "affordable";
type MicroMarketHubItem = MicroMarketCacheRow;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getAvgPrice(m: MicroMarketHubItem) {
  const min = m.price_per_sqft_min ?? 0;
  const max = m.price_per_sqft_max ?? 0;
  return min && max ? (min + max) / 2 : min || max || 0;
}
const isHighGrowth = (m: MicroMarketHubItem) =>
  (m.annual_appreciation_min != null && m.annual_appreciation_min > 12) ||
  (m.rental_yield_min != null && m.rental_yield_min >= 7);
const isLuxury = (m: MicroMarketHubItem) => getAvgPrice(m) > 10000;
const isAffordable = (m: MicroMarketHubItem) =>
  getAvgPrice(m) < 8000 && getAvgPrice(m) > 0;

function fmtPrice(v: number | null | undefined) {
  if (!v) return null;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${v.toLocaleString("en-IN")}`;
}

function stripHtml(html: string | null | undefined) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

function getSignalBadge(m: MicroMarketHubItem): { label: string; color: string; bg: string; border: string } {
  const a = m.annual_appreciation_min ?? 0;
  const y = m.rental_yield_min ?? 0;
  if (a >= 15 || y >= 7)
    return { label: "High Growth", color: "#15803d", bg: "rgba(21,128,61,0.08)", border: "rgba(21,128,61,0.2)" };
  if (a >= 10 || y >= 5)
    return { label: "Steady", color: C.gold, bg: "rgba(176,141,87,0.08)", border: "rgba(176,141,87,0.25)" };
  return { label: "Stable", color: C.textMuted, bg: "rgba(122,122,126,0.08)", border: "rgba(122,122,126,0.2)" };
}

// ─── MarketCard ────────────────────────────────────────────────────────────────
function MarketCard({ market, citySlug }: { market: MicroMarketHubItem; citySlug: string }) {
  const href = `/${citySlug}/${market.url_slug ?? market.id}`;
  const hook = stripHtml(market.hero_hook);
  const badge = getSignalBadge(market);

  const priceDisplay = market.price_per_sqft_min && market.price_per_sqft_max
    ? `${fmtPrice(market.price_per_sqft_min)} – ${fmtPrice(market.price_per_sqft_max)}/sqft`
    : fmtPrice(market.price_per_sqft_min ?? market.price_per_sqft_max)
      ? `${fmtPrice(market.price_per_sqft_min ?? market.price_per_sqft_max)}/sqft`
      : null;

  const growthDisplay = market.annual_appreciation_min ? `${market.annual_appreciation_min}%+` : null;
  const yieldDisplay = market.rental_yield_min
    ? market.rental_yield_max
      ? `${market.rental_yield_min}–${market.rental_yield_max}%`
      : `${market.rental_yield_min}%+`
    : null;

  return (
    <Link
      href={href}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        style={{
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: "24px",
          transition: "box-shadow 0.2s, border-color 0.2s, transform 0.2s",
          cursor: "pointer",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)";
          el.style.borderColor = `rgba(176,141,87,0.35)`;
          el.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = "none";
          el.style.borderColor = C.border;
          el.style.transform = "translateY(0)";
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <h3 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 20,
            fontWeight: 600,
            color: C.text,
            lineHeight: 1.2,
            margin: 0,
            flex: 1,
          }}>
            {market.micro_market_name ?? "Market"}
          </h3>
          <span style={{
            flexShrink: 0,
            fontFamily: "'Outfit', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: badge.color,
            background: badge.bg,
            border: `1px solid ${badge.border}`,
            borderRadius: 20,
            padding: "3px 10px",
            whiteSpace: "nowrap",
          }}>
            {badge.label}
          </span>
        </div>

        {/* Hook */}
        {hook && (
          <p style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13,
            color: C.textMuted,
            lineHeight: 1.65,
            margin: 0,
          }}>
            {hook}
          </p>
        )}

        {/* Stats */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: "auto" }}>
          {priceDisplay && (
            <div style={{
              flex: "1 1 auto",
              background: C.bgWarm,
              borderRadius: 10,
              padding: "10px 14px",
            }}>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 3px" }}>Price</p>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>{priceDisplay}</p>
            </div>
          )}
          {growthDisplay && (
            <div style={{
              flex: "1 1 auto",
              background: "rgba(21,128,61,0.06)",
              borderRadius: 10,
              padding: "10px 14px",
            }}>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 3px" }}>Growth</p>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: "#15803d", margin: 0 }}>{growthDisplay}</p>
            </div>
          )}
          {yieldDisplay && (
            <div style={{
              flex: "1 1 auto",
              background: "rgba(59,130,246,0.06)",
              borderRadius: 10,
              padding: "10px 14px",
            }}>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 3px" }}>Yield</p>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: "#2563eb", margin: 0 }}>{yieldDisplay}</p>
            </div>
          )}
        </div>

        {/* Arrow */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "'Outfit', sans-serif",
          fontSize: 12,
          fontWeight: 600,
          color: C.gold,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}>
          View Market <span style={{ fontSize: 14 }}>→</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
interface MicroMarketsHubContentProps {
  markets: MicroMarketCacheRow[];
  citySlug: string;
  cityName: string;
}

export default function MicroMarketsHubContent({ markets, citySlug, cityName }: MicroMarketsHubContentProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [showComparison, setShowComparison] = useState(false);

  const highGrowthMarkets = markets.filter(isHighGrowth);
  const luxuryMarkets = markets.filter(isLuxury);
  const affordableMarkets = markets.filter(isAffordable);

  const filtered: Record<TabKey, MicroMarketHubItem[]> = {
    all: markets,
    "high-growth": highGrowthMarkets,
    luxury: luxuryMarkets,
    affordable: affordableMarkets,
  };
  const visibleMarkets = filtered[activeTab];

  // Aggregate stats
  const allPrices = markets.flatMap((m) => [m.price_per_sqft_min, m.price_per_sqft_max]).filter((v): v is number => v != null);
  const allYields = markets.map((m) => m.rental_yield_min).filter((v): v is number => v != null);
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : null;
  const avgYield = allYields.length > 0 ? (allYields.reduce((a, b) => a + b, 0) / allYields.length).toFixed(1) : null;

  const tabs = [
    { key: "all" as TabKey, label: "All Markets", count: markets.length },
    { key: "high-growth" as TabKey, label: "High Growth", count: highGrowthMarkets.length },
    { key: "luxury" as TabKey, label: "Luxury", count: luxuryMarkets.length },
    { key: "affordable" as TabKey, label: "Value", count: affordableMarkets.length },
  ];

  const faqs = [
    {
      q: `Which micro-market in ${cityName} offers the best ROI?`,
      a: `Markets with 15%+ annual appreciation show the strongest growth. ROI depends on your investment timeline and risk appetite. The High Growth filter surfaces markets with above-average appreciation or rental yield.`,
    },
    {
      q: `What is the average price per sq.ft in ${cityName}?`,
      a: `Prices vary significantly by corridor. The Financial District and Kokapet command ₹8,000–14,000/sqft for premium projects. Value markets in the outer ring start from ₹5,000/sqft.`,
    },
    {
      q: `How do I choose between luxury and value micro-markets?`,
      a: `Luxury markets offer stronger capital appreciation and premium tenant profiles. Value markets provide better rental yield ratios and lower entry capital. Your investment horizon and liquidity needs should guide this.`,
    },
    {
      q: `How often is this data updated?`,
      a: `Price intelligence is refreshed regularly from RERA filings and developer data. Each market page shows data freshness.`,
    },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <style>{`
        .mm-hub-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .mm-hub-stats { display: flex; gap: 40px; flex-wrap: wrap; }
        .mm-hub-compare-grid { display: grid; grid-template-columns: repeat(5, 1fr); }
        @media (max-width: 900px) { .mm-hub-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 580px) { .mm-hub-grid { grid-template-columns: 1fr !important; } .mm-hub-stats { gap: 20px; } }
      `}</style>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section style={{ background: C.bgDark, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(176,141,87,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "100px 24px 72px", position: "relative" }}>

          {/* Breadcrumb */}
          <nav style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 32, fontFamily: "'Outfit', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
            >Home</Link>
            <span>›</span>
            <Link href={`/${citySlug}`} style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
            >{cityName}</Link>
            <span>›</span>
            <span style={{ color: "rgba(255,255,255,0.6)" }}>Markets</span>
          </nav>

          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: C.gold, marginBottom: 16 }}>
            {cityName} · Market Intelligence
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 600, color: "#fff", lineHeight: 1.12, margin: "0 0 20px", maxWidth: 700 }}>
            {cityName} Real Estate<br />Micro-Market Guide
          </h1>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 17, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, maxWidth: 560, margin: "0 0 48px" }}>
            Compare prices, growth rates, and rental yields across {markets.length} micro-markets. Identify the right corridor for your investment profile.
          </p>

          {/* Stats row */}
          <div className="mm-hub-stats">
            {[
              { label: "Micro-Markets", value: String(markets.length) },
              ...(minPrice && maxPrice ? [{ label: "Price Range", value: `${fmtPrice(minPrice)} – ${fmtPrice(maxPrice)}/sqft` }] : []),
              ...(avgYield ? [{ label: "Avg Rental Yield", value: `${avgYield}%` }] : []),
              { label: "High Growth Markets", value: String(highGrowthMarkets.length) },
            ].map((s) => (
              <div key={s.label}>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 600, color: C.goldLight, margin: "0 0 4px", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sticky Filter Tabs ────────────────────────────────────────────────── */}
      <div style={{ position: "sticky", top: 64, zIndex: 30, background: "rgba(250,250,247,0.96)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", gap: 8, padding: "12px 0", overflowX: "auto" }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flexShrink: 0,
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "8px 18px",
                  borderRadius: 24,
                  border: "1px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  ...(activeTab === tab.key
                    ? { background: C.gold, color: "#fff", borderColor: C.gold }
                    : { background: "transparent", color: C.textMuted, borderColor: C.border }),
                }}
              >
                {tab.label} <span style={{ opacity: 0.7, fontSize: 11 }}>({tab.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Markets Grid ──────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1160, margin: "0 auto", padding: "48px 24px" }}>
        {visibleMarkets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, color: C.textMuted }}>No markets in this category.</p>
          </div>
        ) : (
          <div className="mm-hub-grid">
            {visibleMarkets.map((market) => (
              <MarketCard key={market.id} market={market} citySlug={citySlug} />
            ))}
          </div>
        )}
      </section>

      {/* ── Comparison Table ──────────────────────────────────────────────────── */}
      {markets.length > 0 && (
        <section style={{ background: C.bgCard, borderTop: `1px solid ${C.border}`, padding: "0 0 48px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <button
              onClick={() => setShowComparison(!showComparison)}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "28px 0",
                background: "none",
                border: "none",
                cursor: "pointer",
                borderBottom: showComparison ? `1px solid ${C.border}` : "none",
              }}
            >
              <div style={{ textAlign: "left" }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 600, color: C.text, margin: "0 0 4px" }}>
                  Side-by-Side Comparison
                </h2>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted, margin: 0 }}>
                  All {markets.length} markets at a glance
                </p>
              </div>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.gold, fontWeight: 600 }}>
                {showComparison ? "Hide ↑" : "Show ↓"}
              </span>
            </button>

            {showComparison && (
              <div style={{ overflowX: "auto", marginTop: 16 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                  <thead>
                    <tr style={{ background: C.bgDark }}>
                      {["Market", "Price Range", "Growth", "Yield", "Signal"].map((h) => (
                        <th key={h} style={{ padding: "12px 16px", fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", textAlign: "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {markets.map((m, i) => {
                      const badge = getSignalBadge(m);
                      const priceRange = m.price_per_sqft_min && m.price_per_sqft_max
                        ? `${fmtPrice(m.price_per_sqft_min)} – ${fmtPrice(m.price_per_sqft_max)}/sqft`
                        : fmtPrice(m.price_per_sqft_min ?? m.price_per_sqft_max)
                          ? `${fmtPrice(m.price_per_sqft_min ?? m.price_per_sqft_max)}/sqft`
                          : "—";
                      return (
                        <tr key={m.id} style={{ background: i % 2 === 0 ? C.bgCard : C.bg, borderTop: `1px solid ${C.border}` }}>
                          <td style={{ padding: "12px 16px" }}>
                            <Link href={`/${citySlug}/${m.url_slug ?? m.id}`} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: C.text, textDecoration: "none" }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)}
                              onMouseLeave={(e) => (e.currentTarget.style.color = C.text)}
                            >{m.micro_market_name ?? "—"}</Link>
                          </td>
                          <td style={{ padding: "12px 16px", fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, whiteSpace: "nowrap" }}>{priceRange}</td>
                          <td style={{ padding: "12px 16px", fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, color: "#15803d" }}>{m.annual_appreciation_min ? `${m.annual_appreciation_min}%+` : "—"}</td>
                          <td style={{ padding: "12px 16px", fontFamily: "'Outfit', sans-serif", fontSize: 12, color: "#2563eb" }}>{m.rental_yield_min ? `${m.rental_yield_min}%+` : "—"}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, borderRadius: 20, padding: "3px 10px" }}>
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section style={{ background: C.bgDark, padding: "72px 24px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: C.gold, marginBottom: 16 }}>Expert Advisory</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 600, color: "#fff", lineHeight: 1.2, margin: "0 0 16px" }}>
            Not sure which market fits your goals?
          </h2>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: "0 0 40px" }}>
            Our advisors have deep knowledge across every {cityName} corridor — with live transaction data and buyer insights you won't find on portals.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/contact" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", background: C.gold, color: "#fff", textDecoration: "none", padding: "14px 32px", borderRadius: 4 }}>
              Book a Free Call
            </Link>
            <Link href={`/${citySlug}/projects`} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", textDecoration: "none", padding: "14px 28px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 4 }}>
              Browse Projects →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQs ──────────────────────────────────────────────────────────────── */}
      <section style={{ background: C.bg, padding: "72px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: C.textMuted, textAlign: "center", marginBottom: 12 }}>Common Questions</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 600, color: C.text, textAlign: "center", margin: "0 0 40px" }}>
            Frequently Asked
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {faqs.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: open ? "12px" : "8px", overflow: "hidden", marginBottom: 8, transition: "border-radius 0.2s" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "18px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 16 }}
      >
        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{q}</span>
        <span style={{ flexShrink: 0, fontFamily: "'Outfit', sans-serif", fontSize: 18, color: C.gold, lineHeight: 1 }}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 22px 18px" }}>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted, lineHeight: 1.75, margin: 0 }}>{a}</p>
        </div>
      )}
    </div>
  );
}
