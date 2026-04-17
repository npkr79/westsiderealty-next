"use client";

import Link from "next/link";
import Image from "next/image";
import {
  type DevelopmentOpportunity,
  OPPORTUNITY_CITY_LABELS,
  formatStage,
  formatReraStatus,
} from "@/lib/opportunities/types";
import { OpportunityLeadForm } from "./OpportunityLeadForm";

const C = {
  bg: "#F7F6F2",
  bgDark: "#0a0a0a",
  bgCard: "#FFFFFF",
  gold: "#c8a96e",
  goldDark: "#a8843e",
  text: "#1A1A1F",
  textMuted: "#6b6b6f",
  border: "rgba(0,0,0,0.08)",
} as const;

function formatCr(value: number | null): string | null {
  if (value == null) return null;
  return `~₹${Math.round(value).toLocaleString("en-IN")} Cr`;
}

function marginText(opp: DevelopmentOpportunity): string | null {
  const lo = opp.indicative_gross_margin_pct_min;
  const hi = opp.indicative_gross_margin_pct_max;
  if (lo == null && hi == null) return null;
  if (lo != null && hi != null) return `~${lo}–${hi}%`;
  return `~${lo ?? hi}%`;
}

export function OpportunityDetailClient({ opportunity: opp }: { opportunity: DevelopmentOpportunity }) {
  const cityLabel = OPPORTUNITY_CITY_LABELS[opp.city_slug] ?? opp.city;
  const margin = marginText(opp);

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <style>{`
        .opd-layout { max-width: 1200px; margin: 0 auto; padding: 32px 16px 80px; display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 32px; }
        .opd-section { background: ${C.bgCard}; border: 1px solid ${C.border}; border-radius: 14px; padding: 24px; }
        .opd-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
        .opd-sticky { position: sticky; top: 84px; }
        @media (max-width: 1023px) {
          .opd-layout { grid-template-columns: 1fr; }
          .opd-sticky { position: static; }
        }
      `}</style>

      {/* Hero */}
      <div
        style={{
          background: C.bgDark,
          padding: "56px 24px 48px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {opp.hero_image_url && (
          <div style={{ position: "absolute", inset: 0, opacity: 0.3 }}>
            <Image
              src={opp.hero_image_url}
              alt={opp.title}
              fill
              style={{ objectFit: "cover" }}
              sizes="100vw"
              priority
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to right, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.6) 100%)",
              }}
            />
          </div>
        )}
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <nav
            style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 16, letterSpacing: "0.04em" }}
          >
            <Link href="/opportunities" style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>
              Opportunities
            </Link>
            <span style={{ margin: "0 8px" }}>›</span>
            <span style={{ color: C.gold }}>{cityLabel}</span>
          </nav>

          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {opp.listing_type && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  padding: "5px 12px",
                  borderRadius: 4,
                  background: "#fff",
                  color: "#0a0a0a",
                  textTransform: "uppercase",
                  border: `2px solid ${C.gold}`,
                }}
              >
                {opp.listing_type}
              </span>
            )}
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                padding: "5px 12px",
                borderRadius: 99,
                background: C.gold,
                color: "#0a0a0a",
                textTransform: "uppercase",
              }}
            >
              {opp.asset_type}
            </span>
            {opp.stage && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  padding: "5px 12px",
                  borderRadius: 99,
                  background: "rgba(255,255,255,0.12)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.2)",
                  textTransform: "uppercase",
                }}
              >
                {formatStage(opp.stage)}
              </span>
            )}
            {opp.rera_status && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  padding: "5px 12px",
                  borderRadius: 99,
                  background: "rgba(255,255,255,0.12)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.2)",
                  textTransform: "uppercase",
                }}
              >
                {formatReraStatus(opp.rera_status)}
              </span>
            )}
          </div>

          <h1
            style={{
              fontSize: "clamp(26px, 4.5vw, 44px)",
              fontWeight: 800,
              color: "#fff",
              margin: "0 0 12px",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              maxWidth: 800,
            }}
          >
            {opp.title}
          </h1>

          {opp.headline && (
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", margin: "0 0 24px", maxWidth: 720, lineHeight: 1.55 }}>
              {opp.headline}
            </p>
          )}

          {/* Key indicators in hero */}
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap", marginTop: 16 }}>
            {opp.asking_price_label && (
              <HeroStat label="Price" value={opp.asking_price_label} />
            )}
            {opp.plot_area_acres != null && (
              <HeroStat label="Plot Size" value={`${opp.plot_area_acres.toFixed(2)} acres`} />
            )}
            {opp.saleable_potential_sqft != null && (
              <HeroStat
                label="Saleable Potential"
                value={`${(opp.saleable_potential_sqft / 100000).toFixed(2)} L sqft`}
              />
            )}
            {opp.indicative_project_cost_cr != null && (
              <HeroStat label="Project Cost" value={formatCr(opp.indicative_project_cost_cr)!} />
            )}
            {margin && <HeroStat label="Indicative Margin" value={margin} />}
          </div>
        </div>
      </div>

      {/* Body layout */}
      <div className="opd-layout">
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          {/* Summary */}
          {opp.summary && (
            <section className="opd-section">
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 12px" }}>
                Opportunity Snapshot
              </h2>
              <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.7, margin: 0 }}>{opp.summary}</p>
            </section>
          )}

          {/* Indicative numbers */}
          {opp.highlights && opp.highlights.length > 0 && (
            <section className="opd-section">
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>
                Indicative Numbers
              </h2>
              <div className="opd-stat-grid">
                {opp.highlights.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "14px 16px",
                      background: "#faf8f3",
                      borderRadius: 10,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 10,
                        color: "#9a9a9e",
                        margin: 0,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        fontWeight: 600,
                      }}
                    >
                      {h.label}
                    </p>
                    <p style={{ fontSize: 15, color: C.text, margin: "4px 0 0", fontWeight: 700 }}>
                      {h.value}
                    </p>
                  </div>
                ))}
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: C.textMuted,
                  marginTop: 16,
                  fontStyle: "italic",
                  borderLeft: `3px solid ${C.gold}`,
                  paddingLeft: 12,
                  lineHeight: 1.55,
                }}
              >
                Numbers above are indicative ranges from a tentative feasibility prepared by qualified
                consultants. Detailed cost build-up, premium calculations, and sensitivity tables are
                shared only after NDA execution.
              </p>
            </section>
          )}

          {/* Why attractive */}
          {opp.why_attractive && opp.why_attractive.length > 0 && (
            <section className="opd-section">
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>
                Why This Deal
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {opp.why_attractive.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr",
                      gap: 14,
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        background: C.gold,
                        color: "#0a0a0a",
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: 13, color: C.textMuted, margin: 0, lineHeight: 1.65 }}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Risks disclosed */}
          {opp.risks_disclosed && opp.risks_disclosed.length > 0 && (
            <section
              className="opd-section"
              style={{ background: "#fffaf3", border: `1px solid #f5e4c5` }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 6px" }}>
                Disclosed Risks &amp; Caveats
              </h2>
              <p style={{ fontSize: 12, color: C.textMuted, margin: "0 0 16px" }}>
                Transparent disclosure of factors a serious investor should diligence further.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {opp.risks_disclosed.map((item, i) => (
                  <div key={i}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: "0 0 3px" }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: 13, color: C.textMuted, margin: 0, lineHeight: 1.6 }}>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Deal structures */}
          {opp.deal_structures && opp.deal_structures.length > 0 && (
            <section className="opd-section">
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 14px" }}>
                Open to Deal Structures
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {opp.deal_structures.map((s) => (
                  <span
                    key={s}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      padding: "8px 16px",
                      borderRadius: 99,
                      background: C.bgDark,
                      color: "#fff",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: 13, color: C.textMuted, margin: "16px 0 0", lineHeight: 1.6 }}>
                Specific commercial terms (revenue share, area share, lock-in, milestones) negotiated
                deal-by-deal. Indicative term sheet shared post NDA.
              </p>
            </section>
          )}

          {/* What's gated */}
          <section
            className="opd-section"
            style={{ background: C.bgDark, color: "#fff", border: `1px solid ${C.gold}40` }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: C.gold,
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              Available Under NDA
            </p>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "8px 0 14px" }}>
              What you get when we share the full deck
            </h2>
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10,
              }}
            >
              {[
                "Exact site location & owner identity",
                "Detailed feasibility report (full cost & revenue build-up)",
                "Title chain & encumbrance summary",
                "Tenant/occupant data & rehab plan",
                "Architect's tentative scheme & FSI workings",
                "Premium & approval timeline projection",
              ].map((line) => (
                <li
                  key={line}
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.85)",
                    paddingLeft: 22,
                    position: "relative",
                    lineHeight: 1.55,
                  }}
                >
                  <span style={{ position: "absolute", left: 0, top: 1, color: C.gold, fontWeight: 700 }}>
                    ✓
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Sidebar — sticky lead form */}
        <aside>
          <div className="opd-sticky">
            <OpportunityLeadForm opportunity={opp} variant="panel" />

            {/* Quick contact */}
            <div
              style={{
                marginTop: 14,
                padding: "16px 18px",
                background: "#fff",
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                textAlign: "center",
              }}
            >
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.55)",
          margin: 0,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 22, color: "#fff", margin: "4px 0 0", fontWeight: 800 }}>{value}</p>
    </div>
  );
}
