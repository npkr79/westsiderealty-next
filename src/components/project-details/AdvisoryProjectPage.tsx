"use client";

import { useState } from "react";
import Link from "next/link";
import { submitLead } from "@/app/actions/submit-lead";
import {
  formatSegment,
  formatStatus,
  formatProjectType,
  formatPriceRange,
  type AdvisoryProject,
} from "@/services/advisoryProjectService";
import { buildMicroMarketUrl } from "@/lib/routes";

// ─── Design System ────────────────────────────────────────────────────────────

const C = {
  bg: "#FAFAF7",
  bgWarm: "#F5F3EE",
  bgCard: "#FFFFFF",
  bgDark: "#1A1A1F",
  gold: "#B08D57",
  goldLight: "#C9A96E",
  accent: "#2D6A4F",
  text: "#1A1A1F",
  textMuted: "#7A7A7E",
  border: "rgba(0,0,0,0.08)",
  borderGold: "rgba(176,141,87,0.3)",
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "gold" | "green" | "dark" | "outline";
}) {
  const styles: Record<string, React.CSSProperties> = {
    default: {
      background: C.bgWarm,
      color: C.textMuted,
      border: `1px solid ${C.border}`,
    },
    gold: {
      background: "rgba(176,141,87,0.12)",
      color: C.gold,
      border: `1px solid ${C.borderGold}`,
    },
    green: {
      background: "rgba(45,106,79,0.10)",
      color: C.accent,
      border: "1px solid rgba(45,106,79,0.25)",
    },
    dark: {
      background: C.bgDark,
      color: "#fff",
      border: "none",
    },
    outline: {
      background: "transparent",
      color: C.textMuted,
      border: `1px solid ${C.border}`,
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        ...styles[variant],
      }}
    >
      {children}
    </span>
  );
}

function Card({
  title,
  icon,
  children,
  highlight,
}: {
  title?: string;
  icon?: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: highlight ? "rgba(176,141,87,0.06)" : C.bgCard,
        border: highlight
          ? `1px solid ${C.borderGold}`
          : `1px solid ${C.border}`,
        borderRadius: 16,
        padding: "20px 22px",
      }}
    >
      {title && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 14,
          }}
        >
          {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: highlight ? C.gold : C.textMuted,
            }}
          >
            {title}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

function StatPill({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        background: C.bgCard,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: C.textMuted,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: C.text,
          lineHeight: 1.2,
        }}
      >
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: 11, color: C.textMuted }}>{sub}</span>
      )}
    </div>
  );
}

// ─── Lead Form ────────────────────────────────────────────────────────────────

