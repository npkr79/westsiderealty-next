"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { submitLead } from "@/app/actions/submit-lead";
import type { FocusProjectDetail } from "@/app/portfolio/[slug]/page";

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg: "#FAFAF7",
  bgWarm: "#F5F3EE",
  bgCard: "#FFFFFF",
  bgDark: "#1A1A1F",
  gold: "#B08D57",
  goldLight: "#C9A96E",
  text: "#1A1A1F",
  textMuted: "#6B7280",
  border: "rgba(0,0,0,0.08)",
  green: "#15803d",
  greenBg: "#dcfce7",
  red: "#b91c1c",
  redBg: "#fef2f2",
  blue: "#1d4ed8",
  blueBg: "#dbeafe",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatStatus(s: string | null) {
  if (!s) return null;
  if (s === "ready_to_move" || s === "completed") return "Ready to Move";
  if (s === "under_construction") return "Under Construction";
  if (s === "new_launch") return "New Launch";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusStyle(s: string | null) {
  if (s === "ready_to_move" || s === "completed") return { bg: C.greenBg, color: C.green };
  if (s === "under_construction") return { bg: C.blueBg, color: C.blue };
  return { bg: "#f3f4f6", color: "#4b5563" };
}

function priceRange(min: number | null, max: number | null, projectType?: string | null, priceMinCr?: number | null) {
  if (!min) return null;
  // Plot projects: show total starting price, not per-sqft
  if (projectType === "plot" && priceMinCr) {
    const lakhs = parseFloat((priceMinCr * 100).toFixed(1));
    return `From ₹${lakhs} Lakh`;
  }
  const fmt = (v: number) => `₹${(v / 1000).toFixed(0)}K`;
  return max && max !== min ? `${fmt(min)} – ${fmt(max)} /sqft` : `${fmt(min)} /sqft`;
}

function plotSizeLabel(unitConfigs: string[] | null): string | null {
  if (!unitConfigs?.length) return null;
  const match = unitConfigs[0].match(/(\d+)[–-](\d+)\s*sqyd/i);
  if (match) return `${match[1]}–${match[2]} sq yd`;
  return null;
}

function formatDate(d: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function cityLabel(project: FocusProjectDetail): string {
  if (project.city_slug === "goa") return "Goa";
  if (project.city_slug === "hyderabad") return "Hyderabad";
  return project.city ?? "";
}

// ─── Lead Form ────────────────────────────────────────────────────────────────

function LeadForm({ project }: { project: FocusProjectDetail }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [goal, setGoal] = useState("buy");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const goals = [
    { value: "buy", label: "Looking to buy" },
    { value: "invest", label: "Checking investment potential" },
    { value: "compare", label: "Comparing options" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const leadType = project.city_slug === "goa" ? "GOA_PROPERTY" : "PROJECT_INTEREST";
      const result = await submitLead({
        name,
        phone,
        type: leadType,
        source_page: typeof window !== "undefined" ? window.location.href : `/portfolio/${project.project_slug}`,
        property_type: project.project_type ?? null,
        attribution_metadata: {
          project_name: project.project_name,
          project_slug: project.project_slug,
          micro_market: project.micro_market,
          city: project.city_slug,
          is_focus_project: true,
          source_type: "website",
        },
        details: {
          project_name: project.project_name,
          developer_name: project.developer_brand,
          goal,
          source_type: "website",
          source_name: "focus-project-advisor",
        },
      });
      if (!result.success) {
        setError(result.error || "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "28px 16px" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: C.greenBg, display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 14px",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>
          We'll be in touch shortly
        </h3>
        <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.55 }}>
          Our advisor will reach out to you about {project.project_name}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        required value={name} onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        style={{
          width: "100%", padding: "11px 14px", borderRadius: 10,
          border: `1.5px solid ${C.border}`, fontSize: 14, outline: "none",
          background: C.bgWarm, boxSizing: "border-box",
        }}
      />
      <input
        required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone number"
        style={{
          width: "100%", padding: "11px 14px", borderRadius: 10,
          border: `1.5px solid ${C.border}`, fontSize: 14, outline: "none",
          background: C.bgWarm, boxSizing: "border-box",
        }}
      />
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
          What are you looking to do?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {goals.map((g) => (
            <label key={g.value} style={{
              display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
              padding: "8px 10px", borderRadius: 8,
              background: goal === g.value ? "#f0f4ff" : "transparent",
            }}>
              <input
                type="radio" name="goal" value={g.value}
                checked={goal === g.value}
                onChange={() => setGoal(g.value)}
                style={{ accentColor: "#4f46e5" }}
              />
              <span style={{ fontSize: 13, color: C.text }}>{g.label}</span>
            </label>
          ))}
        </div>
      </div>
      {error && <p style={{ fontSize: 12, color: C.red, margin: 0 }}>{error}</p>}
      <button
        type="submit" disabled={submitting}
        style={{
          width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
          background: C.bgDark, color: "#fff", fontSize: 14, fontWeight: 700,
          cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? "Submitting…" : "Request Details"}
      </button>
      <p style={{ fontSize: 11, color: C.textMuted, textAlign: "center", margin: 0 }}>
        Free · No obligation · RERA experts
      </p>
    </form>
  );
}

// ─── Small UI primitives ──────────────────────────────────────────────────────

function Chip({ label, bg = C.bgWarm, color = C.text }: { label: string; bg?: string; color?: string }) {
  return (
    <span style={{
      display: "inline-block", fontSize: 12, fontWeight: 500,
      padding: "5px 12px", borderRadius: 99, background: bg, color,
    }}>
      {label}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 17, fontWeight: 700, color: C.text,
      margin: "0 0 14px", paddingBottom: 12,
      borderBottom: `2px solid ${C.bgWarm}`,
    }}>
      {children}
    </h2>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "12px 14px",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{value}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PortfolioDetailClient({ project }: { project: FocusProjectDetail }) {
  const st = statusStyle(project.current_status);
  const price = priceRange(project.current_price_per_sqft_min, project.current_price_per_sqft_max, project.project_type, project.price_min_cr);
  const plotSize = plotSizeLabel(project.unit_configs);
  const city = cityLabel(project);

  const faqs: Array<{ q: string; a: string }> = [];
  if (price) faqs.push({ q: `What is the price of ${project.project_name}?`, a: `Current pricing is ${price}. Contact our advisor for exact unit-level pricing and available configurations.` });
  if (project.possession_date) faqs.push({ q: "When is the possession date?", a: `The expected possession date is ${formatDate(project.possession_date)}. Refer to RERA for legally binding timelines.` });
  if (project.rera_id) faqs.push({ q: "Is this project RERA registered?", a: `Yes, RERA ID: ${project.rera_id}. Verify at the RERA portal.` });
  if (project.total_units) faqs.push({ q: "How many units are there?", a: `${project.project_name} has a total of ${project.total_units} units.` });
  if (project.developer_brand) faqs.push({ q: `Who is the developer of ${project.project_name}?`, a: `${project.project_name} is developed by ${project.developer_brand}${project.developer_years_in_business ? `, with over ${project.developer_years_in_business} years of experience` : ""}.` });
  if (project.investment_verdict) faqs.push({ q: "Is this a good investment?", a: project.investment_verdict });
  faqs.push({ q: "How can I schedule a site visit?", a: "Submit your details using the form on this page. Our advisor will get in touch and arrange a site visit at your convenience." });

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <style>{`
        .pd-body { max-width: 1100px; margin: 0 auto; padding: 36px 16px 100px; display: grid; grid-template-columns: 1fr 320px; gap: 40px; align-items: start; }
        .pd-sidebar { position: sticky; top: 88px; }
        .pd-sidebar-mobile-cta { display: none; }
        .pd-bull-bear { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .pd-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
        .pd-dev-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; }
        @media (max-width: 767px) {
          .pd-body { grid-template-columns: 1fr; padding: 24px 16px 120px; gap: 0; }
          .pd-sidebar { display: none; }
          .pd-sidebar-mobile-cta { display: block; position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; background: #fff; border-top: 1px solid rgba(0,0,0,0.08); padding: 12px 16px; box-shadow: 0 -4px 24px rgba(0,0,0,0.10); }
          .pd-bull-bear { grid-template-columns: 1fr; }
          .pd-stats { grid-template-columns: repeat(2, 1fr); }
          .pd-dev-stats { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ position: "relative", height: "clamp(220px, 45vw, 480px)", background: C.bgDark, overflow: "hidden" }}>
        {project.hero_image_url ? (
          <Image
            src={project.hero_image_url}
            alt={project.project_name}
            fill
            style={{ objectFit: "cover", opacity: 0.75 }}
            priority
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg, #0c4a6e 0%, #0e7490 50%, #164e63 100%)",
          }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.80) 0%, transparent 55%)" }} />

        {/* Breadcrumb */}
        <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 6, alignItems: "center" }}>
          <Link href="/portfolio" style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>← Portfolio</Link>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>/</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{project.project_name}</span>
        </div>

        {/* Title */}
        <div style={{ position: "absolute", bottom: 20, left: 16, right: 16 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            {project.project_type && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "rgba(255,255,255,0.15)", color: "#fff", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {project.project_type.charAt(0).toUpperCase() + project.project_type.slice(1)}
              </span>
            )}
            {project.current_status && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: st.bg, color: st.color }}>
                {formatStatus(project.current_status)}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: "clamp(22px, 5vw, 40px)", fontWeight: 800, color: "#fff", margin: "0 0 6px", lineHeight: 1.15 }}>
            {project.project_name}
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", margin: 0 }}>
            {[project.developer_brand, project.micro_market, city].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {/* ── Facts strip ── */}
      <div style={{ background: C.bgDark, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px", display: "flex", overflowX: "auto", gap: 0, scrollbarWidth: "none" }}>
          {[
            price ? { label: "Price", value: price } : null,
            plotSize ? { label: "Plot Sizes", value: plotSize } : (project.total_units ? { label: "Total Units", value: `${project.total_units} units` } : null),
            project.land_area_acres ? { label: "Land Area", value: `${project.land_area_acres} acres` } : null,
            project.possession_date ? { label: "Possession", value: formatDate(project.possession_date) ?? "" } : null,
            project.rera_id ? { label: "RERA", value: project.rera_id } : null,
          ].filter(Boolean).map((item, i) => (
            <div key={i} style={{ padding: "12px 18px", borderRight: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap", flexShrink: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>{item!.label}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0 }}>{item!.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body grid ── */}
      <div className="pd-body">

        {/* ── Left column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>

          {/* About */}
          {project.primary_differentiator && (
            <section>
              <SectionTitle>About This Project</SectionTitle>
              <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
                {project.primary_differentiator}
              </p>
            </section>
          )}

          {/* Overview stats */}
          <section>
            <SectionTitle>Project Overview</SectionTitle>
            <div className="pd-stats">
              {project.developer_brand && <StatBox label="Developer" value={project.developer_brand} />}
              {project.project_type && <StatBox label="Type" value={project.project_type.charAt(0).toUpperCase() + project.project_type.slice(1)} />}
              {project.project_segment && <StatBox label="Segment" value={project.project_segment.charAt(0).toUpperCase() + project.project_segment.slice(1)} />}
              {formatStatus(project.current_status) && <StatBox label="Status" value={formatStatus(project.current_status)!} />}
              {project.total_units && <StatBox label="Total Units" value={`${project.total_units}`} />}
              {project.land_area_acres && <StatBox label="Land Area" value={`${project.land_area_acres} acres`} />}
              {project.possession_date && <StatBox label="Possession" value={formatDate(project.possession_date) ?? ""} />}
              {price && <StatBox label="Indicative Price" value={price} />}
              {project.total_floors_max && <StatBox label="Max Floors" value={`G+${project.total_floors_max}`} />}
              {project.launch_price_per_sqft && project.current_price_per_sqft_min && project.launch_price_per_sqft < project.current_price_per_sqft_min && (
                <StatBox
                  label="Since Launch"
                  value={`+${Math.round(((project.current_price_per_sqft_min - project.launch_price_per_sqft) / project.launch_price_per_sqft) * 100)}%`}
                />
              )}
              {project.approval_authority && <StatBox label="Approved By" value={project.approval_authority} />}
              {plotSize && <StatBox label="Plot Sizes" value={plotSize} />}
            </div>

            {/* RERA verification badge */}
            {(project.rera_id || project.rera_verified) && (
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 16px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>
                  RERA Verified {project.rera_id ? `· ${project.rera_id}` : ""}
                </span>
              </div>
            )}

            {/* Target buyer segment */}
            {project.target_buyer_segment && (
              <div style={{ marginTop: 14, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>
                  Best Suited For
                </p>
                <p style={{ fontSize: 14, color: C.text, margin: 0, lineHeight: 1.55 }}>{project.target_buyer_segment}</p>
              </div>
            )}
          </section>

          {/* Location */}
          <section>
            <SectionTitle>Location & Connectivity</SectionTitle>
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: "0 0 4px" }}>
                      {[project.locality, project.micro_market, city].filter(Boolean).join(", ")}
                    </p>
                    {project.sub_zone && (
                      <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>{project.sub_zone}</p>
                    )}
                  </div>
                </div>
              </div>

              {(project.dist_airport_km || project.dist_financial_district_km) && (
                <div style={{ padding: "14px 20px", display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {project.dist_airport_km && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.bgWarm, padding: "8px 14px", borderRadius: 99 }}>
                      <span style={{ fontSize: 13, color: C.text }}><strong>{project.dist_airport_km} km</strong> to Airport</span>
                    </div>
                  )}
                  {project.dist_financial_district_km && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.bgWarm, padding: "8px 14px", borderRadius: 99 }}>
                      <span style={{ fontSize: 13, color: C.text }}><strong>{project.dist_financial_district_km} km</strong> to Business Hub</span>
                    </div>
                  )}
                </div>
              )}

              {project.infra_upcoming && Array.isArray(project.infra_upcoming) && project.infra_upcoming.length > 0 && (
                <div style={{ padding: "0 20px 18px" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
                    Upcoming Infrastructure
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {project.infra_upcoming.map((item: string, i: number) => (
                      <Chip key={i} label={`✦ ${item}`} bg="#f0f9ff" color="#0369a1" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {project.latitude && project.longitude && (
              <div style={{ marginTop: 14, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}` }}>
                <iframe
                  src={`https://www.google.com/maps?q=${project.latitude},${project.longitude}&z=15&output=embed`}
                  width="100%" height="260"
                  style={{ border: 0, display: "block" }}
                  allowFullScreen loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </section>

          {/* Investment view */}
          {(project.investment_verdict || project.verdict_bull_case || project.verdict_bear_case) && (
            <section>
              <SectionTitle>Investment View</SectionTitle>
              {project.investment_verdict && (
                <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Westside View</p>
                  <p style={{ fontSize: 15, color: C.text, lineHeight: 1.7, margin: 0 }}>{project.investment_verdict}</p>
                </div>
              )}
              <div className="pd-bull-bear">
                {project.verdict_bull_case && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "16px 18px" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>↑ Bull Case</p>
                    <p style={{ fontSize: 13, color: "#166534", lineHeight: 1.6, margin: 0 }}>{project.verdict_bull_case}</p>
                  </div>
                )}
                {project.verdict_bear_case && (
                  <div style={{ background: C.redBg, border: "1px solid #fecaca", borderRadius: 12, padding: "16px 18px" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>↓ Bear Case</p>
                    <p style={{ fontSize: 13, color: "#991b1b", lineHeight: 1.6, margin: 0 }}>{project.verdict_bear_case}</p>
                  </div>
                )}
              </div>
              {project.verdict_risk_factors && Array.isArray(project.verdict_risk_factors) && project.verdict_risk_factors.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Risk Factors</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {project.verdict_risk_factors.map((r: string, i: number) => (
                      <Chip key={i} label={`⚠ ${r}`} bg="#fff7ed" color="#9a3412" />
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Returns & Appreciation */}
          {(project.total_appreciation_pct || project.rental_yield_pct || project.launch_price_per_sqft) && (
            <section>
              <SectionTitle>Returns & Appreciation</SectionTitle>
              <div className="pd-stats">
                {project.total_appreciation_pct && (
                  <StatBox label="Total Appreciation" value={`${project.total_appreciation_pct}%`} />
                )}
                {project.rental_yield_pct && (
                  <StatBox label="Rental Yield" value={`${project.rental_yield_pct}% p.a.`} />
                )}
                {project.launch_price_per_sqft && (
                  <StatBox label="Launch Price" value={`₹${Math.round(project.launch_price_per_sqft / 1000)}K /sqft`} />
                )}
                {project.current_price_per_sqft_min && (
                  <StatBox label="Current Price" value={`₹${Math.round(project.current_price_per_sqft_min / 1000)}K /sqft`} />
                )}
              </div>
            </section>
          )}

          {/* Amenities */}
          {(project.pool_details || project.clubhouse_sqft || (project.special_amenities?.length ?? 0) > 0 || (project.sports_amenities?.length ?? 0) > 0) && (
            <section>
              <SectionTitle>Amenities</SectionTitle>
              <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {project.pool_details && <Chip label={`🏊 ${project.pool_details}`} />}
                  {project.clubhouse_sqft && <Chip label={`🏢 ${project.clubhouse_sqft.toLocaleString()} sqft Clubhouse`} />}
                  {project.sports_amenities?.map((a: string, i: number) => <Chip key={`sport-${i}`} label={a} />)}
                  {project.special_amenities?.map((a: string, i: number) => <Chip key={`spec-${i}`} label={a} />)}
                </div>
              </div>
            </section>
          )}

          {/* Developer */}
          {(project.developer_brand || project.developer_years_in_business || project.developer_total_projects) && (
            <section>
              <SectionTitle>Developer Track Record</SectionTitle>
              <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: "0 0 14px" }}>{project.developer_brand}</p>
                <div className="pd-dev-stats" style={{ marginBottom: project.developer_reputation_notes ? 14 : 0 }}>
                  {project.developer_years_in_business && (
                    <StatBox label="Years Active" value={`${project.developer_years_in_business}+ yrs`} />
                  )}
                  {project.developer_total_projects && (
                    <StatBox label="Projects Delivered" value={`${project.developer_total_projects}`} />
                  )}
                </div>
                {project.developer_reputation_notes && (
                  <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.65, margin: 0 }}>{project.developer_reputation_notes}</p>
                )}
                {project.official_website && (
                  <a href={project.official_website} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-block", marginTop: 12, fontSize: 13, color: C.gold, textDecoration: "none", fontWeight: 600 }}>
                    Visit Official Website →
                  </a>
                )}
              </div>
            </section>
          )}

          {/* FAQs */}
          {faqs.length > 0 && (
            <section>
              <SectionTitle>Frequently Asked Questions</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
              </div>
            </section>
          )}

          {/* RERA */}
          {project.rera_id && (
            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: 12, padding: "14px 18px",
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p style={{ fontSize: 13, color: "#166534", margin: 0, lineHeight: 1.55 }}>
                <strong>RERA Registered</strong> · ID: {project.rera_id} · Verify at the RERA portal for legally binding details.
              </p>
            </div>
          )}
        </div>

        {/* ── Right column — sticky sidebar (desktop) ── */}
        <div className="pd-sidebar">
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 18, overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          }}>
            <div style={{ height: 5, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})` }} />
            <div style={{ padding: "20px 20px 22px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>
                Westside Realty · {city}
              </p>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: "0 0 6px", lineHeight: 1.2 }}>
                Get Pricing & Details
              </h2>
              <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 18px", lineHeight: 1.55 }}>
                Direct developer access — floor plans, site visit, and current availability.
              </p>
              {price && (
                <div style={{ background: C.bgWarm, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                  <p style={{ fontSize: 10, color: C.textMuted, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Indicative Pricing</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{price}</p>
                </div>
              )}
              <LeadForm project={project} />
            </div>
          </div>
          <Link href="/portfolio" style={{ display: "block", textAlign: "center", marginTop: 14, fontSize: 13, color: C.textMuted, textDecoration: "none" }}>
            ← Back to Portfolio
          </Link>
        </div>
      </div>

      {/* ── Mobile sticky CTA bar ── */}
      <div className="pd-sidebar-mobile-cta">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {project.project_name}
            </p>
            {price && <p style={{ fontSize: 12, color: C.textMuted, margin: "1px 0 0" }}>{price}</p>}
          </div>
          <a
            href={`https://wa.me/919502500068?text=Hi%2C%20I%27m%20interested%20in%20${encodeURIComponent(project.project_name)}%20and%20want%20to%20know%20more`}
            target="_blank" rel="noopener noreferrer"
            style={{
              background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 13,
              padding: "11px 18px", borderRadius: 10, textDecoration: "none", whiteSpace: "nowrap",
            }}
          >
            WhatsApp
          </a>
          <MobileLeadButton project={project} />
        </div>
      </div>
    </div>
  );
}

// ─── Mobile lead button (opens inline form) ───────────────────────────────────

function MobileLeadButton({ project }: { project: FocusProjectDetail }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: C.bgDark, color: "#fff", fontWeight: 700, fontSize: 13,
          padding: "11px 16px", borderRadius: 10, border: "none", cursor: "pointer", whiteSpace: "nowrap",
        }}
      >
        Enquire
      </button>

      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "flex-end",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div style={{
            background: C.bgCard, borderRadius: "20px 20px 0 0",
            width: "100%", padding: "24px 20px 32px",
            maxHeight: "90vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0 }}>Get Details</h3>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.textMuted, padding: 4 }}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 16px", lineHeight: 1.5 }}>
              Direct developer access — pricing, floor plans, and site visit for {project.project_name}.
            </p>
            <LeadForm project={project} />
          </div>
        </div>
      )}
    </>
  );
}

// ─── FAQ accordion ────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: C.bgCard, marginBottom: 2 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "15px 18px",
          background: "none", border: "none",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          cursor: "pointer", gap: 12, textAlign: "left",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{q}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2.5"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: "0 18px 14px" }}>
          <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.65, margin: 0 }}>{a}</p>
        </div>
      )}
    </div>
  );
}
