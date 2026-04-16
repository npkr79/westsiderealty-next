"use client";

import { useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  type DevelopmentOpportunity,
  OPPORTUNITY_CITY_LABELS,
  formatStage,
} from "@/lib/opportunities/types";

// ─── Design tokens (institutional / B2B feel — deep navy + gold) ──────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCr(value: number | null): string | null {
  if (value == null) return null;
  if (value >= 100) return `~₹${Math.round(value).toLocaleString("en-IN")} Cr`;
  return `~₹${value.toFixed(0)} Cr`;
}

function marginBand(opp: DevelopmentOpportunity): string | null {
  const lo = opp.indicative_gross_margin_pct_min;
  const hi = opp.indicative_gross_margin_pct_max;
  if (lo == null && hi == null) return null;
  if (lo != null && hi != null) return `${lo}–${hi}% margin`;
  return `~${lo ?? hi}% margin`;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function OpportunityCard({ opp }: { opp: DevelopmentOpportunity }) {
  const cityLabel = OPPORTUNITY_CITY_LABELS[opp.city_slug] ?? opp.city;
  const cost = formatCr(opp.indicative_project_cost_cr);
  const revenue = formatCr(opp.indicative_revenue_cr);
  const margin = marginBand(opp);

  return (
    <Link
      href={`/opportunities/${opp.slug}`}
      style={{ textDecoration: "none", display: "block", height: "100%" }}
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
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 36px rgba(0,0,0,0.10)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
          (e.currentTarget as HTMLDivElement).style.transform = "none";
        }}
      >
        {/* Hero strip */}
        <div
          style={{
            position: "relative",
            height: 180,
            width: "100%",
            background: "linear-gradient(135deg, #0a0a0a 0%, #1f1f24 60%, #c8a96e 130%)",
            overflow: "hidden",
          }}
        >
          {opp.hero_image_url && (
            <Image
              src={opp.hero_image_url}
              alt={opp.title}
              fill
              style={{ objectFit: "cover", opacity: 0.85 }}
              sizes="(max-width: 768px) 100vw, 380px"
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent 55%)",
            }}
          />
          <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                padding: "4px 10px",
                borderRadius: 99,
                background: C.gold,
                color: "#0a0a0a",
                textTransform: "uppercase",
              }}
            >
              {cityLabel}
            </span>
            {opp.nda_required_for_details && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  padding: "4px 10px",
                  borderRadius: 99,
                  background: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.3)",
                  textTransform: "uppercase",
                }}
              >
                Under NDA
              </span>
            )}
          </div>
          <p
            style={{
              position: "absolute",
              bottom: 12,
              left: 14,
              right: 14,
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.04em",
              margin: 0,
              opacity: 0.85,
            }}
          >
            {opp.asset_type}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 20px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, lineHeight: 1.3, margin: 0 }}>
              {opp.title}
            </h3>
            {opp.micro_market && (
              <p style={{ fontSize: 12, color: C.textMuted, margin: "4px 0 0", fontWeight: 500 }}>
                {opp.micro_market}, {cityLabel}
              </p>
            )}
          </div>

          {opp.headline && (
            <p
              style={{
                fontSize: 13,
                color: C.textMuted,
                margin: 0,
                lineHeight: 1.55,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical" as never,
                overflow: "hidden",
              }}
            >
              {opp.headline}
            </p>
          )}

          {/* Indicative numbers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginTop: 4,
              padding: "12px",
              background: "#faf8f3",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
            }}
          >
            {opp.saleable_potential_sqft != null && (
              <Stat label="Saleable" value={`${(opp.saleable_potential_sqft / 100000).toFixed(1)}L sqft`} />
            )}
            {opp.plot_area_acres != null && (
              <Stat label="Plot" value={`${opp.plot_area_acres.toFixed(2)} acres`} />
            )}
            {cost && <Stat label="Project Cost" value={cost} />}
            {revenue && <Stat label="Revenue" value={revenue} />}
          </div>

          <div style={{ flex: 1 }} />

          {/* Footer */}
          <div
            style={{
              borderTop: `1px solid ${C.border}`,
              paddingTop: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              {margin && (
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>
                  {margin}
                </p>
              )}
              {opp.stage && (
                <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>
                  {formatStage(opp.stage)}
                </p>
              )}
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#fff",
                background: C.bgDark,
                padding: "8px 16px",
                borderRadius: 8,
                whiteSpace: "nowrap",
              }}
            >
              View Deal →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 10, color: "#9a9a9e", margin: 0, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ fontSize: 13, color: C.text, margin: "2px 0 0", fontWeight: 700 }}>{value}</p>
    </div>
  );
}

// ─── Filter pill ──────────────────────────────────────────────────────────────

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 13,
        fontWeight: active ? 600 : 400,
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

// ─── Inner ────────────────────────────────────────────────────────────────────

