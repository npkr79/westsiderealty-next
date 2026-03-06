import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The GCC Rush: How Hyderabad Became India's Global Capability Centre Capital | Westside Realty",
  description:
    "In 2024–25, Hyderabad added more GCC seats than any other Indian city. What's driving the rush, which companies are here, and what it means for real estate.",
};

const LAST_UPDATED = "March 2026";

export default function GccHyderabadPage() {
  return (
    <main style={{ background: "#080808", minHeight: "100vh" }}>
      <section className="px-4 pb-16" style={{ paddingTop: 88, background: "linear-gradient(to bottom, #0d0d0d, #080808)" }}>
        <div className="container mx-auto max-w-3xl">
          <Link href="/insights" className="text-xs text-slate-500 hover:text-slate-300 transition-colors mb-6 inline-block">
            ← Back to Insights
          </Link>

          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#c8a96e" }}>
            Market Intelligence · Employment
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            The GCC Rush:<br />
            <span style={{ color: "#c8a96e" }}>Hyderabad's Rise</span> as<br />
            India's GCC Capital
          </h1>
          <p className="text-slate-400 text-lg mb-2 max-w-xl">
            In 2024–25, more Global Capability Centres opened in Hyderabad than in any other Indian city. This is what's driving the rush — and what it means for property prices.
          </p>
          <p className="text-slate-600 text-xs mb-12">Last updated: {LAST_UPDATED}</p>

          {/* The numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { stat: "225+", label: "GCCs operational", sub: "as of early 2026" },
              { stat: "6.5L+", label: "GCC employees", sub: "in Hyderabad" },
              { stat: "38%", label: "new GCC seats", sub: "of India total in 2024–25" },
              { stat: "₹2.1L Cr", label: "GCC-linked capex", sub: "committed 2024–2026" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/8 p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p className="text-2xl font-bold mb-0.5" style={{ color: "#c8a96e" }}>{s.stat}</p>
                <p className="text-white text-xs font-medium">{s.label}</p>
                <p className="text-slate-600 text-xs mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* What is a GCC */}
          <div className="rounded-2xl border border-white/8 p-6 mb-8" style={{ background: "rgba(255,255,255,0.03)" }}>
            <h2 className="text-white font-bold text-lg mb-3">What is a GCC — and why does it matter for real estate?</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-3">
              A Global Capability Centre (GCC) — also called a captive centre or offshore office — is a wholly-owned subsidiary of a multinational corporation set up in India to handle high-value work: technology development, analytics, finance, legal, HR, and increasingly, AI and product management. GCCs are not call centres. They are the engineering and strategic brains of global companies, operating in India because talent here is world-class and 60–70% cheaper than equivalent roles in the US or Europe.
            </p>
            <p className="text-slate-400 text-sm leading-relaxed">
              For real estate, GCCs are the most important demand driver in the market. A GCC employing 3,000 people at average salaries of ₹20–25 lakh/year creates immediate, sustained demand for 800–1,200 housing units within a 30-minute commute. Unlike IT services companies (which shrink headcount in downturns), GCCs have demonstrated resilience: their work is core to the parent company's operations, making them structurally sticky in cities where they set up.
            </p>
          </div>

          {/* Why Hyderabad won */}
          <h2 className="text-2xl font-bold text-white mb-6">Why Hyderabad Won the GCC Race</h2>
          <div className="space-y-5 mb-10">
            {[
              {
                title: "The 2014 bifurcation bet that paid off",
                body: "When Telangana was carved out of Andhra Pradesh in 2014, the new state needed to establish its own economic identity fast. Chief Minister K. Chandrashekar Rao made a clear choice: tech and investment attraction above all else. The IT Investment Region (ITIR) policy, HYDRAA's streamlined clearances, and direct chief-minister-level engagement with Fortune 500 CEOs became a playbook that no other Indian state has replicated at the same intensity. By 2018, Hyderabad had leapfrogged Pune and Chennai as the second-preferred GCC destination after Bengaluru. By 2024, it had overtaken Bengaluru in new GCC setups per year.",
                badge: "Policy",
                badgeColor: "#c8a96e",
              },
              {
                title: "Microsoft's $3 billion bet changed everything",
                body: "In 2023, Microsoft committed $3 billion to expand its Hyderabad operations — the single largest foreign direct investment commitment in the city's history. This was not a routine expansion. It included a dedicated AI research campus, a cloud infrastructure centre, and a skilling program for 2 million Indians. The announcement triggered a cascade: within 90 days, Google, Amazon, Meta, and Goldman Sachs all announced Hyderabad expansions. The signal was clear — if Microsoft was doubling down, the city's fundamentals were validated at the highest level.",
                badge: "Catalyst",
                badgeColor: "#4ade80",
              },
              {
                title: "BFSI GCCs: the new wave that changed the mix",
                body: "Until 2022, Hyderabad's GCC story was primarily a tech story. The new wave is financial services. In 2024–25, BFSI (Banking, Financial Services, Insurance) GCCs were the fastest-growing segment, with Goldman Sachs Hyderabad exceeding 8,000 employees, Bank of America crossing 5,000, Wells Fargo at 4,000+, and UBS, Barclays, and Deutsche Bank all expanding aggressively. Financial services GCCs tend to occupy premium office space (Grade A, Financial District belt), employ higher-salaried workers (₹25–50 lakh/year range), and create demand for luxury and ultra-premium residential — the segment where prices have appreciated fastest.",
                badge: "BFSI Wave",
                badgeColor: "#60a5fa",
              },
              {
                title: "The AI pivot: why GCCs are getting bigger, not smaller",
                body: "The fear that AI would reduce GCC headcount has proven wrong in Hyderabad. The opposite has happened. AI product development, model training, data annotation, and AI infrastructure management all require large, skilled teams in low-cost locations. Hyderabad's combination of IIIT Hyderabad (India's top AI research institution), 90,000+ annual engineering graduates, and existing MNC relationships has made it the destination of choice for AI GCC expansion. Microsoft's Hyderabad AI centre, Google's DeepMind India collaboration, and Amazon's Alexa AI hub are all Hyderabad-based. This is not back-office work — it is frontier AI development.",
                badge: "AI Expansion",
                badgeColor: "#a78bfa",
              },
            ].map((r) => (
              <div key={r.title} className="rounded-2xl border border-white/8 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <h3 className="text-white font-semibold leading-snug max-w-[85%]">{r.title}</h3>
                  <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase flex-shrink-0"
                    style={{ background: r.badgeColor + "20", color: r.badgeColor }}>
                    {r.badge}
                  </span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>

          {/* The GCC map */}
          <h2 className="text-2xl font-bold text-white mb-6">Major GCCs Operating in Hyderabad</h2>
          <div className="rounded-2xl border border-white/8 overflow-hidden mb-10">
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 border-b border-white/8"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              <span>Company</span>
              <span>Sector</span>
              <span>Est. Headcount</span>
            </div>
            {[
              { co: "Microsoft", sector: "Technology", hc: "15,000+", color: "#4ade80" },
              { co: "Google", sector: "Technology", hc: "8,000+", color: "#4ade80" },
              { co: "Amazon / AWS", sector: "Technology", hc: "12,000+", color: "#4ade80" },
              { co: "Goldman Sachs", sector: "BFSI", hc: "8,500+", color: "#60a5fa" },
              { co: "Bank of America", sector: "BFSI", hc: "5,500+", color: "#60a5fa" },
              { co: "Wells Fargo", sector: "BFSI", hc: "4,500+", color: "#60a5fa" },
              { co: "Apple", sector: "Technology", hc: "3,000+", color: "#4ade80" },
              { co: "Meta", sector: "Technology", hc: "2,500+", color: "#4ade80" },
              { co: "Deloitte", sector: "Consulting", hc: "14,000+", color: "#a78bfa" },
              { co: "KPMG", sector: "Consulting", hc: "6,000+", color: "#a78bfa" },
              { co: "UBS", sector: "BFSI", hc: "3,500+", color: "#60a5fa" },
              { co: "Qualcomm", sector: "Semiconductor", hc: "3,000+", color: "#f59e0b" },
            ].map((r) => (
              <div key={r.co} className="grid grid-cols-[2fr_1fr_1fr] gap-2 items-center px-5 py-3.5 border-b border-white/5 last:border-0">
                <span className="text-white font-medium text-sm">{r.co}</span>
                <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase w-fit"
                  style={{ background: r.color + "18", color: r.color }}>{r.sector}</span>
                <span className="text-slate-300 text-sm font-semibold">{r.hc}</span>
              </div>
            ))}
          </div>

          {/* Impact on residential */}
          <h2 className="text-2xl font-bold text-white mb-6">The GCC Effect on Residential Real Estate</h2>
          <div className="space-y-4 mb-10">
            {[
              {
                label: "Premium salary, premium housing",
                color: "#c8a96e",
                body: "GCC employees in Hyderabad earn significantly above IT services averages. A senior engineer at a Goldman Sachs or Microsoft GCC earns ₹25–60 lakh/year. At this income level, the affordable-to-premium transition happens fast. A couple both working at MNC GCCs has a combined household income of ₹50–120 lakh/year — the exact demographic that buys 3BHK and 4BHK homes in Kokapet, Financial District, and Gachibowli at ₹1.5–3.5 crore. The GCC salary premium is directly visible in premium residential absorption data.",
              },
              {
                label: "2024–25 saw the fastest premium residential absorption in Hyderabad's history",
                color: "#4ade80",
                body: "Q3 2024 to Q1 2025 saw ₹2Cr+ residential units absorbed at a record pace — 38% faster than the same period in 2022–23. The primary driver is identifiable: BFSI GCC expansion. Goldman Sachs, Bank of America, and Wells Fargo all expanded their Hyderabad headcount by 20–30% in this period. Their employees needed housing within 20 minutes of Financial District and Gachibowli, which meant Kokapet, Narsingi, and Nanakramguda absorbed most of the demand.",
              },
              {
                label: "GCC demand is rental income-protected",
                color: "#60a5fa",
                body: "An investor buying a 3BHK in Kokapet or Nanakramguda today is not speculating on future GCC employment — they are buying into an existing, 650,000-person employment base that needs housing now. Rental vacancy in corridors adjacent to GCC clusters runs at 2–4%, with typical yields of 3.8–4.8%. Compare this to 6–9% vacancy in outer-ring residential where employment density is thinner. GCC-proximate residential is the safest rental income bet in Hyderabad.",
              },
              {
                label: "The 2026–2028 pipeline will widen the premium corridor",
                color: "#a78bfa",
                body: "The Kokapet SEZ (22 million sqft, anchored by Tata Consultancy and Infosys, with 12+ global MNCs already pre-leased) will add an estimated 80,000–100,000 GCC seats between 2026–2029. This is a new employment cluster south of the existing Financial District belt — which means Kokapet, Narsingi, and Puppalaguda will become GCC-proximate in the same way Gachibowli became premium-proximate when HITEC City matured in the 2010s. Buyers entering these sub-markets today are buying the 2018 version of Gachibowli.",
              },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/8 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <h3 className="text-white font-semibold text-sm leading-snug">{s.label}</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          {/* Bottom line */}
          <div className="rounded-2xl border p-6 mb-10" style={{ background: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.2)" }}>
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "#c4b5fd" }}>The Bottom Line</p>
            <p className="text-slate-300 text-sm leading-relaxed">
              Hyderabad's GCC dominance is not a 2024 story — it is a decade-long structural advantage that is now compounding. The city has built a self-reinforcing loop: global companies come for talent → talent gets paid well → talent buys premium housing → premium housing drives price appreciation → developers build more premium supply → more global companies find the infrastructure they need. This loop is in mid-cycle, not late-cycle. The GCC rush of 2024–25 is the inflection, not the peak.
            </p>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-white/8 p-6 text-center" style={{ background: "rgba(200,169,110,0.05)", borderColor: "rgba(200,169,110,0.2)" }}>
            <p className="text-white font-semibold mb-2">Invest where the GCCs are hiring</p>
            <p className="text-slate-400 text-sm mb-4">
              Our advisors track GCC expansion announcements and can map them to specific residential micro-markets and projects. Know exactly where the next employment cluster is forming — before prices move.
            </p>
            <Link
              href="/contact"
              className="inline-block rounded-full px-6 py-2.5 text-sm font-bold uppercase tracking-[0.1em]"
              style={{ background: "linear-gradient(135deg, #c8a96e, #a8843e)", color: "#0a0a0a" }}
            >
              Get the GCC Investment Map — Free
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
