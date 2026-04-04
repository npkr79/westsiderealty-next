import type { Metadata } from "next";
import Link from "next/link";
import { InsightsAdvisorCTA } from "../InsightsAdvisorCTA";

export const metadata: Metadata = {
  title: "Hyderabad Home Buyer's Guide 2026 — Step-by-Step | Westside Realty",
  description:
    "Complete guide for buying a home in Hyderabad. RERA checks, shortlisting, legal due diligence, payment structure, and registration — explained clearly.",
};

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

const STEPS = [
  {
    step: "01", title: "Define your requirement clearly", time: "Week 1",
    body: "Before looking at any project, get precise on three things: (1) configuration — 2BHK vs 3BHK vs 4BHK, and the minimum area you need; (2) possession timeline — under-construction or ready-to-move?; and (3) true budget — including registration, GST, parking, club membership, and interior work. Most buyers underestimate total cost by 12–18%.",
    checklist: ["Minimum carpet area needed (not builder area)", "Maximum waiting period for possession", "All-in budget including registration + interiors", "Preferred corridor(s) based on work location", "Rental income need if it's an investment"],
  },
  {
    step: "02", title: "RERA verification — do this before anything else", time: "Week 1–2",
    body: "Every project launched after May 2017 must be registered with TSRERA. Check rera.telangana.gov.in before visiting a single site. Look for: active (not lapsed) registration, realistic completion dates, and the developer's complaint history.",
    checklist: ["Search project on rera.telangana.gov.in", "Verify registration status: Active (not Lapsed)", "Check proposed completion date vs developer's claim", "View all registered documents (layout, approvals)", "Check developer's complaint history on TSRERA", "Verify the RERA number matches site hoardings"],
    warning: "If a salesperson says 'RERA registration is in process' — do not pay any token amount. RERA mandates full registration before any money is collected.",
  },
  {
    step: "03", title: "Shortlist 3–5 projects, visit each twice", time: "Weeks 2–6",
    body: "Visit on a weekday and a weekend. On the first visit, focus on layout, views, ventilation, and construction quality. On the second, check the surrounding area in detail: traffic at peak hours, school/hospital distances. Pay attention to what the salesperson doesn't mention.",
    checklist: ["Check actual carpet area vs builder area (expect 15–22% loading)", "Visit at peak hours to assess traffic", "Check natural light in the actual unit/similar unit", "Ask about the exact tower and floor before paying", "Check school and hospital distances yourself", "Get the complete payment schedule in writing"],
  },
  {
    step: "04", title: "Legal due diligence — hire an advocate", time: "Weeks 4–8",
    body: "Hire an independent advocate (not the developer's recommended advocate — they have a conflict of interest) to examine the land title. Check: freehold or leasehold, land acquisition clarity, all government approvals, and whether the developer is the actual owner.",
    checklist: ["Title search for the last 30 years", "HMDA/GHMC layout approval certificate", "Building plan sanction (matches construction on site)", "Environment clearance (for projects >20,000 sqm)", "Encumbrance certificate (no loans/mortgages on land)", "Power of Attorney check if land is held via PoA"],
    warning: "A legal check costs ₹15,000–30,000 and takes 1–2 weeks. A title defect discovered after registration can make your property unsaleable for years.",
  },
  {
    step: "05", title: "Negotiate and lock in with ATS", time: "Week 6–9",
    body: "Developers have 5–12% flexibility on price. Negotiate on: price per sqft, free parking (₹5–8L value), club membership waiver (₹2–4L value), and construction-linked payment milestones. Get everything agreed in writing before signing the Agreement to Sell (ATS).",
    checklist: ["Get final price confirmed in writing before signing", "Parking included/excluded from price", "Club membership fee (negotiable or waivable)", "Compensation clause for possession delay", "Exact possession date (not 'approximately')", "Cancellation policy and refund timeline"],
  },
  {
    step: "06", title: "Home loan sanction", time: "Weeks 6–10",
    body: "Apply to 2–3 banks simultaneously. Compare actual interest rates, processing fees, and prepayment penalty. If the bank refuses to finance a particular project, treat that as a serious red flag even if you planned to pay cash.",
    checklist: ["Apply to 2–3 banks simultaneously", "Get sanction letter before paying more than 10%", "Compare effective rate, not just headline rate", "Check pre-payment and part-payment conditions", "Verify project is approved by your chosen bank", "Understand what the bank's disbursement conditions are"],
    tip: "Banks like HDFC, SBI, and ICICI have pre-approved project lists. Being on this list means the bank has already done basic legal due diligence — it's a soft quality signal.",
  },
  {
    step: "07", title: "Registration and possession", time: "At possession",
    body: "Registration charges in Telangana: Stamp Duty 4% + Registration Fee 0.5% of guideline value. GST on under-construction: 5%. Before taking possession, do a thorough snagging inspection — document every defect in writing. Developers must fix structural defects for 5 years under RERA.",
    checklist: ["GST paid receipt from developer", "Occupancy Certificate (OC) from GHMC", "Completion Certificate (CC) from builder", "NOC from bank if project had construction finance", "Snagging inspection report signed by developer", "Society formation confirmation"],
    warning: "Do not take possession without an Occupancy Certificate. Without it, you may face issues getting water/electricity connections, and the property cannot be legally occupied.",
  },
];

