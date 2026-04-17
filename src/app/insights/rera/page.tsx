import type { Metadata } from "next";
import Link from "next/link";
import { InsightsAdvisorCTA } from "../InsightsAdvisorCTA";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "RERA Updates — Hyderabad Real Estate Regulatory News 2026 | Westside Realty",
  description:
    "Latest TSRERA regulatory changes, compliance requirements, and what Hyderabad property buyers need to know in 2026.",
  alternates: {
    canonical: "https://www.westsiderealty.in/insights/rera",
  },
};

const LAST_UPDATED = "March 2026";

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

const UPDATES = [
  { date: "Jan 2026", title: "TSRERA mandates QR code on all project hoardings", category: "Compliance", categoryColor: "#60a5fa", body: "From January 2026, every developer must display a QR code on project site hoardings, brochures, and advertisements that links directly to the project's TSRERA registration page. This allows buyers to instantly verify project details, approval status, and completion timelines by scanning the code.", impact: "Buyer protection: easier instant verification" },
  { date: "Dec 2025", title: "Penalty framework tightened for possession delays", category: "Enforcement", categoryColor: "#f59e0b", body: "TSRERA issued revised guidelines making possession delay penalties mandatory rather than discretionary. Developers who delay possession beyond the RERA-declared date are now required to pay simple interest at SBI's MCLR + 2% per annum on the amount paid by the buyer — for every month of delay.", impact: "Stronger protection against indefinite delays" },
  { date: "Nov 2025", title: "Structural defect warranty extended to 10 years for high-rises", category: "Buyer Rights", categoryColor: "#4ade80", body: "RERA nationally mandates a 5-year structural defect warranty post-possession. TSRERA has extended this to 10 years for projects above 15 floors (G+14 and above). Developers must now maintain a separate warranty fund deposited with TSRERA to cover structural repairs within the warranty period.", impact: "Better post-possession protection for high-rise buyers" },
  { date: "Oct 2025", title: "Online registration of sale agreements now mandatory", category: "Process", categoryColor: "#a78bfa", body: "From October 2025, all Agreements to Sell (ATS) for RERA-registered projects in Telangana must be registered online through the TSRERA e-filing portal within 30 days of execution. Paper-only agreements are no longer valid for RERA disputes.", impact: "Tamper-proof sale records, faster dispute resolution" },
  { date: "Sep 2025", title: "Real estate agents must renew TSRERA license annually", category: "Agent Compliance", categoryColor: "#f87171", body: "Real estate agents in Telangana must now renew their TSRERA registration annually and must complete 10 hours of continuing education on RERA law. Agents found operating without a valid TSRERA registration face a fine of ₹10,000 per day.", impact: "Higher agent accountability, fewer fraud cases" },
];

const RIGHTS = [
  { right: "Right to Information", detail: "Developers must disclose all project details — layout, approvals, carpet area, completion date — in the RERA registration. You can access this on the TSRERA website anytime." },
  { right: "Right to Accurate Area", detail: "Developers must sell and price on carpet area basis only — not super built-up or builder area. If a developer quotes super built-up area, ask for the carpet area equivalent." },
  { right: "Compensation for Delay", detail: "If possession is delayed beyond the RERA date, you are entitled to MCLR+2% interest per annum on all money paid. You can also withdraw from the project and get a full refund with interest." },
  { right: "Structural Defect Warranty", detail: "5 years (10 years for high-rises) from possession date. Any structural defect — walls, columns, beams, foundation — must be repaired by the developer at their cost." },
  { right: "Grievance Redressal", detail: "File a complaint at rera.telangana.gov.in. TSRERA must resolve it within 60 days. Developer non-compliance results in penalties. Appeals go to TSREAT (appellate tribunal)." },
  { right: "Association of Allottees", detail: "Once 51% of units are sold in a project, buyers can form an Association of Allottees to collectively represent their interests — including monitoring construction progress." },
];

