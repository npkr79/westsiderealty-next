"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FocusProject {
  id: number;
  project_name: string;
  project_slug: string;
  project_type: string | null;
  current_status: string | null;
  developer_brand: string | null;
  micro_market: string | null;
  city: string | null;
  city_slug: string | null;
  current_price_per_sqft_min: number | null;
  current_price_per_sqft_max: number | null;
  total_units: number | null;
  primary_differentiator: string | null;
  investment_verdict: string | null;
  quality_score: number | null;
  needs_review: boolean;
  hero_image_url: string | null;
  listing_url_slug: string | null; // if set → link to /{city_slug}/projects/{listing_url_slug}
}

// ─── Design tokens (matches HomepageRedesign) ─────────────────────────────────

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
  border: "rgba(0,0,0,0.07)",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatStatus(status: string | null) {
  if (!status) return null;
  if (status === "ready_to_move" || status === "completed") return "Ready to Move";
  if (status === "under_construction") return "Under Construction";
  if (status === "new_launch") return "New Launch";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatType(type: string | null) {
  if (!type) return null;
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function priceLabel(min: number | null, max: number | null): string | null {
  if (!min) return null;
  const fmt = (v: number) => `₹${Math.round(v / 1000)}K`;
  if (max && max !== min) return `${fmt(min)}–${fmt(max)} /sqft`;
  return `${fmt(min)} /sqft`;
}

function statusColor(status: string | null) {
  if (status === "ready_to_move" || status === "completed")
    return { bg: "#dcfce7", color: "#15803d" };
  if (status === "under_construction")
    return { bg: "#dbeafe", color: "#1d4ed8" };
  if (status === "new_launch")
    return { bg: "#fef9c3", color: "#854d0e" };
  return { bg: "#f3f4f6", color: "#4b5563" };
}

function typeColor(type: string | null) {
  if (type === "villa") return { bg: "#fdf4ff", color: "#7e22ce" };
  if (type === "apartment") return { bg: "#eff6ff", color: "#1d4ed8" };
  if (type === "plot") return { bg: "#fff7ed", color: "#9a3412" };
  return { bg: "#f9fafb", color: "#374151" };
}

const CITY_LABELS: Record<string, string> = {
  goa: "Goa",
  hyderabad: "Hyderabad",
};

// ─── Project Card ─────────────────────────────────────────────────────────────

function PortfolioCard({ project }: { project: FocusProject }) {
  // Hybrid routing: existing listing pages → /{city}/projects/{slug}, new → /portfolio/{slug}
  const href = project.listing_url_slug && project.city_slug
    ? `/${project.city_slug}/projects/${project.listing_url_slug}`
    : `/portfolio/${project.project_slug}`;

  const statusStyle = statusColor(project.current_status);
  const typeStyle = typeColor(project.project_type);
  const price = priceLabel(project.current_price_per_sqft_min, project.current_price_per_sqft_max);
  const cityLabel = project.city_slug ? (CITY_LABELS[project.city_slug] ?? project.city ?? "") : (project.city ?? "");

  return (
    <Link
      href={href}
      style={{ textDecoration: "none", display: "block" }}
    >
    <div
      style={{
        background: C.bgCard,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s, transform 0.2s",
        height: "100%",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.10)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.transform = "none";
      }}
    >
      {/* Card image */}
      <div style={{ position: "relative", height: 180, width: "100%", background: project.city_slug === "goa" ? "linear-gradient(135deg, #0c4a6e, #0e7490)" : "linear-gradient(135deg, #1A1A1F, #B08D57)", overflow: "hidden" }}>
        {project.hero_image_url && (
          <Image
            src={project.hero_image_url}
            alt={project.project_name}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 768px) 100vw, 350px"
          />
        )}
        {/* City label overlay */}
        <span style={{
          position: "absolute", bottom: 8, left: 10,
          fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
          padding: "3px 8px", borderRadius: 99,
          background: "rgba(0,0,0,0.55)", color: "#fff",
          textTransform: "uppercase",
        }}>
          {project.city_slug === "goa" ? "Goa" : project.city ?? ""}
        </span>
      </div>

      <div style={{ padding: "20px 20px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Badges row */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {project.project_type && (
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
              padding: "2px 8px", borderRadius: 99,
              background: typeStyle.bg, color: typeStyle.color,
              textTransform: "uppercase",
            }}>
              {formatType(project.project_type)}
            </span>
          )}
          {project.current_status && (
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
              padding: "2px 8px", borderRadius: 99,
              background: statusStyle.bg, color: statusStyle.color,
            }}>
              {formatStatus(project.current_status)}
            </span>
          )}
          {project.needs_review && (
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
              padding: "2px 8px", borderRadius: 99,
              background: "#fef3c7", color: "#92400e",
            }}>
              Verify
            </span>
          )}
        </div>

        {/* Project name */}
        <div>
          <h3 style={{
            fontSize: 16, fontWeight: 700, color: C.text,
            lineHeight: 1.3, margin: 0,
          }}>
            {project.project_name}
          </h3>
          {project.developer_brand && (
            <p style={{ fontSize: 12, color: C.textMuted, margin: "4px 0 0", fontWeight: 500 }}>
              by {project.developer_brand}
            </p>
          )}
        </div>

        {/* Location */}
        {(project.micro_market || cityLabel) && (
          <p style={{ fontSize: 12, color: C.textMuted, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {[project.micro_market, cityLabel].filter(Boolean).join(", ")}
          </p>
        )}

        {/* Primary differentiator */}
        {project.primary_differentiator && (
          <p style={{
            fontSize: 12, color: C.textMuted, margin: 0,
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as any,
            overflow: "hidden",
          }}>
            {project.primary_differentiator}
          </p>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer: price + units */}
        <div style={{
          borderTop: `1px solid ${C.border}`,
          paddingTop: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            {price && (
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>
                {price}
              </p>
            )}
            {project.total_units && (
              <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>
                {project.total_units} units
              </p>
            )}
          </div>

          <span
            style={{
              fontSize: 13, fontWeight: 600,
              color: C.bgCard,
              background: C.bgDark,
              padding: "7px 16px",
              borderRadius: 8,
              whiteSpace: "nowrap",
            }}
          >
            View →
          </span>
        </div>
      </div>
    </div>
    </Link>
  );
}

// ─── Filter pill ──────────────────────────────────────────────────────────────

function FilterPill({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 13, fontWeight: active ? 600 : 400,
        padding: "7px 18px",
        borderRadius: 99,
        border: active ? `1.5px solid ${C.bgDark}` : `1.5px solid ${C.border}`,
        background: active ? C.bgDark : C.bgCard,
        color: active ? C.bgCard : C.text,
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export function PortfolioClient({ projects }: { projects: FocusProject[] }) {
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Derive available cities and types from data
  const cities = useMemo(() => {
    const seen = new Set<string>();
    projects.forEach((p) => { if (p.city_slug) seen.add(p.city_slug); });
    return Array.from(seen);
  }, [projects]);

  const types = useMemo(() => {
    const seen = new Set<string>();
    projects.forEach((p) => { if (p.project_type) seen.add(p.project_type); });
    return Array.from(seen);
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (cityFilter !== "all" && p.city_slug !== cityFilter) return false;
      if (typeFilter !== "all" && p.project_type !== typeFilter) return false;
      if (statusFilter === "ready" && p.current_status !== "ready_to_move" && p.current_status !== "completed") return false;
      if (statusFilter === "construction" && p.current_status !== "under_construction") return false;
      return true;
    });
  }, [projects, cityFilter, typeFilter, statusFilter]);

  // Stats
  const readyCount = projects.filter(
    (p) => p.current_status === "ready_to_move" || p.current_status === "completed"
  ).length;
  const cityCount = cities.length;

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{ background: C.bgDark, padding: "64px 24px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Eyebrow */}
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
            color: C.gold, textTransform: "uppercase", margin: "0 0 12px",
          }}>
            Westside Realty · Active Portfolio
          </p>

          <h1 style={{
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: 800, color: "#FFFFFF",
            margin: "0 0 16px", lineHeight: 1.15,
          }}>
            Projects We Actively Market
          </h1>

          <p style={{
            fontSize: 16, color: "rgba(255,255,255,0.60)",
            maxWidth: 540, margin: "0 0 36px", lineHeight: 1.65,
          }}>
            Developer partnerships, live inventory, and dedicated advisors on each of these projects.
            Enquire for pricing, floor plans, and site visits.
          </p>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {[
              { label: "Active Projects", value: projects.length },
              { label: "Cities", value: cityCount },
              { label: "Ready to Move", value: readyCount },
            ].map((s) => (
              <div key={s.label}>
                <p style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
                  {s.value}
                </p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "2px 0 0", letterSpacing: "0.04em" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div style={{
        background: C.bgCard,
        borderBottom: `1px solid ${C.border}`,
        padding: "16px 24px",
        position: "sticky", top: 64, zIndex: 40,
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
        }}>
          {/* City */}
          <FilterPill label="All Cities" active={cityFilter === "all"} onClick={() => setCityFilter("all")} />
          {cities.map((c) => (
            <FilterPill
              key={c}
              label={CITY_LABELS[c] ?? c}
              active={cityFilter === c}
              onClick={() => setCityFilter(c)}
            />
          ))}

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: C.border, margin: "0 4px" }} />

          {/* Type */}
          <FilterPill label="All Types" active={typeFilter === "all"} onClick={() => setTypeFilter("all")} />
          {types.map((t) => (
            <FilterPill
              key={t}
              label={formatType(t) ?? t}
              active={typeFilter === t}
              onClick={() => setTypeFilter(t)}
            />
          ))}

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: C.border, margin: "0 4px" }} />

          {/* Status */}
          <FilterPill label="All Status" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
          <FilterPill label="Ready to Move" active={statusFilter === "ready"} onClick={() => setStatusFilter("ready")} />
          <FilterPill label="Under Construction" active={statusFilter === "construction"} onClick={() => setStatusFilter("construction")} />
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Result count */}
        <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>
          Showing <strong style={{ color: C.text }}>{filtered.length}</strong> project{filtered.length !== 1 ? "s" : ""}
          {cityFilter !== "all" ? ` in ${CITY_LABELS[cityFilter] ?? cityFilter}` : ""}
          {typeFilter !== "all" ? ` · ${formatType(typeFilter)}s` : ""}
          {statusFilter === "ready" ? " · Ready to Move" : ""}
          {statusFilter === "construction" ? " · Under Construction" : ""}
        </p>

        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px 0",
            color: C.textMuted, fontSize: 15,
          }}>
            No projects match these filters.
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 20,
          }}>
            {filtered.map((project) => (
              <PortfolioCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div style={{
          marginTop: 64,
          padding: "40px 32px",
          background: C.bgDark,
          borderRadius: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 12,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: C.gold, textTransform: "uppercase", margin: 0 }}>
            Not seeing what you need?
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
            Talk to an advisor — we source off-market too
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", margin: 0, maxWidth: 420 }}>
            Our team has access to pre-launch allocations and developer-direct deals not listed publicly.
          </p>
          <a
            href="https://wa.me/919502500068?text=Hi%2C%20I%20saw%20the%20portfolio%20page%20and%20want%20to%20discuss%20options"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: 8,
              display: "inline-block",
              background: "#25D366",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              padding: "10px 28px",
              borderRadius: 10,
              textDecoration: "none",
            }}
          >
            WhatsApp an Advisor
          </a>
        </div>
      </div>
    </div>
  );
}
