"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

// ─── Design System ─────────────────────────────────────────────────────────────
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

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface ProjectItem {
  id: string;
  project_name: string;
  url_slug: string;
  hero_image_url: string | null;
  price_range_text: string | null;
  completion_status: string | null;
  micro_market_name: string | null;
  micro_market_slug: string | null;
  developer_name: string | null;
}

export interface MicroMarketOption {
  id: string;
  micro_market_name: string;
  url_slug: string;
}

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { key: "", label: "All" },
  { key: "new_launch", label: "New Launch" },
  { key: "under_construction", label: "Under Construction" },
  { key: "near_completion", label: "Near Completion" },
  { key: "ready_to_move", label: "Ready to Move" },
] as const;

const STATUS_DISPLAY: Record<string, { label: string; color: string; bg: string; border: string }> = {
  new_launch:         { label: "New Launch",         color: "#16a34a", bg: "rgba(22,163,74,0.1)",   border: "rgba(22,163,74,0.25)" },
  under_construction: { label: "Under Construction", color: "#b45309", bg: "rgba(180,83,9,0.1)",    border: "rgba(180,83,9,0.25)" },
  near_completion:    { label: "Near Completion",    color: "#7c3aed", bg: "rgba(124,58,237,0.1)",  border: "rgba(124,58,237,0.25)" },
  ready_to_move:      { label: "Ready to Move",      color: "#0369a1", bg: "rgba(3,105,161,0.1)",   border: "rgba(3,105,161,0.25)" },
  completed:          { label: "Ready to Move",      color: "#0369a1", bg: "rgba(3,105,161,0.1)",   border: "rgba(3,105,161,0.25)" },
};

function getStatusDisplay(s: string | null) {
  if (!s) return null;
  return STATUS_DISPLAY[s] ?? null;
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}

// ─── ProjectCard ───────────────────────────────────────────────────────────────
function ProjectCard({ project, citySlug }: { project: ProjectItem; citySlug: string }) {
  const href = `/${citySlug}/projects/${project.url_slug}`;
  const statusStyle = getStatusDisplay(project.completion_status);

  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          overflow: "hidden",
          transition: "box-shadow 0.2s, border-color 0.2s, transform 0.2s",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)";
          el.style.borderColor = "rgba(176,141,87,0.35)";
          el.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = "none";
          el.style.borderColor = C.border;
          el.style.transform = "translateY(0)";
        }}
      >
        {/* Image */}
        <div style={{ height: 180, position: "relative", background: "#E8E4DC", flexShrink: 0 }}>
          {project.hero_image_url ? (
            <Image src={project.hero_image_url} alt={project.project_name} fill style={{ objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #E8E4DC 0%, #D4CFC5 100%)" }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: C.textMuted, fontWeight: 600 }}>
                {initials(project.project_name)}
              </span>
            </div>
          )}
          {statusStyle && (
            <div style={{ position: "absolute", top: 12, left: 12 }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: statusStyle.color, background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, borderRadius: 20, padding: "4px 10px", backdropFilter: "blur(8px)" }}>
                {statusStyle.label}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {project.developer_name && (
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              {project.developer_name}
            </p>
          )}
          <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 19, fontWeight: 600, color: C.text, lineHeight: 1.2, margin: 0 }}>
            {project.project_name}
          </h3>
          {project.micro_market_name && (
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, margin: 0 }}>
              📍 {project.micro_market_name}
            </p>
          )}
          {project.price_range_text && (
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: C.gold, margin: "4px 0 0" }}>
              {project.price_range_text}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
interface CityProjectsContentProps {
  projects: ProjectItem[];
  microMarkets: MicroMarketOption[];
  citySlug: string;
  cityName: string;
  activeStatus: string;
  activeMicroMarket: string;
  searchQuery: string;
}

