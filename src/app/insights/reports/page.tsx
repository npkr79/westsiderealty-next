import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hyderabad Real Estate Market Report Q1 2026 | Westside Realty",
  description:
    "Q1 2026 Hyderabad real estate market report. West corridor analysis, price trends, demand/supply data, and investment outlook.",
};

const REPORT_DATE = "March 2026";

export default function MarketReportsPage() {
  return (
    <main style={{ background: "#080808", minHeight: "100vh" }}>
      <section className="px-4 pb-16" style={{ paddingTop: 88, background: "linear-gradient(to bottom, #0d0d0d, #080808)" }}>
        <div className="container mx-auto max-w-3xl">
          <Link href="/insights" className="text-xs text-slate-500 hover:text-slate-300 transition-colors mb-6 inline-block">
            ← Back to Insights
          </Link>

          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#c8a96e" }}>
            Market Intelligence · {REPORT_DATE}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Hyderabad Real Estate<br />Q1 2026 Report
          </h1>
          <p className="text-slate-400 text-lg mb-12 max-w-xl">
            West corridor analysis, price trends, and demand signals across 19 micro-markets. Updated quarterly.
          </p>

          {/* Executive Summary */}
          <div className="rounded-2xl border p-6 mb-8" style={{ background: "rgba(200,169,110,0.06)", borderColor: "rgba(200,169,110,0.25)" }}>
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "#c8a96e" }}>Executive Summary</p>
            <p className="text-slate-300 text-sm leading-relaxed">
              Hyderabad's residential market entered 2026 with strong fundamentals: stable absorption, limited speculative inventory, and employer demand from the HITEC City belt showing no signs of cooling. Q1 new launches were up 14% YoY, with the premium segment (₹2Cr+) accounting for 38% of launches — a record. Financial District and Kokapet continue to lead price appreciation. Emerging corridors (Kollur, Mokila, Tellapur) are seeing the first serious institutional buyer interest. Risks: state election uncertainty, elevated construction costs, and a softening of NRI demand post-Fed rate cuts.
            </p>
          </div>

          {/* Key findings */}
          <h2 className="text-2xl font-bold text-white mb-6">Key Findings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {[
              { stat: "+14%", label: "New launches YoY", sub: "Premium segment leads" },
              { stat: "₹10,200", label: "Average launch price/sqft", sub: "West corridor, all segments" },
              { stat: "4.2 months", label: "Average inventory absorption", sub: "Down from 5.8 months in Q4 2025" },
              { stat: "38%", label: "₹2Cr+ share of launches", sub: "Highest ever recorded" },
              { stat: "+19%", label: "Kokapet appreciation YoY", sub: "Top performing micro-market" },
              { stat: "68%", label: "End-use buyer share", sub: "vs 58% two years ago" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/8 p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p className="text-2xl font-bold mb-1" style={{ color: "#c8a96e" }}>{s.stat}</p>
                <p className="text-white text-sm font-medium">{s.label}</p>
                <p className="text-slate-500 text-xs mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Corridor analysis */}
          <h2 className="text-2xl font-bold text-white mb-6">Corridor Analysis</h2>

          {[
            {
              name: "Financial District — Gachibowli",
              badge: "PREMIUM CORE",
              badgeColor: "#c8a96e",
              price: "₹11,000–14,000/sqft",
              trend: "↑ 10–12% YoY",
              body: "The undisputed premium core. Q1 saw three major launches — Prestige Gachibowli, My Home Avatar, and Aparna Constructions One — all priced above ₹12,500/sqft with 80%+ booking rates within 30 days of launch. The area's 150,000+ tech workforce and 0% vacancy on Grade A commercial space makes it one of India's strongest residential demand drivers. Supply is constrained: very few large land parcels remain. Premium will widen further vs. other micro-markets.",
              bullets: ["Low inventory risk", "Strong rental yield (4.2–4.8%)", "High NRI demand", "Limited new supply pipeline post-2026"],
            },
            {
              name: "Kokapet — Narsingi",
              badge: "TOP VALUE",
              badgeColor: "#4ade80",
              price: "₹9,500–12,500/sqft",
              trend: "↑ 18–22% YoY",
              body: "The best risk-reward in Hyderabad right now. Kokapet was the story of 2025 and the narrative is still running. The Kokapet SEZ approval (22 million sqft, anchored by Tata and Infosys) is the structural catalyst that will take this corridor to Financial District-level pricing by 2028–29. Narsingi, immediately adjacent, trades at a 15% discount to Kokapet but shares the same fundamentals. New launches are coming in fast — Godrej, Sattva, and Fortune Group all launched in Q1.",
              bullets: ["Highest appreciation trajectory in city", "Direct ORR access", "SEZ employment catalyst", "Some execution risk on infrastructure timelines"],
            },
            {
              name: "Kondapur — Raidurgam",
              badge: "ESTABLISHED",
              badgeColor: "#60a5fa",
              price: "₹8,500–11,000/sqft",
              trend: "↑ 8–10% YoY",
              body: "The most liveable corridor in Hyderabad. Kondapur has mature social infrastructure — international schools, hospitals, supermarkets, restaurants — that buyers in newer corridors have to wait years for. Projects here have the best tenant profiles for rental investors. Price appreciation is slower than Kokapet but much more predictable. A safe choice for end-use buyers who want to move in within 2–3 years.",
              bullets: ["Best schools catchment (ISH, Oakridge)", "Strong rental demand", "Good Metro connectivity", "Moderate appreciation upside"],
            },
            {
              name: "Tellapur — Gopanpally — Neopolis",
              badge: "GROWTH",
              badgeColor: "#a78bfa",
              price: "₹6,500–9,000/sqft",
              trend: "↑ 12–15% YoY",
              body: "The growth belt between the premium core and the outer ring. These three micro-markets are the beneficiaries of spillover from Kondapur and Gachibowli as pricing there has moved beyond many end-use budgets. Large-format township developments (Aparna Sarovar, My Home Tarkashyam) have created self-sufficient mini-markets here. Infrastructure is still catching up — travel times to the tech belt are 20–35 minutes — but this is improving.",
              bullets: ["Better value than inner belt", "Large township projects with amenities", "Infrastructure improving steadily", "End-use + investment suitable"],
            },
            {
              name: "Kollur — Mokila — Budwel",
              badge: "EMERGING",
              badgeColor: "#34d399",
              price: "₹4,800–7,000/sqft",
              trend: "↑ 10–14% YoY",
              body: "For the patient investor with a 5+ year horizon. These corridors sit at the outer ring where today's prices are 50–60% below the premium core. The bull case: the same infrastructure expansion that drove Narsingi from ₹4,200 to ₹8,500/sqft over seven years is now being repeated here. ORR access is already in place. Metro Phase 2 (pending approval) would be transformative. The bear case: slower employment growth, oversupply risk from too many plotted layouts, and basic amenities still years away.",
              bullets: ["Lowest entry price in the city", "High risk, high upside", "5–7 year horizon required", "Not suitable for immediate end-use"],
            },
          ].map((c) => (
            <div key={c.name} className="rounded-2xl border border-white/8 p-6 mb-5" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{c.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="font-bold text-sm" style={{ color: "#c8a96e" }}>{c.price}</span>
                    <span className="text-emerald-400 text-sm">{c.trend}</span>
                  </div>
                </div>
                <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase"
                  style={{ background: c.badgeColor + "20", color: c.badgeColor }}>
                  {c.badge}
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">{c.body}</p>
              <div className="flex flex-wrap gap-2">
                {c.bullets.map((b) => (
                  <span key={b} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400" style={{ background: "rgba(255,255,255,0.04)" }}>
                    {b}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* Demand / Supply */}
          <h2 className="text-2xl font-bold text-white mt-10 mb-6">Demand & Supply Signals</h2>
          <div className="space-y-4 mb-10">
            {[
              {
                title: "End-use demand is at a decade high",
                body: "68% of buyers in Q1 2026 are owner-occupiers — the highest share since 2015. This is structurally positive: end-use buyers are less likely to cancel bookings, more likely to complete purchase, and create genuine rental demand as they move in. Speculative flipping (the risk that collapsed many other city markets) is structurally lower in Hyderabad because stamp duty reform and RERA penalties make quick exits expensive.",
              },
              {
                title: "NRI demand softening but still significant",
                body: "NRI buyers accounted for 22% of premium segment sales in Q1, down from 28% in Q1 2025. The reason: the Fed rate cut cycle means USD-denominated savings earn less, reducing the rupee-equivalent deployed into Indian real estate. This is a 12–18 month headwind for the very top of the market (₹3Cr+) but has no meaningful impact on the ₹1–2.5Cr segment where domestic demand dominates.",
              },
              {
                title: "Construction costs stabilising",
                body: "After two years of 15–20% YoY inflation in construction costs (driven by steel and cement prices), Q1 2026 saw stabilisation. Steel prices are flat at ₹58,000–60,000/tonne; cement at ₹370–390/bag. This is positive for developer margins and should translate to fewer project delays. The risk: labour costs are still rising 8–10% annually as construction workers migrate toward better-paying metro projects.",
              },
              {
                title: "Inventory health is good",
                body: "Total unsold inventory in Hyderabad stands at approximately 48,000 units (Anarock Q1 estimate). At current absorption rates, this represents 14–16 months of supply — healthy territory. Compare this to Mumbai (38 months) or Bengaluru (22 months). The relative scarcity keeps price floors firm.",
              },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl border border-white/8 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
                <h3 className="text-white font-semibold mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          {/* Risks */}
          <h2 className="text-2xl font-bold text-white mb-6">Key Risks to Watch</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {[
              { risk: "State election uncertainty", detail: "Telangana elections expected in late 2026. Infrastructure approvals tend to slow 6–9 months pre-election." },
              { risk: "Tech sector hiring slowdown", detail: "A US recession or AI-driven workforce reduction at major employers would hit Hyderabad residential demand disproportionately." },
              { risk: "Oversupply in emerging corridors", detail: "Plotted layout approvals in Kollur/Mokila have been aggressive. If absorption lags, early investors could face price pressure." },
              { risk: "Delayed infrastructure delivery", detail: "Metro Phase 2 and several ORR extensions are behind schedule. Micro-markets that priced in this infrastructure carry downside risk." },
            ].map((r) => (
              <div key={r.risk} className="rounded-2xl border border-red-500/15 p-5" style={{ background: "rgba(239,68,68,0.04)" }}>
                <p className="text-red-300 font-semibold text-sm mb-2">⚠ {r.risk}</p>
                <p className="text-slate-400 text-xs leading-relaxed">{r.detail}</p>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="rounded-2xl border border-white/8 p-5 mb-10" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-2 text-slate-500">Disclaimer</p>
            <p className="text-slate-600 text-xs leading-relaxed">
              This report is for informational purposes only and does not constitute investment advice. Price data is sourced from RERA filings, developer declarations, and our advisors' on-ground observations. Appreciation figures are historical and do not guarantee future performance. Always conduct independent due diligence before any real estate transaction.
            </p>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-white/8 p-6 text-center" style={{ background: "rgba(200,169,110,0.05)", borderColor: "rgba(200,169,110,0.2)" }}>
            <p className="text-white font-semibold mb-2">Want this analysis for your specific requirement?</p>
            <p className="text-slate-400 text-sm mb-4">Our advisors can walk you through the corridor and project shortlist that fits your budget and timeline.</p>
            <Link
              href="/contact"
              className="inline-block rounded-full px-6 py-2.5 text-sm font-bold uppercase tracking-[0.1em]"
              style={{ background: "linear-gradient(135deg, #c8a96e, #a8843e)", color: "#0a0a0a" }}
            >
              Get a Personalised Report — Free
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
