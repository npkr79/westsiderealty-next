import type { Metadata } from "next";
import Link from "next/link";
import { InsightsAdvisorCTA } from "../InsightsAdvisorCTA";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Hyderabad Real Estate Market Report Q1 2026 | Westside Realty",
  description:
    "Q1 2026 Hyderabad real estate market report. West corridor analysis, price trends, demand/supply data, and investment outlook.",
};

const REPORT_DATE = "March 2026";

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

export default function MarketReportsPage() {
  return (
    <>
      <style>{`
        .rp-body h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26px; font-weight: 600; color: #1A1A1F; margin: 40px 0 16px; }
        .rp-body h3 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px; font-weight: 600; color: #1A1A1F; margin: 0 0 10px; }
        .rp-body p { font-family: 'Outfit', sans-serif; font-size: 15px; color: #1A1A1F; line-height: 1.8; margin: 0 0 14px; }
        .rp-kf-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 768px) {
          .rp-kf-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .rp-risk-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Hero */}
      <section style={{ background: C.bgDark, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 65% 60% at 65% 40%, rgba(176,141,87,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "100px 24px 64px", position: "relative" }}>
          <Link href="/insights" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none", display: "inline-block", marginBottom: 24 }}>
            ← Back to Research
          </Link>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: C.gold }}>Research Report · {REPORT_DATE}</span>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(36px,5vw,56px)", fontWeight: 600, color: "#fff", lineHeight: 1.15, margin: "0 0 20px" }}>
            Hyderabad Real Estate<br />Q1 2026 Report
          </h1>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, maxWidth: 580, margin: 0 }}>
            West corridor analysis, price trends, and demand signals across 19 micro-markets. Updated quarterly.
          </p>
        </div>
      </section>

      {/* Executive Summary */}
      <section style={{ background: C.bg, padding: "48px 24px 0" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ background: C.bgCard, borderLeft: `4px solid ${C.gold}`, padding: "24px 28px", borderRadius: "0 12px 12px 0" }}>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: C.gold, margin: "0 0 12px" }}>Executive Summary</p>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, color: C.text, lineHeight: 1.7, margin: 0 }}>
              Hyderabad&apos;s residential market entered 2026 with strong fundamentals: stable absorption, limited speculative inventory, and employer demand from the HITEC City belt showing no signs of cooling. Q1 new launches were up 14% YoY, with the premium segment (₹2Cr+) accounting for 38% of launches — a record. Financial District and Kokapet continue to lead price appreciation.
            </p>
          </div>
        </div>
      </section>

      {/* Body */}
      <section style={{ background: C.bg, padding: "40px 24px 80px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }} className="rp-body">

          {/* Key findings */}
          <h2>Key Findings</h2>
          <div className="rp-kf-grid" style={{ marginBottom: 48 }}>
            {[
              { stat: "+14%", label: "New launches YoY", sub: "Premium segment leads" },
              { stat: "₹10,200", label: "Avg. launch price/sqft", sub: "West corridor, all segments" },
              { stat: "4.2 months", label: "Avg. inventory absorption", sub: "Down from 5.8 months in Q4 2025" },
              { stat: "38%", label: "₹2Cr+ share of launches", sub: "Highest ever recorded" },
              { stat: "+19%", label: "Kokapet appreciation YoY", sub: "Top performing micro-market" },
              { stat: "68%", label: "End-use buyer share", sub: "vs 58% two years ago" },
            ].map((s) => (
              <div key={s.label} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 600, color: C.gold, margin: "0 0 4px", lineHeight: 1 }}>{s.stat}</p>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: C.text, margin: "0 0 2px" }}>{s.label}</p>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, margin: 0 }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Corridor analysis */}
          <h2>Corridor Analysis</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 48 }}>
            {[
              { name: "Financial District — Gachibowli", badge: "PREMIUM CORE", badgeColor: C.gold, price: "₹11,000–14,000/sqft", trend: "↑ 10–12% YoY", body: "The undisputed premium core. Q1 saw three major launches — all priced above ₹12,500/sqft with 80%+ booking rates within 30 days. The area's 150,000+ tech workforce and 0% vacancy on Grade A commercial space makes it one of India's strongest residential demand drivers. Supply is constrained: very few large land parcels remain.", bullets: ["Low inventory risk", "Strong rental yield (4.2–4.8%)", "High NRI demand", "Limited new supply pipeline post-2026"] },
              { name: "Kokapet — Narsingi", badge: "TOP VALUE", badgeColor: "#4ade80", price: "₹9,500–12,500/sqft", trend: "↑ 18–22% YoY", body: "The best risk-reward in Hyderabad right now. Kokapet was the story of 2025 and the narrative is still running. The Kokapet SEZ approval (22 million sqft) is the structural catalyst that will take this corridor to Financial District-level pricing by 2028–29. Narsingi trades at a 15% discount to Kokapet but shares the same fundamentals.", bullets: ["Highest appreciation trajectory in city", "Direct ORR access", "SEZ employment catalyst", "Some infrastructure timeline risk"] },
              { name: "Kondapur — Raidurgam", badge: "ESTABLISHED", badgeColor: "#60a5fa", price: "₹8,500–11,000/sqft", trend: "↑ 8–10% YoY", body: "The most liveable corridor in Hyderabad. Kondapur has mature social infrastructure — international schools, hospitals, supermarkets — that buyers in newer corridors wait years for. Projects here have the best tenant profiles for rental investors. Price appreciation is slower than Kokapet but much more predictable.", bullets: ["Best schools catchment (ISH, Oakridge)", "Strong rental demand", "Good Metro connectivity", "Moderate appreciation upside"] },
              { name: "Tellapur — Gopanpally — Neopolis", badge: "GROWTH", badgeColor: "#a78bfa", price: "₹6,500–9,000/sqft", trend: "↑ 12–15% YoY", body: "The growth belt between the premium core and the outer ring. These micro-markets are beneficiaries of spillover from Kondapur and Gachibowli as pricing there has moved beyond many end-use budgets. Large-format township developments have created self-sufficient mini-markets here.", bullets: ["Better value than inner belt", "Large township projects with amenities", "Infrastructure improving steadily", "End-use + investment suitable"] },
              { name: "Kollur — Mokila — Budwel", badge: "EMERGING", badgeColor: "#34d399", price: "₹4,800–7,000/sqft", trend: "↑ 10–14% YoY", body: "For the patient investor with a 5+ year horizon. These corridors sit at the outer ring where today's prices are 50–60% below the premium core. The bull case: the same infrastructure expansion that drove Narsingi from ₹4,200 to ₹8,500/sqft over seven years is now being repeated here.", bullets: ["Lowest entry price in the city", "High risk, high upside", "5–7 year horizon required", "Not suitable for immediate end-use"] },
            ].map((c) => (
              <div key={c.name} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                  <div>
                    <h3>{c.name}</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 4 }}>
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: C.gold }}>{c.price}</span>
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "#4ade80" }}>{c.trend}</span>
                    </div>
                  </div>
                  <span style={{ background: c.badgeColor + "20", color: c.badgeColor, fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", borderRadius: 20, padding: "4px 12px" }}>{c.badge}</span>
                </div>
                <p style={{ margin: "0 0 14px", color: C.textMuted }}>{c.body}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {c.bullets.map((b) => (
                    <span key={b} style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 20, fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, padding: "4px 12px" }}>{b}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Demand & Supply */}
          <h2>Demand &amp; Supply Signals</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 48 }}>
            {[
              { title: "End-use demand is at a decade high", body: "68% of buyers in Q1 2026 are owner-occupiers — the highest share since 2015. End-use buyers are less likely to cancel bookings and create genuine rental demand as they move in. Speculative flipping is structurally lower in Hyderabad because stamp duty reform and RERA penalties make quick exits expensive." },
              { title: "NRI demand softening but still significant", body: "NRI buyers accounted for 22% of premium segment sales in Q1, down from 28% in Q1 2025. The Fed rate cut cycle means USD-denominated savings earn less. This is a 12–18 month headwind for the very top of the market (₹3Cr+) but has no meaningful impact on the ₹1–2.5Cr segment." },
              { title: "Construction costs stabilising", body: "After two years of 15–20% YoY inflation in construction costs, Q1 2026 saw stabilisation. Steel prices are flat at ₹58,000–60,000/tonne; cement at ₹370–390/bag. This is positive for developer margins and should translate to fewer project delays." },
              { title: "Inventory health is good", body: "Total unsold inventory in Hyderabad stands at approximately 48,000 units. At current absorption rates, this represents 14–16 months of supply — healthy territory. Compare this to Mumbai (38 months) or Bengaluru (22 months). The relative scarcity keeps price floors firm." },
            ].map((s) => (
              <div key={s.title} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                <h3>{s.title}</h3>
                <p style={{ margin: 0, color: C.textMuted }}>{s.body}</p>
              </div>
            ))}
          </div>

          {/* Risks */}
          <h2>Key Risks to Watch</h2>
          <div className="rp-risk-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 48 }}>
            {[
              { risk: "State election uncertainty", detail: "Telangana elections expected in late 2026. Infrastructure approvals tend to slow 6–9 months pre-election." },
              { risk: "Tech sector hiring slowdown", detail: "A US recession or AI-driven workforce reduction at major employers would hit Hyderabad residential demand disproportionately." },
              { risk: "Oversupply in emerging corridors", detail: "Plotted layout approvals in Kollur/Mokila have been aggressive. If absorption lags, early investors could face price pressure." },
              { risk: "Delayed infrastructure delivery", detail: "Metro Phase 2 and several ORR extensions are behind schedule. Micro-markets that priced in this infrastructure carry downside risk." },
            ].map((r) => (
              <div key={r.risk} style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 14, padding: "16px 20px" }}>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: "#f87171", margin: "0 0 6px" }}>⚠ {r.risk}</p>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted, lineHeight: 1.65, margin: 0 }}>{r.detail}</p>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: C.textMuted, margin: "0 0 8px" }}>Disclaimer</p>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, lineHeight: 1.7, margin: 0 }}>
              This report is for informational purposes only and does not constitute investment advice. Price data is sourced from RERA filings, developer declarations, and our advisors&apos; on-ground observations. Appreciation figures are historical and do not guarantee future performance. Always conduct independent due diligence before any real estate transaction.
            </p>
          </div>
        </div>
      </section>

      <InsightsAdvisorCTA />
    </>
  );
}
