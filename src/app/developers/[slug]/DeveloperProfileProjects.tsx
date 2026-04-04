"use client";

import { useState } from "react";
import Link from "next/link";
import { buildProjectUrl } from "@/lib/routes";

// ─── Design System ────────────────────────────────────────────────────────────

const C = {
  bg: "#FAFAF7",
  bgCard: "#FFFFFF",
  gold: "#B08D57",
  goldLight: "#C9A96E",
  accent: "#2D6A4F",
  text: "#1A1A1F",
  textMuted: "#7A7A7E",
  border: "rgba(0,0,0,0.07)",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ComputedStatus =
  | "Completed"
  | "New Launch"
  | "Near Completion"
  | "Under Construction"
  | "Unknown";

export type ProfileProject = {
  project_id: string;
  project_name: string;
  url_slug: string | null;
  proposed_completion_date: string | null;
  micro_market_name: string | null;
  market_slug: string | null;
  developer_price_min: number | null;
  developer_price_max: number | null;
  has_ai: boolean;
  computed_status: ComputedStatus;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isActive(s: ComputedStatus) {
  return s === "New Launch" || s === "Under Construction" || s === "Near Completion";
}

function formatDate(d: string | null) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

function priceLabel(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const f = (n: number) => `₹${(n / 1000).toFixed(1)}K`;
  if (min && max && min !== max) return `${f(min)}–${f(max)}/sqft`;
  return `${f((min ?? max)!)}/sqft`;
}

const STATUS_CONFIG: Record<
  ComputedStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  Completed: {
    label: "Ready to Move",
    color: C.accent,
    bg: "rgba(45,106,79,0.08)",
    border: "rgba(45,106,79,0.2)",
  },
  "New Launch": {
    label: "New Launch",
    color: C.gold,
    bg: "rgba(176,141,87,0.08)",
    border: "rgba(176,141,87,0.25)",
  },
  "Near Completion": {
    label: "Near Completion",
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.07)",
    border: "rgba(124,58,237,0.2)",
  },
  "Under Construction": {
    label: "Under Construction",
    color: "#D97706",
    bg: "rgba(217,119,6,0.07)",
    border: "rgba(217,119,6,0.2)",
  },
  Unknown: {
    label: "—",
    color: C.textMuted,
    bg: "rgba(0,0,0,0.03)",
    border: C.border,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function DeveloperProfileProjects({
  projects,
  citySlug = "hyderabad",
}: {
  projects: ProfileProject[];
  citySlug?: string;
}) {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");

  const activeProjects = projects.filter((p) => isActive(p.computed_status));
  const completedProjects = projects.filter((p) => p.computed_status === "Completed");
  const displayedProjects =
    activeTab === "active"
      ? activeProjects
      : activeTab === "completed"
      ? completedProjects
      : projects;

  const tabs = [
    { key: "all" as const, label: "All", count: projects.length },
    { key: "active" as const, label: "Active", count: activeProjects.length },
    { key: "completed" as const, label: "Completed", count: completedProjects.length },
  ];

  return (
    <>
      <style>{`
        .dp-card {
          background: ${C.bgCard};
          border: 1px solid ${C.border};
          border-radius: 16px;
          padding: 22px 20px;
          transition: all 0.18s ease;
          text-decoration: none;
          display: block;
        }
        .dp-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
          border-color: rgba(176,141,87,0.3);
        }
        .dp-card-name {
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 14px;
          color: ${C.text};
          line-height: 1.45;
          margin: 0 0 4px;
          transition: color 0.15s;
        }
        .dp-card:hover .dp-card-name { color: ${C.gold}; }
      `}</style>

      {/* Filter Chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: "6px 18px",
              borderRadius: 999,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              border: `1px solid ${activeTab === key ? C.gold : C.border}`,
              background: activeTab === key ? C.gold : "transparent",
              color: activeTab === key ? "#fff" : C.textMuted,
              transition: "all 0.15s",
            }}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Grid */}
      {displayedProjects.length === 0 ? (
        <p
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 14,
            color: C.textMuted,
            textAlign: "center",
            padding: "48px 0",
          }}
        >
          No projects in this category.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          {displayedProjects.map((p) => {
            const sc = STATUS_CONFIG[p.computed_status];
            const price = priceLabel(p.developer_price_min, p.developer_price_max);
            const possession = formatDate(p.proposed_completion_date);
            const href = p.url_slug ? buildProjectUrl(citySlug, p.url_slug) : null;

            const inner = (
              <>
                {p.has_ai && (
                  <span
                    style={{
                      display: "inline-block",
                      marginBottom: 10,
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      fontFamily: "'Outfit', sans-serif",
                      background: "rgba(124,58,237,0.08)",
                      color: "#7C3AED",
                      border: "1px solid rgba(124,58,237,0.2)",
                    }}
                  >
                    AI Enriched
                  </span>
                )}

                <p className="dp-card-name">{p.project_name}</p>

                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 12,
                    color: C.textMuted,
                    margin: `0 0 ${price ? 12 : 16}px`,
                  }}
                >
                  {p.micro_market_name ?? (citySlug === "goa" ? "Goa" : "Hyderabad")}
                </p>

                {price && (
                  <p
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 14,
                      fontWeight: 600,
                      color: C.gold,
                      margin: "0 0 14px",
                    }}
                  >
                    {price}
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontFamily: "'Outfit', sans-serif",
                      background: sc.bg,
                      color: sc.color,
                      border: `1px solid ${sc.border}`,
                    }}
                  >
                    {sc.label}
                  </span>
                  {possession && (
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11,
                        color: C.textMuted,
                      }}
                    >
                      {possession}
                    </span>
                  )}
                </div>
              </>
            );

            return href ? (
              <Link key={p.project_id} href={href} className="dp-card">
                {inner}
              </Link>
            ) : (
              <div key={p.project_id} className="dp-card" style={{ cursor: "default" }}>
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
