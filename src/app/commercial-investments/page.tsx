import type { Metadata } from "next";
import CommercialEnquiryForm from "./CommercialEnquiryForm";
import { JsonLd } from "@/components/common/SEO";

export const metadata: Metadata = {
  title: "Commercial Real Estate Investment | Grade A Offices | West Hyderabad | Westside Realty",
  description:
    "Curated Grade A commercial office investments in Banjara Hills, HITEC City, Financial District and Kokapet. Four investment stages from early entry to rental-ready.",
};

const gold = "#C9A96E";
const dark = "#080808";
const darkCard = "#111110";
const darkAlt = "#0D0D0B";
const cream = "#F5F0E8";
const muted = "#888880";
const border = "rgba(201,169,110,0.15)";
const serif = "Georgia, serif";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the minimum investment for commercial property in Hyderabad?",
      acceptedAnswer: { "@type": "Answer", text: "Commercial properties in Hyderabad's west corridor start from ₹50 lakhs for early-stage investments. Grade-A office spaces in HITEC City typically range from ₹1.5Cr upward." },
    },
    {
      "@type": "Question",
      name: "What rental yields can I expect from commercial property in Hyderabad?",
      acceptedAnswer: { "@type": "Answer", text: "Commercial properties in Hyderabad's HITEC City and Gachibowli corridor deliver 5-9 year lease lock-ins with rents at ₹90-95 per sqft. GCC demand drives 43% of absorption." },
    },
    {
      "@type": "Question",
      name: "Which areas in Hyderabad are best for commercial investment?",
      acceptedAnswer: { "@type": "Answer", text: "Gachibowli, HITEC City, Kokapet and the Financial District form Hyderabad's prime commercial corridor. These areas absorbed 12.3 MSF in 2024 driven by GCC expansion." },
    },
  ],
};

