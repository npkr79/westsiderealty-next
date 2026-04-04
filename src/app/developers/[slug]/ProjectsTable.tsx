"use client";

import { useState } from "react";
import Link from "next/link";

type ComputedStatus = "Completed" | "New Launch" | "Near Completion" | "Under Construction" | "Unknown";

type Project = {
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

function isActive(s: ComputedStatus) {
  return s === "New Launch" || s === "Under Construction" || s === "Near Completion";
}

const STATUS_STYLE: Record<ComputedStatus, { label: string; bg: string; color: string; border: string }> = {
  "Completed":         { label: "Ready to Move",     bg: "rgba(59,130,246,0.12)",  color: "#60a5fa", border: "rgba(59,130,246,0.3)" },
  "New Launch":        { label: "New Launch",         bg: "rgba(34,197,94,0.12)",   color: "#4ade80", border: "rgba(34,197,94,0.3)" },
  "Near Completion":   { label: "Near Completion",    bg: "rgba(168,85,247,0.12)",  color: "#c084fc", border: "rgba(168,85,247,0.3)" },
  "Under Construction":{ label: "Under Construction", bg: "rgba(245,158,11,0.12)",  color: "#fbbf24", border: "rgba(245,158,11,0.3)" },
  "Unknown":           { label: "—",                  bg: "rgba(255,255,255,0.06)", color: "#64748b", border: "rgba(255,255,255,0.1)" },
};

function formatDate(d: string | null) {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" }); }
  catch { return d; }
}

function priceLabel(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const f = (n: number) => `₹${(n / 1000).toFixed(1)}K`;
  if (min && max) return `${f(min)}–${f(max)}/sqft`;
  return `${f((min ?? max)!)}/sqft`;
}

export function ProjectsTable({ projects, citySlug = "hyderabad" }: { projects: Project[]; citySlug?: string }) {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");

  const activeProjects = projects.filter((p) => isActive(p.computed_status));
  const completedProjects = projects.filter((p) => p.computed_status === "Completed");
  const displayedProjects = activeTab === "active" ? activeProjects : activeTab === "completed" ? completedProjects : projects;

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { key: "all",       label: "All",       count: projects.length },
          { key: "active",    label: "Active",    count: activeProjects.length },
          { key: "completed", label: "Completed", count: completedProjects.length },
        ] as const).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all"
            style={
              activeTab === key
                ? { background: "#c8a96e", color: "#0a0a0a" }
                : { background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }
            }
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Card grid */}
      {displayedProjects.length === 0 ? (
        <p className="text-slate-500 text-sm py-8 text-center">No projects in this category.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedProjects.map((p) => {
            const style = STATUS_STYLE[p.computed_status];
            const price = priceLabel(p.developer_price_min, p.developer_price_max);
            const possession = formatDate(p.proposed_completion_date);
            const href = p.url_slug ? `/${citySlug}/projects/${p.url_slug}` : null;
            const cardContent = (
              <>
                {/* Top: AI badge */}
                {p.has_ai && (
                  <div className="mb-3">
                    <span className="rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase" style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd", borderColor: "rgba(139,92,246,0.3)" }}>
                      AI
                    </span>
                  </div>
                )}

                {/* Project name */}
                <p className="text-white font-semibold text-sm leading-snug mb-1 group-hover:text-amber-300 transition-colors">
                  {p.project_name}
                </p>

                {/* Market */}
                {p.market_slug ? (
                  <Link
                    href={`/${citySlug}/${p.market_slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-slate-500 text-xs mb-3 block hover:text-amber-400 transition-colors"
                  >
                    {p.micro_market_name ?? "Hyderabad"}
                  </Link>
                ) : (
                  <p className="text-slate-500 text-xs mb-3">
                    {p.micro_market_name ?? "Hyderabad"}
                  </p>
                )}

                {/* Price */}
                {price && (
                  <p className="text-sm font-bold mb-3" style={{ color: "#c8a96e" }}>
                    {price}
                  </p>
                )}

                {/* Status + possession */}
                <div className="flex items-center justify-between">
                  <span
                    className="inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase"
                    style={{ background: style.bg, color: style.color, borderColor: style.border }}
                  >
                    {style.label}
                  </span>
                  {possession && (
                    <span className="text-slate-500 text-xs">{possession}</span>
                  )}
                </div>
              </>
            );

            return href ? (
              <Link
                key={p.project_id}
                href={href}
                className="group block rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: "#111", borderColor: "rgba(255,255,255,0.07)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(200,169,110,0.3)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
              >
                {cardContent}
              </Link>
            ) : (
              <div
                key={p.project_id}
                className="rounded-xl border p-5"
                style={{ background: "#111", borderColor: "rgba(255,255,255,0.07)" }}
              >
                {cardContent}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
