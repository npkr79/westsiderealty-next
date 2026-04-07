import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { cityService } from "@/services/cityService";
import { projectService } from "@/services/projectService";
import type { MicroMarketGridItem } from "@/services/microMarketService";
import { UnifiedPropertyService } from "@/services/unifiedPropertyService";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import { generateUnifiedSchema } from "@/lib/seo-utils";
import { optimizeSupabaseImage } from "@/utils/imageOptimization";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { buildProjectUrl, buildProjectsIndexUrl } from "@/lib/routes";
import { CityAdvisorCTA } from "./CityAdvisorCTA";
import type { AdvisorChip } from "./CityAdvisorCTA";
import { CityFaqAccordion } from "./CityFaqAccordion";

// ─── Design System ────────────────────────────────────────────────────────────

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

// ─── Helper components (server-renderable, no state) ──────────────────────────

function SectionHeading({
  eyebrow,
  title,
  sub,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  dark?: boolean;
}) {
  return (
    <div style={{ marginBottom: 40 }}>
      <p
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase" as const,
          letterSpacing: "0.2em",
          color: C.gold,
          marginBottom: 10,
        }}
      >
        {eyebrow}
      </p>
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "clamp(26px, 3vw, 36px)",
          fontWeight: 600,
          color: dark ? "#fff" : C.text,
          margin: "0 0 6px",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 14,
            color: dark ? "rgba(255,255,255,0.5)" : C.textMuted,
            margin: 0,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: "center", padding: "16px 28px" }}>
      <p
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "clamp(24px, 3vw, 32px)",
          fontWeight: 600,
          color: C.goldLight,
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 11,
          textTransform: "uppercase" as const,
          letterSpacing: "0.16em",
          color: "rgba(255,255,255,0.45)",
          marginTop: 6,
          margin: "6px 0 0",
        }}
      >
        {label}
      </p>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ citySlug: string }>;
}

