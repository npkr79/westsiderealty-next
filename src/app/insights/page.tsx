import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { InsightsAdvisorCTA } from "./InsightsAdvisorCTA";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export const metadata: Metadata = {
  title: "Market Insights | Westside Realty Intelligence",
  description: "Market analysis, price trends, and buyer guides for Hyderabad real estate.",
};

export const revalidate = 3600;

interface BlogArticlePreview {
  slug: string;
  title: string;
  description: string;
  image_url: string | null;
  category: string | null;
  read_time: string | null;
  date: string | null;
}

async function getPublishedArticles(): Promise<BlogArticlePreview[]> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("blog_articles")
      .select("slug, title, description, image_url, category, read_time, date")
      .eq("status", "published")
      .order("date", { ascending: false })
      .limit(12);
    return data ?? [];
  } catch {
    return [];
  }
}

// ─── Design constants ─────────────────────────────────────────────────────────

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

// ─── Report data ──────────────────────────────────────────────────────────────

const REPORTS = [
  {
    href: "/insights/gcc-hyderabad",
    title: "The GCC Rush: Hyderabad's Rise as India's GCC Capital",
    desc: "In 2024–25, more Global Capability Centres opened in Hyderabad than any other Indian city. What's driving the rush — and what it means for property prices.",
    tags: ["GCC", "Employment", "Market Analysis"],
    date: "March 2026",
    badge: "NEW",
  },
  {
    href: "/insights/institutional-investors",
    title: "Why Institutional Investors Are Choosing Hyderabad",
    desc: "Global REITs, sovereign wealth funds, and PE firms are deploying billions into Hyderabad commercial real estate. The reasons are structural, not speculative.",
    tags: ["Institutional Capital", "Commercial", "Investment"],
    date: "March 2026",
    badge: "NEW",
  },
  {
    href: "/insights/price-tracker",
    title: "Price Tracker",
    desc: "Live price movements across Hyderabad micro-markets — updated daily from RERA filings.",
    tags: ["Pricing", "RERA", "Market Data"],
    date: "Updated Daily",
    badge: "LIVE",
  },
  {
    href: "/insights/outlook",
    title: "5-Year Appreciation Outlook",
    desc: "AI-powered appreciation forecasts and investment scenarios by micro-market and corridor.",
    tags: ["Forecasting", "AI Analysis", "Investment"],
    date: "Q1 2026",
    badge: "AI",
  },
  {
    href: "/insights/buyers-guide",
    title: "Hyderabad Buyer's Guide",
    desc: "End-to-end guide for Hyderabad home buyers — from RERA checks to registration and stamp duty.",
    tags: ["Buyer Guide", "RERA", "Residential"],
    date: "2026 Edition",
  },
  {
    href: "/insights/rera",
    title: "RERA Updates & Compliance",
    desc: "Latest regulatory changes, new project registrations, and compliance notices affecting buyers.",
    tags: ["RERA", "Regulation", "Compliance"],
    date: "Updated Weekly",
  },
  {
    href: "/insights/reports",
    title: "Quarterly Market Reports",
    desc: "Corridor analysis, absorption data, and new launch intelligence — compiled each quarter.",
    tags: ["Quarterly Report", "Market Analysis", "Residential"],
    date: "Q1 2026",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InsightsPage() {
  const blogArticles = await getPublishedArticles();

  return (
    <>
      <style>{`
        .report-card {
          transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s;
        }
        .report-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.10);
          border-color: rgba(176,141,87,0.3) !important;
        }
        @media (max-width: 768px) {
          .reports-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Section 1: Hero ───────────────────────────────────────────────── */}
      <section
        style={{
          background: C.bgDark,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 70% at 30% 50%, rgba(176,141,87,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "100px 24px 80px",
            position: "relative",
          }}
        >
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.4)",
              margin: "0 0 16px",
            }}
          >
            Research &amp; Intelligence
          </p>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(44px,6vw,80px)",
              fontWeight: 600,
              color: "#fff",
              lineHeight: 1.05,
              margin: "0 0 20px",
            }}
          >
            Westside Intelligence
          </h1>
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 18,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.6,
              maxWidth: 640,
              margin: 0,
            }}
          >
            Institutional-grade research on Hyderabad real estate — written for
            serious buyers and investors.
          </p>
        </div>
      </section>

      {/* ── Section 2: Report Cards ───────────────────────────────────────── */}
      <section style={{ background: C.bg, padding: "72px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            className="reports-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 32,
            }}
          >
            {REPORTS.map((report) => (
              <Link
                key={report.href}
                href={report.href}
                className="report-card"
                style={{
                  display: "block",
                  background: C.bgCard,
                  border: `1px solid ${C.border}`,
                  borderRadius: 20,
                  padding: 36,
                  position: "relative",
                  textDecoration: "none",
                }}
              >
                {/* Label row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color: C.gold,
                    }}
                  >
                    Research Report
                  </span>
                  {report.badge && (
                    <span
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        background:
                          report.badge === "LIVE"
                            ? "rgba(34,197,94,0.12)"
                            : report.badge === "AI"
                            ? "rgba(139,92,246,0.12)"
                            : "rgba(176,141,87,0.12)",
                        color:
                          report.badge === "LIVE"
                            ? "#4ade80"
                            : report.badge === "AI"
                            ? "#c4b5fd"
                            : C.goldLight,
                        border: `1px solid ${
                          report.badge === "LIVE"
                            ? "rgba(34,197,94,0.3)"
                            : report.badge === "AI"
                            ? "rgba(139,92,246,0.3)"
                            : "rgba(176,141,87,0.3)"
                        }`,
                        borderRadius: 20,
                        padding: "3px 10px",
                      }}
                    >
                      {report.badge}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: 26,
                    fontWeight: 600,
                    color: C.text,
                    lineHeight: 1.2,
                    margin: "0 0 12px",
                  }}
                >
                  {report.title}
                </h2>

                {/* Description */}
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 15,
                    color: C.textMuted,
                    lineHeight: 1.7,
                    margin: "0 0 16px",
                  }}
                >
                  {report.desc.slice(0, 200)}
                </p>

                {/* Tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                  {report.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        background: C.bgWarm,
                        border: `1px solid ${C.border}`,
                        borderRadius: 20,
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 12,
                        color: C.textMuted,
                        padding: "4px 12px",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Bottom row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTop: `1px solid ${C.border}`,
                    paddingTop: 16,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 12,
                      color: C.textMuted,
                    }}
                  >
                    {report.date || "Available Now"}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13,
                      fontWeight: 500,
                      color: C.gold,
                    }}
                  >
                    Read Report →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Blog Articles ──────────────────────────────────────── */}
      {blogArticles.length > 0 && (
        <section style={{ background: C.bgWarm, padding: "72px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ marginBottom: 48 }}>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em", color: C.gold, margin: "0 0 8px" }}>
                Market Intelligence
              </p>
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px,4vw,44px)", fontWeight: 600, color: C.text, margin: 0, lineHeight: 1.2 }}>
                Research &amp; Analysis
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 28,
              }}
            >
              {blogArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/insights/${article.slug}`}
                  className="report-card"
                  style={{
                    display: "block",
                    background: C.bgCard,
                    border: `1px solid ${C.border}`,
                    borderRadius: 20,
                    overflow: "hidden",
                    textDecoration: "none",
                  }}
                >
                  {article.image_url && (
                    <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
                      <Image
                        src={article.image_url}
                        alt={article.title}
                        fill
                        style={{ objectFit: "cover" }}
                        unoptimized
                      />
                    </div>
                  )}
                  <div style={{ padding: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      {article.category && (
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: C.gold }}>
                          {article.category}
                        </span>
                      )}
                      {article.read_time && (
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted }}>
                          · {article.read_time}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 600, color: C.text, lineHeight: 1.25, margin: "0 0 10px" }}>
                      {article.title}
                    </h3>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.textMuted, lineHeight: 1.65, margin: "0 0 20px" }}>
                      {article.description.slice(0, 140)}{article.description.length > 140 ? "…" : ""}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                      {article.date && (
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted }}>
                          {new Date(article.date).toLocaleDateString("en-IN", { year: "numeric", month: "short" })}
                        </span>
                      )}
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 500, color: C.gold }}>
                        Read Article →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 4: AI Advisor CTA ─────────────────────────────────────── */}
      <InsightsAdvisorCTA />
    </>
  );
}
