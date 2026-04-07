import type { Metadata } from "next";
import CommercialEnquiryForm from "./CommercialEnquiryForm";
import { JsonLd } from "@/components/common/SEO";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Commercial Real Estate Investment | Grade A Offices | West Hyderabad | Westside Realty",
  description:
    "Curated Grade A commercial office investments in Banjara Hills, HITEC City, Financial District and Kokapet. Four investment stages from early entry to rental-ready.",
  alternates: { canonical: "https://www.westsiderealty.in/commercial-investments" },
  keywords: "commercial real estate hyderabad, grade a office space hyderabad, hitec city commercial investment, financial district office space",
  openGraph: {
    title: "Commercial Real Estate Investment | Grade A Offices | West Hyderabad | Westside Realty",
    description: "Curated Grade A commercial office investments in HITEC City, Financial District and Kokapet.",
    url: "https://www.westsiderealty.in/commercial-investments",
    siteName: "RE/MAX Westside Realty",
    type: "website",
  },
};

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

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  dark:     "#0D0D0B",
  darkCard: "#131311",
  darkAlt:  "#111110",
  cream:    "#F5F0E8",
  gold:     "#C9A96E",
  goldDim:  "rgba(201,169,110,0.18)",
  muted:    "#7A7874",
  border:   "rgba(201,169,110,0.12)",
  serif:    "'Cormorant Garamond', Georgia, serif",
  sans:     "'Outfit', sans-serif",
} as const;

