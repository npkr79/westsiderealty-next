import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "RERA Updates — Hyderabad Real Estate Regulatory News 2026 | Westside Realty",
  description:
    "Latest TSRERA regulatory changes, compliance requirements, and what Hyderabad property buyers need to know in 2026.",
};

const LAST_UPDATED = "March 2026";

export default function ReraUpdatesPage() {
  return (
    <main style={{ background: "#080808", minHeight: "100vh" }}>
      <section className="px-4 pb-16" style={{ paddingTop: 88, background: "linear-gradient(to bottom, #0d0d0d, #080808)" }}>
        <div className="container mx-auto max-w-3xl">
          <Link href="/insights" className="text-xs text-slate-500 hover:text-slate-300 transition-colors mb-6 inline-block">
            ← Back to Insights
          </Link>

          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#c8a96e" }}>
            Market Intelligence · Regulatory
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">RERA Updates</h1>
          <p className="text-slate-400 text-lg mb-2 max-w-xl">
            The regulatory changes and compliance requirements that matter for Hyderabad buyers and investors in 2026.
          </p>
          <p className="text-slate-600 text-xs mb-12">Last updated: {LAST_UPDATED}</p>

          {/* What is TSRERA */}
          <div className="rounded-2xl border border-white/8 p-6 mb-8" style={{ background: "rgba(255,255,255,0.03)" }}>
            <h2 className="text-white font-bold text-lg mb-3">What is TSRERA?</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-3">
              TSRERA (Telangana State Real Estate Regulatory Authority) was established under the Real Estate (Regulation and Development) Act, 2016. Every residential and commercial project in Telangana with more than 8 units or 500 sqm of built-up area must be registered with TSRERA before the developer can advertise, sell, or collect any money.
            </p>
            <p className="text-slate-400 text-sm leading-relaxed">
              TSRERA gives buyers the right to accurate information about their project, mandatory compensation for delays, and a grievance redressal mechanism. Since its launch, over 8,000 projects have been registered in Telangana, and TSRERA has resolved 5,000+ buyer complaints.
            </p>
          </div>

          {/* Recent updates */}
          <h2 className="text-2xl font-bold text-white mb-6">Recent Regulatory Updates</h2>
          <div className="space-y-5 mb-10">
            {[
              {
                date: "Jan 2026",
                title: "TSRERA mandates QR code on all project hoardings",
                category: "Compliance",
                categoryColor: "#60a5fa",
                body: "From January 2026, every developer must display a QR code on project site hoardings, brochures, and advertisements that links directly to the project's TSRERA registration page. This allows buyers to instantly verify project details, approval status, and completion timelines by scanning the code. If a project doesn't have this QR code displayed, it may be unregistered or in violation — report it to TSRERA at 040-23390111.",
                impact: "Buyer protection: easier instant verification",
              },
              {
                date: "Dec 2025",
                title: "Penalty framework tightened for possession delays",
                category: "Enforcement",
                categoryColor: "#f59e0b",
                body: "TSRERA issued revised guidelines making possession delay penalties mandatory rather than discretionary. Developers who delay possession beyond the RERA-declared date are now required to pay simple interest at SBI's marginal cost of funds lending rate (MCLR) + 2% per annum on the amount paid by the buyer — for every month of delay. Previously, some developers were avoiding this through repeated RERA date extensions. TSRERA has capped extension requests to two, after which the original deadline is enforced.",
                impact: "Stronger protection against indefinite delays",
              },
              {
                date: "Nov 2025",
                title: "Structural defect warranty extended to 10 years for high-rises",
                category: "Buyer Rights",
                categoryColor: "#4ade80",
                body: "RERA nationally mandates a 5-year structural defect warranty post-possession. TSRERA has extended this to 10 years for projects above 15 floors (G+14 and above). Developers must now maintain a separate warranty fund — a percentage of project revenue deposited with TSRERA — to cover structural repairs claimed within the warranty period. This applies to all high-rise projects registered after November 2025.",
                impact: "Better post-possession protection for high-rise buyers",
              },
              {
                date: "Oct 2025",
                title: "Online registration of sale agreements now mandatory",
                category: "Process",
                categoryColor: "#a78bfa",
                body: "From October 2025, all Agreements to Sell (ATS) for RERA-registered projects in Telangana must be registered online through the TSRERA e-filing portal within 30 days of execution. Paper-only agreements are no longer valid for RERA disputes. This creates a tamper-proof digital record of all sale terms, protecting both buyers and developers. Buyers should ensure their ATS has been uploaded and a digital receipt received.",
                impact: "Tamper-proof sale records, faster dispute resolution",
              },
              {
                date: "Sep 2025",
                title: "Real estate agents must renew TSRERA license annually",
                category: "Agent Compliance",
                categoryColor: "#f87171",
                body: "Real estate agents in Telangana must now renew their TSRERA registration annually (previously every 5 years) and must complete 10 hours of continuing education on RERA law. Agents found operating without a valid TSRERA registration face a fine of ₹10,000 per day. As a buyer, always ask your agent for their current TSRERA registration number and verify it at rera.telangana.gov.in. Westside Realty advisors maintain current TSRERA registration at all times.",
                impact: "Higher agent accountability, fewer fraud cases",
              },
            ].map((u) => (
              <div key={u.title} className="rounded-2xl border border-white/8 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 flex-shrink-0">{u.date}</span>
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                      style={{ background: u.categoryColor + "20", color: u.categoryColor }}>
                      {u.category}
                    </span>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">{u.impact}</span>
                </div>
                <h3 className="text-white font-semibold mb-3">{u.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{u.body}</p>
              </div>
            ))}
          </div>

          {/* Your rights as a buyer */}
          <h2 className="text-2xl font-bold text-white mb-6">Your Rights Under RERA</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {[
              {
                right: "Right to Information",
                detail: "Developers must disclose all project details — layout, approvals, carpet area, completion date — in the RERA registration. You can access this on the TSRERA website anytime.",
              },
              {
                right: "Right to Accurate Area",
                detail: "Developers must sell and price on carpet area basis only — not super built-up or builder area. If a developer quotes super built-up area, ask for the carpet area equivalent.",
              },
              {
                right: "Compensation for Delay",
                detail: "If possession is delayed beyond the RERA date, you are entitled to MCLR+2% interest per annum on all money paid. You can also withdraw from the project and get a full refund with interest.",
              },
              {
                right: "Structural Defect Warranty",
                detail: "5 years (10 years for high-rises) from possession date. Any structural defect — walls, columns, beams, foundation — must be repaired by the developer at their cost.",
              },
              {
                right: "Grievance Redressal",
                detail: "File a complaint at rera.telangana.gov.in. TSRERA must resolve it within 60 days. Developer non-compliance results in penalties. Appeals go to TSREAT (appellate tribunal).",
              },
              {
                right: "Association of Allottees",
                detail: "Once 51% of units are sold in a project, buyers can form an Association of Allottees to collectively represent their interests — including monitoring construction progress.",
              },
            ].map((r) => (
              <div key={r.right} className="rounded-2xl border border-white/8 p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
                <h3 className="text-white font-semibold text-sm mb-2">{r.right}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{r.detail}</p>
              </div>
            ))}
          </div>

          {/* How to verify */}
          <h2 className="text-2xl font-bold text-white mb-5">How to Verify Any Project on TSRERA</h2>
          <div className="rounded-2xl border border-white/8 p-6 mb-10" style={{ background: "rgba(255,255,255,0.03)" }}>
            <ol className="space-y-4">
              {[
                { step: "1", text: "Go to rera.telangana.gov.in", sub: "The official TSRERA portal" },
                { step: "2", text: "Click 'Project Search' → enter developer name or project name", sub: "You can also search by RERA registration number" },
                { step: "3", text: "Check Registration Status: Active, Lapsed, or Revoked", sub: "Only buy in 'Active' registered projects" },
                { step: "4", text: "Verify declared completion date vs developer's claim", sub: "Discrepancies are a red flag — ask for explanation" },
                { step: "5", text: "Download and review all registered documents", sub: "Layout plan, approvals, encumbrance certificate" },
                { step: "6", text: "Check the developer's complaint history tab", sub: "Orders against the developer are publicly visible" },
              ].map((s) => (
                <li key={s.step} className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "rgba(200,169,110,0.15)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)" }}>
                    {s.step}
                  </span>
                  <div>
                    <p className="text-white text-sm font-medium">{s.text}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{s.sub}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Key RERA numbers */}
          <h2 className="text-2xl font-bold text-white mb-5">Key Contacts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {[
              { name: "TSRERA Helpline", value: "040-23390111", sub: "Monday–Friday, 10am–5pm" },
              { name: "TSRERA Portal", value: "rera.telangana.gov.in", sub: "Project search, complaint filing" },
              { name: "TSREAT (Appeals)", value: "040-23390222", sub: "Appellate Tribunal Telangana" },
              { name: "RERA Complaint Email", value: "tsrera@telangana.gov.in", sub: "For written complaints" },
            ].map((c) => (
              <div key={c.name} className="rounded-2xl border border-white/8 p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p className="text-xs text-slate-500 mb-1">{c.name}</p>
                <p className="text-white font-semibold">{c.value}</p>
                <p className="text-slate-500 text-xs mt-1">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-white/8 p-6 text-center" style={{ background: "rgba(200,169,110,0.05)", borderColor: "rgba(200,169,110,0.2)" }}>
            <p className="text-white font-semibold mb-2">Not sure if a project is RERA-compliant?</p>
            <p className="text-slate-400 text-sm mb-4">
              Our advisors will verify any project's RERA status, check the complaint history, and flag anything unusual — before you pay a single rupee.
            </p>
            <Link
              href="/contact"
              className="inline-block rounded-full px-6 py-2.5 text-sm font-bold uppercase tracking-[0.1em]"
              style={{ background: "linear-gradient(135deg, #c8a96e, #a8843e)", color: "#0a0a0a" }}
            >
              Get a Free RERA Check
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