export default function CityProjectsContent({
  projects,
  microMarkets,
  citySlug,
  cityName,
  activeStatus,
  activeMicroMarket,
  searchQuery,
}: CityProjectsContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchQuery);
  const [mmOpen, setMmOpen] = useState(false);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  // Client-side search filter (on top of server-side status/market filter)
  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.project_name.toLowerCase().includes(q) ||
        (p.developer_name ?? "").toLowerCase().includes(q) ||
        (p.micro_market_name ?? "").toLowerCase().includes(q)
    );
  }, [projects, search]);

  const activeMarketName = microMarkets.find((m) => m.url_slug === activeMicroMarket)?.micro_market_name;

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <style>{`
        .proj-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .proj-filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
        @media (max-width: 960px) { .proj-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .proj-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section style={{ background: C.bgDark, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 70% at 30% 50%, rgba(176,141,87,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "100px 24px 64px", position: "relative" }}>
          {/* Breadcrumb */}
          <nav style={{ display: "flex", gap: 8, marginBottom: 28, fontFamily: "'Outfit', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Home</Link>
            <span>›</span>
            <Link href={`/${citySlug}`} style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>{cityName}</Link>
            <span>›</span>
            <span style={{ color: "rgba(255,255,255,0.6)" }}>Projects</span>
          </nav>

          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: C.gold, margin: "0 0 12px" }}>
            {cityName} · RERA Verified Projects
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(32px, 4.5vw, 54px)", fontWeight: 600, color: "#fff", lineHeight: 1.12, margin: "0 0 16px" }}>
            {activeMarketName ? `Projects in ${activeMarketName}` : `New Projects in ${cityName}`}
          </h1>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, color: "rgba(255,255,255,0.45)", margin: 0 }}>
            {filtered.length} project{filtered.length !== 1 ? "s" : ""} · RERA verified · Expert-curated listings
          </p>
        </div>
      </section>

      {/* ── Sticky Filter Bar ────────────────────────────────────────────────── */}
      <div style={{ position: "sticky", top: 64, zIndex: 30, background: "rgba(250,250,247,0.97)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "12px 24px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>

          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 200px", minWidth: 140, maxWidth: 280 }}>
            <input
              type="text"
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 14px 8px 36px",
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13,
                color: C.text,
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                borderRadius: 24,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, fontSize: 13 }}>🔍</span>
          </div>

          {/* Status chips */}
          <div className="proj-filter-row" style={{ flex: "1 1 auto", overflowX: "auto" }}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => updateParam("status", f.key)}
                style={{
                  flexShrink: 0,
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "7px 16px",
                  borderRadius: 24,
                  border: "1px solid",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  ...(activeStatus === f.key
                    ? { background: C.gold, color: "#fff", borderColor: C.gold }
                    : { background: "transparent", color: C.textMuted, borderColor: C.border }),
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Micro-market dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMmOpen(!mmOpen)}
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                padding: "7px 16px",
                borderRadius: 24,
                border: `1px solid ${activeMicroMarket ? C.gold : C.border}`,
                background: activeMicroMarket ? C.gold : "transparent",
                color: activeMicroMarket ? "#fff" : C.textMuted,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {activeMarketName ?? "All Markets"} ▾
            </button>
            {mmOpen && (
              <div style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                zIndex: 50,
                minWidth: 200,
                maxHeight: 280,
                overflowY: "auto",
              }}>
                <button
                  onClick={() => { updateParam("microMarket", ""); setMmOpen(false); }}
                  style={{ display: "block", width: "100%", padding: "10px 16px", textAlign: "left", fontFamily: "'Outfit', sans-serif", fontSize: 13, color: activeMicroMarket === "" ? C.gold : C.text, fontWeight: activeMicroMarket === "" ? 600 : 400, background: "none", border: "none", cursor: "pointer", borderBottom: `1px solid ${C.border}` }}
                >
                  All Markets
                </button>
                {microMarkets.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { updateParam("microMarket", m.url_slug); setMmOpen(false); }}
                    style={{ display: "block", width: "100%", padding: "10px 16px", textAlign: "left", fontFamily: "'Outfit', sans-serif", fontSize: 13, color: activeMicroMarket === m.url_slug ? C.gold : C.text, fontWeight: activeMicroMarket === m.url_slug ? 600 : 400, background: "none", border: "none", cursor: "pointer" }}
                  >
                    {m.micro_market_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear filters */}
          {(activeStatus || activeMicroMarket) && (
            <button
              onClick={() => { router.push(pathname); setSearch(""); }}
              style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Project Grid ─────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1160, margin: "0 auto", padding: "40px 24px 80px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, color: C.textMuted, marginBottom: 12 }}>No projects found</p>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.textMuted }}>Try adjusting your filters or search query.</p>
            <button
              onClick={() => { router.push(pathname); setSearch(""); }}
              style={{ marginTop: 20, fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: C.gold, background: "none", border: `1px solid ${C.gold}`, borderRadius: 24, padding: "10px 24px", cursor: "pointer" }}
            >
              View all projects
            </button>
          </div>
        ) : (
          <div className="proj-grid">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} citySlug={citySlug} />
            ))}
          </div>
        )}
      </section>

      {/* ── Bottom Nav ───────────────────────────────────────────────────────── */}
      <section style={{ background: C.bgCard, borderTop: `1px solid ${C.border}`, padding: "40px 24px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: C.text, margin: "0 0 4px" }}>Explore by Market</p>
            <Link href={`/${citySlug}/micro-markets`} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.gold, textDecoration: "none" }}>
              View all {cityName} micro-markets →
            </Link>
          </div>
          <Link href="/contact" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", background: C.bgDark, color: "#fff", textDecoration: "none", padding: "12px 28px", borderRadius: 4 }}>
            Talk to an Advisor
          </Link>
        </div>
      </section>
    </div>
  );
}