export default function BuyersGuidePage() {
  return (
    <>
      <style>{`
        .bg-body p { font-family: 'Outfit', sans-serif; font-size: 15px; color: #1A1A1F; line-height: 1.8; margin: 0 0 14px; }
        .bg-body h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 600; color: #1A1A1F; margin: 40px 0 16px; }
      `}</style>

      {/* Hero */}
      <section style={{ background: C.bgDark, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 65% 60% at 65% 40%, rgba(176,141,87,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "100px 24px 64px", position: "relative" }}>
          <Link href="/insights" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none", display: "inline-block", marginBottom: 24 }}>
            ← Back to Research
          </Link>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: C.gold }}>Research Report · Buyer Resources</span>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(36px,5vw,56px)", fontWeight: 600, color: "#fff", lineHeight: 1.15, margin: "0 0 20px" }}>
            Hyderabad Home Buyer&apos;s Guide
          </h1>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, maxWidth: 580, margin: 0 }}>
            Everything you need to know before signing anything. From shortlist to registration — plain language, no jargon.
          </p>
        </div>
      </section>

      {/* Executive Summary */}
      <section style={{ background: C.bg, padding: "48px 24px 0" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ background: C.bgCard, borderLeft: `4px solid ${C.gold}`, padding: "24px 28px", borderRadius: "0 12px 12px 0" }}>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: C.gold, margin: "0 0 12px" }}>Executive Summary</p>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, color: C.text, lineHeight: 1.7, margin: 0 }}>
              Buying a home in Hyderabad takes 3–9 months from shortlist to registration across seven distinct stages. Skipping any stage — especially RERA verification and legal due diligence — can cost you crores. This guide walks through each stage in the order you&apos;ll encounter it, with the red flags to watch for at each step.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section style={{ background: C.bg, padding: "40px 24px 80px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }} className="bg-body">
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {STEPS.map((s, idx) => (
              <div key={s.step} style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                  {/* Step indicator */}
                  <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: "50%", background: "rgba(176,141,87,0.12)", border: `1px solid rgba(176,141,87,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700, color: C.gold }}>
                    {s.step}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 600, color: C.text, margin: 0 }}>{s.title}</h2>
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, flexShrink: 0 }}>{s.time}</span>
                    </div>
                    <p style={{ marginBottom: 16 }}>{s.body}</p>

                    {/* Checklist */}
                    <div style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: s.warning || s.tip ? 12 : 0 }}>
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: C.textMuted, margin: "0 0 12px" }}>Checklist</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {s.checklist.map((item) => (
                          <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <span style={{ flexShrink: 0, width: 18, height: 18, border: `1px solid ${C.border}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                              <span style={{ color: C.gold, fontSize: 10 }}>✓</span>
                            </span>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text, lineHeight: 1.5 }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {s.warning && (
                      <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "14px 18px" }}>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, color: "#f87171", margin: "0 0 6px" }}>⚠ Watch Out</p>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "#fca5a5", lineHeight: 1.6, margin: 0 }}>{s.warning}</p>
                      </div>
                    )}
                    {s.tip && (
                      <div style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 12, padding: "14px 18px" }}>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, color: "#60a5fa", margin: "0 0 6px" }}>💡 Tip</p>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "#93c5fd", lineHeight: 1.6, margin: 0 }}>{s.tip}</p>
                      </div>
                    )}
                  </div>
                </div>
                {idx < STEPS.length - 1 && <div style={{ height: 1, background: C.border, margin: "28px 0 0 64px" }} />}
              </div>
            ))}
          </div>

          {/* Common mistakes */}
          <h2>10 Mistakes First-Time Buyers Make</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
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
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px" }}>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: "#f87171", flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.text, margin: 0, lineHeight: 1.6 }}>{m}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <InsightsAdvisorCTA />
    </>
  );
}