function GoldLine() {
  return <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${T.gold}, transparent)` }} />;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold, margin: "0 0 18px", textAlign: "center" }}>
      {children}
    </p>
  );
}

export default function CommercialInvestmentsPage() {
  return (
    <main style={{ background: T.dark, minHeight: "100vh", fontFamily: T.sans }}>
      <JsonLd jsonLd={faqSchema} />

      <style>{`
        .ci-corridor-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: ${T.border}; }
        .ci-stages-grid   { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; background: ${T.border}; }
        .ci-reasons-grid  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: ${T.border}; }
        .ci-process-grid  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 56px; }
        .ci-stats-compare { display: grid; grid-template-columns: 1fr auto 1fr; gap: 24px; align-items: center; max-width: 860px; margin: 0 auto 72px; }
        @media (max-width: 900px) {
          .ci-corridor-grid { grid-template-columns: 1fr 1fr !important; }
          .ci-reasons-grid  { grid-template-columns: 1fr 1fr !important; }
          .ci-process-grid  { grid-template-columns: 1fr !important; gap: 40px; }
          .ci-stats-compare { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .ci-stages-grid   { grid-template-columns: 1fr !important; }
          .ci-corridor-grid { grid-template-columns: 1fr !important; }
          .ci-reasons-grid  { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "clamp(80px,10vw,120px) clamp(24px,6vw,96px) clamp(60px,8vw,96px)",
        background: `linear-gradient(to bottom, rgba(13,13,11,0.7) 0%, rgba(13,13,11,0.3) 35%, rgba(13,13,11,0.85) 75%, ${T.dark} 100%), url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=2000&q=80') center/cover no-repeat`,
        position: "relative",
      }}>
        <div style={{ maxWidth: 1100, width: "100%" }}>
          <div style={{ marginBottom: 36 }}>
            <span style={{ display: "inline-block", border: `1px solid ${T.border}`, color: T.gold, fontSize: 11, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", padding: "7px 20px" }}>
              Grade A · West Hyderabad · By Invitation
            </span>
          </div>

          <h1 style={{ fontFamily: T.serif, fontSize: "clamp(44px,5.5vw,84px)", fontWeight: 300, lineHeight: 1.06, color: T.cream, maxWidth: 800, margin: "0 0 28px" }}>
            Commercial Real Estate<br />That Works While<br /><em style={{ color: T.gold, fontStyle: "italic" }}>You Sleep.</em>
          </h1>

          <p style={{ fontSize: 16, fontWeight: 300, color: T.muted, maxWidth: 500, lineHeight: 1.85, margin: "0 0 56px" }}>
            We match serious capital with curated Grade A office opportunities across Banjara Hills, HITEC City, Financial District, and Kokapet — before they reach the open market.
          </p>

          <div style={{ display: "flex", gap: 64, flexWrap: "wrap", marginBottom: 56 }}>
            {[
              { val: "12.3 MSF", label: "Office space absorbed in Hyderabad 2024" },
              { val: "43%",      label: "Demand driven by GCCs — long leases, zero vacancy" },
              { val: "5–9 Yrs",  label: "Typical lease lock-in with Fortune 500 tenants" },
            ].map((s) => (
              <div key={s.val}>
                <div style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 300, color: T.gold, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted, marginTop: 8, maxWidth: 200 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <a href="#invest" style={{ display: "inline-block", background: T.gold, color: T.dark, padding: "16px 40px", fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>
            Explore Opportunities →
          </a>
        </div>
      </section>

      {/* ── CORRIDOR ──────────────────────────────────────────────────────── */}
      <section style={{ background: T.darkAlt, padding: "clamp(64px,8vw,112px) clamp(24px,6vw,96px)" }}>
        <GoldLine />
        <div style={{ maxWidth: 1100, margin: "0 auto", paddingTop: "clamp(64px,8vw,112px)" }}>
          <Eyebrow>West Hyderabad Corridor</Eyebrow>
          <h2 style={{ fontFamily: T.serif, fontSize: "clamp(30px,3.5vw,50px)", fontWeight: 300, textAlign: "center", lineHeight: 1.18, color: T.cream, maxWidth: 700, margin: "0 auto 20px" }}>
            Five kilometres that define<br /><em style={{ color: T.gold, fontStyle: "italic" }}>India's most dynamic office market.</em>
          </h2>
          <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.85, color: "rgba(245,240,232,0.55)", textAlign: "center", maxWidth: 620, margin: "0 auto 56px" }}>
            From Banjara Hills to Kokapet, the western corridor hosts 80% of Hyderabad's Grade A office stock. HITEC City Grade A rents have climbed to ₹90–95/sqft/month. The ORR corridor and Kokapet are the next frontier.
          </p>

          <div className="ci-corridor-grid">
            {[
              { area: "Banjara Hills",           rent: "₹70–80/sqft/mo",  desc: "Legacy addresses. Established tenants. Stable yields." },
              { area: "HITEC City & Madhapur",   rent: "₹90–95/sqft/mo",  desc: "Highest absorption. Sub-6% vacancy. Prime demand." },
              { area: "Financial District",       rent: "₹60–75/sqft/mo",  desc: "GCC epicentre. Largest deal sizes. Blue-chip tenants." },
              { area: "Kokapet & ORR Corridor",  rent: "₹55–70/sqft/mo",  desc: "Next frontier. Pre-leased pipeline. 15–25% appreciation." },
            ].map((c) => (
              <div key={c.area} style={{ background: T.darkCard, padding: "36px 28px" }}>
                <h3 style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 400, color: T.cream, margin: "0 0 12px", lineHeight: 1.3 }}>{c.area}</h3>
                <p style={{ fontSize: 13, fontWeight: 300, color: T.muted, lineHeight: 1.75, margin: "0 0 20px" }}>{c.desc}</p>
                <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 300, color: T.gold }}>{c.rent}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INVESTMENT STAGES ─────────────────────────────────────────────── */}
      <section style={{ background: T.dark, padding: "clamp(64px,8vw,112px) clamp(24px,6vw,96px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Eyebrow>Investment Strategy</Eyebrow>
          <h2 style={{ fontFamily: T.serif, fontSize: "clamp(30px,3.5vw,50px)", fontWeight: 300, textAlign: "center", lineHeight: 1.18, color: T.cream, maxWidth: 620, margin: "0 auto 20px" }}>
            Four stages of entry.<br /><em style={{ color: T.gold, fontStyle: "italic" }}>One decision that matters.</em>
          </h2>
          <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.85, color: "rgba(245,240,232,0.55)", textAlign: "center", maxWidth: 580, margin: "0 auto 56px" }}>
            We structure commercial investments across four risk-return profiles. Every stage has a different entry price, yield expectation, and exit horizon.
          </p>

          <div className="ci-stages-grid">
            {[
              {
                num: "01", title: "Early Entry", tagColor: "#e05a30", tag: "High Risk · High Reward",
                timeline: "Horizon: 3–5 Years",
                desc: "Invest at project launch or pre-construction. Lowest entry price, maximum capital appreciation potential. Returns driven purely by appreciation — no rental income until completion.",
                metrics: ["Entry Discount: 25–35% below market", "Appreciation Potential: 40–60%"],
              },
              {
                num: "02", title: "Mid-Construction", tagColor: "#d4a017", tag: "Medium Risk · Strong Upside",
                timeline: "Horizon: 2–3 Years",
                desc: "Project at 40–60% completion. Construction risk largely mitigated. Strong capital appreciation as the asset approaches completion and pre-leasing begins.",
                metrics: ["Entry Discount: 15–20% below market", "Appreciation Potential: 25–35%"],
              },
              {
                num: "03", title: "Near Completion", tagColor: "#3aab6a", tag: "Low Risk · Balanced",
                timeline: "Horizon: 12–18 Months",
                desc: "Asset 80–95% complete. Tenant conversations underway or MoUs signed. Best balance of capital appreciation and early yield visibility.",
                metrics: ["Entry Discount: 8–12% below market", "Expected Yield: 6–8% from year 2"],
              },
              {
                num: "04", title: "Rental Ready", tagColor: T.gold, tag: "Zero Risk · Immediate Income",
                timeline: "Immediate Returns",
                desc: "Fully completed, tenanted Grade A asset. Lease agreements in place. Rental income from day one. Predictable, inflation-protected income stream.",
                metrics: ["Immediate rental income from day one", "Lease Security: 5–9 year lock-ins"],
              },
            ].map((s) => (
              <div key={s.num} style={{ background: T.darkCard, padding: "clamp(32px,4vw,52px) clamp(24px,3vw,40px)" }}>
                <div style={{ fontFamily: T.serif, fontSize: 56, fontWeight: 300, color: "rgba(201,169,110,0.1)", lineHeight: 1, marginBottom: 16 }}>{s.num}</div>
                <h3 style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 400, color: T.cream, margin: "0 0 10px" }}>{s.title}</h3>
                <div style={{ display: "inline-block", fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: s.tagColor, border: `1px solid ${s.tagColor}50`, padding: "4px 14px", marginBottom: 14 }}>{s.tag}</div>
                <p style={{ fontSize: 11, color: T.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>{s.timeline}</p>
                <p style={{ fontSize: 14, fontWeight: 300, color: "rgba(245,240,232,0.65)", lineHeight: 1.85, marginBottom: 28 }}>{s.desc}</p>
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                  {s.metrics.map((m) => (
                    <div key={m} style={{ display: "flex", gap: 12, fontSize: 13, color: "rgba(245,240,232,0.65)" }}>
                      <span style={{ color: T.gold, fontSize: 10, flexShrink: 0, marginTop: 4 }}>—</span>{m}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY COMMERCIAL NOW ────────────────────────────────────────────── */}
      <section style={{ background: T.darkAlt, padding: "clamp(64px,8vw,112px) clamp(24px,6vw,96px)" }}>
        <GoldLine />
        <div style={{ maxWidth: 1100, margin: "0 auto", paddingTop: "clamp(64px,8vw,112px)" }}>
          <Eyebrow>The Case for Commercial</Eyebrow>
          <h2 style={{ fontFamily: T.serif, fontSize: "clamp(30px,3.5vw,50px)", fontWeight: 300, textAlign: "center", lineHeight: 1.18, color: T.cream, maxWidth: 700, margin: "0 auto 56px" }}>
            While everyone bought apartments,<br /><em style={{ color: T.gold, fontStyle: "italic" }}>smart money moved to offices.</em>
          </h2>

          {/* Compare stats */}
          <div className="ci-stats-compare">
            <div style={{ border: `1px solid ${T.border}`, background: T.darkCard, padding: "40px 32px", textAlign: "center" }}>
              <div style={{ fontFamily: T.serif, fontSize: 52, fontWeight: 300, color: T.muted, lineHeight: 1 }}>3–4%</div>
              <div style={{ fontSize: 13, color: T.muted, marginTop: 12, lineHeight: 1.5 }}>Residential rental yield in Hyderabad</div>
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 22, color: "rgba(201,169,110,0.35)", textAlign: "center" }}>vs</div>
            <div style={{ border: `1px solid rgba(201,169,110,0.35)`, background: T.darkCard, padding: "40px 32px", textAlign: "center" }}>
              <div style={{ fontFamily: T.serif, fontSize: 52, fontWeight: 300, color: T.gold, lineHeight: 1 }}>₹90–95</div>
              <div style={{ fontSize: 13, color: T.muted, marginTop: 12, lineHeight: 1.5 }}>Grade A office rent per sqft/month, HITEC City</div>
            </div>

            <div style={{ border: `1px solid ${T.border}`, background: T.darkCard, padding: "40px 32px", textAlign: "center" }}>
              <div style={{ fontFamily: T.serif, fontSize: 52, fontWeight: 300, color: T.muted, lineHeight: 1 }}>72%</div>
              <div style={{ fontSize: 13, color: T.muted, marginTop: 12, lineHeight: 1.5 }}>Residential price rise over 5 years</div>
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 22, color: "rgba(201,169,110,0.35)", textAlign: "center" }}>vs</div>
            <div style={{ border: `1px solid rgba(201,169,110,0.35)`, background: T.darkCard, padding: "40px 32px", textAlign: "center" }}>
              <div style={{ fontFamily: T.serif, fontSize: 52, fontWeight: 300, color: T.gold, lineHeight: 1 }}>85%</div>
              <div style={{ fontSize: 13, color: T.muted, marginTop: 12, lineHeight: 1.5 }}>Grade A office absorption growth 2022–2024</div>
            </div>
          </div>

          <div className="ci-reasons-grid">
            {[
              { title: "GCC Lock-in",          body: "Global Capability Centers sign 5–9 year leases. Fortune 500 companies anchoring west Hyderabad for the long term." },
              { title: "Inflation Protection",  body: "Commercial leases carry 15% escalation clauses every 3 years. Your rental income grows automatically." },
              { title: "Tax Efficiency",        body: "Depreciation benefits, interest deductions, and SEZ advantages make commercial the most tax-efficient real estate class in India." },
              { title: "Portfolio Hedge",       body: "Commercial real estate has near-zero correlation to equity markets — it performs when markets don't." },
            ].map((r) => (
              <div key={r.title} style={{ background: T.darkCard, padding: "36px 28px" }}>
                <h4 style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 400, color: T.cream, margin: "0 0 14px" }}>{r.title}</h4>
                <p style={{ fontSize: 13, fontWeight: 300, color: T.muted, lineHeight: 1.75, margin: 0 }}>{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW WE WORK ───────────────────────────────────────────────────── */}
      <section style={{ background: T.darkCard, padding: "clamp(64px,8vw,112px) clamp(24px,6vw,96px)" }}>
        <GoldLine />
        <div style={{ maxWidth: 1100, margin: "0 auto", paddingTop: "clamp(64px,8vw,112px)" }}>
          <Eyebrow>The Westside Difference</Eyebrow>
          <h2 style={{ fontFamily: T.serif, fontSize: "clamp(28px,3vw,46px)", fontWeight: 300, textAlign: "center", lineHeight: 1.2, color: T.cream, maxWidth: 540, margin: "0 auto 16px" }}>
            We are not brokers.<br /><em style={{ color: T.gold, fontStyle: "italic" }}>We are capital allocators.</em>
          </h2>
          <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.85, color: "rgba(245,240,232,0.55)", textAlign: "center", maxWidth: 520, margin: "0 auto 72px" }}>
            Every investor works with a dedicated advisor, not a salesperson. Our process is built around your outcome.
          </p>

          <div className="ci-process-grid">
            {[
              { num: "01", title: "Discovery Call",        body: "We understand your investment horizon, risk appetite, and capital. No generic pitch decks. No pressure." },
              { num: "02", title: "Curated Options",       body: "We present 2–3 handpicked opportunities that match your profile exactly. Every option is pre-vetted by our commercial team." },
              { num: "03", title: "End-to-End Execution",  body: "From legal due diligence to registration to ongoing property management — we handle everything after you say yes." },
            ].map((s) => (
              <div key={s.num}>
                <div style={{ fontFamily: T.serif, fontSize: 64, fontWeight: 300, color: "rgba(201,169,110,0.08)", lineHeight: 1, marginBottom: 16 }}>{s.num}</div>
                <div style={{ width: 32, height: 1, background: T.gold, marginBottom: 20 }} />
                <h3 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 400, color: T.cream, margin: "0 0 12px" }}>{s.num} / {s.title}</h3>
                <p style={{ fontSize: 14, fontWeight: 300, color: T.muted, lineHeight: 1.85, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENQUIRY FORM ──────────────────────────────────────────────────── */}
      <section id="invest" style={{ background: T.dark, padding: "clamp(64px,8vw,112px) clamp(24px,6vw,96px)" }}>
        <GoldLine />
        <div style={{ maxWidth: 1100, margin: "0 auto", paddingTop: "clamp(64px,8vw,112px)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
            {/* Left: copy */}
            <div>
              <Eyebrow>Private Consultation</Eyebrow>
              <h2 style={{ fontFamily: T.serif, fontSize: "clamp(30px,3.5vw,50px)", fontWeight: 300, lineHeight: 1.15, color: T.cream, margin: "0 0 20px" }}>
                Tell us what you're<br /><em style={{ color: T.gold, fontStyle: "italic" }}>looking to build.</em>
              </h2>
              <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.85, color: "rgba(245,240,232,0.55)", margin: "0 0 40px" }}>
                Share your investment profile. Our commercial specialist will reach out within 4 hours with curated options matched to your capital and timeline.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {[
                  { icon: "→", label: "Confidential — no spam, no cold calls" },
                  { icon: "→", label: "Response within 4 working hours" },
                  { icon: "→", label: "2–3 curated options, not a catalog" },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <span style={{ color: T.gold, fontSize: 13, marginTop: 1 }}>{item.icon}</span>
                    <span style={{ fontFamily: T.sans, fontSize: 14, color: "rgba(245,240,232,0.6)", lineHeight: 1.5 }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Right: form */}
            <div style={{ background: T.darkCard, padding: "clamp(28px,4vw,48px)", border: `1px solid ${T.border}` }}>
              <CommercialEnquiryForm />
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
