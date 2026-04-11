"use client";

import { useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  micro_market_slug: string | null;
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
  listing_url_slug: string | null;
  // Enriched from projects table — used to compute total flat price
  min_area_sqft?: number | null;
  max_area_sqft?: number | null;
  min_flat_price?: number | null;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

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
  if (type === "mixed_use") return "Mixed Use";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// Format a total rupee amount as "₹X.XX Cr" or "₹XX L"
function formatTotalPrice(amount: number): string {
  if (amount >= 10_000_000) {
    return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  }
  if (amount >= 100_000) {
    return `₹${Math.round(amount / 100_000)} L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

// Returns the price label for a card.
// Prefers "From ₹X Cr" total flat price (needs min_flat_price).
// Falls back to per-sqft if area data is unavailable.
function priceLabel(project: FocusProject): string | null {
  if (project.min_flat_price) {
    return `From ${formatTotalPrice(project.min_flat_price)}`;
  }
  const min = project.current_price_per_sqft_min;
  const max = project.current_price_per_sqft_max;
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
  const href = project.listing_url_slug && project.city_slug
    ? `/${project.city_slug}/projects/${project.listing_url_slug}`
    : `/portfolio/${project.project_slug}`;

  const statusStyle = statusColor(project.current_status);
  const typeStyle = typeColor(project.project_type);
  const price = priceLabel(project);
  const cityLabel = project.city_slug ? (CITY_LABELS[project.city_slug] ?? project.city ?? "") : (project.city ?? "");

  return (
    <Link href={href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
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
        <div style={{
          position: "relative", height: 190, width: "100%",
          background: project.city_slug === "goa"
            ? "linear-gradient(135deg, #0c4a6e, #0e7490)"
            : "linear-gradient(135deg, #1A1A1F, #B08D57)",
          overflow: "hidden",
        }}>
          {project.hero_image_url && (
            <Image
              src={project.hero_image_url}
              alt={project.project_name}
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 768px) 100vw, 350px"
            />
          )}
          <span style={{
            position: "absolute", bottom: 8, left: 10,
            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            padding: "3px 8px", borderRadius: 99,
            background: "rgba(0,0,0,0.55)", color: "#fff",
            textTransform: "uppercase",
          }}>
            {cityLabel}
          </span>
        </div>

        <div style={{ padding: "18px 18px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Badges */}
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
          </div>

          {/* Name */}
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.3, margin: 0 }}>
              {project.project_name}
            </h3>
            {project.developer_brand && (
              <p style={{ fontSize: 12, color: C.textMuted, margin: "3px 0 0", fontWeight: 500 }}>
                by {project.developer_brand}
              </p>
            )}
          </div>

          {/* Location */}
          {(project.micro_market || cityLabel) && (
            <p style={{ fontSize: 12, color: C.textMuted, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {[project.micro_market, cityLabel].filter(Boolean).join(", ")}
            </p>
          )}

          {/* Differentiator */}
          {project.primary_differentiator && (
            <p style={{
              fontSize: 12, color: C.textMuted, margin: 0, lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as any,
              overflow: "hidden",
            }}>
              {project.primary_differentiator}
            </p>
          )}

          <div style={{ flex: 1 }} />

          {/* Footer */}
          <div style={{
            borderTop: `1px solid ${C.border}`,
            paddingTop: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              {price && <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>{price}</p>}
              {project.total_units && (
                <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>{project.total_units} units</p>
              )}
            </div>
            <span style={{
              fontSize: 12, fontWeight: 600, color: "#fff",
              background: C.bgDark, padding: "7px 14px", borderRadius: 8, whiteSpace: "nowrap",
            }}>
              View →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Filter pill ──────────────────────────────────────────────────────────────

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 13, fontWeight: active ? 600 : 400,
        padding: "7px 16px",
        borderRadius: 99,
        border: active ? `1.5px solid ${C.bgDark}` : `1.5px solid ${C.border}`,
        background: active ? C.bgDark : C.bgCard,
        color: active ? "#fff" : C.text,
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}

// ─── Inner component (needs useSearchParams) ──────────────────────────────────

function PortfolioClientInner({ projects }: { projects: FocusProject[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const cityFilter = searchParams.get("city") ?? "all";
  const typeFilter = searchParams.get("type") ?? "all";
  const statusFilter = searchParams.get("status") ?? "all";

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.replace(`/portfolio${qs ? `?${qs}` : ""}`, { scroll: false });
  };

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

  const readyCount = projects.filter(
    (p) => p.current_status === "ready_to_move" || p.current_status === "completed"
  ).length;

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <style>{`
        .pf-filter-bar { background: #fff; border-bottom: 1px solid rgba(0,0,0,0.07); position: sticky; top: 64px; z-index: 40; }
        .pf-filter-desktop { display: flex; gap: 8px; align-items: center; flex-wrap: nowrap; overflow-x: auto; padding: 14px 24px; scrollbar-width: none; max-width: 1200px; margin: 0 auto; }
        .pf-filter-desktop::-webkit-scrollbar { display: none; }
        .pf-filter-mobile { display: none; flex-direction: column; gap: 0; }
        .pf-filter-row { display: flex; align-items: center; gap: 8px; padding: 6px 16px; overflow-x: auto; scrollbar-width: none; }
        .pf-filter-row::-webkit-scrollbar { display: none; }
        .pf-filter-label { font-size: 10px; font-weight: 700; color: #7A7A7E; text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap; width: 44px; flex-shrink: 0; }
        .pf-divider { width: 1px; height: 20px; background: rgba(0,0,0,0.07); flex-shrink: 0; margin: 0 2px; }
        .pf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        @media (max-width: 639px) {
          .pf-filter-desktop { display: none; }
          .pf-filter-mobile { display: flex; }
          .pf-filter-bar { top: 56px; }
          .pf-grid { grid-template-columns: 1fr; gap: 14px; }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .pf-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ background: C.bgDark, padding: "64px 24px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
            color: C.gold, textTransform: "uppercase", margin: "0 0 12px",
          }}>
            Westside Realty · Active Portfolio
          </p>
          <h1 style={{
            fontSize: "clamp(26px, 5vw, 48px)",
            fontWeight: 800, color: "#fff",
            margin: "0 0 16px", lineHeight: 1.15,
          }}>
            Projects We Actively Market
          </h1>
          <p style={{
            fontSize: 15, color: "rgba(255,255,255,0.60)",
            maxWidth: 540, margin: "0 0 36px", lineHeight: 1.65,
          }}>
            Developer partnerships, live inventory, and dedicated advisors on each of these projects.
            Enquire for pricing, floor plans, and site visits.
          </p>
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
            {[
              { label: "Active Projects", value: projects.length },
              { label: "Cities", value: cities.length },
              { label: "Ready to Move", value: readyCount },
            ].map((s) => (
              <div key={s.label}>
                <p style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "2px 0 0", letterSpacing: "0.04em" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="pf-filter-bar">
        {/* Desktop: single scrollable row */}
        <div className="pf-filter-desktop">
          <FilterPill label="All Cities" active={cityFilter === "all"} onClick={() => setFilter("city", "all")} />
          {cities.map((c) => (
            <FilterPill key={c} label={CITY_LABELS[c] ?? c} active={cityFilter === c} onClick={() => setFilter("city", c)} />
          ))}
          <div className="pf-divider" />
          <FilterPill label="All Types" active={typeFilter === "all"} onClick={() => setFilter("type", "all")} />
          {types.map((t) => (
            <FilterPill key={t} label={formatType(t) ?? t} active={typeFilter === t} onClick={() => setFilter("type", t)} />
          ))}
          <div className="pf-divider" />
          <FilterPill label="All Status" active={statusFilter === "all"} onClick={() => setFilter("status", "all")} />
          <FilterPill label="Ready to Move" active={statusFilter === "ready"} onClick={() => setFilter("status", "ready")} />
          <FilterPill label="Under Construction" active={statusFilter === "construction"} onClick={() => setFilter("status", "construction")} />
        </div>

        {/* Mobile: labeled rows */}
        <div className="pf-filter-mobile" style={{ padding: "8px 0 4px" }}>
          <div className="pf-filter-row">
            <span className="pf-filter-label">City</span>
            <FilterPill label="All" active={cityFilter === "all"} onClick={() => setFilter("city", "all")} />
            {cities.map((c) => (
              <FilterPill key={c} label={CITY_LABELS[c] ?? c} active={cityFilter === c} onClick={() => setFilter("city", c)} />
            ))}
          </div>
          <div className="pf-filter-row">
            <span className="pf-filter-label">Type</span>
            <FilterPill label="All" active={typeFilter === "all"} onClick={() => setFilter("type", "all")} />
            {types.map((t) => (
              <FilterPill key={t} label={formatType(t) ?? t} active={typeFilter === t} onClick={() => setFilter("type", t)} />
            ))}
          </div>
          <div className="pf-filter-row" style={{ paddingBottom: "10px" }}>
            <span className="pf-filter-label">Status</span>
            <FilterPill label="All" active={statusFilter === "all"} onClick={() => setFilter("status", "all")} />
            <FilterPill label="Ready" active={statusFilter === "ready"} onClick={() => setFilter("status", "ready")} />
            <FilterPill label="Under Construction" active={statusFilter === "construction"} onClick={() => setFilter("status", "construction")} />
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px 80px" }}>
        <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>
          Showing <strong style={{ color: C.text }}>{filtered.length}</strong> project{filtered.length !== 1 ? "s" : ""}
          {cityFilter !== "all" ? ` in ${CITY_LABELS[cityFilter] ?? cityFilter}` : ""}
          {typeFilter !== "all" ? ` · ${formatType(typeFilter)}s` : ""}
          {statusFilter === "ready" ? " · Ready to Move" : ""}
          {statusFilter === "construction" ? " · Under Construction" : ""}
        </p>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: C.textMuted, fontSize: 15 }}>
            No projects match these filters.
          </div>
        ) : (
          <div className="pf-grid">
            {filtered.map((project) => (
              <PortfolioCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div style={{
          marginTop: 56,
          padding: "36px 28px",
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
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
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
              marginTop: 8, display: "inline-block",
              background: "#25D366", color: "#fff",
              fontWeight: 600, fontSize: 14,
              padding: "11px 28px", borderRadius: 10, textDecoration: "none",
            }}
          >
            WhatsApp an Advisor
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Public export (wrapped in Suspense for useSearchParams) ──────────────────

export function PortfolioClient({ projects }: { projects: FocusProject[] }) {
  return (
    <Suspense fallback={
      <div style={{ background: C.bgDark, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading…</p>
      </div>
    }>
      <PortfolioClientInner projects={projects} />
    </Suspense>
  );
}
