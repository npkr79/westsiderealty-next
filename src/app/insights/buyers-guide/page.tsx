import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hyderabad Home Buyer's Guide 2026 — Step-by-Step | Westside Realty",
  description:
    "Complete guide for buying a home in Hyderabad. RERA checks, shortlisting, legal due diligence, payment structure, and registration — explained clearly.",
};

export default function BuyersGuidePage() {
  return (
    <main style={{ background: "#080808", minHeight: "100vh" }}>
      <section className="px-4 pb-16" style={{ paddingTop: 88, background: "linear-gradient(to bottom, #0d0d0d, #080808)" }}>
        <div className="container mx-auto max-w-3xl">
          <Link href="/insights" className="text-xs text-slate-500 hover:text-slate-300 transition-colors mb-6 inline-block">
            ← Back to Insights
          </Link>

          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#c8a96e" }}>
            Market Intelligence · Buyer Resources
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Hyderabad Home<br />Buyer's Guide
          </h1>
          <p className="text-slate-400 text-lg mb-12 max-w-xl">
            Everything you need to know before signing anything. From shortlist to registration — plain language, no jargon.
          </p>

          {/* Overview */}
          <div className="rounded-2xl border border-white/8 p-6 mb-10" style={{ background: "rgba(255,255,255,0.03)" }}>
            <p className="text-slate-300 text-sm leading-relaxed">
              Buying a home in Hyderabad takes 3–9 months from shortlist to registration. The process involves seven distinct stages, each with paperwork, verification, and financial commitments. Skipping any stage — especially RERA verification and legal due diligence — can cost you crores. This guide walks through each stage in the order you'll encounter it, with the red flags to watch for at each step.
            </p>
          </div>

          {/* Steps */}
          {[
            {
              step: "01",
              title: "Define your requirement clearly",
              time: "Week 1",
              body: "Before looking at any project, get precise on three things: (1) configuration — 2BHK vs 3BHK vs 4BHK, and the minimum area you need (most families underestimate this); (2) possession timeline — are you happy waiting 3 years for under-construction, or do you need ready-to-move?; and (3) true budget — not just what you've planned to spend, but the all-in number including registration, GST, parking, club membership, and interior work. Most buyers underestimate total cost by 12–18%.",
              checklist: [
                "Minimum carpet area needed (not builder area)",
                "Maximum waiting period for possession",
                "All-in budget including registration + interiors",
                "Preferred corridor(s) based on work location",
                "Rental income need if it's an investment",
              ],
            },
            {
              step: "02",
              title: "RERA verification — do this before anything else",
              time: "Week 1–2",
              body: "Every project launched after May 2017 must be registered with TSRERA (Telangana State RERA). Check the TSRERA website (rera.telangana.gov.in) before visiting a single site. A RERA registration does not mean the project is safe — it means it has been registered. What you're looking for: is the registration active or lapsed? Are the completion dates realistic? Has the developer had any complaints/orders filed against them? Do the declared layouts match what the salesperson is showing you?",
              checklist: [
                "Search project on rera.telangana.gov.in",
                "Verify registration status: Active (not Lapsed)",
                "Check proposed completion date vs developer's claim",
                "View all registered documents (layout, approvals)",
                "Check developer's complaint history on TSRERA",
                "Verify the RERA number matches site hoardings",
              ],
              warning: "If a salesperson says 'RERA registration is in process' or shows you a temporary approval number — do not pay any token amount. RERA mandates full registration before any money is collected.",
            },
            {
              step: "03",
              title: "Shortlist 3–5 projects, visit each twice",
              time: "Weeks 2–6",
              body: "Visit on a weekday and a weekend — the site experience differs significantly. On the first visit, focus on the apartment layout, views, ventilation, and the actual construction quality visible. On the second visit, check the surrounding area in detail: traffic at peak hours, distance to schools/hospitals, the social infrastructure under development. Pay attention to what the salesperson doesn't mention: what floor will your flat be on? What is the exact window view? Where is the podium parking entry?",
              checklist: [
                "Check actual carpet area vs builder area (expect 15–22% loading)",
                "Visit at peak hours to assess traffic",
                "Check natural light in the actual unit/similar unit",
                "Ask about the exact tower and floor before paying",
                "Check school and hospital distances yourself",
                "Get the complete payment schedule in writing",
              ],
            },
            {
              step: "04",
              title: "Legal due diligence — hire an advocate",
              time: "Weeks 4–8",
              body: "This is the most skipped step and the most important one. Hire an independent advocate (not the developer's recommended advocate — they have a conflict of interest) to examine the land title. What you need to check: is the land freehold or leasehold? Is the land acquisition clear, or is there litigation? Are all government approvals in order (HMDA/GHMC layout approval, building plan sanction, environment clearance for large projects)? Is the developer the actual owner, or are there co-owners/investors with undisclosed claims?",
              checklist: [
                "Title search for the last 30 years",
                "HMDA/GHMC layout approval certificate",
                "Building plan sanction (matches construction on site)",
                "Environment clearance (for projects >20,000 sqm)",
                "Encumbrance certificate (no loans/mortgages on land)",
                "Power of Attorney check if land is held via PoA",
              ],
              warning: "A legal check costs ₹15,000–30,000 and takes 1–2 weeks. This is non-negotiable. A title defect discovered after registration can make your property unsaleable for years.",
            },
            {
              step: "05",
              title: "Negotiate and lock in with ATS",
              time: "Week 6–9",
              body: "Once legal due diligence passes, negotiate. Developers have 5–12% flexibility on price depending on the project's absorption rate, their cash flow needs, and the time of year (December and March-end are when developers offer the best prices). Negotiate on: price per sqft, free parking (₹5–8L value), club membership waiver (₹2–4L value), and construction-linked payment milestones. Get everything agreed in writing before signing the Agreement to Sell (ATS). Read the ATS carefully: check penalty clauses for delay, what counts as force majeure, and what your exit rights are.",
              checklist: [
                "Get final price confirmed in writing before signing",
                "Parking included/excluded from price",
                "Club membership fee (negotiable or waivable)",
                "Compensation clause for possession delay",
                "Exact possession date (not 'approximately')",
                "Cancellation policy and refund timeline",
              ],
            },
            {
              step: "06",
              title: "Home loan sanction",
              time: "Weeks 6–10 (parallel with legal check)",
              body: "Apply to 2–3 banks simultaneously to get comparative offers. Banks in India now offer very competitive rates — negotiate based on your credit score and salary. Key things: compare actual interest rates (not teaser rates), processing fees, prepayment penalty (most now charge zero), and part-payment conditions. The bank will also do its own legal check on the property — if the bank refuses to finance a particular project, treat that as a serious red flag even if you planned to pay cash.",
              checklist: [
                "Apply to 2–3 banks simultaneously",
                "Get sanction letter before paying more than 10%",
                "Compare effective rate, not just headline rate",
                "Check pre-payment and part-payment conditions",
                "Verify project is approved by your chosen bank",
                "Understand what the bank's disbursement conditions are",
              ],
              tip: "Banks like HDFC, SBI, and ICICI have pre-approved project lists. Being on this list means the bank has already done basic legal due diligence — it's a soft quality signal but doesn't replace your independent check.",
            },
            {
              step: "07",
              title: "Registration and possession",
              time: "At possession",
              body: "Under-construction properties are registered via a Sale Agreement registered at the Sub-Registrar's office. For ready-to-move properties, the Sale Deed is registered directly. Registration charges in Telangana: Stamp Duty 4% + Registration Fee 0.5% of the property's guideline value (or actual price, whichever is higher). GST on under-construction properties: 5% of property value (for affordable housing: 1%). Before taking possession, do a thorough snagging inspection — document every defect in writing. Developers are obligated to fix structural defects for 5 years under RERA.",
              checklist: [
                "GST paid receipt from developer",
                "Occupancy Certificate (OC) from GHMC",
                "Completion Certificate (CC) from builder",
                "NOC from bank if project had construction finance",
                "Snagging inspection report signed by developer",
                "Society formation confirmation",
              ],
              warning: "Do not take possession without an Occupancy Certificate. An OC means the building has been inspected and certified as compliant. Without it, you may face issues getting water/electricity connections, and the property cannot be legally occupied.",
            },
          ].map((s) => (
            <div key={s.step} className="mb-8">
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "rgba(200,169,110,0.15)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)" }}>
                  {s.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-white">{s.title}</h2>
                    <span className="text-xs text-slate-500 flex-shrink-0">{s.time}</span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">{s.body}</p>

                  <div className="rounded-xl border border-white/8 p-4 mb-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 mb-3">Checklist</p>
                    <ul className="space-y-1.5">
                      {s.checklist.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-white/20 flex items-center justify-center text-[9px]" style={{ color: "#c8a96e" }}>✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {s.warning && (
                    <div className="rounded-xl border border-red-500/20 p-4" style={{ background: "rgba(239,68,68,0.05)" }}>
                      <p className="text-red-300 text-xs font-semibold mb-1">⚠ Watch Out</p>
                      <p className="text-red-200/70 text-xs leading-relaxed">{s.warning}</p>
                    </div>
                  )}
                  {s.tip && (
                    <div className="rounded-xl border border-blue-500/20 p-4" style={{ background: "rgba(96,165,250,0.05)" }}>
                      <p className="text-blue-300 text-xs font-semibold mb-1">💡 Tip</p>
                      <p className="text-blue-200/70 text-xs leading-relaxed">{s.tip}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="ml-[60px] mt-4 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>
          ))}

          {/* Common mistakes */}
          <h2 className="text-2xl font-bold text-white mt-10 mb-6">10 Mistakes First-Time Buyers Make</h2>
          <div className="space-y-3 mb-10">
            {[
              "Paying a token amount before RERA verification",
              "Trusting the builder area figure — always convert to carpet area",
              "Using the developer's recommended advocate for title check",
              "Ignoring the possession delay penalty clause in the ATS",
              "Taking possession without an Occupancy Certificate",
              "Not negotiating — developers always have flexibility, especially at year-end",
              "Choosing a micro-market based on price alone without checking commute times at peak hours",
              "Underestimating all-in cost (GST + stamp duty + registration + interiors = 15–25% on top of base price)",
              "Buying in a project without a bank loan sanction letter (means the bank found something concerning)",
              "Not doing a snagging inspection — defects found after possession are much harder to get fixed",
            ].map((m, i) => (
              <div key={m} className="flex items-start gap-3 rounded-xl border border-white/8 px-4 py-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                <span className="flex-shrink-0 text-red-400 font-bold text-sm mt-0.5">{i + 1}.</span>
                <p className="text-slate-300 text-sm">{m}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-white/8 p-6 text-center" style={{ background: "rgba(200,169,110,0.05)", borderColor: "rgba(200,169,110,0.2)" }}>
            <p className="text-white font-semibold mb-2">Want someone to walk you through this for your specific project?</p>
            <p className="text-slate-400 text-sm mb-4">
              Our advisors have guided 500+ buyers through this process. We'll check RERA, review the ATS, and shortlist the right projects for your budget. No obligation.
            </p>
            <Link
              href="/contact"
              className="inline-block rounded-full px-6 py-2.5 text-sm font-bold uppercase tracking-[0.1em]"
              style={{ background: "linear-gradient(135deg, #c8a96e, #a8843e)", color: "#0a0a0a" }}
            >
              Get Expert Guidance — Free
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