export default function CommercialInvestmentsPage() {
  return (
    <main style={{ background: dark, minHeight: "100vh" }}>
      <JsonLd jsonLd={faqSchema} />

      {/* ── SECTION 1: HERO ─────────────────────────────────────── */}
      <section style={{
        minHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "88px 80px 80px",
        background: `linear-gradient(to bottom, rgba(8,8,8,0.85) 0%, rgba(8,8,8,0.5) 40%, rgba(8,8,8,0.9) 80%, ${dark} 100%), url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=2000&q=80') center/cover no-repeat`,
      }}>
        {/* Pill tag */}
        <div style={{ marginBottom: 40 }}>
          <span style={{ border: `1px solid ${border}`, color: gold, fontSize: 11, fontWeight: 500, letterSpacing: "0.22em", textTransform: "uppercase", padding: "7px 18px", display: "inline-block" }}>
            Grade A · West Hyderabad · By Invitation
          </span>
        </div>

        <h1 style={{ fontFamily: serif, fontSize: "clamp(48px, 5.5vw, 80px)", fontWeight: 300, lineHeight: 1.05, color: cream, maxWidth: 760, marginBottom: 28 }}>
          Commercial Real Estate<br />That Works While<br /><em style={{ color: gold, fontStyle: "italic" }}>You Sleep.</em>
        </h1>

        <p style={{ fontSize: 16, fontWeight: 300, color: muted, maxWidth: 520, lineHeight: 1.8, marginBottom: 52 }}>
          We don&apos;t advertise inventory. We match serious capital with curated Grade A office opportunities across Banjara Hills, HITEC City, Financial District, and Kokapet — before they reach the market.
        </p>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 56, marginBottom: 52, flexWrap: "wrap" }}>
          {[
            { val: "12.3 MSF", label: "Office space absorbed in Hyderabad 2024" },
            { val: "43%", label: "Of demand driven by GCCs — long leases, zero vacancy risk" },
            { val: "5–9 Yrs", label: "Typical lease lock-in with Fortune 500 tenants" },
          ].map((s) => (
            <div key={s.val}>
              <div style={{ fontFamily: serif, fontSize: 36, fontWeight: 300, color: gold, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: muted, marginTop: 6, maxWidth: 180 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <a
          href="#invest"
          style={{ display: "inline-block", background: gold, color: dark, padding: "16px 36px", fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}
        >
          Explore Investment Opportunities →
        </a>
      </section>

      {/* ── SECTION 2: THE CORRIDOR ─────────────────────────────── */}
      <section style={{ background: darkAlt, padding: "100px 80px", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(to right, transparent, ${gold}, transparent)` }} />
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: gold, marginBottom: 20, textAlign: "center" }}>
            West Hyderabad Corridor
          </p>
          <h2 style={{ fontFamily: serif, fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 300, textAlign: "center", lineHeight: 1.2, color: cream, maxWidth: 680, margin: "0 auto 24px" }}>
            Five kilometres that define<br /><em style={{ color: gold, fontStyle: "italic" }}>India&apos;s most dynamic office market.</em>
          </h2>
          <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.8, color: "rgba(245,240,232,0.65)", textAlign: "center", maxWidth: 660, margin: "0 auto 64px" }}>
            From Banjara Hills to Kokapet, the western corridor of Hyderabad hosts 80% of the city&apos;s Grade A office stock. HITEC City Grade A rents have climbed to ₹90–95/sqft/month. The ORR corridor and Kokapet are projected to be the next frontier. This is where we operate exclusively.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: border }}>
            {[
              { area: "Banjara Hills", desc: "Legacy addresses. Established tenants. Stable yields.", rent: "₹70–80/sqft/mo" },
              { area: "HITEC City & Madhapur", desc: "Highest absorption. Sub-6% vacancy. Rents at ₹90–95/sqft/mo.", rent: "₹90–95/sqft/mo" },
              { area: "Financial District & Gachibowli", desc: "GCC epicentre. Largest deal sizes in India. Blue-chip tenants.", rent: "₹60–75/sqft/mo" },
              { area: "Kokapet & ORR Corridor", desc: "Next frontier. Pre-leased pipeline. 15–25% appreciation expected.", rent: "₹55–70/sqft/mo" },
            ].map((c) => (
              <div key={c.area} style={{ background: darkCard, padding: "32px 24px" }}>
                <h3 style={{ fontFamily: serif, fontSize: 18, fontWeight: 400, color: cream, marginBottom: 12, lineHeight: 1.3 }}>{c.area}</h3>
                <p style={{ fontSize: 13, fontWeight: 300, color: muted, lineHeight: 1.7, marginBottom: 20 }}>{c.desc}</p>
                <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 300, color: gold }}>{c.rent}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: INVESTMENT STAGES ────────────────────────── */}
      <section style={{ background: dark, padding: "100px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: gold, marginBottom: 20, textAlign: "center" }}>
            Investment Strategy
          </p>
          <h2 style={{ fontFamily: serif, fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 300, textAlign: "center", lineHeight: 1.2, color: cream, maxWidth: 640, margin: "0 auto 20px" }}>
            Four stages of entry.<br /><em style={{ color: gold, fontStyle: "italic" }}>One decision that matters.</em>
          </h2>
          <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.8, color: "rgba(245,240,232,0.65)", textAlign: "center", maxWidth: 620, margin: "0 auto 64px" }}>
            We structure commercial investments across four risk-return profiles. Every stage has a different entry price, yield expectation, and exit horizon.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, background: border }}>
            {[
              {
                num: "Stage 01", title: "Early Entry", tagColor: "#E8845A", tag: "HIGH RISK · HIGH REWARD",
                timeline: "Horizon: 3–5 Years",
                desc: "Invest at project launch or pre-construction. Lowest entry price, maximum capital appreciation potential. Ideal for investors with patience and appetite for risk. Returns driven purely by appreciation — no rental income until completion.",
                m1: "Entry Discount: 25–35% below market", m2: "Appreciation Potential: 40–60%",
              },
              {
                num: "Stage 02", title: "Mid-Construction", tagColor: "#E8B85A", tag: "MEDIUM RISK · STRONG UPSIDE",
                timeline: "Horizon: 2–3 Years",
                desc: "Project at 40–60% completion. Construction risk largely mitigated. Strong capital appreciation as the asset approaches completion and pre-leasing begins. The sweet spot for growth investors.",
                m1: "Entry Discount: 15–20% below market", m2: "Appreciation Potential: 25–35%",
              },
              {
                num: "Stage 03", title: "Near Completion", tagColor: "#6DBF8A", tag: "LOW RISK · BALANCED",
                timeline: "Horizon: 12–18 Months",
                desc: "Asset 80–95% complete. Tenant conversations underway or MoUs signed. Minimal construction risk. Rental income begins within 12–18 months. Best balance of capital appreciation and early yield visibility.",
                m1: "Entry Discount: 8–12% below market", m2: "Expected Yield: 6–8% from year 2",
              },
              {
                num: "Stage 04", title: "Rental Ready", tagColor: gold, tag: "ZERO RISK · IMMEDIATE INCOME",
                timeline: "Immediate Returns",
                desc: "Fully completed, tenanted Grade A asset. Lease agreements in place. Rental income from day one. Lower appreciation upside but predictable, inflation-protected income stream. Ideal for capital preservation.",
                m1: "Immediate rental income from day one", m2: "Lease Security: 5–9 year lock-ins typical",
              },
            ].map((s) => (
              <div key={s.num} style={{ background: darkCard, padding: "48px 36px", border: `1px solid ${border}` }}>
                <div style={{ fontFamily: serif, fontSize: 48, fontWeight: 300, color: "rgba(201,169,110,0.12)", lineHeight: 1, marginBottom: 14 }}>{s.num}</div>
                <h3 style={{ fontFamily: serif, fontSize: 28, fontWeight: 400, color: cream, marginBottom: 12 }}>{s.title}</h3>
                <div style={{ display: "inline-block", fontSize: 10, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: s.tagColor, border: `1px solid ${s.tagColor}40`, padding: "4px 12px", marginBottom: 14 }}>{s.tag}</div>
                <p style={{ fontSize: 12, color: muted, letterSpacing: "0.08em", marginBottom: 16 }}>{s.timeline}</p>
                <p style={{ fontSize: 14, fontWeight: 300, color: "rgba(245,240,232,0.68)", lineHeight: 1.8, marginBottom: 24 }}>{s.desc}</p>
                <div style={{ borderTop: `1px solid ${border}`, paddingTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  {[s.m1, s.m2].map((m) => (
                    <div key={m} style={{ display: "flex", gap: 10, fontSize: 13, fontWeight: 300, color: "rgba(245,240,232,0.7)" }}>
                      <span style={{ color: gold, fontSize: 10, flexShrink: 0, marginTop: 3 }}>—</span>
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: WHY COMMERCIAL NOW ───────────────────────── */}
      <section style={{ background: darkAlt, padding: "100px 80px", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(to right, transparent, ${gold}, transparent)` }} />
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: gold, marginBottom: 20, textAlign: "center" }}>
            The Case for Commercial
          </p>
          <h2 style={{ fontFamily: serif, fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 300, textAlign: "center", lineHeight: 1.2, color: cream, maxWidth: 700, margin: "0 auto 64px" }}>
            While everyone bought apartments,<br /><em style={{ color: gold, fontStyle: "italic" }}>smart money moved to offices.</em>
          </h2>

          {/* Comparison stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 32, alignItems: "center", maxWidth: 900, margin: "0 auto 80px" }}>
            <div style={{ border: `1px solid ${border}`, background: darkCard, padding: "40px 32px", textAlign: "center" }}>
              <div style={{ fontFamily: serif, fontSize: 56, fontWeight: 300, color: muted, lineHeight: 1 }}>3–4%</div>
              <div style={{ fontSize: 13, color: muted, marginTop: 12 }}>Residential rental yield in Hyderabad</div>
            </div>
            <div style={{ fontFamily: serif, fontSize: 24, color: "rgba(201,169,110,0.4)", textAlign: "center" }}>vs</div>
            <div style={{ border: `1px solid rgba(201,169,110,0.4)`, background: darkCard, padding: "40px 32px", textAlign: "center" }}>
              <div style={{ fontFamily: serif, fontSize: 56, fontWeight: 300, color: gold, lineHeight: 1 }}>₹90–95</div>
              <div style={{ fontSize: 13, color: muted, marginTop: 12 }}>Grade A office rent per sqft/month in HITEC City</div>
            </div>

            <div style={{ border: `1px solid ${border}`, background: darkCard, padding: "40px 32px", textAlign: "center" }}>
              <div style={{ fontFamily: serif, fontSize: 56, fontWeight: 300, color: muted, lineHeight: 1 }}>72%</div>
              <div style={{ fontSize: 13, color: muted, marginTop: 12 }}>Residential price rise in 5 years</div>
            </div>
            <div style={{ fontFamily: serif, fontSize: 24, color: "rgba(201,169,110,0.4)", textAlign: "center" }}>vs</div>
            <div style={{ border: `1px solid rgba(201,169,110,0.4)`, background: darkCard, padding: "40px 32px", textAlign: "center" }}>
              <div style={{ fontFamily: serif, fontSize: 56, fontWeight: 300, color: gold, lineHeight: 1 }}>85%</div>
              <div style={{ fontSize: 13, color: muted, marginTop: 12 }}>Grade A office absorption growth 2022–2024</div>
            </div>
          </div>

          {/* Reason cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: border }}>
            {[
              { title: "GCC Lock-in", body: "Global Capability Centers sign 5–9 year leases. Zero vacancy risk once tenanted. Fortune 500 companies anchoring west Hyderabad for the long term." },
              { title: "Inflation Protection", body: "Commercial leases carry 15% escalation clauses every 3 years. Your rental income grows automatically without renegotiation." },
              { title: "Tax Efficiency", body: "Depreciation benefits, interest deductions, and SEZ advantages make commercial the most tax-efficient real estate asset class in India." },
              { title: "Portfolio Diversification", body: "Commercial real estate has near-zero correlation to equity markets. It is the asset class that performs when markets don't." },
            ].map((r) => (
              <div key={r.title} style={{ background: darkCard, padding: "36px 28px" }}>
                <h4 style={{ fontFamily: serif, fontSize: 18, fontWeight: 400, color: cream, marginBottom: 14 }}>{r.title}</h4>
                <p style={{ fontSize: 13, fontWeight: 300, color: muted, lineHeight: 1.7 }}>{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: HOW WE WORK ──────────────────────────────── */}
      <section style={{ background: darkCard, padding: "100px 80px", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(to right, transparent, ${gold}, transparent)` }} />
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: gold, marginBottom: 20, textAlign: "center" }}>
            The Westside Difference
          </p>
          <h2 style={{ fontFamily: serif, fontSize: "clamp(30px, 3vw, 44px)", fontWeight: 300, textAlign: "center", lineHeight: 1.2, color: cream, maxWidth: 560, margin: "0 auto 20px" }}>
            We are not brokers.<br /><em style={{ color: gold, fontStyle: "italic" }}>We are capital allocators.</em>
          </h2>
          <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.8, color: "rgba(245,240,232,0.65)", textAlign: "center", maxWidth: 540, margin: "0 auto 72px" }}>
            Every investor we work with gets a dedicated advisor, not a salesperson. Our process is built around your outcome.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 48 }}>
            {[
              { num: "01", title: "Discovery Call", body: "We understand your investment horizon, risk appetite, and capital available. No generic pitch decks. No pressure." },
              { num: "02", title: "Curated Options", body: "We present 2–3 handpicked opportunities that match your profile exactly. Every option is pre-vetted by our commercial team." },
              { num: "03", title: "End-to-End Execution", body: "From legal due diligence to registration to ongoing property management — we handle everything after you say yes." },
            ].map((s) => (
              <div key={s.num}>
                <div style={{ fontFamily: serif, fontSize: 72, fontWeight: 300, color: "rgba(201,169,110,0.1)", lineHeight: 1, marginBottom: 16 }}>{s.num}</div>
                <div style={{ width: 32, height: 1, background: gold, marginBottom: 20 }} />
                <h3 style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, color: cream, marginBottom: 14 }}>{s.num} / {s.title}</h3>
                <p style={{ fontSize: 14, fontWeight: 300, color: muted, lineHeight: 1.8 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: ENQUIRY FORM ─────────────────────────────── */}
      <section id="invest" style={{ background: dark, padding: "100px 80px", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(to right, transparent, ${gold}, transparent)` }} />
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: gold, marginBottom: 20, textAlign: "center" }}>
            Private Consultation
          </p>
          <h2 style={{ fontFamily: serif, fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 300, textAlign: "center", lineHeight: 1.2, color: cream, maxWidth: 560, margin: "0 auto 20px" }}>
            Tell us what you&apos;re<br /><em style={{ color: gold, fontStyle: "italic" }}>looking to build.</em>
          </h2>
          <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.8, color: "rgba(245,240,232,0.65)", textAlign: "center", maxWidth: 520, margin: "0 auto 56px" }}>
            Share your investment profile. Our commercial specialist will reach out within 4 hours with curated options.
          </p>
          <CommercialEnquiryForm />
        </div>
      </section>

    </main>
  );
}