type TopDevRow = {
  brand_name: string;
  url_slug: string | null;
  total_projects: number | null;
  is_premium: boolean | null;
  institutional_grade: boolean | null;
};

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citySlug: citySlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const city = await cityService.getCityBySlug(citySlug);

  if (!city) {
    return { title: "City Not Found" };
  }

  const canonicalUrl = city.canonical_url || `https://www.westsiderealty.in/${citySlug}`;
  const seoTitle =
    city.seo_title ||
    `Real Estate in ${city.city_name}: Top Projects & Investment Hotspots | RE/MAX`;
  const seoDescription =
    city.meta_description ||
    `Explore premium real estate opportunities in ${city.city_name}. Discover top projects, investment hotspots, and luxury properties.`;

  const rawOgImage = city.hero_image_url || "https://www.westsiderealty.in/placeholder.svg";
  const optimizedOgImage = optimizeSupabaseImage(rawOgImage, {
    width: 1200,
    height: 630,
    quality: 80,
    format: "webp",
  });

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      siteName: "RE/MAX Westside Realty",
      type: "website",
      locale: "en_IN",
      images: [{ url: optimizedOgImage, width: 1200, height: 630, alt: `Real Estate in ${city.city_name}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: [optimizedOgImage],
    },
  };
}

// ─── Static Params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const { createBuildClient } = await import("@/lib/supabase/buildClient");
  const supabase = createBuildClient();
  const { data: cities } = await supabase
    .from("cities")
    .select("url_slug")
    .eq("page_status", "published");
  return cities?.map((city) => ({ citySlug: city.url_slug })) || [];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CityPage({ params }: PageProps) {
  const { citySlug: citySlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const slug = citySlug || "hyderabad";

  // ── Landing page redirect check ────────────────────────────────────────────
  // Uses service client (no cookies) so this works during ISR/static generation.
  try {
    const landingCheckClient = createServiceClient();
    const { data: landingPage } = await landingCheckClient
      .from("landing_pages")
      .select("uri, status")
      .eq("uri", slug)
      .eq("status", "published")
      .maybeSingle();
    if (landingPage) {
      const { redirect } = await import("next/navigation");
      redirect(`/landing/${slug}`);
    }
  } catch (e) {
    console.error("[CityPage] Landing page check failed:", e);
  }

  // ── City ───────────────────────────────────────────────────────────────────
  const city = await cityService.getCityBySlug(slug);
  if (!city) notFound();

  // ── Core data (existing logic — unchanged) ─────────────────────────────────
  let featuredProjects: Awaited<ReturnType<typeof projectService.getProjectsByCity>> = [];
  let featuredGoaProperties: Awaited<ReturnType<typeof UnifiedPropertyService.getProperties>> = [];
  let microMarkets: MicroMarketGridItem[] = [];
  let totalListings = 0;

  const isGoa = city.city_name.toLowerCase() === "goa";

  if (isGoa) {
    featuredGoaProperties = await UnifiedPropertyService.getProperties("goa");
    featuredGoaProperties = featuredGoaProperties.filter((p) => p.is_featured).slice(0, 6);
    const goaProjects = await projectService.getProjectsByCity(city.id, true);
    featuredProjects = goaProjects.slice(0, 6);
  } else {
    const projects = await projectService.getProjectsByCity(city.id, true);
    featuredProjects = projects.slice(0, 6);

    const { microMarketService } = await import("@/services/microMarketService");
    const markets = await microMarketService.getMicroMarketsByCity(slug);
    microMarkets = Array.isArray(markets) ? markets : [];

    if (slug === "hyderabad") {
      totalListings = await cityService.getPublishedPropertyCount(slug);
    }
  }

  // ── Additional data (new — rera count + top developers) ────────────────────
  const pageDataClient = createServiceClient();
  const [reraCountResult, topDevsResult] = await Promise.all([
    pageDataClient
      .from("rera_projects")
      .select("id", { count: "exact", head: true })
      .eq("city_slug", slug),
    pageDataClient
      .from("v_developer_brand_profile")
      .select("brand_name, url_slug, total_projects, is_premium, institutional_grade")
      .order("total_projects", { ascending: false })
      .limit(6),
  ]);
  const reraProjectCount = reraCountResult.count;
  const topDevs: TopDevRow[] = (topDevsResult.data as TopDevRow[] | null) ?? [];

  // ── Existing derived values (unchanged) ────────────────────────────────────
  const faqs = Array.isArray(city.city_faqs_json) ? city.city_faqs_json : [];
  const canonicalUrl = city.canonical_url || `https://www.westsiderealty.in/${slug}`;

  const faqItems: { question: string; answer: string }[] = [];
  if (Array.isArray(faqs) && faqs.length > 0) {
    faqs.forEach((faq: Record<string, unknown>) => {
      const question = (faq.question || faq.q || faq.title || "") as string;
      const rawAnswer = faq.answer || faq.a || faq.description || faq.content || "";
      const answer = typeof rawAnswer === "string"
        ? rawAnswer.replace(/<[^>]*>/g, "")
        : String(rawAnswer);
      if (question && answer) faqItems.push({ question, answer });
    });
  }

  const primaryEntity: Record<string, unknown> = {
    "@type": "CollectionPage",
    name: city.h1_title || `Real Estate in ${city.city_name}`,
    description: city.meta_description || `Explore premium real estate opportunities in ${city.city_name}`,
    url: canonicalUrl,
    ...(microMarkets.length > 0 && {
      areaServed: microMarkets.map((m) => ({ "@type": "City", name: m.micro_market_name })),
    }),
  };

  const unifiedSchema = generateUnifiedSchema({
    pageUrl: canonicalUrl,
    title: city.h1_title || `Real Estate in ${city.city_name}`,
    description: city.meta_description || `Explore premium real estate opportunities in ${city.city_name}`,
    heroImageUrl: city.hero_image_url || undefined,
    primaryEntityType: "CollectionPage",
    primaryEntity,
    faqItems,
    breadcrumbs: [
      { name: "Home", item: "https://www.westsiderealty.in" },
      { name: city.city_name, item: canonicalUrl },
    ],
  });

  // ── New derived data for redesigned sections ────────────────────────────────

  // Hero tagline
  const heroTagline = (() => {
    const raw = city.hero_hook || "";
    if (raw.length > 0) return raw.length > 120 ? raw.slice(0, 120) + "…" : raw;
    if (isGoa) return "India's most sought-after holiday and investment destination";
    if (slug === "hyderabad")
      return "India's fastest-growing IT capital — where premium real estate meets outsized returns";
    return `Discover premium real estate opportunities in ${city.city_name}`;
  })();

  // Sorted micro-markets (premium-first by price_per_sqft_max, top 6)
  const sortedMarkets = [...microMarkets]
    .sort((a, b) => (b.price_per_sqft_max ?? 0) - (a.price_per_sqft_max ?? 0))
    .slice(0, 6);

  // Hero stats
  const heroProjectsLabel = reraProjectCount
    ? `${reraProjectCount.toLocaleString("en-IN")}+`
    : slug === "hyderabad"
    ? "1,000+"
    : "100+";
  const heroAppreciationLabel =
    city.annual_appreciation_pct != null
      ? `${city.annual_appreciation_pct}%`
      : slug === "hyderabad"
      ? "12%"
      : null;

  // Stats bar
  const statProjectCount = reraProjectCount
    ? reraProjectCount.toLocaleString("en-IN")
    : null;
  const statAvgPsf =
    city.average_price_sqft != null
      ? `₹${city.average_price_sqft.toLocaleString("en-IN")}`
      : slug === "hyderabad"
      ? "₹9,500+"
      : null;
  const statAppreciation =
    city.annual_appreciation_pct != null
      ? `${city.annual_appreciation_pct}%`
      : slug === "hyderabad"
      ? "12%"
      : null;
  const statRentalYield =
    city.rental_yield_pct != null
      ? `${city.rental_yield_pct}%`
      : slug === "hyderabad"
      ? "5.0%"
      : null;
  const statMarketCount = microMarkets.length > 0 ? String(microMarkets.length) : null;

  // Why-this-city cards
  type WhyCard = { icon: string; title: string; body: string };
  const whyCards: WhyCard[] =
    slug === "hyderabad"
      ? [
          {
            icon: "⬡",
            title: "IT Capital of India",
            body: "Home to 1,500+ MNCs and the fastest-growing GCC hub in Asia — driving sustained demand for premium residential real estate.",
          },
          {
            icon: "↑",
            title: "Outsized Appreciation",
            body: "West Hyderabad micro-markets have delivered 64% appreciation over 5 years — outperforming Mumbai, Pune, and Bengaluru.",
          },
          {
            icon: "◈",
            title: "Buyer-Friendly Regulations",
            body: "Telangana RERA provides India's most transparent project registration system — full escrow protection and delivery accountability.",
          },
        ]
      : isGoa
      ? [
          {
            icon: "⬡",
            title: "Holiday + Investment",
            body: "India's only market where you earn holiday rental income while your asset appreciates in a supply-constrained coastal market.",
          },
          {
            icon: "↑",
            title: "International Buyer Magnet",
            body: "Rising NRI and foreign investor demand is creating a two-speed market — premium coastal projects appreciating faster than ever.",
          },
          {
            icon: "◈",
            title: "Lifestyle Premium",
            body: "Portugal-inspired architecture, beach proximity, and Goa's unique freehold land ownership make this a generational asset class.",
          },
        ]
      : [
          {
            icon: "⬡",
            title: "Growing Market",
            body: `${city.city_name} offers excellent real estate opportunities with strong fundamentals and growing infrastructure investment.`,
          },
          {
            icon: "↑",
            title: "Capital Appreciation",
            body: "Property values in established corridors have shown consistent appreciation driven by infrastructure growth and buyer demand.",
          },
          {
            icon: "◈",
            title: "RERA Protection",
            body: "All projects are RERA-registered, ensuring full buyer protection and delivery accountability across every market.",
          },
        ];

  // Advisor CTA chips
  const advisorChips: AdvisorChip[] = isGoa
    ? [
        { label: "Best areas to buy a villa in Goa for rental income?", message: "Best areas to buy a villa in Goa for rental income?" },
        { label: "Price difference between North and South Goa?", message: "What's the price difference between North and South Goa?" },
        { label: "Can NRIs buy property in Goa?", message: "Can NRIs buy property in Goa?" },
      ]
    : slug === "hyderabad"
    ? [
        { label: "Which micro-market is best for investment?", message: "Which Hyderabad micro-market is best for investment?" },
        { label: "Price trend in Kondapur right now?", message: "What's the price trend in Kondapur right now?" },
        { label: "Best 3 BHK projects under ₹1.5 Cr?", message: "Best 3 BHK projects under ₹1.5 Cr in Hyderabad?" },
      ]
    : [
        { label: `Best area in ${city.city_name} to invest?`, message: `What's the best area in ${city.city_name} to invest?` },
        { label: `Typical prices in ${city.city_name}?`, message: `What are typical prices in ${city.city_name}?` },
        { label: `Ready to move projects in ${city.city_name}?`, message: `Which projects are ready to move in ${city.city_name}?` },
      ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <JsonLd jsonLd={unifiedSchema} />

      <style>{`
        /* ── Keyframes ── */
        @keyframes ch-fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ch-bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(8px); }
        }

        /* ── Card base ── */
        .ch-fade { opacity: 0; animation: ch-fadeUp 0.5s ease forwards; }

        /* ── Micro-market card ── */
        .ch-mm-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
          cursor: pointer;
        }
        .ch-mm-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.10);
          border-color: rgba(176,141,87,0.35) !important;
        }
        .ch-mm-card:hover .ch-mm-explore { color: #C9A96E !important; }

        /* ── Project card ── */
        .ch-proj-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .ch-proj-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.10);
          border-color: rgba(176,141,87,0.3) !important;
        }
        .ch-proj-card:hover .ch-proj-name { color: #B08D57; }

        /* ── Developer card ── */
        .ch-dev-card {
          transition: border-color 0.18s ease, transform 0.18s ease;
        }
        .ch-dev-card:hover {
          border-color: #B08D57 !important;
          transform: translateY(-2px);
        }

        /* ── View-all link ── */
        .ch-view-all { transition: color 0.15s; }
        .ch-view-all:hover { color: #C9A96E !important; }

        /* ── Browse button ── */
        .ch-browse-btn {
          transition: background 0.18s, transform 0.15s;
        }
        .ch-browse-btn:hover {
          background: #B08D57 !important;
          transform: translateY(-1px);
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .ch-mm-grid   { grid-template-columns: repeat(2, 1fr) !important; }
          .ch-proj-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .ch-why-grid  { grid-template-columns: repeat(2, 1fr) !important; }
          .ch-dev-grid  { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .ch-mm-grid   { grid-template-columns: 1fr !important; }
          .ch-proj-grid { grid-template-columns: 1fr !important; }
          .ch-why-grid  { grid-template-columns: 1fr !important; }
          .ch-dev-grid  { grid-template-columns: repeat(2, 1fr) !important; }
          .ch-stats-flex { flex-direction: column !important; gap: 0 !important; }
          .ch-stats-flex > div { border-bottom: 1px solid rgba(255,255,255,0.06); }
        }
        @media (max-width: 480px) {
          .ch-dev-grid  { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <main
        style={{
          background: C.bg,
          fontFamily: "'Outfit', sans-serif",
          color: C.text,
          overflowX: "hidden",
        }}
      >

        {/* ══════════════════════════════════════════════════════════
            SECTION 1 — HERO (bgDark, 70vh)
        ══════════════════════════════════════════════════════════ */}
        <section
          style={{
            background: C.bgDark,
            minHeight: "70vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Radial gradient texture */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at 30% 50%, rgba(176,141,87,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(45,106,79,0.05) 0%, transparent 50%)",
              pointerEvents: "none",
            }}
          />

          {/* Content */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              maxWidth: 900,
              padding: "80px 24px 64px",
              paddingTop: 108,
            }}
          >
            {/* Eyebrow */}
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: C.gold,
                marginBottom: 14,
              }}
            >
              {city.country || "India"} · Real Estate
            </p>

            {/* City name */}
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(52px, 8vw, 96px)",
                fontWeight: 600,
                color: "#fff",
                margin: "0 0 20px",
                lineHeight: 1.05,
              }}
            >
              {city.city_name}
            </h1>

            {/* Tagline */}
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "clamp(16px, 2vw, 20px)",
                color: "rgba(255,255,255,0.6)",
                maxWidth: 600,
                lineHeight: 1.55,
                margin: "0 0 44px",
              }}
            >
              {heroTagline}
            </p>

            {/* Hero stats row */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 40,
                paddingTop: 28,
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {microMarkets.length > 0 && (
                <div>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "clamp(28px, 3vw, 36px)",
                      fontWeight: 600,
                      color: C.goldLight,
                      margin: 0,
                      lineHeight: 1.1,
                    }}
                  >
                    {microMarkets.length}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.16em",
                      color: "rgba(255,255,255,0.45)",
                      marginTop: 6,
                    }}
                  >
                    Micro-Markets
                  </p>
                </div>
              )}

              <div>
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "clamp(28px, 3vw, 36px)",
                    fontWeight: 600,
                    color: C.goldLight,
                    margin: 0,
                    lineHeight: 1.1,
                  }}
                >
                  {heroProjectsLabel}
                </p>
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    color: "rgba(255,255,255,0.45)",
                    marginTop: 6,
                  }}
                >
                  Projects
                </p>
              </div>

              {heroAppreciationLabel && (
                <div>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "clamp(28px, 3vw, 36px)",
                      fontWeight: 600,
                      color: C.goldLight,
                      margin: 0,
                      lineHeight: 1.1,
                    }}
                  >
                    {heroAppreciationLabel}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.16em",
                      color: "rgba(255,255,255,0.45)",
                      marginTop: 6,
                    }}
                  >
                    Avg Appreciation
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            style={{
              position: "absolute",
              bottom: 28,
              left: "50%",
              animation: "ch-bounce 1.8s ease-in-out infinite",
              color: "rgba(255,255,255,0.3)",
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ↓
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 2 — MICRO-MARKETS (bg)
        ══════════════════════════════════════════════════════════ */}
        {sortedMarkets.length > 0 && (
          <section style={{ background: C.bg, padding: "72px 24px" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <SectionHeading
                eyebrow="Explore Micro-Markets"
                title="Choose your neighbourhood"
                sub={`RERA-verified data across ${city.city_name}'s top micro-markets`}
              />

              <div
                className="ch-mm-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 24,
                }}
              >
                {sortedMarkets.map((market, idx) => (
                  <Link
                    key={market.url_slug}
                    href={`/${slug}/${market.url_slug}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      className="ch-fade ch-mm-card"
                      style={{
                        background: C.bgCard,
                        border: `1px solid ${C.border}`,
                        borderRadius: 16,
                        overflow: "hidden",
                        animationDelay: `${idx * 0.07}s`,
                      }}
                    >
                      {/* Accent stripe */}
                      <div
                        style={{
                          height: 5,
                          background: `linear-gradient(90deg, ${C.gold}, ${C.accent})`,
                        }}
                      />

                      {/* Card body */}
                      <div style={{ padding: 24 }}>
                        <h3
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontSize: 22,
                            fontWeight: 600,
                            color: C.text,
                            margin: "0 0 8px",
                            lineHeight: 1.25,
                          }}
                        >
                          {market.micro_market_name}
                        </h3>

                        {/* Price range */}
                        {(market.price_per_sqft_min || market.price_per_sqft_max) && (
                          <p
                            style={{
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: 18,
                              color: C.gold,
                              margin: "0 0 12px",
                            }}
                          >
                            {market.price_per_sqft_min && market.price_per_sqft_max
                              ? `₹${market.price_per_sqft_min.toLocaleString("en-IN")} – ${market.price_per_sqft_max.toLocaleString("en-IN")} /sqft`
                              : market.price_per_sqft_min
                              ? `₹${market.price_per_sqft_min.toLocaleString("en-IN")}+/sqft`
                              : `Up to ₹${market.price_per_sqft_max!.toLocaleString("en-IN")}/sqft`}
                          </p>
                        )}

                        {/* Appreciation badge */}
                        {market.annual_appreciation_min != null && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "3px 10px",
                              borderRadius: 999,
                              background: "rgba(45,106,79,0.09)",
                              border: "1px solid rgba(45,106,79,0.2)",
                              color: C.accent,
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: 12,
                              fontWeight: 500,
                              marginBottom: 12,
                            }}
                          >
                            ↑ {market.annual_appreciation_min}% YoY
                          </span>
                        )}

                        {/* Hero hook */}
                        {market.hero_hook && (
                          <p
                            style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: 13,
                              color: C.textMuted,
                              lineHeight: 1.6,
                              margin: "8px 0 0",
                            }}
                          >
                            {market.hero_hook
                              .replace(/<[^>]*>/g, " ")
                              .replace(/\s+/g, " ")
                              .trim()
                              .slice(0, 90)}
                            {market.hero_hook.replace(/<[^>]*>/g, "").length > 90 ? "…" : ""}
                          </p>
                        )}

                        {/* Bottom explore */}
                        <div
                          style={{
                            marginTop: 16,
                            paddingTop: 16,
                            borderTop: `1px solid ${C.border}`,
                          }}
                        >
                          <span
                            className="ch-mm-explore"
                            style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: 13,
                              fontWeight: 500,
                              color: C.gold,
                              transition: "color 0.15s",
                            }}
                          >
                            Explore →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* View all link */}
              <div style={{ textAlign: "center", marginTop: 36 }}>
                <Link
                  href={`/${slug}/micro-markets`}
                  className="ch-view-all"
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    color: C.gold,
                    textDecoration: "none",
                  }}
                >
                  View all {microMarkets.length > 6 ? microMarkets.length + " " : ""}micro-markets →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            SECTION 3 — STATS BAR (bgDark)
        ══════════════════════════════════════════════════════════ */}
        <section style={{ background: C.bgDark, padding: "48px 24px" }}>
          <div
            className="ch-stats-flex"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 8,
              maxWidth: 1100,
              margin: "0 auto",
            }}
          >
            {statProjectCount && (
              <StatPill value={statProjectCount} label="RERA Projects" />
            )}
            {statAvgPsf && (
              <StatPill value={statAvgPsf} label="Avg Price / sqft" />
            )}
            {statAppreciation && (
              <StatPill value={statAppreciation} label="Avg Appreciation" />
            )}
            {statRentalYield && (
              <StatPill value={statRentalYield} label="Rental Yield" />
            )}
            {statMarketCount && (
              <StatPill value={statMarketCount} label="Micro-Markets" />
            )}
            {totalListings > 0 && (
              <StatPill
                value={`${totalListings.toLocaleString("en-IN")}+`}
                label="Active Listings"
              />
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 4 — FEATURED PROJECTS (bgWarm)
        ══════════════════════════════════════════════════════════ */}
        {featuredProjects.length > 0 && (
          <section style={{ background: C.bgWarm, padding: "72px 24px" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  marginBottom: 40,
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <SectionHeading
                  eyebrow="Featured"
                  title={`Trending Projects in ${city.city_name}`}
                  sub="Handpicked by our advisors"
                />
                <Link
                  href={buildProjectsIndexUrl(slug)}
                  className="ch-view-all"
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: C.gold,
                    textDecoration: "none",
                    flexShrink: 0,
                    paddingBottom: 40,
                  }}
                >
                  View all projects →
                </Link>
              </div>

              <div
                className="ch-proj-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 24,
                }}
              >
                {featuredProjects.map((project, idx) => {
                  const p = project as unknown as Record<string, unknown>;
                  const name = (p.project_name as string) || "";
                  const urlSlug = (p.url_slug as string) || null;
                  const heroImg = (p.hero_image_url as string | null) || null;
                  const devName =
                    (p.display_developer_name as string | null) ||
                    ((p.developer as Record<string, unknown> | null)
                      ?.developer_name as string | null) ||
                    null;
                  const mmName =
                    ((p.micro_market as Record<string, unknown> | null)
                      ?.micro_market_name as string | null) || null;
                  const priceText = (p.price_range_text as string | null) || null;
                  const href = urlSlug
                    ? buildProjectUrl(slug, urlSlug)
                    : buildProjectsIndexUrl(slug);

                  return (
                    <Link
                      key={(p.id as string) || idx}
                      href={href}
                      style={{ textDecoration: "none" }}
                    >
                      <div
                        className="ch-fade ch-proj-card"
                        style={{
                          background: C.bgCard,
                          borderRadius: 14,
                          border: `1px solid ${C.border}`,
                          overflow: "hidden",
                          animationDelay: `${idx * 0.07}s`,
                        }}
                      >
                        {/* Image */}
                        <div
                          style={{
                            height: 180,
                            background: "#E8E4DC",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          {heroImg ? (
                            <img
                              src={heroImg}
                              alt={name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background:
                                  "linear-gradient(135deg, #E8E4DC 0%, #D4CFC5 100%)",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "'Cormorant Garamond', serif",
                                  fontSize: 28,
                                  fontWeight: 600,
                                  color: C.textMuted,
                                  opacity: 0.5,
                                }}
                              >
                                {name
                                  .split(" ")
                                  .map((w) => w[0])
                                  .join("")
                                  .slice(0, 3)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ padding: "16px 18px" }}>
                          <p
                            style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: 11,
                              color: C.textMuted,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              margin: "0 0 4px",
                            }}
                          >
                            {devName || mmName || ""}
                          </p>
                          <h3
                            className="ch-proj-name"
                            style={{
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: 18,
                              fontWeight: 600,
                              color: C.text,
                              lineHeight: 1.25,
                              margin: "0 0 8px",
                              transition: "color 0.15s",
                            }}
                          >
                            {name}
                          </h3>
                          {priceText && (
                            <p
                              style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 12,
                                color: C.gold,
                                fontWeight: 500,
                                margin: 0,
                              }}
                            >
                              {priceText}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Browse all button */}
              <div style={{ textAlign: "center", marginTop: 40 }}>
                <Link
                  href={buildProjectsIndexUrl(slug)}
                  className="ch-browse-btn"
                  style={{
                    display: "inline-block",
                    padding: "14px 32px",
                    borderRadius: 8,
                    background: C.bgDark,
                    color: "#fff",
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textDecoration: "none",
                  }}
                >
                  Browse all projects →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            SECTION 5 — WHY THIS CITY (bg)
        ══════════════════════════════════════════════════════════ */}
        <section style={{ background: C.bg, padding: "72px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <SectionHeading
              eyebrow={`Why ${city.city_name}`}
              title={
                slug === "hyderabad"
                  ? "The most compelling real estate case in India"
                  : isGoa
                  ? "Where lifestyle and investment converge"
                  : `What makes ${city.city_name} stand out`
              }
            />

            <div
              className="ch-why-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 24,
              }}
            >
              {whyCards.map((card, idx) => (
                <div
                  key={idx}
                  className="ch-fade"
                  style={{
                    background: C.bgCard,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    padding: 32,
                    animationDelay: `${idx * 0.1}s`,
                  }}
                >
                  <p
                    style={{
                      fontSize: 28,
                      color: C.gold,
                      marginBottom: 14,
                      lineHeight: 1,
                    }}
                  >
                    {card.icon}
                  </p>
                  <h3
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: 22,
                      fontWeight: 600,
                      color: C.text,
                      margin: "0 0 12px",
                      lineHeight: 1.25,
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 14,
                      color: C.textMuted,
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 6 — TOP DEVELOPERS (bgWarm)
        ══════════════════════════════════════════════════════════ */}
        {topDevs.length > 0 && (
          <section style={{ background: C.bgWarm, padding: "72px 24px" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  marginBottom: 40,
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <SectionHeading
                  eyebrow="Developer Intelligence"
                  title={`Leading Developers in ${city.city_name}`}
                />
                <Link
                  href="/developers"
                  className="ch-view-all"
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: C.gold,
                    textDecoration: "none",
                    flexShrink: 0,
                    paddingBottom: 40,
                  }}
                >
                  View all developers →
                </Link>
              </div>

              <div
                className="ch-dev-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: 16,
                }}
              >
                {topDevs.map((dev, idx) => (
                  <Link
                    key={dev.url_slug ?? dev.brand_name}
                    href={dev.url_slug ? `/developers/${dev.url_slug}` : "/developers"}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      className="ch-fade ch-dev-card"
                      style={{
                        background: C.bgCard,
                        border: `1px solid ${C.border}`,
                        borderRadius: 12,
                        padding: 20,
                        textAlign: "center",
                        animationDelay: `${idx * 0.06}s`,
                      }}
                    >
                      {/* Logo initials */}
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: `linear-gradient(135deg, ${C.gold}18, ${C.gold}35)`,
                          border: `1px solid ${C.gold}28`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 12px",
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: 18,
                          fontWeight: 600,
                          color: C.gold,
                        }}
                      >
                        {dev.brand_name.slice(0, 2).toUpperCase()}
                      </div>

                      {/* Name */}
                      <p
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 13,
                          fontWeight: 500,
                          color: C.text,
                          marginBottom: 4,
                          lineHeight: 1.35,
                        }}
                      >
                        {dev.brand_name.length > 18
                          ? dev.brand_name.slice(0, 18) + "…"
                          : dev.brand_name}
                      </p>

                      {/* Project count */}
                      {dev.total_projects != null && dev.total_projects > 0 && (
                        <p
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 11,
                            color: C.textMuted,
                            margin: 0,
                          }}
                        >
                          {dev.total_projects} projects
                        </p>
                      )}

                      {/* Premium badge */}
                      {dev.institutional_grade && (
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: 6,
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: 9,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            fontFamily: "'Outfit', sans-serif",
                            background: "rgba(45,106,79,0.1)",
                            color: C.accent,
                            border: "1px solid rgba(45,106,79,0.2)",
                          }}
                        >
                          Top
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            SECTION 7 — AI ADVISOR CTA (bgDark)
        ══════════════════════════════════════════════════════════ */}
        <section
          style={{
            background: C.bgDark,
            padding: "80px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: C.gold,
                marginBottom: 16,
              }}
            >
              Westside Advisor
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(26px, 3.5vw, 40px)",
                fontWeight: 600,
                color: "#fff",
                margin: "0 0 14px",
                lineHeight: 1.2,
              }}
            >
              Ask about {city.city_name} real estate
            </h2>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 16,
                color: "rgba(255,255,255,0.5)",
                margin: "0 0 36px",
                lineHeight: 1.65,
              }}
            >
              Instant answers on pricing, markets, and the best projects for your budget
            </p>

            <CityAdvisorCTA chips={advisorChips} />

            <div style={{ marginTop: 36 }}>
              <Link
                href="/contact"
                style={{
                  display: "inline-block",
                  padding: "13px 32px",
                  borderRadius: 999,
                  background: `linear-gradient(135deg, ${C.goldLight}, #A88040)`,
                  color: "#0a0a0a",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  boxShadow: "0 4px 20px rgba(176,141,87,0.25)",
                }}
              >
                Talk to an Advisor — Free
              </Link>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.2)",
                  marginTop: 14,
                }}
              >
                No obligation · RERA experts · 12+ years in {city.city_name}
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 8 — FAQs (bg)
        ══════════════════════════════════════════════════════════ */}
        {faqItems.length > 0 && (
          <section style={{ background: C.bg, padding: "72px 24px" }}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <SectionHeading
                eyebrow="Common Questions"
                title={`About ${city.city_name} Real Estate`}
              />
              <CityFaqAccordion items={faqItems} />
            </div>
          </section>
        )}

      </main>
    </>
  );
}

// Revalidate every 24 hours
export const revalidate = 86400;
