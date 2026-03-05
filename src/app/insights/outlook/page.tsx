import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hyderabad Real Estate 5-Year Outlook 2026–2031 | Westside Realty",
  description:
    "AI-powered 5-year appreciation forecasts for Hyderabad micro-markets. Which corridors will outperform through 2031?",
};

export default function OutlookPage() {
  return (
    <main style={{ background: "#080808", minHeight: "100vh" }}>
      <section className="px-4 pb-16" style={{ paddingTop: 88, background: "linear-gradient(to bottom, #0d0d0d, #080808)" }}>
        <div className="container mx-auto max-w-3xl">
          <Link href="/insights" className="text-xs text-slate-500 hover:text-slate-300 transition-colors mb-6 inline-block">
            ← Back to Insights
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#c8a96e" }}>
              Market Intelligence
            </p>
            <span className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase" style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd", borderColor: "rgba(139,92,246,0.3)" }}>
              AI
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            5-Year Outlook<br />
            <span style={{ color: "#c8a96e" }}>2026–2031</span>
          </h1>
          <p className="text-slate-400 text-lg mb-12 max-w-xl">
            Appreciation forecasts, infrastructure catalysts, and our top corridor picks for the next five years.
          </p>

          {/* Thesis */}
          <div className="rounded-2xl border p-6 mb-10" style={{ background: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.2)" }}>
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "#c4b5fd" }}>The 5-Year Thesis</p>
            <p className="text-slate-300 text-sm leading-relaxed mb-3">
              Hyderabad is in a structural bull market for residential real estate that is unlikely to reverse before 2030. Three forces will compound over the next five years:
            </p>
            <ol className="space-y-2 text-sm text-slate-400 leading-relaxed">
              <li><span className="text-white font-semibold">1. Employment expansion:</span> The tech corridor will add an estimated 120,000–140,000 jobs between 2026–2030 as global MNCs expand Hyderabad GCC (Global Capability Centre) operations. This is the demand engine.</li>
              <li><span className="text-white font-semibold">2. Infrastructure unlock:</span> Metro Phase 2 (approval expected 2026), ORR extensions, and the RGIA–HITEC City elevated corridor will open new residential corridors that are currently priced as peripheral.</li>
              <li><span className="text-white font-semibold">3. Supply discipline:</span> RERA and land acquisition constraints mean Hyderabad will not see the oversupply that has suppressed returns in NCR and Bengaluru outer rings. Absorption will keep pace with launches.</li>
            </ol>
          </div>

          {/* Forecast table */}
          <h2 className="text-2xl font-bold text-white mb-6">Appreciation Forecasts by Corridor</h2>
          <p className="text-slate-500 text-xs mb-6">Base case assumes no recession, metro approvals on schedule, stable employment growth. All figures are compound annual growth rates (CAGR).</p>

          <div className="rounded-2xl border border-white/8 overflow-hidden mb-10">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 border-b border-white/8"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              <span>Corridor</span>
              <span>Today</span>
              <span>5yr CAGR</span>
              <span>2031 Est.</span>
            </div>
            {[
              { corridor: "Financial District", today: "₹12–14K", cagr: "9–11%", est2031: "₹18–22K", color: "#c8a96e", conviction: "High" },
              { corridor: "Kokapet", today: "₹10–12.5K", cagr: "13–16%", est2031: "₹19–26K", color: "#4ade80", conviction: "Highest" },
              { corridor: "Gachibowli", today: "₹11–13K", cagr: "8–10%", est2031: "₹16–21K", color: "#c8a96e", conviction: "High" },
              { corridor: "Narsingi", today: "₹8.5–10K", cagr: "12–15%", est2031: "₹15–20K", color: "#4ade80", conviction: "High" },
              { corridor: "Kondapur", today: "₹9–11K", cagr: "8–10%", est2031: "₹13–18K", color: "#60a5fa", conviction: "Moderate" },
              { corridor: "Nanakramguda", today: "₹9.5–11K", cagr: "9–11%", est2031: "₹15–18K", color: "#c8a96e", conviction: "High" },
              { corridor: "Tellapur", today: "₹7–9K", cagr: "11–14%", est2031: "₹13–17K", color: "#a78bfa", conviction: "Moderate" },
              { corridor: "Kollur / Mokila", today: "₹5–7K", cagr: "14–18%", est2031: "₹10–17K", color: "#34d399", conviction: "Speculative" },
            ].map((r) => (
              <div key={r.corridor} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 items-center px-5 py-4 border-b border-white/5 last:border-0">
                <div>
                  <span className="text-white font-medium text-sm">{r.corridor}</span>
                  <span className="ml-2 rounded-full px-2 py-0.5 text-[9px] font-semibold"
                    style={{ background: r.color + "18", color: r.color }}>
                    {r.conviction}
                  </span>
                </div>
                <span className="text-slate-400 text-sm">{r.today}</span>
                <span className="font-bold text-sm" style={{ color: "#4ade80" }}>+{r.cagr}</span>
                <span className="text-white text-sm font-semibold">{r.est2031}</span>
              </div>
            ))}
          </div>

          {/* Infrastructure catalysts */}
          <h2 className="text-2xl font-bold text-white mb-6">Infrastructure Catalysts</h2>
          <div className="space-y-4 mb-10">
            {[
              {
                name: "Metro Phase 2 — Kokapet Extension",
                status: "Approval Expected 2026",
                statusColor: "#f59e0b",
                impact: "If approved and built by 2029–30, this single project transforms Kokapet and Narsingi from 'drive only' to 'metro accessible'. Historical data from Phase 1 shows properties within 800m of metro stations appreciated 18–24% in the 24 months post-announcement. A Kokapet metro stop would be the single biggest price catalyst of this decade.",
                corridors: ["Kokapet", "Narsingi", "Puppalaguda"],
              },
              {
                name: "Kokapet SEZ — 22 Million Sqft Tech Park",
                status: "Approved, Construction Started",
                statusColor: "#4ade80",
                impact: "Anchored by Tata Consultancy, Infosys, and a cluster of US MNC GCCs, this is the largest single employment catalyst in Hyderabad since HITEC City. At full buildout (est. 2029–30), the SEZ will employ 80,000–100,000 people, all of whom need to live within 30 minutes. Kokapet and Narsingi will capture most of this demand.",
                corridors: ["Kokapet", "Narsingi", "Tellapur"],
              },
              {
                name: "ORR Expansion — Kollur & Budwel Nodes",
                status: "Phase 1 Complete, Phase 2 In Progress",
                statusColor: "#60a5fa",
                impact: "The Outer Ring Road remains the single most important piece of real estate infrastructure in Hyderabad. Each new interchange node creates a 5 km radius of high-demand residential land. The Kollur and Budwel nodes are the last major unlocks on the western arc. Land prices within 2 km of these nodes have already moved; project launches are following.",
                corridors: ["Kollur", "Mokila", "Budwel"],
              },
              {
                name: "RGIA–HITEC City Elevated Corridor",
                status: "Pre-Feasibility Stage",
                statusColor: "#f87171",
                impact: "A proposed elevated expressway connecting the international airport to the HITEC City tech belt via the ORR. If built (earliest 2030–31), this would dramatically improve connectivity for southern corridors (Tukkuguda, Rajendra Nagar, Shadnagar) and begin a new wave of development in the airport proximity belt. High speculative interest is already visible in land prices along the proposed alignment.",
                corridors: ["Tukkuguda", "Rajendra Nagar", "Osman Nagar"],
              },
            ].map((c) => (
              <div key={c.name} className="rounded-2xl border border-white/8 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <h3 className="text-white font-semibold">{c.name}</h3>
                  <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase"
                    style={{ background: c.statusColor + "20", color: c.statusColor }}>
                    {c.status}
                  </span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-3">{c.impact}</p>
                <div className="flex flex-wrap gap-2">
                  {c.corridors.map((cor) => (
                    <span key={cor} className="rounded-full border border-white/10 px-3 py-0.5 text-xs text-slate-400">
                      {cor}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Investment scenarios */}
          <h2 className="text-2xl font-bold text-white mb-6">Investment Scenarios</h2>
          <div className="space-y-4 mb-10">
            {[
              {
                label: "Conservative — ₹80L–1.2Cr budget",
                color: "#60a5fa",
                title: "2BHK in Tellapur or Gopanpally",
                body: "Buy a RERA-registered 2BHK in a project by an established developer (My Home, Aparna, Sark). At ₹7,000–8,500/sqft and 1,000–1,200 sqft, you land in the ₹75L–1Cr range. Rental yield of 3.5–4.2% covers most of EMI if rented out. 5-year appreciation forecast: 55–70% (₹1.25–1.7Cr exit). Risk: low. Infrastructure: already in place.",
              },
              {
                label: "Growth — ₹1.5–2.5Cr budget",
                color: "#4ade80",
                title: "3BHK in Kokapet or Narsingi",
                body: "This is the highest conviction trade in Hyderabad right now. A 1,600–1,800 sqft 3BHK in Kokapet from a Tier 1 developer (Prestige, Godrej, My Home) at ₹10,500–11,500/sqft puts you at ₹1.7–2.1Cr. The SEZ employment catalyst and metro phase 2 upside mean 5-year appreciation of 80–110% in the base case. Rental yield currently 3.8–4.5%. Risk: moderate. Infrastructure timeline risk exists.",
              },
              {
                label: "Speculative — ₹50–80L budget",
                color: "#a78bfa",
                title: "Plotted development in Kollur/Mokila",
                body: "High risk, high reward. A 200 sqyd plot in Kollur (DTCP/HMDA approved) at ₹25,000–32,000/sqyd gives you raw land with 5–7 year appreciation optionality. No rental income. Zero development costs for now. 5-year upside: 100–180% IF infrastructure delivers as planned. Risk: high. This is a thesis-based bet on Hyderabad's continued expansion, not an income-generating asset.",
              },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/8 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p className="text-xs font-bold uppercase tracking-[0.12em] mb-1" style={{ color: s.color }}>{s.label}</p>
                <h3 className="text-white font-semibold mb-3">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          {/* AI methodology note */}
          <div className="rounded-2xl border border-white/8 p-5 mb-10" style={{ background: "rgba(139,92,246,0.04)", borderColor: "rgba(139,92,246,0.15)" }}>
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "#c4b5fd" }}>About These Forecasts</p>
            <p className="text-slate-500 text-xs leading-relaxed">
              Forecasts are generated using a model trained on 15 years of Hyderabad transaction data, infrastructure investment records, employment growth figures, and developer absorption rates. The model outputs probability-weighted CAGR ranges. These are not guarantees. Real estate markets can and do diverge from models — economic shocks, policy changes, and natural events are not predictable. Use these ranges as directional guidance, not precise targets.
            </p>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-white/8 p-6 text-center" style={{ background: "rgba(200,169,110,0.05)", borderColor: "rgba(200,169,110,0.2)" }}>
            <p className="text-white font-semibold mb-2">Build your personal 5-year plan</p>
            <p className="text-slate-400 text-sm mb-4">Our advisors can match the right corridor and project to your investment timeline, tax situation, and risk appetite. Free consultation.</p>
            <Link
              href="/contact"
              className="inline-block rounded-full px-6 py-2.5 text-sm font-bold uppercase tracking-[0.1em]"
              style={{ background: "linear-gradient(135deg, #c8a96e, #a8843e)", color: "#0a0a0a" }}
            >
              Plan My Investment — Free
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
