import type { Metadata } from "next";
import Link from "next/link";
import { InsightsAdvisorCTA } from "../InsightsAdvisorCTA";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "The GCC Rush: How Hyderabad Became India's Global Capability Centre Capital | Westside Realty",
  description:
    "In 2024–25, Hyderabad added more GCC seats than any other Indian city. What's driving the rush, which companies are here, and what it means for real estate.",
  alternates: {
    canonical: "https://www.westsiderealty.in/insights/gcc-hyderabad",
  },
};

const LAST_UPDATED = "March 2026";

// ─── Design constants ─────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GccHyderabadPage() {
  return (
    <>
      <style>{`
        .gcc-body h2 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 28px;
          font-weight: 600;
          color: #1A1A1F;
          margin: 40px 0 16px;
          line-height: 1.3;
        }
        .gcc-body h3 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 22px;
          font-weight: 600;
          color: #1A1A1F;
          margin: 32px 0 12px;
        }
        .gcc-body p {
          font-family: 'Outfit', sans-serif;
          font-size: 17px;
          color: #1A1A1F;
          line-height: 1.85;
          margin: 0 0 24px;
        }
        .gcc-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin: 0 0 48px;
        }
        @media (max-width: 768px) {
          .gcc-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .gcc-table-head, .gcc-table-row { grid-template-columns: 2fr 1fr !important; }
          .gcc-table-head span:last-child, .gcc-table-row span:last-child { display: none !important; }
        }
      `}</style>

      {/* ── Section 1: Hero ───────────────────────────────────────────────── */}
      <section
        style={{
          background: C.bgDark,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 65% 60% at 65% 40%, rgba(176,141,87,0.10) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "100px 24px 64px",
            position: "relative",
          }}
        >
          <Link
            href="/insights"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13,
              color: "rgba(255,255,255,0.4)",
              textDecoration: "none",
              display: "inline-block",
              marginBottom: 24,
            }}
          >
            ← Back to Research
          </Link>

          <div style={{ marginBottom: 16 }}>
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: C.gold,
              }}
            >
              Research Report · Employment
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(36px,5vw,56px)",
              fontWeight: 600,
              color: "#fff",
              lineHeight: 1.15,
              margin: "0 0 20px",
            }}
          >
            The GCC Rush:{" "}
            <span style={{ color: C.goldLight }}>Hyderabad&apos;s Rise</span> as
            India&apos;s GCC Capital
          </h1>
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 18,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.6,
              maxWidth: 580,
              margin: "0 0 8px",
            }}
          >
            In 2024–25, more Global Capability Centres opened in Hyderabad than
            in any other Indian city. This is what&apos;s driving the rush — and what
            it means for property prices.
          </p>
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 12,
              color: "rgba(255,255,255,0.25)",
              margin: 0,
            }}
          >
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* ── Executive Summary ─────────────────────────────────────────────── */}
      <section style={{ background: C.bg, padding: "48px 24px 0" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div
            style={{
              background: C.bgCard,
              borderLeft: `4px solid ${C.gold}`,
              padding: "24px 28px",
              borderRadius: "0 12px 12px 0",
            }}
          >
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: C.gold,
                margin: "0 0 12px",
              }}
            >
              Executive Summary
            </p>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 15,
                color: C.text,
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Hyderabad added more Global Capability Centre seats in 2024–25 than
              any other Indian city. With 225+ GCCs, 6.5 lakh employees, and ₹2.1
              lakh crore in committed capex, the city&apos;s GCC dominance is a
              structural economic advantage — one that directly drives demand for
              premium residential real estate in corridors like Kokapet, Financial
              District, and Gachibowli.
            </p>
          </div>
        </div>
      </section>

      {/* ── Body Content ──────────────────────────────────────────────────── */}
      <section style={{ background: C.bg, padding: "48px 24px 80px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }} className="gcc-body">

          {/* Stats grid */}
          <div className="gcc-stat-grid">
            {[
              { stat: "225+", label: "GCCs operational", sub: "as of early 2026" },
              { stat: "6.5L+", label: "GCC employees", sub: "in Hyderabad" },
              { stat: "38%", label: "new GCC seats", sub: "of India total in 2024–25" },
              { stat: "₹2.1L Cr", label: "GCC-linked capex", sub: "committed 2024–2026" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: C.bgCard,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: "20px 20px",
                }}
              >
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: 32,
                    fontWeight: 600,
                    color: C.gold,
                    margin: "0 0 4px",
                    lineHeight: 1,
                  }}
                >
                  {s.stat}
                </p>
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.text,
                    margin: "0 0 2px",
                  }}
                >
                  {s.label}
                </p>
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 11,
                    color: C.textMuted,
                    margin: 0,
                  }}
                >
                  {s.sub}
                </p>
              </div>
            ))}
          </div>

          {/* What is a GCC */}
          <div
            style={{
              background: C.bgWarm,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: 28,
              marginBottom: 40,
            }}
          >
            <h2 style={{ margin: "0 0 16px" }}>
              What is a GCC — and why does it matter for real estate?
            </h2>
            <p>
              A Global Capability Centre (GCC) — also called a captive centre or
              offshore office — is a wholly-owned subsidiary of a multinational
              corporation set up in India to handle high-value work: technology
              development, analytics, finance, legal, HR, and increasingly, AI and
              product management. GCCs are not call centres. They are the
              engineering and strategic brains of global companies, operating in
              India because talent here is world-class and 60–70% cheaper than
              equivalent roles in the US or Europe.
            </p>
            <p style={{ margin: 0 }}>
              For real estate, GCCs are the most important demand driver in the
              market. A GCC employing 3,000 people at average salaries of ₹20–25
              lakh/year creates immediate, sustained demand for 800–1,200 housing
              units within a 30-minute commute. Unlike IT services companies (which
              shrink headcount in downturns), GCCs have demonstrated resilience:
              their work is core to the parent company&apos;s operations, making them
              structurally sticky in cities where they set up.
            </p>
          </div>

          {/* Why Hyderabad won */}
          <h2>Why Hyderabad Won the GCC Race</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 48 }}>
            {[
              {
                title: "The 2014 bifurcation bet that paid off",
                body: "When Telangana was carved out of Andhra Pradesh in 2014, the new state needed to establish its own economic identity fast. Chief Minister K. Chandrashekar Rao made a clear choice: tech and investment attraction above all else. The IT Investment Region (ITIR) policy, HYDRAA's streamlined clearances, and direct chief-minister-level engagement with Fortune 500 CEOs became a playbook that no other Indian state has replicated at the same intensity. By 2018, Hyderabad had leapfrogged Pune and Chennai as the second-preferred GCC destination after Bengaluru. By 2024, it had overtaken Bengaluru in new GCC setups per year.",
                badge: "Policy",
                badgeColor: C.gold,
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
                body: "The fear that AI would reduce GCC headcount has proven wrong in Hyderabad. The opposite has happened. AI product development, model training, data annotation, and AI infrastructure management all require large, skilled teams in low-cost locations. Hyderabad's combination of IIIT Hyderabad (India's top AI research institution), 90,000+ annual engineering graduates, and existing MNC relationships has made it the destination of choice for AI GCC expansion. Microsoft's Hyderabad AI centre, Google's DeepMind India collaboration, and Amazon's Alexa AI hub are all Hyderabad-based.",
                badge: "AI Expansion",
                badgeColor: "#a78bfa",
              },
            ].map((r) => (
              <div
                key={r.title}
                style={{
                  background: C.bgCard,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: 28,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: 18 }}>{r.title}</h3>
                  <span
                    style={{
                      flexShrink: 0,
                      background: r.badgeColor + "20",
                      color: r.badgeColor,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      borderRadius: 20,
                      padding: "3px 10px",
                    }}
                  >
                    {r.badge}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 15, color: C.textMuted }}>{r.body}</p>
              </div>
            ))}
          </div>

          {/* GCC table */}
          <h2>Major GCCs Operating in Hyderabad</h2>
          <div
            style={{
              background: C.bgCard,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 48,
            }}
          >
            <div
              className="gcc-table-head"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                gap: 8,
                padding: "12px 20px",
                background: C.bgWarm,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              {["Company", "Sector", "Est. Headcount"].map((h) => (
                <span
                  key={h}
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: C.textMuted,
                  }}
                >
                  {h}
                </span>
              ))}
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
              <div
                key={r.co}
                className="gcc-table-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr",
                  gap: 8,
                  alignItems: "center",
                  padding: "14px 20px",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    color: C.text,
                  }}
                >
                  {r.co}
                </span>
                <span
                  style={{
                    background: r.color + "18",
                    color: r.color,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    borderRadius: 20,
                    padding: "3px 10px",
                    display: "inline-block",
                    width: "fit-content",
                  }}
                >
                  {r.sector}
                </span>
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.text,
                  }}
                >
                  {r.hc}
                </span>
              </div>
            ))}
          </div>

          {/* Impact on residential */}
          <h2>The GCC Effect on Residential Real Estate</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 48 }}>
            {[
              {
                label: "Premium salary, premium housing",
                color: C.gold,
                body: "GCC employees in Hyderabad earn significantly above IT services averages. A senior engineer at a Goldman Sachs or Microsoft GCC earns ₹25–60 lakh/year. At this income level, the affordable-to-premium transition happens fast. A couple both working at MNC GCCs has a combined household income of ₹50–120 lakh/year — the exact demographic that buys 3BHK and 4BHK homes in Kokapet, Financial District, and Gachibowli at ₹1.5–3.5 crore.",
              },
              {
                label: "2024–25 saw the fastest premium residential absorption in Hyderabad's history",
                color: "#4ade80",
                body: "Q3 2024 to Q1 2025 saw ₹2Cr+ residential units absorbed at a record pace — 38% faster than the same period in 2022–23. The primary driver is identifiable: BFSI GCC expansion. Goldman Sachs, Bank of America, and Wells Fargo all expanded their Hyderabad headcount by 20–30% in this period.",
              },
              {
                label: "GCC demand is rental income-protected",
                color: "#60a5fa",
                body: "An investor buying a 3BHK in Kokapet or Nanakramguda today is buying into an existing, 650,000-person employment base that needs housing now. Rental vacancy in corridors adjacent to GCC clusters runs at 2–4%, with typical yields of 3.8–4.8%. GCC-proximate residential is the safest rental income bet in Hyderabad.",
              },
              {
                label: "The 2026–2028 pipeline will widen the premium corridor",
                color: "#a78bfa",
                body: "The Kokapet SEZ (22 million sqft, anchored by Tata Consultancy and Infosys, with 12+ global MNCs already pre-leased) will add an estimated 80,000–100,000 GCC seats between 2026–2029. Buyers entering these sub-markets today are buying the 2018 version of Gachibowli.",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: C.bgCard,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: 24,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: s.color,
                      flexShrink: 0,
                    }}
                  />
                  <h3 style={{ margin: 0, fontSize: 15, color: C.text }}>
                    {s.label}
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: 15, color: C.textMuted, lineHeight: 1.75 }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom line */}
          <div
            style={{
              background: "rgba(139,92,246,0.06)",
              border: "1px solid rgba(139,92,246,0.2)",
              borderRadius: 16,
              padding: 28,
            }}
          >
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#c4b5fd",
                margin: "0 0 12px",
              }}
            >
              The Bottom Line
            </p>
            <p style={{ margin: 0, fontSize: 15, color: C.text, lineHeight: 1.75 }}>
              Hyderabad&apos;s GCC dominance is not a 2024 story — it is a
              decade-long structural advantage that is now compounding. The city
              has built a self-reinforcing loop: global companies come for talent
              → talent gets paid well → talent buys premium housing → premium
              housing drives price appreciation → developers build more premium
              supply → more global companies find the infrastructure they need.
              This loop is in mid-cycle, not late-cycle.
            </p>
          </div>
        </div>
      </section>

      {/* ── AI Advisor CTA ────────────────────────────────────────────────── */}
      <InsightsAdvisorCTA />
    </>
  );
}