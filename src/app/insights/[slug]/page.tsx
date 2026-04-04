import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/common/SEO";
import { InsightsAdvisorCTA } from "../InsightsAdvisorCTA";

// ─── Design constants ─────────────────────────────────────────────────────────

const C = {
  bg: "#FAFAF7",
  bgCard: "#FFFFFF",
  bgWarm: "#F5F3EE",
  bgDark: "#1A1A1F",
  gold: "#B08D57",
  text: "#1A1A1F",
  textMuted: "#7A7A7E",
  border: "rgba(0,0,0,0.07)",
} as const;

// ─── Page meta per slug ───────────────────────────────────────────────────────

const PAGE_META: Record<
  string,
  { title: string; desc: string; badge?: string; summary?: string }
> = {
  "price-tracker": {
    title: "Price Tracker",
    desc: "Live price movements across Hyderabad micro-markets — updated daily from RERA filings.",
    badge: "LIVE",
    summary:
      "Real-time tracking of price per sqft across all major Hyderabad corridors, sourced from RERA filings and verified transaction data. Updated daily.",
  },
  reports: {
    title: "Quarterly Market Reports",
    desc: "Quarterly corridor analysis and deep-dive market reports for serious buyers.",
    summary:
      "Each quarter, our analysts compile corridor-level data covering new launches, absorption rates, price movements, and developer activity across Hyderabad's key micro-markets.",
  },
  outlook: {
    title: "5-Year Appreciation Outlook",
    desc: "AI-powered appreciation forecasts and investment scenarios by micro-market.",
    badge: "AI",
    summary:
      "Using RERA transaction data, employment density signals, and infrastructure pipeline analysis, our AI models project appreciation trajectories for each major Hyderabad corridor over a 5-year horizon.",
  },
  "buyers-guide": {
    title: "Hyderabad Buyer's Guide",
    desc: "End-to-end guide for Hyderabad home buyers — from RERA checks to registration.",
    summary:
      "A comprehensive guide covering every step of the home buying process in Hyderabad: RERA verification, developer due diligence, home loan process, stamp duty, registration, and possession checklist.",
  },
  rera: {
    title: "RERA Updates & Compliance",
    desc: "Latest regulatory changes, new project registrations, and compliance notices.",
    summary:
      "Weekly updates on new RERA project registrations, compliance notices, and regulatory changes affecting buyers and developers in Telangana.",
  },
};

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const meta = PAGE_META[params.slug];
  const title = meta
    ? `${meta.title} | Westside Realty Intelligence`
    : "Insights | Westside Realty";
  return { title };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InsightsSubPage({
  params,
}: {
  params: { slug: string };
}) {
  const meta = PAGE_META[params.slug];
  const title = meta?.title
    ?? params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const desc = meta?.desc ?? "This section is being updated with fresh data and analysis.";
  const badge = meta?.badge;
  const summary = meta?.summary ?? desc;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: desc,
    author: { "@type": "Organization", name: "Westside Realty" },
    publisher: {
      "@type": "Organization",
      name: "Westside Realty",
      logo: {
        "@type": "ImageObject",
        url: "https://www.westsiderealty.in/logo.png",
      },
    },
    url: `https://www.westsiderealty.in/insights/${params.slug}`,
  };

  return (
    <>
      <JsonLd jsonLd={articleSchema} />

      <style>{`
        .ins-article-body h2 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 28px;
          font-weight: 600;
          color: #1A1A1F;
          margin: 40px 0 16px;
          line-height: 1.3;
        }
        .ins-article-body h3 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 22px;
          font-weight: 600;
          color: #1A1A1F;
          margin: 32px 0 12px;
        }
        .ins-article-body p {
          font-family: 'Outfit', sans-serif;
          font-size: 17px;
          color: #1A1A1F;
          line-height: 1.85;
          margin: 0 0 24px;
        }
        .ins-article-body strong { font-weight: 600; }
        .ins-article-body ul { list-style: none; padding: 0; margin: 0 0 24px; }
        .ins-article-body ul li {
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          color: #1A1A1F;
          line-height: 1.8;
          padding-left: 24px;
          position: relative;
          margin-bottom: 8px;
        }
        .ins-article-body ul li::before {
          content: '◆';
          position: absolute;
          left: 0;
          color: #B08D57;
          font-size: 10px;
          top: 6px;
        }
        .ins-article-body a { color: #B08D57; text-decoration: none; }
        .ins-article-body a:hover { text-decoration: underline; }
        .ins-article-body img { width: 100%; border-radius: 12px; margin: 32px 0; display: block; }
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
              "radial-gradient(ellipse 60% 60% at 70% 40%, rgba(176,141,87,0.09) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "100px 24px 64px",
            position: "relative",
          }}
        >
          <Link
            href="/insights"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13,
              color: "rgba(255,255,255,0.4)",
              textDecoration: "none",
              display: "inline-block",
              marginBottom: 24,
            }}
          >
            ← Back to Research
          </Link>

          {/* Research report label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
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
            {badge && (
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  background:
                    badge === "LIVE"
                      ? "rgba(34,197,94,0.15)"
                      : "rgba(139,92,246,0.15)",
                  color: badge === "LIVE" ? "#4ade80" : "#c4b5fd",
                  border: `1px solid ${
                    badge === "LIVE"
                      ? "rgba(34,197,94,0.3)"
                      : "rgba(139,92,246,0.3)"
                  }`,
                  borderRadius: 20,
                  padding: "3px 10px",
                }}
              >
                {badge}
              </span>
            )}
          </div>

          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(32px,5vw,52px)",
              fontWeight: 600,
              color: "#fff",
              lineHeight: 1.2,
              margin: "0 0 16px",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 18,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.6,
              maxWidth: 580,
              margin: 0,
            }}
          >
            {desc}
          </p>
        </div>
      </section>

      {/* ── Executive Summary ─────────────────────────────────────────────── */}
      <section style={{ background: C.bg, padding: "48px 24px 0" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div
            style={{
              background: C.bgCard,
              borderLeft: `4px solid ${C.gold}`,
              padding: "24px 28px",
              borderRadius: "0 12px 12px 0",
            }}
          >
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: C.gold,
                margin: "0 0 12px",
              }}
            >
              Executive Summary
            </p>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 15,
                color: C.text,
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {summary}
            </p>
          </div>
        </div>
      </section>

      {/* ── Body: Coming soon ─────────────────────────────────────────────── */}
      <section style={{ background: C.bg, padding: "48px 24px 80px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div
            style={{
              background: C.bgWarm,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: "48px 32px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 22,
                fontWeight: 600,
                color: C.text,
                margin: "0 0 12px",
              }}
            >
              Full report publishing soon
            </p>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                color: C.textMuted,
                lineHeight: 1.7,
                margin: "0 0 24px",
              }}
            >
              Our analysts are finalising this section. In the meantime, our AI
              advisor can answer your specific questions about this topic.
            </p>
            <Link
              href="/contact"
              style={{
                display: "inline-block",
                background: C.gold,
                color: "#fff",
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                padding: "10px 24px",
                borderRadius: 999,
                textDecoration: "none",
              }}
            >
              Talk to an expert →
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI Advisor CTA ────────────────────────────────────────────────── */}
      <InsightsAdvisorCTA />
    </>
  );
}