function InquiryForm({
  projectName,
  projectSlug,
  citySlug,
  microMarket,
}: {
  projectName: string;
  projectSlug: string;
  citySlug: string;
  microMarket: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Please enter your name and phone number.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ""))) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await submitLead({
        name: name.trim(),
        phone: phone.trim(),
        type: "GOA_PROPERTY",
        source_page: `/${citySlug}/projects/${projectSlug}`,
        details: {
          project_name: projectName,
          micro_market: microMarket,
          city: citySlug,
          page_type: "advisory_project_page",
        },
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          background: "rgba(45,106,79,0.08)",
          border: "1px solid rgba(45,106,79,0.2)",
          borderRadius: 14,
          padding: "20px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: C.accent,
            marginBottom: 4,
          }}
        >
          Request Received
        </div>
        <div style={{ fontSize: 13, color: C.textMuted }}>
          Our Goa advisory team will call you within 2 hours.
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: C.bgWarm,
    fontSize: 14,
    color: C.text,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 10 }}
    >
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle}
        required
      />
      <input
        type="tel"
        placeholder="Mobile number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={inputStyle}
        required
      />
      {error && (
        <p style={{ fontSize: 12, color: "#c0392b", margin: 0 }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={submitting}
        style={{
          background: C.gold,
          color: "#fff",
          border: "none",
          borderRadius: 10,
          padding: "12px 20px",
          fontSize: 14,
          fontWeight: 700,
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.7 : 1,
          transition: "opacity 0.2s",
          letterSpacing: "0.03em",
        }}
      >
        {submitting ? "Submitting…" : "Request Advisory Call"}
      </button>
      <p
        style={{
          fontSize: 11,
          color: C.textMuted,
          margin: 0,
          textAlign: "center",
        }}
      >
        No spam. Our Goa specialist will call only once.
      </p>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface AdvisoryProjectPageProps {
  project: AdvisoryProject;
  relatedProjects: AdvisoryProject[];
  citySlug: string;
  projectSlug: string;
}

export default function AdvisoryProjectPage({
  project,
  relatedProjects,
  citySlug,
  projectSlug,
}: AdvisoryProjectPageProps) {
  const priceRange = formatPriceRange(
    project.current_price_per_sqft_min,
    project.current_price_per_sqft_max
  );
  const rentalYield = project.rental_yield_pct
    ? `${parseFloat(project.rental_yield_pct).toFixed(1)}%`
    : null;
  const cityName =
    project.city
      ? project.city.charAt(0).toUpperCase() + project.city.slice(1)
      : "Goa";
  const statusLabel = formatStatus(project.current_status);
  const statusVariant: "green" | "gold" | "default" =
    project.current_status === "ready_to_move" ||
    project.current_status === "completed"
      ? "green"
      : project.current_status === "new_launch" ||
        project.current_status === "pre_launch"
      ? "gold"
      : "default";

  const hasPrice = !!(
    project.current_price_per_sqft_min || project.current_price_per_sqft_max
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "inherit" }}>
      {/* ── Breadcrumb ── */}
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "14px 20px 0",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "Home", href: "/" },
          { label: cityName, href: `/${citySlug}` },
          project.micro_market && project.micro_market_slug
            ? {
                label: project.micro_market,
                href: buildMicroMarketUrl(citySlug, project.micro_market_slug),
              }
            : null,
        ]
          .filter(Boolean)
          .map((item, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {i > 0 && (
                <span style={{ fontSize: 12, color: C.textMuted }}>›</span>
              )}
              <Link
                href={(item as { label: string; href: string }).href}
                style={{
                  fontSize: 12,
                  color: C.textMuted,
                  textDecoration: "none",
                }}
              >
                {(item as { label: string; href: string }).label}
              </Link>
            </span>
          ))}
        <span style={{ fontSize: 12, color: C.textMuted }}>›</span>
        <span
          style={{
            fontSize: 12,
            color: C.text,
            fontWeight: 500,
            maxWidth: 220,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {project.project_name}
        </span>
      </div>

      {/* ── Hero ── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px 20px 20px" }}>
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}
        >
          {project.project_segment && (
            <Badge variant="gold">{formatSegment(project.project_segment)}</Badge>
          )}
          {project.project_type && (
            <Badge variant="outline">{formatProjectType(project.project_type)}</Badge>
          )}
          <Badge variant={statusVariant}>{statusLabel}</Badge>
          {project.rera_verified && (
            <Badge variant="green">✓ RERA Verified</Badge>
          )}
        </div>

        <h1
          style={{
            fontSize: "clamp(22px, 4vw, 32px)",
            fontWeight: 800,
            color: C.text,
            margin: "0 0 6px",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
          }}
        >
          {project.project_name}
        </h1>

        <p
          style={{
            fontSize: 15,
            color: C.textMuted,
            margin: "0 0 20px",
            fontWeight: 400,
          }}
        >
          {[project.developer_brand, project.micro_market, cityName]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {/* Stats strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 10,
          }}
        >
          {hasPrice ? (
            <StatPill
              label="Price"
              value={priceRange.replace("/sqft", "")}
              sub="per sqft"
            />
          ) : (
            <StatPill label="Price" value="On Request" sub="Contact for pricing" />
          )}
          {rentalYield && (
            <StatPill label="Rental Yield" value={rentalYield} sub="STR / gross est." />
          )}
          {project.total_units != null && (
            <StatPill
              label="Total Units"
              value={String(project.total_units)}
              sub={
                project.project_type
                  ? formatProjectType(project.project_type) + "s"
                  : "units"
              }
            />
          )}
          {project.land_area_acres && (
            <StatPill
              label="Land Area"
              value={`${project.land_area_acres} ac`}
              sub="total site"
            />
          )}
          {project.total_appreciation_pct && (
            <StatPill
              label="Appreciation"
              value={`${parseFloat(project.total_appreciation_pct).toFixed(0)}%`}
              sub="since launch"
            />
          )}
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div
        className="adv-layout"
        style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px 60px" }}
      >
        {/* Main column */}
        <div className="adv-main">
          {project.investment_verdict && (
            <Card title="Investment Verdict" icon="📊" highlight>
              <p
                style={{
                  fontSize: 15,
                  color: C.text,
                  lineHeight: 1.75,
                  margin: 0,
                }}
              >
                {project.investment_verdict}
              </p>
            </Card>
          )}

          {project.primary_differentiator && (
            <Card title="What Makes This Project Unique" icon="✦">
              <p
                style={{
                  fontSize: 14,
                  color: C.text,
                  lineHeight: 1.75,
                  margin: 0,
                }}
              >
                {project.primary_differentiator}
              </p>
            </Card>
          )}

          {project.target_buyer_segment && (
            <Card title="Ideal For" icon="👤">
              <p
                style={{
                  fontSize: 14,
                  color: C.text,
                  lineHeight: 1.75,
                  margin: 0,
                }}
              >
                {project.target_buyer_segment}
              </p>
            </Card>
          )}

          {/* RERA */}
          <Card title="RERA & Legal Details" icon="🏛️">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                {
                  label: "RERA ID",
                  value: project.rera_id || "Not listed",
                  mono: true,
                },
                {
                  label: "Approval Authority",
                  value: project.approval_authority || "Goa RERA",
                  mono: false,
                },
                {
                  label: "Verification",
                  value: project.rera_verified
                    ? "✓ RERA Verified"
                    : "Pending verification",
                  mono: false,
                  highlight: project.rera_verified,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: C.bgWarm,
                    borderRadius: 10,
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: C.textMuted,
                      flexShrink: 0,
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: (row as any).highlight ? C.accent : C.text,
                      fontFamily: row.mono ? "monospace" : "inherit",
                      textAlign: "right",
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            {project.rera_id && (
              <p
                style={{ fontSize: 11, color: C.textMuted, margin: "12px 0 0" }}
              >
                Verify independently at{" "}
                <a
                  href="https://rera.goa.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: C.gold, textDecoration: "none" }}
                >
                  rera.goa.gov.in
                </a>
              </p>
            )}
          </Card>

          {/* Market context */}
          {project.micro_market && project.micro_market_slug && (
            <Card title="Market Intelligence" icon="📍">
              <p
                style={{
                  fontSize: 14,
                  color: C.text,
                  lineHeight: 1.75,
                  margin: "0 0 14px",
                }}
              >
                {project.project_name} is located in{" "}
                <strong>{project.micro_market}</strong>, one of Goa&apos;s
                most sought-after micro-markets. Explore price trends,
                appreciation data, and investment outlook for this corridor.
              </p>
              <Link
                href={buildMicroMarketUrl(citySlug, project.micro_market_slug)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.gold,
                  textDecoration: "none",
                  background: "rgba(176,141,87,0.08)",
                  border: `1px solid ${C.borderGold}`,
                  borderRadius: 8,
                  padding: "8px 14px",
                }}
              >
                View {project.micro_market} Market Intelligence →
              </Link>
            </Card>
          )}

          {/* Related projects */}
          {relatedProjects.length > 0 && (
            <Card
              title={`Other Projects in ${project.micro_market || "This Market"}`}
              icon="🏘️"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {relatedProjects.map((rp) => (
                  <Link
                    key={rp.project_slug}
                    href={`/${citySlug}/projects/${rp.project_slug}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      background: C.bgWarm,
                      borderRadius: 10,
                      textDecoration: "none",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: C.text,
                          marginBottom: 2,
                        }}
                      >
                        {rp.project_name}
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>
                        {[
                          rp.developer_brand,
                          formatProjectType(rp.project_type),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {rp.rental_yield_pct && (
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: C.accent,
                          }}
                        >
                          {parseFloat(rp.rental_yield_pct).toFixed(1)}% yield
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: C.gold, marginTop: 2 }}>
                        View →
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="adv-sidebar">
          <Card title="Get Expert Advisory" icon="📞">
            <p
              style={{
                fontSize: 13,
                color: C.textMuted,
                margin: "0 0 14px",
                lineHeight: 1.65,
              }}
            >
              Our Goa specialists can share current pricing, availability and
              investment analysis for{" "}
              <strong style={{ color: C.text }}>{project.project_name}</strong>.
            </p>
            <InquiryForm
              projectName={project.project_name}
              projectSlug={projectSlug}
              citySlug={citySlug}
              microMarket={project.micro_market || ""}
            />
          </Card>

          <div
            style={{
              background: C.bgDark,
              borderRadius: 16,
              padding: "20px 22px",
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
              <span style={{ fontSize: 20 }}>🤖</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                AI Advisor
              </span>
            </div>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.65,
                margin: "0 0 14px",
              }}
            >
              Ask our AI about {project.project_name} — rental yields, market
              comparisons, investment outlook and more.
            </p>
            <button
              onClick={() => {
                const el = document.getElementById("westside-advisor-trigger");
                if (el) el.click();
              }}
              style={{
                background: C.gold,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "11px 18px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.03em",
                width: "100%",
              }}
            >
              Ask AI Advisor →
            </button>
          </div>

          <div
            style={{
              padding: "14px 16px",
              background: "rgba(176,141,87,0.05)",
              border: `1px solid ${C.borderGold}`,
              borderRadius: 12,
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: C.textMuted,
                margin: 0,
                lineHeight: 1.65,
              }}
            >
              <span style={{ color: C.gold, fontWeight: 600 }}>
                Advisory Intelligence
              </span>{" "}
              — Data sourced from Goa RERA filings, developer brochures and
              market research. Prices are indicative. Always verify directly
              with the developer.
            </p>
          </div>
        </div>
      </div>

      {/* Responsive grid CSS */}
      <style>{`
        .adv-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .adv-main {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .adv-sidebar {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        @media (min-width: 768px) {
          .adv-layout {
            grid-template-columns: 1fr 340px;
            align-items: start;
          }
        }
      `}</style>
    </div>
  );
}
