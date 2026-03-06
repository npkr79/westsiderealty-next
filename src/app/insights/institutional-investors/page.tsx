import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Why Institutional Investors Are Choosing Hyderabad for Commercial Real Estate | Westside Realty",
  description:
    "Global REITs, sovereign wealth funds, and PE firms are deploying billions into Hyderabad commercial real estate. Here's why Hyderabad is winning the institutional capital race.",
};

const LAST_UPDATED = "March 2026";

export default function InstitutionalInvestorsPage() {
  return (
    <main style={{ background: "#080808", minHeight: "100vh" }}>
      <section className="px-4 pb-16" style={{ paddingTop: 88, background: "linear-gradient(to bottom, #0d0d0d, #080808)" }}>
        <div className="container mx-auto max-w-3xl">
          <Link href="/insights" className="text-xs text-slate-500 hover:text-slate-300 transition-colors mb-6 inline-block">
            ← Back to Insights
          </Link>

          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#c8a96e" }}>
            Market Intelligence · Commercial
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Why Institutional Investors<br />Are Choosing Hyderabad
          </h1>
          <p className="text-slate-400 text-lg mb-2 max-w-xl">
            Global REITs, sovereign wealth funds, and private equity firms are deploying billions into Hyderabad commercial real estate. The reasons are structural, not speculative.
          </p>
          <p className="text-slate-600 text-xs mb-12">Last updated: {LAST_UPDATED}</p>

          {/* Lead */}
          <div className="rounded-2xl border p-6 mb-8" style={{ background: "rgba(200,169,110,0.06)", borderColor: "rgba(200,169,110,0.25)" }}>
            <p className="text-slate-300 text-sm leading-relaxed">
              In 2025, Hyderabad absorbed over 12 million square feet of Grade A office space — making it the second-largest office market in India by absorption, ahead of Bengaluru's outer ring and within striking distance of Mumbai's BKC belt. Behind these numbers is a deliberate, accelerating flow of institutional capital: Blackstone, GIC Singapore, Brookfield, CapitaLand, and a growing roster of sovereign and pension funds are all active in the city. This is not a cyclical trend. It is a structural rerating of Hyderabad as a top-tier global commercial real estate destination.
            </p>
          </div>

          {/* Reason 1 */}
          <h2 className="text-2xl font-bold text-white mb-6">The Six Reasons Institutions Are Here</h2>
          <div className="space-y-5 mb-10">
            {[
              {
                number: "01",
                title: "Single-window policy and developer-friendly governance",
                color: "#c8a96e",
                body: "The Telangana state government has built one of India's most efficient approval frameworks for large commercial projects. TS-iPASS (Telangana State Industrial Project Approval and Self-Certification System) guarantees approvals within 15 days for projects above ₹100 crore. Compare this to the 6–24 month approval timelines in Maharashtra or Karnataka. For institutional investors deploying ₹500 crore+ into a single asset, predictable timelines directly reduce carrying cost and improve IRR. Blackstone cited governance quality as a top-three reason for its Hyderabad concentration in its 2024 investor presentation.",
                stat: "15 days",
                statLabel: "avg. commercial approval via TS-iPASS",
              },
              {
                number: "02",
                title: "The lowest Grade A vacancy rate among major Indian cities",
                color: "#4ade80",
                body: "Hyderabad's Financial District and HITEC City belt consistently post vacancy rates of 3–6% for Grade A office space — the lowest in India. Mumbai's BKC runs at 8–12%; Bengaluru's Outer Ring Road at 14–18% after the 2022–23 tech correction. Low vacancy means stable rental income (critical for REIT-grade assets), limited mark-to-market risk, and strong lease renewal rates. When an institution acquires a fully-leased 2-million-sqft campus in Financial District, they are buying a near-certain cash flow stream, not a speculative bet.",
                stat: "3–6%",
                statLabel: "Grade A vacancy, Financial District belt",
              },
              {
                number: "03",
                title: "Tenant quality that matches global institutional requirements",
                color: "#60a5fa",
                body: "Institutional investors require tenants with investment-grade credit ratings and multi-year lease commitments. Hyderabad's tenant roster reads like a Fortune 500 list: Google, Microsoft, Amazon, Apple, Meta, Goldman Sachs, Bank of America, Wells Fargo, UBS, JP Morgan, Deloitte, KPMG, and 200+ MNC GCCs. These are 5–10 year leases with locked escalation clauses (typically 5% annual rent escalation in India). For a REIT or pension fund, this is the exact risk profile they need: long duration, inflation-indexed, counterparty risk near zero.",
                stat: "200+",
                statLabel: "Fortune 500 / MNC GCC tenants in Hyderabad",
              },
              {
                number: "04",
                title: "Commercial yields that significantly outperform Mumbai and Delhi",
                color: "#a78bfa",
                body: "Grade A office yields in Hyderabad's premium corridors run at 7.5–9% gross — versus 5.5–7% in Mumbai BKC and 6–7.5% in Bengaluru CBD. This 150–200 basis point premium over India's most expensive markets makes Hyderabad the highest-yielding institutional-grade office market in the country. For a global investor comparing India to Singapore (3.5–4.5% office yields) or London (4–5%), Hyderabad's combination of yield, tenant quality, and appreciation potential is genuinely unusual. The currency play adds another 4–5% for USD-denominated funds on a static basis.",
                stat: "7.5–9%",
                statLabel: "Grade A office gross yield, Hyderabad premium belt",
              },
              {
                number: "05",
                title: "The SEZ and data centre pipeline creating new asset classes",
                color: "#34d399",
                body: "Hyderabad has become India's largest data centre market, with over 500 MW of commissioned or under-construction capacity — driven by hyperscaler demand from Microsoft Azure, Google Cloud, and AWS, all of which have significant Hyderabad infrastructure. Data centres are an institutional asset class: 10–15 year triple-net leases, utility-grade counterparties, and yields of 8–11%. The Kokapet SEZ (22 million sqft, now under construction) and Genome Valley's life sciences campus are creating two more institutional-grade sub-markets. Institutional capital is not just chasing existing stock — it is funding new supply.",
                stat: "500+ MW",
                statLabel: "data centre capacity in Hyderabad (commissioned + pipeline)",
              },
              {
                number: "06",
                title: "A talent pool that makes tenants sticky",
                color: "#f59e0b",
                body: "The deepest institutional fear in commercial real estate is tenant departure. In Hyderabad, this risk is structurally mitigated. The city produces over 90,000 engineering graduates annually from institutions like IIIT Hyderabad, BITS Pilani Hyderabad, NALSAR, and 300+ engineering colleges. The cost of equivalent talent is 35–45% below Bengaluru and 50–60% below equivalent roles in Singapore or the US. For a global MNC running a 5,000-person GCC, the talent economics of Hyderabad make relocation irrational. This stickiness is what gives institutional investors long-duration confidence in their commercial assets.",
                stat: "90,000+",
                statLabel: "engineering graduates produced annually",
              },
            ].map((r) => (
              <div key={r.number} className="rounded-2xl border border-white/8 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex items-start gap-4 mb-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: r.color + "18", color: r.color, border: `1px solid ${r.color}30` }}>
                    {r.number}
                  </span>
                  <h3 className="text-white font-semibold leading-snug">{r.title}</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{r.body}</p>
                <div className="inline-block rounded-xl px-4 py-2" style={{ background: r.color + "12", border: `1px solid ${r.color}25` }}>
                  <p className="text-lg font-bold" style={{ color: r.color }}>{r.stat}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{r.statLabel}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Who's active */}
          <h2 className="text-2xl font-bold text-white mb-6">Who Is Actively Deploying Capital</h2>
          <div className="rounded-2xl border border-white/8 p-6 mb-10" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { investor: "Blackstone", type: "US PE / REIT", focus: "Grade A office parks, IT SEZs", assets: "Embassy TechVillage, Manyata Tech Park equivalents" },
                { investor: "Brookfield Asset Management", type: "Canada PE", focus: "Large-format IT campuses", assets: "Kensington, Knowledge City" },
                { investor: "GIC Singapore", type: "Sovereign Wealth Fund", focus: "Office + mixed-use", assets: "DLF Cyber City partnership" },
                { investor: "CapitaLand", type: "Singapore REIT", focus: "IT parks, business parks", assets: "Ascendas India Trust assets" },
                { investor: "Invesco Real Estate", type: "US fund manager", focus: "Data centres + logistics", assets: "Hyderabad Data Centre corridor" },
                { investor: "CPPIB (Canada Pension)", type: "Pension fund", focus: "Core office", assets: "Joint ventures with Panchshil Realty" },
              ].map((inv) => (
                <div key={inv.investor} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-white font-semibold text-sm mb-1">{inv.investor}</p>
                  <p className="text-xs text-slate-500 mb-2">{inv.type}</p>
                  <p className="text-xs text-slate-400"><span className="text-slate-500">Focus: </span>{inv.focus}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What this means for residential */}
          <h2 className="text-2xl font-bold text-white mb-5">What This Means for Residential Buyers</h2>
          <div className="space-y-4 mb-10">
            {[
              {
                title: "Commercial capital de-risks residential investment",
                body: "When institutional investors commit ₹1,000–5,000 crore to a commercial campus in Financial District or Kokapet, they are making a 10-year bet on employment density in that corridor. Residential buyers piggyback on this due diligence for free. An office campus leased to Goldman Sachs for 10 years is the strongest possible signal that 5,000+ high-income workers will need to live within 30 minutes.",
              },
              {
                title: "Infrastructure follows institutional capital",
                body: "State governments accelerate road widening, metro extensions, and utility upgrades in corridors where institutional capital is concentrated. The ORR expansions serving Financial District, the proposed metro extension to Kokapet, and the HMWSSB water infrastructure in the Nanakramguda belt all follow the institutional investment map.",
              },
              {
                title: "Rental yields are floor-protected",
                body: "In corridors with institutional-grade commercial anchor tenants, residential rental yields are protected by genuine demand — not speculation. A 3BHK in Kokapet rented to a Goldman GCC employee at ₹55,000/month is not at risk of vacancy the way a peripheral market rental is. Commercial density creates residential rental demand that is demand-driven, not price-speculative.",
              },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl border border-white/8 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
                <h3 className="text-white font-semibold mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-white/8 p-6 text-center" style={{ background: "rgba(200,169,110,0.05)", borderColor: "rgba(200,169,110,0.2)" }}>
            <p className="text-white font-semibold mb-2">Buying near an institutional commercial corridor?</p>
            <p className="text-slate-400 text-sm mb-4">
              Our advisors can identify which residential projects sit within the employment catchment of major commercial anchors — and what that means for your rental yield and appreciation.
            </p>
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
