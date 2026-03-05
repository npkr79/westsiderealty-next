"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  MessageCircle,
  Phone,
  MapPin,
  Building2,
} from "lucide-react";
import MarketTicker, { type TickerMarket } from "./MarketTicker";

// ─── Exported types (used by page.tsx) ───────────────────────────────────────

export interface HeroMarket {
  name: string;
  slug: string;
  zoneType: string | null;
  pricePerSqft: number | null;
  maturity: string | null;
  entryTiming: string | null;
}

export interface ExplorerMarket {
  name: string;
  slug: string;
  maturity: string | null;
  entryTiming: string | null;
  zoneType: string | null;
  pricePerSqft: number | null;
  bestFor: string | null;
  growthMin: number | null;
  growthMax: number | null;
  appreciation5yr: string | null;
}

export interface IntelFeed {
  pulseHeadline: string | null;
  pulseDate: string | null;
  opportunityMarket: string | null;
  riskAlert: string | null;
}

export interface FeaturedProject {
  id: string;
  name: string;
  href: string;
  imageUrl: string | null;
  priceText: string | null;
  microMarket: string | null;
  developerName: string | null;
  isStrongDeveloper: boolean;
  // rera_projects fields
  currentStatus: string | null;
  proposedCompletion: string | null;
  developmentForm: string | null;
  reraId: string | null;
  isHighrise: boolean | null;
  litigationFlag: boolean | null;
}

