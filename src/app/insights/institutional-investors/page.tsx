import type { Metadata } from "next";
import Link from "next/link";
import { InsightsAdvisorCTA } from "../InsightsAdvisorCTA";

export const metadata: Metadata = {
  title: "Why Institutional Investors Are Choosing Hyderabad for Commercial Real Estate | Westside Realty",
  description:
    "Global REITs, sovereign wealth funds, and PE firms are deploying billions into Hyderabad commercial real estate. Here's why Hyderabad is winning the institutional capital race.",
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

export default function InstitutionalInvestorsPage() {
  return (
    <>
      <style>{`
        .inst-body h2 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 28px;
          font-weight: 600;
          color: #1A1A1F;
          margin: 40px 0 16px;
          line-height: 1.3;
        }
        .inst-body h3 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 22px;
          font-weight: 600;
          color: #1A1A1F;
          margin: 32px 0 12px;
        }
        .inst-body p {
          font-family: 'Outfit', sans-serif;
          font-size: 17px;
          color: #1A1A1F;
          line-height: 1.85;
          margin: 0 0 24px;
        }
        @media (max-width: 768px) {
          .inv-grid { grid-template-columns: 1fr !important; }
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
              Research Report · Commercial
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
            Why Institutional Investors Are Choosing Hyderabad
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
            Global REITs, sovereign wealth funds, and private equity firms are
            deploying billions into Hyderabad commercial real estate. The reasons
            are structural, not speculative.
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
              In 2025, Hyderabad absorbed over 12 million square feet of Grade A
              office space — making it the second-largest office market in India by
              absorption. Behind these numbers is a deliberate, accelerating flow
              of institutional capital: Blackstone, GIC Singapore, Brookfield,
              CapitaLand, and sovereign funds are all active in the city. This is
              not a cyclical trend — it is a structural rerating of Hyderabad as a
              top-tier global commercial real estate destination.
            </p>
          </div>
        </div>
      </section>

      {/* ── Body Content ──────────────────────────────────────────────────── */}
      <section style={{ background: C.bg, padding: "48px 24px 80px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }} className="inst-body">

          {/* Six Reasons */}
          <h2>The Six Reasons Institutions Are Here</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 48 }}>
            {[
              {
                number: "01",
                title: "Single-window policy and developer-friendly governance",
                color: C.gold,
                body: "The Telangana state government has built one of India's most efficient approval frameworks for large commercial projects. TS-iPASS guarantees approvals within 15 days for projects above ₹100 crore. Compare this to the 6–24 month approval timelines in Maharashtra or Karnataka. For institutional investors deploying ₹500 crore+ into a single asset, predictable timelines directly reduce carrying cost and improve IRR.",
                stat: "15 days",
                statLabel: "avg. commercial approval via TS-iPASS",
              },
              {
                number: "02",
                title: "The lowest Grade A vacancy rate among major Indian cities",
                color: "#4ade80",
                body: "Hyderabad's Financial District and HITEC City belt consistently post vacancy rates of 3–6% for Grade A office space — the lowest in India. Mumbai's BKC runs at 8–12%; Bengaluru's Outer Ring Road at 14–18% after the 2022–23 tech correction. Low vacancy means stable rental income, limited mark-to-market risk, and strong lease renewal rates.",
                stat: "3–6%",
                statLabel: "Grade A vacancy, Financial District belt",
              },
              {
                number: "03",
                title: "Tenant quality that matches global institutional requirements",
                color: "#60a5fa",
                body: "Institutional investors require tenants with investment-grade credit ratings and multi-year lease commitments. Hyderabad's tenant roster reads like a Fortune 500 list: Google, Microsoft, Amazon, Apple, Meta, Goldman Sachs, Bank of America, Wells Fargo, UBS, JP Morgan, Deloitte, KPMG, and 200+ MNC GCCs. These are 5–10 year leases with locked escalation clauses.",
                stat: "200+",
                statLabel: "Fortune 500 / MNC GCC tenants in Hyderabad",
              },
              {
                number: "04",
                title: "Commercial yields that significantly outperform Mumbai and Delhi",
                color: "#a78bfa",
                body: "Grade A office yields in Hyderabad's premium corridors run at 7.5–9% gross — versus 5.5–7% in Mumbai BKC and 6–7.5% in Bengaluru CBD. This 150–200 basis point premium makes Hyderabad the highest-yielding institutional-grade office market in the country. The currency play adds another 4–5% for USD-denominated funds.",
                stat: "7.5–9%",
                statLabel: "Grade A office gross yield, Hyderabad premium belt",
              },
              {
                number: "05",
                title: "The SEZ and data centre pipeline creating new asset classes",
                color: "#34d399",
                body: "Hyderabad has become India's largest data centre market, with over 500 MW of commissioned or under-construction capacity — driven by hyperscaler demand from Microsoft Azure, Google Cloud, and AWS. Data centres are an institutional asset class: 10–15 year triple-net leases, utility-grade counterparties, and yields of 8–11%.",
                stat: "500+ MW",
                statLabel: "data centre capacity in Hyderabad (commissioned + pipeline)",
              },
              {
                number: "06",
                title: "A talent pool that makes tenants sticky",
                color: "#f59e0b",
                body: "The deepest institutional fear in commercial real estate is tenant departure. In Hyderabad, this risk is structurally mitigated. The city produces over 90,000 engineering graduates annually. The cost of equivalent talent is 35–45% below Bengaluru and 50–60% below equivalent roles in Singapore or the US. This stickiness is what gives institutional investors long-duration confidence in their commercial assets.",
                stat: "90,000+",
                statLabel: "engineering graduates produced annually",
              },
            ].map((r) => (
              <div
                key={r.number}
                style={{
                  background: C.bgCard,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: 28,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 12 }}>
                  <span
                    style={{
                      flexShrink: 0,
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: r.color + "18",
                      border: `1px solid ${r.color}30`,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 12,
                      fontWeight: 700,
                      color: r.color,
                    }}
                  >
                    {r.number}
                  </span>
                  <h3 style={{ margin: 0, fontSize: 17, paddingTop: 6 }}>{r.title}</h3>
                </div>
                <p style={{ margin: "0 0 16px", fontSize: 15, color: C.textMuted, lineHeight: 1.75 }}>
                  {r.body}
                </p>
                <div
                  style={{
                    display: "inline-block",
                    background: r.color + "12",
                    border: `1px solid ${r.color}25`,
                    borderRadius: 12,
                    padding: "10px 18px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: 24,
                      fontWeight: 600,
                      color: r.color,
                      margin: "0 0 2px",
                      lineHeight: 1,
                    }}
                  >
                    {r.stat}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 11,
                      color: C.textMuted,
                      margin: 0,
                    }}
                  >
                    {r.statLabel}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Who's active */}
          <h2>Who Is Actively Deploying Capital</h2>
          <div
            className="inv-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
              marginBottom: 48,
            }}
          >
            {[
              { investor: "Blackstone", type: "US PE / REIT", focus: "Grade A office parks, IT SEZs" },
              { investor: "Brookfield Asset Management", type: "Canada PE", focus: "Large-format IT campuses" },
              { investor: "GIC Singapore", type: "Sovereign Wealth Fund", focus: "Office + mixed-use" },
              { investor: "CapitaLand", type: "Singapore REIT", focus: "IT parks, business parks" },
              { investor: "Invesco Real Estate", type: "US fund manager", focus: "Data centres + logistics" },
              { investor: "CPPIB (Canada Pension)", type: "Pension fund", focus: "Core office" },
            ].map((inv) => (
              <div
                key={inv.investor}
                style={{
                  background: C.bgCard,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "18px 20px",
                }}
              >
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 15,
                    fontWeight: 600,
                    color: C.text,
                    margin: "0 0 4px",
                  }}
                >
                  {inv.investor}
                </p>
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 12,
                    color: C.textMuted,
                    margin: "0 0 6px",
                  }}
                >
                  {inv.type}
                </p>
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    color: C.gold,
                    margin: 0,
                  }}
                >
                  {inv.focus}
                </p>
              </div>
            ))}
          </div>

          {/* What this means for residential */}
          <h2>What This Means for Residential Buyers</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 48 }}>
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
                body: "In corridors with institutional-grade commercial anchor tenants, residential rental yields are protected by genuine demand — not speculation. A 3BHK in Kokapet rented to a Goldman GCC employee at ₹55,000/month is not at risk of vacancy the way a peripheral market rental is.",
              },
            ].map((s) => (
              <div
                key={s.title}
                style={{
                  background: C.bgCard,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: 24,
                }}
              >
                <h3 style={{ margin: "0 0 10px", fontSize: 17, color: C.text }}>
                  {s.title}
                </h3>
                <p style={{ margin: 0, fontSize: 15, color: C.textMuted, lineHeight: 1.75 }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Advisor CTA ────────────────────────────────────────────────── */}
      <InsightsAdvisorCTA />
    </>
  );
}