function OpportunitiesClientInner({ opportunities }: { opportunities: DevelopmentOpportunity[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cityFilter = searchParams.get("city") ?? "all";
  const stageFilter = searchParams.get("stage") ?? "all";

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.replace(`/opportunities${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const cities = useMemo(() => {
    const seen = new Set<string>();
    opportunities.forEach((o) => seen.add(o.city_slug));
    return Array.from(seen);
  }, [opportunities]);

  const filtered = useMemo(() => {
    return opportunities.filter((o) => {
      if (cityFilter !== "all" && o.city_slug !== cityFilter) return false;
      if (stageFilter !== "all" && o.stage !== stageFilter) return false;
      return true;
    });
  }, [opportunities, cityFilter, stageFilter]);

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <style>{`
        .op-filter-bar { background: #fff; border-bottom: 1px solid rgba(0,0,0,0.07); position: sticky; top: 64px; z-index: 40; }
        .op-filter-row { display: flex; gap: 8px; align-items: center; flex-wrap: nowrap; overflow-x: auto; padding: 14px 24px; scrollbar-width: none; max-width: 1200px; margin: 0 auto; }
        .op-filter-row::-webkit-scrollbar { display: none; }
        .op-divider { width: 1px; height: 20px; background: rgba(0,0,0,0.07); flex-shrink: 0; margin: 0 4px; }
        .op-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 24px; }
        @media (max-width: 639px) {
          .op-filter-bar { top: 56px; }
          .op-grid { grid-template-columns: 1fr; gap: 16px; }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .op-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      {/* Hero */}
      <div style={{ background: C.bgDark, padding: "72px 24px 56px", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 80% 20%, rgba(200,169,110,0.15), transparent 50%)",
          }}
        />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: C.gold,
              textTransform: "uppercase",
              margin: "0 0 14px",
            }}
          >
            For Builders · Investors · Family Offices
          </p>
          <h1
            style={{
              fontSize: "clamp(28px, 5.5vw, 52px)",
              fontWeight: 800,
              color: "#fff",
              margin: "0 0 18px",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Development Opportunities
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.65)",
              maxWidth: 620,
              margin: "0 0 36px",
              lineHeight: 1.65,
            }}
          >
            Curated redevelopment, joint-development, and land deals sourced and vetted by our advisory team.
            Indicative numbers below; detailed feasibility, title, and tenant data shared under NDA.
          </p>

          <div style={{ display: "flex", gap: 36, flexWrap: "wrap" }}>
            {[
              { label: "Live Opportunities", value: opportunities.length },
              { label: "Cities", value: cities.length },
              {
                label: "Total Deal Size",
                value: `~₹${Math.round(
                  opportunities.reduce((s, o) => s + (o.indicative_project_cost_cr ?? 0), 0)
                )} Cr`,
              },
            ].map((s) => (
              <div key={s.label}>
                <p style={{ fontSize: 30, fontWeight: 800, color: "#fff", margin: 0 }}>{s.value}</p>
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.45)",
                    margin: "2px 0 0",
                    letterSpacing: "0.04em",
                  }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="op-filter-bar">
        <div className="op-filter-row">
          <FilterPill label="All Cities" active={cityFilter === "all"} onClick={() => setFilter("city", "all")} />
          {cities.map((c) => (
            <FilterPill
              key={c}
              label={OPPORTUNITY_CITY_LABELS[c] ?? c}
              active={cityFilter === c}
              onClick={() => setFilter("city", c)}
            />
          ))}
          <div className="op-divider" />
          <FilterPill label="All Stages" active={stageFilter === "all"} onClick={() => setFilter("stage", "all")} />
          <FilterPill
            label="Feasibility"
            active={stageFilter === "feasibility"}
            onClick={() => setFilter("stage", "feasibility")}
          />
          <FilterPill
            label="Approvals"
            active={stageFilter === "approvals_in_progress"}
            onClick={() => setFilter("stage", "approvals_in_progress")}
          />
          <FilterPill
            label="Ready to Launch"
            active={stageFilter === "ready_to_launch"}
            onClick={() => setFilter("stage", "ready_to_launch")}
          />
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px 80px" }}>
        <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>
          Showing <strong style={{ color: C.text }}>{filtered.length}</strong> opportunit
          {filtered.length === 1 ? "y" : "ies"}
          {cityFilter !== "all" ? ` in ${OPPORTUNITY_CITY_LABELS[cityFilter] ?? cityFilter}` : ""}
        </p>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 0", color: C.textMuted, fontSize: 15 }}>
            <p style={{ margin: 0 }}>No opportunities currently match these filters.</p>
            <p style={{ margin: "8px 0 0", fontSize: 13 }}>
              Looking for a specific deal type?{" "}
              <a
                href="https://wa.me/919502500068?text=Hi%2C%20looking%20for%20development%20opportunities"
                style={{ color: C.goldDark, textDecoration: "underline" }}
              >
                Talk to our advisory team
              </a>
            </p>
          </div>
        ) : (
          <div className="op-grid">
            {filtered.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          </div>
        )}

        {/* Bottom CTA — different from /portfolio: targets builders not buyers */}
        <div
          style={{
            marginTop: 64,
            padding: "44px 32px",
            background: "linear-gradient(135deg, #0a0a0a 0%, #1f1f24 100%)",
            borderRadius: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 14,
            border: `1px solid ${C.gold}30`,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: C.gold,
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Have a project to monetise?
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0, maxWidth: 540 }}>
            We help landowners and societies find the right development partner
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", margin: 0, maxWidth: 480, lineHeight: 1.6 }}>
            Feasibility · Developer shortlisting · Term sheet · Closure. Confidential, fee on success.
          </p>
          <a
            href="https://wa.me/919502500068?text=Hi%2C%20I%20have%20a%20development%20opportunity%20to%20discuss"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: 8,
              display: "inline-block",
              background: C.gold,
              color: "#0a0a0a",
              fontWeight: 700,
              fontSize: 14,
              padding: "12px 28px",
              borderRadius: 10,
              textDecoration: "none",
              letterSpacing: "0.04em",
            }}
          >
            Speak to Advisory Team
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export function OpportunitiesClient({ opportunities }: { opportunities: DevelopmentOpportunity[] }) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            background: C.bgDark,
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading…</p>
        </div>
      }
    >
      <OpportunitiesClientInner opportunities={opportunities} />
    </Suspense>
  );
}
