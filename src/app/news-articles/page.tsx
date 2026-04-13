import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export const metadata: Metadata = {
  title: "Real Estate News & Analysis | Westside Realty",
  description:
    "In-depth real estate analysis across India's major metros — Hyderabad, Goa, Mumbai, Bengaluru and more. Data-backed insights for buyers and investors.",
  alternates: { canonical: "https://www.westsiderealty.in/news-articles" },
};

export const revalidate = 300;

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

const CITY_LABELS: Record<string, string> = {
  hyderabad: "Hyderabad",
  goa: "Goa",
  mumbai: "Mumbai",
  delhi_ncr: "Delhi NCR",
  bengaluru: "Bengaluru",
  pune: "Pune",
  chennai: "Chennai",
  kolkata: "Kolkata",
  ahmedabad: "Ahmedabad",
  kochi: "Kochi",
  navi_mumbai_thane: "Navi Mumbai / Thane",
};

interface Article {
  id: string;
  slug: string;
  city: string;
  micro_market: string;
  seo_headline: string;
  meta_description: string;
  target_persona: string;
  published_at: string;
  body: string;
  image_url: string | null;
}

async function getPublishedArticles(): Promise<Article[]> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("generated_articles")
      .select(
        "id, slug, city, micro_market, seo_headline, meta_description, target_persona, published_at, body, image_url"
      )
      .eq("status", "published")
      .not("slug", "is", null)
      .order("published_at", { ascending: false })
      .limit(50);
    return (data ?? []) as Article[];
  } catch {
    return [];
  }
}

function estimateReadTime(body: string): string {
  const words = body.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

export default async function NewsArticlesPage() {
  const articles = await getPublishedArticles();

  return (
    <>
      <style>{`
        .article-card {
          transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s;
        }
        .article-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.10);
          border-color: rgba(176,141,87,0.3) !important;
        }
        @media (max-width: 768px) {
          .articles-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Hero */}
      <section
        style={{
          background: C.bgDark,
          position: "relative",
          overflow: "hidden",
          padding: "80px 24px 60px",
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
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: C.gold,
              margin: "0 0 12px",
            }}
          >
            Westside Realty Intelligence
          </p>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(32px,5vw,56px)",
              fontWeight: 600,
              color: "#FFFFFF",
              lineHeight: 1.15,
              margin: "0 0 16px",
            }}
          >
            Real Estate News &amp; Analysis
          </h1>
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 17,
              color: "rgba(255,255,255,0.6)",
              maxWidth: 560,
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            Data-backed market intelligence across India&apos;s major metros.
            Written for buyers, investors, and professionals.
          </p>
        </div>
      </section>

      {/* Articles grid */}
      <section style={{ background: C.bg, padding: "64px 24px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {articles.length === 0 ? (
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                color: C.textMuted,
                textAlign: "center",
                padding: "60px 0",
              }}
            >
              No articles published yet.
            </p>
          ) : (
            <div
              className="articles-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: 28,
              }}
            >
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/news-articles/${article.slug}`}
                  className="article-card"
                  style={{
                    display: "block",
                    background: C.bgCard,
                    border: `1px solid ${C.border}`,
                    borderRadius: 20,
                    overflow: "hidden",
                    textDecoration: "none",
                  }}
                >
                  {/* Hero image */}
                  {article.image_url && (
                    <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.image_url}
                        alt={article.seo_headline}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    </div>
                  )}
                  {/* City color bar */}
                  <div
                    style={{
                      height: 4,
                      background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`,
                    }}
                  />
                  <div style={{ padding: 28 }}>
                    {/* Meta row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 14,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.16em",
                          color: C.gold,
                          fontWeight: 600,
                        }}
                      >
                        {CITY_LABELS[article.city] ?? article.city}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 11,
                          color: C.textMuted,
                        }}
                      >
                        · {article.micro_market}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 11,
                          color: C.textMuted,
                        }}
                      >
                        · {estimateReadTime(article.body)}
                      </span>
                    </div>

                    {/* Headline */}
                    <h2
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: 22,
                        fontWeight: 600,
                        color: C.text,
                        lineHeight: 1.25,
                        margin: "0 0 12px",
                      }}
                    >
                      {article.seo_headline}
                    </h2>

                    {/* Description */}
                    <p
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 14,
                        color: C.textMuted,
                        lineHeight: 1.65,
                        margin: "0 0 20px",
                      }}
                    >
                      {article.meta_description.slice(0, 130)}
                      {article.meta_description.length > 130 ? "…" : ""}
                    </p>

                    {/* Footer */}
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
                        {article.published_at
                          ? new Date(article.published_at).toLocaleDateString(
                              "en-IN",
                              { year: "numeric", month: "short", day: "numeric" }
                            )
                          : ""}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 13,
                          fontWeight: 500,
                          color: C.gold,
                        }}
                      >
                        Read Article →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