export interface HomepageData {
  tickerMarkets: TickerMarket[];
  heroMarkets: HeroMarket[];
  explorerMarkets: ExplorerMarket[];
  intel: IntelFeed;
  projects: FeaturedProject[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function maturityDot(m: string | null): string {
  return (
    { Established: "#3b82f6", Growing: "#22c55e", Emerging: "#f59e0b", Peak: "#ef4444" }[m ?? ""] ??
    "#94a3b8"
  );
}

function entryBadge(t: string | null): { bg: string; color: string; border: string } | null {
  if (!t) return null;
  const map: Record<string, { bg: string; color: string; border: string }> = {
    Optimal: { bg: "#d1fae5", color: "#047857", border: "#6ee7b7" },
    Good:    { bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd" },
    Wait:    { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
    Late:    { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
  };
  return map[t] ?? null;
}

function extractFirstNumber(s: string | null): string | null {
  if (!s) return null;
  const m = s.match(/(\d+(?:\.\d+)?)/);
  return m ? m[1] : null;
}

function truncate(s: string | null, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// ─── Filter pills ─────────────────────────────────────────────────────────────

type FilterPill =
  | "All Markets"
  | "Emerging"
  | "Growing"
  | "Established"
  | "Optimal Entry"
  | "Investment"
  | "End-Use";

const FILTERS: FilterPill[] = [
  "All Markets",
  "Emerging",
  "Growing",
  "Established",
  "Optimal Entry",
  "Investment",
  "End-Use",
];

function applyFilter(markets: ExplorerMarket[], f: FilterPill): ExplorerMarket[] {
  if (f === "All Markets")    return markets;
  if (f === "Emerging")       return markets.filter(m => m.maturity === "Emerging");
  if (f === "Growing")        return markets.filter(m => m.maturity === "Growing");
  if (f === "Established")    return markets.filter(m => m.maturity === "Established");
  if (f === "Optimal Entry")  return markets.filter(m => m.entryTiming === "Optimal");
  if (f === "Investment")     return markets.filter(m =>
    m.bestFor?.toLowerCase().includes("investor") ||
    m.bestFor?.toLowerCase().includes("invest")
  );
  if (f === "End-Use")        return markets.filter(m =>
    m.bestFor?.toLowerCase().includes("home") ||
    m.bestFor?.toLowerCase().includes("family") ||
    m.bestFor?.toLowerCase().includes("end")
  );
  return markets;
}

// ─── Section: Hero ────────────────────────────────────────────────────────────

function HeroSection({ markets }: { markets: HeroMarket[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (markets.length < 2) return;
    const id = setInterval(() => setActiveIdx(p => (p + 1) % markets.length), 3200);
    return () => clearInterval(id);
  }, [markets.length]);

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0a0f1e 0%, #0f172a 60%, #0a0f1e 100%)",
        minHeight: "calc(100vh - 104px)",
      }}
    >
      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), " +
            "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 600,
          height: 600,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.09) 0%, transparent 65%)",
          borderRadius: "50%",
        }}
      />

      <div
        className="relative mx-auto max-w-[1200px] px-5 ws-hero-grid"
        style={{ paddingTop: 140, paddingBottom: 80 }}
      >
        {/* ── LEFT ── */}
        <div>
          {/* Trust pill */}
          <div
            className="ws-fade-0 inline-flex items-center gap-2 mb-6 rounded-full"
            style={{
              padding: "6px 14px",
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.2)",
            }}
          >
            <span className="ws-pulse rounded-full bg-green-400"
              style={{ width: 8, height: 8, flexShrink: 0 }} />
            <span
              style={{
                fontSize: 11,
                color: "#93c5fd",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 500,
              }}
            >
              RERA Verified · AI-Powered · 120 Markets
            </span>
          </div>

          {/* H1 */}
          <h1
            className="ws-fade-1"
            style={{
              fontFamily: "var(--font-dm-serif, Georgia, serif)",
              fontSize: "clamp(44px, 5.5vw, 70px)",
              lineHeight: 1.05,
              fontWeight: 400,
              color: "white",
            }}
          >
            Buy Hyderabad<br />
            <em style={{ color: "#93c5fd" }}>with conviction,</em><br />
            not guesswork.
          </h1>

          {/* Subtext */}
          <p
            className="ws-fade-2 mt-5"
            style={{
              fontSize: 17,
              fontWeight: 300,
              color: "#94a3b8",
              maxWidth: 460,
              lineHeight: 1.75,
            }}
          >
            The only platform that analyses every Hyderabad micro-market using
            live RERA data and AI research — so you know exactly where to buy,
            when to buy, and what to pay.
          </p>

          {/* CTA pair */}
          <div className="ws-fade-3 flex flex-wrap gap-3 mt-8">
            <Link
              href="/hyderabad/micro-markets"
              className="ws-glow-btn inline-flex items-center gap-2 rounded-xl text-white font-semibold transition-all duration-250 hover:-translate-y-px"
              style={{
                fontSize: 14,
                padding: "14px 28px",
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              }}
            >
              Explore Markets <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl transition-all duration-200 hover:border-white/30"
              style={{
                fontSize: 14,
                padding: "14px 24px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#cbd5e1",
              }}
            >
              Talk to a Specialist
            </Link>
          </div>

          {/* Stats row */}
          <div
            className="ws-fade-4 mt-10 flex flex-wrap gap-y-5"
            style={{ alignItems: "center" }}
          >
            {[
              { value: "120+",   label: "Micro-markets tracked" },
              { value: "1,200+", label: "RERA verified projects" },
              { value: "₹8,500", label: "Avg entry price /sqft" },
              { value: "18%",    label: "5yr avg appreciation" },
            ].map((s, i) => (
              <div key={i} className="flex items-center">
                {i > 0 && (
                  <div
                    className="hidden sm:block mx-6 self-center"
                    style={{
                      width: 1,
                      height: 32,
                      background: "rgba(255,255,255,0.08)",
                    }}
                  />
                )}
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-dm-serif, Georgia, serif)",
                      fontSize: 24,
                      fontWeight: 600,
                      color: "white",
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#4b5563",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Floating Signal Card ── */}
        <div className="hidden lg:block ws-float" style={{ filter: "drop-shadow(0 20px 60px rgba(0,0,0,0.4))" }}>
          <div
            className="rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)",
              padding: 22,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                LIVE MARKET SIGNALS
              </span>
              <span className="flex items-center gap-1.5" style={{ fontSize: 10, color: "#22c55e" }}>
                <span className="ws-pulse rounded-full bg-green-400"
                  style={{ width: 6, height: 6 }} />
                Mar 2026
              </span>
            </div>

            {/* Market rows */}
            <div>
              {markets.slice(0, 8).map((m, i) => {
                const isActive = i === activeIdx;
                const badge = entryBadge(m.entryTiming);
                return (
                  <Link
                    key={m.slug}
                    href={`/hyderabad/${m.slug}`}
                    className="flex items-center rounded-lg mb-1.5 transition-all duration-500 cursor-pointer"
                    style={{
                      padding: "10px 12px",
                      background: isActive ? "rgba(59,130,246,0.1)" : "transparent",
                      border: isActive
                        ? "1px solid rgba(59,130,246,0.2)"
                        : "1px solid transparent",
                    }}
                  >
                    <span
                      className="rounded-full flex-shrink-0 mr-2.5"
                      style={{ width: 8, height: 8, background: maturityDot(m.maturity) }}
                    />
                    <span
                      className="text-[13px] flex-shrink-0 mr-2 font-medium"
                      style={{ color: isActive ? "white" : "#6b7280" }}
                    >
                      {m.name}
                    </span>
                    <span
                      className="flex-1 truncate text-[10px] mr-2"
                      style={{ color: "#4b5563" }}
                    >
                      {m.zoneType}
                    </span>
                    {m.pricePerSqft != null && (
                      <span
                        className="text-[13px] font-medium flex-shrink-0 mr-2"
                        style={{ color: "#e2e8f0" }}
                      >
                        ₹{m.pricePerSqft.toLocaleString("en-IN")}
                      </span>
                    )}
                    {badge && m.entryTiming && (
                      <span
                        className="flex-shrink-0 text-[9px] font-bold"
                        style={{
                          padding: "2px 5px",
                          borderRadius: 4,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {m.entryTiming}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between mt-4 pt-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span style={{ fontSize: 11, color: "#4b5563" }}>
                🤖 AI Analysis · 120 markets
              </span>
              <button
                onClick={() => router.push("/hyderabad")}
                className="flex items-center gap-1 text-[11px] font-medium cursor-pointer hover:text-blue-300 transition-colors"
                style={{ color: "#3b82f6" }}
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Dark → Light transition ──────────────────────────────────────────────────

function GradientTransition() {
  return (
    <div
      className="pointer-events-none w-full"
      style={{
        height: 64,
        background: "linear-gradient(to bottom, #0a0f1e, #ffffff)",
      }}
    />
  );
}

// ─── Section: Intelligence Feed ───────────────────────────────────────────────

type CardKey = "pulse" | "opp" | "risk";

function IntelFeedSection({ intel }: { intel: IntelFeed }) {
  const [hovered, setHovered] = useState<CardKey | null>(null);

  const cards: Array<{
    key: CardKey;
    tag: string;
    tagBg: string;
    tagColor: string;
    title: string;
    footer: string;
    accentColor: string;
  }> = [
    {
      key: "pulse",
      tag: "MARKET PULSE",
      tagBg: "#eff6ff",
      tagColor: "#2563eb",
      title: intel.pulseHeadline
        ? truncate(intel.pulseHeadline, 110)
        : "Hyderabad west corridor showing sustained capital momentum through Q1 2026.",
      footer: intel.pulseDate
        ? `Updated ${new Date(intel.pulseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
        : "Updated Mar 2026",
      accentColor: "#3b82f6",
    },
    {
      key: "opp",
      tag: "OPPORTUNITY",
      tagBg: "#f0fdf4",
      tagColor: "#15803d",
      title: intel.opportunityMarket
        ? `${intel.opportunityMarket} is showing the strongest entry signal in Hyderabad this quarter`
        : "West Hyderabad corridors are showing the strongest entry signals in Hyderabad this quarter",
      footer: "AI Research · Mar 2026",
      accentColor: "#22c55e",
    },
    {
      key: "risk",
      tag: "RISK ALERT",
      tagBg: "#fef2f2",
      tagColor: "#b91c1c",
      title: intel.riskAlert
        ? truncate(intel.riskAlert, 110)
        : "Monitor construction timelines on high-density projects. Delivery risk elevated in saturated corridors.",
      footer: "AI Research · Mar 2026",
      accentColor: "#ef4444",
    },
  ];

  return (
    <section className="bg-white" style={{ padding: "72px 32px" }}>
      <div className="mx-auto" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", fontWeight: 600 }}>
              Intelligence Feed
            </p>
            <h2
              className="mt-1"
              style={{
                fontFamily: "var(--font-dm-serif, Georgia, serif)",
                fontSize: "clamp(28px, 3vw, 38px)",
                color: "#0f172a",
                fontWeight: 400,
                lineHeight: 1.15,
              }}
            >
              What the market<br />
              <em style={{ color: "#3b82f6" }}>is telling us right now</em>
            </h2>
          </div>
          <Link
            href="/hyderabad/micro-markets"
            className="flex items-center gap-1 font-medium hover:text-blue-500 transition-colors"
            style={{ fontSize: 13, color: "#2563eb" }}
          >
            All insights <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 3 cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {cards.map(c => {
            const isHov = hovered === c.key;
            return (
              <div
                key={c.key}
                className="rounded-xl cursor-pointer"
                style={{
                  background: isHov ? "#f8fafc" : "white",
                  border: "1px solid #e2e8f0",
                  borderLeft: `3px solid ${isHov ? c.accentColor : "transparent"}`,
                  padding: 24,
                  transform: isHov ? "translateY(-3px)" : "none",
                  boxShadow: isHov ? "0 8px 24px rgba(0,0,0,0.07)" : "none",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={() => setHovered(c.key)}
                onMouseLeave={() => setHovered(null)}
              >
                <span
                  className="text-[9px] font-bold uppercase tracking-wider rounded px-2 py-1"
                  style={{ background: c.tagBg, color: c.tagColor }}
                >
                  {c.tag}
                </span>
                <p
                  className="mt-3 font-medium leading-snug"
                  style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.5 }}
                >
                  {c.title}
                </p>
                <p className="mt-3" style={{ fontSize: 10, color: "#94a3b8" }}>
                  {c.footer}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Section: Market Explorer ─────────────────────────────────────────────────

function MarketExplorerSection({ markets }: { markets: ExplorerMarket[] }) {
  const [filter, setFilter] = useState<FilterPill>("All Markets");
  const [hovered, setHovered] = useState<string | null>(null);
  const router = useRouter();

  const visible = applyFilter(markets, filter);

  return (
    <section style={{ background: "#f8fafc", padding: "72px 32px" }}>
      <div className="mx-auto" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <div className="text-center mb-8">
          <p
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#94a3b8",
              fontWeight: 600,
            }}
          >
            120 Micro-Markets · Hyderabad
          </p>
          <h2
            className="mt-2"
            style={{
              fontFamily: "var(--font-dm-serif, Georgia, serif)",
              fontSize: "clamp(28px, 3.5vw, 40px)",
              color: "#0f172a",
              fontWeight: 400,
              lineHeight: 1.1,
            }}
          >
            Find your{" "}
            <em style={{ color: "#3b82f6" }}>right market</em>
          </h2>
          <p className="mt-3" style={{ fontSize: 15, color: "#64748b" }}>
            Every market scored on entry timing, growth potential and delivery risk
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {FILTERS.map(f => {
            const active = f === filter;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="rounded-full border font-medium transition-all duration-150"
                style={{
                  fontSize: 12,
                  padding: "8px 16px",
                  background: active ? "#2563eb" : "white",
                  color: active ? "white" : "#64748b",
                  borderColor: active ? "#2563eb" : "#e2e8f0",
                }}
              >
                {f}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {visible.length === 0 ? (
          <p className="text-center py-12" style={{ color: "#94a3b8", fontSize: 14 }}>
            No markets match this filter yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {visible.map(m => {
              const isHov = hovered === m.slug;
              const badge = entryBadge(m.entryTiming);
              const dot   = maturityDot(m.maturity);
              const num5yr = extractFirstNumber(m.appreciation5yr);

              return (
                <div
                  key={m.slug}
                  className="rounded-xl cursor-pointer bg-white"
                  style={{
                    border: `1px solid ${isHov ? "#bfdbfe" : "#e2e8f0"}`,
                    padding: 18,
                    transform: isHov ? "translateY(-3px)" : "none",
                    boxShadow: isHov ? "0 8px 28px rgba(59,130,246,0.1)" : "none",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={() => setHovered(m.slug)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => router.push(`/hyderabad/${m.slug}`)}
                >
                  {/* Row 1: dot + badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded-full"
                      style={{ width: 8, height: 8, background: dot }}
                    />
                    {badge && m.entryTiming && (
                      <span
                        className="text-[9px] font-bold"
                        style={{
                          padding: "2px 6px",
                          borderRadius: 100,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {m.entryTiming}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <p
                    className="mt-2 leading-tight"
                    style={{
                      fontFamily: "var(--font-dm-serif, Georgia, serif)",
                      fontSize: 19,
                      color: "#0f172a",
                    }}
                  >
                    {m.name}
                  </p>

                  {/* Zone · Maturity */}
                  <p className="mt-1" style={{ fontSize: 11, color: "#94a3b8" }}>
                    {[m.zoneType, m.maturity].filter(Boolean).join(" · ")}
                  </p>

                  <hr className="my-3" style={{ borderColor: "#f1f5f9" }} />

                  {/* Price + Growth */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
                        {m.pricePerSqft != null
                          ? `₹${m.pricePerSqft.toLocaleString("en-IN")}`
                          : "—"}
                      </p>
                      <p style={{ fontSize: 10, color: "#94a3b8" }}>per sqft</p>
                    </div>
                    <div className="text-right">
                      {m.growthMin != null ? (
                        <>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#22c55e" }}>
                            {m.growthMin}
                            {m.growthMax != null ? `–${m.growthMax}` : ""}%
                          </p>
                          <p style={{ fontSize: 10, color: "#94a3b8" }}>annual</p>
                        </>
                      ) : num5yr != null ? (
                        <>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#22c55e" }}>
                            {num5yr}%
                          </p>
                          <p style={{ fontSize: 10, color: "#94a3b8" }}>5yr CAGR</p>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View all */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push("/hyderabad")}
            className="rounded-xl font-medium transition-all duration-200 hover:border-blue-300 hover:text-blue-600"
            style={{
              fontSize: 14,
              padding: "12px 24px",
              background: "white",
              border: "1px solid #e2e8f0",
              color: "#64748b",
            }}
          >
            View all 120 markets →
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Section: Featured Projects ───────────────────────────────────────────────

function statusStyle(s: string | null): { bg: string; color: string } {
  const v = (s ?? "").toLowerCase();
  if (v.includes("complet")) return { bg: "rgba(34,197,94,0.12)",  color: "#4ade80" };
  if (v.includes("construct"))  return { bg: "rgba(245,158,11,0.12)", color: "#fbbf24" };
  if (v.includes("new") || v.includes("launch")) return { bg: "rgba(59,130,246,0.12)", color: "#93c5fd" };
  if (v.includes("delay") || v.includes("expir")) return { bg: "rgba(239,68,68,0.12)", color: "#f87171" };
  return { bg: "rgba(148,163,184,0.1)", color: "#94a3b8" };
}

function fmtDate(d: string | null): string | null {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function ProjectCard({ p }: { p: FeaturedProject }) {
  const ss = statusStyle(p.currentStatus);
  const completion = fmtDate(p.proposedCompletion);

  return (
    <Link
      href={p.href}
      className="group flex-shrink-0 block"
      style={{ minWidth: 280, maxWidth: 320 }}
    >
      <div
        className="h-full rounded-2xl transition-all duration-250 group-hover:-translate-y-1"
        style={{
          background: "linear-gradient(145deg, #0d1829 0%, #0a0f1e 100%)",
          border: "1px solid rgba(59,130,246,0.15)",
          padding: "20px 20px 18px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.border = "1px solid rgba(59,130,246,0.4)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 40px rgba(59,130,246,0.12)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.border = "1px solid rgba(59,130,246,0.15)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.3)";
        }}
      >
        {/* ── Badge row ── */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {p.currentStatus && (
            <span
              style={{
                fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 100,
                background: ss.bg, color: ss.color,
                textTransform: "uppercase", letterSpacing: "0.07em",
              }}
            >
              {p.currentStatus}
            </span>
          )}
          {p.isHighrise && (
            <span
              style={{
                fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 100,
                background: "rgba(139,92,246,0.12)", color: "#c4b5fd",
                textTransform: "uppercase", letterSpacing: "0.07em",
              }}
            >
              Highrise
            </span>
          )}
          {p.developmentForm && (
            <span
              style={{
                fontSize: 9, fontWeight: 600, padding: "3px 8px", borderRadius: 100,
                background: "rgba(255,255,255,0.05)", color: "#64748b",
                textTransform: "uppercase", letterSpacing: "0.07em",
              }}
            >
              {p.developmentForm}
            </span>
          )}
        </div>

        {/* ── Project name ── */}
        <p
          className="line-clamp-2 leading-snug"
          style={{
            fontFamily: "var(--font-dm-serif, Georgia, serif)",
            fontSize: 20,
            color: "white",
            letterSpacing: "-0.01em",
          }}
        >
          {p.name}
        </p>

        {/* ── Developer ── */}
        {p.developerName && (
          <p className="mt-1.5 truncate" style={{ fontSize: 12, color: "#94a3b8" }}>
            {p.developerName}
            {p.isStrongDeveloper && (
              <span style={{ marginLeft: 6, color: "#3b82f6" }}>· Experienced</span>
            )}
          </p>
        )}

        {/* ── Divider ── */}
        <div style={{ margin: "16px 0", height: 1, background: "rgba(255,255,255,0.05)" }} />

        {/* ── Data rows ── */}
        <div className="flex flex-col gap-2.5">
          {p.reraId && (
            <div className="flex items-center justify-between gap-3">
              <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0 }}>RERA</span>
              <span
                className="truncate"
                style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", fontFamily: "monospace" }}
              >
                {p.reraId}
              </span>
            </div>
          )}
          {completion && (
            <div className="flex items-center justify-between gap-3">
              <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0 }}>Completion</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{completion}</span>
            </div>
          )}
          {p.priceText && (
            <div className="flex items-center justify-between gap-3">
              <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0 }}>Price</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{p.priceText}</span>
            </div>
          )}
          {p.microMarket && (
            <div className="flex items-center justify-between gap-3">
              <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0 }}>Location</span>
              <span className="flex items-center gap-1 truncate" style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>
                <MapPin className="h-2.5 w-2.5 flex-shrink-0" style={{ color: "#64748b" }} />
                {p.microMarket}
              </span>
            </div>
          )}
        </div>

        {/* ── Litigation warning ── */}
        {p.litigationFlag && (
          <div
            className="mt-3 flex items-center gap-1.5 rounded-lg"
            style={{
              padding: "6px 10px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.18)",
            }}
          >
            <span style={{ fontSize: 10, color: "#f87171" }}>⚠ Litigation reported — verify before committing</span>
          </div>
        )}

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-between mt-5 pt-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <span style={{ fontSize: 11, color: "#64748b" }}>RERA Verified</span>
          <span
            className="flex items-center gap-1 font-medium group-hover:text-blue-300 transition-colors"
            style={{ fontSize: 12, color: "#3b82f6" }}
          >
            View details <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function FeaturedProjectsSection({ projects }: { projects: FeaturedProject[] }) {
  return (
    <section style={{ background: "#f8fafc", padding: "72px 32px" }}>
      <div className="mx-auto" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", fontWeight: 600 }}>
              RERA Featured Projects
            </p>
            <h2
              className="mt-1"
              style={{
                fontFamily: "var(--font-dm-serif, Georgia, serif)",
                fontSize: "clamp(26px, 3vw, 36px)",
                color: "#0f172a",
                fontWeight: 400,
              }}
            >
              Projects worth your{" "}
              <em style={{ color: "#3b82f6" }}>attention</em>
            </h2>
            <p className="mt-1" style={{ fontSize: 14, color: "#64748b" }}>
              RERA-registered, promoter-verified, sorted by completion timeline
            </p>
          </div>
          <Link
            href="/hyderabad/projects"
            className="flex items-center gap-1 font-medium hover:text-blue-500 transition-colors"
            style={{ fontSize: 13, color: "#2563eb" }}
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Cards */}
        {projects.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center w-full py-16 rounded-xl"
            style={{ border: "1px dashed #e2e8f0", background: "white" }}
          >
            <Building2 className="h-8 w-8 mb-3" style={{ color: "#cbd5e1" }} />
            <p style={{ fontSize: 14, color: "#94a3b8" }}>No featured projects yet.</p>
            <p style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>
              Set <code>is_featured = true</code> on rows in <code>rera_projects</code> to show them here.
            </p>
          </div>
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
            {projects.map(p => <ProjectCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Section: CTA ─────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section style={{ background: "#0f172a", padding: "80px 32px" }}>
      <div className="mx-auto text-center" style={{ maxWidth: 560 }}>
        <p
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#475569",
            fontWeight: 600,
          }}
        >
          Ready to invest?
        </p>

        <h2
          className="mt-3"
          style={{
            fontFamily: "var(--font-dm-serif, Georgia, serif)",
            fontSize: "clamp(32px, 4vw, 46px)",
            color: "white",
            fontWeight: 400,
            lineHeight: 1.1,
          }}
        >
          Ready to buy<br />
          <em style={{ color: "#93c5fd" }}>the right property?</em>
        </h2>

        <p
          className="mt-4 mb-8"
          style={{ fontSize: 16, color: "#94a3b8", lineHeight: 1.75 }}
        >
          Our advisors have walked every street in Hyderabad. Get a free
          30-minute consultation — we&apos;ll map the right markets to your
          budget, timeline, and goals.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="https://wa.me/917702455243"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl font-semibold text-white transition-all duration-200"
            style={{ fontSize: 14, padding: "14px 24px", background: "#22c55e" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#4ade80")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#22c55e")}
          >
            <MessageCircle className="h-4 w-4" />
            💬 WhatsApp Us
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl transition-all duration-200"
            style={{
              fontSize: 14,
              padding: "14px 24px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#cbd5e1",
            }}
          >
            <Phone className="h-4 w-4" />
            Request Callback
          </Link>
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap justify-center gap-6 mt-8">
          {["✓ Free consultation", "✓ No obligation", "✓ RERA experts"].map(t => (
            <span key={t} style={{ fontSize: 12, color: "#475569" }}>{t}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function HomepageContent({
  tickerMarkets,
  heroMarkets,
  explorerMarkets,
  intel,
  projects,
}: HomepageData) {
  return (
    <>
      <style>{`
        /* Animations */
        @keyframes wsFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes wsPulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(0.82); }
        }
        @keyframes wsFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes wsGlowPulse {
          0%, 100% { box-shadow: 0 4px 14px rgba(59,130,246,0.30); }
          50%       { box-shadow: 0 4px 28px rgba(59,130,246,0.55); }
        }

        /* Animation helpers */
        .ws-fade-0 { animation: wsFadeUp 0.6s ease-out 0s    both; }
        .ws-fade-1 { animation: wsFadeUp 0.6s ease-out 0.15s both; }
        .ws-fade-2 { animation: wsFadeUp 0.6s ease-out 0.30s both; }
        .ws-fade-3 { animation: wsFadeUp 0.6s ease-out 0.45s both; }
        .ws-fade-4 { animation: wsFadeUp 0.6s ease-out 0.60s both; }
        .ws-pulse  { animation: wsPulseDot 2s ease-in-out infinite; }
        .ws-float  { animation: wsFloat 6s ease-in-out infinite; }
        .ws-glow-btn { animation: wsGlowPulse 3s ease-in-out infinite; }

        /* Hero layout */
        .ws-hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          align-items: center;
        }
        @media (min-width: 1024px) {
          .ws-hero-grid {
            grid-template-columns: 55fr 45fr;
            gap: 72px;
          }
        }
      `}</style>

      {/* Ticker — sticky below the 64px site header */}
      <div className="sticky top-16 z-40">
        <MarketTicker markets={tickerMarkets} />
      </div>

      <HeroSection markets={heroMarkets} />
      <GradientTransition />
      <IntelFeedSection intel={intel} />
      <MarketExplorerSection markets={explorerMarkets} />
      <FeaturedProjectsSection projects={projects} />
      <CTASection />
    </>
  );
}