export default function ReraUpdatesPage() {
  return (
    <>
      <style>{`
        .rera-rights-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .rera-contacts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        @media (max-width: 768px) {
          .rera-rights-grid, .rera-contacts-grid { grid-template-columns: 1fr !important; }
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
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: C.gold }}>Research Report · Regulatory</span>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(36px,5vw,56px)", fontWeight: 600, color: "#fff", lineHeight: 1.15, margin: "0 0 20px" }}>
            RERA Updates 2026
          </h1>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, maxWidth: 580, margin: "0 0 8px" }}>
            The regulatory changes and compliance requirements that matter for Hyderabad buyers and investors in 2026.
          </p>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      {/* Executive Summary */}
      <section style={{ background: C.bg, padding: "48px 24px 0" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ background: C.bgCard, borderLeft: `4px solid ${C.gold}`, padding: "24px 28px", borderRadius: "0 12px 12px 0" }}>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: C.gold, margin: "0 0 12px" }}>Executive Summary</p>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, color: C.text, lineHeight: 1.7, margin: 0 }}>
              TSRERA (Telangana State Real Estate Regulatory Authority) was established under the Real Estate (Regulation and Development) Act, 2016. Every residential project with more than 8 units or 500 sqm of built-up area must be registered with TSRERA before the developer can advertise, sell, or collect any money. Since its launch, over 8,000 projects have been registered in Telangana, and TSRERA has resolved 5,000+ buyer complaints.
            </p>
          </div>
        </div>
      </section>

      {/* Body */}
      <section style={{ background: C.bg, padding: "40px 24px 80px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>

          {/* Recent updates */}
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 600, color: C.text, margin: "0 0 24px" }}>Recent Regulatory Updates</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 48 }}>
            {UPDATES.map((u) => (
              <div key={u.title} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted }}>{u.date}</span>
                    <span style={{ background: u.categoryColor + "20", color: u.categoryColor, fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", borderRadius: 20, padding: "2px 10px" }}>{u.category}</span>
                  </div>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 500, color: "#4ade80" }}>{u.impact}</span>
                </div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 600, color: C.text, margin: "0 0 10px" }}>{u.title}</h3>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.textMuted, lineHeight: 1.75, margin: 0 }}>{u.body}</p>
              </div>
            ))}
          </div>

          {/* Your rights */}
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 600, color: C.text, margin: "0 0 20px" }}>Your Rights Under RERA</h2>
          <div className="rera-rights-grid" style={{ marginBottom: 48 }}>
            {RIGHTS.map((r) => (
              <div key={r.right} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, color: C.text, margin: "0 0 8px" }}>{r.right}</p>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted, lineHeight: 1.65, margin: 0 }}>{r.detail}</p>
              </div>
            ))}
          </div>

          {/* How to verify */}
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 600, color: C.text, margin: "0 0 20px" }}>How to Verify Any Project on TSRERA</h2>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, marginBottom: 40 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { step: "1", text: "Go to rera.telangana.gov.in", sub: "The official TSRERA portal" },
                { step: "2", text: "Click 'Project Search' → enter developer name or project name", sub: "You can also search by RERA registration number" },
                { step: "3", text: "Check Registration Status: Active, Lapsed, or Revoked", sub: "Only buy in 'Active' registered projects" },
                { step: "4", text: "Verify declared completion date vs developer's claim", sub: "Discrepancies are a red flag — ask for explanation" },
                { step: "5", text: "Download and review all registered documents", sub: "Layout plan, approvals, encumbrance certificate" },
                { step: "6", text: "Check the developer's complaint history tab", sub: "Orders against the developer are publicly visible" },
              ].map((s) => (
                <div key={s.step} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <span style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", background: "rgba(176,141,87,0.12)", border: `1px solid rgba(176,141,87,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700, color: C.gold }}>{s.step}</span>
                  <div>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 500, color: C.text, margin: "0 0 2px" }}>{s.text}</p>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, margin: 0 }}>{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key contacts */}
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 600, color: C.text, margin: "0 0 20px" }}>Key Contacts</h2>
          <div className="rera-contacts-grid" style={{ marginBottom: 16 }}>
            {[
              { name: "TSRERA Helpline", value: "040-23390111", sub: "Monday–Friday, 10am–5pm" },
              { name: "TSRERA Portal", value: "rera.telangana.gov.in", sub: "Project search, complaint filing" },
              { name: "TSREAT (Appeals)", value: "040-23390222", sub: "Appellate Tribunal Telangana" },
              { name: "RERA Complaint Email", value: "tsrera@telangana.gov.in", sub: "For written complaints" },
            ].map((c) => (
              <div key={c.name} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, margin: "0 0 4px" }}>{c.name}</p>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, color: C.text, margin: "0 0 4px" }}>{c.value}</p>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, margin: 0 }}>{c.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <InsightsAdvisorCTA />
    </>
  );
}